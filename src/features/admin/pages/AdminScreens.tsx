import { useEffect, useRef, useState } from "react";
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
  FileCheck2,
  FileInput,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  ListChecks,
  MoreHorizontal,
  Menu,
  Paperclip,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Target,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import { useAdministration } from "../model/useAdministration";
import type { ImportHistoryRecord } from "../../../data-access/contracts";

import type { DashboardSite, MasterQuestion, MasterRequirement, RequirementAuditAction, RequirementAuditChange, RequirementAuditTarget, SiteUser, SiteUserRole } from "../../../shared/types";
import { Button, CheckboxList, ConfirmDialog, EmptyState, IconButton, InlineMessage, MetricCard, PageHeader, ProgressBar, Select } from "../../../shared/ui/UI";
import { ContactsPanel, OwnersPanel } from "../../sites/components/SitePanels";
import { cx } from "../../../shared/utils";

const importSteps = ["Select sites", "Upload", "Inspect", "Map", "Validate", "Confirm", "Result"];

const TARGET_FIELDS = [
  { value: "requirement_id", label: "requirement_id" },
  { value: "requirement_text", label: "requirement_text" },
  { value: "question_number", label: "question_number" },
  { value: "question_text", label: "question_text" },
  { value: "guidance", label: "guidance" },
  { value: "expected_evidence", label: "expected_evidence" },
  { value: "evidence_required", label: "evidence_required" },
  { value: "subsection", label: "subsection" },
  { value: "section", label: "section" },
];

interface ColumnMapping {
  source: string;
  target: string;
  sample: string;
  needsReview: boolean;
}

const INITIAL_MAPPINGS: ColumnMapping[] = [
  { source: "Requirement ID", target: "requirement_id", sample: "OS 1.2.1", needsReview: false },
  { source: "Requirement text", target: "requirement_text", sample: "Site leadership establishes...", needsReview: false },
  { source: "Question number", target: "question_number", sample: "1", needsReview: false },
  { source: "Assessment question", target: "question_text", sample: "Are leadership responsibilities documented?", needsReview: false },
  { source: "How to meet", target: "guidance", sample: "Assign clear accountabilities...", needsReview: false },
  { source: "Evidence requirements", target: "expected_evidence", sample: "Leadership matrix...", needsReview: false },
  { source: "Sub-section", target: "subsection", sample: "1.2 Leadership commitment", needsReview: false },
];

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

function StepIndicator({ current }: { current: number }) {
  return <ol className={cx("step-indicator [display:grid] [grid-template-columns:repeat(7,_1fr)] [margin:0] [border-bottom:1px_solid_var(--neutral-200)] [padding:1rem] [list-style:none] max-[740px]:[display:grid] max-[740px]:[overflow:visible] max-[740px]:[grid-template-columns:repeat(7,_minmax(0,_1fr))] max-[740px]:[padding:0.85rem_0.45rem]")} aria-label="Import progress" data-tour="import-steps">{importSteps.map((step, index) => {
    const state = index < current ? "complete" : index === current ? "current" : "upcoming";
    return <li className={cx("step-item [position:relative] [display:grid] [justify-items:center] [gap:0.35rem] [color:var(--neutral-400)] [font-size:0.68rem] after:[position:absolute] after:[z-index:0] after:[top:16px] after:[right:-50%] after:[width:100%] after:[height:2px] after:[background:var(--neutral-200)] after:[content:''] [&:last-child::after]:[display:none] [&_>_span]:[position:relative] [&_>_span]:[z-index:1] [&_>_span]:[display:grid] [&_>_span]:[width:32px] [&_>_span]:[height:32px] [&_>_span]:[place-items:center] [&_>_span]:[border:2px_solid_var(--neutral-300)] [&_>_span]:[border-radius:50%] [&_>_span]:[background:var(--surface-elevated)] [&_>_span]:[font-weight:750] max-[740px]:[min-width:0] max-[740px]:[gap:0.25rem] max-[740px]:[font-size:0.56rem] max-[740px]:[&_>_span]:[width:28px] max-[740px]:[&_>_span]:[height:28px] max-[740px]:[&_>_span]:[font-size:0.65rem] max-[740px]:[&_strong]:[max-width:100%] max-[740px]:[&_strong]:[overflow:hidden] max-[740px]:[&_strong]:[text-overflow:ellipsis] max-[740px]:[&_strong]:[white-space:nowrap] max-[740px]:after:[top:14px] max-[740px]:after:[right:-50%] max-[740px]:after:[width:100%]", `step-item--${state}`)} key={step} aria-current={state === "current" ? "step" : undefined}><span>{state === "complete" ? <Check size={15} /> : index + 1}</span><strong>{step}</strong></li>;
  })}</ol>;
}

function downloadTextFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["﻿", content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
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

export function AdminImportHistoryScreen() {
  const { importHistory } = useAdministration();
  const [query, setQuery] = useState("");
  const rows = importHistory
    .map((record, index) => ({ record, isActive: index === 0 }))
    .filter(({ record }) => `${record.fileName} ${record.id} ${record.importedBy}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem]")}>
      <nav className={cx("breadcrumbs [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.35rem] [margin-bottom:1rem] [color:var(--neutral-500)] [font-size:0.72rem] [&_a]:[color:var(--kc-700)] [&_a]:[font-weight:600]")} aria-label="Breadcrumb"><Link to="/admin/imports">Master data import</Link><ChevronRight size={15} /><span aria-current="page">Import history</span></nav>
      <PageHeader eyebrow="Administration audit" title="Import history" description="Every completed master data import, with its audit reference, result counts, and administrator." />
      <section className={cx("table-card [margin-top:1.25rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)]")}>
        <div className={cx("dashboard-filter-bar [display:flex] [align-items:center] [gap:0.7rem] [margin-top:1.25rem] [flex-wrap:wrap] [margin:0] [border-bottom:1px_solid_var(--neutral-200)] [padding:0.85rem_1rem] max-[1100px]:[align-items:stretch] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column]")}>
          <label className={cx("search-control [display:flex] [min-width:250px] [min-height:42px] [flex:1] [align-items:center] [gap:0.55rem] [border:1px_solid_var(--neutral-300)] [border-radius:var(--radius-md)] [background:var(--surface-input)] [padding:0_0.75rem] [color:var(--neutral-500)] [&:focus-within]:[border-color:var(--kc-600)] [&:focus-within]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input]:[min-width:0] [&_input]:[flex:1] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[color:var(--neutral-900)] [&_input]:[font-size:0.85rem] [.dashboard-filter-bar_&]:[flex:0_1_420px] [.dashboard-filter-bar_&]:[min-width:0] [.dashboard-filter-bar--expanded_&]:[flex:0_1_420px] [.dashboard-filter-bar--expanded_&]:[min-width:0] [.filter-row_&]:[flex:0_1_420px] [.filter-row_&]:[min-width:0] [.content-toolbar_&]:[flex:0_1_420px] [.content-toolbar_&]:[min-width:0] [.requirement-main--editor_.checkbox-list__toolbar_&]:[flex:1_1_320px] [.requirement-main--editor_.checkbox-list__toolbar_&]:[min-width:0] [.checkbox-list__toolbar_&_>_input]:[min-height:0] [.checkbox-list__toolbar_&_>_input]:[border:0]! [.checkbox-list__toolbar_&_>_input]:[border-radius:0] [.checkbox-list__toolbar_&_>_input]:[box-shadow:none]! [.checkbox-list__toolbar_&_>_input]:[outline:0]! [.checkbox-list__toolbar_&_>_input]:[padding:0] [.checkbox-list__toolbar_&]:[flex:0_1_420px] [.checkbox-list__toolbar_&]:[min-width:0] max-[1100px]:[.dashboard-filter-bar_&]:[width:100%] max-[1100px]:[.dashboard-filter-bar_&]:[flex-basis:100%] max-[1100px]:[.dashboard-filter-bar_&]:[min-width:0] max-[740px]:[width:100%] max-[740px]:[max-width:none] max-[740px]:[min-width:0] max-[740px]:[flex-basis:auto]!")}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search imports" /></label>
        </div>
        <div className={cx("table-card__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [border-bottom:1px_solid_var(--neutral-200)] [padding:1rem_1.15rem] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.1rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.78rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column] table-card__header--results [align-items:center]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Audit trail</p><h2>Completed imports</h2></div><span>{rows.length} of {importHistory.length} shown</span></div>
        {rows.length ? <div className={cx("history-list [display:grid] [gap:0.65rem] [padding:1.1rem] [&_article]:[display:grid] [&_article]:[grid-template-columns:auto_minmax(0,_1fr)_auto] [&_article]:[align-items:center] [&_article]:[gap:0.75rem] [&_article]:[border:1px_solid_var(--neutral-200)] [&_article]:[border-radius:12px] [&_article]:[background:var(--neutral-25)] [&_article]:[padding:0.8rem] [&_article_>_div]:[display:grid] [&_article_>_div]:[min-width:0] [&_article_span]:[overflow:hidden] [&_article_span]:[color:var(--neutral-500)] [&_article_span]:[font-size:0.72rem] [&_article_span]:[text-overflow:ellipsis] [&_article_span]:[white-space:nowrap] [&_article_small]:[overflow:hidden] [&_article_small]:[color:var(--neutral-500)] [&_article_small]:[font-size:0.72rem] [&_article_small]:[text-overflow:ellipsis] [&_article_small]:[white-space:nowrap] max-[720px]:[&_article]:[grid-template-columns:auto_minmax(0,_1fr)]")}>{rows.map(({ record, isActive }) => <article key={record.id}><span className={cx("history-list__icon [display:grid] [width:42px] [height:42px] [place-items:center] [border-radius:11px] [background:var(--kc-50)] [color:var(--kc-700)]")}><FileSpreadsheet size={20} /></span><div><strong>{record.fileName}</strong><span>{record.id} · {new Date(record.importedAt).toLocaleString()}</span><small>{record.created} created · {record.updated} updated · {record.unchanged} unchanged · by {record.importedBy}</small></div><span className={cx("history-list__actions [display:flex] [align-items:center] [gap:0.5rem] max-[720px]:[.history-list_article_>_&]:[grid-column:2] max-[720px]:[.history-list_article_>_&]:[justify-self:start] max-[720px]:[.history-list_article_>_&]:[flex-wrap:wrap]")}>{isActive && <span className={cx("publish-badge [display:inline-flex]! [width:fit-content] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.5rem] [font-size:0.7rem]! [font-weight:700] [border-color:var(--success-border)]! [background:var(--success-surface)] [color:var(--success)]! max-[1100px]:[.data-table_&]:[justify-self:start] max-[720px]:[.import-preview-requirement__summary_>_&]:[grid-column:2] max-[720px]:[.import-preview-requirement__summary_>_&]:[justify-self:start]")}>Active</span>}<span className={cx("publish-badge [display:inline-flex]! [width:fit-content] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.5rem] [font-size:0.7rem]! [font-weight:700] [border-color:var(--success-border)]! [background:var(--success-surface)] [color:var(--success)]! max-[1100px]:[.data-table_&]:[justify-self:start] max-[720px]:[.import-preview-requirement__summary_>_&]:[grid-column:2] max-[720px]:[.import-preview-requirement__summary_>_&]:[justify-self:start]", record.publishStatus === "Draft" && "publish-badge--draft [border-color:#d6bbfb]! [background:var(--provisional-surface)] [color:var(--provisional)]!")}>{record.publishStatus}</span><Link className={cx("button [display:inline-flex] [min-width:0] [align-items:center] [justify-content:center] [gap:0.5rem] [border:1px_solid_transparent] [border-radius:var(--radius-md)] [font-size:0.9rem] [font-weight:650] [line-height:1] [white-space:nowrap] [transition:background_120ms_ease,_border-color_120ms_ease,_box-shadow_120ms_ease,_color_120ms_ease,_transform_80ms_ease] disabled:[background:var(--neutral-100)] disabled:[border-color:var(--neutral-200)] disabled:[color:var(--neutral-400)] disabled:[box-shadow:none] [.question-evidence__editor_>_&]:[justify-self:start] [.question-evidence__attachments-header_>_&]:[flex:0_0_auto] [.site-assessment-area-row_>_&]:[justify-self:end] max-[900px]:[.site-assessment-area-row_>_&]:[grid-column:1_/_-1] max-[900px]:[.site-assessment-area-row_>_&]:[justify-self:stretch] max-[900px]:[.site-assessment-area-row_>_&]:[width:100%] max-[760px]:[.site-assessment-priority_&]:[width:100%] [.action-editor__header_>_&]:[margin-left:auto] max-[1500px]:[.requirement-mobile-toolbar_&:first-child]:[display:none] max-[1100px]:[.requirement-mobile-toolbar_&:first-child]:[display:inline-flex] max-[740px]:[.page-header__actions_&]:[width:100%] max-[740px]:[.overview-callout_&]:[grid-column:1_/_-1] max-[740px]:[.overview-callout_&]:[width:100%] max-[740px]:[.requirement-footer_>_&]:[width:100%] max-[740px]:[.requirement-footer_>_div_&]:[width:100%] max-[740px]:[.dialog__footer_&]:[width:100%] max-[740px]:[.section-drilldown-row_>_&]:[grid-column:1_/_-1] max-[740px]:[.section-drilldown-row_>_&]:[width:100%] max-[740px]:[.import-card__footer_&]:[width:100%] max-[740px]:[.result-state_&]:[width:100%] [.help-role-grid_&]:[width:100%] [.help-role-grid_&]:[margin-top:auto] max-[900px]:[.help-role-grid_&]:[width:auto] max-[620px]:[.setup-welcome__actions_&]:[width:100%] max-[620px]:[.tour-card__footer_&:last-child]:[flex:1] max-[620px]:[.setup-reminder_>_&]:[grid-column:2_/_-1] max-[620px]:[.setup-reminder_>_&]:[grid-row:2] max-[620px]:[.setup-reminder_>_&]:[width:100%] max-[620px]:[.help-role-grid_&]:[grid-column:1_/_-1] max-[620px]:[.help-role-grid_&]:[width:100%] max-[620px]:[.setup-complete_&]:[width:100%] [.passkey-add_&]:[width:100%] [.passkey-setup-message_&]:[flex:0_0_auto] max-[620px]:[.passkey-enrollment-choice_&]:[grid-column:2] max-[620px]:[.passkey-enrollment-choice_&]:[justify-self:start] max-[620px]:[.settings-card--split_>_&]:[width:100%] [.settings-index-empty_&]:[margin-top:0.3rem] max-[620px]:[.session-panel_&]:[grid-column:1_/_-1] max-[620px]:[.session-panel_&]:[width:100%] [.first-login-passkey__complete_&]:[margin-top:0.35rem] max-[620px]:[.first-login-passkey__actions_&]:[width:100%] button--tertiary [background:transparent] [color:var(--kc-700)] [&:hover:not(:disabled)]:[background:var(--kc-50)] [&:hover:not(:disabled)]:[color:var(--kc-900)] button--compact [min-height:34px] [padding:0.45rem_0.7rem] [font-size:0.82rem]")} to={`/admin/imports/${record.id}/preview`}>Preview</Link></span></article>)}</div> : <EmptyState icon={<History size={28} />} title={importHistory.length ? "No imports match" : "No imports recorded"} description={importHistory.length ? "Try another file name, audit reference, or administrator." : "Completed imports will appear here with their audit reference."} />}
      </section>
    </div>
  );
}

export function AdminSitesScreen() {
  const navigate = useNavigate();
  const { masterRequirements, siteUsers, sites, addSite, updateSite, importSites } = useAdministration();
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
    <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem]")}>
      <PageHeader eyebrow="Administration" title="Sites" description="Every site in the KC network, its assessment status, and the governed requirements scoped to it." actions={<><Button variant="secondary" icon={<Upload size={18} />} onClick={() => csvRef.current?.click()}>Import sites</Button><Button variant="primary" icon={<Plus size={18} />} onClick={() => setEditing("new")}>Create site</Button></>} />
      <input ref={csvRef} className={cx("visually-hidden [position:absolute]! [width:1px]! [height:1px]! [padding:0]! [margin:-1px]! [overflow:hidden]! [clip:rect(0,_0,_0,_0)]! [white-space:nowrap]! [border:0]!")} type="file" accept=".csv,text/csv" onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        file.text().then((text) => {
          const { parsed, invalid } = parseSitesCsv(text);
          if (!parsed.length) {
            setFeedback({ tone: "warning", title: "Nothing imported", body: invalid.length ? invalid.join(" ") : `No rows found. Expected columns: ${SITE_CSV_COLUMNS}.` });
            return;
          }
          const { added, skipped } = importSites(parsed);
          const notes = [
            added ? `${added} site${added === 1 ? "" : "s"} added.` : "No new sites added.",
            skipped.length ? `Skipped ${skipped.length} existing site code${skipped.length === 1 ? "" : "s"}: ${skipped.join(", ")}.` : "",
            ...invalid,
          ].filter(Boolean);
          setFeedback({ tone: added ? "success" : "warning", title: added ? "Sites imported" : "Import completed with no changes", body: notes.join(" ") });
        });
      }} />
      {feedback && <InlineMessage tone={feedback.tone} title={feedback.title}>{feedback.body}</InlineMessage>}
      <div className={cx("metrics-grid [display:grid] [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:1rem] [margin-top:1.25rem] max-[1500px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[740px]:[grid-template-columns:1fr]")}>
        <MetricCard label="Total sites" value={sites.length} detail={`Across ${regions.length} regions`} icon={<Building2 size={21} />} tone="brand" />
        <MetricCard label="Assessment complete" value={sites.filter((site) => site.completion === 100).length} detail="Reached 100% completion" icon={<CheckCircle2 size={21} />} tone="success" />
        <MetricCard label="Not started" value={sites.filter((site) => site.completion === 0).length} detail="No assessment recorded" icon={<Circle size={21} />} tone="warning" />
        <MetricCard label="Global requirements" value={globalCount} detail="Apply to every site" icon={<FileText size={21} />} />
      </div>
      <section className={cx("table-card [margin-top:1.25rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)]")}>
        <div className={cx("dashboard-filter-bar [display:flex] [align-items:center] [gap:0.7rem] [margin-top:1.25rem] [flex-wrap:wrap] [margin:0] [border-bottom:1px_solid_var(--neutral-200)] [padding:0.85rem_1rem] max-[1100px]:[align-items:stretch] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column]")}>
          <label className={cx("search-control [display:flex] [min-width:250px] [min-height:42px] [flex:1] [align-items:center] [gap:0.55rem] [border:1px_solid_var(--neutral-300)] [border-radius:var(--radius-md)] [background:var(--surface-input)] [padding:0_0.75rem] [color:var(--neutral-500)] [&:focus-within]:[border-color:var(--kc-600)] [&:focus-within]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input]:[min-width:0] [&_input]:[flex:1] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[color:var(--neutral-900)] [&_input]:[font-size:0.85rem] [.dashboard-filter-bar_&]:[flex:0_1_420px] [.dashboard-filter-bar_&]:[min-width:0] [.dashboard-filter-bar--expanded_&]:[flex:0_1_420px] [.dashboard-filter-bar--expanded_&]:[min-width:0] [.filter-row_&]:[flex:0_1_420px] [.filter-row_&]:[min-width:0] [.content-toolbar_&]:[flex:0_1_420px] [.content-toolbar_&]:[min-width:0] [.requirement-main--editor_.checkbox-list__toolbar_&]:[flex:1_1_320px] [.requirement-main--editor_.checkbox-list__toolbar_&]:[min-width:0] [.checkbox-list__toolbar_&_>_input]:[min-height:0] [.checkbox-list__toolbar_&_>_input]:[border:0]! [.checkbox-list__toolbar_&_>_input]:[border-radius:0] [.checkbox-list__toolbar_&_>_input]:[box-shadow:none]! [.checkbox-list__toolbar_&_>_input]:[outline:0]! [.checkbox-list__toolbar_&_>_input]:[padding:0] [.checkbox-list__toolbar_&]:[flex:0_1_420px] [.checkbox-list__toolbar_&]:[min-width:0] max-[1100px]:[.dashboard-filter-bar_&]:[width:100%] max-[1100px]:[.dashboard-filter-bar_&]:[flex-basis:100%] max-[1100px]:[.dashboard-filter-bar_&]:[min-width:0] max-[740px]:[width:100%] max-[740px]:[max-width:none] max-[740px]:[min-width:0] max-[740px]:[flex-basis:auto]!")}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sites" /></label>
          <Select label="Filter region" icon={<Filter size={18} />} value={region} onChange={setRegion} options={[{ value: "all", label: "All regions" }, ...regions.map((value) => ({ value, label: value }))]} />
        </div>
        <div className={cx("table-card__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [border-bottom:1px_solid_var(--neutral-200)] [padding:1rem_1.15rem] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.1rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.78rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column] table-card__header--results [align-items:center]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Site network</p><h2>All sites</h2></div><span>{rows.length} of {sites.length} shown</span></div>
        {rows.length ? <div className={cx("data-table-wrap [max-width:100%] max-[1100px]:[width:100%] max-[1100px]:[max-width:none] max-[1100px]:[overflow:visible]")}><table className={cx("data-table [width:100%] [table-layout:fixed] [border-collapse:collapse] [font-size:0.79rem] [&_th]:[overflow-wrap:anywhere] [&_td]:[overflow-wrap:anywhere] [&_th]:[padding:0.8rem_1rem] [&_th]:[border-bottom:1px_solid_var(--neutral-200)] [&_th]:[text-align:left] [&_th]:[vertical-align:middle] [&_td]:[padding:0.8rem_1rem] [&_td]:[border-bottom:1px_solid_var(--neutral-200)] [&_td]:[text-align:left] [&_td]:[vertical-align:middle] [&_th]:[background:var(--neutral-50)] [&_th]:[color:var(--neutral-600)] [&_th]:[font-size:0.69rem] [&_th]:[font-weight:750] [&_th]:[letter-spacing:0.01em] [&_tr:last-child_td]:[border-bottom:0] [&_tbody_tr:hover]:[background:var(--neutral-25)] [&_td_>_strong]:[display:block] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[display:block] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[margin-top:0.18rem] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[color:var(--neutral-500)] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[font-size:0.7rem] [&_td:nth-child(3)]:[max-width:390px] max-[1100px]:[display:block] max-[1100px]:[width:100%] max-[1100px]:[min-width:0] max-[1100px]:[&_tbody]:[display:grid] max-[1100px]:[&_tbody]:[width:100%] max-[1100px]:[&_tbody]:[min-width:0] max-[1100px]:[&_tr]:[display:block] max-[1100px]:[&_tr]:[width:100%] max-[1100px]:[&_tr]:[min-width:0] max-[1100px]:[&_td]:[display:grid] max-[1100px]:[&_td]:[width:100%] max-[1100px]:[&_td]:[min-width:0] max-[1100px]:[&_thead]:[position:absolute] max-[1100px]:[&_thead]:[display:block] max-[1100px]:[&_thead]:[width:1px] max-[1100px]:[&_thead]:[height:1px] max-[1100px]:[&_thead]:[padding:0] max-[1100px]:[&_thead]:[margin:-1px] max-[1100px]:[&_thead]:[overflow:hidden] max-[1100px]:[&_thead]:[clip:rect(0,_0,_0,_0)] max-[1100px]:[&_thead]:[white-space:nowrap] max-[1100px]:[&_thead]:[border:0] max-[1100px]:[&_thead_tr]:[position:absolute] max-[1100px]:[&_thead_tr]:[display:block] max-[1100px]:[&_thead_tr]:[width:1px] max-[1100px]:[&_thead_tr]:[min-width:0] max-[1100px]:[&_thead_tr]:[height:1px] max-[1100px]:[&_thead_tr]:[overflow:hidden] max-[1100px]:[&_thead_tr]:[padding:0] max-[1100px]:[&_thead_tr]:[border:0] max-[1100px]:[&_thead_tr]:[clip-path:inset(50%)] max-[1100px]:[&_thead_th]:[position:absolute] max-[1100px]:[&_thead_th]:[display:block] max-[1100px]:[&_thead_th]:[width:1px] max-[1100px]:[&_thead_th]:[min-width:0] max-[1100px]:[&_thead_th]:[height:1px] max-[1100px]:[&_thead_th]:[overflow:hidden] max-[1100px]:[&_thead_th]:[padding:0] max-[1100px]:[&_thead_th]:[border:0] max-[1100px]:[&_thead_th]:[clip-path:inset(50%)] max-[1100px]:[&_tbody]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[1100px]:[&_tbody]:[gap:0.75rem] max-[1100px]:[&_tbody]:[padding:0.85rem] max-[1100px]:[&_tbody_tr]:[overflow:hidden] max-[1100px]:[&_tbody_tr]:[border:1px_solid_var(--neutral-200)] max-[1100px]:[&_tbody_tr]:[border-radius:var(--radius-lg)] max-[1100px]:[&_tbody_tr]:[background:var(--neutral-25)] max-[1100px]:[&_tbody_tr]:[box-shadow:var(--shadow-1)] max-[1100px]:[&_td]:[grid-template-columns:minmax(116px,_0.45fr)_minmax(0,_1fr)] max-[1100px]:[&_td]:[align-items:center] max-[1100px]:[&_td]:[gap:0.75rem] max-[1100px]:[&_td]:[min-height:48px] max-[1100px]:[&_td]:[padding:0.7rem_0.85rem] max-[1100px]:[&_td]:[border-bottom:1px_solid_var(--neutral-200)] max-[1100px]:[&_td::before]:[color:var(--neutral-500)] max-[1100px]:[&_td::before]:[content:attr(data-label)] max-[1100px]:[&_td::before]:[font-size:0.67rem] max-[1100px]:[&_td::before]:[font-weight:750] max-[1100px]:[&_td::before]:[letter-spacing:0.01em] max-[1100px]:[&_td:last-child]:[min-height:44px] max-[1100px]:[&_td:last-child]:[grid-template-columns:1fr] max-[1100px]:[&_td:last-child]:[justify-items:end] max-[1100px]:[&_td:last-child]:[border-bottom:0] max-[1100px]:[&_td:last-child]:[background:var(--neutral-50)] max-[1100px]:[&_td:last-child::before]:[display:none] max-[1100px]:[&_td[data-label='']::before]:[display:none] max-[1100px]:[&_td_>_strong]:[min-width:0] max-[1100px]:[&_td_>_strong]:[overflow-wrap:anywhere] max-[1100px]:[&_td_>_span]:[min-width:0] max-[1100px]:[&_td_>_span]:[overflow-wrap:anywhere] max-[1100px]:[&_td_>_div]:[min-width:0] max-[1100px]:[&_td_>_div]:[overflow-wrap:anywhere] max-[820px]:[&_tbody]:[grid-template-columns:1fr]")}><thead><tr><th>Site</th><th>Region</th><th>Segment</th><th>Users</th><th>Completion</th><th>Requirements</th><th>Last updated</th><th><span className={cx("sr-only [position:absolute]! [width:1px]! [height:1px]! [padding:0]! [margin:-1px]! [overflow:hidden]! [clip:rect(0,_0,_0,_0)]! [white-space:nowrap]! [border:0]!")}>Open</span></th></tr></thead><tbody>{rows.map((site) => {
          const scoped = scopedCountFor(site.id);
          const users = usersFor(site.id);
          return (
            <tr key={site.id} className={cx("data-table__row--link [cursor:pointer] hover:[background:var(--kc-50)]")} onClick={() => navigate(`/admin/sites/${site.id}`)}>
              <td data-label="Site"><strong>{site.name}</strong><span>{site.code}</span></td>
              <td data-label="Region">{site.region}</td>
              <td data-label="Segment">{site.segment}</td>
              <td data-label="Users">{users.length ? <>{users.length}<span>{users.filter((user) => user.status === "Active").length} active</span></> : "None assigned"}</td>
              <td data-label="Completion"><span className={cx("completion-badge [display:inline-flex] [min-height:29px] [align-items:center] [gap:0.35rem] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.58rem] [font-size:0.77rem] [font-weight:700] [line-height:1] [white-space:nowrap] max-[1100px]:[.data-table_&]:[justify-self:start] [@media_(forced-colors:_active)]:[border:2px_solid_currentColor]", site.completion === 100 ? "completion-badge--complete [border-color:var(--success-border)]! [background:var(--success-surface)] [color:var(--success)]" : site.completion === 0 ? "completion-badge--not-started [border-color:var(--neutral-300)] [background:var(--neutral-50)] [color:var(--neutral-600)]" : "completion-badge--in-progress [border-color:var(--kc-200)] [background:var(--kc-50)] [color:var(--kc-800)]")}>{site.completion}%</span></td>
              <td data-label="Requirements">{scoped ? `${scoped} scoped` : "Global only"}<span>{globalCount} global</span></td>
              <td data-label="Last updated">{site.updated}</td>
              <td data-label=""><span className={cx("row-actions [display:flex]! [gap:0.1rem] max-[1100px]:[.data-table_&]:[justify-content:flex-end]")}><IconButton label={`Edit ${site.name}`} onClick={(event) => { event.stopPropagation(); setEditing(site); }}><Pencil size={17} /></IconButton><Link className={cx("table-action [display:inline-grid] [width:36px] [height:36px] [place-items:center] [border-radius:9px] [color:var(--kc-700)] hover:[background:var(--kc-50)]")} to={`/admin/sites/${site.id}`} aria-label={`Open ${site.name}`}><ChevronRight size={18} /></Link></span></td>
            </tr>
          );
        })}</tbody></table></div> : <EmptyState icon={<Search size={27} />} title="No sites match" description="Try another site name, code, or region." />}
      </section>
      {editing && <SiteDialog site={editing === "new" ? undefined : editing} existing={sites} onClose={() => setEditing(null)} onSave={(site) => {
        if (editing === "new") { addSite(site); setFeedback({ tone: "success", title: "Site created", body: `${site.name} (${site.code}) was added to the network.` }); }
        else { updateSite(site); setFeedback({ tone: "success", title: "Site updated", body: `${site.name} was updated.` }); }
        setEditing(null);
      }} />}
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
    <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem]")}>
      <nav className={cx("breadcrumbs [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.35rem] [margin-bottom:1rem] [color:var(--neutral-500)] [font-size:0.72rem] [&_a]:[color:var(--kc-700)] [&_a]:[font-weight:600]")} aria-label="Breadcrumb"><Link to="/admin/imports">Master data import</Link><ChevronRight size={15} /><Link to="/admin/imports/history">Import history</Link><ChevronRight size={15} /><span aria-current="page">{batchId}</span></nav>
      <PageHeader
        eyebrow="Administration audit"
        title="Preview imported requirements"
        description={batch ? `${rows.length} requirement${rows.length === 1 ? "" : "s"} from ${batch.fileName}, scoped to ${siteNamesFor(sites, batch.siteIds) || "the selected sites"}.` : "This import batch could not be found."}
        actions={batch && rows.length > 0 && <Button variant="primary" icon={<Check size={17} />} disabled={published} onClick={() => { publishImportBatch(batch.id); notifyBatchPublished(notify, batch, rows.length, sites); }}>{published ? "Published" : `Publish ${rows.length} requirements`}</Button>}
      />
      {published && <InlineMessage tone="success" title="Already published">This batch's requirements are live in the master requirements catalog.</InlineMessage>}
      {!rows.length && <EmptyState icon={<FileSpreadsheet size={28} />} title="No requirements in this batch" description="This import batch has no linked master requirement rows." />}
      {sectionOrder.map((section) => (
        <section className={cx("table-card [margin-top:1.25rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)]")} key={section}>
          <div className={cx("table-card__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [border-bottom:1px_solid_var(--neutral-200)] [padding:1rem_1.15rem] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.1rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.78rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Category</p><h2>{section}</h2></div><span>{grouped[section].length} requirement{grouped[section].length === 1 ? "" : "s"}</span></div>
          <div className={cx("history-list [display:grid] [gap:0.65rem] [padding:1.1rem] [&_article]:[display:grid] [&_article]:[grid-template-columns:auto_minmax(0,_1fr)_auto] [&_article]:[align-items:center] [&_article]:[gap:0.75rem] [&_article]:[border:1px_solid_var(--neutral-200)] [&_article]:[border-radius:12px] [&_article]:[background:var(--neutral-25)] [&_article]:[padding:0.8rem] [&_article_>_div]:[display:grid] [&_article_>_div]:[min-width:0] [&_article_span]:[overflow:hidden] [&_article_span]:[color:var(--neutral-500)] [&_article_span]:[font-size:0.72rem] [&_article_span]:[text-overflow:ellipsis] [&_article_span]:[white-space:nowrap] [&_article_small]:[overflow:hidden] [&_article_small]:[color:var(--neutral-500)] [&_article_small]:[font-size:0.72rem] [&_article_small]:[text-overflow:ellipsis] [&_article_small]:[white-space:nowrap] max-[720px]:[&_article]:[grid-template-columns:auto_minmax(0,_1fr)]")}>{grouped[section].map((item) => (
            <article className={cx("import-preview-requirement [.history-list_article&]:[display:block] [.history-list_article&]:[overflow:hidden] [.history-list_article&]:[padding:0]")} key={item.id}>
              <div className={cx("import-preview-requirement__summary [display:grid] [grid-template-columns:auto_minmax(0,_1fr)_auto] [align-items:center] [gap:0.75rem] [padding:0.8rem] [.history-list_article_>_&]:[min-width:0] max-[720px]:[grid-template-columns:auto_minmax(0,_1fr)]")}>
                <span className={cx("history-list__icon [display:grid] [width:42px] [height:42px] [place-items:center] [border-radius:11px] [background:var(--kc-50)] [color:var(--kc-700)]")}><FileText size={20} /></span>
                <div className={cx("import-preview-requirement__identity [display:grid] [min-width:0]")}><strong>{item.id}</strong><span>{item.title}</span></div>
                <span className={cx("publish-badge [display:inline-flex]! [width:fit-content] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.5rem] [font-size:0.7rem]! [font-weight:700] [border-color:var(--success-border)]! [background:var(--success-surface)] [color:var(--success)]! max-[1100px]:[.data-table_&]:[justify-self:start] max-[720px]:[.import-preview-requirement__summary_>_&]:[grid-column:2] max-[720px]:[.import-preview-requirement__summary_>_&]:[justify-self:start]", item.status === "Draft" && "publish-badge--draft [border-color:#d6bbfb]! [background:var(--provisional-surface)] [color:var(--provisional)]!")}>{item.status}</span>
              </div>
              <div className={cx("import-preview-questions [.history-list_article_>_&]:[min-width:0] [border-top:1px_solid_var(--neutral-200)] [background:var(--surface-panel)] [padding:0.9rem_1rem_1rem_4.75rem] max-[720px]:[padding-left:1rem]")}>
                <div className={cx("import-preview-questions__header [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [&_h3]:[margin-top:0.15rem] [&_h3]:[font-size:0.88rem] max-[720px]:[align-items:flex-start] max-[720px]:[flex-direction:column] max-[720px]:[gap:0.6rem]")}>
                  <div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Review questions</p><h3>Questions included with this requirement</h3></div>
                  <span className={cx("question-count [border:1px_solid_var(--neutral-200)] [border-radius:999px] [background:var(--surface-elevated)] [padding:0.35rem_0.6rem] [font-size:0.72rem] [font-weight:650] [.history-list_article_.import-preview-questions__header_&]:[flex:none] [.history-list_article_.import-preview-questions__header_&]:[overflow:visible] [.history-list_article_.import-preview-questions__header_&]:[color:var(--neutral-700)] [.history-list_article_.import-preview-questions__header_&]:[font-size:0.72rem] [.history-list_article_.import-preview-questions__header_&]:[white-space:nowrap]")}>{item.questions.length} question{item.questions.length === 1 ? "" : "s"}</span>
                </div>
                {item.questions.length ? (
                  <ol className={cx("import-preview-question-list [display:grid] [gap:0.55rem] [margin:0.8rem_0_0] [padding:0] [list-style:none] [&_>_li]:[display:grid] [&_>_li]:[grid-template-columns:auto_minmax(0,_1fr)] [&_>_li]:[align-items:start] [&_>_li]:[gap:0.7rem] [&_>_li]:[border:1px_solid_var(--neutral-200)] [&_>_li]:[border-radius:10px] [&_>_li]:[background:var(--neutral-25)] [&_>_li]:[padding:0.75rem]")}>
                    {item.questions.map((question, index) => {
                      const questionNumber = question.number || index + 1;
                      const evidenceRequired = question.evidenceRequired ?? question.expectedEvidence.length > 0;
                      return (
                        <li key={question.id}>
                          <span className={cx("question-number [display:grid] [width:31px] [height:31px] [place-items:center] [border-radius:9px] [background:var(--kc-50)] [color:var(--kc-800)] [font-size:0.8rem] [font-weight:750] [.history-list_article_.import-preview-question-list_&]:[overflow:visible] [.history-list_article_.import-preview-question-list_&]:[color:var(--kc-800)] [.history-list_article_.import-preview-question-list_&]:[font-size:0.8rem] [.history-list_article_.import-preview-question-list_&]:[white-space:nowrap]")}>{questionNumber}</span>
                          <div className={cx("import-preview-question__content")}>
                            <div className={cx("import-preview-question__heading [display:flex] [align-items:center] [justify-content:space-between] [gap:0.75rem] [&_strong]:[display:block] [&_strong]:[color:var(--neutral-500)] [&_strong]:[font-size:0.68rem] [&_strong]:[font-weight:650] max-[720px]:[align-items:flex-start] max-[720px]:[flex-direction:column] max-[720px]:[gap:0.25rem]")}>
                              <strong>Question {questionNumber}</strong>
                              <span className={cx("import-preview-question__evidence-status [.history-list_article_&]:[overflow:visible] [.history-list_article_&]:[color:var(--neutral-500)] [.history-list_article_&]:[font-size:0.68rem] [.history-list_article_&]:[font-weight:650] [.history-list_article_&]:[white-space:nowrap] max-[720px]:[.history-list_article_&]:[white-space:normal]")}>{evidenceRequired ? `${question.expectedEvidence.length} evidence item${question.expectedEvidence.length === 1 ? "" : "s"}` : "Evidence not required"}</span>
                            </div>
                            <p className={cx("import-preview-question__text [.import-preview-question-list_&]:[margin-top:0.15rem] [.import-preview-question-list_&]:[color:var(--neutral-900)] [.import-preview-question-list_&]:[font-size:0.84rem] [.import-preview-question-list_&]:[line-height:1.45]")}>{question.text}</p>
                            {evidenceRequired && (
                              <div className={cx("import-preview-evidence [margin-top:0.65rem] [border-radius:9px] [background:var(--kc-50)] [padding:0.65rem_0.75rem] [&_ul]:[display:grid] [&_ul]:[gap:0.3rem] [&_ul]:[margin:0.45rem_0_0_1.1rem] [&_ul]:[padding:0] [&_li]:[color:var(--neutral-700)] [&_li]:[font-size:0.76rem] [&_li]:[line-height:1.4]")}>
                                <p className={cx("import-preview-evidence__title [.import-preview-evidence_&]:[display:flex] [.import-preview-evidence_&]:[align-items:center] [.import-preview-evidence_&]:[gap:0.35rem] [.import-preview-evidence_&]:[margin:0] [.import-preview-evidence_&]:[color:var(--kc-800)] [.import-preview-evidence_&]:[font-size:0.72rem] [.import-preview-evidence_&]:[font-weight:700]")}><Paperclip size={14} />Expected evidence</p>
                                {question.expectedEvidence.length ? (
                                  <ul>{question.expectedEvidence.map((evidence, evidenceIndex) => <li key={`${question.id}-evidence-${evidenceIndex}`}>{evidence}</li>)}</ul>
                                ) : <p className={cx("import-preview-evidence__empty [.import-preview-evidence_&]:[margin-top:0.4rem] [.import-preview-evidence_&]:[color:var(--neutral-600)] [.import-preview-evidence_&]:[font-size:0.76rem] [.import-preview-evidence_&]:[line-height:1.4]")}>Evidence is required, but no evidence description was included in the import.</p>}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : <p className={cx("import-preview-questions__empty [margin-top:0.8rem] [border:1px_dashed_var(--neutral-300)] [border-radius:10px] [color:var(--neutral-500)] [padding:0.75rem] [font-size:0.8rem]")}>No review questions or expected evidence were included for this requirement.</p>}
              </div>
            </article>
          ))}</div>
        </section>
      ))}
    </div>
  );
}

export function AdminImportsScreen() {
  const navigate = useNavigate();
  const { importHistory, publishImportBatch, submitImportBatch, sites, notify } = useAdministration();
  const siteOptions = buildSiteOptions(sites);
  const [step, setStep] = useState(0);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [mappings, setMappings] = useState<ColumnMapping[]>(INITIAL_MAPPINGS);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<ImportHistoryRecord | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(selected?: File) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".xlsx")) { setFile(null); setFileError("Choose an Excel .xlsx workbook."); return; }
    if (selected.size > 25 * 1024 * 1024) { setFile(null); setFileError("The workbook must be 25 MB or smaller."); return; }
    setFile(selected); setFileError("");
  }
  function advance() {
    if (step === 5 && file) {
      const record = submitImportBatch(file.name, selectedSiteIds);
      notify({
        title: `${record.fileName} imported`,
        body: `${record.created + record.updated} requirements are staged as drafts and stay invisible to sites until published.`,
        category: "master-data",
        audience: ["administrator"],
        link: `/admin/imports/${record.id}/preview`,
      });
      setResult(record); setStep(6); return;
    }
    setStep((value) => Math.min(6, value + 1));
  }
  function resetImport() {
    setStep(0); setSelectedSiteIds([]); setFile(null); setFileError(""); setMappings(INITIAL_MAPPINGS); setConfirmed(false); setResult(null);
  }
  const needsReview = mappings.some((mapping) => mapping.needsReview);

  return (
    <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem]")}>
      <PageHeader eyebrow="Administration" title="Master data import" description="Validate an approved KC workbook before applying requirements and hierarchy changes." actions={<Button variant="secondary" icon={<History size={18} />} onClick={() => navigate("/admin/imports/history")} data-tour="import-history">Import history</Button>} />
      <section className={cx("import-card [margin-top:1.25rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)]")}>
        <StepIndicator current={step} />
        <div className={cx("import-stage [min-height:460px] [padding:1.5rem] max-[740px]:[min-height:0] max-[740px]:[padding:1rem]")}>
          {step === 0 && <><div className={cx("import-stage__heading [display:flex] [gap:0.85rem] [max-width:760px] [margin-bottom:1.2rem] [&_h2]:[margin:0.15rem_0_0.25rem] [&_p:last-child]:[color:var(--neutral-600)] [&_p:last-child]:[font-size:0.82rem]")}><span className={cx("stage-icon [display:grid] [width:46px] [height:46px] [flex:0_0_46px] [place-items:center] [border-radius:13px] [background:var(--kc-50)] [color:var(--kc-700)]")}><Building2 size={23} /></span><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Step 1 of 7</p><h2>Select sites for this import</h2><p>Choose one or more sites this workbook's requirements apply to.</p></div></div><CheckboxList label="Sites" searchable options={siteOptions} selected={selectedSiteIds} onChange={setSelectedSiteIds} /></>}
          {step === 1 && <><div className={cx("import-stage__heading [display:flex] [gap:0.85rem] [max-width:760px] [margin-bottom:1.2rem] [&_h2]:[margin:0.15rem_0_0.25rem] [&_p:last-child]:[color:var(--neutral-600)] [&_p:last-child]:[font-size:0.82rem]")}><span className={cx("stage-icon [display:grid] [width:46px] [height:46px] [flex:0_0_46px] [place-items:center] [border-radius:13px] [background:var(--kc-50)] [color:var(--kc-700)]")}><FileInput size={23} /></span><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Step 2 of 7</p><h2>Upload source workbook</h2><p>Select the approved KC Operating System and Performance Standards workbook.</p></div></div><input ref={inputRef} className={cx("visually-hidden [position:absolute]! [width:1px]! [height:1px]! [padding:0]! [margin:-1px]! [overflow:hidden]! [clip:rect(0,_0,_0,_0)]! [white-space:nowrap]! [border:0]!")} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => selectFile(event.target.files?.[0])} />{!file ? <button className={cx("dropzone [display:grid] [width:calc(100%_-_2.2rem)] [min-height:170px] [place-items:center] [align-content:center] [gap:0.45rem] [margin:1rem_1.1rem] [border:1.5px_dashed_var(--kc-300)] [border-radius:var(--radius-lg)] [background:var(--kc-50)] [color:var(--neutral-700)] [padding:1rem] hover:[border-color:var(--kc-600)] hover:[background:var(--kc-100)] [&_strong]:[font-size:0.9rem] [&_span:last-child]:[color:var(--neutral-500)] [&_span:last-child]:[font-size:0.72rem]", "dropzone--large [width:100%] [min-height:260px] [margin:0]", fileError && "dropzone--invalid [border-color:var(--danger)]! [box-shadow:0_0_0_3px_var(--danger-surface)]")} data-tour="import-upload" onClick={() => inputRef.current?.click()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }} onDragOver={(event) => event.preventDefault()}><span className={cx("dropzone__icon [display:grid] [width:48px] [height:48px] [place-items:center] [border-radius:14px] [background:var(--surface-elevated)] [color:var(--kc-700)] [box-shadow:var(--shadow-1)]")}><Upload size={25} /></span><strong>Choose an Excel workbook or drag it here</strong><span>.xlsx files · Maximum 25 MB</span></button> : <div className={cx("selected-file [display:flex] [align-items:center] [gap:0.8rem] [border:1px_solid_var(--success-border)] [border-radius:var(--radius-lg)] [background:var(--success-surface)] [padding:1rem] [&_>_div]:[display:grid] [&_>_div]:[flex:1] [&_>_div_span]:[color:var(--neutral-600)] [&_>_div_span]:[font-size:0.75rem] [&_>_svg]:[color:var(--success)]")} data-tour="import-upload"><span className={cx("selected-file__icon [display:grid] [width:46px] [height:46px] [place-items:center] [border-radius:12px] [background:var(--surface-elevated)] [color:var(--success)]")}><FileSpreadsheet size={24} /></span><div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to inspect</span></div><Button variant="tertiary" size="compact" onClick={() => inputRef.current?.click()}>Replace</Button><CheckCircle2 size={21} /></div>}{fileError && <InlineMessage tone="danger" title="Workbook not accepted">{fileError}</InlineMessage>}</>}
          {step === 2 && <><div className={cx("import-stage__heading [display:flex] [gap:0.85rem] [max-width:760px] [margin-bottom:1.2rem] [&_h2]:[margin:0.15rem_0_0.25rem] [&_p:last-child]:[color:var(--neutral-600)] [&_p:last-child]:[font-size:0.82rem]")}><span className={cx("stage-icon [display:grid] [width:46px] [height:46px] [flex:0_0_46px] [place-items:center] [border-radius:13px] [background:var(--kc-50)] [color:var(--kc-700)]")}><FileSpreadsheet size={23} /></span><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Step 3 of 7</p><h2>Inspect workbook structure</h2><p>Review detected sheets and records before mapping.</p></div></div><div className={cx("inspection-grid [display:grid] [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:0.8rem] [margin-bottom:1rem] [&_>_div]:[display:grid] [&_>_div]:[gap:0.15rem] [&_>_div]:[border:1px_solid_var(--neutral-200)] [&_>_div]:[border-radius:12px] [&_>_div]:[background:var(--neutral-50)] [&_>_div]:[padding:0.9rem] [&_strong]:[font-size:1.35rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.72rem] max-[740px]:[grid-template-columns:1fr]")}><div><strong>24</strong><span>Sheets detected</span></div><div><strong>752</strong><span>Requirement rows</span></div><div><strong>0</strong><span>Unknown sheets</span></div><div><strong>2</strong><span>Warnings</span></div></div><div className={cx("inspection-list [display:grid] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [overflow:hidden] [&_>_div]:[display:flex] [&_>_div]:[align-items:center] [&_>_div]:[gap:0.7rem] [&_>_div]:[padding:0.75rem_0.85rem] [&_>_div]:[border-bottom:1px_solid_var(--neutral-200)] [&_>_div:last-child]:[border-bottom:0] [&_>_div_>_span:nth-child(2)]:[display:grid] [&_>_div_>_span:nth-child(2)]:[flex:1] [&_small]:[color:var(--neutral-500)] [&_>_div_>_svg:first-child]:[color:var(--kc-700)] [&_>_div_>_svg:last-child]:[color:var(--success)]")}><div><FileCheck2 size={18} /><span><strong>Leadership & Engagement</strong><small>68 rows · Valid structure</small></span><CheckCircle2 size={18} /></div><div><FileCheck2 size={18} /><span><strong>Planning</strong><small>94 rows · Valid structure</small></span><CheckCircle2 size={18} /></div><div><AlertCircle size={18} /><span><strong>Machine Safety</strong><small>2 blank guidance cells</small></span><span className={cx("warning-label [display:inline-flex]! [width:fit-content] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.5rem] [font-size:0.7rem]! [font-weight:700] [border-color:var(--warning-border)]! [background:var(--warning-surface)] [color:var(--warning)]")}>Warning</span></div></div></>}
          {step === 3 && <><div className={cx("import-stage__heading [display:flex] [gap:0.85rem] [max-width:760px] [margin-bottom:1.2rem] [&_h2]:[margin:0.15rem_0_0.25rem] [&_p:last-child]:[color:var(--neutral-600)] [&_p:last-child]:[font-size:0.82rem]")}><span className={cx("stage-icon [display:grid] [width:46px] [height:46px] [flex:0_0_46px] [place-items:center] [border-radius:13px] [background:var(--kc-50)] [color:var(--kc-700)]")}><ArrowRight size={23} /></span><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Step 4 of 7</p><h2>Map workbook columns</h2><p>Confirm how source values map into governed master fields. Resolve any flagged row before continuing.</p></div></div><div className={cx("mapping-table [display:grid] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [&_>_div:last-child]:[border-bottom:0] [grid-template-columns:minmax(150px,_1fr)_auto_minmax(170px,_1fr)_minmax(200px,_1.3fr)_auto] [column-gap:0.75rem] [&_>_div]:[display:grid] [&_>_div]:[grid-template-columns:subgrid] [&_>_div]:[grid-column:1_/_-1] [&_>_div]:[align-items:center] [&_>_div]:[padding:0.75rem] [&_>_div]:[border-bottom:1px_solid_var(--neutral-200)] [&_>_div_>_span:not(.mapping-sample)]:[display:grid] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.68rem] [&_>_div_>_svg:last-child]:[color:var(--success)] [&_>_div:first-child]:[border-top-left-radius:var(--radius-lg)] [&_>_div:first-child]:[border-top-right-radius:var(--radius-lg)] [&_>_div:last-child]:[border-bottom-left-radius:var(--radius-lg)] [&_>_div:last-child]:[border-bottom-right-radius:var(--radius-lg)] max-[1100px]:[&_>_div]:[grid-template-columns:1fr_auto_1fr_auto] max-[740px]:[&_>_div]:[grid-template-columns:1fr_auto_1fr] max-[740px]:[&_>_div]:[gap:0.45rem] max-[740px]:[&_>_div_>_svg:last-child]:[display:none]")}>{mappings.map((mapping, index) => <div key={mapping.source} className={cx(mapping.needsReview && "mapping-table__row--flagged [.mapping-table_>_div&]:[border-bottom-color:var(--warning-border)] [.mapping-table_>_div&]:[background:var(--warning-surface)]")}><span><strong>{mapping.source}</strong><small>Source column</small></span><ArrowRight size={18} /><Select label={`Target field for ${mapping.source}`} value={mapping.target} onChange={(value) => setMappings((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, target: value, needsReview: false } : row))} options={TARGET_FIELDS} /><span className={cx("mapping-sample [overflow:hidden] [color:var(--neutral-500)] [font-size:0.74rem] [text-overflow:ellipsis] [white-space:nowrap] max-[1100px]:[display:none]")}>{mapping.sample}</span>{mapping.needsReview ? <span className={cx("warning-label [display:inline-flex]! [width:fit-content] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.5rem] [font-size:0.7rem]! [font-weight:700] [border-color:var(--warning-border)]! [background:var(--warning-surface)] [color:var(--warning)]")}>Needs review</span> : <CheckCircle2 size={18} />}</div>)}</div>{needsReview && <InlineMessage tone="warning" title="Resolve flagged mappings">One or more source columns were auto-detected with low confidence. Choose the correct target field for each flagged row before continuing.</InlineMessage>}</>}
          {step === 4 && <><div className={cx("import-stage__heading [display:flex] [gap:0.85rem] [max-width:760px] [margin-bottom:1.2rem] [&_h2]:[margin:0.15rem_0_0.25rem] [&_p:last-child]:[color:var(--neutral-600)] [&_p:last-child]:[font-size:0.82rem]")}><span className={cx("stage-icon [display:grid] [width:46px] [height:46px] [flex:0_0_46px] [place-items:center] [border-radius:13px] [background:var(--kc-50)] [color:var(--kc-700)]")}><ShieldCheck size={23} /></span><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Step 5 of 7</p><h2>Validation results</h2><p>Resolve blocking errors before import. Warnings may be accepted with review.</p></div></div><div className={cx("validation-summary [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:0.8rem] [margin-bottom:1rem] [&_>_div]:[display:flex] [&_>_div]:[align-items:center] [&_>_div]:[gap:0.6rem] [&_>_div]:[border:1px_solid_var(--neutral-200)] [&_>_div]:[border-radius:12px] [&_>_div]:[padding:0.9rem] [&_span]:[color:var(--neutral-700)] [&_strong]:[color:var(--neutral-900)] max-[740px]:[grid-template-columns:1fr]")}><div className={cx("validation-summary__success [border-color:var(--success-border)]! [background:var(--success-surface)] [color:var(--success)]")}><CheckCircle2 size={22} /><span><strong>748</strong> valid records</span></div><div className={cx("validation-summary__warning [border-color:var(--warning-border)]! [background:var(--warning-surface)] [color:var(--warning)]")}><AlertCircle size={22} /><span><strong>4</strong> warnings</span></div><div><Circle size={22} /><span><strong>0</strong> blocking errors</span></div></div><InlineMessage tone="warning" title="Four records need review">Two records have blank guidance and two reuse an existing display order. The import can continue without data loss.</InlineMessage><Button variant="secondary" icon={<Download size={17} />} onClick={() => downloadTextFile("Maitsys_Assure_import_validation_report.csv", "row,severity,field,message\r\n214,Warning,guidance,Guidance is blank\r\n389,Warning,guidance,Guidance is blank\r\n521,Warning,display_order,Display order is reused\r\n522,Warning,display_order,Display order is reused")}>Download validation report</Button></>}
          {step === 5 && <><div className={cx("import-stage__heading [display:flex] [gap:0.85rem] [max-width:760px] [margin-bottom:1.2rem] [&_h2]:[margin:0.15rem_0_0.25rem] [&_p:last-child]:[color:var(--neutral-600)] [&_p:last-child]:[font-size:0.82rem]")}><span className={cx("stage-icon [display:grid] [width:46px] [height:46px] [flex:0_0_46px] [place-items:center] [border-radius:13px] [background:var(--kc-50)] [color:var(--kc-700)]")}><FileCheck2 size={23} /></span><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Step 6 of 7</p><h2>Confirm import</h2><p>Review the dry-run result before applying master data changes.</p></div></div><div className={cx("dry-run-grid [display:grid] [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:0.8rem] [margin-bottom:1rem] [&_>_div]:[display:grid] [&_>_div]:[gap:0.15rem] [&_>_div]:[border:1px_solid_var(--neutral-200)] [&_>_div]:[border-radius:12px] [&_>_div]:[background:var(--neutral-50)] [&_>_div]:[padding:0.9rem] [&_strong]:[font-size:1.35rem] [&_span:last-child]:[color:var(--neutral-500)] [&_span:last-child]:[font-size:0.72rem] [&_>_div]:[position:relative] [&_>_div]:[padding-left:2.1rem] max-[740px]:[grid-template-columns:1fr]")}><div><span className={cx("dry-run-dot [position:absolute] [top:1rem] [left:0.85rem] [width:9px] [height:9px] [border-radius:50%] dry-run-dot--create [background:var(--success)]")} /><strong>4</strong><span>Create</span></div><div><span className={cx("dry-run-dot [position:absolute] [top:1rem] [left:0.85rem] [width:9px] [height:9px] [border-radius:50%] dry-run-dot--update [background:var(--kc-600)]")} /><strong>2</strong><span>Update</span></div><div><span className={cx("dry-run-dot [position:absolute] [top:1rem] [left:0.85rem] [width:9px] [height:9px] [border-radius:50%] dry-run-dot--same [background:var(--neutral-400)]")} /><strong>746</strong><span>Unchanged</span></div><div><span className={cx("dry-run-dot [position:absolute] [top:1rem] [left:0.85rem] [width:9px] [height:9px] [border-radius:50%] dry-run-dot--conflict [background:var(--danger)]")} /><strong>0</strong><span>Conflicts</span></div></div><InlineMessage tone="info" title="Import scope">This action updates master requirements for {siteNamesFor(sites, selectedSiteIds) || "the selected sites"} and writes an administrator audit record.</InlineMessage><label className={cx("confirmation-check [display:flex] [align-items:flex-start] [gap:0.6rem] [margin-top:1rem] [border:1px_solid_var(--neutral-200)] [border-radius:11px] [padding:0.8rem] [font-size:0.8rem] [&_input]:[width:18px] [&_input]:[height:18px] [&_input]:[accent-color:var(--kc-600)]")}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I reviewed the validation warnings and confirm this import scope.</span></label></>}
          {step === 6 && result && (() => {
            const latest = importHistory.find((record) => record.id === result.id) ?? result;
            const published = latest.publishStatus === "Published";
            const requirementCount = latest.created + latest.updated;
            return (
              <div className={cx("result-state [display:grid] [max-width:640px] [justify-items:center] [margin:3rem_auto] [text-align:center] [&_h2]:[margin:0.25rem_0_0.5rem] [&_p]:[color:var(--neutral-600)]")}>
                <span className={cx("result-state__icon [display:grid] [width:68px] [height:68px] [place-items:center] [margin-bottom:1rem] [border-radius:50%] [background:var(--success-surface)] [color:var(--success)]", published && "result-state__icon--published [background:var(--kc-50)] [color:var(--kc-700)]")}><CheckCircle2 size={34} /></span>
                <p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>{published ? "Published" : "Import complete"}</p>
                <h2>{published ? "Requirements are live" : "Review and publish this import"}</h2>
                <p>{published
                  ? `All ${requirementCount} requirements from this import are now live in the master requirements catalog.`
                  : `${requirementCount} requirements are staged as drafts. They stay invisible to sites until you publish them.`}</p>
                <div className={cx("result-summary [display:grid] [width:100%] [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:0.65rem] [margin-top:1.5rem] [&_>_div]:[display:grid] [&_>_div]:[gap:0.15rem] [&_>_div]:[border:1px_solid_var(--neutral-200)] [&_>_div]:[border-radius:12px] [&_>_div]:[background:var(--neutral-25)] [&_>_div]:[padding:0.8rem_0.5rem] [&_strong]:[font-size:1.35rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.72rem] max-[740px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))]")}>
                  <div><strong>{latest.created}</strong><span>Created</span></div>
                  <div><strong>{latest.updated}</strong><span>Updated</span></div>
                  <div><strong>{latest.unchanged}</strong><span>Unchanged</span></div>
                  <div><strong>{latest.siteIds.length || "All"}</strong><span>{latest.siteIds.length === 1 ? "Site" : "Sites"}</span></div>
                </div>
                <p className={cx("result-state__audit [margin-top:1rem] [font-size:0.78rem] [&_strong]:[color:var(--neutral-800)]")}>Audit reference <strong>{latest.id}</strong></p>
                <div className={cx("result-state__primary [display:flex] [flex-wrap:wrap] [justify-content:center] [gap:0.65rem] [margin-top:1.4rem] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column]")}>
                  {!published && <Button variant="primary" icon={<Check size={17} />} onClick={() => { publishImportBatch(latest.id); notifyBatchPublished(notify, latest, requirementCount, sites); }}>Publish {requirementCount} requirements</Button>}
                  <Button variant="secondary" icon={<FileText size={17} />} onClick={() => navigate(`/admin/imports/${latest.id}/preview`)}>{published ? "View imported requirements" : "Review before publishing"}</Button>
                </div>
                <div className={cx("result-state__links [display:flex] [align-items:center] [justify-content:center] [gap:0.7rem] [margin-top:1rem] [&_button]:[border:0] [&_button]:[background:none] [&_button]:[padding:0] [&_button]:[color:var(--kc-700)] [&_button]:[font-size:0.8rem] [&_button]:[font-weight:650] [&_button]:[cursor:pointer] [&_button:hover]:[color:var(--kc-800)] [&_button:hover]:[text-decoration:underline]")}>
                  <button type="button" onClick={() => navigate("/admin/imports/history")}>View audit entry</button>
                  <span className={cx("divider-dot [width:3px] [height:3px] [border-radius:50%] [background:var(--neutral-400)] max-[740px]:[display:none]")} />
                  <button type="button" onClick={resetImport}>Import another file</button>
                </div>
              </div>
            );
          })()}
        </div>
        {step < 6 && <div className={cx("import-card__footer [display:flex] [align-items:center] [justify-content:space-between] [border-top:1px_solid_var(--neutral-200)] [padding:0.8rem_1rem] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column]")}><Button variant="tertiary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button><Button variant="primary" onClick={advance} disabled={(step === 0 && selectedSiteIds.length === 0) || (step === 1 && !file) || (step === 3 && needsReview) || (step === 5 && !confirmed)} icon={<ArrowRight size={17} />} iconPosition="end">{step === 5 ? "Confirm import" : "Continue"}</Button></div>}
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
    <div className={cx("question-list [display:grid] [gap:1rem]")}>
      {!questions.length && <p className={cx("question-editor-empty [border:1px_dashed_var(--neutral-300)] [border-radius:var(--radius-lg)] [padding:1rem] [color:var(--neutral-500)] [font-size:0.78rem] [text-align:center]")}>No assessment questions yet. Add the first one below.</p>}
      {questions.map((question, index) => {
        const invalid = submitted && !question.text.trim();
        const evidenceRequired = question.evidenceRequired ?? question.expectedEvidence.length > 0;
        return (
          <article className={cx("question-card [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [padding:1.1rem] [box-shadow:var(--shadow-1)] max-[740px]:[padding:0.9rem]", invalid && "question-card--invalid [border-color:var(--danger-border)] [box-shadow:0_0_0_3px_var(--danger-surface)]")} key={question.id}>
            <div className={cx("question-card__header [display:grid] [grid-template-columns:auto_minmax(0,_1fr)_auto] [align-items:start] [gap:0.8rem] [&_p]:[color:var(--neutral-500)] [&_p]:[font-size:0.68rem] [&_p]:[font-weight:600] [&_h3]:[max-width:780px] [&_h3]:[margin-top:0.2rem] [&_h3]:[font-size:0.95rem] [&_h3]:[line-height:1.5] max-[740px]:[grid-template-columns:auto_minmax(0,_1fr)]")}>
              <span className={cx("question-number [display:grid] [width:31px] [height:31px] [place-items:center] [border-radius:9px] [background:var(--kc-50)] [color:var(--kc-800)] [font-size:0.8rem] [font-weight:750] [.history-list_article_.import-preview-question-list_&]:[overflow:visible] [.history-list_article_.import-preview-question-list_&]:[color:var(--kc-800)] [.history-list_article_.import-preview-question-list_&]:[font-size:0.8rem] [.history-list_article_.import-preview-question-list_&]:[white-space:nowrap]")}>{index + 1}</span>
              <div>
                <p>Question {index + 1}</p>
                <textarea rows={2} className={cx("question-text-input [.question-card__header_&]:[width:100%] [.question-card__header_&]:[margin-top:0.2rem] [.question-card__header_&]:[border:1px_solid_var(--neutral-300)] [.question-card__header_&]:[border-radius:var(--radius-md)] [.question-card__header_&]:[outline:0] [.question-card__header_&]:[background:var(--surface-input)] [.question-card__header_&]:[color:var(--neutral-900)] [.question-card__header_&]:[padding:0.55rem_0.65rem] [.question-card__header_&]:[font-size:0.95rem] [.question-card__header_&]:[line-height:1.5] [.question-card__header_&]:[resize:vertical] [.question-card__header_&:focus]:[border-color:var(--kc-600)] [.question-card__header_&:focus]:[box-shadow:0_0_0_3px_var(--kc-100)]")} value={question.text} onChange={(event) => updateQuestion(question.id, { text: event.target.value })} placeholder="For example, Is the site risk register current and approved?" />
                {invalid && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Enter the question text.</small>}
              </div>
              <IconButton label={`Delete question ${index + 1}`} onClick={() => removeQuestion(question.id)}><Trash2 size={17} /></IconButton>
            </div>
            <div className={cx("question-evidence [display:grid] [gap:0.5rem] [margin:0.85rem_0_0] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-md)] [background:var(--surface-elevated)] [padding:0.75rem_0.9rem] [&_ul]:[display:grid] [&_ul]:[gap:0.3rem] [&_ul]:[margin:0] [&_ul]:[padding-left:1.1rem] [&_ul]:[color:var(--neutral-600)] [&_ul]:[font-size:0.76rem] [&_ul]:[line-height:1.5] question-evidence--editable")}>
              <label className={cx("question-evidence__toggle [display:inline-flex] [align-items:center] [gap:0.45rem] [color:var(--neutral-800)] [font-size:0.78rem] [font-weight:650] [&_input]:[width:17px] [&_input]:[height:17px] [&_input]:[accent-color:var(--kc-600)]")}><input type="checkbox" checked={evidenceRequired} onChange={(event) => updateQuestion(question.id, { evidenceRequired: event.target.checked })} /> <span>Evidence required for this question</span></label>
              {evidenceRequired && <><span className={cx("question-evidence__title [&_small]:[margin-left:auto] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.66rem] [&_small]:[font-weight:500] [&_small]:[text-transform:none] [&_small]:[letter-spacing:normal] [display:flex] [align-items:center] [gap:0.4rem] [color:var(--kc-700)] [font-size:0.72rem] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.02em]")}><Paperclip size={14} /> Required evidence <small>Shown only with Question {index + 1}</small></span>
              <div className={cx("question-evidence__editor [display:grid] [gap:0.45rem]")}>
                {question.expectedEvidence.map((item, evidenceIndex) => (
                  <div className={cx("question-evidence__item [display:flex] [align-items:center] [gap:0.45rem] [&_input]:[width:100%] [&_input]:[min-width:0] [&_input]:[min-height:38px] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.45rem_0.65rem] [&_input]:[font-size:0.78rem] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)]")} key={`${question.id}-evidence-${evidenceIndex}`}>
                    <input value={item} onChange={(event) => updateEvidenceItem(question, evidenceIndex, event.target.value)} placeholder="For example, Current risk register" aria-label={`Evidence item ${evidenceIndex + 1} for question ${index + 1}`} />
                    <IconButton label={`Remove evidence item ${evidenceIndex + 1} from question ${index + 1}`} onClick={() => removeEvidenceItem(question, evidenceIndex)}><Trash2 size={16} /></IconButton>
                  </div>
                ))}
                <Button variant="tertiary" icon={<Plus size={16} />} onClick={() => addEvidenceItem(question)}>Add evidence item</Button>
              </div></>}
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
    <aside className={cx("assessment-navigator [display:flex] [height:100%] [flex-direction:column] [overflow-y:auto] [border-right:1px_solid_var(--neutral-200)] [background:var(--surface-panel)] [padding:1rem] [.sheet_&]:[border:0] admin-requirement-navigator")} aria-label="Master requirement navigator">
      <div className={cx("assessment-navigator__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:0.75rem] [margin-bottom:1rem] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1rem]")}>
        <div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Master content</p><h2>Requirements</h2></div>
        {onClose && <IconButton label="Close requirement navigator" onClick={onClose}><X size={19} /></IconButton>}
      </div>
      <ProgressBar value={requirements.length ? Math.round((published / requirements.length) * 100) : 0} label="Requirements published" />
      <label className={cx("navigator-search [display:flex] [min-height:40px] [align-items:center] [gap:0.45rem] [margin:1rem_0] [border:1px_solid_var(--neutral-300)] [border-radius:9px] [padding:0_0.65rem] [color:var(--neutral-500)] [&:focus-within]:[border-color:var(--kc-600)] [&:focus-within]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input]:[min-width:0] [&_input]:[flex:1] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[font-size:0.8rem]")}>
        <Search size={17} />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a requirement" />
      </label>
      <div className={cx("navigator-group [flex:1]")}>
        <div className={cx("navigator-group__trigger [display:flex] [width:100%] [align-items:center] [border:0] [text-align:left] [gap:0.45rem] [background:transparent] [color:var(--neutral-700)] [padding:0.45rem_0.35rem] [font-size:0.74rem] [font-weight:700] [&_small]:[margin-left:auto] [&_small]:[color:var(--neutral-500)] [&_small]:[font-weight:500]")} aria-expanded="true"><ChevronDown size={17} /><span>Master requirements</span><small>{published} of {requirements.length}</small></div>
        <div className={cx("navigator-items [display:grid] [gap:0.15rem] [margin-top:0.25rem]")}>
          {filtered.map((requirement) => {
            const isCurrent = requirement.id === current.id;
            return (
              <button key={requirement.id} className={cx("navigator-item [display:flex] [width:100%] [align-items:center] [border:0] [text-align:left] [min-height:51px] [gap:0.6rem] [border-radius:9px] [background:transparent] [padding:0.45rem_0.5rem] [color:var(--neutral-700)] hover:[background:var(--neutral-50)] [&_>_span:nth-child(2)]:[display:grid] [&_>_span:nth-child(2)]:[min-width:0] [&_>_span:nth-child(2)]:[flex:1] [&_>_span:nth-child(2)]:[font-size:0.76rem] [&_>_span:nth-child(2)]:[font-weight:600] [&_>_span:nth-child(2)]:[line-height:1.25] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.64rem] [&_small]:[font-weight:600] [&_>_svg:last-child]:[color:var(--neutral-400)]", isCurrent && "navigator-item--current [background:var(--kc-100)] [border:1px_solid_var(--kc-200)] [color:var(--kc-900)] [font-weight:700] [box-shadow:inset_5px_0_0_var(--kc-600)]")} onClick={() => onNavigate(requirement)}>
                {isCurrent ? <span className={cx("nav-state [flex:0_0_auto] nav-state--current [display:grid] [width:19px] [height:19px] [place-items:center] [border-radius:50%] [background:var(--kc-600)] [color:#fff] [box-shadow:0_0_0_3px_var(--kc-200)]")}><Circle size={12} fill="currentColor" /></span> : requirement.status === "Published" ? <CheckCircle2 size={17} className={cx("nav-state [flex:0_0_auto] nav-state--complete [color:var(--success)]")} /> : <Circle size={16} className={cx("nav-state [flex:0_0_auto] nav-state--incomplete [color:var(--neutral-400)]")} />}
                <span><small>{requirement.id} · {requirement.section}</small>{requirement.title}</span>
                <ChevronRight size={16} />
              </button>
            );
          })}
          {!filtered.length && <p className={cx("navigator-empty [margin:0] [padding:1rem_0.75rem] [color:var(--neutral-500)] [font-size:0.76rem] [text-align:center]")}>No requirements match your search.</p>}
        </div>
      </div>
      <Button className={cx("next-incomplete [width:100%] [margin-top:1rem]")} variant="secondary" icon={<ListChecks size={18} />} onClick={onViewAll}>All requirements</Button>
    </aside>
  );
}

function RequirementAuditChangeDetail({ change }: { change: RequirementAuditChange }) {
  if (change.before !== undefined && change.after !== undefined) {
    return (
      <div className={cx("requirement-audit-change__diff [display:grid] [grid-template-columns:minmax(0,_1fr)_auto_minmax(0,_1fr)] [align-items:center] [gap:0.65rem] [min-width:0] [&_>_div]:[min-width:0] [&_>_div]:[border-radius:9px] [&_>_div]:[background:var(--neutral-50)] [&_>_div]:[padding:0.65rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.62rem] [&_span]:[font-weight:700] [&_span]:[text-transform:uppercase] [&_span]:[letter-spacing:0.04em] [&_p]:[margin-top:0.22rem] [&_p]:[color:var(--neutral-800)] [&_p]:[font-size:0.76rem] [&_p]:[line-height:1.45] [&_p]:[overflow-wrap:anywhere] max-[720px]:[grid-template-columns:1fr] max-[720px]:[&_>_svg]:[transform:rotate(90deg)]")}>
        <div><span>Before</span><p>{change.before}</p></div>
        <ArrowRight size={16} />
        <div><span>After</span><p>{change.after}</p></div>
      </div>
    );
  }
  return (
    <div className={cx("requirement-audit-change__single [min-width:0] [border-radius:9px] [background:var(--neutral-50)] [padding:0.65rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.62rem] [&_span]:[font-weight:700] [&_span]:[text-transform:uppercase] [&_span]:[letter-spacing:0.04em] [&_p]:[margin-top:0.22rem] [&_p]:[color:var(--neutral-800)] [&_p]:[font-size:0.76rem] [&_p]:[line-height:1.45] [&_p]:[overflow-wrap:anywhere]")}>
      <span>{change.kind === "deleted" ? "Removed value" : "Recorded value"}</span>
      <p>{change.before ?? change.after ?? "No value"}</p>
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
    <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem] requirement-audit-page")}>
      <PageHeader
        eyebrow="Administration"
        title="Requirement audit log"
        description="Review detailed changes across every master requirement, including questions, expected evidence, publishing state, and site scope."
        actions={<Button variant="primary" icon={<Download size={17} />} disabled={!filteredEntries.length} onClick={() => downloadTextFile("Maitsys_Assure_requirement_audit_log.csv", requirementAuditCsv(filteredEntries))}>Export audit log</Button>}
      />
      <section className={cx("table-card [margin-top:1.25rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)]")}>
        <div className={cx("dashboard-filter-bar [display:flex] [align-items:center] [gap:0.7rem] [margin-top:1.25rem] [flex-wrap:wrap] [margin:0] [border-bottom:1px_solid_var(--neutral-200)] [padding:0.85rem_1rem] max-[1100px]:[align-items:stretch] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column]")}>
          <label className={cx("search-control [display:flex] [min-width:250px] [min-height:42px] [flex:1] [align-items:center] [gap:0.55rem] [border:1px_solid_var(--neutral-300)] [border-radius:var(--radius-md)] [background:var(--surface-input)] [padding:0_0.75rem] [color:var(--neutral-500)] [&:focus-within]:[border-color:var(--kc-600)] [&:focus-within]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input]:[min-width:0] [&_input]:[flex:1] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[color:var(--neutral-900)] [&_input]:[font-size:0.85rem] [.dashboard-filter-bar_&]:[flex:0_1_420px] [.dashboard-filter-bar_&]:[min-width:0] [.dashboard-filter-bar--expanded_&]:[flex:0_1_420px] [.dashboard-filter-bar--expanded_&]:[min-width:0] [.filter-row_&]:[flex:0_1_420px] [.filter-row_&]:[min-width:0] [.content-toolbar_&]:[flex:0_1_420px] [.content-toolbar_&]:[min-width:0] [.requirement-main--editor_.checkbox-list__toolbar_&]:[flex:1_1_320px] [.requirement-main--editor_.checkbox-list__toolbar_&]:[min-width:0] [.checkbox-list__toolbar_&_>_input]:[min-height:0] [.checkbox-list__toolbar_&_>_input]:[border:0]! [.checkbox-list__toolbar_&_>_input]:[border-radius:0] [.checkbox-list__toolbar_&_>_input]:[box-shadow:none]! [.checkbox-list__toolbar_&_>_input]:[outline:0]! [.checkbox-list__toolbar_&_>_input]:[padding:0] [.checkbox-list__toolbar_&]:[flex:0_1_420px] [.checkbox-list__toolbar_&]:[min-width:0] max-[1100px]:[.dashboard-filter-bar_&]:[width:100%] max-[1100px]:[.dashboard-filter-bar_&]:[flex-basis:100%] max-[1100px]:[.dashboard-filter-bar_&]:[min-width:0] max-[740px]:[width:100%] max-[740px]:[max-width:none] max-[740px]:[min-width:0] max-[740px]:[flex-basis:auto]!")}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search requirement, actor, action, or value" /></label>
          <Select label="Filter requirement" icon={<FileText size={18} />} searchable value={requirementFilter} onChange={setRequirementFilter} options={[{ value: "all", label: "All requirements" }, ...requirementOptions]} />
          <Select label="Filter change area" icon={<Filter size={18} />} value={target} onChange={(value) => setTarget(value as typeof target)} options={[{ value: "all", label: "All changes" }, ...Object.entries(requirementAuditTargetLabels).map(([value, label]) => ({ value, label }))]} />
        </div>
        <div className={cx("table-card__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [border-bottom:1px_solid_var(--neutral-200)] [padding:1rem_1.15rem] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.1rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.78rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column] table-card__header--results [align-items:center]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Recorded timeline</p><h2>Requirement change history</h2></div><span>{filteredEntries.length} of {allEntries.length} events shown</span></div>
        {filteredEntries.length ? (
          <div className={cx("requirement-audit-timeline [position:relative] [display:grid] [gap:0] [padding:1.25rem_1.25rem_1.25rem_4.6rem] before:[position:absolute] before:[top:1.5rem] before:[bottom:1.5rem] before:[left:2.25rem] before:[width:2px] before:[border-radius:999px] before:[background:linear-gradient(var(--kc-300),_var(--neutral-200))] before:[content:''] max-[720px]:[padding:1rem_0.8rem_1rem_3.6rem] max-[720px]:before:[left:1.65rem]")}>
            {filteredEntries.map((entry) => {
              const expanded = expandedEntries.has(entry.id);
              const detailsId = `audit-entry-details-${entry.id}`;
              return (
              <article className={cx("requirement-audit-entry [position:relative] [margin-bottom:1.15rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)] [&:last-child]:[margin-bottom:0]", expanded && "requirement-audit-entry--expanded")} key={entry.id}>
                <header className={cx("requirement-audit-entry__header [display:grid] [grid-template-columns:minmax(0,_1fr)_auto] [align-items:start] [gap:0.8rem] [border-radius:var(--radius-lg)] [background:var(--neutral-25)] [padding:1rem] [.requirement-audit-entry--expanded_&]:[border-bottom:1px_solid_var(--neutral-200)] [.requirement-audit-entry--expanded_&]:[border-radius:var(--radius-lg)_var(--radius-lg)_0_0] [&_p]:[color:var(--neutral-500)] [&_p]:[font-size:0.72rem] [&_h3]:[margin-top:0.35rem] [&_h3]:[font-size:0.95rem] [&_p]:[margin-top:0.25rem] [&_p]:[overflow-wrap:anywhere] max-[720px]:[grid-template-columns:1fr]")}>
                  <span className={cx("requirement-audit-entry__icon [position:absolute] [z-index:1] [top:0.8rem] [left:-3.55rem] [display:grid] [width:42px] [height:42px] [place-items:center] [border:4px_solid_var(--surface-panel)] [border-radius:50%] [background:var(--kc-50)] [color:var(--kc-700)] [box-shadow:0_0_0_1px_var(--kc-200)] max-[720px]:[left:-2.95rem]")}><History size={19} /></span>
                  <div>
                    <div className={cx("requirement-audit-entry__meta [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.55rem] [&_time]:[color:var(--neutral-500)] [&_time]:[font-size:0.72rem]")}><span className={cx("publish-badge [display:inline-flex]! [width:fit-content] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.5rem] [font-size:0.7rem]! [font-weight:700] [border-color:var(--success-border)]! [background:var(--success-surface)] [color:var(--success)]! max-[1100px]:[.data-table_&]:[justify-self:start] max-[720px]:[.import-preview-requirement__summary_>_&]:[grid-column:2] max-[720px]:[.import-preview-requirement__summary_>_&]:[justify-self:start]")}>{requirementAuditActionLabels[entry.action]}</span><time dateTime={entry.recordedAt}>{new Date(entry.recordedAt).toLocaleString()}</time></div>
                    {masterRequirements.some((requirement) => requirement.id === entry.requirementId) ? <Link className={cx("requirement-audit-entry__entity [display:inline-flex] [width:fit-content] [align-items:center] [gap:0.3rem] [margin-top:0.45rem] [color:var(--kc-800)] [font-size:0.76rem] [font-weight:750] [a&:hover]:[color:var(--kc-600)] [a&:hover]:[text-decoration:underline]")} to={`/admin/requirements/${entry.requirementId}`}>{entry.requirementId} · {entry.requirementTitle}<ArrowRight size={14} /></Link> : <span className={cx("requirement-audit-entry__entity [display:inline-flex] [width:fit-content] [align-items:center] [gap:0.3rem] [margin-top:0.45rem] [color:var(--kc-800)] [font-size:0.76rem] [font-weight:750] [a&:hover]:[color:var(--kc-600)] [a&:hover]:[text-decoration:underline] requirement-audit-entry__entity--deleted [color:var(--neutral-500)]")}>{entry.requirementId} · {entry.requirementTitle} · Deleted requirement</span>}
                    <h3>{entry.summary}</h3>
                    <p>{entry.recordedBy.name} · {entry.recordedBy.email}{entry.batchId ? ` · Import ${entry.batchId}` : ""}</p>
                  </div>
                  <button
                    type="button"
                    className={cx("requirement-audit-entry__toggle [display:inline-flex] [min-height:32px] [align-items:center] [gap:0.35rem] [border:1px_solid_var(--neutral-200)] [border-radius:999px] [background:var(--surface-elevated)] [color:var(--neutral-600)] [padding:0.3rem_0.55rem] [cursor:pointer] [font-size:0.7rem] [font-weight:700] [white-space:nowrap] hover:[border-color:var(--kc-300)] hover:[background:var(--kc-50)] hover:[color:var(--kc-800)] focus-visible:[outline:3px_solid_rgb(2_132_199_/_0.2)] focus-visible:[outline-offset:2px] [&_svg]:[transition:transform_160ms_ease] max-[720px]:[grid-column:1] max-[720px]:[justify-self:start]", expanded && "requirement-audit-entry__toggle--expanded [&_svg]:[transform:rotate(180deg)]")}
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
                    <ChevronDown size={15} aria-hidden="true" />
                  </button>
                </header>
                {expanded && <ol className={cx("requirement-audit-changes [display:grid] [gap:0.7rem] [margin:0] [padding:1rem] [list-style:none] [&_>_li]:[display:grid] [&_>_li]:[grid-template-columns:minmax(190px,_0.42fr)_minmax(0,_1fr)] [&_>_li]:[gap:1rem] [&_>_li]:[border:1px_solid_var(--neutral-200)] [&_>_li]:[border-radius:11px] [&_>_li]:[padding:0.8rem] max-[720px]:[&_>_li]:[grid-template-columns:1fr]")} id={detailsId}>
                  {entry.changes.map((change, index) => (
                    <li key={`${entry.id}-${index}`}>
                      <div className={cx("requirement-audit-change__header [display:flex] [align-items:flex-start] [gap:0.6rem] [min-width:0] [&_>_div]:[display:grid] [&_>_div]:[gap:0.15rem] [&_>_div]:[min-width:0] [&_strong]:[font-size:0.78rem] [&_strong]:[line-height:1.4] [&_>_div_>_span]:[color:var(--neutral-500)] [&_>_div_>_span]:[font-size:0.68rem]")}><span className={cx("requirement-audit-change__kind [flex:none] [border-radius:999px] [padding:0.22rem_0.45rem] [font-size:0.62rem] [font-weight:750] [text-transform:capitalize]", `requirement-audit-change__kind--${change.kind}`)}>{requirementAuditChangeKindLabel(change)}</span><div><strong>{change.label}</strong><span>{requirementAuditTargetLabels[change.target]}</span></div></div>
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
  const { masterRequirements, addMasterRequirement, updateMasterRequirement, removeMasterRequirement, sites } = useAdministration();
  const isNew = !requirementId;
  const existing = requirementId ? masterRequirements.find((item) => item.id === requirementId) : undefined;
  const sections = [...new Set(masterRequirements.map((item) => item.section))];
  const defaultSection = sections[0] ?? "";
  const siteOptions = buildSiteOptions(sites);
  const sectionOptions = sections.map((value) => ({ value, label: value }));
  const [draft, setDraft] = useState<MasterRequirement>(existing ?? { id: "", title: "", section: defaultSection, status: "Draft", siteIds: [], questions: [] });
  const [submitted, setSubmitted] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<MasterRequirement | "list" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // React reuses this route component when only :requirementId changes. Resetting the editor
  // from the route record keeps the header, fields, and left navigator in lockstep after a
  // requirement is selected from the navigator.
  useEffect(() => {
    setDraft(existing ?? { id: "", title: "", section: defaultSection, status: "Draft", siteIds: [], questions: [] });
    setSubmitted(false);
    setPendingNavigation(null);
  }, [defaultSection, existing, requirementId]);

  if (requirementId && !existing) {
    return (
      <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem]")}>
        <nav className={cx("breadcrumbs [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.35rem] [margin-bottom:1rem] [color:var(--neutral-500)] [font-size:0.72rem] [&_a]:[color:var(--kc-700)] [&_a]:[font-weight:600]")} aria-label="Breadcrumb"><Link to="/admin/requirements">Master requirements</Link><ChevronRight size={15} /><span aria-current="page">Not found</span></nav>
        <EmptyState icon={<Search size={27} />} title="Requirement not found" description="This master requirement does not exist or was removed." />
      </div>
    );
  }

  const update = (key: keyof MasterRequirement, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const valid = Boolean(draft.id.trim() && draft.title.trim() && draft.section.trim() && draft.questions.every((question) => question.text.trim()));
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
      questions: draft.questions.map((question, index) => ({ ...question, number: String(index + 1), text: question.text.trim(), expectedEvidence: question.expectedEvidence.map((line) => line.trim()).filter(Boolean) })),
    };
    if (isNew) addMasterRequirement(cleaned); else updateMasterRequirement(cleaned);
    navigate("/admin/requirements", { state: { feedback: `${cleaned.id} was ${isNew ? "added" : "updated"}.` } });
  }

  return (
    <div className={cx("requirement-page [min-width:0] admin-requirement-page")}>
      <div className={cx("requirement-mobile-toolbar [display:none] max-[1500px]:[position:sticky] max-[1500px]:[z-index:8] max-[1500px]:[top:var(--content-offset)] max-[1500px]:[display:flex] max-[1500px]:[justify-content:flex-end] max-[1500px]:[gap:0.55rem] max-[1500px]:[border-bottom:1px_solid_var(--neutral-200)] max-[1500px]:[background:var(--surface-mobile-bar)] max-[1500px]:[padding:0.55rem_1rem] max-[1500px]:[backdrop-filter:blur(15px)] max-[1100px]:[top:var(--content-offset)] max-[1100px]:[justify-content:space-between] admin-requirement-mobile-toolbar")}>
        <Button variant="secondary" icon={<Menu size={18} />} onClick={() => setNavigatorOpen(true)}>Requirements</Button>
        <Button variant="secondary" onClick={() => requestNavigation("list")}>All requirements</Button>
      </div>
      <div className={cx("requirement-layout [display:grid] [width:100%] [min-width:0] [min-height:calc(100vh_-_var(--content-offset))] [grid-template-columns:400px_minmax(500px,_1fr)_320px] max-[1500px]:[grid-template-columns:320px_minmax(500px,_1fr)] max-[1100px]:[display:block] requirement-layout--admin-editor [grid-template-columns:minmax(280px,_320px)_minmax(0,_1fr)]")}>
        <div className={cx("requirement-layout__navigator [position:sticky] [top:var(--content-offset)] [height:calc(100vh_-_var(--content-offset))] [align-self:start] max-[1500px]:[top:calc(var(--content-offset)_+_55px)] max-[1500px]:[height:calc(100vh_-_var(--content-offset)_-_55px)] max-[1100px]:[display:none]")}><AdminRequirementNavigator requirements={masterRequirements} current={navigatorCurrent} onNavigate={requestNavigation} onViewAll={() => requestNavigation("list")} /></div>
        <div className={cx("requirement-main [min-width:0] [padding:1.5rem_var(--page-gutter)_4rem] max-[740px]:[padding:1rem_0.85rem_3rem] requirement-main--editor [width:min(100%,_900px)] [margin-right:auto] [margin-left:auto] [.requirement-layout--admin-editor_&]:[width:100%] [.requirement-layout--admin-editor_&]:[max-width:none] [.requirement-layout--admin-editor_&]:[margin:0]")}>
        <nav className={cx("breadcrumbs [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.35rem] [margin-bottom:1rem] [color:var(--neutral-500)] [font-size:0.72rem] [&_a]:[color:var(--kc-700)] [&_a]:[font-weight:600]")} aria-label="Breadcrumb"><Link to="/admin/requirements">Master requirements</Link><ChevronRight size={15} /><span aria-current="page">{isNew ? "New requirement" : draft.id}</span></nav>
        <header className={cx("requirement-header [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-xl)] [background:radial-gradient(circle_at_95%_0%,_rgb(var(--accent-soft-rgb)_/_0.12),_transparent_15rem),_var(--surface-panel)] [padding:1.2rem_1.25rem] [box-shadow:var(--shadow-1)] max-[740px]:[padding:1rem]")}>
          <div className={cx("requirement-header__meta [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.6rem] [color:var(--neutral-500)] [font-size:0.72rem]")}>
            <input className={cx("requirement-id-input [border:1px_solid_var(--kc-200)] [border-radius:999px] [background:var(--kc-50)] [color:var(--kc-800)] [padding:0.22rem_0.65rem] [font-size:0.72rem] [font-weight:750] [outline:0] [min-width:0] [max-width:100%] disabled:[opacity:0.75] focus:[border-color:var(--kc-600)] focus:[box-shadow:0_0_0_3px_var(--kc-100)]", submitted && !draft.id.trim() && "field-invalid-input [border-color:var(--danger)]! [box-shadow:0_0_0_3px_var(--danger-surface)]")} style={{ width: `${draft.id ? Math.max(8, draft.id.length + 2) : "For example, OS 2.4.1".length + 2}ch` }} value={draft.id} disabled={!isNew} onChange={(event) => update("id", event.target.value)} placeholder="For example, OS 2.4.1" aria-label="Requirement ID" />
            <Select label="Section" value={draft.section} onChange={(value) => update("section", value)} options={sectionOptions} />
          </div>
          <div className={cx("requirement-header__title [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [margin-top:0.8rem] [&_>_div:first-child]:[flex:1] [&_>_div:first-child]:[min-width:0] [&_h1]:[max-width:720px] [&_h1]:[margin-top:0.2rem] [&_h1]:[font-size:clamp(1.45rem,_2.6vw,_1.9rem)] max-[740px]:[display:grid]")}>
            <div>
              <p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Requirement</p>
              <textarea className={cx("requirement-title-input [width:100%] [max-width:720px] [margin-top:0.2rem] [border:1px_solid_var(--neutral-300)] [border-radius:var(--radius-md)] [outline:0] [background:var(--surface-input)] [color:var(--neutral-900)] [padding:0.5rem_0.65rem] [font-size:clamp(1rem,_1.4vw,_1.125rem)] [font-weight:700] [line-height:1.4] [resize:vertical] focus:[border-color:var(--kc-600)] focus:[box-shadow:0_0_0_3px_var(--kc-100)]", submitted && !draft.title.trim() && "field-invalid-input [border-color:var(--danger)]! [box-shadow:0_0_0_3px_var(--danger-surface)]")} rows={2} value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="Requirement title" aria-label="Requirement title" />
            </div>
            <div className={cx("requirement-header__controls [display:flex] [flex:0_0_auto] [flex-wrap:wrap] [align-items:center] [justify-content:flex-end] [gap:0.6rem]")}>
              <Select label="Status" value={draft.status} onChange={(value) => update("status", value)} options={[{ value: "Draft", label: "Draft" }, { value: "Published", label: "Published" }]} />
            </div>
          </div>
          <div className={cx("requirement-header__footer [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.6rem] [margin-top:1rem] [border-top:1px_solid_var(--neutral-100)] [padding-top:0.75rem] [color:var(--neutral-500)] [font-size:0.72rem]")}>
            <span>{draft.siteIds.length ? `${draft.siteIds.length} of ${sites.length} sites scoped` : "Applies to all sites"}</span>
          </div>
          <div className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input:not([type=checkbox]):not([type=radio])]:[width:100%] [&_input:not([type=checkbox]):not([type=radio])]:[border:1px_solid_var(--neutral-300)] [&_input:not([type=checkbox]):not([type=radio])]:[border-radius:var(--radius-md)] [&_input:not([type=checkbox]):not([type=radio])]:[outline:0] [&_input:not([type=checkbox]):not([type=radio])]:[background:var(--surface-input)] [&_input:not([type=checkbox]):not([type=radio])]:[color:var(--neutral-900)] [&_input:not([type=checkbox]):not([type=radio])]:[padding:0.68rem_0.75rem] [&_input:not([type=checkbox]):not([type=radio])]:[font-size:0.86rem] [&_input:not([type=checkbox]):not([type=radio])]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input:not([type=checkbox]):not([type=radio])]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:not([type=checkbox]):not([type=radio]):focus]:[border-color:var(--kc-600)] [&_input:not([type=checkbox]):not([type=radio]):focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem] field--wide [grid-column:1_/_-1]")}>
            <span>Sites <small>Leave empty to apply to all sites</small></span>
            <CheckboxList label="Sites" searchable options={siteOptions} selected={draft.siteIds} onChange={(values) => setDraft((current) => ({ ...current, siteIds: values }))} />
            <div className={cx("requirement-selected-sites [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.45rem_0.65rem] [color:var(--neutral-600)] [font-size:0.74rem] [&_>_strong]:[color:var(--neutral-800)] [&_>_strong]:[font-size:0.76rem]")} aria-live="polite">
              <strong>Selected sites</strong>
              {draft.siteIds.length ? <span className={cx("requirement-selected-sites__list [display:flex] [flex-wrap:wrap] [gap:0.35rem] [&_>_span]:[border:1px_solid_var(--kc-200)] [&_>_span]:[border-radius:999px] [&_>_span]:[background:var(--kc-50)] [&_>_span]:[padding:0.2rem_0.45rem] [&_>_span]:[color:var(--kc-800)] [&_>_span]:[font-size:0.7rem] [&_>_span]:[font-weight:650]")}>{siteOptions.filter((site) => draft.siteIds.includes(site.value)).map((site) => <span key={site.value}>{site.label}</span>)}</span> : <span>All sites</span>}
            </div>
          </div>
          {submitted && !valid && <InlineMessage tone="danger" title="Complete required fields">Requirement ID, title, section, and text for every question are required before saving.</InlineMessage>}
        </header>
        <section className={cx("questions-section [margin-top:1.5rem]")} aria-labelledby="admin-questions-title">
          <div className={cx("section-title-row [display:flex] [align-items:flex-end] [justify-content:space-between] [gap:1rem] [margin-bottom:1rem] [&_h2]:[margin-top:0.25rem] [&_>_div_>_span]:[color:var(--neutral-500)] [&_>_div_>_span]:[font-size:0.85rem] [&_>_span]:[color:var(--neutral-500)] [&_>_span]:[font-size:0.85rem] [.site-support-details__content_&]:[margin-bottom:1rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Assessment questions</p><h2 id="admin-questions-title">Add, edit, or remove questions</h2></div><span className={cx("question-count [border:1px_solid_var(--neutral-200)] [border-radius:999px] [background:var(--surface-elevated)] [padding:0.35rem_0.6rem] [font-size:0.72rem] [font-weight:650] [.history-list_article_.import-preview-questions__header_&]:[flex:none] [.history-list_article_.import-preview-questions__header_&]:[overflow:visible] [.history-list_article_.import-preview-questions__header_&]:[color:var(--neutral-700)] [.history-list_article_.import-preview-questions__header_&]:[font-size:0.72rem] [.history-list_article_.import-preview-questions__header_&]:[white-space:nowrap]")}>{draft.questions.length} questions</span></div>
          <QuestionsEditor questions={draft.questions} onChange={(questions) => setDraft((current) => ({ ...current, questions }))} requirementId={draft.id} submitted={submitted} />
        </section>
        <footer className={cx("requirement-footer [position:sticky] [z-index:5] [bottom:0.75rem] [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [margin-top:1.5rem] [border:1px_solid_var(--border-translucent)] [border-radius:var(--radius-lg)] [background:var(--surface-translucent)] [padding:0.65rem] [box-shadow:0_12px_34px_rgb(15_23_42_/_0.12)] [backdrop-filter:blur(18px)] [&_>_div]:[display:flex] [&_>_div]:[align-items:center] [&_>_div]:[gap:0.85rem] max-[1100px]:[bottom:calc(82px_+_env(safe-area-inset-bottom))] max-[740px]:[bottom:calc(72px_+_env(safe-area-inset-bottom))] max-[740px]:[display:grid] max-[740px]:[grid-template-columns:1fr_1fr] max-[740px]:[gap:0.55rem] max-[740px]:[padding:0.5rem] max-[740px]:[&_>_div]:[width:100%]")}>
          <div><Button variant="secondary" onClick={() => navigate("/admin/requirements")}>Cancel</Button>{!isNew && <Button variant="tertiary" icon={<Trash2 size={17} />} onClick={() => setDeleteConfirmOpen(true)}>Delete requirement</Button>}</div>
          <Button variant="primary" icon={<Check size={17} />} onClick={save}>{isNew ? "Add requirement" : "Save changes"}</Button>
        </footer>
      </div>
      </div>
      {navigatorOpen && <div className={cx("sheet-layer [position:fixed] [z-index:100] [inset:0] [display:none] [place-items:center] max-[1500px]:[display:block]")}><button className={cx("sheet-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label="Close requirement navigator" onClick={() => setNavigatorOpen(false)} /><div className={cx("sheet [position:absolute] [top:0] [bottom:0] [width:min(390px,_calc(100%_-_2rem))] [overflow-y:auto] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] sheet--left [left:0]")}><AdminRequirementNavigator requirements={masterRequirements} current={navigatorCurrent} onNavigate={requestNavigation} onViewAll={() => requestNavigation("list")} onClose={() => setNavigatorOpen(false)} /></div></div>}
      {pendingNavigation && <ConfirmDialog eyebrow="Unsaved changes" title="Leave this requirement without saving?" body="Your changes to this requirement will be discarded. Save changes before continuing if you want to keep them." confirmLabel="Leave without saving" cancelLabel="Keep editing" onCancel={() => setPendingNavigation(null)} onConfirm={confirmNavigation} />}
      {deleteConfirmOpen && <ConfirmDialog eyebrow="Master requirement" title={`Delete ${draft.id}?`} body="This permanently removes the master requirement and its matching site-assessment requirement, including question-scoped evidence." confirmLabel="Delete requirement" cancelLabel="Keep requirement" onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { removeMasterRequirement(draft.id); navigate("/admin/requirements", { state: { feedback: `${draft.id} was deleted.` } }); }} />}
    </div>
  );
}

export function AdminRequirementsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { masterRequirements, updateMasterRequirement, addMasterRequirement, removeMasterRequirement, sites } = useAdministration();
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
  const sections = [...new Set(masterRequirements.map((item) => item.section))];
  const rows = masterRequirements.filter((item) =>
    (`${item.title} ${item.id}`.toLowerCase().includes(query.toLowerCase())) &&
    (section === "All sections" || item.section === section) &&
    (status === "Published and draft" || item.status === status) &&
    (siteFilter === "all" || item.siteIds.length === 0 || item.siteIds.includes(siteFilter)));
  return (
    <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem]")}>
      <PageHeader eyebrow="Administration" title="Master requirements" description="Manage governed requirements, questions, expected evidence, hierarchy, and publishing state." actions={<Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate("/admin/requirements/new")} data-tour="add-requirement">Add requirement</Button>} />
      {feedback && <InlineMessage tone={feedback.includes("already exists") ? "warning" : "success"} title={feedback.includes("already exists") ? "Requirement not added" : "Master content saved"}>{feedback}</InlineMessage>}
      <section className={cx("table-card [margin-top:1.25rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)]")}>
        <div className={cx("dashboard-filter-bar [display:flex] [align-items:center] [gap:0.7rem] [margin-top:1.25rem] [flex-wrap:wrap] [margin:0] [border-bottom:1px_solid_var(--neutral-200)] [padding:0.85rem_1rem] max-[1100px]:[align-items:stretch] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column]")} data-tour="requirement-filters">
          <label className={cx("search-control [display:flex] [min-width:250px] [min-height:42px] [flex:1] [align-items:center] [gap:0.55rem] [border:1px_solid_var(--neutral-300)] [border-radius:var(--radius-md)] [background:var(--surface-input)] [padding:0_0.75rem] [color:var(--neutral-500)] [&:focus-within]:[border-color:var(--kc-600)] [&:focus-within]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input]:[min-width:0] [&_input]:[flex:1] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[color:var(--neutral-900)] [&_input]:[font-size:0.85rem] [.dashboard-filter-bar_&]:[flex:0_1_420px] [.dashboard-filter-bar_&]:[min-width:0] [.dashboard-filter-bar--expanded_&]:[flex:0_1_420px] [.dashboard-filter-bar--expanded_&]:[min-width:0] [.filter-row_&]:[flex:0_1_420px] [.filter-row_&]:[min-width:0] [.content-toolbar_&]:[flex:0_1_420px] [.content-toolbar_&]:[min-width:0] [.requirement-main--editor_.checkbox-list__toolbar_&]:[flex:1_1_320px] [.requirement-main--editor_.checkbox-list__toolbar_&]:[min-width:0] [.checkbox-list__toolbar_&_>_input]:[min-height:0] [.checkbox-list__toolbar_&_>_input]:[border:0]! [.checkbox-list__toolbar_&_>_input]:[border-radius:0] [.checkbox-list__toolbar_&_>_input]:[box-shadow:none]! [.checkbox-list__toolbar_&_>_input]:[outline:0]! [.checkbox-list__toolbar_&_>_input]:[padding:0] [.checkbox-list__toolbar_&]:[flex:0_1_420px] [.checkbox-list__toolbar_&]:[min-width:0] max-[1100px]:[.dashboard-filter-bar_&]:[width:100%] max-[1100px]:[.dashboard-filter-bar_&]:[flex-basis:100%] max-[1100px]:[.dashboard-filter-bar_&]:[min-width:0] max-[740px]:[width:100%] max-[740px]:[max-width:none] max-[740px]:[min-width:0] max-[740px]:[flex-basis:auto]!")}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID or requirement" /></label>
          <Select label="Filter section" icon={<Filter size={18} />} value={section} onChange={setSection} options={["All sections", ...sections].map((value) => ({ value, label: value }))} />
          <Select label="Filter publishing state" icon={<FileText size={18} />} value={status} onChange={setStatus} options={["Published and draft", "Published", "Draft"].map((value) => ({ value, label: value }))} />
          <Select label="Filter site" icon={<Building2 size={18} />} searchable value={siteFilter} onChange={setSiteFilter} options={[{ value: "all", label: "All sites" }, ...sites.map((site) => ({ value: site.id, label: site.name }))]} />
        </div>
        <div className={cx("table-card__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [border-bottom:1px_solid_var(--neutral-200)] [padding:1rem_1.15rem] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.1rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.78rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column] table-card__header--results [align-items:center]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Governed content</p><h2>Requirements</h2></div><span>{rows.length} records shown</span></div>
        {rows.length ? (
          <div className={cx("data-table-wrap [max-width:100%] max-[1100px]:[width:100%] max-[1100px]:[max-width:none] max-[1100px]:[overflow:visible]")}>
            <table className={cx("data-table [width:100%] [table-layout:fixed] [border-collapse:collapse] [font-size:0.79rem] [&_th]:[overflow-wrap:anywhere] [&_td]:[overflow-wrap:anywhere] [&_th]:[padding:0.8rem_1rem] [&_th]:[border-bottom:1px_solid_var(--neutral-200)] [&_th]:[text-align:left] [&_th]:[vertical-align:middle] [&_td]:[padding:0.8rem_1rem] [&_td]:[border-bottom:1px_solid_var(--neutral-200)] [&_td]:[text-align:left] [&_td]:[vertical-align:middle] [&_th]:[background:var(--neutral-50)] [&_th]:[color:var(--neutral-600)] [&_th]:[font-size:0.69rem] [&_th]:[font-weight:750] [&_th]:[letter-spacing:0.01em] [&_tr:last-child_td]:[border-bottom:0] [&_tbody_tr:hover]:[background:var(--neutral-25)] [&_td_>_strong]:[display:block] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[display:block] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[margin-top:0.18rem] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[color:var(--neutral-500)] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[font-size:0.7rem] [&_td:nth-child(3)]:[max-width:390px] max-[1100px]:[display:block] max-[1100px]:[width:100%] max-[1100px]:[min-width:0] max-[1100px]:[&_tbody]:[display:grid] max-[1100px]:[&_tbody]:[width:100%] max-[1100px]:[&_tbody]:[min-width:0] max-[1100px]:[&_tr]:[display:block] max-[1100px]:[&_tr]:[width:100%] max-[1100px]:[&_tr]:[min-width:0] max-[1100px]:[&_td]:[display:grid] max-[1100px]:[&_td]:[width:100%] max-[1100px]:[&_td]:[min-width:0] max-[1100px]:[&_thead]:[position:absolute] max-[1100px]:[&_thead]:[display:block] max-[1100px]:[&_thead]:[width:1px] max-[1100px]:[&_thead]:[height:1px] max-[1100px]:[&_thead]:[padding:0] max-[1100px]:[&_thead]:[margin:-1px] max-[1100px]:[&_thead]:[overflow:hidden] max-[1100px]:[&_thead]:[clip:rect(0,_0,_0,_0)] max-[1100px]:[&_thead]:[white-space:nowrap] max-[1100px]:[&_thead]:[border:0] max-[1100px]:[&_thead_tr]:[position:absolute] max-[1100px]:[&_thead_tr]:[display:block] max-[1100px]:[&_thead_tr]:[width:1px] max-[1100px]:[&_thead_tr]:[min-width:0] max-[1100px]:[&_thead_tr]:[height:1px] max-[1100px]:[&_thead_tr]:[overflow:hidden] max-[1100px]:[&_thead_tr]:[padding:0] max-[1100px]:[&_thead_tr]:[border:0] max-[1100px]:[&_thead_tr]:[clip-path:inset(50%)] max-[1100px]:[&_thead_th]:[position:absolute] max-[1100px]:[&_thead_th]:[display:block] max-[1100px]:[&_thead_th]:[width:1px] max-[1100px]:[&_thead_th]:[min-width:0] max-[1100px]:[&_thead_th]:[height:1px] max-[1100px]:[&_thead_th]:[overflow:hidden] max-[1100px]:[&_thead_th]:[padding:0] max-[1100px]:[&_thead_th]:[border:0] max-[1100px]:[&_thead_th]:[clip-path:inset(50%)] max-[1100px]:[&_tbody]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[1100px]:[&_tbody]:[gap:0.75rem] max-[1100px]:[&_tbody]:[padding:0.85rem] max-[1100px]:[&_tbody_tr]:[overflow:hidden] max-[1100px]:[&_tbody_tr]:[border:1px_solid_var(--neutral-200)] max-[1100px]:[&_tbody_tr]:[border-radius:var(--radius-lg)] max-[1100px]:[&_tbody_tr]:[background:var(--neutral-25)] max-[1100px]:[&_tbody_tr]:[box-shadow:var(--shadow-1)] max-[1100px]:[&_td]:[grid-template-columns:minmax(116px,_0.45fr)_minmax(0,_1fr)] max-[1100px]:[&_td]:[align-items:center] max-[1100px]:[&_td]:[gap:0.75rem] max-[1100px]:[&_td]:[min-height:48px] max-[1100px]:[&_td]:[padding:0.7rem_0.85rem] max-[1100px]:[&_td]:[border-bottom:1px_solid_var(--neutral-200)] max-[1100px]:[&_td::before]:[color:var(--neutral-500)] max-[1100px]:[&_td::before]:[content:attr(data-label)] max-[1100px]:[&_td::before]:[font-size:0.67rem] max-[1100px]:[&_td::before]:[font-weight:750] max-[1100px]:[&_td::before]:[letter-spacing:0.01em] max-[1100px]:[&_td:last-child]:[min-height:44px] max-[1100px]:[&_td:last-child]:[grid-template-columns:1fr] max-[1100px]:[&_td:last-child]:[justify-items:end] max-[1100px]:[&_td:last-child]:[border-bottom:0] max-[1100px]:[&_td:last-child]:[background:var(--neutral-50)] max-[1100px]:[&_td:last-child::before]:[display:none] max-[1100px]:[&_td[data-label='']::before]:[display:none] max-[1100px]:[&_td_>_strong]:[min-width:0] max-[1100px]:[&_td_>_strong]:[overflow-wrap:anywhere] max-[1100px]:[&_td_>_span]:[min-width:0] max-[1100px]:[&_td_>_span]:[overflow-wrap:anywhere] max-[1100px]:[&_td_>_div]:[min-width:0] max-[1100px]:[&_td_>_div]:[overflow-wrap:anywhere] max-[820px]:[&_tbody]:[grid-template-columns:1fr] data-table--requirements [table-layout:fixed] [&_th:nth-child(1)]:[width:13%] [&_th:nth-child(2)]:[width:35%] [&_th:nth-child(3)]:[width:18%] [&_th:nth-child(4)]:[width:14%] [&_th:nth-child(5)]:[width:11%] [&_th:nth-child(6)]:[width:9%]")}>
              <thead><tr><th>ID</th><th>Requirement</th><th>Section</th><th>Sites</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{rows.map((item) => (
                <tr key={item.id} className={cx("data-table__row--link [cursor:pointer] hover:[background:var(--kc-50)]")} onClick={() => navigate(`/admin/requirements/${item.id}`)}>
                  <td data-label="ID"><strong>{item.id}</strong></td>
                  <td data-label="Requirement"><strong>{item.title}</strong><span>Guidance and evidence requirements configured</span></td>
                  <td data-label="Section">{item.section}</td>
                  <td data-label="Sites" title={siteCodesSummary(sites, item.siteIds).title}>{siteCodesSummary(sites, item.siteIds).text}</td>
                  <td data-label="Status"><span className={cx("publish-badge [display:inline-flex]! [width:fit-content] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.5rem] [font-size:0.7rem]! [font-weight:700] [border-color:var(--success-border)]! [background:var(--success-surface)] [color:var(--success)]! max-[1100px]:[.data-table_&]:[justify-self:start] max-[720px]:[.import-preview-requirement__summary_>_&]:[grid-column:2] max-[720px]:[.import-preview-requirement__summary_>_&]:[justify-self:start]", item.status === "Draft" && "publish-badge--draft [border-color:#d6bbfb]! [background:var(--provisional-surface)] [color:var(--provisional)]!")}>{item.status}</span></td>
                  <td data-label="Actions"><span className={cx("row-actions [display:flex]! [gap:0.1rem] max-[1100px]:[.data-table_&]:[justify-content:flex-end] row-actions--menu [position:relative]")}>
                    <IconButton label={`Edit ${item.id}`} onClick={(event) => { event.stopPropagation(); navigate(`/admin/requirements/${item.id}`); }}><Pencil size={17} /></IconButton>
                    <IconButton label={`More actions for ${item.id}`} onClick={(event) => { event.stopPropagation(); setMenu(menu === item.id ? null : item.id); }}><MoreHorizontal size={18} /></IconButton>
                    {menu === item.id && <span className={cx("row-menu [position:absolute] [z-index:20] [top:calc(100%_+_0.25rem)] [right:0] [display:grid]! [width:160px] [overflow:hidden] [border:1px_solid_var(--neutral-200)] [border-radius:10px] [background:var(--surface-elevated)] [box-shadow:var(--shadow-2)] [&_button]:[display:flex] [&_button]:[align-items:center] [&_button]:[gap:0.4rem] [&_button]:[border:0] [&_button]:[border-bottom:1px_solid_var(--neutral-100)] [&_button]:[background:transparent] [&_button]:[color:var(--neutral-800)] [&_button]:[padding:0.65rem_0.75rem] [&_button]:[font-size:0.74rem] [&_button]:[text-align:left] [&_button:hover]:[background:var(--kc-50)] [&_button:hover]:[color:var(--kc-800)]")} onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => { updateMasterRequirement({ ...item, status: item.status === "Published" ? "Draft" : "Published" }); setFeedback(`${item.id} status changed to ${item.status === "Published" ? "Draft" : "Published"}.`); setMenu(null); }}>{item.status === "Published" ? "Move to draft" : "Publish"}</button>
                      <button onClick={() => { const copy = { ...item, id: `${item.id}-COPY-${Date.now().toString().slice(-4)}`, title: `${item.title} copy`, status: "Draft" as const, importBatchId: undefined }; addMasterRequirement(copy); setFeedback(`${item.id} was duplicated as a draft.`); setMenu(null); }}><Copy size={15} /> Duplicate</button>
                      <button className={cx("row-menu__delete [.row-menu_&]:[color:var(--danger)] [.row-menu_&:hover]:[background:var(--danger-surface)] [.row-menu_&:hover]:[color:var(--danger)]")} onClick={() => { setDeleting(item); setMenu(null); }}><Trash2 size={15} /> Delete requirement</button>
                    </span>}
                  </span></td>
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
  "enterprise-viewer": "Regional / enterprise viewer",
  administrator: "Administrator",
};

function SiteUserDialog({ user, siteId, onClose, onSave }: { user?: SiteUser; siteId: string; onClose: () => void; onSave: (user: SiteUser) => void }) {
  const [draft, setDraft] = useState<SiteUser>(user ?? { id: `su-${Date.now().toString().slice(-6)}`, name: "", email: "", role: "site-contributor", siteId, status: "Active" });
  const [submitted, setSubmitted] = useState(false);
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim());
  const valid = Boolean(draft.name.trim()) && emailValid;
  return <div className={cx("dialog-layer [position:fixed] [z-index:100] [inset:0] [display:grid] [place-items:center]")}><button className={cx("dialog-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label="Close user editor" onClick={onClose} /><section className={cx("dialog [position:relative] [width:min(560px,_calc(100%_-_2rem))] [max-height:calc(100vh_-_2rem)] [overflow-y:auto] [border:1px_solid_var(--border-glass)] [border-radius:var(--radius-xl)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:dialog-in_180ms_ease-out]")} role="dialog" aria-modal="true" aria-labelledby="site-user-dialog-title">
    <div className={cx("dialog__header [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [padding:1rem_1.1rem] [border-bottom:1px_solid_var(--neutral-200)] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.2rem]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Site access</p><h2 id="site-user-dialog-title">{user ? `Edit ${user.name}` : "Assign user to site"}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <div className={cx("dialog-form [display:grid] [gap:1rem] [padding:1.1rem] form-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:1rem_1.15rem] [padding:1.2rem] max-[740px]:[grid-template-columns:1fr]")}>
      <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", "field--wide [grid-column:1_/_-1]", submitted && !draft.name.trim() && "field--invalid [&_input]:[border-color:var(--danger)]! [&_input]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_textarea]:[border-color:var(--danger)]! [&_textarea]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_select]:[border-color:var(--danger)]! [&_select]:[box-shadow:0_0_0_3px_var(--danger-surface)]")}>
        <span>Full name <b>Required</b></span>
        <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="For example, Maya Patel" />
        {submitted && !draft.name.trim() && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Enter a name for this person.</small>}
      </label>
      <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", "field--wide [grid-column:1_/_-1]", submitted && !emailValid && "field--invalid [&_input]:[border-color:var(--danger)]! [&_input]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_textarea]:[border-color:var(--danger)]! [&_textarea]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_select]:[border-color:var(--danger)]! [&_select]:[box-shadow:0_0_0_3px_var(--danger-surface)]")}>
        <span>Email <b>Required</b></span>
        <input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="name@example.com" />
        {submitted && !emailValid && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Enter a valid email address.</small>}
      </label>
      <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]")}>
        <span>Role</span>
        <Select label="Role" value={draft.role} onChange={(value) => setDraft((current) => ({ ...current, role: value as SiteUserRole }))} options={(Object.keys(roleLabels) as SiteUserRole[]).map((value) => ({ value, label: roleLabels[value] }))} />
      </label>
      <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]")}>
        <span>Status</span>
        <Select label="Status" value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value as SiteUser["status"] }))} options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
      </label>
    </div>
    <div className={cx("dialog__footer [display:flex] [align-items:center] [justify-content:flex-end] [gap:1rem] [padding:1rem_1.1rem] [border-top:1px_solid_var(--neutral-200)] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column-reverse]")}><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Check size={17} />} onClick={() => { setSubmitted(true); if (valid) onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim() }); }}>{user ? "Save changes" : "Assign user"}</Button></div>
  </section></div>;
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
      <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem]")}>
        <nav className={cx("breadcrumbs [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.35rem] [margin-bottom:1rem] [color:var(--neutral-500)] [font-size:0.72rem] [&_a]:[color:var(--kc-700)] [&_a]:[font-weight:600]")} aria-label="Breadcrumb"><Link to="/admin/sites">Sites</Link><ChevronRight size={15} /><span aria-current="page">Not found</span></nav>
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
    <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem]")}>
      <nav className={cx("breadcrumbs [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.35rem] [margin-bottom:1rem] [color:var(--neutral-500)] [font-size:0.72rem] [&_a]:[color:var(--kc-700)] [&_a]:[font-weight:600]")} aria-label="Breadcrumb"><Link to="/admin/sites">Sites</Link><ChevronRight size={15} /><span aria-current="page">{site.name}</span></nav>
      <PageHeader eyebrow="Administration" title={site.name} description={`${site.code} · ${site.region} · ${site.segment}`} actions={<><Button variant="secondary" icon={<Plus size={18} />} onClick={() => setEditing("new")}>Assign user</Button><Link className={cx("button [display:inline-flex] [min-width:0] [align-items:center] [justify-content:center] [gap:0.5rem] [border:1px_solid_transparent] [border-radius:var(--radius-md)] [font-size:0.9rem] [font-weight:650] [line-height:1] [white-space:nowrap] [transition:background_120ms_ease,_border-color_120ms_ease,_box-shadow_120ms_ease,_color_120ms_ease,_transform_80ms_ease] disabled:[background:var(--neutral-100)] disabled:[border-color:var(--neutral-200)] disabled:[color:var(--neutral-400)] disabled:[box-shadow:none] [.question-evidence__editor_>_&]:[justify-self:start] [.question-evidence__attachments-header_>_&]:[flex:0_0_auto] [.site-assessment-area-row_>_&]:[justify-self:end] max-[900px]:[.site-assessment-area-row_>_&]:[grid-column:1_/_-1] max-[900px]:[.site-assessment-area-row_>_&]:[justify-self:stretch] max-[900px]:[.site-assessment-area-row_>_&]:[width:100%] max-[760px]:[.site-assessment-priority_&]:[width:100%] [.action-editor__header_>_&]:[margin-left:auto] max-[1500px]:[.requirement-mobile-toolbar_&:first-child]:[display:none] max-[1100px]:[.requirement-mobile-toolbar_&:first-child]:[display:inline-flex] max-[740px]:[.page-header__actions_&]:[width:100%] max-[740px]:[.overview-callout_&]:[grid-column:1_/_-1] max-[740px]:[.overview-callout_&]:[width:100%] max-[740px]:[.requirement-footer_>_&]:[width:100%] max-[740px]:[.requirement-footer_>_div_&]:[width:100%] max-[740px]:[.dialog__footer_&]:[width:100%] max-[740px]:[.section-drilldown-row_>_&]:[grid-column:1_/_-1] max-[740px]:[.section-drilldown-row_>_&]:[width:100%] max-[740px]:[.import-card__footer_&]:[width:100%] max-[740px]:[.result-state_&]:[width:100%] [.help-role-grid_&]:[width:100%] [.help-role-grid_&]:[margin-top:auto] max-[900px]:[.help-role-grid_&]:[width:auto] max-[620px]:[.setup-welcome__actions_&]:[width:100%] max-[620px]:[.tour-card__footer_&:last-child]:[flex:1] max-[620px]:[.setup-reminder_>_&]:[grid-column:2_/_-1] max-[620px]:[.setup-reminder_>_&]:[grid-row:2] max-[620px]:[.setup-reminder_>_&]:[width:100%] max-[620px]:[.help-role-grid_&]:[grid-column:1_/_-1] max-[620px]:[.help-role-grid_&]:[width:100%] max-[620px]:[.setup-complete_&]:[width:100%] [.passkey-add_&]:[width:100%] [.passkey-setup-message_&]:[flex:0_0_auto] max-[620px]:[.passkey-enrollment-choice_&]:[grid-column:2] max-[620px]:[.passkey-enrollment-choice_&]:[justify-self:start] max-[620px]:[.settings-card--split_>_&]:[width:100%] [.settings-index-empty_&]:[margin-top:0.3rem] max-[620px]:[.session-panel_&]:[grid-column:1_/_-1] max-[620px]:[.session-panel_&]:[width:100%] [.first-login-passkey__complete_&]:[margin-top:0.35rem] max-[620px]:[.first-login-passkey__actions_&]:[width:100%] button--primary [background:var(--brand-solid)] [border-color:var(--brand-solid)] [color:#fff] [box-shadow:0_1px_2px_rgb(12_42_62_/_0.16)] [&:hover:not(:disabled)]:[background:var(--brand-solid-hover)] [&:hover:not(:disabled)]:[border-color:var(--brand-solid-hover)] [&:active:not(:disabled)]:[background:var(--brand-solid-active)] [&:active:not(:disabled)]:[transform:translateY(1px)] button--default [min-height:42px] [padding:0.68rem_1rem]")} to={`/sites/${site.id}`}><ListChecks size={18} /><span>View assessment</span></Link></>} />
      {feedback && <InlineMessage tone={feedback.includes("already assigned") ? "warning" : "success"} title={feedback.includes("already assigned") ? "User not assigned" : "Site access updated"}>{feedback}</InlineMessage>}

      <div className={cx("metrics-grid [display:grid] [grid-template-columns:repeat(4,_minmax(0,_1fr))] [gap:1rem] [margin-top:1.25rem] max-[1500px]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[740px]:[grid-template-columns:1fr]")}>
        <MetricCard label="Completion" value={`${site.completion}%`} detail="Assessment completion" icon={<Target size={21} />} tone="brand" />
        <MetricCard label="Open gaps" value={site.gaps} detail="No and Partial responses" icon={<AlertCircle size={21} />} tone={site.gaps > 20 ? "danger" : "neutral"} />
        <MetricCard label="Last updated" value={site.updated} detail="Current assessment record" icon={<History size={21} />} />
        <MetricCard label="Assigned users" value={users.length} detail={`${users.filter((user) => user.status === "Active").length} active`} icon={<UsersRound size={21} />} />
      </div>

      <section className={cx("table-card [margin-top:1.25rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)]")}>
        <div className={cx("table-card__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [border-bottom:1px_solid_var(--neutral-200)] [padding:1rem_1.15rem] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.1rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.78rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column] table-card__header--results [align-items:center]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Site access</p><h2>Assigned users</h2></div><span>{users.length} user{users.length === 1 ? "" : "s"}</span></div>
        {users.length ? <div className={cx("data-table-wrap [max-width:100%] max-[1100px]:[width:100%] max-[1100px]:[max-width:none] max-[1100px]:[overflow:visible]")}><table className={cx("data-table [width:100%] [table-layout:fixed] [border-collapse:collapse] [font-size:0.79rem] [&_th]:[overflow-wrap:anywhere] [&_td]:[overflow-wrap:anywhere] [&_th]:[padding:0.8rem_1rem] [&_th]:[border-bottom:1px_solid_var(--neutral-200)] [&_th]:[text-align:left] [&_th]:[vertical-align:middle] [&_td]:[padding:0.8rem_1rem] [&_td]:[border-bottom:1px_solid_var(--neutral-200)] [&_td]:[text-align:left] [&_td]:[vertical-align:middle] [&_th]:[background:var(--neutral-50)] [&_th]:[color:var(--neutral-600)] [&_th]:[font-size:0.69rem] [&_th]:[font-weight:750] [&_th]:[letter-spacing:0.01em] [&_tr:last-child_td]:[border-bottom:0] [&_tbody_tr:hover]:[background:var(--neutral-25)] [&_td_>_strong]:[display:block] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[display:block] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[margin-top:0.18rem] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[color:var(--neutral-500)] [&_td_>_span:not(.status-badge):not(.completion-badge):not(.publish-badge):not(.response-chip):not(.gap-count):not(.detail-status)]:[font-size:0.7rem] [&_td:nth-child(3)]:[max-width:390px] max-[1100px]:[display:block] max-[1100px]:[width:100%] max-[1100px]:[min-width:0] max-[1100px]:[&_tbody]:[display:grid] max-[1100px]:[&_tbody]:[width:100%] max-[1100px]:[&_tbody]:[min-width:0] max-[1100px]:[&_tr]:[display:block] max-[1100px]:[&_tr]:[width:100%] max-[1100px]:[&_tr]:[min-width:0] max-[1100px]:[&_td]:[display:grid] max-[1100px]:[&_td]:[width:100%] max-[1100px]:[&_td]:[min-width:0] max-[1100px]:[&_thead]:[position:absolute] max-[1100px]:[&_thead]:[display:block] max-[1100px]:[&_thead]:[width:1px] max-[1100px]:[&_thead]:[height:1px] max-[1100px]:[&_thead]:[padding:0] max-[1100px]:[&_thead]:[margin:-1px] max-[1100px]:[&_thead]:[overflow:hidden] max-[1100px]:[&_thead]:[clip:rect(0,_0,_0,_0)] max-[1100px]:[&_thead]:[white-space:nowrap] max-[1100px]:[&_thead]:[border:0] max-[1100px]:[&_thead_tr]:[position:absolute] max-[1100px]:[&_thead_tr]:[display:block] max-[1100px]:[&_thead_tr]:[width:1px] max-[1100px]:[&_thead_tr]:[min-width:0] max-[1100px]:[&_thead_tr]:[height:1px] max-[1100px]:[&_thead_tr]:[overflow:hidden] max-[1100px]:[&_thead_tr]:[padding:0] max-[1100px]:[&_thead_tr]:[border:0] max-[1100px]:[&_thead_tr]:[clip-path:inset(50%)] max-[1100px]:[&_thead_th]:[position:absolute] max-[1100px]:[&_thead_th]:[display:block] max-[1100px]:[&_thead_th]:[width:1px] max-[1100px]:[&_thead_th]:[min-width:0] max-[1100px]:[&_thead_th]:[height:1px] max-[1100px]:[&_thead_th]:[overflow:hidden] max-[1100px]:[&_thead_th]:[padding:0] max-[1100px]:[&_thead_th]:[border:0] max-[1100px]:[&_thead_th]:[clip-path:inset(50%)] max-[1100px]:[&_tbody]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] max-[1100px]:[&_tbody]:[gap:0.75rem] max-[1100px]:[&_tbody]:[padding:0.85rem] max-[1100px]:[&_tbody_tr]:[overflow:hidden] max-[1100px]:[&_tbody_tr]:[border:1px_solid_var(--neutral-200)] max-[1100px]:[&_tbody_tr]:[border-radius:var(--radius-lg)] max-[1100px]:[&_tbody_tr]:[background:var(--neutral-25)] max-[1100px]:[&_tbody_tr]:[box-shadow:var(--shadow-1)] max-[1100px]:[&_td]:[grid-template-columns:minmax(116px,_0.45fr)_minmax(0,_1fr)] max-[1100px]:[&_td]:[align-items:center] max-[1100px]:[&_td]:[gap:0.75rem] max-[1100px]:[&_td]:[min-height:48px] max-[1100px]:[&_td]:[padding:0.7rem_0.85rem] max-[1100px]:[&_td]:[border-bottom:1px_solid_var(--neutral-200)] max-[1100px]:[&_td::before]:[color:var(--neutral-500)] max-[1100px]:[&_td::before]:[content:attr(data-label)] max-[1100px]:[&_td::before]:[font-size:0.67rem] max-[1100px]:[&_td::before]:[font-weight:750] max-[1100px]:[&_td::before]:[letter-spacing:0.01em] max-[1100px]:[&_td:last-child]:[min-height:44px] max-[1100px]:[&_td:last-child]:[grid-template-columns:1fr] max-[1100px]:[&_td:last-child]:[justify-items:end] max-[1100px]:[&_td:last-child]:[border-bottom:0] max-[1100px]:[&_td:last-child]:[background:var(--neutral-50)] max-[1100px]:[&_td:last-child::before]:[display:none] max-[1100px]:[&_td[data-label='']::before]:[display:none] max-[1100px]:[&_td_>_strong]:[min-width:0] max-[1100px]:[&_td_>_strong]:[overflow-wrap:anywhere] max-[1100px]:[&_td_>_span]:[min-width:0] max-[1100px]:[&_td_>_span]:[overflow-wrap:anywhere] max-[1100px]:[&_td_>_div]:[min-width:0] max-[1100px]:[&_td_>_div]:[overflow-wrap:anywhere] max-[820px]:[&_tbody]:[grid-template-columns:1fr]")}><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.map((user) => (
          <tr key={user.id}>
            <td data-label="Name"><strong>{user.name}</strong></td>
            <td data-label="Email">{user.email}</td>
            <td data-label="Role">{roleLabels[user.role]}</td>
            <td data-label="Status"><span className={cx("publish-badge [display:inline-flex]! [width:fit-content] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.5rem] [font-size:0.7rem]! [font-weight:700] [border-color:var(--success-border)]! [background:var(--success-surface)] [color:var(--success)]! max-[1100px]:[.data-table_&]:[justify-self:start] max-[720px]:[.import-preview-requirement__summary_>_&]:[grid-column:2] max-[720px]:[.import-preview-requirement__summary_>_&]:[justify-self:start]", user.status === "Inactive" && "publish-badge--draft [border-color:#d6bbfb]! [background:var(--provisional-surface)] [color:var(--provisional)]!")}>{user.status}</span></td>
            <td data-label="Actions"><span className={cx("row-actions [display:flex]! [gap:0.1rem] max-[1100px]:[.data-table_&]:[justify-content:flex-end]")}><IconButton label={`Edit ${user.name}`} onClick={() => setEditing(user)}><Pencil size={17} /></IconButton><IconButton label={`Remove ${user.name} from this site`} onClick={() => setRemoving(user)}><Trash2 size={17} /></IconButton></span></td>
          </tr>
        ))}</tbody></table></div> : <EmptyState icon={<UsersRound size={27} />} title="No users assigned" description="Assign a user to give them access to this site's workspace." />}
      </section>

      <section className={cx("page-section [margin-top:2.2rem]")}>
        <div className={cx("section-title-row [display:flex] [align-items:flex-end] [justify-content:space-between] [gap:1rem] [margin-bottom:1rem] [&_h2]:[margin-top:0.25rem] [&_>_div_>_span]:[color:var(--neutral-500)] [&_>_div_>_span]:[font-size:0.85rem] [&_>_span]:[color:var(--neutral-500)] [&_>_span]:[font-size:0.85rem] [.site-support-details__content_&]:[margin-bottom:1rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Read-only</p><h2>Program &amp; standard owners</h2></div></div>
        <OwnersPanel owners={hasRealSiteRecords ? ownerRecords : null} />
      </section>

      <section className={cx("page-section [margin-top:2.2rem]")}>
        <div className={cx("section-title-row [display:flex] [align-items:flex-end] [justify-content:space-between] [gap:1rem] [margin-bottom:1rem] [&_h2]:[margin-top:0.25rem] [&_>_div_>_span]:[color:var(--neutral-500)] [&_>_div_>_span]:[font-size:0.85rem] [&_>_span]:[color:var(--neutral-500)] [&_>_span]:[font-size:0.85rem] [.site-support-details__content_&]:[margin-bottom:1rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Read-only</p><h2>Site information</h2></div></div>
        <ContactsPanel contacts={hasRealSiteRecords ? siteContacts : null} />
      </section>

      {editing && <SiteUserDialog user={editing === "new" ? undefined : editing} siteId={site.id} onClose={() => setEditing(null)} onSave={saveUser} />}
      {removing && <ConfirmDialog eyebrow="Site access" title={`Remove ${removing.name} from this site?`} body={`${removing.name} will lose access to ${currentSite.name}. This does not delete any assessment work they have recorded.`} confirmLabel="Remove user" cancelLabel="Keep user" onCancel={() => setRemoving(null)} onConfirm={() => { removeSiteUser(removing.id); setFeedback(`${removing.name} was removed from ${currentSite.name}.`); setRemoving(null); }} />}
    </div>
  );
}

const SITE_CSV_COLUMNS = "Site name,Site code,Region,Segment";

function slugifySiteId(code: string) {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `site-${Date.now().toString().slice(-6)}`;
}

function blankSite(): DashboardSite {
  return { id: "", name: "", code: "", region: "", segment: "", completion: 0, performance: "not-assessed", gaps: 0, updated: "Not started" };
}


const ADD_NEW_VALUE = "__add_new__";

/**
 * Value picker that avoids the native <datalist> popup (OS-drawn, unstyleable) while still
 * allowing a value that does not exist yet: the styled Select lists known values plus an
 * "Add new" entry which swaps in a text field.
 */
function ValueWithAddNew({
  label,
  value,
  options,
  placeholder,
  invalid,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const known = options.includes(value);
  const showInput = addingNew || (Boolean(value) && !known);
  if (showInput) {
    return (
      <span className={cx("value-add-new [display:flex] [align-items:center] [gap:0.5rem] [min-width:0] [&_input]:[flex:1] [&_input]:[min-width:0] [&_>_button]:[flex:none] [&_>_button]:[border:0] [&_>_button]:[background:none] [&_>_button]:[padding:0] [&_>_button]:[color:var(--kc-700)] [&_>_button]:[font-size:0.74rem] [&_>_button]:[font-weight:650] [&_>_button]:[white-space:nowrap] [&_>_button]:[cursor:pointer] [&_>_button:hover]:[color:var(--kc-800)] [&_>_button:hover]:[text-decoration:underline]")}>
        <input
          autoFocus
          value={value}
          placeholder={placeholder}
          aria-label={`New ${label.toLowerCase()}`}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {options.length > 0 && (
          <button type="button" onClick={() => { setAddingNew(false); onChange(""); }}>
            Choose existing
          </button>
        )}
      </span>
    );
  }
  return (
    <Select
      label={label}
      value={value}
      onChange={(next) => {
        if (next === ADD_NEW_VALUE) { setAddingNew(true); onChange(""); return; }
        onChange(next);
      }}
      options={[
        ...(value ? [] : [{ value: "", label: `Select ${label.toLowerCase()}` }]),
        ...options.map((option) => ({ value: option, label: option })),
        { value: ADD_NEW_VALUE, label: `+ Add new ${label.toLowerCase()}` },
      ]}
    />
  );
}

function SiteDialog({ site, existing, onClose, onSave }: { site?: DashboardSite; existing: DashboardSite[]; onClose: () => void; onSave: (site: DashboardSite) => void }) {
  const [draft, setDraft] = useState<DashboardSite>(site ?? blankSite());
  const [submitted, setSubmitted] = useState(false);
  const trimmedCode = draft.code.trim();
  const duplicateCode = Boolean(trimmedCode) && existing.some((item) => item.code.toLowerCase() === trimmedCode.toLowerCase() && item.id !== draft.id);
  const valid = Boolean(draft.name.trim() && trimmedCode && draft.region.trim() && draft.segment.trim()) && !duplicateCode;
  const set = (key: keyof DashboardSite, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className={cx("dialog-layer [position:fixed] [z-index:100] [inset:0] [display:grid] [place-items:center]")}><button className={cx("dialog-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label="Close site editor" onClick={onClose} /><section className={cx("dialog [position:relative] [width:min(560px,_calc(100%_-_2rem))] [max-height:calc(100vh_-_2rem)] [overflow-y:auto] [border:1px_solid_var(--border-glass)] [border-radius:var(--radius-xl)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:dialog-in_180ms_ease-out]")} role="dialog" aria-modal="true" aria-labelledby="site-dialog-title">
    <div className={cx("dialog__header [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [padding:1rem_1.1rem] [border-bottom:1px_solid_var(--neutral-200)] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.2rem]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Site network</p><h2 id="site-dialog-title">{site ? `Edit ${site.name}` : "Create site"}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <div className={cx("dialog-form [display:grid] [gap:1rem] [padding:1.1rem] form-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:1rem_1.15rem] [padding:1.2rem] max-[740px]:[grid-template-columns:1fr]")}>
      <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", "field--wide [grid-column:1_/_-1]", submitted && !draft.name.trim() && "field--invalid [&_input]:[border-color:var(--danger)]! [&_input]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_textarea]:[border-color:var(--danger)]! [&_textarea]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_select]:[border-color:var(--danger)]! [&_select]:[box-shadow:0_0_0_3px_var(--danger-surface)]")}>
        <span>Site name <b>Required</b></span>
        <input value={draft.name} onChange={(event) => set("name", event.target.value)} placeholder="For example, Northstar Manufacturing" />
        {submitted && !draft.name.trim() && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Enter the site name.</small>}
      </label>
      <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", (submitted && !trimmedCode) || duplicateCode ? "field--invalid [&_input]:[border-color:var(--danger)]! [&_input]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_textarea]:[border-color:var(--danger)]! [&_textarea]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_select]:[border-color:var(--danger)]! [&_select]:[box-shadow:0_0_0_3px_var(--danger-surface)]" : undefined)}>
        <span>Site code <b>Required</b></span>
        <input value={draft.code} onChange={(event) => set("code", event.target.value)} placeholder="KC-NSM-042" />
        {submitted && !trimmedCode && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Enter the KC site code.</small>}
        {duplicateCode && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>This site code already exists.</small>}
      </label>
      <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", submitted && !draft.region.trim() && "field--invalid [&_input]:[border-color:var(--danger)]! [&_input]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_textarea]:[border-color:var(--danger)]! [&_textarea]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_select]:[border-color:var(--danger)]! [&_select]:[box-shadow:0_0_0_3px_var(--danger-surface)]")}>
        <span>Region <b>Required</b></span>
        <ValueWithAddNew
          label="Region"
          value={draft.region}
          options={[...new Set(existing.map((item) => item.region))].filter(Boolean).sort()}
          placeholder="North America"
          invalid={submitted && !draft.region.trim()}
          onChange={(value) => set("region", value)}
        />
        {submitted && !draft.region.trim() && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Enter the region.</small>}
      </label>
      <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", "field--wide [grid-column:1_/_-1]", submitted && !draft.segment.trim() && "field--invalid [&_input]:[border-color:var(--danger)]! [&_input]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_textarea]:[border-color:var(--danger)]! [&_textarea]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_select]:[border-color:var(--danger)]! [&_select]:[box-shadow:0_0_0_3px_var(--danger-surface)]")}>
        <span>Segment <b>Required</b></span>
        <ValueWithAddNew
          label="Segment"
          value={draft.segment}
          options={[...new Set(existing.map((item) => item.segment))].filter(Boolean).sort()}
          placeholder="Family Care"
          invalid={submitted && !draft.segment.trim()}
          onChange={(value) => set("segment", value)}
        />
        {submitted && !draft.segment.trim() && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Enter the business segment.</small>}
      </label>
    </div>
    <div className={cx("dialog__footer [display:flex] [align-items:center] [justify-content:flex-end] [gap:1rem] [padding:1rem_1.1rem] [border-top:1px_solid_var(--neutral-200)] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column-reverse]")}><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Check size={17} />} onClick={() => {
      setSubmitted(true);
      if (!valid) return;
      onSave({ ...draft, name: draft.name.trim(), code: trimmedCode, region: draft.region.trim(), segment: draft.segment.trim(), id: draft.id || slugifySiteId(trimmedCode) });
    }}>{site ? "Save changes" : "Create site"}</Button></div>
  </section></div>;
}

interface SiteImportOutcome {
  parsed: DashboardSite[];
  invalid: string[];
}

/** Minimal CSV reader: handles quoted fields and embedded commas, which is all the site
 *  columns need. Rows missing any required column are reported rather than silently dropped. */
function parseSitesCsv(text: string): SiteImportOutcome {
  // Excel writes a UTF-8 BOM; strip it by code point rather than embedding the literal
  // character in a regex, which trips the no-irregular-whitespace lint rule.
  const body = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const rows = body.split(/\r?\n/).filter((line) => line.trim());
  const invalid: string[] = [];
  const parsed: DashboardSite[] = [];
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
  const startsWithHeader = rows[0]?.toLowerCase().includes("site name") || rows[0]?.toLowerCase().includes("site code");
  rows.slice(startsWithHeader ? 1 : 0).forEach((line, index) => {
    const [name, code, region, segment] = splitRow(line);
    const rowNumber = index + (startsWithHeader ? 2 : 1);
    if (!name || !code || !region || !segment) { invalid.push(`Row ${rowNumber}: needs all four columns (${SITE_CSV_COLUMNS}).`); return; }
    parsed.push({ ...blankSite(), id: slugifySiteId(code), name, code, region, segment });
  });
  return { parsed, invalid };
}
