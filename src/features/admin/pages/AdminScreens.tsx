import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Copy,
  ChevronDown,
  Download,
  FileInput,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Layers,
  ListChecks,
  ListTree,
  MapPin,
  Rows3,
  MoreHorizontal,
  Menu,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Target,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAdministration } from "../model/useAdministration";
import { importTemplateColumns, planRequirementImport, planRequirementRows, type ImportTemplateRow, type RequirementImportMode, type RequirementImportPlan } from "../model/importWorkbook";
import { assetBaseUrl } from "../../../app/config/environment";
import type { ImportHistoryRecord } from "../../../data-access/contracts";

import type { DashboardSite, MasterQuestion, MasterRequirement, RequirementAuditAction, RequirementAuditChange, RequirementAuditTarget, SiteUser, SiteUserRole } from "../../../shared/types";
import { Button, CheckboxList, ConfirmDialog, EmptyState, eyebrowClasses, IconButton, InlineMessage, MetricCard, PageHeader, ProgressBar, Select } from "../../../shared/ui/UI";
import { ContactsPanel, OwnersPanel } from "../../sites/components/SitePanels";
import { cx } from "../../../shared/utils";

const importSteps = ["Choose flow", "Upload", "Review changes", "Site selection", "Publish"];

// ---------------------------------------------------------------------------------------------
// Canonical class recipes shared across this file's screens. Each mirrors a pattern duplicated
// verbatim across admin screens (and, for data tables and pills, the same recipe used in
// src/features/sites/components/SitePanels.tsx and src/shared/ui/UI.tsx) — every occurrence uses
// the same constant so the screens don't drift apart.
// ---------------------------------------------------------------------------------------------

const breadcrumbsClass = "breadcrumbs mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400";
const breadcrumbsLinkClass = "font-semibold text-kc-blue-700 dark:text-kc-blue-300";

const tableCardClass = "table-card mt-5 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";
/** "Results" header: title + count, vertically centered once the row goes horizontal. */
const tableCardHeaderClass = "table-card__header flex flex-col items-start justify-between gap-4 border-b border-slate-200 p-4 md:flex-row md:items-center dark:border-slate-700";
/** Plain header (e.g. a per-section heading with no trailing count): top-aligned instead. */
const tableCardHeaderStartClass = "table-card__header flex flex-col items-start justify-between gap-4 border-b border-slate-200 p-4 md:flex-row md:items-start dark:border-slate-700";
const tableCardHeaderTitleClass = "mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100";
const tableCardHeaderCountClass = "text-sm text-slate-500 dark:text-slate-400";

const dashboardFilterBarClass = "dashboard-filter-bar m-0 flex flex-col flex-wrap items-stretch gap-3 border-b border-slate-200 p-3.5 md:flex-row shell:items-center dark:border-slate-700";
const searchControlClass = "search-control flex min-h-10 w-full min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-slate-500 focus-within:border-kc-blue-600 focus-within:ring-3 focus-within:ring-kc-blue-100 md:w-auto md:min-w-64 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:focus-within:ring-kc-blue-900";
const searchControlInputClass = "min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-sm text-slate-900 shadow-none outline-none dark:text-slate-100";

const metricsGridClass = "metrics-grid mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 wide:grid-cols-4";

/** Canonical tinted pill recipe (see shared/ui/UI.tsx pillBase/pillTone). Duplicated here because
 * these badges carry admin-specific labels rather than the shared PerformanceBadge/CompletionBadge. */
const pillBaseClass = "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold whitespace-nowrap";
const pillTone = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  neutral: "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
  brand: "border-kc-blue-200 bg-kc-blue-50 text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200",
  provisional: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
};
const publishBadgeClass = cx("publish-badge", pillBaseClass);

/**
 * Canonical data-table recipe (see SitePanels.tsx): a real table from `shell` (1100px) up, a
 * stacked label/value card layout below it. `data-label` stays on every cell for the tests and
 * screenshot harness that query it; the visible label span repeats it, hidden again at `shell:`.
 */
const dataTableWrapClass = "data-table-wrap w-full max-w-full";
const dataTableClass = "data-table block w-full min-w-0 table-fixed border-collapse text-sm text-slate-900 dark:text-slate-100 shell:table";
const dataTableHeadClass = "block sr-only shell:not-sr-only shell:table-header-group";
const dataTableHeaderCellClass = "border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400";
const dataTableBodyClass = "grid w-full min-w-0 grid-cols-1 gap-3 p-3.5 md:grid-cols-2 shell:table-row-group shell:p-0";
const dataTableRowClass = "block w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-900 shell:table-row shell:rounded-none shell:border-0 shell:bg-transparent shell:shadow-none";
/** Whole-row link (e.g. a site or requirement row that navigates on click). */
const dataTableRowLinkClass = "data-table__row--link cursor-pointer hover:bg-kc-blue-50 dark:hover:bg-kc-blue-950 shell:hover:bg-kc-blue-50 dark:shell:hover:bg-kc-blue-950";
const dataTableCellClass = "flex min-h-12 w-full min-w-0 items-center gap-3 border-b border-slate-200 px-3.5 py-3 text-left align-middle wrap-anywhere dark:border-slate-700 shell:table-cell shell:min-h-0 shell:px-4";
/** Last cell of each stacked card: right-aligned actions, its own footer tint. */
const dataTableLastCellClass = "flex min-h-11 w-full min-w-0 items-center justify-end bg-slate-50 px-3.5 py-3 text-left align-middle wrap-anywhere border-slate-200 dark:border-slate-700 dark:bg-slate-900 shell:table-cell shell:min-h-0 shell:justify-start shell:bg-transparent shell:px-4";
const dataTableCellLabelClass = "w-29 flex-none text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 shell:hidden";
const rowActionsClass = "row-actions flex items-center gap-0.5 justify-end shell:justify-start";
const rowMenuClass = "row-menu absolute top-full right-0 z-20 mt-1 grid w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900";
const rowMenuButtonClass = "flex items-center gap-2 border-0 border-b border-slate-100 bg-transparent px-3 py-2.5 text-left text-xs text-slate-800 last:border-b-0 hover:bg-kc-blue-50 hover:text-kc-blue-800 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-kc-blue-950 dark:hover:text-kc-blue-200";
const rowMenuDeleteButtonClass = "flex items-center gap-2 border-0 border-b border-slate-100 bg-transparent px-3 py-2.5 text-left text-xs text-red-700 last:border-b-0 hover:bg-red-50 hover:text-red-700 dark:border-slate-800 dark:text-red-300 dark:hover:bg-red-950 dark:hover:text-red-300";

/** Canonical form-field wrapper: label row, optional "Required" mark, an input/textarea styled
 * directly (Select renders its own trigger so it never needs this), and an inline error. */
const fieldClass = "field grid min-w-0 gap-1.5";
const fieldLabelRowClass = "flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300";
const fieldRequiredMarkClass = "text-xs font-bold tracking-wide text-red-700 dark:text-red-300";
const fieldInputClass = "w-full min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-kc-blue-900";
const fieldInvalidClass = "border-red-600! ring-3 ring-red-100 dark:border-red-400! dark:ring-red-950";
const fieldErrorClass = "field-error mt-1.5 block text-xs font-semibold text-red-700 dark:text-red-300";

const dialogLayerClass = "dialog-layer fixed inset-0 z-100 grid place-items-center p-4";
const dialogBackdropClass = "dialog-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-sm";
const dialogClass = "dialog relative max-h-full w-full max-w-xl overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-dialog-in dark:border-slate-700 dark:bg-slate-900";
const dialogHeaderClass = "dialog__header flex items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-700";
const dialogHeaderTitleClass = "mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100";
const dialogFormClass = "dialog-form grid grid-cols-1 gap-4 p-5 md:grid-cols-2";
const dialogFooterClass = "dialog__footer flex flex-col-reverse items-stretch gap-4 border-t border-slate-200 p-4 md:flex-row md:items-center md:justify-end dark:border-slate-700";

const linkButtonBaseClass = "inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-semibold whitespace-nowrap transition-colors";


// Sorted and grouped by region so a list that can run into the hundreds is still scannable.
// Derived from live state rather than a module constant, since sites are now editable.
function buildSiteOptions(sites: DashboardSite[]) {
  return [...sites]
    .sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name))
    .map((site) => ({ value: site.id, label: site.name, hint: site.code, group: site.region }));
}

function siteNamesFor(sites: DashboardSite[], siteIds: string[], limit = 3) {
  const names = siteIds.map((id) => sites.find((site) => site.id === id)?.name ?? id);
  if (names.length <= limit) return names.join(", ");
  return `${names.slice(0, limit).join(", ")}, and ${names.length - limit} more`;
}

function siteCodesSummary(sites: DashboardSite[], siteIds: string[]) {
  if (!siteIds.length) return { text: "All sites", title: undefined };
  const codes = siteIds.map((id) => sites.find((site) => site.id === id)?.code ?? id);
  return codes.length <= 2 ? { text: codes.join(", "), title: undefined } : { text: `${codes.length} sites`, title: codes.join(", ") };
}

/**
 * Publishing a batch is the one event that matters to people outside administration —
 * a site contributor's requirement set just changed. Shared by the preview screen and the
 * wizard's result step so both produce an identical notification.
 */
function notifyBatchPublished(
  notify: ReturnType<typeof useAdministration>["notify"],
  batch: ImportHistoryRecord,
  requirementCount: number,
  allSites: DashboardSite[],
) {
  const scope = batch.siteIds.length ? siteNamesFor(allSites, batch.siteIds) : "all sites";
  const title = `${requirementCount} requirement${requirementCount === 1 ? "" : "s"} published to ${scope}`;
  const body = `Published from ${batch.fileName}. Audit reference ${batch.id}.`;
  // Emitted once per audience because the two roles have no route in common: /admin/requirements
  // is administrator-only and /assessment is site-contributor-only. A single notification
  // carrying either link would bounce half its recipients off RequireRole to their home page.
  notify({ title, body, category: "master-data", audience: ["administrator"], link: "/admin/requirements" });
  notify({ title, body, category: "master-data", audience: ["site-contributor"], link: "/assessment" });
}

const stepItemCircleBaseClass = "relative z-10 grid size-7 place-items-center rounded-full border-2 font-extrabold md:size-8";
const stepItemCircleTone = {
  complete: "border-kc-blue-600 bg-kc-blue-600 text-white dark:border-kc-blue-500 dark:bg-kc-blue-500",
  current: "border-kc-blue-600 bg-white text-kc-blue-700 ring-3 ring-kc-blue-100 dark:border-kc-blue-400 dark:bg-slate-900 dark:text-kc-blue-300 dark:ring-kc-blue-900",
  upcoming: "border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500",
};
const stepItemLabelTone = {
  complete: "text-slate-700 dark:text-slate-300",
  current: "text-kc-blue-700 dark:text-kc-blue-300",
  upcoming: "text-slate-400 dark:text-slate-500",
};

function StepIndicator({ current }: { current: number }) {
  return <div className={cx("border-b border-slate-200 dark:border-slate-700")}><ol className={cx("step-indicator mx-auto my-0 grid w-full max-w-4xl grid-cols-5 list-none px-2 py-3.5 md:p-4")} aria-label="Import progress" data-tour="import-steps">{importSteps.map((step, index) => {
    const state = index < current ? "complete" : index === current ? "current" : "upcoming";
    return (
      <li
        className={cx(
          "step-item relative grid min-w-0 justify-items-center gap-1 text-xs md:gap-1.5 after:absolute after:top-4 after:-right-1/2 after:z-0 after:h-0.5 after:w-full last:after:hidden md:after:top-4.5",
          index < current ? "after:bg-kc-blue-600 dark:after:bg-kc-blue-500" : "after:bg-slate-200 dark:after:bg-slate-700",
          `step-item--${state}`,
        )}
        key={step}
        aria-current={state === "current" ? "step" : undefined}
      >
        <span className={cx(stepItemCircleBaseClass, stepItemCircleTone[state])}>{state === "complete" ? <Check size={15} /> : index + 1}</span>
        <strong className={cx("block max-w-full truncate", stepItemLabelTone[state])}>{step}</strong>
      </li>
    );
  })}</ol></div>;
}

function downloadTextFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["﻿", content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

function downloadStaticFile(path: string, name: string) {
  const link = document.createElement("a"); link.href = path; link.download = name; document.body.appendChild(link); link.click(); link.remove();
}

const requirementAuditActionLabels: Record<RequirementAuditAction, string> = {
  baseline: "Baseline recorded",
  created: "Requirement added",
  updated: "Requirement edited",
  deleted: "Requirement deleted",
  imported: "Requirement imported",
  published: "Requirement published",
};

const requirementAuditTargetLabels: Record<RequirementAuditTarget, string> = {
  requirement: "Requirement",
  status: "Publishing state",
  scope: "Site scope",
  question: "Questions",
  evidence: "Expected evidence",
};

function auditCsvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function requirementAuditChangeKindLabel(change: RequirementAuditChange) {
  if (change.kind === "updated") return "edited";
  if (change.kind === "deleted" && change.target !== "requirement") return "removed";
  return change.kind;
}

function requirementAuditCsv(entries: ReturnType<typeof useAdministration>["requirementAuditLog"]) {
  const header = ["Timestamp", "Actor", "Actor email", "Action", "Requirement ID", "Requirement", "Change type", "Area", "Change", "Before", "After", "Import batch"];
  const rows = entries.flatMap((entry) => entry.changes.map((change) => [
    entry.recordedAt,
    entry.recordedBy.name,
    entry.recordedBy.email,
    requirementAuditActionLabels[entry.action],
    entry.requirementId,
    entry.requirementTitle,
    requirementAuditChangeKindLabel(change),
    requirementAuditTargetLabels[change.target],
    change.label,
    change.before ?? "",
    change.after ?? "",
    entry.batchId ?? "",
  ]));
  return [header, ...rows].map((row) => row.map(auditCsvCell).join(",")).join("\r\n");
}

const historyListClass = "history-list grid gap-2.5 p-4";
const historyItemClass = "flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900";
const historyItemIconClass = "history-list__icon grid size-10 flex-none place-items-center rounded-xl bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300";
const historyItemBodyClass = "grid min-w-0 flex-1 gap-0.5";
const historyItemMetaClass = "block truncate text-xs text-slate-500 dark:text-slate-400";
const historyItemActionsClass = "history-list__actions flex flex-wrap items-center gap-2";
const questionCountClass = "question-count flex-none rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";
const questionNumberClass = "question-number grid size-8 flex-none place-items-center rounded-lg bg-kc-blue-50 text-sm font-extrabold text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200";

/** Import-wizard chrome, used once per step across AdminImportsScreen. */
const importCardClass = "import-card mt-5 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";
const importStageClass = "import-stage min-h-0 p-4 md:p-6";
const importStageHeadingClass = "import-stage__heading mb-5 flex max-w-3xl gap-3.5";
const stageIconClass = "stage-icon grid size-12 flex-none place-items-center rounded-xl bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300";
const dropzoneClass = "dropzone grid min-h-65 w-full place-content-center place-items-center gap-2 rounded-lg border-2 border-dashed border-kc-blue-300 bg-kc-blue-50 p-4 text-center text-slate-700 hover:border-kc-blue-600 hover:bg-kc-blue-100 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-slate-300 dark:hover:bg-kc-blue-900";
const selectedFileClass = "selected-file flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950";
const inspectionGridClass = "inspection-grid mb-4 grid grid-cols-1 gap-3 md:grid-cols-4";
const inspectionTileClass = "grid gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-900";
const resultStateClass = "result-state mx-auto grid max-w-160 justify-items-center py-12 text-center";
const importCardFooterClass = "import-card__footer flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 p-3.5 md:flex-row md:items-center dark:border-slate-700";

/** Off-canvas "sheet" overlay (mobile requirement navigator). Mirrors the ConfirmDialog layer
 * recipe: a fixed backdrop plus a panel, here anchored to the left edge instead of centered. */
const sheetLayerClass = "sheet-layer fixed inset-0 z-100 grid place-items-center shell:hidden";
const sheetBackdropClass = "sheet-backdrop absolute inset-0 border-0 bg-slate-950/50 backdrop-blur-sm";
const sheetClass = "sheet absolute inset-y-0 left-0 right-4 max-w-97.5 w-full overflow-x-hidden overflow-y-auto bg-white shadow-2xl dark:bg-slate-900";

const requirementMobileToolbarClass = "requirement-mobile-toolbar admin-requirement-mobile-toolbar flex sticky z-8 justify-between gap-2.5 border-b border-slate-200 p-2.5 backdrop-blur-md shell:hidden dark:border-slate-700";
// The navigator and editor deliberately use a 30/70 desktop grid. This gives long requirement
// names enough room in the navigator without making the edit canvas feel detached or oversized.
const requirementLayoutClass = "requirement-layout requirement-layout--admin-editor grid w-full min-w-0 shell:grid-cols-[minmax(18rem,3fr)_minmax(0,7fr)]";
// Hidden below `shell` (the mobile toolbar + off-canvas sheet take over there). Above that
// breakpoint the navigator starts at the top of its column; it never reserves mobile-toolbar space.
const requirementNavigatorWrapClass = "requirement-layout__navigator hidden shell:sticky shell:block shell:min-w-0 shell:w-full shell:self-start";
// Horizontal padding comes from an inline style (var(--page-gutter), a fluid clamp already
// responsive on its own — see the page-container divs elsewhere in this file for the same pattern).
const requirementMainClass = "requirement-main min-w-0 pt-4 pb-12 md:pt-6 md:pb-16";
const fieldWideWrapClass = "field field--wide grid min-w-0 gap-1.5 md:col-span-2";
const sectionTitleRowClass = "section-title-row mb-4 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between";

export function AdminImportHistoryScreen() {
  const { importHistory } = useAdministration();
  const [query, setQuery] = useState("");
  const rows = importHistory
    .map((record, index) => ({ record, isActive: index === 0 }))
    .filter(({ record }) => `${record.fileName} ${record.id} ${record.importedBy}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100")}>
      <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb"><Link className={cx(breadcrumbsLinkClass)} to="/admin/imports">Master data import</Link><ChevronRight size={15} /><span aria-current="page">Import history</span></nav>
      <PageHeader eyebrow="Administration audit" title="Import history" description="Every completed master data import, with its audit reference, result counts, and administrator." />
      <section className={cx(tableCardClass)}>
        <div className={cx(dashboardFilterBarClass)}>
          <label className={cx(searchControlClass)}><Search size={18} /><input className={cx(searchControlInputClass)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search imports" /></label>
        </div>
        <div className={cx(tableCardHeaderClass)}><div><p className={cx(eyebrowClasses)}>Audit trail</p><h2 className={cx(tableCardHeaderTitleClass)}>Completed imports</h2></div><span className={cx(tableCardHeaderCountClass)}>{rows.length} of {importHistory.length} shown</span></div>
        {rows.length ? <div className={cx(historyListClass)}>{rows.map(({ record, isActive }) => (
          <article className={cx(historyItemClass)} key={record.id}>
            <span className={cx(historyItemIconClass)}><FileSpreadsheet size={20} /></span>
            <div className={cx(historyItemBodyClass)}>
              <strong className={cx("text-slate-900 dark:text-slate-100")}>{record.fileName}</strong>
              <span className={cx(historyItemMetaClass)}>{record.id} · {new Date(record.importedAt).toLocaleString()}</span>
              <small className={cx(historyItemMetaClass)}>{record.created} created · {record.updated} updated · {record.unchanged} unchanged · by {record.importedBy}</small>
            </div>
            <span className={cx(historyItemActionsClass)}>
              {isActive && <span className={cx(publishBadgeClass, pillTone.success)}>Active</span>}
              <span className={cx(publishBadgeClass, record.publishStatus === "Draft" ? cx("publish-badge--draft", pillTone.provisional) : pillTone.success)}>{record.publishStatus}</span>
              <Link className={cx(linkButtonBaseClass, "min-h-8.5 px-2.5 py-1.5 text-sm bg-transparent text-kc-blue-700 hover:bg-kc-blue-50 hover:text-kc-blue-900 dark:text-kc-blue-300 dark:hover:bg-kc-blue-950")} to={`/admin/imports/${record.id}/preview`}>Preview</Link>
            </span>
          </article>
        ))}</div> : <EmptyState icon={<History size={28} />} title={importHistory.length ? "No imports match" : "No imports recorded"} description={importHistory.length ? "Try another file name, audit reference, or administrator." : "Completed imports will appear here with their audit reference."} />}
      </section>
    </div>
  );
}

export function AdminSitesScreen() {
  const navigate = useNavigate();
  const { masterRequirements, siteUsers, sites, regions: configRegions, segments: configSegments, addSite, updateSite, importSites, addRegion, addSegment, addSiteUser } = useAdministration();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [editing, setEditing] = useState<DashboardSite | "new" | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; title: string; body: string } | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const regions = [...new Set(sites.map((site) => site.region))];
  const rows = sites.filter((site) =>
    `${site.name} ${site.code} ${site.region} ${site.segment}`.toLowerCase().includes(query.toLowerCase()) &&
    (region === "all" || site.region === region));
  // A requirement with no site scoping applies everywhere, so it counts toward every site.
  const globalCount = masterRequirements.filter((item) => item.siteIds.length === 0).length;
  const scopedCountFor = (siteId: string) => masterRequirements.filter((item) => item.siteIds.includes(siteId)).length;
  const usersFor = (siteId: string) => siteUsers.filter((user) => user.siteId === siteId);

  return (
    <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100")}>
      <PageHeader
        eyebrow="Administration"
        title="Sites"
        description="Every site in the KC network, its assessment status, and the governed requirements scoped to it."
        actions={
          <>
            <div className={cx("inline-flex items-stretch rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800")} aria-label="Site import actions">
              <IconButton
                label="Download site import template"
                tooltipPlacement="bottom"
                className={cx("rounded-r-none border-r border-slate-300 dark:border-slate-600")}
                onClick={() => downloadStaticFile(`${assetBaseUrl}templates/Site-Import-Template.xlsx`, "EHS360 Site Import Template.xlsx")}
              >
                <Download size={18} />
              </IconButton>
              <Button variant="secondary" className={cx("rounded-l-none border-0 px-4")} icon={<Upload size={17} />} onClick={() => csvRef.current?.click()}>
                Import
              </Button>
            </div>
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => setEditing("new")}>Create site</Button>
          </>
        }
      />
      <input ref={csvRef} className={cx("sr-only")} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        const isWorkbook = file.name.toLowerCase().endsWith(".xlsx");
        const textPromise = isWorkbook
          ? file.arrayBuffer().then((buffer) => {
            const workbook = XLSX.read(buffer, { type: "array" });
            // Prefer the named "Import Template" sheet — the styled workbook (like the Master
            // Requirement template) puts Instructions first, so sheet order alone isn't reliable.
            const sheet = workbook.Sheets["Import Template"] ?? workbook.Sheets[workbook.SheetNames[0]];
            return sheet ? XLSX.utils.sheet_to_csv(sheet) : "";
          })
          : file.text();
        textPromise.then((text) => {
          const { parsed, invalid } = parseSitesCsv(text);
          if (!parsed.length) {
            setFeedback({ tone: "warning", title: "Nothing imported", body: invalid.length ? invalid.join(" ") : `No rows found. Expected columns: ${SITE_CSV_COLUMNS}.` });
            return;
          }
          const { added, skipped } = importSites(parsed.map((row) => row.site));

          // Region/Segment are free text on the site record itself, but the Config screen's
          // dropdown lists are what "Create site" offers later — register any values this
          // import introduced so they show up there too instead of only existing as raw text.
          const newRegions = new Set(parsed.map((row) => row.site.region).filter((value) => !configRegions.includes(value)));
          const newSegments = new Set(parsed.map((row) => row.site.segment).filter((value) => !configSegments.includes(value)));
          newRegions.forEach((value) => addRegion(value));
          newSegments.forEach((value) => addSegment(value));

          // Users listed against a row whose site code already existed still get attached — to
          // that existing site's real id, which may not match the freshly-slugified one we
          // computed for a brand-new row.
          const seenEmails = new Set(siteUsers.map((user) => user.email.toLowerCase()));
          let usersAdded = 0;
          const skippedUsers: string[] = [];
          parsed.forEach((row) => {
            const existingSite = sites.find((site) => site.code.toLowerCase() === row.site.code.toLowerCase());
            const targetSiteId = existingSite ? existingSite.id : row.site.id;
            row.users.forEach((user) => {
              const emailKey = user.email.toLowerCase();
              if (seenEmails.has(emailKey)) { skippedUsers.push(user.email); return; }
              seenEmails.add(emailKey);
              addSiteUser({ id: `su-${Date.now().toString(36)}-${usersAdded}`, name: user.name, email: user.email, role: "site-contributor", siteId: targetSiteId, status: "Active" });
              usersAdded += 1;
            });
          });

          const notes = [
            added ? `${added} site${added === 1 ? "" : "s"} added.` : "No new sites added.",
            skipped.length ? `Skipped ${skipped.length} existing site code${skipped.length === 1 ? "" : "s"}: ${skipped.join(", ")}.` : "",
            usersAdded ? `${usersAdded} site user${usersAdded === 1 ? "" : "s"} added.` : "",
            skippedUsers.length ? `Skipped ${skippedUsers.length} user${skippedUsers.length === 1 ? "" : "s"} with an email already in use: ${skippedUsers.join(", ")}.` : "",
            ...invalid,
          ].filter(Boolean);
          setFeedback({ tone: added || usersAdded ? "success" : "warning", title: added || usersAdded ? "Import complete" : "Import completed with no changes", body: notes.join(" ") });
        });
      }} />
      {feedback && <InlineMessage tone={feedback.tone} title={feedback.title}>{feedback.body}</InlineMessage>}
      <div className={cx(metricsGridClass)}>
        <MetricCard label="Total sites" value={sites.length} detail={`Across ${regions.length} regions`} icon={<Building2 size={21} />} tone="brand" />
        <MetricCard label="Assessment complete" value={sites.filter((site) => site.completion === 100).length} detail="Reached 100% completion" icon={<CheckCircle2 size={21} />} tone="success" />
        <MetricCard label="Not started" value={sites.filter((site) => site.completion === 0).length} detail="No assessment recorded" icon={<Circle size={21} />} tone="warning" />
        <MetricCard label="Global requirements" value={globalCount} detail="Apply to every site" icon={<FileText size={21} />} />
      </div>
      <section className={cx(tableCardClass)}>
        <div className={cx(dashboardFilterBarClass)}>
          <label className={cx(searchControlClass)}><Search size={18} /><input className={cx(searchControlInputClass)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sites" /></label>
          <Select label="Filter region" icon={<Filter size={18} />} value={region} onChange={setRegion} options={[{ value: "all", label: "All regions" }, ...regions.map((value) => ({ value, label: value }))]} />
        </div>
        <div className={cx(tableCardHeaderClass)}><div><p className={cx(eyebrowClasses)}>Site network</p><h2 className={cx(tableCardHeaderTitleClass)}>All sites</h2></div><span className={cx(tableCardHeaderCountClass)}>{rows.length} of {sites.length} shown</span></div>
        {rows.length ? <div className={cx(dataTableWrapClass)}><table className={cx(dataTableClass)}>
          <thead className={cx(dataTableHeadClass)}><tr>
            <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>Site</th>
            <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>Region</th>
            <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>Segment</th>
            <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>Users</th>
            <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>Completion</th>
            <th className={cx(dataTableHeaderCellClass, "shell:w-1/12")}>Reqs</th>
            <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>Updated</th>
            <th className={cx(dataTableHeaderCellClass, "shell:w-30")}><span className={cx("sr-only")}>Open</span></th>
          </tr></thead>
          <tbody className={cx(dataTableBodyClass)}>{rows.map((site) => {
            const scoped = scopedCountFor(site.id);
            const users = usersFor(site.id);
            return (
              <tr className={cx(dataTableRowClass, dataTableRowLinkClass)} key={site.id} onClick={() => navigate(`/admin/sites/${site.id}`)}>
                <td className={cx(dataTableCellClass)} data-label="Site"><span className={cx(dataTableCellLabelClass)}>Site</span><span className={cx("grid min-w-0 gap-0.5")}><strong className={cx("block text-slate-900 dark:text-slate-100")}>{site.name}</strong><span className={cx("block text-xs text-slate-500 dark:text-slate-400")}>{site.code}</span></span></td>
                <td className={cx(dataTableCellClass)} data-label="Region"><span className={cx(dataTableCellLabelClass)}>Region</span>{site.region}</td>
                <td className={cx(dataTableCellClass)} data-label="Segment"><span className={cx(dataTableCellLabelClass)}>Segment</span>{site.segment}</td>
                <td className={cx(dataTableCellClass)} data-label="Users"><span className={cx(dataTableCellLabelClass)}>Users</span>{users.length ? <span className={cx("grid min-w-0 gap-0.5")}>{users.length}<span className={cx("block text-xs text-slate-500 dark:text-slate-400")}>{users.filter((user) => user.status === "Active").length} active</span></span> : "None assigned"}</td>
                <td className={cx(dataTableCellClass)} data-label="Completion"><span className={cx(dataTableCellLabelClass)}>Completion</span><span className={cx(pillBaseClass, "min-h-7", site.completion === 100 ? pillTone.success : site.completion === 0 ? pillTone.neutral : pillTone.brand)}>{site.completion}%</span></td>
                <td className={cx(dataTableCellClass)} data-label="Requirements"><span className={cx(dataTableCellLabelClass)}>Requirements</span><span className={cx("grid min-w-0 gap-0.5")}>{scoped ? `${scoped} scoped` : "Global only"}<span className={cx("block text-xs text-slate-500 dark:text-slate-400")}>{globalCount} global</span></span></td>
                <td className={cx(dataTableCellClass)} data-label="Last updated"><span className={cx(dataTableCellLabelClass)}>Last updated</span>{site.updated}</td>
                <td className={cx(dataTableLastCellClass)} data-label="">
                  <span className={cx(rowActionsClass)}>
                    <IconButton label={`Edit ${site.name}`} onClick={(event) => { event.stopPropagation(); setEditing(site); }}><Pencil size={17} /></IconButton>
                    <Link className={cx("table-action inline-grid size-9 place-items-center rounded-lg text-kc-blue-700 hover:bg-kc-blue-50 dark:text-kc-blue-300 dark:hover:bg-kc-blue-950")} to={`/admin/sites/${site.id}`} aria-label={`Open ${site.name}`}><ChevronRight size={18} /></Link>
                  </span>
                </td>
              </tr>
            );
          })}</tbody>
        </table></div> : <EmptyState icon={<Search size={27} />} title="No sites match" description="Try another site name, code, or region." />}
      </section>
      {editing && <SiteDialog site={editing === "new" ? undefined : editing} existing={sites} regions={configRegions} segments={configSegments} onClose={() => setEditing(null)} onSave={(site) => {
        if (editing === "new") { addSite(site); setFeedback({ tone: "success", title: "Site created", body: `${site.name} (${site.code}) was added to the network.` }); }
        else { updateSite(site); setFeedback({ tone: "success", title: "Site updated", body: `${site.name} was updated.` }); }
        setEditing(null);
      }} />}
    </div>
  );
}

/** One panel in the Config screen: an add form plus the current values as removable pills. */
function ConfigListCard({
  title,
  description,
  placeholder,
  values,
  onAdd,
  onRemove,
  removalNote = "Existing records that already use it keep their current value.",
}: {
  title: string;
  description: string;
  placeholder: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  removalNote?: string;
}) {
  const [draft, setDraft] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const duplicate = values.some((value) => value.toLowerCase() === draft.trim().toLowerCase());

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || duplicate) return;
    onAdd(trimmed);
    setDraft("");
  }

  return (
    <section className={cx(tableCardClass)}>
      <div className={cx(tableCardHeaderStartClass)}>
        <div>
          <p className={cx(eyebrowClasses)}>Dropdown values</p>
          <h2 className={cx(tableCardHeaderTitleClass)}>{title}</h2>
          <p className={cx("mt-1 text-sm text-slate-600 dark:text-slate-400")}>{description}</p>
        </div>
        <span className={cx(tableCardHeaderCountClass)}>{values.length} value{values.length === 1 ? "" : "s"}</span>
      </div>
      <div className={cx("grid gap-3.5 p-4")}>
        <form className={cx("flex flex-col gap-2 sm:flex-row")} onSubmit={handleAdd}>
          <input className={cx(fieldInputClass, "flex-1")} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} aria-label={`New ${title.toLowerCase()} value`} />
          <Button type="submit" variant="secondary" icon={<Plus size={17} />} disabled={!draft.trim() || duplicate}>Add</Button>
        </form>
        {duplicate && <small className={cx(fieldErrorClass)}>That value already exists.</small>}
        {values.length === 0 ? (
          <EmptyState icon={<ListChecks size={24} />} title="No values yet" description={`Add the first ${title.toLowerCase()} value above.`} />
        ) : (
          <ul className={cx("m-0 flex flex-wrap gap-2 p-0 list-none")}>
            {values.map((value) => (
              <li key={value} className={cx(pillBaseClass, pillTone.neutral, "py-0.5 pr-1")}>
                {value}
                <button type="button" className={cx("grid size-5 place-items-center rounded-full border-0 bg-transparent p-0 hover:bg-slate-200 dark:hover:bg-slate-700")} aria-label={`Remove ${value}`} onClick={() => setRemoving(value)}>
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {removing && (
        <ConfirmDialog
          eyebrow="Config"
          title={`Remove "${removing}"?`}
          body={`This removes the value from the dropdown. ${removalNote}`}
          confirmLabel="Remove value"
          cancelLabel="Keep value"
          onCancel={() => setRemoving(null)}
          onConfirm={() => { onRemove(removing); setRemoving(null); }}
        />
      )}
    </section>
  );
}

type ConfigListKey = "regions" | "segments" | "sections" | "subsections";

export function AdminConfigScreen() {
  const {
    regions, segments, addRegion, removeRegion, addSegment, removeSegment,
    masterSections, masterSubSections, addMasterSection, removeMasterSection, addMasterSubSection, removeMasterSubSection,
  } = useAdministration();
  const [activeKey, setActiveKey] = useState<ConfigListKey>("regions");

  const lists: Record<ConfigListKey, { label: string; icon: typeof MapPin; count: number; card: React.ReactNode }> = {
    regions: {
      label: "Regions", icon: MapPin, count: regions.length,
      card: <ConfigListCard title="Regions" description="Shown in the Region field when creating or editing a site." placeholder="For example, North America" values={regions} onAdd={addRegion} onRemove={removeRegion} removalNote="Sites that already use it keep their current value." />,
    },
    segments: {
      label: "Segments", icon: Layers, count: segments.length,
      card: <ConfigListCard title="Segments" description="Shown in the Segment field when creating or editing a site." placeholder="For example, Family Care" values={segments} onAdd={addSegment} onRemove={removeSegment} removalNote="Sites that already use it keep their current value." />,
    },
    sections: {
      label: "Sections", icon: ListTree, count: masterSections.length,
      card: <ConfigListCard title="Sections" description="Shown in the Section field when creating or editing a master requirement, and validated against on import." placeholder="For example, Leadership & Engagement" values={masterSections} onAdd={addMasterSection} onRemove={removeMasterSection} removalNote="Master requirements that already use it keep their current value." />,
    },
    subsections: {
      label: "Sub-Sections", icon: Rows3, count: masterSubSections.length,
      card: <ConfigListCard title="Sub-Sections" description="Shown in the Sub-Section field when creating or editing a master requirement, and validated against on import." placeholder="For example, 1.2 Leadership commitment" values={masterSubSections} onAdd={addMasterSubSection} onRemove={removeMasterSubSection} removalNote="Master requirements that already use it keep their current value." />,
    },
  };

  return (
    <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100")}>
      <PageHeader eyebrow="Administration" title="Config" description="Manage the shared dropdown values used on site and master requirement records." />
      <div className={cx("config-shell flex min-w-0 items-start gap-4 max-lg:flex-col lg:flex-row")}>
        <aside className={cx("config-index grid w-full flex-none gap-1.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm lg:w-65")} style={{ background: "var(--surface-panel)" }}>
          {(Object.keys(lists) as ConfigListKey[]).map((key) => {
            const item = lists[key];
            const Icon = item.icon;
            const active = key === activeKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveKey(key)}
                className={cx(
                  "config-index__item flex min-h-13.5 min-w-0 items-center gap-2.5 rounded-xl border border-transparent p-2 text-left text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 active:scale-99 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                  active && "config-index__item--active border-kc-blue-200 bg-kc-blue-50 text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200",
                )}
                aria-current={active ? "true" : undefined}
              >
                <span className={cx("grid size-8.5 flex-none place-items-center rounded-lg bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}><Icon size={18} /></span>
                <span className={cx("grid min-w-0 flex-1")}>
                  <strong className={cx("overflow-hidden text-xs text-ellipsis whitespace-nowrap")}>{item.label}</strong>
                </span>
                <span className={cx(pillBaseClass, pillTone.neutral, "flex-none")}>{item.count}</span>
              </button>
            );
          })}
        </aside>
        <div className={cx("config-content grid min-w-0 flex-1 gap-3.5")}>
          {lists[activeKey].card}
        </div>
      </div>
    </div>
  );
}

export function AdminImportBatchPreviewScreen() {
  const { batchId } = useParams();
  const { masterRequirements, importHistory, publishImportBatch, sites, notify } = useAdministration();
  const batch = importHistory.find((record) => record.id === batchId);
  const rows = masterRequirements.filter((item) => item.importBatchId === batchId);
  const sectionOrder: string[] = [];
  const grouped: Record<string, MasterRequirement[]> = {};
  rows.forEach((item) => {
    if (!grouped[item.section]) { grouped[item.section] = []; sectionOrder.push(item.section); }
    grouped[item.section].push(item);
  });
  const published = batch?.publishStatus === "Published";
  return (
    <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100")}>
      <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb"><Link className={cx(breadcrumbsLinkClass)} to="/admin/imports">Master data import</Link><ChevronRight size={15} /><Link className={cx(breadcrumbsLinkClass)} to="/admin/imports/history">Import history</Link><ChevronRight size={15} /><span aria-current="page">{batchId}</span></nav>
      <PageHeader
        eyebrow="Administration audit"
        title="Preview imported requirements"
        description={batch ? `${rows.length} requirement${rows.length === 1 ? "" : "s"} from ${batch.fileName}, scoped to ${siteNamesFor(sites, batch.siteIds) || "the selected sites"}.` : "This import batch could not be found."}
        actions={batch && rows.length > 0 && <Button variant="primary" icon={<Check size={17} />} disabled={published} onClick={() => { publishImportBatch(batch.id); notifyBatchPublished(notify, batch, rows.length, sites); }}>{published ? "Published" : `Publish ${rows.length} requirements`}</Button>}
      />
      {published && <InlineMessage tone="success" title="Already published">This batch's requirements are live in the master requirements catalog.</InlineMessage>}
      {!rows.length && <EmptyState icon={<FileSpreadsheet size={28} />} title="No requirements in this batch" description="This import batch has no linked master requirement rows." />}
      {sectionOrder.map((section) => (
        <section className={cx(tableCardClass)} key={section}>
          <div className={cx(tableCardHeaderStartClass)}><div><p className={cx(eyebrowClasses)}>Category</p><h2 className={cx(tableCardHeaderTitleClass)}>{section}</h2></div><span className={cx(tableCardHeaderCountClass)}>{grouped[section].length} requirement{grouped[section].length === 1 ? "" : "s"}</span></div>
          <div className={cx(historyListClass)}>{grouped[section].map((item) => (
            <article className={cx("import-preview-requirement overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900")} key={item.id}>
              <div className={cx("import-preview-requirement__summary flex flex-wrap items-center gap-3 p-3")}>
                <span className={cx(historyItemIconClass)}><FileText size={20} /></span>
                <div className={cx("import-preview-requirement__identity grid min-w-0 flex-1 gap-0.5")}><strong className={cx("text-slate-900 dark:text-slate-100")}>{item.id}</strong><span className={cx("truncate text-xs text-slate-500 dark:text-slate-400")}>{item.title}</span></div>
                <span className={cx(publishBadgeClass, item.status === "Draft" ? cx("publish-badge--draft", pillTone.provisional) : pillTone.success)}>{item.status}</span>
              </div>
              <div className={cx("import-preview-questions min-w-0 border-t border-slate-200 bg-white p-4 md:pl-19 dark:border-slate-700 dark:bg-slate-900")}>
                <div className={cx("import-preview-questions__header flex flex-col items-start gap-2.5 md:flex-row md:items-center md:justify-between md:gap-4")}>
                  <div><p className={cx(eyebrowClasses)}>Review questions</p><h3 className={cx("mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100")}>Questions included with this requirement</h3></div>
                  <span className={cx(questionCountClass)}>{item.questions.length} question{item.questions.length === 1 ? "" : "s"}</span>
                </div>
                {item.questions.length ? (
                  <ol className={cx("import-preview-question-list m-0 mt-3 grid list-none gap-2.5 p-0")}>
                    {item.questions.map((question, index) => {
                      const questionNumber = question.number || index + 1;
                      const evidenceRequired = question.evidenceRequired ?? question.expectedEvidence.length > 0;
                      return (
                        <li className={cx("flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900")} key={question.id}>
                          <span className={cx(questionNumberClass)}>{questionNumber}</span>
                          <div className={cx("import-preview-question__content min-w-0 flex-1")}>
                            <div className={cx("import-preview-question__heading flex flex-col items-start gap-1 md:flex-row md:items-center md:justify-between md:gap-3")}>
                              <strong className={cx("block text-xs font-semibold text-slate-500 dark:text-slate-400")}>Question {questionNumber}</strong>
                              <span className={cx("import-preview-question__evidence-status text-xs font-semibold whitespace-normal text-slate-500 md:whitespace-nowrap dark:text-slate-400")}>{evidenceRequired ? `${question.expectedEvidence.length} evidence item${question.expectedEvidence.length === 1 ? "" : "s"}` : "Evidence not required"}</span>
                            </div>
                            <p className={cx("import-preview-question__text mt-1 text-sm leading-relaxed text-slate-900 dark:text-slate-100")}>{question.text}</p>
                            {evidenceRequired && (
                              <div className={cx("import-preview-evidence mt-2.5 rounded-lg bg-kc-blue-50 p-3 dark:bg-kc-blue-950")}>
                                <p className={cx("import-preview-evidence__title m-0 flex items-center gap-1.5 text-xs font-bold text-kc-blue-800 dark:text-kc-blue-200")}><Paperclip size={14} />Expected evidence</p>
                                {question.expectedEvidence.length ? (
                                  <ul className={cx("m-0 mt-1.5 grid gap-1 pl-5 text-xs leading-snug text-slate-700 dark:text-slate-300")}>{question.expectedEvidence.map((evidence, evidenceIndex) => <li key={`${question.id}-evidence-${evidenceIndex}`}>{evidence}</li>)}</ul>
                                ) : <p className={cx("import-preview-evidence__empty mt-1.5 text-xs leading-snug text-slate-600 dark:text-slate-400")}>Evidence is required, but no evidence description was included in the import.</p>}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : <p className={cx("import-preview-questions__empty mt-3 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400")}>No review questions or expected evidence were included for this requirement.</p>}
              </div>
            </article>
          ))}</div>
        </section>
      ))}
    </div>
  );
}

// "Requirement ID" and "Question ID" hold short codes (e.g. LE-01, LE-01-Q1) so they need far
// less room than the free-text columns; Section/Sub-Section values are short phrases that were
// already wrapping onto two lines at the wider size. Trimming both keeps the "Workbook rows"
// table from needing a horizontal scrollbar at a normal admin viewport width.
const compactWorkbookColumns = new Set<string>(["Requirement ID", "Question ID"]);
const mediumWorkbookColumns = new Set<string>(["Section", "Sub-Section"]);
function workbookColumnWidthClass(column: string) {
  if (compactWorkbookColumns.has(column)) return "min-w-16";
  if (mediumWorkbookColumns.has(column)) return "min-w-28";
  return "min-w-32";
}

export function AdminImportsScreen() {
  const navigate = useNavigate();
  const { importHistory, publishImportBatch, submitImportBatch, masterRequirements, sites, notify, masterSections, masterSubSections } = useAdministration();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<RequirementImportMode | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [plan, setPlan] = useState<RequirementImportPlan | null>(null);
  const [editableRows, setEditableRows] = useState<ImportTemplateRow[]>([]);
  const [selectedRowNumbers, setSelectedRowNumbers] = useState<number[]>([]);
  const lastSelectedRowNumber = useRef<number | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [siteScope, setSiteScope] = useState<"all" | "specific">("all");
  const [scopedSiteIds, setScopedSiteIds] = useState<string[]>([]);
  const [result, setResult] = useState<ImportHistoryRecord | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const siteOptions = buildSiteOptions(sites);
  // Spreadsheet-style range selection over the "Workbook rows" cells, for copy/paste across
  // multiple cells at once. Coordinates are indexes into editableRows / importTemplateColumns,
  // not row numbers/column names, so a pasted block can be applied purely by offset.
  const [cellSelection, setCellSelection] = useState<{ anchorRow: number; anchorCol: number; focusRow: number; focusCol: number } | null>(null);
  const isSelectingCellsRef = useRef(false);
  // The whole batch shares one site scope, chosen in the wizard's Site selection step — not a
  // per-row workbook value.
  const resolvedSiteIds = siteScope === "specific" ? scopedSiteIds : [];

  useEffect(() => {
    if (!result || !publishNow || result.publishStatus === "Published") return;
    publishImportBatch(result.id);
    setResult((current) => current ? { ...current, publishStatus: "Published" } : current);
  }, [publishImportBatch, publishNow, result]);

  // Ends a drag-selection wherever the mouse button is released, even outside the table.
  useEffect(() => {
    function endCellDrag() { isSelectingCellsRef.current = false; }
    window.addEventListener("mouseup", endCellDrag);
    return () => window.removeEventListener("mouseup", endCellDrag);
  }, []);

  async function selectFile(selected?: File) {
    if (!selected) return;
    if (!mode) { setFileError("Choose New requirements or Update requirements before uploading a workbook."); return; }
    if (!selected.name.toLowerCase().endsWith(".xlsx")) { setFile(null); setPlan(null); setFileError("Choose the EHS360 Excel .xlsx import template."); return; }
    if (selected.size > 25 * 1024 * 1024) { setFile(null); setFileError("The import file must be 25 MB or smaller."); return; }
    try { const nextPlan = await planRequirementImport(mode, selected, masterRequirements, resolvedSiteIds, masterSections, masterSubSections); setFile(selected); setPlan(nextPlan); setEditableRows(nextPlan.rows); setSelectedRowNumbers(mode === "new" ? nextPlan.rows.map((row) => row.rowNumber) : []); setFileError(""); }
    catch (error) { setFile(null); setPlan(null); setFileError(error instanceof Error ? error.message : "The workbook could not be read."); }
  }
  function updatePreviewRows(nextRows: ImportTemplateRow[]) {
    setEditableRows(nextRows);
    if (!mode || !file) return;
    const nextPlan = planRequirementRows(mode, file.name, nextRows, masterRequirements, resolvedSiteIds, masterSections, masterSubSections);
    setPlan(nextPlan);
    setSelectedRowNumbers((current) => mode === "new"
      ? nextPlan.rows.map((row) => row.rowNumber)
      : current.filter((rowNumber) => nextPlan.rows.some((row) => row.rowNumber === rowNumber)));
  }
  function togglePreviewRow(rowNumber: number, checked: boolean, shiftKey: boolean) {
    const rowNumbers = editableRows.map((row) => row.rowNumber);
    const lastIndex = lastSelectedRowNumber.current === null ? -1 : rowNumbers.indexOf(lastSelectedRowNumber.current);
    const currentIndex = rowNumbers.indexOf(rowNumber);
    const range = shiftKey && lastIndex >= 0 && currentIndex >= 0
      ? rowNumbers.slice(Math.min(lastIndex, currentIndex), Math.max(lastIndex, currentIndex) + 1)
      : [rowNumber];
    setSelectedRowNumbers((current) => checked
      ? [...new Set([...current, ...range])]
      : current.filter((number) => !range.includes(number)));
    lastSelectedRowNumber.current = rowNumber;
  }
  function cellSelectionBounds(selection: { anchorRow: number; anchorCol: number; focusRow: number; focusCol: number }) {
    return {
      minRow: Math.min(selection.anchorRow, selection.focusRow),
      maxRow: Math.max(selection.anchorRow, selection.focusRow),
      minCol: Math.min(selection.anchorCol, selection.focusCol),
      maxCol: Math.max(selection.anchorCol, selection.focusCol),
    };
  }
  function isCellSelected(rowIndex: number, colIndex: number) {
    if (!cellSelection) return false;
    const bounds = cellSelectionBounds(cellSelection);
    return rowIndex >= bounds.minRow && rowIndex <= bounds.maxRow && colIndex >= bounds.minCol && colIndex <= bounds.maxCol;
  }
  function startCellSelection(rowIndex: number, colIndex: number, extend: boolean) {
    isSelectingCellsRef.current = true;
    setCellSelection((current) => extend && current
      ? { ...current, focusRow: rowIndex, focusCol: colIndex }
      : { anchorRow: rowIndex, anchorCol: colIndex, focusRow: rowIndex, focusCol: colIndex });
  }
  function extendCellSelection(rowIndex: number, colIndex: number) {
    if (!isSelectingCellsRef.current) return;
    setCellSelection((current) => current ? { ...current, focusRow: rowIndex, focusCol: colIndex } : current);
  }
  // Only intercepted when the selection spans more than one cell — a single-cell selection lets
  // the browser's normal in-textarea copy/paste behave exactly as expected.
  function handleWorkbookCopy(event: React.ClipboardEvent<HTMLDivElement>) {
    if (!cellSelection) return;
    const bounds = cellSelectionBounds(cellSelection);
    if (bounds.minRow === bounds.maxRow && bounds.minCol === bounds.maxCol) return;
    event.preventDefault();
    const tsv = [];
    for (let rowIndex = bounds.minRow; rowIndex <= bounds.maxRow; rowIndex++) {
      const cols = [];
      for (let colIndex = bounds.minCol; colIndex <= bounds.maxCol; colIndex++) cols.push(editableRows[rowIndex]?.[importTemplateColumns[colIndex]] ?? "");
      tsv.push(cols.join("\t"));
    }
    event.clipboardData.setData("text/plain", tsv.join("\n"));
  }
  function handleWorkbookPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    if (!cellSelection) return;
    const text = event.clipboardData.getData("text/plain");
    if (!text) return;
    const lines = text.replace(/\r/g, "").split("\n");
    if (lines.at(-1) === "") lines.pop();
    const grid = lines.map((line) => line.split("\t"));
    // A single value (no tabs, one line) isn't a "paste a block" gesture — let it land in
    // whichever cell natively has focus instead.
    if (grid.length <= 1 && (grid[0]?.length ?? 0) <= 1) return;
    event.preventDefault();
    const bounds = cellSelectionBounds(cellSelection);
    const next = editableRows.map((row) => ({ ...row }));
    grid.forEach((line, rowOffset) => {
      const targetRow = bounds.minRow + rowOffset;
      if (targetRow >= next.length) return;
      line.forEach((value, colOffset) => {
        const targetCol = bounds.minCol + colOffset;
        if (targetCol >= importTemplateColumns.length) return;
        next[targetRow][importTemplateColumns[targetCol]] = value;
      });
    });
    updatePreviewRows(next);
    setCellSelection({
      anchorRow: bounds.minRow,
      anchorCol: bounds.minCol,
      focusRow: Math.min(next.length - 1, bounds.minRow + grid.length - 1),
      focusCol: Math.min(importTemplateColumns.length - 1, bounds.minCol + (grid[0]?.length ?? 1) - 1),
    });
  }
  function advance() {
    if (step === 3) {
      // Site selection applies as one shared scope for the whole batch — every requirement in
      // this import gets the same siteIds, not a per-row workbook value.
      if (mode && file) setPlan(planRequirementRows(mode, file.name, editableRows, masterRequirements, resolvedSiteIds, masterSections, masterSubSections));
      setStep(4);
      return;
    }
    if (step === 4 && selectedPlan && !selectedPlan.issues.some((issue) => issue.severity === "error")) {
      const selected = new Set(selectedRowNumbers);
      const stagedPlan = planRequirementRows(mode!, file!.name, editableRows.filter((row) => selected.has(row.rowNumber)), masterRequirements, resolvedSiteIds, masterSections, masterSubSections);
      const record = submitImportBatch(stagedPlan);
      notify({
        title: `${record.fileName} imported`,
        body: publishNow ? `${record.created + record.updated} requirements were published from this import.` : `${record.created + record.updated} requirements are staged as drafts and stay invisible to sites until published.`,
        category: "master-data",
        audience: ["administrator"],
        link: `/admin/imports/${record.id}/preview`,
      });
      setResult(record); setStep(5); return;
    }
    setStep((value) => Math.min(5, value + 1));
  }
  function resetImport() {
    setStep(0); setMode(null); setFile(null); setPlan(null); setEditableRows([]); setSelectedRowNumbers([]); setPublishNow(false); setFileError(""); setSiteScope("all"); setScopedSiteIds([]); setResult(null);
  }
  const selectedPlan = mode && file
    ? planRequirementRows(mode, file.name, editableRows.filter((row) => selectedRowNumbers.includes(row.rowNumber)), masterRequirements, resolvedSiteIds, masterSections, masterSubSections)
    : plan;
  // Continue is blocked while any *selected* row has an error — but with nothing shown near the
  // table, that block was silent (the user could select every row and still not know why the
  // button stayed disabled). These surface exactly which rows and why.
  const selectedErrorIssues = (selectedPlan?.issues ?? []).filter((issue) => issue.severity === "error");
  const selectedErrorRows = new Set(selectedErrorIssues.map((issue) => issue.row));
  const needsReview = selectedErrorIssues.length > 0;

  return (
    <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100")}>
      <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb"><Link className={cx(breadcrumbsLinkClass)} to="/admin/requirements">Master data</Link><ChevronRight size={15} /><span aria-current="page">Imports</span></nav>
      <PageHeader eyebrow="Administration" title="Import requirements" description="Create new master requirements or safely update existing governed content from the approved workbook." descriptionClassName="md:whitespace-nowrap" actions={<Button variant="secondary" icon={<History size={18} />} onClick={() => navigate("/admin/imports/history")} data-tour="import-history">Import history</Button>} />
      <section className={cx(importCardClass)}>
        <StepIndicator current={step} />
        <div className={cx(importStageClass)}>
          {step === 0 && <>
            <div className={cx(importStageHeadingClass)}>
              <span className={cx(stageIconClass)}><FileInput size={23} /></span>
              <div><p className={cx(eyebrowClasses)}>Step 1 of 5</p><h2 className={cx("mt-0.5 mb-1 text-base font-bold text-slate-900 dark:text-slate-100")}>Choose an import flow</h2><p className={cx("text-sm text-slate-600 dark:text-slate-400")}>New imports add master requirements. Updates safely change existing requirement and question IDs.</p></div>
            </div>
            <div className={cx("grid gap-4 md:grid-cols-2")}>
              {(["new", "update"] as const).map((choice) => <button key={choice} type="button" onClick={() => { if (mode !== choice) { setFile(null); setPlan(null); setSelectedRowNumbers([]); } setMode(choice); }} className={cx("rounded-xl border p-5 text-left transition-colors", mode === choice ? "border-kc-blue-600 bg-kc-blue-50 ring-3 ring-kc-blue-100 dark:bg-kc-blue-950 dark:ring-kc-blue-900" : "border-slate-200 hover:border-kc-blue-300 dark:border-slate-700") }>
                <strong className={cx("block text-base text-slate-900 dark:text-slate-100")}>{choice === "new" ? "New requirements" : "Update requirements"}</strong>
                <span className={cx("mt-1 block text-sm text-slate-600 dark:text-slate-400")}>{choice === "new" ? "Create new requirements and questions from unused IDs." : "Match Requirement ID + Question ID, preview changes, and add new questions safely."}</span>
              </button>)}
            </div>
          </>}
          {step === 1 && <>
            <div className={cx(importStageHeadingClass)}>
              <span className={cx(stageIconClass)}><FileInput size={23} /></span>
              <div><p className={cx(eyebrowClasses)}>Step 2 of 5</p><h2 className={cx("mt-0.5 mb-1 text-base font-bold text-slate-900 dark:text-slate-100")}>Upload source workbook</h2><p className={cx("text-sm text-slate-600 dark:text-slate-400")}>Use the EHS360 Master Requirement Import Template or an approved workbook with the same columns.</p></div>
            </div>
            <input ref={inputRef} className={cx("sr-only")} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => void selectFile(event.target.files?.[0])} />
            {!file ? (
              <button
                className={cx(dropzoneClass, fileError && "dropzone--invalid border-red-600 ring-3 ring-red-100 dark:border-red-400 dark:ring-red-950")}
                data-tour="import-upload"
                onClick={() => inputRef.current?.click()}
                onDrop={(event) => { event.preventDefault(); void selectFile(event.dataTransfer.files[0]); }}
                onDragOver={(event) => event.preventDefault()}
              >
                <span className={cx("dropzone__icon grid size-12 place-items-center rounded-xl bg-white text-kc-blue-700 shadow-sm dark:bg-slate-800 dark:text-kc-blue-300")}><Upload size={25} /></span>
                <strong className={cx("text-base")}>Choose the completed Excel import template</strong>
                <span className={cx("text-xs text-slate-500 dark:text-slate-400")}>.xlsx files · Maximum 25 MB</span>
              </button>
            ) : (
              <div className={cx(selectedFileClass)} data-tour="import-upload">
                <span className={cx("selected-file__icon grid size-12 flex-none place-items-center rounded-lg bg-white text-emerald-700 dark:bg-slate-800 dark:text-emerald-300")}><FileSpreadsheet size={24} /></span>
                <div className={cx("grid flex-1 gap-0.5")}><strong className={cx("text-slate-900 dark:text-slate-100")}>{file.name}</strong><span className={cx("text-xs text-slate-600 dark:text-slate-400")}>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to inspect</span></div>
                <Button variant="tertiary" size="compact" onClick={() => inputRef.current?.click()}>Replace</Button>
                <CheckCircle2 size={21} className={cx("flex-none text-emerald-700 dark:text-emerald-300")} />
              </div>
            )}
            {fileError && <InlineMessage tone="danger" title="Workbook not accepted">{fileError}</InlineMessage>}
          </>}
          {step === 2 && <>
            <div className={cx("mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(42rem,1.6fr)] xl:items-center xl:gap-6")}>
            <div className={cx(importStageHeadingClass, "mb-0 max-w-none")}>
              <span className={cx(stageIconClass)}><FileSpreadsheet size={23} /></span>
              <div><p className={cx(eyebrowClasses)}>Step 3 of 5</p><h2 className={cx("mt-0.5 mb-1 text-base font-bold text-slate-900 dark:text-slate-100")}>Review and edit imported requirements</h2><p className={cx("text-sm text-slate-600 dark:text-slate-400")}>Review the parsed workbook data, deselect anything not ready to apply, or open a requirement to edit it.</p></div>
            </div>
            <div className={cx(inspectionGridClass, "mb-0")}>
              <div className={cx(inspectionTileClass)}><strong className={cx("text-xl text-slate-900 dark:text-slate-100")}>1</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Import Template sheet read</span></div>
              <div className={cx(inspectionTileClass)}><strong className={cx("text-xl text-slate-900 dark:text-slate-100")}>{plan?.sourceRows ?? 0}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Source rows</span></div>
              <div className={cx(inspectionTileClass)}><strong className={cx("text-xl text-slate-900 dark:text-slate-100")}>{plan?.upserts.length ?? 0}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Affected requirements</span></div>
              <div className={cx(inspectionTileClass)}><strong className={cx("text-xl text-slate-900 dark:text-slate-100")}>{plan?.issues.length ?? 0}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Validation findings</span></div>
            </div>
            </div>
            <div className={cx("mt-5 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700")} style={{ maxHeight: "65vh" }} onCopy={handleWorkbookCopy} onPaste={handleWorkbookPaste}>
              <div className={cx("sticky top-0 left-0 z-20 flex min-w-full flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900")}><div><strong className={cx("text-slate-900 dark:text-slate-100")}>Workbook rows</strong><p className={cx("mt-0.5 text-xs text-slate-500 dark:text-slate-400")}>Edit any import-template value, add a row, or remove a row before release. Select multiple rows to apply together, or drag/shift-click across cells to copy and paste a range.</p></div><div className={cx("flex flex-wrap items-center gap-2")}><span className={cx("text-xs font-semibold text-slate-600 dark:text-slate-300")}>{selectedRowNumbers.length} of {editableRows.length} selected</span><Button variant="tertiary" size="compact" onClick={() => setSelectedRowNumbers(editableRows.map((row) => row.rowNumber))}>Select all</Button><Button variant="tertiary" size="compact" onClick={() => setSelectedRowNumbers([])}>Clear</Button><Button variant="secondary" size="compact" icon={<Plus size={16} />} onClick={() => updatePreviewRows([...editableRows, { ...Object.fromEntries(importTemplateColumns.map((column) => [column, ""])), rowNumber: Math.max(4, ...editableRows.map((row) => row.rowNumber)) + 1 } as ImportTemplateRow])}>Add row</Button></div></div>
              <table className={cx("w-full text-left text-xs select-none")}><thead className={cx("bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}><tr><th className={cx("sticky left-0 bg-slate-50 p-2 dark:bg-slate-800")}>Include</th><th className={cx("p-2 font-bold")}>#</th>{importTemplateColumns.map((column) => <th key={column} className={cx(workbookColumnWidthClass(column), "p-2 font-bold")}>{column}</th>)}<th className={cx("p-2")}>Actions</th></tr></thead><tbody>{editableRows.map((row, rowIndex) => {
                const rowIssues = selectedRowNumbers.includes(row.rowNumber) ? selectedErrorIssues.filter((issue) => issue.row === row.rowNumber) : [];
                return <tr key={`${row.rowNumber}-${rowIndex}`} className={cx("border-t align-top", rowIssues.length ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40" : "border-slate-100 dark:border-slate-800")}><td className={cx("sticky left-0 p-2", rowIssues.length ? "bg-red-50 dark:bg-red-950/40" : "bg-white dark:bg-slate-900")}><input className={cx("size-4 accent-kc-blue-600")} type="checkbox" checked={selectedRowNumbers.includes(row.rowNumber)} onChange={(event) => togglePreviewRow(row.rowNumber, event.target.checked, false)} /></td><td className={cx("p-2 font-semibold", rowIssues.length ? "text-red-700 dark:text-red-300" : "text-slate-500 dark:text-slate-400")}><span className={cx("inline-flex items-center gap-1")}>{rowIssues.length > 0 && <AlertCircle size={13} className={cx("flex-none")} aria-label={rowIssues.map((issue) => issue.message).join(" ")} />}{rowIndex + 1}</span></td>{importTemplateColumns.map((column, colIndex) => {
                  const selected = isCellSelected(rowIndex, colIndex);
                  return <td key={column} className={cx("p-1.5")}><textarea
                    rows={2}
                    className={cx(
                      "w-full resize-y rounded-md border p-1.5 text-xs text-slate-900 outline-none dark:bg-slate-900 dark:text-slate-100",
                      workbookColumnWidthClass(column),
                      rowIssues.some((issue) => issue.field === column) ? "border-red-400 dark:border-red-700" : "border-slate-200 bg-white dark:border-slate-600",
                      // A selection ring stays on regardless of :focus; a plain single-cell click
                      // instead gets the ordinary focus ring — never both at once on the same
                      // property, so there's nothing for Tailwind's cascade order to arbitrate.
                      selected ? "ring-2 ring-inset ring-kc-blue-500 dark:ring-kc-blue-400" : "focus:border-kc-blue-600 focus:ring-2 focus:ring-kc-blue-100",
                    )}
                    value={row[column]}
                    onChange={(event) => updatePreviewRows(editableRows.map((item, index) => index === rowIndex ? { ...item, [column]: event.target.value } : item))}
                    onMouseDown={(event) => startCellSelection(rowIndex, colIndex, event.shiftKey)}
                    onMouseEnter={() => extendCellSelection(rowIndex, colIndex)}
                  /></td>;
                })}<td className={cx("p-2")}><Button variant="tertiary" size="compact" icon={<Trash2 size={15} />} aria-label={`Remove row ${rowIndex + 1}`} onClick={() => updatePreviewRows(editableRows.filter((_, index) => index !== rowIndex))} /></td></tr>;
              })}</tbody></table>
            </div>
            {selectedErrorIssues.length > 0 && (
              <InlineMessage tone="danger" title={`${selectedErrorRows.size} selected row${selectedErrorRows.size === 1 ? "" : "s"} can't be imported yet`}>
                <p className={cx("mb-1.5")}>Fix the flagged cells above (highlighted in red) or clear that row's checkbox to continue without it.</p>
                <ul className={cx("m-0 grid list-disc gap-1 pl-4")}>
                  {selectedErrorIssues.slice(0, 5).map((issue, index) => (
                    <li key={index}>Row {editableRows.findIndex((row) => row.rowNumber === issue.row) + 1}{issue.field ? ` · ${issue.field}` : ""}: {issue.message}</li>
                  ))}
                </ul>
                {selectedErrorIssues.length > 5 && <p className={cx("mt-1.5 text-xs")}>+{selectedErrorIssues.length - 5} more issue{selectedErrorIssues.length - 5 === 1 ? "" : "s"}.</p>}
              </InlineMessage>
            )}
          </>}
          {step === 3 && <>
            <div className={cx(importStageHeadingClass)}>
              <span className={cx(stageIconClass)}><MapPin size={23} /></span>
              <div><p className={cx(eyebrowClasses)}>Step 4 of 5</p><h2 className={cx("mt-0.5 mb-1 text-base font-bold text-slate-900 dark:text-slate-100")}>Choose which sites this batch applies to</h2><p className={cx("text-sm text-slate-600 dark:text-slate-400")}>This scope applies to every selected requirement in this batch.</p></div>
            </div>
            <div className={cx("grid gap-3 md:grid-cols-2")}>
              <button type="button" onClick={() => setSiteScope("all")} className={cx("rounded-xl border p-4 text-left", siteScope === "all" ? "border-kc-blue-600 bg-kc-blue-50 ring-3 ring-kc-blue-100 dark:bg-kc-blue-950 dark:ring-kc-blue-900" : "border-slate-200 dark:border-slate-700")}><strong className={cx("block text-slate-900 dark:text-slate-100")}>Apply to all sites</strong><span className={cx("mt-1 block text-sm text-slate-600 dark:text-slate-400")}>Every requirement in this batch applies to every site.</span></button>
              <button type="button" onClick={() => setSiteScope("specific")} className={cx("rounded-xl border p-4 text-left", siteScope === "specific" ? "border-kc-blue-600 bg-kc-blue-50 ring-3 ring-kc-blue-100 dark:bg-kc-blue-950 dark:ring-kc-blue-900" : "border-slate-200 dark:border-slate-700")}><strong className={cx("block text-slate-900 dark:text-slate-100")}>Apply to specific sites</strong><span className={cx("mt-1 block text-sm text-slate-600 dark:text-slate-400")}>Choose the sites this batch of requirements should apply to.</span></button>
            </div>
            {siteScope === "specific" && <div className={cx(fieldWideWrapClass, "mt-4")}>
              <span className={cx(fieldLabelRowClass)}>Sites</span>
              <CheckboxList label="Sites" searchable options={siteOptions} selected={scopedSiteIds} onChange={setScopedSiteIds} />
              {scopedSiteIds.length === 0 && <InlineMessage className={cx("mt-3")} tone="warning" title="Choose at least one site">Select one or more sites, or switch to "Apply to all sites" to continue.</InlineMessage>}
            </div>}
          </>}
          {step === 4 && <>
            <div className={cx(importStageHeadingClass)}>
              <span className={cx(stageIconClass)}><CheckCircle2 size={23} /></span>
              <div><p className={cx(eyebrowClasses)}>Step 5 of 5</p><h2 className={cx("mt-0.5 mb-1 text-base font-bold text-slate-900 dark:text-slate-100")}>Choose how to release changes</h2><p className={cx("text-sm text-slate-600 dark:text-slate-400")}>Apply the selected requirements now, then either publish them immediately or keep the batch in review.</p></div>
            </div>
            <div className={cx("grid gap-3 md:grid-cols-2")}>
              <button type="button" onClick={() => setPublishNow(false)} className={cx("rounded-xl border p-4 text-left", !publishNow ? "border-kc-blue-600 bg-kc-blue-50 ring-3 ring-kc-blue-100 dark:bg-kc-blue-950 dark:ring-kc-blue-900" : "border-slate-200 dark:border-slate-700")}><strong className={cx("block text-slate-900 dark:text-slate-100")}>Publish after review</strong><span className={cx("mt-1 block text-sm text-slate-600 dark:text-slate-400")}>Stage the selected changes as Draft and publish later from the batch preview.</span></button>
              <button type="button" onClick={() => setPublishNow(true)} className={cx("rounded-xl border p-4 text-left", publishNow ? "border-kc-blue-600 bg-kc-blue-50 ring-3 ring-kc-blue-100 dark:bg-kc-blue-950 dark:ring-kc-blue-900" : "border-slate-200 dark:border-slate-700")}><strong className={cx("block text-slate-900 dark:text-slate-100")}>Publish now</strong><span className={cx("mt-1 block text-sm text-slate-600 dark:text-slate-400")}>Stage and immediately publish the selected requirements after confirmation.</span></button>
            </div>
            <InlineMessage className={cx("mt-4")} tone="info" title={`${selectedRowNumbers.length} workbook row${selectedRowNumbers.length === 1 ? "" : "s"} selected`}>{publishNow ? "Selected changes will become live immediately after confirmation." : "Selected changes will remain Draft until an administrator publishes the batch."}</InlineMessage>
          </>}
          {step === 5 && result && (() => {
            const latest = importHistory.find((record) => record.id === result.id) ?? result;
            const published = latest.publishStatus === "Published";
            const requirementCount = latest.created + latest.updated;
            return (
              <div className={cx(resultStateClass)}>
                <span className={cx("result-state__icon mb-4 grid size-17 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", published && "result-state__icon--published bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300")}><CheckCircle2 size={34} /></span>
                <p className={cx(eyebrowClasses)}>{published ? "Published" : "Import complete"}</p>
                <h2 className={cx("mt-1 mb-2 text-xl font-bold text-slate-900 dark:text-slate-100")}>{published ? "Requirements are live" : "Review and publish this import"}</h2>
                <p className={cx("text-sm text-slate-600 dark:text-slate-400")}>{published
                  ? `All ${requirementCount} requirements from this import are now live in the master requirements catalog.`
                  : `${requirementCount} requirements are staged as drafts. They stay invisible to sites until you publish them.`}</p>
                <div className={cx("result-summary mt-6 grid w-full grid-cols-2 gap-2.5 md:grid-cols-4")}>
                  <div className={cx("grid gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 dark:border-slate-700 dark:bg-slate-900")}><strong className={cx("text-xl text-slate-900 dark:text-slate-100")}>{latest.created}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Created</span></div>
                  <div className={cx("grid gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 dark:border-slate-700 dark:bg-slate-900")}><strong className={cx("text-xl text-slate-900 dark:text-slate-100")}>{latest.updated}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Updated</span></div>
                  <div className={cx("grid gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 dark:border-slate-700 dark:bg-slate-900")}><strong className={cx("text-xl text-slate-900 dark:text-slate-100")}>{latest.unchanged}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Unchanged</span></div>
                  <div className={cx("grid gap-0.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 dark:border-slate-700 dark:bg-slate-900")}><strong className={cx("text-xl text-slate-900 dark:text-slate-100")}>{latest.siteIds.length || "All"}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>{latest.siteIds.length === 1 ? "Site" : "Sites"}</span></div>
                </div>
                <p className={cx("result-state__audit mt-4 text-sm text-slate-600 dark:text-slate-400")}>Audit reference <strong className={cx("text-slate-800 dark:text-slate-200")}>{latest.id}</strong></p>
                <div className={cx("result-state__primary mt-5 flex flex-col items-stretch justify-center gap-2.5 md:flex-row md:flex-wrap")}>
                  {!published && <Button variant="primary" icon={<Check size={17} />} onClick={() => { publishImportBatch(latest.id); notifyBatchPublished(notify, latest, requirementCount, sites); }}>Publish {requirementCount} requirements</Button>}
                  <Button variant="secondary" icon={<FileText size={17} />} onClick={() => navigate(`/admin/imports/${latest.id}/preview`)}>{published ? "View imported requirements" : "Review before publishing"}</Button>
                </div>
                <div className={cx("result-state__links mt-4 flex items-center justify-center gap-2.5")}>
                  <button className={cx("border-0 bg-transparent p-0 text-sm font-semibold text-kc-blue-700 hover:underline dark:text-kc-blue-300")} type="button" onClick={() => navigate("/admin/imports/history")}>View audit entry</button>
                  <span className={cx("divider-dot hidden size-1 rounded-full bg-slate-400 md:block dark:bg-slate-500")} />
                  <button className={cx("border-0 bg-transparent p-0 text-sm font-semibold text-kc-blue-700 hover:underline dark:text-kc-blue-300")} type="button" onClick={resetImport}>Import another file</button>
                </div>
              </div>
            );
          })()}
        </div>
        {step < 5 && <div className={cx(importCardFooterClass)}><Button variant="tertiary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button><Button variant="primary" onClick={advance} disabled={(step === 0 && !mode) || (step === 1 && !file) || (step === 2 && (needsReview || selectedRowNumbers.length === 0)) || (step === 3 && siteScope === "specific" && scopedSiteIds.length === 0) || (step === 4 && (needsReview || selectedRowNumbers.length === 0))} icon={<ArrowRight size={17} />} iconPosition="end">{step === 4 ? (publishNow ? "Publish selected changes" : "Stage for review") : "Continue"}</Button></div>}
      </section>
    </div>
  );
}

