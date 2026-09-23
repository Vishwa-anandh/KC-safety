import { AlertTriangle, ArrowRight, Paperclip } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { requirementRoute } from "../../../app/router/links";
import { responseLabel } from "../../../shared/domain/assessment";
import type { AssessmentHistoryEntry, Requirement, ResponseValue } from "../../../shared/types";
import { eyebrowClasses, InlineMessage, TooltipLabel, tooltipTriggerClass } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

// Card-shell recipe duplicated verbatim from SiteScreens.tsx (cardClass/cardHeaderClass/...) —
// every screen file in this app keeps its own copy of these Tailwind recipes rather than sharing
// a page-to-page import, same convention already used by DashboardScreens.tsx/AdminScreens.tsx.
const cardClass = "mt-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";
const cardHeaderClass = "flex flex-col items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-700 md:flex-row md:items-center";
const cardHeaderTitleClass = "mt-1 text-lg font-bold text-slate-900 dark:text-slate-100";
const cardHeaderDetailClass = "text-sm text-slate-500 dark:text-slate-400";

// Same response/status semantic palette as shared/ui/UI.tsx's pillTone and SiteScreens.tsx's
// responseChipClass (yes=success/emerald, partial=warning/amber, no=danger/red,
// unanswered=neutral/slate) — reused here rather than invented, so these charts read as the same
// "response" vocabulary as the rest of the app.
export type ChartTone = "success" | "warning" | "danger" | "neutral" | "brand";

const pillBase = "inline-flex w-fit items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold sm:gap-1.5 sm:px-2 sm:py-1 sm:text-xs";
const toneChipClass: Record<ChartTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  neutral: "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
  brand: "border-kc-blue-200 bg-kc-blue-50 text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200",
};
const responseChipClass = (response: string | null | undefined) => cx(pillBase, toneChipClass[(response === "no" ? "danger" : response === "partial" ? "warning" : response === "yes" ? "success" : "neutral") as ChartTone]);

const segmentFillClass: Record<ChartTone, string> = {
  success: "bg-emerald-600 dark:bg-emerald-500",
  warning: "bg-amber-600 dark:bg-amber-500",
  danger: "bg-red-600 dark:bg-red-500",
  neutral: "bg-slate-400 dark:bg-slate-500",
  brand: "bg-kc-blue-600 dark:bg-kc-blue-500",
};
const swatchDotClass = segmentFillClass;
/** Donut arcs are drawn with `stroke="currentColor"`, so each segment's colour comes from a text
 *  utility rather than a `stroke-*` one — `currentColor` is guaranteed to resolve, which keeps the
 *  dark: variants working the same way every other tinted element in this app does. */
const toneTextClass: Record<ChartTone, string> = {
  success: "text-emerald-600 dark:text-emerald-500",
  warning: "text-amber-600 dark:text-amber-500",
  danger: "text-red-600 dark:text-red-500",
  neutral: "text-slate-400 dark:text-slate-500",
  brand: "text-kc-blue-600 dark:text-kc-blue-500",
};

function LegendSwatch({ tone, label }: { tone: ChartTone; label: string }) {
  return <span className="inline-flex min-w-0 items-center gap-1 sm:gap-1.5"><span className={cx("size-2 flex-none rounded-full sm:size-2.5", swatchDotClass[tone])} /><span className="truncate">{label}</span></span>;
}

const iconChipClass: Record<ChartTone, string> = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  brand: "bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300",
};

/** The four summary cards each pass a DIFFERENT `footer` — a dot-breakdown, a thin progress bar,
 *  a badge, or plain text — on purpose, so the top of the page doesn't read as four repeats of the
 *  same widget before a reader even reaches the charts below. */
export function HeroStatCard({ icon, tone, label, value, footer }: { icon: ReactNode; tone: ChartTone; label: string; value: ReactNode; footer?: ReactNode }) {
  return (
    <article className={cx(cardClass, "flex min-w-0 flex-col gap-2 p-2 sm:gap-3 sm:p-4")}>
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
        <span className={cx("grid size-6 flex-none place-items-center rounded-md sm:size-10 sm:rounded-lg", iconChipClass[tone])}>{icon}</span>
        <div className="min-w-0">
          <p className="break-words text-[9px] leading-[1.15] font-semibold text-slate-500 sm:text-xs sm:leading-tight dark:text-slate-400">{label}</p>
          <strong className="block text-base leading-tight font-bold tracking-tight tabular-nums text-slate-900 sm:text-2xl dark:text-slate-100">{value}</strong>
        </div>
      </div>
      {footer}
    </article>
  );
}

