import * as XLSX from "xlsx";
import type { DashboardSite, MasterQuestion, MasterRequirement } from "../../../shared/types";

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
  questionId?: string;
  kind: "create-requirement" | "update-requirement" | "add-question" | "update-question";
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

export const importTemplateColumns = ["Section", "Sub-Section", "Requirement ID", "Requirement Text", "Question ID", "Question / How to Meet Requirement", "Evidence Requirement", "Applicable Sites", "Overall Priority", "Section Priority", "Sub-Section Priority", "Version", "Status"] as const;
type ImportTemplateColumn = (typeof importTemplateColumns)[number];
export type ImportTemplateRow = Record<ImportTemplateColumn, string> & { rowNumber: number };
const columns = importTemplateColumns;

function text(value: unknown) { return String(value ?? "").trim(); }
function idPart(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function evidence(value: string) { return value.split(/\r?\n|\|/).map((item) => item.trim()).filter(Boolean); }
function header(value: unknown) { return text(value).replace(/\s*\*$/, ""); }

function getRows(file: File): Promise<ImportTemplateRow[]> {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets["Import Template"];
    if (!sheet) throw new Error('The workbook must include an "Import Template" sheet.');
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
    const headerIndex = grid.findIndex((row) => row.map(header).includes("Requirement ID") && row.map(header).includes("Question / How to Meet Requirement"));
    if (headerIndex < 0) throw new Error("The Import Template worksheet is missing its required header row.");
    const headers = grid[headerIndex].map(header);
    const missing = columns.filter((column) => !headers.includes(column));
    if (missing.length) throw new Error(`The Import Template worksheet is missing: ${missing.join(", ")}.`);
    return grid.slice(headerIndex + 1)
      .map((row, index) => ({ ...Object.fromEntries(columns.map((column) => [column, text(row[headers.indexOf(column)])])), rowNumber: headerIndex + index + 2 }) as ImportTemplateRow)
      .filter((row) => columns.some((column) => row[column]));
  });
}

function scopedSites(value: string, sites: DashboardSite[], row: number, issues: ImportIssue[]) {
  if (!value) return [];
  const codes = value.split(",").map((item) => item.trim()).filter(Boolean);
  const ids: string[] = [];
  codes.forEach((code) => {
    const site = sites.find((item) => item.code.toLowerCase() === code.toLowerCase());
    if (!site) issues.push({ severity: "error", row, field: "Applicable Sites", message: `Unknown site code "${code}".` });
    else ids.push(site.id);
  });
  return [...new Set(ids)];
}

function cloneRequirement(requirement: MasterRequirement): MasterRequirement {
  return { ...requirement, siteIds: [...requirement.siteIds], questions: requirement.questions.map((question) => ({ ...question, expectedEvidence: [...question.expectedEvidence] })) };
}

export async function planRequirementImport(mode: RequirementImportMode, file: File, existing: MasterRequirement[], sites: DashboardSite[]): Promise<RequirementImportPlan> {
  const rows = await getRows(file);
  return planRequirementRows(mode, file.name, rows, existing, sites);
}