// Rendered inline on AdminRequirementDetailScreen rather than in a dialog, styled like the site
// contributor's assessment question cards (question-card / question-evidence) so an admin edits
// questions in the same visual language a contributor sees them in.
function QuestionsEditor({ questions, onChange, requirementId, submitted }: { questions: MasterQuestion[]; onChange: (questions: MasterQuestion[]) => void; requirementId: string; submitted: boolean }) {
  function updateQuestion(id: string, patch: Partial<MasterQuestion>) {
    onChange(questions.map((question) => question.id === id ? { ...question, ...patch } : question));
  }
  function removeQuestion(id: string) {
    onChange(questions.filter((question) => question.id !== id));
  }
  function updateEvidenceItem(question: MasterQuestion, index: number, value: string) {
    const expectedEvidence = question.expectedEvidence.map((item, itemIndex) => itemIndex === index ? value : item);
    updateQuestion(question.id, { expectedEvidence });
  }
  function addEvidenceItem(question: MasterQuestion) {
    updateQuestion(question.id, { expectedEvidence: [...question.expectedEvidence, ""] });
  }
  function removeEvidenceItem(question: MasterQuestion, index: number) {
    updateQuestion(question.id, { expectedEvidence: question.expectedEvidence.filter((_, itemIndex) => itemIndex !== index) });
  }
  function addQuestion() {
    const id = `${requirementId || "draft"}-q-${Date.now().toString(36)}`;
    const nextNumber = Math.max(0, ...questions.map((question) => Number(question.number) || 0)) + 1;
    onChange([...questions, { id, number: String(nextNumber), text: "", expectedEvidence: [], evidenceRequired: false }]);
  }
  return (
    <div className={cx("question-list grid gap-4")}>
      {!questions.length && <p className={cx("question-editor-empty rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400")}>No assessment questions yet. Add the first one below.</p>}
      {questions.map((question, index) => {
        const invalid = submitted && !question.text.trim();
        const evidenceRequired = question.evidenceRequired ?? question.expectedEvidence.length > 0;
        return (
          <article className={cx("question-card rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm md:p-4.5", invalid && "question-card--invalid border-red-200 ring-3 ring-red-100 dark:border-red-800 dark:ring-red-950", "dark:border-slate-700 dark:bg-slate-900")} key={question.id}>
            <div className={cx("question-card__header flex flex-wrap items-start gap-3 md:flex-nowrap")}>
              <span className={cx(questionNumberClass)}>{index + 1}</span>
              <div className={cx("min-w-0 flex-1")}>
                <p className={cx("text-xs font-semibold text-slate-500 dark:text-slate-400")}>Question {index + 1}</p>
                <textarea rows={2} className={cx("question-text-input mt-1 w-full max-w-195 resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-base leading-relaxed text-slate-900 outline-none focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-kc-blue-900")} value={question.text} onChange={(event) => updateQuestion(question.id, { text: event.target.value })} placeholder="For example, Is the site risk register current and approved?" />
                {invalid && <small className={cx(fieldErrorClass)}>Enter the question text.</small>}
              </div>
              <IconButton label={`Delete question ${index + 1}`} onClick={() => removeQuestion(question.id)}><Trash2 size={17} /></IconButton>
            </div>
            <div className={cx("question-evidence question-evidence--editable mt-3.5 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-900")}>
              <label className={cx("question-evidence__toggle inline-flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200")}>
                <input className={cx("size-4.5 accent-kc-blue-600")} type="checkbox" checked={evidenceRequired} onChange={(event) => updateQuestion(question.id, { evidenceRequired: event.target.checked })} /> <span>Evidence required for this question</span>
              </label>
              {evidenceRequired && <>
                <span className={cx("question-evidence__title flex items-center gap-1.5 text-xs font-bold tracking-wide text-kc-blue-700 uppercase dark:text-kc-blue-300")}><Paperclip size={14} /> Required evidence <small className={cx("ml-auto text-xs font-normal tracking-normal text-slate-500 normal-case dark:text-slate-400")}>Shown only with Question {index + 1}</small></span>
                <p className={cx("m-0 text-xs leading-relaxed text-slate-500 dark:text-slate-400")}>For a Partial or Yes answer, the site must explain how each file or link they upload meets this requirement.</p>
                <div className={cx("question-evidence__editor grid gap-2")}>
                  {question.expectedEvidence.map((item, evidenceIndex) => (
                    <div className={cx("question-evidence__item flex items-center gap-2")} key={`${question.id}-evidence-${evidenceIndex}`}>
                      <input className={cx("min-h-9.5 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-kc-blue-900")} value={item} onChange={(event) => updateEvidenceItem(question, evidenceIndex, event.target.value)} placeholder="For example, Current risk register" aria-label={`Evidence item ${evidenceIndex + 1} for question ${index + 1}`} />
                      <IconButton label={`Remove evidence item ${evidenceIndex + 1} from question ${index + 1}`} onClick={() => removeEvidenceItem(question, evidenceIndex)}><Trash2 size={16} /></IconButton>
                    </div>
                  ))}
                  <Button variant="tertiary" icon={<Plus size={16} />} onClick={() => addEvidenceItem(question)}>Add evidence item</Button>
                </div>
              </>}
            </div>
          </article>
        );
      })}
      <Button variant="secondary" icon={<Plus size={17} />} onClick={addQuestion}>Add question</Button>
    </div>
  );
}