export function InlineBreakdown({ items }: { items: Array<{ label: string; value: number; tone: ChartTone }> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 sm:gap-x-3 sm:text-xs dark:text-slate-400">
      {items.map((item) => <LegendSwatch key={item.label} tone={item.tone} label={`${item.label} ${item.value}`} />)}
    </div>
  );
}

export function InlineProgress({ value, total, tone, caption }: { value: number; total: number; tone: ChartTone; caption: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="grid gap-1 sm:gap-1.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <span className={cx("block h-full rounded-full", segmentFillClass[tone])} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-slate-500 sm:text-xs dark:text-slate-400">{caption}</span>
    </div>
  );
}

export interface DonutSegment {
  label: string;
  value: number;
  tone: ChartTone;
}

/** SVG ring built from one dash-offset arc per segment. Marked aria-hidden on purpose: the legend
 *  rendered beside it carries every value as plain text, so the numbers never depend on the
 *  graphic, on colour alone, or on hovering. */
function DonutChart({ segments, centerValue, centerCaption, size = 132, thickness = 14 }: {
  segments: DonutSegment[];
  centerValue: string;
  centerCaption: string;
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let consumed = 0;
  return (
    <div className="donut-chart relative grid flex-none place-items-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
        <circle className="text-slate-200 dark:text-slate-700" cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} />
        {total > 0 && segments.filter((segment) => segment.value > 0).map((segment) => {
          const length = (segment.value / total) * circumference;
          const dashOffset = -consumed;
          consumed += length;
          return (
            <circle
              key={segment.label}
              className={toneTextClass[segment.tone]}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={thickness}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
      <span className="absolute grid place-items-center text-center">
        <strong className="text-2xl leading-none font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-100">{centerValue}</strong>
        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{centerCaption}</span>
      </span>
    </div>
  );
}

function DonutPanel({ eyebrow, title, segments, centerValue, centerCaption }: {
  eyebrow: string;
  title: string;
  segments: DonutSegment[];
  centerValue: string;
  centerCaption: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return (
    <div className="donut-panel grid justify-items-center gap-3.5 p-4">
      <div className="grid justify-items-center gap-0.5 text-center">
        <p className={eyebrowClasses}>{eyebrow}</p>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      <DonutChart segments={segments} centerValue={centerValue} centerCaption={centerCaption} />
      <ul className="m-0 grid w-full list-none gap-1.5 p-0">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <LegendSwatch tone={segment.tone} label={segment.label} />
            <span className="flex-none tabular-nums">{segment.value}{total > 0 ? ` · ${Math.round((segment.value / total) * 100)}%` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResponseMixPanel({ responses }: { responses: { yes: number; partial: number; no: number; unanswered: number; total: number } }) {
  const items: Array<{ label: string; value: number; tone: ChartTone }> = [
    { label: "Yes", value: responses.yes, tone: "success" },
    { label: "Partial", value: responses.partial, tone: "warning" },
    { label: "No", value: responses.no, tone: "danger" },
    { label: "Unanswered", value: responses.unanswered, tone: "neutral" },
  ];
  return (
    <div className="grid min-w-0 content-start gap-4 p-4">
      <div>
        <p className={eyebrowClasses}>Responses</p>
        <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">Response mix</h3>
      </div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" aria-label={`${responses.total} requirements: ${responses.yes} Yes, ${responses.partial} Partial, ${responses.no} No, ${responses.unanswered} unanswered`}>
        {items.filter((item) => item.value > 0).map((item) => (
          <span key={item.label} className={cx("h-full first:rounded-l-full last:rounded-r-full", segmentFillClass[item.tone])} style={{ width: `${responses.total ? (item.value / responses.total) * 100 : 0}%` }} />
        ))}
      </div>
      <ul className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-2 p-0">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <LegendSwatch tone={item.tone} label={item.label} />
            <strong className="tabular-nums text-slate-900 dark:text-slate-100">{item.value}</strong>
          </li>
        ))}
      </ul>
      <p className="m-0 text-xs text-slate-500 dark:text-slate-400">{responses.total} requirements in this period</p>
    </div>
  );
}

function SectionLevelPanel({ sectionPerformance }: { sectionPerformance: { initial: number; emerging: number; performing: number; notAssessed: number; total: number } }) {
  const items: Array<{ label: string; value: number; tone: ChartTone }> = [
    { label: "Performing", value: sectionPerformance.performing, tone: "success" },
    { label: "Emerging", value: sectionPerformance.emerging, tone: "warning" },
    { label: "Initial", value: sectionPerformance.initial, tone: "danger" },
    { label: "Not assessed", value: sectionPerformance.notAssessed, tone: "neutral" },
  ];
  return (
    <div className="grid min-w-0 content-start gap-3.5 p-4">
      <div>
        <p className={eyebrowClasses}>Self-assessed level</p>
        <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-slate-100">Performance by section</h3>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {items.map((item) => (
          <li key={item.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 text-xs">
            <LegendSwatch tone={item.tone} label={item.label} />
            <strong className="tabular-nums text-slate-900 dark:text-slate-100">{item.value}</strong>
            <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <span className={cx("block h-full rounded-full", segmentFillClass[item.tone])} style={{ width: `${sectionPerformance.total ? (item.value / sectionPerformance.total) * 100 : 0}%` }} />
            </span>
          </li>
        ))}
      </ul>
      <p className="m-0 text-xs text-slate-500 dark:text-slate-400">{sectionPerformance.total} sections assessed independently</p>
    </div>
  );
}

/** Completion, response mix, and section level deliberately use three distinct visual treatments.
 * Completion is a part-of-whole ring, response values are mutually exclusive on one stacked bar,
 * and section levels are comparable ranked rows. This prevents the page from making unrelated
 * measures look like the same kind of score. */
export function AssessmentGlanceCard({ completion, responses, sectionPerformance }: {
  completion: { answered: number; total: number };
  responses: { yes: number; partial: number; no: number; unanswered: number; total: number };
  sectionPerformance: { initial: number; emerging: number; performing: number; notAssessed: number; total: number };
}) {
  const completionPct = completion.total > 0 ? Math.round((completion.answered / completion.total) * 100) : 0;
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <div>
          <p className={eyebrowClasses}>This assessment period</p>
          <h2 className={cardHeaderTitleClass}>Assessment at a glance</h2>
        </div>
        <span className={cardHeaderDetailClass}>Progress, response mix, and section level</span>
      </div>
      <div className="grid divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-slate-700">
        <DonutPanel
          eyebrow="Progress"
          title="Assessment completion"
          centerValue={`${completionPct}%`}
          centerCaption={`${completion.answered} of ${completion.total}`}
          segments={[
            { label: "Answered", value: completion.answered, tone: "brand" },
            { label: "Not answered", value: completion.total - completion.answered, tone: "neutral" },
          ]}
        />
        <ResponseMixPanel responses={responses} />
        <SectionLevelPanel sectionPerformance={sectionPerformance} />
      </div>
    </section>
  );
}

export interface GapCell {
  id: string;
  number: string;
  response: ResponseValue;
  to: string;
}

export interface SectionGapRow {
  id: string;
  name: string;
  total: number;
  no: number;
  partial: number;
  unanswered: number;
  to: string;
  cells: GapCell[];
}

function cellToneClass(response: ResponseValue): string {
  if (response === "no") return segmentFillClass.danger;
  if (response === "partial") return segmentFillClass.warning;
  if (response === "yes") return segmentFillClass.success;
  return segmentFillClass.neutral;
}

/** One square per requirement, not a percentage bar — a status matrix (like a compliance
 *  heatmap) reads at both the section level (colour pattern across a row) and the individual
 *  question level (each cell links straight to that requirement) at the same time, which no bar
 *  chart on this page can do. Colour still isn't the only signal: each cell carries its own
 *  aria-label plus the app's shared hover tooltip with the exact question number and response,
 *  and the caption line below every row repeats the same counts as plain text. */
function GapCell({ cell }: { cell: GapCell }) {
  const tooltipId = useId();
  return (
    <Link
      to={cell.to}
      className={cx("relative grid size-5.5 flex-none place-items-center rounded-[5px] transition-transform hover:z-10 hover:scale-125 hover:shadow-md focus-visible:z-10 focus-visible:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-kc-blue-500", tooltipTriggerClass, cellToneClass(cell.response))}
      aria-label={`Question ${cell.number}: ${responseLabel(cell.response)}`}
      aria-describedby={tooltipId}
    >
      <TooltipLabel id={tooltipId} label={`Q${cell.number} · ${responseLabel(cell.response)}`} placement="top" />
    </Link>
  );
}

/** Sorted by gap count (No + Partial) descending — the story is "what needs attention first,"
 *  not alphabetical order. A fully-unassessed section (0 gaps, but 0 answered) still gets its own
 *  row with an explicit "0 of N answered" caption, so it never reads as gap-free/healthy. */
export function GapsBySectionChart({ sections }: { sections: SectionGapRow[] }) {
  const sorted = [...sections].sort((a, b) => (b.no + b.partial) - (a.no + a.partial));
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <div>
          <p className={eyebrowClasses}>Assessment gaps</p>
          <h2 className={cardHeaderTitleClass}>Gaps by section</h2>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <LegendSwatch tone="success" label="Yes" />
          <LegendSwatch tone="warning" label="Partial" />
          <LegendSwatch tone="danger" label="No" />
          <LegendSwatch tone="neutral" label="Unanswered" />
        </div>
      </div>
      {sorted.length ? (
        <div className="grid gap-4 p-4">
          {sorted.map((section) => {
            const answered = section.total - section.unanswered;
            const gaps = section.no + section.partial;
            const caption = gaps === 0
              ? (section.unanswered > 0 ? `No gaps yet · ${answered} of ${section.total} answered` : `No gaps · ${answered} of ${section.total} answered`)
              : `No ${section.no} · Partial ${section.partial}${section.unanswered ? ` · Unanswered ${section.unanswered}` : ""} · ${answered} of ${section.total} answered`;
            return (
              <div key={section.id} className="grid min-w-0 gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <Link to={section.to} className="truncate text-sm font-semibold text-slate-800 hover:text-kc-blue-700 dark:text-slate-200 dark:hover:text-kc-blue-300">{section.name}</Link>
                  <span className="flex-none text-xs text-slate-500 dark:text-slate-400">{caption}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {section.cells.map((cell) => <GapCell key={cell.id} cell={cell} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : <p className="m-0 p-4 text-sm text-slate-500 dark:text-slate-400">No sections to show yet.</p>}
    </section>
  );
}

/** A single compact status strip rather than another bar+list — this page already has two
 *  stacked-bar charts and a ranked list, so evidence coverage is deliberately just one line:
 *  icon, headline fraction, and a link out, the way a dense summary card should read.
 *  "Required" means the requirement itself asks for evidence (`evidenceRequired`, or an
 *  expected-evidence list) — not a judgement about whether the answer is acceptable. */
export function EvidenceCoverageStrip({ attached, missing, notRequired, to }: { attached: number; missing: number; notRequired: number; to: string }) {
  const required = attached + missing;
  const pct = required > 0 ? Math.round((attached / required) * 100) : 0;
  return (
    <section className={cx(cardClass, "flex w-full min-w-0 flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between")}>
      <div className="flex min-w-0 items-center gap-3">
        <span className={cx("grid size-10 flex-none place-items-center rounded-lg", iconChipClass[required > 0 && pct < 100 ? "warning" : "success"])}><Paperclip size={19} /></span>
        <div className="min-w-0">
          <p className={eyebrowClasses}>Supporting material</p>
          <h2 className="mt-0.5 text-base font-bold text-slate-900 dark:text-slate-100">Evidence coverage</h2>
          <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">
            {required > 0 ? <><strong className="text-slate-900 dark:text-slate-100">{attached}</strong> of {required} evidence-required requirements have an item attached</> : "No requirements ask for evidence yet"}
            {notRequired > 0 && ` · ${notRequired} don't require evidence`}
          </p>
        </div>
      </div>
      <div className="flex flex-none items-center gap-3 self-stretch sm:self-auto">
        <span className={cx(pillBase, toneChipClass[required > 0 && pct < 100 ? "warning" : "success"])}>{pct}% covered</span>
        <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-kc-blue-700 hover:text-kc-blue-900 hover:underline dark:text-kc-blue-300 dark:hover:text-kc-blue-100">View gaps <ArrowRight size={15} /></Link>
      </div>
    </section>
  );
}

export interface OwnerActionRow {
  name: string;
  count: number;
  to?: string;
}

/** "Unassigned" rows link to plain `/actions` (no `?q=` filter) — a blank owner string wouldn't
 *  reliably filter the existing free-text search box, so it's more honest to open the full list
 *  than fake a filter that doesn't really narrow anything. */
function initialsFor(name: string) {
  return name.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

/** A ranked list (avatar + name + count), not another bar chart — this page already has two
 *  stacked-bar charts, so owners get a different treatment to keep the page from reading as one
 *  repeated widget. Rank order still carries the same "who has the most open work" signal a bar
 *  chart would, just via position and a numbered badge instead of length. */
export function OpenActionsByOwnerChart({ owners }: { owners: OwnerActionRow[] }) {
  const totalOpen = owners.reduce((sum, owner) => sum + owner.count, 0);
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <div>
          <p className={eyebrowClasses}>Corrective actions</p>
          <h2 className={cardHeaderTitleClass}>Open actions by owner</h2>
        </div>
        <span className={cardHeaderDetailClass}><strong className="text-base text-slate-900 dark:text-slate-100">{totalOpen}</strong> open</span>
      </div>
      {owners.length ? (
        <ul className="m-0 grid list-none gap-1 p-2.5">
          {owners.map((owner, index) => {
            const row = (
              <>
                <span className="grid size-6 flex-none place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{index + 1}</span>
                <span className={cx("grid size-9 flex-none place-items-center rounded-full text-xs font-bold", owner.name === "Unassigned" ? iconChipClass.neutral : iconChipClass.brand)}>{owner.name === "Unassigned" ? <AlertTriangle size={16} /> : initialsFor(owner.name)}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{owner.name}</span>
                <span className="flex-none rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-300">{owner.count} open</span>
              </>
            );
            return (
              <li key={owner.name}>
                {owner.to
                  ? <Link className="flex items-center gap-3 rounded-lg px-1.5 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800" to={owner.to}>{row}</Link>
                  : <div className="flex items-center gap-3 px-1.5 py-2">{row}</div>}
              </li>
            );
          })}
        </ul>
      ) : <p className="m-0 p-4 text-sm text-slate-500 dark:text-slate-400">No open corrective actions right now.</p>}
    </section>
  );
}

export interface NeedsAttentionItem {
  label: string;
  detail: string;
  to: string;
}

/** Never labels a gap "high risk"/"critical" — there is no severity field anywhere in the data
 *  model, so every item here is a factual description of what's missing or unassessed. */
export function NeedsAttentionPanel({ items, viewAllTo }: { items: NeedsAttentionItem[]; viewAllTo: string }) {
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <div>
          <p className={eyebrowClasses}>Needs attention</p>
          <h2 className={cardHeaderTitleClass}>What to do next</h2>
        </div>
      </div>
      {items.length ? (
        <ul className="m-0 grid list-none gap-2 p-2.5">
          {items.map((item, index) => (
            <li key={index}>
              <Link to={item.to} className="flex items-start gap-2.5 rounded-lg border border-slate-200 p-3 text-sm transition-colors hover:border-kc-blue-300 hover:bg-kc-blue-50 dark:border-slate-700 dark:hover:border-kc-blue-800 dark:hover:bg-kc-blue-950">
                <AlertTriangle size={17} className="mt-0.5 flex-none text-amber-700 dark:text-amber-300" />
                <span className="grid min-w-0 gap-0.5">
                  <strong className="text-slate-900 dark:text-slate-100">{item.label}</strong>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : <div className="p-4"><InlineMessage tone="success" title="Nothing urgent">No open items need attention right now.</InlineMessage></div>}
      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        <Link to={viewAllTo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-kc-blue-700 hover:text-kc-blue-900 hover:underline dark:text-kc-blue-300 dark:hover:text-kc-blue-100">View all actions <ArrowRight size={15} /></Link>
      </div>
    </section>
  );
}

export interface RecentChangeRow {
  entry: AssessmentHistoryEntry;
  requirement: Requirement;
}

/** A responsive grid of compact cards rather than one stacked list — the rest of the page is
 *  already list-heavy (owners, needs attention), so recent activity gets a grid treatment instead.
 *  Still mirrors QuestionHistoryTimeline's own formatting in SiteScreens.tsx (entry.event shown
 *  as-is, the same responseChipClass/responseLabel helpers, the same date format) so the words
 *  used read as the same convention as the Actions page's own "Response history" tab. */
export function RecentChangesFeed({ rows }: { rows: RecentChangeRow[] }) {
  return (
    <section className={cardClass}>
      <div className={cardHeaderClass}>
        <div>
          <p className={eyebrowClasses}>Activity</p>
          <h2 className={cardHeaderTitleClass}>Recent changes</h2>
        </div>
      </div>
      {rows.length ? (
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <li key={row.entry.id} className="grid min-w-0 gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{row.entry.event}</span>
                <span className={responseChipClass(row.entry.response)}>{responseLabel(row.entry.response)}</span>
              </div>
              <Link to={requirementRoute(row.requirement)} className="truncate text-xs font-semibold text-kc-blue-700 hover:underline dark:text-kc-blue-300">{row.requirement.number} · {row.requirement.title}</Link>
              <span className="text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">{row.entry.recordedBy} · {new Date(row.entry.recordedAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      ) : <p className="m-0 p-4 text-sm text-slate-500 dark:text-slate-400">No activity recorded yet.</p>}
    </section>
  );
}
