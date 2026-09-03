import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilterX,

  MapPin,
  Paperclip,
  Search,
  Target,
  UsersRound,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDashboard } from "../model/useDashboard";
import { useAuth } from "../../auth";
import { useGuidedSetup } from "../../onboarding";
import { performanceForResponse, performanceLabel, responseLabel } from "../../../shared/domain/assessment";
import { requirementRoute } from "../../../app/router/links";
import type { AssessmentQuestion, DashboardSite, Performance, Requirement, SectionSummary } from "../../../shared/types";
import type { AssignedSite } from "../../../data-access/contracts";
import { Button, CompletionBadge, EmptyState, eyebrowClasses, InlineMessage, MetricCard, PageHeader, PerformanceBadge, ProgressBar, Select } from "../../../shared/ui/UI";
import { ContactsPanel, SiteUsersPanel } from "../../sites/components/SitePanels";
import { cx } from "../../../shared/utils";

/* Shared page chrome — identical across every screen in this file. */
const pageContainerClass = "page-container w-full px-4 pt-5 pb-14 sm:px-6 md:pt-6 md:pb-16 lg:px-7 lg:pt-9";
const breadcrumbsClass = "breadcrumbs mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400";
const breadcrumbLinkClass = "font-semibold text-kc-blue-700 dark:text-kc-blue-300";
const sectionTitleRowClass = "section-title-row mb-4 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between";
const tableCardClass = "table-card mt-5 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";
const tableCardHeaderBaseClass = "table-card__header flex flex-col justify-between gap-4 border-b border-slate-200 px-4.5 py-4 dark:border-slate-700";

/*
 * Canonical tinted pill recipe (see shared/ui/UI.tsx `pillBase`/`pillTone`). Not exported there,
 * so it is reproduced locally — every response/publish/gap chip here composes from it directly
 * instead of the deleted dynamicTailwindRecipes state-modifier lookup (dynamic-tailwind-recipes.ts
 * itself still backs other, not-yet-converted screens, so it is not touched).
 */
const pillBase = "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold whitespace-nowrap";
const pillTone = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  neutral: "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
};
const responseTone: Record<string, string> = { yes: pillTone.success, no: pillTone.danger, partial: pillTone.warning };
function responseChipClass(response: string | null | undefined) {
  return cx("response-chip", pillBase, responseTone[response ?? "none"] ?? pillTone.neutral);
}

/*
 * Links styled as buttons reproduce the Button component's canonical recipe (shared/ui/UI.tsx)
 * since <Link> cannot render <Button> itself. No disabled utilities: a link is never :disabled.
 */
const linkButtonBase = "button inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-semibold whitespace-nowrap transition-colors";
const linkButtonVariant = {
  primary: "bg-kc-blue-600 text-white hover:bg-kc-blue-700 active:bg-kc-blue-800",
  tertiary: "bg-transparent text-kc-blue-700 hover:bg-kc-blue-50 hover:text-kc-blue-900 dark:text-kc-blue-300 dark:hover:bg-kc-blue-950",
};
const linkButtonSize = { default: "min-h-10 px-4 py-2.5", compact: "min-h-8 px-3 text-sm" };

const distributionFillTone: Record<string, string> = {
  brand: "bg-kc-blue-600",
  success: "bg-emerald-600 dark:bg-emerald-500",
  warning: "bg-amber-600 dark:bg-amber-500",
  neutral: "bg-slate-400 dark:bg-slate-500",
};

function DistributionBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  return (
    <div className={cx("distribution-row")}>
      <div className={cx("distribution-row__label mb-1 flex justify-between text-sm text-slate-600 dark:text-slate-400")}>
        <span>{label}</span>
        <strong className={cx("text-slate-900 dark:text-slate-100")}>{value}</strong>
      </div>
      <div className={cx("distribution-track h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800")}>
        <span className={cx("distribution-fill block h-full rounded-full forced-colors:bg-forced-highlight", distributionFillTone[tone])} style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

function QuestionResponseHistory({ question }: { question: AssessmentQuestion }) {
  const [open, setOpen] = useState(false);
  const entries = [...(question.history ?? [])].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  if (!entries.length) return null;
  return (
    <div className={cx("response-history mt-3.5 border-t border-slate-200 pt-3 dark:border-slate-700")}>
      <button
        type="button"
        className={cx("response-history__trigger flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:border-kc-blue-300 hover:bg-kc-blue-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-kc-blue-500 focus-visible:outline-offset-2 sm:items-center dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-kc-blue-700 dark:hover:bg-kc-blue-950")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cx("inline-flex items-center gap-1.5")}><Clock3 size={16} /> Response history</span>
        <span className={cx("inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400")}>
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
          <ChevronDown size={16} className={cx("transition-transform duration-150", open && "response-history__chevron--open rotate-180")} />
        </span>
      </button>
      {open && (
        <ol className={cx("response-history__timeline relative mt-3.5 ml-1 grid list-none gap-3 border-l-2 border-slate-200 py-0 pr-0 pl-4.5 sm:ml-1.5 dark:border-slate-700")}>
          {entries.map((entry, index) => (
            <li key={entry.id} className={cx("response-history__entry relative")}>
              <span className={cx("response-history__marker absolute -left-5 top-4 size-2.5 rounded-full border-2 border-white bg-kc-blue-600 ring-1 ring-kc-blue-300 sm:-left-6 dark:border-slate-900 dark:ring-kc-blue-700")} />
              <div className={cx("response-history__entry-card rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900")}>
                <div className={cx("response-history__entry-header flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between")}>
                  <div className={cx("grid gap-0.5")}>
                    <strong className={cx("text-sm text-slate-900 dark:text-slate-100")}>{entry.event}</strong>
                    <span className={cx("text-sm text-slate-500 dark:text-slate-400")}>{entry.recordedBy} · {new Date(entry.recordedAt).toLocaleString()}</span>
                  </div>
                  {index === 0 && <span className={cx("publish-badge", pillBase, pillTone.success)}>Latest</span>}
                </div>
                <div className={cx("response-history__response mt-2.5 flex items-center justify-between gap-3")}>
                  <span className={cx("text-sm font-semibold text-slate-500 dark:text-slate-400")}>Response</span>
                  <span className={responseChipClass(entry.response)}>{responseLabel(entry.response)}</span>
                </div>
                {entry.action && (
                  <div className={cx("response-history__action mt-2.5 rounded-lg bg-white p-2.5 dark:bg-slate-800")}>
                    <strong className={cx("text-sm")}>Corrective action</strong>
                    <p className={cx("mt-1 text-sm text-slate-800 dark:text-slate-200")}>{entry.action.description || "No action description added."}</p>
                    <div className={cx("mt-1.5 flex flex-wrap gap-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400")}>
                      <span>Owner · {entry.action.owner || "Not assigned"}</span>
                      <span>Status · {entry.action.status ?? "Open"}</span>
                      <span>Follow-up · {entry.action.followUp || "Not added"}</span>
                    </div>
                  </div>
                )}
                <div className={cx("response-history__evidence mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400")}>
                  <Paperclip size={14} />
                  <span>{entry.evidence.length} evidence {entry.evidence.length === 1 ? "item" : "items"} at this point</span>
                  {entry.evidence.length > 0 && (
                    <ul className={cx("m-0 mt-1 basis-full list-disc pl-5")}>
                      {entry.evidence.map((item) => (
                        <li key={item.id}>
                          {/* The grid lives on this inner wrapper, not the <li> itself — setting
                              `display: grid` directly on the <li> would drop its bullet marker. */}
                          <div className={cx("grid gap-0.5")}>
                            <span className={cx("text-slate-700 dark:text-slate-300")}>{item.title}{item.detail ? ` — ${item.detail}` : ""}</span>
                            {item.note && <span className={cx("italic")}>How it meets the requirement: {item.note}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/*
 * The sites table keeps its structural switch at exactly 1100px (`shell:`): below that width the
 * table stops being a table and every row becomes a stacked, whole-row-clickable card, so each
 * cell needs its own visible label. Those labels used to come from
 * `td::before { content: attr(data-label) }`, which has no on-scale utility, so they are real
 * spans now — hidden again from `shell:` up, where the real <thead> takes over (mirrors the
 * SiteUsersPanel table in shared/sites/components/SitePanels.tsx).
 */
const dashboardTableWrapClass = "data-table-wrap w-full max-w-full";
const dashboardTableClass = "data-table block w-full min-w-0 table-fixed border-collapse text-sm text-slate-900 dark:text-slate-100 shell:table";
const dashboardTableHeadClass = "block sr-only shell:not-sr-only shell:table-header-group";
const dashboardTableHeaderCellClass = "border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400";
const dashboardTableBodyClass = "grid w-full min-w-0 grid-cols-1 gap-3 p-3.5 md:grid-cols-2 shell:table-row-group shell:p-0";
const dashboardTableRowClass = "data-table__row--link block w-full min-w-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-colors hover:bg-kc-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-kc-blue-950 shell:table-row shell:rounded-none shell:border-0 shell:bg-transparent shell:shadow-none shell:hover:bg-kc-blue-50 dark:shell:hover:bg-kc-blue-950";
const dashboardTableCellClass = "flex min-h-12 w-full min-w-0 items-center gap-3 border-b border-slate-200 px-3.5 py-2.5 text-left align-middle wrap-anywhere dark:border-slate-700 shell:table-cell shell:min-h-0 shell:px-4 shell:py-3.5";
const dashboardTableLastCellClass = "flex min-h-11 w-full min-w-0 items-center justify-end bg-slate-50 px-3.5 py-2.5 text-left align-middle dark:bg-slate-900 shell:table-cell shell:min-h-0 shell:justify-start shell:bg-transparent shell:px-4 shell:py-3.5";
const dashboardTableCellLabelClass = "w-29 flex-none text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 shell:hidden";

function DashboardTable({ sites }: { sites: DashboardSite[] }) {
  const navigate = useNavigate();
  return (
    <div className={cx(dashboardTableWrapClass)} data-tour="dashboard-sites">
      <table className={cx(dashboardTableClass)}>
        <thead className={cx(dashboardTableHeadClass)}>
          <tr>
            <th className={cx(dashboardTableHeaderCellClass, "shell:w-1/4")}>Site</th>
            <th className={cx(dashboardTableHeaderCellClass, "shell:w-1/6")}>Region / segment</th>
            <th className={cx(dashboardTableHeaderCellClass, "shell:w-1/6")}>Completion</th>
            <th className={cx(dashboardTableHeaderCellClass, "shell:w-1/6")}>Self-assessed performance</th>
            <th className={cx(dashboardTableHeaderCellClass, "shell:w-1/12")}>Gaps</th>
            <th className={cx(dashboardTableHeaderCellClass, "shell:w-1/12")}>Last updated</th>
            <th className={cx(dashboardTableHeaderCellClass, "shell:w-20")}><span className={cx("sr-only")}>View</span></th>
          </tr>
        </thead>
        <tbody className={cx(dashboardTableBodyClass)}>
          {sites.map((site) => (
            <tr key={site.id} className={cx(dashboardTableRowClass)} onClick={() => navigate(`/sites/${site.id}`)}>
              <td className={cx(dashboardTableCellClass)} data-label="Site">
                <span className={cx(dashboardTableCellLabelClass)}>Site</span>
                <span className={cx("grid min-w-0 gap-0.5")}>
                  <strong className={cx("block min-w-0 wrap-anywhere")}>{site.name}</strong>
                  <span className={cx("block min-w-0 wrap-anywhere text-xs text-slate-500 dark:text-slate-400")}>{site.code}</span>
                </span>
              </td>
              <td className={cx(dashboardTableCellClass)} data-label="Region / segment">
                <span className={cx(dashboardTableCellLabelClass)}>Region / segment</span>
                <span className={cx("grid min-w-0 gap-0.5")}>
                  <strong className={cx("block min-w-0 wrap-anywhere")}>{site.region}</strong>
                  <span className={cx("block min-w-0 wrap-anywhere text-xs text-slate-500 dark:text-slate-400")}>{site.segment}</span>
                </span>
              </td>
              <td className={cx(dashboardTableCellClass, "shell:max-w-sm")} data-label="Completion">
                <span className={cx(dashboardTableCellLabelClass)}>Completion</span>
                <div className={cx("table-completion flex flex-wrap items-center gap-2 shell:flex-nowrap")}>
                  <CompletionBadge value={site.completion} />
                  <span className={cx("table-progress block h-1.25 w-full max-w-35 overflow-hidden rounded-full bg-slate-200 shell:w-17.5 shell:max-w-none dark:bg-slate-700")}>
                    <span className={cx("block h-full rounded-full bg-kc-blue-600 forced-colors:bg-forced-highlight")} style={{ width: `${site.completion}%` }} />
                  </span>
                </div>
              </td>
              <td className={cx(dashboardTableCellClass)} data-label="Self-assessed performance">
                <span className={cx(dashboardTableCellLabelClass)}>Self-assessed performance</span>
                <PerformanceBadge performance={site.performance} compact />
              </td>
              <td className={cx(dashboardTableCellClass)} data-label="Gaps">
                <span className={cx(dashboardTableCellLabelClass)}>Gaps</span>
                <span className={cx("gap-count inline-grid h-7 min-w-8 place-items-center rounded-lg font-bold", site.gaps > 20 ? "gap-count--high bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300")}>{site.gaps}</span>
              </td>
              <td className={cx(dashboardTableCellClass)} data-label="Last updated">
                <span className={cx(dashboardTableCellLabelClass)}>Last updated</span>
                {site.updated}
              </td>
              <td className={cx(dashboardTableLastCellClass)} data-label="">
                <Link className={cx("table-action inline-grid size-9 place-items-center rounded-lg text-kc-blue-700 hover:bg-kc-blue-50 dark:text-kc-blue-300 dark:hover:bg-kc-blue-950")} to={`/sites/${site.id}`} aria-label={`View ${site.name}`}><ChevronRight size={18} /></Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function downloadSiteExport(sites: DashboardSite[], fileName: string, focus = "All assessment areas", requirements: Requirement[] = [], assignedSite?: AssignedSite) {
  const columns = ["Record type", "Site", "Site code", "Region", "Segment", "Completion", "Performance", "Gaps", "Assessment area", "Last updated", "Requirement ID", "Requirement", "Question", "Evidence title", "Evidence type", "Evidence reference", "Uploaded by", "Uploaded at"];
  const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = sites.map((site) => ["Site summary", site.name, site.code, site.region, site.segment, `${site.completion}%`, performanceLabel(site.performance), site.gaps, focus, site.updated, "", "", "", "", "", "", "", ""]);
  const evidenceRows = assignedSite ? requirements.flatMap((requirement) => requirement.evidence.map((evidence) => {
    const question = requirement.questions.find((item) => item.id === evidence.questionId);
    return ["Evidence", assignedSite.name, assignedSite.code, assignedSite.region, assignedSite.segment, "", "", "", focus, "", requirement.number, requirement.title, question ? `${question.number}. ${question.text}` : "", evidence.title, evidence.type, evidence.detail, evidence.uploadedBy, evidence.uploadedAt];
  })) : [];
  const csv = [columns, ...rows, ...evidenceRows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

type CompletionFilter = "all" | "complete" | "in-progress" | "not-started";

export function DashboardScreen() {
  const { dashboardSiteRows, sectionSummaries, requirements, assignedSite } = useDashboard();
  const { user } = useAuth();
  const [region, setRegion] = useState("All regions");
  const [segment, setSegment] = useState("All segments");
  const [performance, setPerformance] = useState<"All levels" | Performance>("All levels");
  const [completion, setCompletion] = useState<CompletionFilter>("all");
  const [focus, setFocus] = useState("All assessment areas");
  const [query, setQuery] = useState("");
  const [exported, setExported] = useState(false);
  const regions = [...new Set(dashboardSiteRows.map((site) => site.region))];
  const segments = [...new Set(dashboardSiteRows.map((site) => site.segment))];

  const sites = useMemo(() => dashboardSiteRows.filter((site) => {
    const regionMatch = region === "All regions" || site.region === region;
    const segmentMatch = segment === "All segments" || site.segment === segment;
    const performanceMatch = performance === "All levels" || site.performance === performance;
    const completionMatch = completion === "all" || (completion === "complete" ? site.completion === 100 : completion === "not-started" ? site.completion === 0 : site.completion > 0 && site.completion < 100);
    const queryMatch = `${site.name} ${site.code}`.toLowerCase().includes(query.toLowerCase());
    return regionMatch && segmentMatch && performanceMatch && completionMatch && queryMatch;
  }), [completion, dashboardSiteRows, performance, query, region, segment]);

  const total = dashboardSiteRows.length;
  const complete = dashboardSiteRows.filter((site) => site.completion === 100).length;
  const inProgress = dashboardSiteRows.filter((site) => site.completion > 0 && site.completion < 100).length;
  const notStarted = dashboardSiteRows.filter((site) => site.completion === 0).length;
  const average = Math.round(dashboardSiteRows.reduce((sum, site) => sum + site.completion, 0) / total);
  const initialSites = dashboardSiteRows.filter((site) => site.performance === "initial").length;
  const activeFilters = [region !== "All regions" && region, segment !== "All segments" && segment, performance !== "All levels" && performanceLabel(performance), completion !== "all" && completion.replace("-", " "), focus !== "All assessment areas" && focus].filter(Boolean) as string[];

  function reset() { setRegion("All regions"); setSegment("All segments"); setPerformance("All levels"); setCompletion("all"); setFocus("All assessment areas"); setQuery(""); }
  function exportDashboard() { downloadSiteExport(sites, `EHS360_dashboard_${new Date().toISOString().slice(0, 10)}.csv`, focus, user?.role === "administrator" ? requirements : [], user?.role === "administrator" ? assignedSite : undefined); setExported(true); window.setTimeout(() => setExported(false), 2600); }

  return (
    <div className={cx(pageContainerClass)}>
      <PageHeader eyebrow="Enterprise oversight" title="EHS360 dashboard" description="Track completion and self-assessed performance across the sites in your authorized scope." actions={<Button variant="primary" icon={<ArrowDownToLine size={18} />} onClick={exportDashboard} disabled={!sites.length} data-tour="dashboard-export">Export to Excel</Button>} />
      {exported && (
        <div className={cx("floating-feedback fixed top-22 right-6 z-80 max-w-108 animate-feedback-in")} style={{ boxShadow: "var(--shadow-2)" }}>
          <InlineMessage tone="success" title="Export downloaded">
            The current filtered site view{user?.role === "administrator" ? " and question-level evidence register" : ""} were downloaded and can be opened in Excel.
          </InlineMessage>
        </div>
      )}
      <div className={cx("dashboard-summary mt-5 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2")}>
        <div className={cx("metrics-grid metrics-grid--2x2 mt-0 grid grid-cols-1 gap-4 md:grid-cols-2")}>
          <MetricCard label="Sites in scope" value={total} detail={`Across ${regions.length} regions`} icon={<MapPin size={21} />} tone="brand" />
          <MetricCard label="Assessment complete" value={`${Math.round((complete / total) * 100)}%`} detail={`${complete} of ${total} sites`} icon={<CheckCircle2 size={21} />} tone="success" />
          <MetricCard label="Average completion" value={`${average}%`} detail="Completion only—not performance" icon={<Target size={21} />} tone="brand" />
          <MetricCard label="Sites at Initial" value={initialSites} detail="Prioritize leadership review" icon={<CircleAlert size={21} />} tone="danger" />
        </div>
        <div className={cx("dashboard-insights grid grid-cols-1 gap-4")}>
          <section className={cx("insight-card flex h-full flex-col justify-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900")}>
            <div className={cx("insight-card__header mb-4 flex items-start justify-between gap-4 text-kc-blue-700 dark:text-kc-blue-300")}>
              <div>
                <p className={cx(eyebrowClasses)}>Completion</p>
                <h2 className={cx("mt-1 text-lg font-bold text-slate-900 dark:text-slate-100")}>Assessment status</h2>
              </div>
              <Clock3 size={21} />
            </div>
            <div className={cx("grid gap-3")}>
              <DistributionBar label="Complete" value={complete} total={total} tone="success" />
              <DistributionBar label="In progress" value={inProgress} total={total} tone="brand" />
              <DistributionBar label="Not started" value={notStarted} total={total} tone="neutral" />
            </div>
          </section>
        </div>
      </div>
      <section className={cx(tableCardClass)}>
        <div className={cx("dashboard-filter-bar dashboard-filter-bar--expanded flex flex-col flex-wrap items-stretch gap-3 border-b border-slate-200 px-4 py-3.5 md:flex-row shell:items-center dark:border-slate-700")} data-tour="dashboard-filters">
          <label className={cx("search-control flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-slate-500 focus-within:border-kc-blue-600 focus-within:ring-3 focus-within:ring-kc-blue-100 shell:w-105 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:focus-within:ring-kc-blue-900")}>
            <Search size={18} />
            <input className={cx("min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search site name or code" />
          </label>
          <Select label="Region" value={region} onChange={setRegion} options={["All regions", ...regions].map((value) => ({ value, label: value }))} />
          <Select label="Segment" value={segment} onChange={setSegment} options={["All segments", ...segments].map((value) => ({ value, label: value }))} />
          <Select
            label="Completion"
            value={completion}
            onChange={(value) => setCompletion(value as CompletionFilter)}
            options={[
              { value: "all", label: "All completion states" },
              { value: "complete", label: "Complete" },
              { value: "in-progress", label: "In progress" },
              { value: "not-started", label: "Not started" },
            ]}
          />
          <Select
            label="Performance"
            value={performance}
            onChange={(value) => setPerformance(value as "All levels" | Performance)}
            options={[
              { value: "All levels", label: "All levels" },
              { value: "initial", label: "Initial" },
              { value: "emerging", label: "Emerging" },
              { value: "performing", label: "Performing" },
              { value: "not-assessed", label: "Not assessed" },
            ]}
          />
          <Select
            className={cx("select-control--focus basis-57.5")}
            label="Assessment area"
            value={focus}
            onChange={setFocus}
            options={["All assessment areas", ...sectionSummaries.map((section) => section.name)].map((value) => ({ value, label: value }))}
          />
          <Button variant="tertiary" icon={<FilterX size={17} />} onClick={reset}>Reset</Button>
        </div>
        {activeFilters.length > 0 && (
          <div className={cx("active-filter-row flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>
            <span>Active view</span>
            {activeFilters.map((filter) => (
              <span className={cx("filter-chip inline-flex items-center gap-1 rounded-full bg-kc-blue-50 px-2 py-1 text-xs font-bold text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")} key={filter}>{filter}</span>
            ))}
            <button className={cx("border-0 bg-transparent font-bold text-kc-blue-700 dark:text-kc-blue-300")} onClick={reset}>Clear all</button>
          </div>
        )}
        <div className={cx(tableCardHeaderBaseClass, "table-card__header--results flex-row items-center")}>
          <div>
            <p className={cx(eyebrowClasses)}>Authorized scope</p>
            <h2 className={cx("mt-1 text-lg font-bold text-slate-900 dark:text-slate-100")}>Sites</h2>
          </div>
          <span className={cx("text-sm text-slate-500 dark:text-slate-400")}>Showing {sites.length} of {total} sites</span>
        </div>
        {sites.length ? <DashboardTable sites={sites} /> : <EmptyState icon={<Search size={27} />} title="No sites match this view" description="Adjust or clear the dashboard filters to see results." action={<Button variant="secondary" icon={<FilterX size={17} />} onClick={reset}>Clear filters</Button>} />}
      </section>
    </div>
  );
}

export function SiteSectionDetailScreen() {
  const { siteId, sectionId } = useParams();
  const { dashboardSiteRows, sectionSummaries, requirementsForSite, sections } = useDashboard();
  const site = dashboardSiteRows.find((item) => item.id === siteId) ?? dashboardSiteRows[0];
  const siteSections = site.id === "northstar" ? sectionSummaries : sections;
  const section = siteSections.find((item) => item.id === sectionId);
  const requirement = requirementsForSite(site.id).find((item) => item.sectionId === sectionId);

  if (!section) {
    return (
      <div className={cx(pageContainerClass)}>
        <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb"><Link className={cx(breadcrumbLinkClass)} to="/dashboard">Dashboard</Link><ChevronRight size={15} /><Link className={cx(breadcrumbLinkClass)} to={`/sites/${site.id}`}>{site.name}</Link><ChevronRight size={15} /><span aria-current="page">Section</span></nav>
        <EmptyState icon={<Search size={27} />} title="Section not found" description="This assessment section is not part of the current site's framework." />
      </div>
    );
  }

  return (
    <div className={cx(pageContainerClass)}>
      <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb">
        <Link className={cx(breadcrumbLinkClass)} to="/dashboard">Dashboard</Link><ChevronRight size={15} />
        <Link className={cx(breadcrumbLinkClass)} to={`/sites/${site.id}`}>{site.name}</Link><ChevronRight size={15} />
        <span aria-current="page">{section.shortName}</span>
      </nav>
      <PageHeader eyebrow="Assessment detail" title={section.name} description={`${site.code} · ${section.description}`} />
      <InlineMessage tone="info" title="Read-only site record">This view is available within your enterprise scope. Only the currently assigned site can be edited.</InlineMessage>
      <div className={cx("metrics-grid mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 wide:grid-cols-4")}>
        <MetricCard label="Completion" value={`${section.completion}%`} detail="Section completion" icon={<Target size={21} />} tone="brand" />
        <MetricCard label="Performance" value={performanceLabel(section.performance)} detail="Lowest question level" icon={<BarChart3 size={21} />} tone={section.performance === "performing" ? "success" : section.performance === "emerging" ? "warning" : "danger"} />
        <MetricCard label="Questions" value={section.questions} detail="In this section" icon={<CheckCircle2 size={21} />} />
        <MetricCard label="Gaps" value={section.gaps} detail="No and Partial responses" icon={<CircleAlert size={21} />} tone="danger" />
      </div>
      <section className={cx("page-section mt-9")} aria-labelledby="site-questions-title">
        <div className={cx(sectionTitleRowClass)}>
          <div>
            <p className={cx(eyebrowClasses)}>Assessment questions</p>
            <h2 id="site-questions-title" className={cx("mt-1")}>Recorded responses</h2>
          </div>
          {requirement && <span className={cx("question-count rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300")}>{requirement.questions.length} questions</span>}
        </div>
        {requirement ? (
          <div className={cx("question-list grid gap-4")}>
            {requirement.questions.map((question) => (
              <article className={cx("question-card rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm md:p-4.5 dark:border-slate-700 dark:bg-slate-900")} key={question.id}>
                <div className={cx("question-card__header flex flex-wrap items-start gap-3.5")}>
                  <span className={cx("question-number inline-grid size-8 flex-none place-items-center rounded-lg bg-kc-blue-50 text-sm font-bold text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")}>{question.number}</span>
                  <div className={cx("min-w-0 flex-1")}>
                    <p className={cx("text-xs font-semibold text-slate-500 dark:text-slate-400")}>Question {question.number}</p>
                    <h3 className={cx("mt-1 max-w-195 text-base leading-normal")}>{question.text}</h3>
                  </div>
                  <PerformanceBadge performance={performanceForResponse(question.response)} compact />
                </div>
                {Boolean(question.expectedEvidence?.length) && (
                  <div className={cx("question-evidence mt-3.5 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-900")}>
                    <span className={cx("question-evidence__title flex items-center gap-1.5 text-xs font-bold tracking-wide text-kc-blue-700 uppercase dark:text-kc-blue-300")}><Paperclip size={14} /> Evidence required</span>
                    <ul className={cx("m-0 grid gap-1 pl-4.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400")}>{question.expectedEvidence!.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                )}
                <div className={cx("readonly-response mt-3.5 flex items-center gap-2.5")}>
                  <span className={cx("text-sm font-semibold text-slate-500 dark:text-slate-400")}>Response</span>
                  <span className={responseChipClass(question.response)}>{responseLabel(question.response)}</span>
                  {question.response && <small className={cx("ml-auto text-sm text-slate-500 dark:text-slate-400")}>Recorded by {question.respondedBy ?? question.action?.createdBy ?? "Site contributor"}{question.respondedAt ? ` · ${new Date(question.respondedAt).toLocaleString()}` : ""}</small>}
                </div>
                {question.action && (
                  <div className={cx("readonly-action mt-3.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-900")}>
                    <p className={cx(eyebrowClasses, "mb-1")}>Corrective action · {question.action.createdBy ?? "Site contributor"}</p>
                    <p className={cx("m-0 text-sm text-slate-800 dark:text-slate-200")}>{question.action.description || "No action description added yet."}</p>
                    <div className={cx("readonly-action__details mt-2 flex flex-wrap gap-1 gap-x-3 text-sm text-slate-600 dark:text-slate-400")}>
                      <span>Owner · {question.action.owner || "Not assigned"}</span>
                      <span>Status · {question.action.status ?? "Open"}</span>
                      <span>Follow-up · {question.action.followUp || "Not added"}</span>
                      <span>Updated by {question.action.updatedBy ?? question.action.createdBy ?? "Site contributor"}{question.action.updatedAt ? ` · ${new Date(question.action.updatedAt).toLocaleString()}` : ""}</span>
                    </div>
                  </div>
                )}
                <QuestionResponseHistory question={question} />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Search size={27} />} title="No question-level responses" description="This site has not started the selected section yet." />
        )}
      </section>
    </div>
  );
}

const sectionFilterButtonClass = "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg bg-transparent px-1.5 py-1.5 text-sm font-bold text-slate-600 transition-colors hover:bg-white hover:text-slate-900 md:px-2.5 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100";
const sectionFilterButtonActiveClass = "is-active bg-white text-kc-blue-800 shadow-sm dark:bg-slate-900 dark:text-kc-blue-200";
const sectionFilterCountClass = "inline-grid h-5.5 min-w-5.5 place-items-center rounded-full bg-slate-100 text-xs text-inherit dark:bg-slate-800";

export function SiteDrilldownScreen() {
  const { siteId } = useParams();
  const { dashboardSiteRows, sectionSummaries, requirementsForSite, siteContacts, siteUsers, sections } = useDashboard();
  const { role } = useGuidedSetup();
  const [sectionFilter, setSectionFilter] = useState<"all" | "attention" | "complete">("all");
  const site = dashboardSiteRows.find((item) => item.id === siteId) ?? dashboardSiteRows[0];
  const siteSections = site.id === "northstar" ? sectionSummaries : sections;
  const canEditAssignedSite = role === "site-contributor" && site.id === "northstar";
  const siteRequirements = requirementsForSite(site.id);
  const assessmentSections = siteSections.filter((section) => section.kind === "operating-system" || section.kind === "performance-standard");
  const assignedUsers = siteUsers.filter((user) => user.siteId === site.id);
  const totalQuestions = siteRequirements.reduce((total, requirement) => total + requirement.questions.length, 0);
  const responsesRecorded = siteRequirements.reduce((total, requirement) => total + requirement.questions.filter((question) => question.response !== null).length, 0);
  const needsAttention = assessmentSections.filter((section) => section.gaps > 0 || section.completion < 100);
  const completeSections = assessmentSections.filter((section) => section.gaps === 0 && section.completion === 100);
  const prioritySection = [...needsAttention].sort((left, right) => right.gaps - left.gaps || left.completion - right.completion)[0];
  const visibleSections = assessmentSections.filter((section) => sectionFilter === "all" || (sectionFilter === "attention" ? section.gaps > 0 || section.completion < 100 : section.gaps === 0 && section.completion === 100));
  const sectionRoute = (section: SectionSummary) => {
    const requirement = siteRequirements.find((item) => item.sectionId === section.id);
    return canEditAssignedSite && requirement ? requirementRoute(requirement) : `/sites/${site.id}/sections/${section.id}`;
  };
  const assessmentState = site.completion === 0
    ? "Assessment not started"
    : needsAttention.length > 0
      ? `${needsAttention.length} ${needsAttention.length === 1 ? "area needs" : "areas need"} attention`
      : "Assessment complete";
  // Only "northstar" has real seeded contact data (siteContacts is a single global record, not
  // yet keyed by site) — every other mock dashboard site shows the empty state rather than
  // fabricated placeholder contacts, which would misleadingly imply fictitious people are real
  // site leadership in a compliance app.
  const hasRealContacts = site.id === "northstar";
  return (
    <div className={cx(pageContainerClass)}>
      <nav className={cx(breadcrumbsClass)} aria-label="Breadcrumb"><Link className={cx(breadcrumbLinkClass)} to="/dashboard">Dashboard</Link><ChevronRight size={15} /><span aria-current="page">{site.name}</span></nav>
      <PageHeader
        eyebrow="Site assessment"
        title={site.name}
        description={`${site.code} · ${site.region} · ${site.segment}`}
        actions={<>{role === "administrator" && <Link className={cx(linkButtonBase, linkButtonVariant.tertiary, linkButtonSize.default)} to={`/admin/sites/${site.id}`}><UsersRound size={18} /><span>Manage site</span></Link>}<Button variant="secondary" icon={<ArrowDownToLine size={18} />} onClick={() => downloadSiteExport([site], `EHS360_${site.code}_assessment.csv`)}>Export assessment</Button></>}
      />

      <section className={cx("site-assessment-hero mt-5 grid grid-cols-1 gap-4.5 overflow-hidden rounded-xl border border-kc-blue-200 bg-gradient-to-br from-white to-kc-blue-50 p-4 shadow-sm lg:grid-cols-2 dark:border-kc-blue-800 dark:from-slate-900 dark:to-kc-blue-950")} aria-labelledby="assessment-snapshot-title">
        <div className={cx("site-assessment-hero__overview flex min-w-0 items-start gap-4 sm:items-center")}>
          <div className={cx("site-assessment-hero__score flex size-18 flex-none items-baseline justify-center rounded-full border-6 border-kc-blue-100 bg-white text-kc-blue-800 ring-1 ring-inset ring-kc-blue-200 sm:size-23 sm:border-8 dark:border-kc-blue-900 dark:bg-slate-900 dark:ring-kc-blue-800")} aria-label={`${site.completion}% assessment completion`}>
            <strong className={cx("self-center text-2xl leading-none tracking-tight sm:text-3xl")}>{site.completion}</strong>
            <span className={cx("self-center pt-2 pl-0.5 text-sm font-bold")}>%</span>
          </div>
          <div className={cx("site-assessment-hero__copy grid min-w-0 gap-1.5")}>
            <p className={cx(eyebrowClasses)}>Assessment snapshot</p>
            <h2 id="assessment-snapshot-title" className={cx("text-xl leading-tight text-slate-900 sm:text-2xl dark:text-slate-100")}>{assessmentState}</h2>
            <p className={cx("text-sm text-slate-600 dark:text-slate-400")}>{responsesRecorded} of {totalQuestions} assessment questions have a recorded response.</p>
            <ProgressBar value={site.completion} />
          </div>
        </div>
        <div className={cx("site-assessment-hero__facts grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-3 dark:border-slate-700 dark:bg-slate-900")} aria-label="Assessment summary">
          <div className={cx("flex min-w-0 flex-col items-start justify-center gap-1 border-b border-slate-200 p-3.5 sm:border-r sm:border-b-0 dark:border-slate-700")}>
            <span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Self-assessed performance</span>
            <PerformanceBadge performance={site.performance} />
          </div>
          <div className={cx("flex min-w-0 flex-col items-start justify-center gap-1 border-b border-slate-200 p-3.5 sm:border-r sm:border-b-0 dark:border-slate-700")}>
            <span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Open gaps</span>
            <strong className={cx("text-base text-slate-900 dark:text-slate-100", site.gaps > 0 && "text-danger text-red-700 dark:text-red-300")}>{site.gaps}</strong>
            <small className={cx("text-xs text-slate-500 dark:text-slate-400")}>No and Partial responses</small>
          </div>
          <div className={cx("flex min-w-0 flex-col items-start justify-center gap-1 p-3.5")}>
            <span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Last updated</span>
            <strong className={cx("text-base text-slate-900 dark:text-slate-100")}>{site.updated}</strong>
            <small className={cx("text-xs text-slate-500 dark:text-slate-400")}>Current assessment record</small>
          </div>
        </div>
        {prioritySection && (
          <div className={cx("site-assessment-priority flex flex-col items-stretch gap-4 border-t border-kc-blue-200 pt-4 sm:flex-row sm:items-center sm:justify-between lg:col-span-2 dark:border-kc-blue-800")}>
            <div className={cx("flex min-w-0 items-center gap-3")}>
              <span className={cx("site-assessment-priority__icon grid size-10 flex-none place-items-center rounded-xl bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300")}><CircleAlert size={19} /></span>
              <div className={cx("grid min-w-0 items-center gap-0.5")}>
                <p className={cx(eyebrowClasses)}>Priority review</p>
                <strong className={cx("text-slate-900 dark:text-slate-100")}>{prioritySection.name}</strong>
                <span className={cx("text-sm text-slate-500 dark:text-slate-400")}>{prioritySection.gaps} {prioritySection.gaps === 1 ? "gap" : "gaps"} · {prioritySection.completion}% complete</span>
              </div>
            </div>
            <Link className={cx(linkButtonBase, linkButtonVariant.primary, linkButtonSize.compact)} to={sectionRoute(prioritySection)}><span>Review details</span><ArrowRight size={16} /></Link>
          </div>
        )}
      </section>

      <section className={cx(tableCardClass, "site-assessment-sections")} aria-labelledby="assessment-sections-title">
        <style>{`
          .site-assessment-sections { --assessment-area-columns: minmax(330px, 1.25fr) minmax(260px, 0.85fr) minmax(160px, 0.55fr) minmax(125px, 0.45fr) minmax(125px, 0.42fr); }
          @media (max-width: 1280px) {
            .site-assessment-sections { --assessment-area-columns: minmax(270px, 1.2fr) minmax(190px, 0.8fr) minmax(130px, 0.55fr) minmax(105px, 0.45fr) minmax(120px, 0.45fr); }
          }
          @media (min-width: 1024px) {
            .site-assessment-area-row { grid-template-columns: var(--assessment-area-columns); }
          }
        `}</style>
        <div className={cx(tableCardHeaderBaseClass, "site-assessment-sections__header flex-col items-stretch md:flex-row md:items-center")}>
          <div className={cx("grid gap-0.5")}>
            <p className={cx(eyebrowClasses)}>Assessment details</p>
            <h2 id="assessment-sections-title" className={cx("mt-1 text-lg font-bold text-slate-900 dark:text-slate-100")}>Assessment areas</h2>
            <span className={cx("text-sm text-slate-500 dark:text-slate-400")}>Review completion, performance, and gaps before opening question-level details.</span>
          </div>
          <div className={cx("site-section-filters grid w-full grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 md:inline-flex md:w-auto md:flex-none dark:border-slate-700 dark:bg-slate-900")} role="group" aria-label="Filter assessment areas">
            <button type="button" className={cx(sectionFilterButtonClass, sectionFilter === "all" && sectionFilterButtonActiveClass)} aria-pressed={sectionFilter === "all"} onClick={() => setSectionFilter("all")}>All <span className={cx(sectionFilterCountClass)}>{assessmentSections.length}</span></button>
            <button type="button" className={cx(sectionFilterButtonClass, sectionFilter === "attention" && sectionFilterButtonActiveClass)} aria-pressed={sectionFilter === "attention"} onClick={() => setSectionFilter("attention")}>Needs attention <span className={cx(sectionFilterCountClass)}>{needsAttention.length}</span></button>
            <button type="button" className={cx(sectionFilterButtonClass, sectionFilter === "complete" && sectionFilterButtonActiveClass)} aria-pressed={sectionFilter === "complete"} onClick={() => setSectionFilter("complete")}>Complete <span className={cx(sectionFilterCountClass)}>{completeSections.length}</span></button>
          </div>
        </div>
        {visibleSections.length ? (
          <>
            <div className={cx("site-assessment-area-columns hidden gap-6 border-b border-slate-200 bg-slate-50 px-4 py-2 lg:grid dark:border-slate-700 dark:bg-slate-900")} style={{ gridTemplateColumns: "var(--assessment-area-columns)" }} aria-hidden="true">
              <span className={cx("text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400")}>Assessment area</span>
              <span className={cx("text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400")}>Completion</span>
              <span className={cx("text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400")}>Performance</span>
              <span className={cx("text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400")}>Open gaps</span>
              <span className={cx("justify-self-end text-xs font-bold tracking-wide text-slate-500 uppercase dark:text-slate-400")}>Action</span>
            </div>
            <div className={cx("site-assessment-area-list grid")} data-tour="drilldown-sections">
              {visibleSections.map((section) => {
                const sectionNumber = assessmentSections.findIndex((item) => item.id === section.id) + 1;
                return (
                  <article
                    key={section.id}
                    className={cx("site-assessment-area-row grid grid-cols-2 items-center gap-3.5 border-b border-slate-200 p-4 last:border-b-0 hover:bg-slate-50 lg:gap-6 lg:px-4 lg:py-3.5 dark:border-slate-700 dark:hover:bg-slate-800")}
                  >
                    <div className={cx("site-assessment-area-row__identity col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1")}>
                      <span className={cx("section-index grid size-9.5 flex-none place-items-center rounded-lg bg-kc-blue-50 text-center text-xs font-bold text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")} aria-hidden="true">{String(sectionNumber).padStart(2, "0")}</span>
                      <div className={cx("grid min-w-0 gap-0.5")}>
                        <span className={cx("site-assessment-area-row__kind text-xs font-bold text-kc-blue-700 dark:text-kc-blue-300")}>{section.kind === "operating-system" ? "Operating System" : "Performance Standard"}</span>
                        <strong className={cx("overflow-hidden text-sm text-ellipsis whitespace-nowrap text-slate-900 lg:whitespace-normal dark:text-slate-100")}>{section.name}</strong>
                        <span className={cx("text-xs text-slate-500 dark:text-slate-400")}>{section.questions} assessment questions</span>
                      </div>
                    </div>
                    <div className={cx("site-assessment-area-row__completion col-span-2 grid min-w-0 gap-1.5 lg:col-span-1")}>
                      <span className={cx("site-assessment-area-row__label block text-xs text-slate-500 lg:hidden dark:text-slate-400")}>Completion</span>
                      <div className={cx("site-assessment-area-row__meter flex items-center gap-2")}>
                        <span className={cx("site-assessment-area-row__track block h-1.5 w-full flex-1 overflow-hidden rounded-full border border-kc-blue-200 bg-kc-blue-50 shadow-inner lg:max-w-55 lg:flex-none dark:border-kc-blue-800 dark:bg-kc-blue-950")} role="progressbar" aria-label={`${section.name} completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={section.completion}>
                          <span className={cx("block h-full rounded-full bg-kc-blue-700")} style={{ width: `${section.completion}%` }} />
                        </span>
                        <strong className={cx("min-w-9 text-right text-xs text-slate-900 dark:text-slate-100")}>{section.completion}%</strong>
                      </div>
                    </div>
                    <div className={cx("site-assessment-area-row__result grid justify-items-start gap-1")}>
                      <span className={cx("site-assessment-area-row__label block text-xs text-slate-500 lg:hidden dark:text-slate-400")}>Performance</span>
                      <PerformanceBadge performance={section.performance} compact />
                    </div>
                    <div className={cx("site-assessment-area-row__result site-assessment-area-row__gaps flex flex-wrap items-baseline gap-x-1.5 gap-y-1")}>
                      <span className={cx("site-assessment-area-row__label basis-full text-xs text-slate-500 lg:hidden dark:text-slate-400")}>Open gaps</span>
                      <strong className={cx("text-sm text-slate-800 dark:text-slate-200", section.gaps > 0 && "text-danger text-red-700 dark:text-red-300")}>{section.gaps}</strong>
                      <small className={cx("text-xs whitespace-nowrap text-slate-500 dark:text-slate-400")}>{section.gaps > 0 ? "Needs attention" : section.completion === 100 ? "Complete" : "No gaps recorded"}</small>
                    </div>
                    <Link className={cx(linkButtonBase, linkButtonVariant.tertiary, linkButtonSize.compact, "col-span-2 justify-self-stretch lg:col-span-1 lg:justify-self-end")} to={sectionRoute(section)}><span>{canEditAssignedSite ? "Open assessment" : "Review details"}</span><ArrowRight size={16} /></Link>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState icon={<CheckCircle2 size={27} />} title="No assessment areas in this view" description="Choose another filter to review the site's assessment areas." />
        )}
      </section>

      <details className={cx("site-support-details group mt-5 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900")}>
        <summary className={cx("flex min-h-16.5 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5")}>
          <span className={cx("flex items-center gap-3")}>
            <UsersRound size={20} className={cx("text-kc-blue-700 dark:text-kc-blue-300")} />
            <span className={cx("grid gap-0.5")}>
              <strong className={cx("text-slate-900 dark:text-slate-100")}>Site people and contacts</strong>
              <small className={cx("text-xs text-slate-500 dark:text-slate-400")}>Secondary site context · {assignedUsers.length} assigned {assignedUsers.length === 1 ? "user" : "users"}</small>
            </span>
          </span>
          <ChevronDown size={19} className={cx("text-slate-500 transition-transform duration-180 group-open:rotate-180 dark:text-slate-400")} />
        </summary>
        <div className={cx("site-support-details__content grid gap-8 border-t border-slate-200 p-4.5 dark:border-slate-700")}>
          <section aria-labelledby="site-users-title">
            <div className={cx(sectionTitleRowClass)}>
              <div><p className={cx(eyebrowClasses)}>Read-only</p><h2 id="site-users-title" className={cx("mt-1")}>Assigned users</h2></div>
              <span className={cx("text-sm text-slate-500 dark:text-slate-400")}>{assignedUsers.length} assigned</span>
            </div>
            <SiteUsersPanel users={assignedUsers} />
          </section>
          <section aria-labelledby="site-contacts-title">
            <div className={cx(sectionTitleRowClass)}>
              <div><p className={cx(eyebrowClasses)}>Read-only</p><h2 id="site-contacts-title" className={cx("mt-1")}>Site contacts</h2></div>
            </div>
            <ContactsPanel contacts={hasRealContacts ? siteContacts : null} />
          </section>
        </div>
      </details>
    </div>
  );
}
