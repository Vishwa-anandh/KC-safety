import * as XLSX from "xlsx";
import type { MasterRequirement } from "../../../shared/types";

export type RequirementImportMode = "new" | "update";
export type ImportIssueSeverity = "error" | "warning";

export interface ImportIssue {
  severity: ImportIssueSeverity;
  row: number;
  field?: string;
  message: string;
}

export interface ImportChange {
  requirementId: string;
  kind: "create-requirement" | "update-requirement" | "add-question";
  field: string;
  before?: string;
  after?: string;
}

export interface RequirementImportPlan {
  mode: RequirementImportMode;
  fileName: string;
  sourceRows: number;
  issues: ImportIssue[];
  changes: ImportChange[];
  upserts: MasterRequirement[];
  created: number;
  updated: number;
  addedQuestions: number;
  unchanged: number;
  rows: ImportTemplateRow[];
}

// The workbook can carry two sheets: "Import Template" for Operating System content (a
// "Section Priority" rank within its section plus an "Overall Priority" rank across the whole
// batch, both per requirement-question) and "Import Template PS" for Performance Standards
// content (a single "Priority" rank within its standard). Both shapes land in the same columns —
// a PS sheet's "Priority" reads into "Section Priority", and its "Overall Priority" stays blank.
export const importTemplateColumns = ["Section", "Sub-Section", "Requirement ID", "Requirement Text", "Question ID", "How to Meet Requirement", "Evidence Requirement", "Section Priority", "Overall Priority"] as const;
type ImportTemplateColumn = (typeof importTemplateColumns)[number];
export type ImportTemplateRow = Record<ImportTemplateColumn, string> & { rowNumber: number; sheet: string };
const columns = importTemplateColumns;

const dataSheets = [
  { name: "Import Template", priorityColumns: ["Section Priority", "Overall Priority"] as const },
  { name: "Import Template PS", priorityColumns: ["Priority"] as const },
];
// PS row numbers are offset well clear of anything "Import Template" could contain, so a review
// issue's row number still uniquely identifies one row across both sheets.
const psRowNumberOffset = 100000;

function text(value: unknown) { return String(value ?? "").trim(); }
function idPart(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
// Source cells often pack several numbered ("1. ...") or bulleted ("• ...") lines into one cell.
// splitLines keeps one array entry per line — used for evidence (each line becomes its own bullet
// in the UI) and for "How to Meet Requirement" (its first line is the question, the rest are
// guidance steps) — so the source's own numbering is stripped to avoid a doubled-up "1. •" look.
function splitLines(value: string) { return value.split(/\r\n|\r|\n/).map((line) => line.trim().replace(/^(\d+[.)]|[•\-*])\s*/, "")).filter(Boolean); }
function header(value: unknown) { return text(value).replace(/\s*\*$/, ""); }
function toPositiveInt(value: string): number | undefined {
  const parsed = Number(value);
  return value && Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function readSheetRows(workbook: XLSX.WorkBook, sheetName: string, priorityColumns: readonly string[], rowNumberOffset: number): ImportTemplateRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  const headerIndex = grid.findIndex((row) => row.map(header).includes("Requirement ID") && row.map(header).includes("How to Meet Requirement"));
  if (headerIndex < 0) throw new Error(`The "${sheetName}" worksheet is missing its required header row.`);
  const headers = grid[headerIndex].map(header);
  const sharedColumns = columns.filter((column) => !(["Section Priority", "Overall Priority"] as string[]).includes(column));
  const missing = [...sharedColumns, ...priorityColumns].filter((column) => !headers.includes(column));
  if (missing.length) throw new Error(`The "${sheetName}" worksheet is missing: ${missing.join(", ")}.`);
  return grid.slice(headerIndex + 1)
    .map((row, index) => {
      const base = Object.fromEntries(sharedColumns.map((column) => [column, text(row[headers.indexOf(column)])])) as Record<string, string>;
      base["Section Priority"] = text(row[headers.indexOf(priorityColumns[0])]);
      base["Overall Priority"] = priorityColumns[1] ? text(row[headers.indexOf(priorityColumns[1])]) : "";
      return { ...base, rowNumber: rowNumberOffset + headerIndex + index + 2, sheet: sheetName } as ImportTemplateRow;
    })
    .filter((row) => columns.some((column) => row[column]));
}

