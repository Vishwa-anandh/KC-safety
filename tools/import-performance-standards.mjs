/**
 * Converts the KC "Operating Model Levels / Performance Standards" workbook export
 * (markdown tables, one sheet per standard) into the app's Requirement/SectionSummary shape.
 *
 * Usage:
 *   node tools/import-performance-standards.mjs <path-to-md> [--out src/data/performance-standards.ts]
 *   node tools/import-performance-standards.mjs <path-to-md> --report   (data-quality report only)
 *
 * Source shape (per standard sheet):
 *   row 0        title, repeated across columns (merged cell in the original workbook)
 *   row 1        blank
 *   row 2        column headers: Mandatory Control Requirement | How to Meet | Evidence Requirements
 *   rows 3..n    either a subsection header (all cells identical) or a requirement (3 distinct cells)
 *
 * Mapping decision: each mandatory-control row becomes ONE Requirement carrying ONE assessment
 * question. The workbook has no sub-questions — the Conformance Checklist assesses each control
 * with a single No/Partial/Yes "Measure" — so a 1:1 row-to-question mapping is faithful to the
 * source. Subsection headers become the `subsection` field on the requirements that follow them.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const SKIP_SHEETS = new Set(["Sheet1", "Template-Example", "Conformance Checklist", "Sheet10"]);
const STANDARD_RE = /^(OSHPS|OHPS|CAPS)\s*(\d+)$/i;

function parseSheets(markdown) {
  const sheets = [];
  let current = null;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^### (.+)$/);
    if (heading) {
      current = { name: heading[1].trim(), rows: [] };
      sheets.push(current);
      continue;
    }
    if (!current || !line.startsWith("|")) continue;
    const body = line.slice(1, line.endsWith("|") ? -1 : undefined);
    current.rows.push(body.split("|").map((cell) => cell.trim()));
  }
  return sheets;
}

const isSeparator = (cells) => cells.every((cell) => /^-+$/.test(cell));
const isBlank = (cells) => cells.every((cell) => cell === "");
const isMerged = (cells) => cells.length > 1 && cells[0] !== "" && cells.every((cell) => cell === cells[0]);

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Splits a workbook cell into clean list items: <br> is the separator, bullet glyphs are noise.
 * Leading ">" runs are outline-depth markers (OSHPS 17 uses them) and are stripped for display.
 */