function AdminRequirementNavigator({
  requirements,
  current,
  onNavigate,
  onViewAll,
  onClose,
}: {
  requirements: MasterRequirement[];
  current: MasterRequirement;
  onNavigate: (requirement: MasterRequirement) => void;
  onViewAll: () => void;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = requirements.filter((requirement) =>
    `${requirement.id} ${requirement.title} ${requirement.section}`.toLowerCase().includes(query.toLowerCase()),
  );
  const published = requirements.filter((requirement) => requirement.status === "Published").length;

  return (
    <aside className={cx("assessment-navigator admin-requirement-navigator flex h-full flex-col overflow-x-hidden overflow-y-auto border-r border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900")} aria-label="Master requirement navigator">
      <div className={cx("assessment-navigator__header mb-4 flex items-start justify-between gap-3")}>
        <div><p className={cx(eyebrowClasses)}>Master content</p><h2 className={cx("mt-0.5 text-base font-bold text-slate-900 dark:text-slate-100")}>Requirements</h2></div>
        {onClose && <IconButton label="Close requirement navigator" onClick={onClose}><X size={19} /></IconButton>}
      </div>
      <ProgressBar value={requirements.length ? Math.round((published / requirements.length) * 100) : 0} label="Requirements published" />
      <label className={cx("navigator-search my-4 flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-2.5 text-slate-500 focus-within:border-kc-blue-600 focus-within:ring-3 focus-within:ring-kc-blue-100 dark:border-slate-600 dark:text-slate-400 dark:focus-within:ring-kc-blue-900")}>
        <Search size={17} />
        <input className={cx("min-w-0 flex-1 border-0 bg-transparent text-sm outline-none")} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a requirement" />
      </label>
      <div className={cx("navigator-group flex-1")}>
        <div className={cx("navigator-group__trigger flex w-full items-center gap-2 border-0 bg-transparent px-1.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300")} aria-expanded="true"><ChevronDown size={17} /><span>Master requirements</span><small className={cx("ml-auto font-medium text-slate-500 dark:text-slate-400")}>{published} of {requirements.length}</small></div>
        <div className={cx("navigator-items mt-1 grid gap-0.5")}>
          {filtered.map((requirement) => {
            const isCurrent = requirement.id === current.id;
            return (
              <button
                className={cx(
                  "navigator-item flex min-h-13 w-full items-center gap-2.5 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800",
                  isCurrent && "navigator-item--current border-kc-blue-200 border-l-4 border-l-kc-blue-600 bg-kc-blue-100 pl-1.5 font-bold text-kc-blue-900 dark:border-kc-blue-800 dark:border-l-kc-blue-500 dark:bg-kc-blue-900 dark:text-kc-blue-100",
                )}
                key={requirement.id}
                onClick={() => onNavigate(requirement)}
              >
                {isCurrent ? (
                  <span className={cx("nav-state nav-state--current grid size-5 flex-none place-items-center rounded-full bg-kc-blue-600 text-white ring-3 ring-kc-blue-200 dark:ring-kc-blue-800")}><Circle size={12} fill="currentColor" /></span>
                ) : requirement.status === "Published" ? (
                  <CheckCircle2 size={17} className={cx("nav-state nav-state--complete flex-none text-emerald-700 dark:text-emerald-300")} />
                ) : (
                  <Circle size={16} className={cx("nav-state nav-state--incomplete flex-none text-slate-400 dark:text-slate-500")} />
                )}
                <span className={cx("grid min-w-0 flex-1 gap-0.5 text-sm font-semibold leading-tight")}><small className={cx("text-xs font-semibold text-slate-500 dark:text-slate-400")}>{requirement.id} · {requirement.section}</small>{requirement.title}</span>
                <ChevronRight size={16} className={cx("flex-none text-slate-400 dark:text-slate-500")} />
              </button>
            );
          })}
          {!filtered.length && <p className={cx("navigator-empty m-0 p-4 text-center text-sm text-slate-500 dark:text-slate-400")}>No requirements match your search.</p>}
        </div>
      </div>
      <Button className={cx("next-incomplete mt-4 w-full")} variant="secondary" icon={<ListChecks size={18} />} onClick={onViewAll}>All requirements</Button>
    </aside>
  );
}

const auditChangeBoxClass = "min-w-0 flex-1 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-900";
const auditChangeLabelClass = "text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400";
const auditChangeValueClass = "mt-1 text-sm leading-snug wrap-anywhere text-slate-800 dark:text-slate-200";

function RequirementAuditChangeDetail({ change }: { change: RequirementAuditChange }) {
  if (change.before !== undefined && change.after !== undefined) {
    return (
      <div className={cx("requirement-audit-change__diff flex min-w-0 flex-col items-stretch gap-2.5 md:flex-row md:items-center")}>
        <div className={cx(auditChangeBoxClass)}><span className={cx(auditChangeLabelClass)}>Before</span><p className={cx(auditChangeValueClass)}>{change.before}</p></div>
        <ArrowRight size={16} className={cx("mx-auto flex-none rotate-90 text-slate-400 md:rotate-0 dark:text-slate-500")} />
        <div className={cx(auditChangeBoxClass)}><span className={cx(auditChangeLabelClass)}>After</span><p className={cx(auditChangeValueClass)}>{change.after}</p></div>
      </div>
    );
  }
  return (
    <div className={cx("requirement-audit-change__single min-w-0", auditChangeBoxClass)}>
      <span className={cx(auditChangeLabelClass)}>{change.kind === "deleted" ? "Removed value" : "Recorded value"}</span>
      <p className={cx(auditChangeValueClass)}>{change.before ?? change.after ?? "No value"}</p>
    </div>
  );
}

export function AdminRequirementAuditScreen() {
  const { masterRequirements, requirementAuditLog } = useAdministration();
  const [query, setQuery] = useState("");
  const [requirementFilter, setRequirementFilter] = useState("all");
  const [target, setTarget] = useState<"all" | RequirementAuditTarget>("all");
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(() => new Set());
  const allEntries = [...requirementAuditLog].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  const requirementOptions = [...new Map(allEntries.map((entry) => [entry.requirementId, entry.requirementTitle])).entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, title]) => ({ value, label: `${value} · ${title}` }));
  const filteredEntries = allEntries
    .filter((entry) => requirementFilter === "all" || entry.requirementId === requirementFilter)
    .map((entry) => ({ ...entry, changes: target === "all" ? entry.changes : entry.changes.filter((change) => change.target === target) }))
    .filter((entry) => entry.changes.length > 0)
    .filter((entry) => `${entry.requirementId} ${entry.requirementTitle} ${entry.summary} ${entry.recordedBy.name} ${entry.recordedBy.email} ${entry.action} ${entry.batchId ?? ""} ${entry.changes.map((change) => `${change.label} ${change.before ?? ""} ${change.after ?? ""}`).join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100 requirement-audit-page")}>
      <PageHeader
        eyebrow="Administration"
        title="Requirement audit log"
        description="Review detailed changes across every master requirement, including questions, expected evidence, publishing state, and site scope."
        actions={<Button variant="primary" icon={<Download size={17} />} disabled={!filteredEntries.length} onClick={() => downloadTextFile("EHS360_requirement_audit_log.csv", requirementAuditCsv(filteredEntries))}>Export audit log</Button>}
      />
      <section className={cx(tableCardClass)}>
        <div className={cx(dashboardFilterBarClass)}>
          <label className={cx(searchControlClass)}><Search size={18} /><input className={cx(searchControlInputClass)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requirement, actor, action, or value" /></label>
          <Select label="Filter requirement" icon={<FileText size={18} />} searchable value={requirementFilter} onChange={setRequirementFilter} options={[{ value: "all", label: "All requirements" }, ...requirementOptions]} />
          <Select label="Filter change area" icon={<Filter size={18} />} value={target} onChange={(value) => setTarget(value as typeof target)} options={[{ value: "all", label: "All changes" }, ...Object.entries(requirementAuditTargetLabels).map(([value, label]) => ({ value, label }))]} />
        </div>
        <div className={cx(tableCardHeaderClass)}><div><p className={cx(eyebrowClasses)}>Recorded timeline</p><h2 className={cx(tableCardHeaderTitleClass)}>Requirement change history</h2></div><span className={cx(tableCardHeaderCountClass)}>{filteredEntries.length} of {allEntries.length} events shown</span></div>
        {filteredEntries.length ? (
          <div className={cx("requirement-audit-timeline relative grid gap-0 p-5 pl-18 before:absolute before:top-6 before:bottom-6 before:left-9 before:w-0.5 before:rounded-full before:bg-linear-to-b before:from-kc-blue-300 before:to-slate-200 md:pl-18 dark:before:from-kc-blue-800 dark:before:to-slate-700")}>
            {filteredEntries.map((entry) => {
              const expanded = expandedEntries.has(entry.id);
              const detailsId = `audit-entry-details-${entry.id}`;
              return (
              <article className={cx("requirement-audit-entry relative mb-4.5 rounded-xl border border-slate-200 bg-white shadow-sm last:mb-0 dark:border-slate-700 dark:bg-slate-900", expanded && "requirement-audit-entry--expanded")} key={entry.id}>
                <header className={cx("requirement-audit-entry__header flex flex-col items-start gap-3 rounded-xl bg-slate-50 p-4 md:flex-row md:justify-between dark:bg-slate-900", expanded && "border-b border-slate-200 md:rounded-b-none dark:border-slate-700")}>
                  <span className={cx("requirement-audit-entry__icon absolute top-3 -left-12 z-1 grid size-10 place-items-center rounded-full border-4 border-white bg-kc-blue-50 text-kc-blue-700 ring-1 ring-kc-blue-200 md:-left-14 dark:border-slate-900 dark:bg-kc-blue-950 dark:text-kc-blue-300")}><History size={19} /></span>
                  <div className={cx("min-w-0 flex-1")}>
                    <div className={cx("requirement-audit-entry__meta flex flex-wrap items-center gap-2")}><span className={cx(publishBadgeClass, pillTone.success)}>{requirementAuditActionLabels[entry.action]}</span><time className={cx("text-xs text-slate-500 dark:text-slate-400")} dateTime={entry.recordedAt}>{new Date(entry.recordedAt).toLocaleString()}</time></div>
                    {masterRequirements.some((requirement) => requirement.id === entry.requirementId) ? (
                      <Link className={cx("requirement-audit-entry__entity mt-1.5 inline-flex w-fit items-center gap-1 text-sm font-bold text-kc-blue-800 hover:text-kc-blue-600 hover:underline dark:text-kc-blue-200 dark:hover:text-kc-blue-400")} to={`/admin/requirements/${entry.requirementId}`}>{entry.requirementId} · {entry.requirementTitle}<ArrowRight size={14} /></Link>
                    ) : (
                      <span className={cx("requirement-audit-entry__entity requirement-audit-entry__entity--deleted mt-1.5 inline-flex w-fit items-center gap-1 text-sm font-bold text-slate-500 dark:text-slate-400")}>{entry.requirementId} · {entry.requirementTitle} · Deleted requirement</span>
                    )}
                    <h3 className={cx("mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100")}>{entry.summary}</h3>
                    <p className={cx("mt-1 text-xs wrap-anywhere text-slate-500 dark:text-slate-400")}>{entry.recordedBy.name} · {entry.recordedBy.email}{entry.batchId ? ` · Import ${entry.batchId}` : ""}</p>
                  </div>
                  <button
                    type="button"
                    className={cx("requirement-audit-entry__toggle inline-flex min-h-8 flex-none items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-slate-600 hover:border-kc-blue-300 hover:bg-kc-blue-50 hover:text-kc-blue-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-kc-blue-950 dark:hover:text-kc-blue-200")}
                    aria-expanded={expanded}
                    aria-controls={detailsId}
                    aria-label={`${expanded ? "Hide" : "Show"} ${entry.changes.length} change${entry.changes.length === 1 ? "" : "s"} for ${entry.requirementId}`}
                    onClick={() => setExpandedEntries((current) => {
                      const next = new Set(current);
                      if (next.has(entry.id)) next.delete(entry.id);
                      else next.add(entry.id);
                      return next;
                    })}
                  >
                    <span>{entry.changes.length} change{entry.changes.length === 1 ? "" : "s"}</span>
                    <ChevronDown size={15} className={cx("transition-transform", expanded && "rotate-180")} aria-hidden="true" />
                  </button>
                </header>
                {expanded && <ol className={cx("requirement-audit-changes m-0 grid list-none gap-2.5 p-4")} id={detailsId}>
                  {entry.changes.map((change, index) => (
                    <li className={cx("flex flex-col gap-4 rounded-xl border border-slate-200 p-3.5 md:flex-row dark:border-slate-700")} key={`${entry.id}-${index}`}>
                      <div className={cx("requirement-audit-change__header flex min-w-0 items-start gap-2.5 md:w-56 md:flex-none")}>
                        <span className={cx("requirement-audit-change__kind flex-none rounded-full px-2 py-1 text-xs font-bold capitalize", `requirement-audit-change__kind--${change.kind}`)}>{requirementAuditChangeKindLabel(change)}</span>
                        <div className={cx("grid min-w-0 gap-0.5")}><strong className={cx("text-sm leading-snug text-slate-900 dark:text-slate-100")}>{change.label}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>{requirementAuditTargetLabels[change.target]}</span></div>
                      </div>
                      <RequirementAuditChangeDetail change={change} />
                    </li>
                  ))}
                </ol>}
              </article>
              );
            })}
          </div>
        ) : <EmptyState icon={<Search size={28} />} title={allEntries.length ? "No audit entries match" : "No requirement changes recorded"} description={allEntries.length ? "Try another search or change-area filter." : "Future requirement, question, and expected-evidence changes will appear here."} />}
      </section>
    </div>
  );
}

export function AdminRequirementDetailScreen() {
  const { requirementId } = useParams();
  const navigate = useNavigate();
  const { masterRequirements, addMasterRequirement, updateMasterRequirement, removeMasterRequirement, sites, masterSections, masterSubSections } = useAdministration();
  const isNew = !requirementId;
  const existing = requirementId ? masterRequirements.find((item) => item.id === requirementId) : undefined;
  const defaultSection = masterSections[0] ?? "";
  const defaultSubSection = masterSubSections[0] ?? "";
  const siteOptions = buildSiteOptions(sites);
  const [draft, setDraft] = useState<MasterRequirement>(existing ?? { id: "", title: "", section: defaultSection, subsection: defaultSubSection, status: "Draft", siteIds: [], questions: [] });
  const [submitted, setSubmitted] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<MasterRequirement | "list" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // React reuses this route component when only :requirementId changes. Resetting the editor
  // from the route record keeps the header, fields, and left navigator in lockstep after a
  // requirement is selected from the navigator.
  useEffect(() => {
    setDraft(existing ?? { id: "", title: "", section: defaultSection, subsection: defaultSubSection, status: "Draft", siteIds: [], questions: [] });
    setSubmitted(false);
    setPendingNavigation(null);
  }, [defaultSection, defaultSubSection, existing, requirementId]);

  if (requirementId && !existing) {
    return (
      <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100")}>
        <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb"><Link className={cx(breadcrumbsLinkClass)} to="/admin/requirements">Master requirements</Link><ChevronRight size={15} /><span aria-current="page">Not found</span></nav>
        <EmptyState icon={<Search size={27} />} title="Requirement not found" description="This master requirement does not exist or was removed." />
      </div>
    );
  }

  const update = (key: keyof MasterRequirement, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const valid = Boolean(draft.id.trim() && draft.title.trim() && draft.section.trim() && draft.subsection.trim() && draft.questions.every((question) => question.text.trim()));
  // Union the draft's current value in, same as the site form does for Region/Segment — editing
  // an older requirement whose section was since removed from Config shouldn't silently blank it.
  const sectionOptions = [...new Set([...masterSections, ...(draft.section ? [draft.section] : [])])].map((value) => ({ value, label: value }));
  const subSectionOptions = [...new Set([...masterSubSections, ...(draft.subsection ? [draft.subsection] : [])])].map((value) => ({ value, label: value }));
  const hasUnsavedChanges = isNew || JSON.stringify(draft) !== JSON.stringify(existing);
  const navigatorCurrent = masterRequirements.find((item) => item.id === requirementId) ?? draft;

  function requestNavigation(target: MasterRequirement | "list") {
    setNavigatorOpen(false);
    if (target === "list" || target.id !== draft.id) {
      if (hasUnsavedChanges) { setPendingNavigation(target); return; }
      navigate(target === "list" ? "/admin/requirements" : `/admin/requirements/${target.id}`);
    }
  }

  function confirmNavigation() {
    const target = pendingNavigation;
    setPendingNavigation(null);
    if (!target) return;
    navigate(target === "list" ? "/admin/requirements" : `/admin/requirements/${target.id}`);
  }

  function save() {
    setSubmitted(true);
    if (!valid) return;
    const trimmedId = draft.id.trim();
    const duplicateId = isNew && masterRequirements.some((record) => record.id.toLowerCase() === trimmedId.toLowerCase());
    if (duplicateId) {
      navigate("/admin/requirements", { state: { feedback: `Requirement ${trimmedId} already exists. Open it to edit the existing record.` } });
      return;
    }
    const cleaned: MasterRequirement = {
      ...draft,
      id: trimmedId,
      title: draft.title.trim(),
      section: draft.section.trim(),
      subsection: draft.subsection.trim(),
      questions: draft.questions.map((question, index) => ({ ...question, number: String(index + 1), text: question.text.trim(), expectedEvidence: question.expectedEvidence.map((line) => line.trim()).filter(Boolean) })),
    };
    if (isNew) addMasterRequirement(cleaned); else updateMasterRequirement(cleaned);
    navigate("/admin/requirements", { state: { feedback: `${cleaned.id} was ${isNew ? "added" : "updated"}.` } });
  }

  return (
    <div className={cx("requirement-page admin-requirement-page min-w-0")}>
      <div className={cx(requirementMobileToolbarClass)} style={{ top: "var(--content-offset)", background: "var(--surface-mobile-bar)" }}>
        <Button variant="secondary" icon={<Menu size={18} />} onClick={() => setNavigatorOpen(true)}>Requirements</Button>
        <Button variant="secondary" onClick={() => requestNavigation("list")}>All requirements</Button>
      </div>
      <div className={cx(requirementLayoutClass)} style={{ minHeight: "calc(100vh - var(--content-offset))" }}>
        <div className={cx(requirementNavigatorWrapClass)} style={{ top: "var(--content-offset)", height: "calc(100vh - var(--content-offset))" }}>
          <AdminRequirementNavigator requirements={masterRequirements} current={navigatorCurrent} onNavigate={requestNavigation} onViewAll={() => requestNavigation("list")} />
        </div>
        <div className={cx(requirementMainClass)} style={{ paddingInline: "var(--page-gutter)" }}>
          <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb"><Link className={cx(breadcrumbsLinkClass)} to="/admin/requirements">Master requirements</Link><ChevronRight size={15} /><span aria-current="page">{isNew ? "New requirement" : draft.id}</span></nav>
          <header className={cx("requirement-header rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-5 dark:border-slate-700 dark:bg-slate-900")}>
            <div className={cx("requirement-header__meta flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400")}>
              <input
                className={cx(
                  "requirement-id-input min-w-0 max-w-full rounded-full border border-kc-blue-200 bg-kc-blue-50 px-2.5 py-1 text-xs font-bold text-kc-blue-800 outline-none disabled:opacity-75 focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200",
                  submitted && !draft.id.trim() && "field-invalid-input border-red-600! ring-3 ring-red-100 dark:border-red-400!",
                )}
                style={{ width: `${draft.id ? Math.max(8, draft.id.length + 2) : "For example, OS 2.4.1".length + 2}ch` }}
                value={draft.id}
                disabled={!isNew}
                onChange={(event) => update("id", event.target.value)}
                placeholder="For example, OS 2.4.1"
                aria-label="Requirement ID"
              />
              <Select label="Section" value={draft.section} onChange={(value) => update("section", value)} options={sectionOptions} />
              <Select label="Sub-Section" value={draft.subsection} onChange={(value) => update("subsection", value)} options={subSectionOptions} />
            </div>
            <div className={cx("requirement-header__title mt-3 grid items-start justify-between gap-4 md:flex")}>
              <div className={cx("min-w-0 md:flex-1")}>
                <p className={cx(eyebrowClasses)}>Requirement</p>
                <textarea
                  className={cx(
                    "requirement-title-input mt-0.5 w-full max-w-180 resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-lg leading-snug font-bold text-slate-900 outline-none focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-kc-blue-900",
                    submitted && !draft.title.trim() && "field-invalid-input border-red-600! ring-3 ring-red-100 dark:border-red-400!",
                  )}
                  rows={2}
                  value={draft.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="Requirement title"
                  aria-label="Requirement title"
                />
              </div>
              <div className={cx("requirement-header__controls flex flex-none flex-wrap items-center justify-end gap-2.5")}>
                <Select label="Status" value={draft.status} onChange={(value) => update("status", value)} options={[{ value: "Draft", label: "Draft" }, { value: "Published", label: "Published" }]} />
              </div>
            </div>
            <div className={cx("requirement-header__footer mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400")}>
              <span>{draft.siteIds.length ? `${draft.siteIds.length} of ${sites.length} sites scoped` : "Applies to all sites"}</span>
            </div>
            <div className={cx(fieldWideWrapClass, "mt-4")}>
              <span className={cx(fieldLabelRowClass)}>Sites <small className={cx("text-xs font-normal text-slate-500 dark:text-slate-400")}>Leave empty to apply to all sites</small></span>
              <CheckboxList label="Sites" searchable options={siteOptions} selected={draft.siteIds} onChange={(values) => setDraft((current) => ({ ...current, siteIds: values }))} />
              <div className={cx("requirement-selected-sites flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400")} aria-live="polite">
                <strong className={cx("text-xs text-slate-800 dark:text-slate-200")}>Selected sites</strong>
                {draft.siteIds.length ? (
                  <span className={cx("requirement-selected-sites__list flex flex-wrap gap-1.5")}>{siteOptions.filter((site) => draft.siteIds.includes(site.value)).map((site) => <span className={cx("rounded-full border border-kc-blue-200 bg-kc-blue-50 px-1.5 py-0.5 text-xs font-semibold text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")} key={site.value}>{site.label}</span>)}</span>
                ) : <span>All sites</span>}
              </div>
            </div>
            {submitted && !valid && <InlineMessage className={cx("mt-4")} tone="danger" title="Complete required fields">Requirement ID, title, section, and text for every question are required before saving.</InlineMessage>}
          </header>
          <section className={cx("questions-section mt-6")} aria-labelledby="admin-questions-title">
            <div className={cx("section-title-row mb-4 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between")}>
              <div><p className={cx(eyebrowClasses)}>Assessment questions</p><h2 className={cx("mt-0.5 text-lg font-bold text-slate-900 dark:text-slate-100")} id="admin-questions-title">Add, edit, or remove questions</h2></div>
              <span className={cx(questionCountClass)}>{draft.questions.length} questions</span>
            </div>
            <QuestionsEditor questions={draft.questions} onChange={(questions) => setDraft((current) => ({ ...current, questions }))} requirementId={draft.id} submitted={submitted} />
          </section>
          <footer
            className={cx("requirement-footer sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-5 mt-6 grid w-full grid-cols-2 items-center gap-2.5 rounded-xl border p-2 shell:bottom-4 shell:flex shell:justify-between shell:gap-3.5 shell:p-2.5")}
            style={{
              borderColor: "var(--border-translucent)",
              background: "var(--surface-translucent)",
              boxShadow: "0 12px 34px rgb(15 23 42 / 0.12)",
              backdropFilter: "blur(18px)",
            }}
          >
            <div className={cx("flex w-full items-center gap-3.5 shell:w-auto")}><Button variant="secondary" onClick={() => navigate("/admin/requirements")}>Cancel</Button>{!isNew && <Button variant="tertiary" icon={<Trash2 size={17} />} onClick={() => setDeleteConfirmOpen(true)}>Delete requirement</Button>}</div>
            <Button variant="primary" icon={<Check size={17} />} onClick={save}>{isNew ? "Add requirement" : "Save changes"}</Button>
          </footer>
        </div>
      </div>
      {navigatorOpen && (
        <div className={cx(sheetLayerClass)}>
          <button className={cx(sheetBackdropClass)} aria-label="Close requirement navigator" onClick={() => setNavigatorOpen(false)} />
          <div className={cx(sheetClass, "sheet--left")}>
            <AdminRequirementNavigator requirements={masterRequirements} current={navigatorCurrent} onNavigate={requestNavigation} onViewAll={() => requestNavigation("list")} onClose={() => setNavigatorOpen(false)} />
          </div>
        </div>
      )}
      {pendingNavigation && <ConfirmDialog eyebrow="Unsaved changes" title="Leave this requirement without saving?" body="Your changes to this requirement will be discarded. Save changes before continuing if you want to keep them." confirmLabel="Leave without saving" cancelLabel="Keep editing" onCancel={() => setPendingNavigation(null)} onConfirm={confirmNavigation} />}
      {deleteConfirmOpen && <ConfirmDialog eyebrow="Master requirement" title={`Delete ${draft.id}?`} body="This permanently removes the master requirement and its matching site-assessment requirement, including question-scoped evidence." confirmLabel="Delete requirement" cancelLabel="Keep requirement" onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { removeMasterRequirement(draft.id); navigate("/admin/requirements", { state: { feedback: `${draft.id} was deleted.` } }); }} />}
    </div>
  );
}

export function AdminRequirementsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { masterRequirements, updateMasterRequirement, addMasterRequirement, removeMasterRequirement, sites, masterSections } = useAdministration();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("All sections");
  const [status, setStatus] = useState("Published and draft");
  const [siteFilter, setSiteFilter] = useState("all");
  const [menu, setMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<MasterRequirement | null>(null);
  // Add/edit now happens on its own page (AdminRequirementDetailScreen); it hands the save
  // outcome back via router state rather than a local callback.
  const [feedback, setFeedback] = useState(() => (location.state as { feedback?: string } | null)?.feedback ?? "");
  // The row menu previously only closed by re-clicking its own trigger, so clicking anywhere
  // else left it hanging open (and opening another row's menu left both visible).
  useEffect(() => {
    if (!menu) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!(event.target as HTMLElement).closest(".row-actions--menu")) setMenu(null);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menu]);
  const rows = masterRequirements.filter((item) =>
    (`${item.title} ${item.id}`.toLowerCase().includes(query.toLowerCase())) &&
    (section === "All sections" || item.section === section) &&
    (status === "Published and draft" || item.status === status) &&
    (siteFilter === "all" || item.siteIds.length === 0 || item.siteIds.includes(siteFilter)));
  return (
    <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100")}>
      <PageHeader
        eyebrow="Administration"
        title="Master data"
        description="Manage governed requirements, questions, evidence, publishing state, and approved imports."
        actions={
          <div className={cx("flex flex-wrap items-center justify-end gap-2")}>
            <div className={cx("inline-flex items-stretch rounded-lg border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800")} aria-label="Requirement import actions">
              <IconButton
                label="Download import template"
                tooltipPlacement="bottom"
                className={cx("rounded-r-none border-r border-slate-300 dark:border-slate-600")}
                onClick={() => downloadStaticFile(`${assetBaseUrl}templates/Maitsys-Assure-Master-Requirement-Import-Template.xlsx`, "EHS360 Master Requirement Import Template.xlsx")}
              >
                <Download size={18} />
              </IconButton>
              <Button variant="secondary" className={cx("rounded-l-none border-0 px-4")} icon={<Upload size={17} />} onClick={() => navigate("/admin/imports")}>
                Import
              </Button>
            </div>
            <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate("/admin/requirements/new")} data-tour="add-requirement">Add requirement</Button>
          </div>
        }
      />
      {feedback && <InlineMessage tone={feedback.includes("already exists") ? "warning" : "success"} title={feedback.includes("already exists") ? "Requirement not added" : "Master content saved"}>{feedback}</InlineMessage>}
      <section className={cx(tableCardClass)}>
        <div className={cx(dashboardFilterBarClass)} data-tour="requirement-filters">
          <label className={cx(searchControlClass)}><Search size={18} /><input className={cx(searchControlInputClass)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID or requirement" /></label>
          <Select label="Filter section" icon={<Filter size={18} />} value={section} onChange={setSection} options={["All sections", ...masterSections].map((value) => ({ value, label: value }))} />
          <Select label="Filter publishing state" icon={<FileText size={18} />} value={status} onChange={setStatus} options={["Published and draft", "Published", "Draft"].map((value) => ({ value, label: value }))} />
          <Select label="Filter site" icon={<Building2 size={18} />} searchable value={siteFilter} onChange={setSiteFilter} options={[{ value: "all", label: "All sites" }, ...sites.map((site) => ({ value: site.id, label: site.name }))]} />
        </div>
        <div className={cx(tableCardHeaderClass)}><div><p className={cx(eyebrowClasses)}>Governed content</p><h2 className={cx(tableCardHeaderTitleClass)}>Requirements</h2></div><span className={cx(tableCardHeaderCountClass)}>{rows.length} records shown</span></div>
        {rows.length ? (
          <div className={cx(dataTableWrapClass)}>
            <table className={cx(dataTableClass, "data-table--requirements")}>
              <thead className={cx(dataTableHeadClass)}><tr>
                <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>ID</th>
                <th className={cx(dataTableHeaderCellClass, "shell:w-1/4")}>Requirement</th>
                <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>Section</th>
                <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>Sites</th>
                <th className={cx(dataTableHeaderCellClass, "shell:w-1/12")}>Status</th>
                <th className={cx(dataTableHeaderCellClass, "shell:w-1/6")}>Actions</th>
              </tr></thead>
              <tbody className={cx(dataTableBodyClass)}>{rows.map((item) => (
                <tr className={cx(dataTableRowClass, dataTableRowLinkClass)} key={item.id} onClick={() => navigate(`/admin/requirements/${item.id}`)}>
                  <td className={cx(dataTableCellClass)} data-label="ID"><span className={cx(dataTableCellLabelClass)}>ID</span><strong className={cx("text-slate-900 dark:text-slate-100")}>{item.id}</strong></td>
                  <td className={cx(dataTableCellClass)} data-label="Requirement"><span className={cx(dataTableCellLabelClass)}>Requirement</span><span className={cx("grid min-w-0 gap-0.5")}><strong className={cx("block text-slate-900 dark:text-slate-100")}>{item.title}</strong><span className={cx("block text-xs text-slate-500 dark:text-slate-400")}>Guidance and evidence requirements configured</span></span></td>
                  <td className={cx(dataTableCellClass)} data-label="Section"><span className={cx(dataTableCellLabelClass)}>Section</span>{item.section}</td>
                  <td className={cx(dataTableCellClass)} data-label="Sites" title={siteCodesSummary(sites, item.siteIds).title}><span className={cx(dataTableCellLabelClass)}>Sites</span>{siteCodesSummary(sites, item.siteIds).text}</td>
                  <td className={cx(dataTableCellClass)} data-label="Status"><span className={cx(dataTableCellLabelClass)}>Status</span><span className={cx(publishBadgeClass, item.status === "Draft" ? cx("publish-badge--draft", pillTone.provisional) : pillTone.success)}>{item.status}</span></td>
                  <td className={cx(dataTableLastCellClass)} data-label="Actions">
                    <span className={cx(rowActionsClass, "row-actions--menu relative")}>
                      <IconButton label={`Edit ${item.id}`} onClick={(event) => { event.stopPropagation(); navigate(`/admin/requirements/${item.id}`); }}><Pencil size={17} /></IconButton>
                      <IconButton label={`More actions for ${item.id}`} onClick={(event) => { event.stopPropagation(); setMenu(menu === item.id ? null : item.id); }}><MoreHorizontal size={18} /></IconButton>
                      {menu === item.id && (
                        <span className={cx(rowMenuClass)} onClick={(event) => event.stopPropagation()}>
                          <button className={cx(rowMenuButtonClass)} onClick={() => { updateMasterRequirement({ ...item, status: item.status === "Published" ? "Draft" : "Published" }); setFeedback(`${item.id} status changed to ${item.status === "Published" ? "Draft" : "Published"}.`); setMenu(null); }}>{item.status === "Published" ? "Move to draft" : "Publish"}</button>
                          <button className={cx(rowMenuButtonClass)} onClick={() => { const copy = { ...item, id: `${item.id}-COPY-${Date.now().toString().slice(-4)}`, title: `${item.title} copy`, status: "Draft" as const, importBatchId: undefined }; addMasterRequirement(copy); setFeedback(`${item.id} was duplicated as a draft.`); setMenu(null); }}><Copy size={15} /> Duplicate</button>
                          <button className={cx("row-menu__delete", rowMenuDeleteButtonClass)} onClick={() => { setDeleting(item); setMenu(null); }}><Trash2 size={15} /> Delete requirement</button>
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState icon={<Search size={27} />} title="No requirements match" description="Try another ID, title, section, publishing state, or site." />}
      </section>
      {deleting && <ConfirmDialog eyebrow="Master requirement" title={`Delete ${deleting.id}?`} body="This permanently removes the master requirement and its matching site-assessment requirement, including question-scoped evidence." confirmLabel="Delete requirement" cancelLabel="Keep requirement" onCancel={() => setDeleting(null)} onConfirm={() => { removeMasterRequirement(deleting.id); setFeedback(`${deleting.id} was deleted.`); setDeleting(null); }} />}
    </div>
  );
}

const roleLabels: Record<SiteUserRole, string> = {
  "site-contributor": "Site contributor",
  administrator: "Administrator",
};

function SiteUserDialog({ user, siteId, onClose, onSave }: { user?: SiteUser; siteId: string; onClose: () => void; onSave: (user: SiteUser) => void }) {
  const [draft, setDraft] = useState<SiteUser>(user ?? { id: `su-${Date.now().toString().slice(-6)}`, name: "", email: "", role: "site-contributor", siteId, status: "Active" });
  const [submitted, setSubmitted] = useState(false);
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim());
  const valid = Boolean(draft.name.trim()) && emailValid;
  return (
    <div className={cx(dialogLayerClass)}>
      <button className={cx(dialogBackdropClass)} aria-label="Close user editor" onClick={onClose} />
      <section className={cx(dialogClass)} role="dialog" aria-modal="true" aria-labelledby="site-user-dialog-title">
        <div className={cx(dialogHeaderClass)}><div><p className={cx(eyebrowClasses)}>Site access</p><h2 className={cx(dialogHeaderTitleClass)} id="site-user-dialog-title">{user ? `Edit ${user.name}` : "Assign user to site"}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
        <div className={cx(dialogFormClass)}>
          <label className={cx(fieldWideWrapClass)}>
            <span className={cx(fieldLabelRowClass)}>Full name <b className={cx(fieldRequiredMarkClass)}>Required</b></span>
            <input className={cx(fieldInputClass, submitted && !draft.name.trim() && fieldInvalidClass)} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="For example, Maya Patel" />
            {submitted && !draft.name.trim() && <small className={cx(fieldErrorClass)}>Enter a name for this person.</small>}
          </label>
          <label className={cx(fieldWideWrapClass)}>
            <span className={cx(fieldLabelRowClass)}>Email <b className={cx(fieldRequiredMarkClass)}>Required</b></span>
            <input className={cx(fieldInputClass, submitted && !emailValid && fieldInvalidClass)} type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="name@example.com" />
            {submitted && !emailValid && <small className={cx(fieldErrorClass)}>Enter a valid email address.</small>}
          </label>
          <label className={cx(fieldWideWrapClass)}>
            <span className={cx(fieldLabelRowClass)}>Status</span>
            <Select label="Status" value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value as SiteUser["status"] }))} options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
          </label>
        </div>
        <div className={cx(dialogFooterClass)}><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Check size={17} />} onClick={() => { setSubmitted(true); if (valid) onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim() }); }}>{user ? "Save changes" : "Assign user"}</Button></div>
      </section>
    </div>
  );
}

export function AdminSiteDetailScreen() {
  const { siteId } = useParams();
  const { siteUsers, ownerRecords, siteContacts, sites, addSiteUser, updateSiteUser, removeSiteUser, notify } = useAdministration();
  const [editing, setEditing] = useState<SiteUser | "new" | null>(null);
  const [removing, setRemoving] = useState<SiteUser | null>(null);
  const [feedback, setFeedback] = useState("");
  const site = sites.find((item) => item.id === siteId);
  if (!site) {
    return (
      <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100")}>
        <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb"><Link className={cx(breadcrumbsLinkClass)} to="/admin/sites">Sites</Link><ChevronRight size={15} /><span aria-current="page">Not found</span></nav>
        <EmptyState icon={<Search size={27} />} title="Site not found" description="This site is not part of the KC site network." />
      </div>
    );
  }
  // Narrowed `site` does not survive into the callbacks below, so capture it once.
  const currentSite = site;
  const users = siteUsers.filter((user) => user.siteId === currentSite.id);
  // Owners and contacts are still single global records rather than per-site, so only the one
  // site with real recorded data shows them; everything else gets an honest empty state rather
  // than another site's people presented as its own.
  const hasRealSiteRecords = currentSite.id === "northstar";

  function saveUser(user: SiteUser) {
    const isNew = editing === "new";
    const duplicate = isNew && siteUsers.some((record) => record.email.toLowerCase() === user.email.toLowerCase() && record.siteId === user.siteId);
    if (duplicate) { setFeedback(`${user.email} is already assigned to this site.`); setEditing(null); return; }
    if (isNew) addSiteUser(user); else updateSiteUser(user);
    notify({
      title: isNew ? `${user.name} assigned to ${currentSite.name}` : `${user.name} updated for ${currentSite.name}`,
      body: `${roleLabels[user.role]} · ${user.status}`,
      category: "assignment",
      audience: ["administrator"],
      link: `/admin/sites/${currentSite.id}`,
      siteId: currentSite.id,
    });
    setFeedback(`${user.name} was ${isNew ? "assigned to" : "updated for"} ${currentSite.name}.`);
    setEditing(null);
  }

  return (
    <div style={{ paddingInline: "var(--page-gutter)" }} className={cx("page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100")}>
      <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb"><Link className={cx(breadcrumbsLinkClass)} to="/admin/sites">Sites</Link><ChevronRight size={15} /><span aria-current="page">{site.name}</span></nav>
      <PageHeader eyebrow="Administration" title={site.name} description={`${site.code} · ${site.region} · ${site.segment}`} actions={<>
        <Button variant="secondary" icon={<Plus size={18} />} onClick={() => setEditing("new")}>Assign user</Button>
        <Link className={cx(linkButtonBaseClass, "min-h-10 px-4 py-2.5 bg-kc-blue-600 text-white hover:bg-kc-blue-700 active:bg-kc-blue-800")} to={`/sites/${site.id}`}><ListChecks size={18} /><span>View assessment</span></Link>
      </>} />
      {feedback && <InlineMessage tone={feedback.includes("already assigned") ? "warning" : "success"} title={feedback.includes("already assigned") ? "User not assigned" : "Site access updated"}>{feedback}</InlineMessage>}

      <div className={cx(metricsGridClass)}>
        <MetricCard label="Completion" value={`${site.completion}%`} detail="Assessment completion" icon={<Target size={21} />} tone="brand" />
        <MetricCard label="Open gaps" value={site.gaps} detail="No and Partial responses" icon={<AlertCircle size={21} />} tone={site.gaps > 20 ? "danger" : "neutral"} />
        <MetricCard label="Last updated" value={site.updated} detail="Current assessment record" icon={<History size={21} />} />
        <MetricCard label="Assigned users" value={users.length} detail={`${users.filter((user) => user.status === "Active").length} active`} icon={<UsersRound size={21} />} />
      </div>

      <section className={cx(tableCardClass)}>
        <div className={cx(tableCardHeaderClass)}><div><p className={cx(eyebrowClasses)}>Site access</p><h2 className={cx(tableCardHeaderTitleClass)}>Assigned users</h2></div><span className={cx(tableCardHeaderCountClass)}>{users.length} user{users.length === 1 ? "" : "s"}</span></div>
        {users.length ? (
          <div className={cx(dataTableWrapClass)}>
            <table className={cx(dataTableClass)}>
              <thead className={cx(dataTableHeadClass)}><tr><th className={cx(dataTableHeaderCellClass)}>Name</th><th className={cx(dataTableHeaderCellClass)}>Email</th><th className={cx(dataTableHeaderCellClass)}>Role</th><th className={cx(dataTableHeaderCellClass)}>Status</th><th className={cx(dataTableHeaderCellClass)}>Actions</th></tr></thead>
              <tbody className={cx(dataTableBodyClass)}>{users.map((user, index) => {
                const cellClass = cx(dataTableCellClass, index === users.length - 1 && "shell:border-b-0");
                const lastCellClass = cx(dataTableLastCellClass, index !== users.length - 1 && "shell:border-b");
                return (
                  <tr className={cx(dataTableRowClass)} key={user.id}>
                    <td className={cellClass} data-label="Name"><span className={cx(dataTableCellLabelClass)}>Name</span><strong className={cx("text-slate-900 dark:text-slate-100")}>{user.name}</strong></td>
                    <td className={cellClass} data-label="Email"><span className={cx(dataTableCellLabelClass)}>Email</span>{user.email}</td>
                    <td className={cellClass} data-label="Role"><span className={cx(dataTableCellLabelClass)}>Role</span>{roleLabels[user.role]}</td>
                    <td className={cellClass} data-label="Status"><span className={cx(dataTableCellLabelClass)}>Status</span><span className={cx(publishBadgeClass, user.status === "Inactive" ? cx("publish-badge--draft", pillTone.provisional) : pillTone.success)}>{user.status}</span></td>
                    <td className={lastCellClass} data-label="Actions"><span className={cx(dataTableCellLabelClass)}>Actions</span><span className={cx(rowActionsClass)}><IconButton label={`Edit ${user.name}`} onClick={() => setEditing(user)}><Pencil size={17} /></IconButton><IconButton label={`Remove ${user.name} from this site`} onClick={() => setRemoving(user)}><Trash2 size={17} /></IconButton></span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <EmptyState icon={<UsersRound size={27} />} title="No users assigned" description="Assign a user to give them access to this site's workspace." />}
      </section>

      <section className={cx("page-section mt-9")}>
        <div className={cx(sectionTitleRowClass)}><div><p className={cx(eyebrowClasses)}>Read-only</p><h2 className={cx("mt-1 text-lg font-bold text-slate-900 dark:text-slate-100")}>Program &amp; standard owners</h2></div></div>
        <OwnersPanel owners={hasRealSiteRecords ? ownerRecords : null} />
      </section>

      <section className={cx("page-section mt-9")}>
        <div className={cx(sectionTitleRowClass)}><div><p className={cx(eyebrowClasses)}>Read-only</p><h2 className={cx("mt-1 text-lg font-bold text-slate-900 dark:text-slate-100")}>Site information</h2></div></div>
        <ContactsPanel contacts={hasRealSiteRecords ? siteContacts : null} />
      </section>

      {editing && <SiteUserDialog user={editing === "new" ? undefined : editing} siteId={site.id} onClose={() => setEditing(null)} onSave={saveUser} />}
      {removing && <ConfirmDialog eyebrow="Site access" title={`Remove ${removing.name} from this site?`} body={`${removing.name} will lose access to ${currentSite.name}. This does not delete any assessment work they have recorded.`} confirmLabel="Remove user" cancelLabel="Keep user" onCancel={() => setRemoving(null)} onConfirm={() => { removeSiteUser(removing.id); setFeedback(`${removing.name} was removed from ${currentSite.name}.`); setRemoving(null); }} />}
    </div>
  );
}

const SITE_TEMPLATE_COLUMNS = ["Site Name", "Site Code", "Region", "Segment", "User 1 Name", "User 1 Email", "User 2 Name", "User 2 Email", "User 3 Name", "User 3 Email"] as const;
const SITE_CSV_COLUMNS = SITE_TEMPLATE_COLUMNS.join(", ");

function slugifySiteId(code: string) {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `site-${Date.now().toString().slice(-6)}`;
}

function blankSite(): DashboardSite {
  return { id: "", name: "", code: "", region: "", segment: "", completion: 0, performance: "not-assessed", gaps: 0, updated: "Not started" };
}


function SiteDialog({ site, existing, regions, segments, onClose, onSave }: { site?: DashboardSite; existing: DashboardSite[]; regions: string[]; segments: string[]; onClose: () => void; onSave: (site: DashboardSite) => void }) {
  const [draft, setDraft] = useState<DashboardSite>(site ?? blankSite());
  const [submitted, setSubmitted] = useState(false);
  const trimmedCode = draft.code.trim();
  const duplicateCode = Boolean(trimmedCode) && existing.some((item) => item.code.toLowerCase() === trimmedCode.toLowerCase() && item.id !== draft.id);
  const valid = Boolean(draft.name.trim() && trimmedCode && draft.region.trim() && draft.segment.trim()) && !duplicateCode;
  const set = (key: keyof DashboardSite, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  return (
    <div className={cx(dialogLayerClass)}>
      <button className={cx(dialogBackdropClass)} aria-label="Close site editor" onClick={onClose} />
      <section className={cx(dialogClass)} role="dialog" aria-modal="true" aria-labelledby="site-dialog-title">
        <div className={cx(dialogHeaderClass)}><div><p className={cx(eyebrowClasses)}>Site network</p><h2 className={cx(dialogHeaderTitleClass)} id="site-dialog-title">{site ? `Edit ${site.name}` : "Create site"}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
        <div className={cx(dialogFormClass)}>
          <label className={cx(fieldWideWrapClass)}>
            <span className={cx(fieldLabelRowClass)}>Site name <b className={cx(fieldRequiredMarkClass)}>Required</b></span>
            <input className={cx(fieldInputClass, submitted && !draft.name.trim() && fieldInvalidClass)} value={draft.name} onChange={(event) => set("name", event.target.value)} placeholder="For example, Northstar Manufacturing" />
            {submitted && !draft.name.trim() && <small className={cx(fieldErrorClass)}>Enter the site name.</small>}
          </label>
          <label className={cx(fieldClass)}>
            <span className={cx(fieldLabelRowClass)}>Site code <b className={cx(fieldRequiredMarkClass)}>Required</b></span>
            <input className={cx(fieldInputClass, ((submitted && !trimmedCode) || duplicateCode) && fieldInvalidClass)} value={draft.code} onChange={(event) => set("code", event.target.value)} placeholder="KC-NSM-042" />
            {submitted && !trimmedCode && <small className={cx(fieldErrorClass)}>Enter the KC site code.</small>}
            {duplicateCode && <small className={cx(fieldErrorClass)}>This site code already exists.</small>}
          </label>
          <label className={cx(fieldClass)}>
            <span className={cx(fieldLabelRowClass)}>Region <b className={cx(fieldRequiredMarkClass)}>Required</b></span>
            <Select
              label="Region"
              value={draft.region}
              onChange={(value) => set("region", value)}
              options={[
                { value: "", label: "Select region" },
                ...[...new Set([...regions, ...(draft.region ? [draft.region] : [])])].sort().map((value) => ({ value, label: value })),
              ]}
            />
            {submitted && !draft.region.trim() && <small className={cx(fieldErrorClass)}>Choose the region.</small>}
          </label>
          <label className={cx(fieldWideWrapClass)}>
            <span className={cx(fieldLabelRowClass)}>Segment <b className={cx(fieldRequiredMarkClass)}>Required</b></span>
            <Select
              label="Segment"
              value={draft.segment}
              onChange={(value) => set("segment", value)}
              options={[
                { value: "", label: "Select segment" },
                ...[...new Set([...segments, ...(draft.segment ? [draft.segment] : [])])].sort().map((value) => ({ value, label: value })),
              ]}
            />
            {submitted && !draft.segment.trim() && <small className={cx(fieldErrorClass)}>Choose the business segment.</small>}
          </label>
        </div>
        <div className={cx(dialogFooterClass)}>
          <Button variant="tertiary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={<Check size={17} />} onClick={() => {
            setSubmitted(true);
            if (!valid) return;
            onSave({ ...draft, name: draft.name.trim(), code: trimmedCode, region: draft.region.trim(), segment: draft.segment.trim(), id: draft.id || slugifySiteId(trimmedCode) });
          }}>{site ? "Save changes" : "Create site"}</Button>
        </div>
      </section>
    </div>
  );
}

interface ParsedSiteRow {
  site: DashboardSite;
  users: { name: string; email: string }[];
}
interface SiteImportOutcome {
  parsed: ParsedSiteRow[];
  invalid: string[];
}

/** Minimal CSV reader: handles quoted fields and embedded commas, which is all the site
 *  columns need. The styled .xlsx template puts a title/description/blank row before the real
 *  header (matching the Master Requirement Import Template's layout), so this searches for the
 *  header row by column name rather than assuming it's the first line — a plain CSV export
 *  (header on line 1) still parses the same way. Rows missing a required column are reported
 *  rather than silently dropped; a user slot needs both its name and email or it's skipped. */
function parseSitesCsv(text: string): SiteImportOutcome {
  // Excel writes a UTF-8 BOM; strip it by code point rather than embedding the literal
  // character in a regex, which trips the no-irregular-whitespace lint rule.
  const body = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const lines = body.split(/\r?\n/).filter((line) => line.trim());
  const invalid: string[] = [];
  const parsed: ParsedSiteRow[] = [];
  const splitRow = (line: string) => {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted;
      } else if (char === "," && !quoted) { cells.push(cell); cell = ""; } else cell += char;
    }
    cells.push(cell);
    return cells.map((value) => value.trim());
  };
  // The styled template marks required columns with a trailing " *" (e.g. "Site Name *"),
  // matching the Master Requirement Import Template's own convention — strip it before matching.
  const stripRequiredMark = (cell: string) => cell.trim().replace(/\s*\*$/, "");
  const rows = lines.map(splitRow);
  const headerIndex = rows.findIndex((row) => {
    const normalized = row.map((cell) => stripRequiredMark(cell).toLowerCase());
    return normalized.includes("site name") && normalized.includes("site code");
  });
  if (headerIndex < 0) return { parsed: [], invalid: [] };
  const headers = rows[headerIndex].map((cell) => stripRequiredMark(cell).toLowerCase());
  const columnIndex = (column: string) => headers.indexOf(column.toLowerCase());
  const nameIndex = columnIndex("Site Name");
  const codeIndex = columnIndex("Site Code");
  const regionIndex = columnIndex("Region");
  const segmentIndex = columnIndex("Segment");
  const userSlots = [1, 2, 3].map((slot) => ({ nameIndex: columnIndex(`User ${slot} Name`), emailIndex: columnIndex(`User ${slot} Email`) }));

  rows.slice(headerIndex + 1).forEach((cells, offset) => {
    if (!cells.some((cell) => cell)) return; // fully blank row — a spacer, not data
    const rowNumber = headerIndex + offset + 2; // 1-based spreadsheet row number
    const name = cells[nameIndex] ?? "";
    const code = cells[codeIndex] ?? "";
    const region = cells[regionIndex] ?? "";
    const segment = cells[segmentIndex] ?? "";
    if (!name || !code || !region || !segment) { invalid.push(`Row ${rowNumber}: needs Site Name, Site Code, Region, and Segment.`); return; }
    const users: { name: string; email: string }[] = [];
    userSlots.forEach(({ nameIndex: userNameIndex, emailIndex: userEmailIndex }) => {
      const userName = (cells[userNameIndex] ?? "").trim();
      const userEmail = (cells[userEmailIndex] ?? "").trim();
      if (!userName && !userEmail) return;
      if (!userName || !userEmail) { invalid.push(`Row ${rowNumber}: a user needs both a name and an email — that user was skipped.`); return; }
      users.push({ name: userName, email: userEmail });
    });
    parsed.push({ site: { ...blankSite(), id: slugifySiteId(code), name, code, region, segment }, users });
  });
  return { parsed, invalid };
}