function getRows(file: File): Promise<ImportTemplateRow[]> {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const rows = dataSheets.flatMap((sheet, index) => readSheetRows(workbook, sheet.name, sheet.priorityColumns, index === 0 ? 0 : psRowNumberOffset));
    if (!rows.length && !dataSheets.some((sheet) => workbook.Sheets[sheet.name])) {
      throw new Error('The workbook must include an "Import Template" sheet (optionally with an "Import Template PS" sheet for Performance Standards).');
    }
    return rows;
  });
}

export async function planRequirementImport(mode: RequirementImportMode, file: File, existing: MasterRequirement[], siteIds: string[]): Promise<RequirementImportPlan> {
  const rows = await getRows(file);
  return planRequirementRows(mode, file.name, rows, existing, siteIds);
}

// A master requirement IS a single question — one workbook row makes one MasterRequirement,
// identified by its Question ID. "Requirement ID" is kept only as a grouping label (several rows
// share one, e.g. every question under "LET-01"), used here to check they all repeat the same
// Requirement Text and to number them in sequence, not to merge them into one record.
//
// Site scope is no longer a per-row workbook column — the whole batch shares one scope, chosen
// in the wizard's Site selection step (empty siteIds means "all sites"). Section and Sub-Section
// are free text — not validated against a curated list — since Performance Standards content
// uses section codes (e.g. "OSHPS 1: Fire & Explosion") that don't fit a small fixed list.
export function planRequirementRows(mode: RequirementImportMode, fileName: string, rows: ImportTemplateRow[], existing: MasterRequirement[], siteIds: string[]): RequirementImportPlan {
  const issues: ImportIssue[] = [];
  const changes: ImportChange[] = [];
  const existingById = new Map(existing.map((item) => [item.id.toLowerCase(), item]));
  const existingRequirementIds = new Set(existing.map((item) => item.requirementId.toLowerCase()));
  const upserts = new Map<string, MasterRequirement>();
  const seenIds = new Set<string>();
  const requirementTitles = new Map<string, string>();
  const requirementSequence = new Map<string, number>();
  let generatedId = 0;

  // Priorities are dense rankings, not free-standing numbers: Section Priority ranks a question
  // within its own section (1..however many questions that section has in this batch) and Overall
  // Priority ranks it across the whole batch (1..rows.length) — so the valid range and duplicate
  // checks below are both derived from the batch itself, not a fixed number.
  const sectionQuestionCounts = new Map<string, number>();
  rows.forEach((row) => { const key = row.Section.toLowerCase(); sectionQuestionCounts.set(key, (sectionQuestionCounts.get(key) ?? 0) + 1); });
  // Only rows that actually carry an Overall Priority compete for that ranking — Performance
  // Standards rows don't have one at all, so they shouldn't shrink or pad out the valid range.
  const overallQuestionCount = rows.filter((row) => row["Overall Priority"]).length;
  const seenSectionPriorities = new Map<string, Set<number>>();
  const seenOverallPriorities = new Set<number>();

  rows.forEach((row) => {
    const section = row.Section;
    const subsection = row["Sub-Section"];
    const title = row["Requirement Text"];
    const sectionPriority = toPositiveInt(row["Section Priority"]);
    const overallPriority = toPositiveInt(row["Overall Priority"]);
    const requirementId = row["Requirement ID"];
    // "How to Meet Requirement" carries both the question and its guidance in one cell: the first
    // line is the question posed to site users, and any further lines are "how to meet it" steps
    // shown under the question. Requirement Text can't supply the question on its own — it's a
    // shared group label (validated below to repeat identically across sibling rows), so every
    // question under one Requirement ID would read the same otherwise.
    const howToMeetLines = splitLines(row["How to Meet Requirement"]);
    const questionText = howToMeetLines[0] ?? "";
    const guidanceLines = howToMeetLines.slice(1);
    let questionId = row["Question ID"];
    if (!questionId && mode === "new" && requirementId) questionId = `${idPart(requirementId)}-q-${++generatedId}`;

    if (!requirementId) issues.push({ severity: "error", row: row.rowNumber, field: "Requirement ID", message: "Requirement ID is required." });
    if (!questionId) issues.push({ severity: "error", row: row.rowNumber, field: "Question ID", message: "Question ID is required." });
    if (!section) issues.push({ severity: "error", row: row.rowNumber, field: "Section", message: "Section is required." });
    // Sub-Section is a warning, not a blocking error — the Performance Standards source content
    // largely doesn't have one yet, and a batch shouldn't be unimportable while that's cleaned up.
    if (!subsection) issues.push({ severity: "warning", row: row.rowNumber, field: "Sub-Section", message: "Sub-Section is blank." });
    const sectionQuestionCount = sectionQuestionCounts.get(section.toLowerCase()) ?? 0;
    if (!row["Section Priority"]) issues.push({ severity: "error", row: row.rowNumber, field: "Section Priority", message: "Priority is required." });
    else if (sectionPriority === undefined) issues.push({ severity: "error", row: row.rowNumber, field: "Section Priority", message: `Priority "${row["Section Priority"]}" must be a positive whole number (1 = highest).` });
    else if (sectionPriority > sectionQuestionCount) issues.push({ severity: "error", row: row.rowNumber, field: "Section Priority", message: `Section Priority ${sectionPriority} is out of range — "${section}" has ${sectionQuestionCount} question${sectionQuestionCount === 1 ? "" : "s"} in this batch, so it should rank 1-${sectionQuestionCount}.` });
    else {
      const seenForSection = seenSectionPriorities.get(section.toLowerCase()) ?? new Set<number>();
      if (seenForSection.has(sectionPriority)) issues.push({ severity: "error", row: row.rowNumber, field: "Section Priority", message: `Section Priority ${sectionPriority} is already used by another question in "${section}".` });
      seenForSection.add(sectionPriority);
      seenSectionPriorities.set(section.toLowerCase(), seenForSection);
    }
    if (row["Overall Priority"] && overallPriority === undefined) issues.push({ severity: "error", row: row.rowNumber, field: "Overall Priority", message: `Overall Priority "${row["Overall Priority"]}" must be a positive whole number (1 = highest).` });
    else if (overallPriority !== undefined && overallPriority > overallQuestionCount) issues.push({ severity: "error", row: row.rowNumber, field: "Overall Priority", message: `Overall Priority ${overallPriority} is out of range — this batch has ${overallQuestionCount} rows, so it should rank 1-${overallQuestionCount}.` });
    else if (overallPriority !== undefined) {
      if (seenOverallPriorities.has(overallPriority)) issues.push({ severity: "error", row: row.rowNumber, field: "Overall Priority", message: `Overall Priority ${overallPriority} is already used by another question in this batch.` });
      seenOverallPriorities.add(overallPriority);
    }
    if (!questionText && mode === "new") issues.push({ severity: "error", row: row.rowNumber, field: "How to Meet Requirement", message: "Question text is required for a new requirement." });
    if (questionId) {
      const key = questionId.toLowerCase();
      if (seenIds.has(key)) issues.push({ severity: "error", row: row.rowNumber, field: "Question ID", message: `Duplicate Question ID "${questionId}" in this workbook.` });
      seenIds.add(key);
    }
    if (requirementId && title) {
      const key = requirementId.toLowerCase();
      const seenTitle = requirementTitles.get(key);
      if (seenTitle === undefined) requirementTitles.set(key, title);
      else if (seenTitle !== title) issues.push({ severity: "error", row: row.rowNumber, field: "Requirement Text", message: "Rows sharing a Requirement ID must use the same requirement text." });
    }
    const nextNumber = (requirementSequence.get(requirementId.toLowerCase()) ?? 0) + 1;
    requirementSequence.set(requirementId.toLowerCase(), nextNumber);

    const evidenceItems = splitLines(row["Evidence Requirement"]);
    const existingRequirement = questionId ? existingById.get(questionId.toLowerCase()) : undefined;

    if (mode === "new") {
      if (existingRequirement) { issues.push({ severity: "error", row: row.rowNumber, field: "Question ID", message: `Question "${questionId}" already exists. Use Update requirements.` }); return; }
      const created: MasterRequirement = {
        id: questionId, requirementId, number: String(nextNumber), title, text: questionText, guidance: guidanceLines, section, subsection,
        status: "Draft", siteIds, expectedEvidence: evidenceItems, evidenceRequired: evidenceItems.length > 0, sectionPriority, overallPriority,
      };
      upserts.set(questionId, created);
      changes.push({ requirementId, kind: existingRequirementIds.has(requirementId.toLowerCase()) ? "add-question" : "create-requirement", field: "Requirement", after: title });
      return;
    }

    if (!existingRequirement) { issues.push({ severity: "error", row: row.rowNumber, field: "Requirement ID", message: `Requirement "${requirementId}" does not exist. Use New requirements.` }); return; }
    const draft = upserts.get(existingRequirement.id) ?? { ...existingRequirement, siteIds: [...existingRequirement.siteIds], expectedEvidence: [...existingRequirement.expectedEvidence], guidance: [...(existingRequirement.guidance ?? [])] };
    if (questionText && questionText !== draft.text) { changes.push({ requirementId: draft.requirementId, kind: "update-requirement", field: "Question text", before: draft.text, after: questionText }); draft.text = questionText; }
    if (guidanceLines.length) {
      const before = (draft.guidance ?? []).join("\n");
      const after = guidanceLines.join("\n");
      if (before !== after) { changes.push({ requirementId: draft.requirementId, kind: "update-requirement", field: "How to meet requirement", before, after }); draft.guidance = guidanceLines; }
    }
    if (evidenceItems.length) {
      const before = draft.expectedEvidence.join("\n");
      const after = evidenceItems.join("\n");
      if (before !== after) { changes.push({ requirementId: draft.requirementId, kind: "update-requirement", field: "Evidence requirement", before, after }); draft.expectedEvidence = evidenceItems; draft.evidenceRequired = true; }
    }
    if (sectionPriority !== undefined && sectionPriority !== draft.sectionPriority) { changes.push({ requirementId: draft.requirementId, kind: "update-requirement", field: "Section priority", before: draft.sectionPriority?.toString() ?? "", after: String(sectionPriority) }); draft.sectionPriority = sectionPriority; }
    if (overallPriority !== undefined && overallPriority !== draft.overallPriority) { changes.push({ requirementId: draft.requirementId, kind: "update-requirement", field: "Overall priority", before: draft.overallPriority?.toString() ?? "", after: String(overallPriority) }); draft.overallPriority = overallPriority; }
    if (title && title !== draft.title) { changes.push({ requirementId: draft.requirementId, kind: "update-requirement", field: "Requirement text", before: draft.title, after: title }); draft.title = title; }
    if (section && section !== draft.section) { changes.push({ requirementId: draft.requirementId, kind: "update-requirement", field: "Section", before: draft.section, after: section }); draft.section = section; }
    if (subsection && subsection !== draft.subsection) { changes.push({ requirementId: draft.requirementId, kind: "update-requirement", field: "Sub-Section", before: draft.subsection, after: subsection }); draft.subsection = subsection; }
    const beforeScope = draft.siteIds.join(","); const afterScope = siteIds.join(",");
    if (beforeScope !== afterScope) { changes.push({ requirementId: draft.requirementId, kind: "update-requirement", field: "Applicable sites", before: beforeScope || "All sites", after: afterScope || "All sites" }); draft.siteIds = siteIds; }
    draft.status = "Draft"; upserts.set(draft.id, draft);
  });

  const valid = !issues.some((issue) => issue.severity === "error");
  const planned = valid ? [...upserts.values()] : [];
  const created = changes.filter((change) => change.kind === "create-requirement").length;
  const updated = new Set(changes.filter((change) => change.kind === "update-requirement" || change.kind === "add-question").map((change) => change.requirementId)).size;
  const addedQuestions = changes.filter((change) => change.kind === "add-question").length;
  return { mode, fileName, sourceRows: rows.length, issues, changes, upserts: planned, created, updated, addedQuestions, unchanged: Math.max(0, existing.length - updated), rows };
}