function toList(cell) {
  if (!cell) return [];
  return cell
    .replace(/^\s*>+\s*/, "")
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/^[\s ]*[•·o▪-]\s*/u, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** Requirement text keeps its internal structure, but loses the leading bullet and hard breaks. */
function toText(cell) {
  return toList(cell).join(" ");
}

function buildStandard(sheet) {
  const rows = sheet.rows.filter((cells) => !isSeparator(cells) && !isBlank(cells));
  if (!rows.length) return null;

  const rawTitle = isMerged(rows[0]) ? rows[0][0] : rows[0][0];
  const title = rawTitle.replace(/\s*Performance Standard\s*$/i, "").trim();
  const [, family, indexText] = sheet.name.match(STANDARD_RE) ?? [];
  const name = title.replace(/^(OSHPS|OHPS|CAPS)\s*\d+\s*:\s*/i, "").trim();

  const headerIndex = rows.findIndex((cells) => /Mandatory Control Requirement/i.test(cells[0]));
  const dataRows = rows.slice(headerIndex + 1);

  const sectionId = slug(`${family}-${indexText}-${name}`);
  const requirements = [];
  const warnings = [];
  let subsection = "";
  let ordinal = 0;
  let continuations = 0;

  for (const cells of dataRows) {
    if (isMerged(cells)) {
      subsection = toText(cells[0]);
      continue;
    }
    const requirementText = toText(cells[0]);

    // A row with no control text but populated guidance/evidence is a continuation of the row
    // above it in the original workbook (e.g. OSHPS 17 "Glove: ANSI A6" then "Sleeve: ANSI A5").
    // Fold it into the previous requirement rather than dropping real control content.
    if (!requirementText) {
      const previous = requirements[requirements.length - 1];
      if (!previous) continue;
      previous.guidance.push(...toList(cells[1]));
      previous.expectedEvidence.push(...toList(cells[2]));
      continuations += 1;
      continue;
    }

    ordinal += 1;
    const guidance = toList(cells[1]);
    const expectedEvidence = toList(cells[2]);
    const number = `${family.toUpperCase()} ${indexText}.${ordinal}`;

    requirements.push({
      id: `${sectionId}-${ordinal}`,
      number,
      // The control text doubles as the requirement title; trim to something displayable.
      title: requirementText.length > 110 ? `${requirementText.slice(0, 107).trimEnd()}…` : requirementText,
      sectionId,
      sectionName: name,
      subsection,
      requirementText,
      guidance,
      expectedEvidence,
      questions: [
        {
          id: `${sectionId}-${ordinal}-q1`,
          number: "1",
          text: requirementText,
          response: null,
        },
      ],
      evidence: [],
      // Only OSHPS 19 carries a 4th column ("Templates, Tools, Related Links"). Preserve it
      // rather than dropping content the source considered part of the standard.
      ...(cells.length > 3 && cells.slice(3).some(Boolean)
        ? { relatedLinks: cells.slice(3).flatMap(toList).filter(Boolean) }
        : {}),
    });
  }

  // Completeness is judged after continuation rows have been folded in, so a requirement whose
  // guidance arrives on a following row is not falsely reported as incomplete.
  for (const requirement of requirements) {
    if (!requirement.guidance.length) warnings.push({ number: requirement.number, field: "How to Meet Requirement" });
    if (!requirement.expectedEvidence.length) warnings.push({ number: requirement.number, field: "Evidence Requirements" });
  }

  return {
    section: {
      id: sectionId,
      shortName: name.length > 26 ? `${name.slice(0, 25).trimEnd()}…` : name,
      name,
      description: `${family.toUpperCase()} ${indexText} mandatory control requirements.`,
      completion: 0,
      performance: "not-assessed",
      questions: requirements.length,
      gaps: 0,
      kind: "performance-standard",
    },
    requirements,
    warnings,
    continuations,
    family: family.toUpperCase(),
  };
}

function main() {
  const [, , sourceArg, ...rest] = process.argv;
  if (!sourceArg) {
    console.error("Usage: node tools/import-performance-standards.mjs <path-to-md> [--out <file>] [--report]");
    process.exit(1);
  }
  const reportOnly = rest.includes("--report");
  const outIndex = rest.indexOf("--out");
  const outPath = outIndex >= 0 ? rest[outIndex + 1] : "src/data/performance-standards.ts";

  const sheets = parseSheets(readFileSync(resolve(sourceArg), "utf8"));
  const standards = [];
  const skipped = [];

  for (const sheet of sheets) {
    if (SKIP_SHEETS.has(sheet.name) || !STANDARD_RE.test(sheet.name)) continue;
    const built = buildStandard(sheet);
    if (!built || !built.requirements.length) {
      skipped.push(sheet.name);
      continue;
    }
    standards.push(built);
  }

  const sections = standards.map((s) => s.section);
  const requirements = standards.flatMap((s) => s.requirements);
  const warnings = standards.flatMap((s) => s.warnings.map((w) => ({ ...w, sheet: s.section.name })));

  console.log(`Parsed ${standards.length} standards, ${requirements.length} requirements.`);
  for (const family of ["OSHPS", "OHPS", "CAPS"]) {
    const group = standards.filter((s) => s.family === family);
    console.log(`  ${family}: ${group.length} standards, ${group.reduce((n, s) => n + s.requirements.length, 0)} requirements`);
  }
  if (skipped.length) console.log(`Skipped (no requirement rows): ${skipped.join(", ")}`);
  const continuations = standards.reduce((n, s) => n + s.continuations, 0);
  if (continuations) console.log(`Continuation rows folded into the requirement above: ${continuations}`);
  console.log(`Incomplete cells: ${warnings.length}`);
  for (const w of warnings) console.log(`  ${w.number.padEnd(12)} missing ${w.field}  (${w.sheet})`);

  if (reportOnly) return;

  const banner = `// GENERATED FILE — do not edit by hand.\n` +
    `// Source: Operating Model Levels / Performance Standards workbook export.\n` +
    `// Regenerate: node tools/import-performance-standards.mjs <path-to-md>\n` +
    `// ${standards.length} standards, ${requirements.length} requirements, ${warnings.length} incomplete cells.\n\n`;

  const body =
    `import type { Requirement, SectionSummary } from "../types";\n\n` +
    `/** OSHPS 19 is the only standard with a 4th "Templates, Tools, Related Links" column. */\n` +
    `export type ImportedRequirement = Requirement & { relatedLinks?: string[] };\n\n` +
    `export const performanceStandardSections: SectionSummary[] = ${JSON.stringify(sections, null, 2)};\n\n` +
    `export const performanceStandardRequirements: ImportedRequirement[] = ${JSON.stringify(requirements, null, 2)};\n`;

  const target = resolve(outPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, banner + body, "utf8");
  console.log(`\nWrote ${target}`);
}

main();