export function planRequirementRows(mode: RequirementImportMode, fileName: string, rows: ImportTemplateRow[], existing: MasterRequirement[], sites: DashboardSite[]): RequirementImportPlan {
  const issues: ImportIssue[] = [];
  const changes: ImportChange[] = [];
  const knownSections = new Set(existing.map((item) => item.section.toLowerCase()));
  const existingById = new Map(existing.map((item) => [item.id.toLowerCase(), item]));
  const upserts = new Map<string, MasterRequirement>();
  const seenQuestions = new Set<string>();
  let generatedRequirement = 0;
  let generatedQuestion = 0;

  rows.forEach((row) => {
    const section = row.Section;
    const title = row["Requirement Text"];
    let requirementId = row["Requirement ID"];
    if (!requirementId && mode === "new") requirementId = `REQ-${String(++generatedRequirement).padStart(3, "0")}`;
    const questionText = row["Question / How to Meet Requirement"];
    let questionId = row["Question ID"];
    if (!questionId && mode === "new" && requirementId) questionId = `${idPart(requirementId)}-q-${++generatedQuestion}`;
    const pair = `${requirementId.toLowerCase()}::${questionId.toLowerCase()}`;
    if (!requirementId) issues.push({ severity: "error", row: row.rowNumber, field: "Requirement ID", message: "Requirement ID is required for updates." });
    if (!questionId) issues.push({ severity: "error", row: row.rowNumber, field: "Question ID", message: "Question ID is required for updates." });
    if (!section) issues.push({ severity: "error", row: row.rowNumber, field: "Section", message: "Section is required." });
    else if (knownSections.size && !knownSections.has(section.toLowerCase())) issues.push({ severity: "error", row: row.rowNumber, field: "Section", message: `Unknown section "${section}".` });
    if (!questionText && mode === "new") issues.push({ severity: "error", row: row.rowNumber, field: "Question / How to Meet Requirement", message: "Question text is required for a new requirement." });
    if (seenQuestions.has(pair)) issues.push({ severity: "error", row: row.rowNumber, field: "Question ID", message: `Duplicate requirement/question ID pair "${requirementId} / ${questionId}" in this workbook.` });
    seenQuestions.add(pair);
    const siteIds = scopedSites(row["Applicable Sites"], sites, row.rowNumber, issues);
    const existingRequirement = existingById.get(requirementId.toLowerCase());

    if (mode === "new") {
      if (existingRequirement) { issues.push({ severity: "error", row: row.rowNumber, field: "Requirement ID", message: `Requirement "${requirementId}" already exists. Use Update requirements.` }); return; }
      const draft = upserts.get(requirementId) ?? { id: requirementId, title, section, status: "Draft" as const, siteIds, version: row["Version"] || "1", questions: [] };
      if (draft.title && title && draft.title !== title) issues.push({ severity: "error", row: row.rowNumber, field: "Requirement Text", message: "Rows sharing a Requirement ID must use the same requirement text." });
      if (!upserts.has(requirementId)) changes.push({ requirementId, kind: "create-requirement", field: "Requirement", after: title });
      const question: MasterQuestion = { id: questionId, number: String(draft.questions.length + 1), text: questionText, expectedEvidence: evidence(row["Evidence Requirement"]), evidenceRequired: evidence(row["Evidence Requirement"]).length > 0 };
      draft.questions.push(question); upserts.set(requirementId, draft);
      return;
    }

    if (!existingRequirement) { issues.push({ severity: "error", row: row.rowNumber, field: "Requirement ID", message: `Requirement "${requirementId}" does not exist. Use New requirements.` }); return; }
    const draft = upserts.get(existingRequirement.id) ?? cloneRequirement(existingRequirement);
    const question = draft.questions.find((item) => item.id.toLowerCase() === questionId.toLowerCase());
    if (!question) {
      const added: MasterQuestion = { id: questionId, number: String(draft.questions.length + 1), text: questionText, expectedEvidence: evidence(row["Evidence Requirement"]), evidenceRequired: evidence(row["Evidence Requirement"]).length > 0 };
      if (!questionText) issues.push({ severity: "error", row: row.rowNumber, field: "Question / How to Meet Requirement", message: "Text is required for an added question." });
      draft.questions.push(added); changes.push({ requirementId: draft.id, questionId, kind: "add-question", field: "Question", after: questionText });
    } else {
      const updateQuestion = (field: "text" | "expectedEvidence", label: string, value: string | string[]) => {
        const next = Array.isArray(value) ? value.join("\n") : value;
        const before = Array.isArray(question[field]) ? (question[field] as string[]).join("\n") : question[field] as string;
        if (next && next !== before) { (question as unknown as Record<string, unknown>)[field] = Array.isArray(value) ? value : value; changes.push({ requirementId: draft.id, questionId: question.id, kind: "update-question", field: label, before, after: next }); }
      };
      updateQuestion("text", "Question text", questionText);
      const evidenceValue = evidence(row["Evidence Requirement"]); if (evidenceValue.length) updateQuestion("expectedEvidence", "Evidence requirement", evidenceValue);
    }
    if (title && title !== draft.title) { changes.push({ requirementId: draft.id, kind: "update-requirement", field: "Requirement text", before: draft.title, after: title }); draft.title = title; }
    if (section && section !== draft.section) { changes.push({ requirementId: draft.id, kind: "update-requirement", field: "Section", before: draft.section, after: section }); draft.section = section; }
    const rowVersion = row["Version"]; if (rowVersion && rowVersion !== draft.version) { changes.push({ requirementId: draft.id, kind: "update-requirement", field: "Version", before: draft.version ?? "1", after: rowVersion }); draft.version = rowVersion; }
    const scope = row["Applicable Sites"]; if (scope || !row["Applicable Sites"]) { const before = draft.siteIds.join(","); const after = siteIds.join(","); if (before !== after) { changes.push({ requirementId: draft.id, kind: "update-requirement", field: "Applicable Sites", before, after: after || "All sites" }); draft.siteIds = siteIds; } }
    draft.status = "Draft"; upserts.set(draft.id, draft);
  });

  const valid = !issues.some((issue) => issue.severity === "error");
  const planned = valid ? [...upserts.values()] : [];
  const created = changes.filter((change) => change.kind === "create-requirement").length;
  const updated = new Set(changes.filter((change) => change.kind === "update-requirement" || change.kind === "update-question").map((change) => change.requirementId)).size;
  const addedQuestions = changes.filter((change) => change.kind === "add-question").length;
  return { mode, fileName, sourceRows: rows.length, issues, changes, upserts: planned, created, updated, addedQuestions, unchanged: Math.max(0, existing.length - updated), rows };
}
