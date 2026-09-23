import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileWarning,
  Filter,
  HelpCircle,
  Mail,
  Paperclip,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  UserX,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useSites } from "../model/useSites";
import { useAuth } from "../../auth";
import { actionComplete, actionStatus, assessmentPeriods, currentAssessmentPeriod, isActionOpen, isActionMissingOwner, isActionMissingDescription, isGap, responseLabel, rollupPerformance, type SectionKind } from "../../../shared/domain/assessment";
import { requirementRoute } from "../../../app/router/links";
import { appPaths } from "../../../app/router/route-manifest";
import type { ActionItem, AssessmentPeriod, OwnerRecord, Requirement, SectionSummary, SiteContacts } from "../../../shared/types";
import { Button, EmptyState, eyebrowClasses, FrameworkBadge, IconButton, InlineMessage, MetricCard, PageHeader, PerformanceBadge, ProgressBar, SaveStatus, Select } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";
import { AssessmentGlanceCard, EvidenceCoverageStrip, GapsBySectionChart, HeroStatCard, InlineBreakdown, InlineProgress, NeedsAttentionPanel, OpenActionsByOwnerChart, RecentChangesFeed } from "../components/OverviewCharts";
import type { NeedsAttentionItem, OwnerActionRow, SectionGapRow } from "../components/OverviewCharts";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/* Every page in this file shares the same outer shell. Padding-inline stays a CSS var (a fluid
   clamp() the Tailwind spacing scale cannot express); text colour is set here so every plain,
   unstyled heading/paragraph nested below inherits a readable colour in dark mode too. */
const pageContainerStyle = { paddingInline: "var(--page-gutter)" } as const;
const pageContainerClass = "page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100";

const pageSectionClass = "page-section mt-9";
const sectionTitleRowClass = "section-title-row mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end";
const sectionCardGridClass = "section-card-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3";
const metricsGridClass = "metrics-grid mt-5 grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-4";

/** Canonical primary button recipe, inlined onto `<Link>` elements (the shared Button component
 * only renders a `<button>`). Kept verbatim from the Button base + primary variant + default size. */
const primaryLinkButtonClass = "button inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-semibold whitespace-nowrap transition-colors bg-kc-blue-600 text-white hover:bg-kc-blue-700 active:bg-kc-blue-800 min-h-10 px-4 py-2.5";

/* Shared form-field recipe (label row, required marker, input/textarea chrome, error text) reused
   by site contacts, owner, and corrective-action forms. */
const fieldWrapClass = "field grid min-w-0 gap-1.5";
const fieldLabelRowClass = "flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300";
const fieldRequiredClass = "text-xs font-semibold text-red-700 dark:text-red-400";
const fieldInputClass = "w-full min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-kc-blue-900";
const fieldTextareaClass = cx(fieldInputClass, "resize-y leading-normal");
const fieldInvalidClass = "border-red-600 focus:border-red-600 ring-3 ring-red-100 dark:border-red-500 dark:focus:border-red-500 dark:ring-red-950";
const fieldErrorClass = "field-error mt-1.5 block text-xs font-semibold text-red-700 dark:text-red-400";
const formGridClass = "form-grid grid grid-cols-1 gap-4 p-5 md:grid-cols-2";

/* Search box shared by every content-toolbar and filter-row below. Width is capped with
   max-w-md, never flex-basis — flex-basis sizes the box's HEIGHT once its flex row becomes a
   column at the md: breakpoint, inflating it to the basis value instead of a normal input height. */
const searchControlClass = "search-control flex min-h-10 w-full min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-slate-500 focus-within:border-kc-blue-600 focus-within:ring-3 focus-within:ring-kc-blue-100 md:min-w-64 md:max-w-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:focus-within:ring-kc-blue-900";
const searchInputClass = "min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none dark:text-slate-100";
const contentToolbarClass = "content-toolbar mt-5 flex flex-col items-stretch gap-3 md:flex-row md:items-center";
const filterRowClass = "filter-row flex flex-col flex-wrap items-stretch gap-2 border-t border-slate-100 border-b border-slate-200 px-4 py-3 dark:border-slate-800 dark:border-slate-700 md:flex-row md:items-center";

/* Card / panel recipe, shared by form, table, and owner cards. */
const cardClass = "mt-5 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";
const cardHeaderClass = "flex flex-col items-start justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-700 md:flex-row";
const cardHeaderTitleClass = "mt-1 text-lg font-bold text-slate-900 dark:text-slate-100";
const cardHeaderDetailClass = "text-sm text-slate-500 dark:text-slate-400";

/* Dialog chrome — matches ConfirmDialog in shared/ui/UI.tsx exactly. */
const dialogLayerClass = "dialog-layer fixed inset-0 z-100 grid place-items-center p-4";
const dialogBackdropClass = "dialog-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-sm";
const dialogClass = "dialog relative max-h-full w-full max-w-xl overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-dialog-in dark:border-slate-700 dark:bg-slate-900";
const dialogHeaderClass = "dialog__header flex items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-700";
const dialogTitleClass = "mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100";
const dialogFormClass = "dialog-form grid gap-4 p-4";
const dialogContextClass = "dialog-context mx-4 mt-4 border-l-3 border-kc-blue-500 py-1 pl-3 text-sm text-slate-700 dark:border-kc-blue-400 dark:text-slate-300";
const dialogFooterClass = "dialog__footer flex flex-col-reverse items-stretch gap-4 border-t border-slate-200 p-4 md:flex-row md:items-center md:justify-end dark:border-slate-700";

/* Owner / contact person rows — identical to shared/ui/SitePanels.tsx, since both files render
   the same owner cards. */
const ownerPersonClass = "owner-person flex items-center gap-3 border-t border-slate-100 py-3 dark:border-slate-800";
const avatarSoftClass = "avatar avatar--soft inline-grid size-9 flex-none place-items-center rounded-full border border-kc-blue-200 bg-kc-blue-50 text-xs font-bold text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200";
const avatarTinyClass = "avatar avatar--tiny inline-grid size-7 flex-none place-items-center rounded-full border border-kc-blue-200 bg-kc-blue-50 text-xs font-bold text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200";
const personTextClass = "grid min-w-0";
const personRoleClass = "text-xs text-slate-500 dark:text-slate-400";
const personNameClass = "text-sm text-slate-900 dark:text-slate-100";
const personEmailClass = "overflow-hidden text-xs text-ellipsis text-slate-500 hover:text-kc-blue-700 dark:text-slate-400 dark:hover:text-kc-blue-300";

/* Tinted pill recipe (status / response chips) — verbatim from the design spec. */
const pillBase = "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold";
const responseTone: Record<"no" | "partial" | "yes" | "none", string> = {
  no: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  partial: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  yes: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  none: "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
};
const responseChipClass = (response: string | null | undefined) => cx("response-chip", pillBase, responseTone[(response ?? "none") as keyof typeof responseTone]);
const missingValueClass = "missing-value text-xs text-amber-700 italic dark:text-amber-300";

function SectionCard({ section, requirement }: { section: SectionSummary; requirement?: Requirement }) {
  const content = (
    <article className={cx("section-card flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition duration-150 hover:border-kc-blue-300 hover:-translate-y-0.5 hover:shadow-lg md:min-h-67 dark:border-slate-700 dark:bg-slate-900")}>
      <div className={cx("section-card__top flex items-center justify-between")}>
        <span className={cx("section-card__icon grid size-10 place-items-center rounded-xl bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300")}>{section.kind === "operating-system" ? <ClipboardCheck size={21} /> : <ShieldCheck size={21} />}</span>
        <PerformanceBadge performance={section.performance} compact />
      </div>
      <div className={cx("section-card__body my-4 flex-1")}>
        <h3 className={cx("mb-1.5 text-lg font-bold text-slate-900 dark:text-slate-100")}>{section.name}</h3>
        <p className={cx("text-sm leading-snug text-slate-600 dark:text-slate-400")}>{section.description}</p>
      </div>
      <ProgressBar value={section.completion} label="Completion" />
      <div className={cx("section-card__footer mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400")}><span>{section.questions} questions</span><span>{section.gaps} gaps</span><ChevronRight size={18} className={cx("ml-auto text-kc-blue-700 dark:text-kc-blue-300")} /></div>
    </article>
  );
  return requirement ? <Link className={cx("card-link block rounded-lg")} to={requirementRoute(requirement)}>{content}</Link> : content;
}

export function OverviewScreen() {
  const { requirements, sectionSummaries, assignedSite, lastUpdated } = useSites();
  const sectionKindById = useMemo(() => new Map(sectionSummaries.map((section) => [section.id, section.kind])), [sectionSummaries]);
  const nextRequirement = requirements.find((requirement) => !actionComplete(requirement.response, requirement.action)) ?? requirements[0];
  const nextRoute = nextRequirement ? requirementRoute(nextRequirement) : "/assessment";

  const openActions = useMemo(() => requirements.filter((requirement) => isGap(requirement.response) && isActionOpen(requirement.action)), [requirements]);
  const unassignedOpenActions = useMemo(() => openActions.filter((requirement) => isActionMissingOwner(requirement.action)), [openActions]);
  const completedActions = useMemo(() => requirements.filter((requirement) => isGap(requirement.response) && !isActionOpen(requirement.action)), [requirements]);
  const unansweredQuestions = useMemo(() => requirements.filter((requirement) => requirement.response === null), [requirements]);

  const sectionGroups = useMemo(() => {
    const bySection = new Map<string, { name: string; items: Requirement[] }>();
    requirements.forEach((requirement) => {
      const entry = bySection.get(requirement.sectionId) ?? { name: requirement.sectionName, items: [] };
      entry.items.push(requirement);
      bySection.set(requirement.sectionId, entry);
    });
    return [...bySection.entries()].map(([id, { name, items }]) => ({ id, name, items }));
  }, [requirements]);

  const sectionRows = useMemo<SectionGapRow[]>(() => sectionGroups.map(({ id, name, items }) => {
    const gapItem = items.find((requirement) => isGap(requirement.response));
    const target = gapItem ?? items[0];
    return {
      id,
      name,
      kind: sectionKindById.get(id) ?? "operating-system",
      total: items.length,
      no: items.filter((requirement) => requirement.response === "no").length,
      partial: items.filter((requirement) => requirement.response === "partial").length,
      unanswered: items.filter((requirement) => requirement.response === null).length,
      to: target ? requirementRoute(target) : appPaths.assessment,
      cells: items.map((requirement) => ({ id: requirement.id, number: requirement.number, response: requirement.response, to: requirementRoute(requirement) })),
    };
  }), [sectionGroups, sectionKindById]);

  const completionStats = useMemo(() => ({
    answered: requirements.filter((requirement) => requirement.response !== null).length,
    total: requirements.length,
  }), [requirements]);

  const responseBreakdown = useMemo(() => ({
    yes: requirements.filter((requirement) => requirement.response === "yes").length,
    no: requirements.filter((requirement) => requirement.response === "no").length,
    partial: requirements.filter((requirement) => requirement.response === "partial").length,
    unanswered: requirements.filter((requirement) => requirement.response === null).length,
    total: requirements.length,
  }), [requirements]);

  const sectionPerformance = useMemo(() => {
    const counts = { initial: 0, emerging: 0, performing: 0, notAssessed: 0 };
    sectionGroups.forEach(({ items }) => {
      const performance = rollupPerformance(items.map((requirement) => requirement.response));
      if (performance === "initial") counts.initial += 1;
      else if (performance === "emerging") counts.emerging += 1;
      else if (performance === "performing") counts.performing += 1;
      else counts.notAssessed += 1;
    });
    return { ...counts, total: sectionGroups.length };
  }, [sectionGroups]);

  const evidenceCoverage = useMemo(() => {
    let attached = 0;
    let missing = 0;
    let notRequired = 0;
    requirements.forEach((requirement) => {
      const required = requirement.evidenceRequired ?? requirement.expectedEvidence.length > 0;
      if (!required) notRequired += 1;
      else if (requirement.evidence.length > 0) attached += 1;
      else missing += 1;
    });
    return { attached, missing, notRequired, total: requirements.length };
  }, [requirements]);

  const openActionsByResponse = useMemo(() => ({
    no: openActions.filter((requirement) => requirement.response === "no").length,
    partial: openActions.filter((requirement) => requirement.response === "partial").length,
  }), [openActions]);

  const unansweredSectionCount = useMemo(() => sectionGroups.filter(({ items }) => items.some((requirement) => requirement.response === null)).length, [sectionGroups]);

  const closedGapPct = openActions.length + completedActions.length > 0 ? Math.round((completedActions.length / (openActions.length + completedActions.length)) * 100) : 0;

  const ownerRows = useMemo<OwnerActionRow[]>(() => {
    const byOwner = new Map<string, number>();
    openActions.forEach((requirement) => {
      const name = requirement.action?.owner?.trim() || "Unassigned";
      byOwner.set(name, (byOwner.get(name) ?? 0) + 1);
    });
    return [...byOwner.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, to: name === "Unassigned" ? appPaths.actions : `${appPaths.actions}?q=${encodeURIComponent(name)}` }));
  }, [openActions]);

  const needsAttentionItems = useMemo<NeedsAttentionItem[]>(() => {
    const items: NeedsAttentionItem[] = [];
    for (const requirement of requirements) {
      if (items.length >= 5) break;
      if (!isGap(requirement.response)) continue;
      const missingOwner = isActionMissingOwner(requirement.action);
      const missingDescription = isActionMissingDescription(requirement.action);
      if (!missingOwner && !missingDescription) continue;
      const what = missingOwner && missingDescription ? "no owner or description" : missingOwner ? "no owner assigned" : "no description";
      items.push({ label: `${requirement.number} · ${requirement.title}`, detail: `Corrective action has ${what}`, to: requirementRoute(requirement) });
    }
    if (items.length < 5) {
      for (const { items: sectionItems } of sectionGroups) {
        if (items.length >= 5) break;
        if (sectionItems.length > 0 && sectionItems.every((requirement) => requirement.response === null)) {
          items.push({ label: sectionItems[0].sectionName, detail: `Not yet assessed · 0 of ${sectionItems.length} answered`, to: requirementRoute(sectionItems[0]) });
        }
      }
    }
    if (items.length < 5) {
      const ranked = sectionRows.filter((section) => section.no + section.partial > 0).sort((a, b) => (b.no + b.partial) - (a.no + a.partial));
      for (const section of ranked) {
        if (items.length >= 5) break;
        const gaps = section.no + section.partial;
        items.push({ label: section.name, detail: `${gaps} No/Partial gap${gaps === 1 ? "" : "s"}`, to: section.to });
      }
    }
    return items;
  }, [requirements, sectionGroups, sectionRows]);

  const recentChanges = useMemo(() => requirements
    .flatMap((requirement) => (requirement.history ?? []).map((entry) => ({ entry, requirement })))
    .sort((a, b) => b.entry.recordedAt.localeCompare(a.entry.recordedAt))
    .slice(0, 8), [requirements]);

  if (!requirements.length) {
    return (
      <div className={cx(pageContainerClass)} style={pageContainerStyle}>
        <PageHeader eyebrow="Site workspace" title="Site overview" description="Review completion, gaps, and the work needed for your assigned site." />
        <EmptyState icon={<Search size={27} />} title="No requirements yet" description="Published requirements for your site will appear here once they're available." />
      </div>
    );
  }

  return (
    <div className={cx(pageContainerClass)} style={pageContainerStyle}>
      <PageHeader eyebrow="Site workspace" title="Site overview" description="Review completion, gaps, and the work needed for your assigned site." actions={<Link className={cx(primaryLinkButtonClass)} to={nextRoute} data-tour="continue-assessment"><span>Continue assessment</span><ArrowRight size={18} /></Link>} />
      <p className="overview-meta -mt-5 mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
        <strong className="font-semibold text-slate-800 dark:text-slate-200">{assignedSite.name}</strong>
        <span>· {assignedSite.code}</span>
        <span>· {currentAssessmentPeriod}</span>
        <span>· Updated {new Date(lastUpdated).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
      </p>
      <div className={cx(metricsGridClass)}>
        <HeroStatCard
          label="Open actions"
          value={openActions.length}
          tone="warning"
          icon={<FileWarning size={19} />}
          footer={<InlineBreakdown items={[{ label: "No", value: openActionsByResponse.no, tone: "danger" }, { label: "Partial", value: openActionsByResponse.partial, tone: "warning" }]} />}
        />
        <HeroStatCard
          label="Unassigned open actions"
          value={unassignedOpenActions.length}
          tone="danger"
          icon={<UserX size={19} />}
          footer={<InlineProgress value={unassignedOpenActions.length} total={openActions.length || 1} tone="danger" caption={`${unassignedOpenActions.length} of ${openActions.length} open actions have no owner`} />}
        />
        <HeroStatCard
          label="Unanswered questions"
          value={unansweredQuestions.length}
          tone="neutral"
          icon={<HelpCircle size={19} />}
          footer={<p className="m-0 text-[10px] text-slate-500 sm:text-xs dark:text-slate-400">Spread across {unansweredSectionCount} of {sectionGroups.length} sections</p>}
        />
        <HeroStatCard
          label="Completed actions"
          value={completedActions.length}
          tone="success"
          icon={<CheckCircle2 size={19} />}
          footer={<span className={cx(pillBase, completedActions.length > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300")}>{closedGapPct}% of gaps closed</span>}
        />
      </div>
      <div className="mt-4">
        <AssessmentGlanceCard completion={completionStats} responses={responseBreakdown} sectionPerformance={sectionPerformance} />
      </div>
      <div className="overview-charts-row mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[2fr_1fr_1fr]">
        <GapsBySectionChart sections={sectionRows} />
        <NeedsAttentionPanel items={needsAttentionItems} viewAllTo={appPaths.actions} />
        <OpenActionsByOwnerChart owners={ownerRows} />
      </div>
      <div className="mt-4">
        <EvidenceCoverageStrip {...evidenceCoverage} to={appPaths.assessment} />
      </div>
      <div className="mt-4">
        <RecentChangesFeed rows={recentChanges} />
      </div>
      <p className="overview-footer mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span>{sectionGroups.length} sections</span>
        <span>· {requirements.length} requirements</span>
        <span>· {assignedSite.name}</span>
        <span className="ml-auto">Last synced {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </p>
    </div>
  );
}

export function AssessmentHomeScreen() {
  const { requirements, sectionSummaries, overallCompletion, overallPerformance, gapCount, missingActionCount } = useSites();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | "operating-system" | "performance-standard">("all");
  const filtered = sectionSummaries.filter((section) => {
    const matchesQuery = `${section.name} ${section.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === "all" || section.kind === category);
  });
  const operating = filtered.filter((section) => section.kind === "operating-system");
  const standards = filtered.filter((section) => section.kind === "performance-standard");
  const next = requirements.find((requirement) => !actionComplete(requirement.response, requirement.action)) ?? requirements[0];
  return (
    <div className={cx(pageContainerClass)} style={pageContainerStyle}>
      <PageHeader eyebrow="Self-assessment" title="Assessment sections" description="Work through the Operating System, Health & Safety, and Occupational Health requirements for your assigned site." actions={next && <Link className={cx(primaryLinkButtonClass)} to={requirementRoute(next)} data-tour="assessment-next-incomplete"><BookOpenCheck size={18} /><span>Open next incomplete</span></Link>} />
      <div className={cx("assessment-summary-strip grid grid-cols-1 rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-4 dark:border-slate-700 dark:bg-slate-900")}>
        <div className={cx("grid min-h-19 content-center items-start justify-items-start gap-1 border-b border-slate-200 p-5 md:min-h-23 md:border-r md:border-b-0 dark:border-slate-700")}><strong className={cx("text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100")}>{overallCompletion}%</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Overall completion</span></div>
        <div className={cx("grid min-h-19 content-center items-start justify-items-start gap-1 border-b border-slate-200 p-5 md:min-h-23 md:border-r md:border-b-0 dark:border-slate-700")}><PerformanceBadge performance={overallPerformance} /><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Current self-assessed performance level</span></div>
        <div className={cx("grid min-h-19 content-center items-start justify-items-start gap-1 border-b border-slate-200 p-5 md:min-h-23 md:border-r md:border-b-0 dark:border-slate-700")}><strong className={cx("text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100")}>{gapCount}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>No / Partial gaps</span></div>
        <div className={cx("grid min-h-19 content-center items-start justify-items-start gap-1 p-5 md:min-h-23")}><strong className={cx("text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100")}>{missingActionCount}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>Missing action details</span></div>
      </div>
      <div className={cx(contentToolbarClass)}>
        <label className={cx(searchControlClass)}><Search size={18} /><input className={cx(searchInputClass)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sections and standards" /></label>
        <Select
          label="Filter assessment category"
          icon={<Filter size={18} />}
          value={category}
          onChange={(value) => setCategory(value as typeof category)}
          options={[
            { value: "all", label: "All categories" },
            { value: "operating-system", label: "Operating System" },
            { value: "performance-standard", label: "Performance Standards" },
          ]}
        />
      </div>
      {operating.length > 0 && <section className={cx(pageSectionClass)} data-tour="assessment-sections"><div className={cx(sectionTitleRowClass)}><div><p className={cx(eyebrowClasses)}>Framework</p><h2 className={cx("mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100")}>Operating System</h2></div><span className={cx("text-sm text-slate-500 dark:text-slate-400")}>{operating.length} sections</span></div><div className={cx(sectionCardGridClass)}>{operating.map((section) => <SectionCard section={section} requirement={requirements.find((item) => item.sectionId === section.id)} key={section.id} />)}</div></section>}
      {standards.length > 0 && <section className={cx(pageSectionClass)}><div className={cx(sectionTitleRowClass)}><div><p className={cx(eyebrowClasses)}>Assessment standards</p><h2 className={cx("mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100")}>Performance Standards</h2></div><span className={cx("text-sm text-slate-500 dark:text-slate-400")}>Health, Safety, and Occupational Health</span></div><div className={cx(sectionCardGridClass)}>{standards.map((section) => <SectionCard section={section} requirement={requirements.find((item) => item.sectionId === section.id)} key={section.id} />)}</div></section>}
      {!filtered.length && <EmptyState icon={<Search size={26} />} title="No sections found" description="Try a different search or category filter." />}
    </div>
  );
}

const siteFields: Array<{ key: keyof SiteContacts; label: string; group: "local" | "regional"; email?: boolean }> = [
  { key: "siteManager", label: "Site / Location Manager", group: "local" },
  { key: "siteManagerEmail", label: "Manager email", group: "local", email: true },
  { key: "environmentalLeader", label: "Site Environmental Leader", group: "local" },
  { key: "environmentalLeaderEmail", label: "Environmental Leader email", group: "local", email: true },
  { key: "healthSafetyLeader", label: "Site Health & Safety Leader", group: "local" },
  { key: "healthSafetyLeaderEmail", label: "Health & Safety Leader email", group: "local", email: true },
  { key: "occupationalHealthNurse", label: "Site Occupational Health Nurse", group: "local" },
  { key: "occupationalHealthNurseEmail", label: "Occupational Health Nurse email", group: "local", email: true },
  { key: "regionalHealthSafetyLeader", label: "Regional Health & Safety Leader", group: "regional" },
  { key: "regionalHealthSafetyEmail", label: "Regional Health & Safety email", group: "regional", email: true },
  { key: "regionalEnvironmentalLeader", label: "Regional Environmental Leader", group: "regional" },
  { key: "regionalEnvironmentalEmail", label: "Regional Environmental email", group: "regional", email: true },
  { key: "regionalOccupationalHealthLeader", label: "Regional Occupational Health Leader", group: "regional" },
  { key: "regionalOccupationalHealthEmail", label: "Regional Occupational Health email", group: "regional", email: true },
];

function ContactsGroup({ group, draft, errors, onChange }: { group: "local" | "regional"; draft: SiteContacts; errors: Set<keyof SiteContacts>; onChange: (key: keyof SiteContacts, value: string) => void }) {
  return <div className={cx(formGridClass)}>{siteFields.filter((field) => field.group === group).map((field) => {
    const invalid = errors.has(field.key);
    return (
      <label className={cx(fieldWrapClass)} key={field.key}>
        <span className={cx(fieldLabelRowClass)}>{field.label} <b className={cx(fieldRequiredClass)}>Required</b></span>
        {field.email ? (
          <span className={cx("field-control-with-icon relative flex items-center")}>
            <Mail size={17} className={cx("absolute left-3 text-slate-500 dark:text-slate-400")} />
            <input className={cx(fieldInputClass, "pl-9", invalid && fieldInvalidClass)} type="email" value={draft[field.key]} onChange={(event) => onChange(field.key, event.target.value)} aria-invalid={invalid} />
          </span>
        ) : (
          <input className={cx(fieldInputClass, invalid && fieldInvalidClass)} value={draft[field.key]} onChange={(event) => onChange(field.key, event.target.value)} aria-invalid={invalid} />
        )}
        {invalid && <small className={cx(fieldErrorClass)}>{field.email ? "Enter a valid email address." : "This contact is required."}</small>}
      </label>
    );
  })}</div>;
}

export function SiteInformationScreen() {
  const { siteContacts, saveSiteContacts } = useSites();
  const [draft, setDraft] = useState<SiteContacts>(siteContacts);
  const [saved, setSaved] = useState(true);
  const [errors, setErrors] = useState<Set<keyof SiteContacts>>(new Set());
  const [confirmation, setConfirmation] = useState(false);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (!saved) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saved]);

  function change(key: keyof SiteContacts, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setConfirmation(false);
    setErrors((current) => { const next = new Set(current); next.delete(key); return next; });
  }

  function save() {
    const invalid = new Set<keyof SiteContacts>();
    siteFields.forEach((field) => { if (!draft[field.key].trim() || (field.email && !isEmail(draft[field.key]))) invalid.add(field.key); });
    setErrors(invalid);
    if (invalid.size) return;
    saveSiteContacts(draft);
    setSaved(true);
    setConfirmation(true);
  }

  return (
    <div className={cx(pageContainerClass)} style={pageContainerStyle}>
      <PageHeader eyebrow="Site workspace" title="Site information" description="Maintain leadership and contact details for your assigned site. Core site identity is governed centrally." actions={<Button variant="primary" icon={<Save size={18} />} onClick={save} disabled={saved} data-tour="site-save">Save changes</Button>} />
      {confirmation && <InlineMessage tone="success" title="Site contacts saved">The updated contact information is now available across this site workspace.</InlineMessage>}
      {errors.size > 0 && <InlineMessage tone="danger" title="Review the highlighted fields">Complete every contact and use a valid email address before saving.</InlineMessage>}
      <section className={cx("form-card", cardClass)} data-tour="site-contacts-form">
        <div className={cx("form-card__header", cardHeaderClass)}><div><p className={cx(eyebrowClasses)}>Local leadership</p><h2 className={cx(cardHeaderTitleClass)}>Site contacts</h2><span className={cx(cardHeaderDetailClass)}>People responsible for site-level EHS&S coordination.</span></div>{saved ? <SaveStatus /> : <span className={cx("unsaved-state rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5 font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300")}>Unsaved changes</span>}</div>
        <ContactsGroup group="local" draft={draft} errors={errors} onChange={change} />
      </section>
      <section className={cx("form-card", cardClass)}>
        <div className={cx("form-card__header", cardHeaderClass)}><div><p className={cx(eyebrowClasses)}>Reference contacts</p><h2 className={cx(cardHeaderTitleClass)}>Regional leadership</h2><span className={cx(cardHeaderDetailClass)}>Used for escalation and enterprise communication.</span></div></div>
        <ContactsGroup group="regional" draft={draft} errors={errors} onChange={change} />
      </section>
    </div>
  );
}

function OwnerCard({ owner, onEdit }: { owner: OwnerRecord; onEdit: (owner: OwnerRecord) => void }) {
  const initials = (name: string) => name.split(" ").filter(Boolean).map((part) => part[0]).join("");
  return (
    <article className={cx("owner-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900")}>
      <div className={cx("owner-card__header mb-3 flex items-start justify-between gap-4")}><div><p className={cx("text-xs font-bold tracking-wide text-kc-blue-700 dark:text-kc-blue-300")}>{owner.category}</p><h3 className={cx("mt-1 text-slate-900 dark:text-slate-100")}>{owner.program}</h3></div><Button variant="tertiary" size="compact" icon={<Pencil size={16} />} onClick={() => onEdit(owner)}>Edit</Button></div>
      <div className={cx(ownerPersonClass)}><span className={cx(avatarSoftClass)}>{initials(owner.primaryName)}</span><div className={cx(personTextClass)}><small className={cx(personRoleClass)}>Primary Owner</small><strong className={cx(personNameClass)}>{owner.primaryName}</strong><a className={cx(personEmailClass)} href={`mailto:${owner.primaryEmail}`}>{owner.primaryEmail}</a></div></div>
      <div className={cx(ownerPersonClass)}><span className={cx(avatarSoftClass)}>{initials(owner.backupName)}</span><div className={cx(personTextClass)}><small className={cx(personRoleClass)}>Backup Owner</small><strong className={cx(personNameClass)}>{owner.backupName}</strong><a className={cx(personEmailClass)} href={`mailto:${owner.backupEmail}`}>{owner.backupEmail}</a></div></div>
    </article>
  );
}

function OwnerDialog({ owner, onClose, onSave }: { owner: OwnerRecord; onClose: () => void; onSave: (owner: OwnerRecord) => void }) {
  const [draft, setDraft] = useState(owner);
  const [submitted, setSubmitted] = useState(false);
  const valid = Boolean(draft.primaryName.trim() && draft.backupName.trim() && isEmail(draft.primaryEmail) && isEmail(draft.backupEmail));
  const fields: Array<{ key: keyof OwnerRecord; label: string; email?: boolean }> = [
    { key: "primaryName", label: "Primary Owner" }, { key: "primaryEmail", label: "Primary Owner email", email: true },
    { key: "backupName", label: "Backup Owner" }, { key: "backupEmail", label: "Backup Owner email", email: true },
  ];
  return <div className={cx(dialogLayerClass)}><button className={cx(dialogBackdropClass)} aria-label="Close owner editor" onClick={onClose} /><section className={cx(dialogClass)} role="dialog" aria-modal="true" aria-labelledby="owner-dialog-title">
    <div className={cx(dialogHeaderClass)}><div><p className={cx(eyebrowClasses)}>{owner.category}</p><h2 id="owner-dialog-title" className={cx(dialogTitleClass)}>Edit {owner.program} owners</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <InlineMessage tone="info" title="Both owners can edit">The labels show accountability; Primary and Backup Owners have the same site permissions.</InlineMessage>
    <div className={cx(dialogFormClass, formGridClass, "p-0")}>{fields.map((field) => {
      const value = draft[field.key];
      const invalid = submitted && (!String(value).trim() || (field.email && !isEmail(String(value))));
      return <label className={cx(fieldWrapClass)} key={field.key}><span className={cx(fieldLabelRowClass)}>{field.label} <b className={cx(fieldRequiredClass)}>Required</b></span><input className={cx(fieldInputClass, invalid && fieldInvalidClass)} type={field.email ? "email" : "text"} value={value} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} aria-invalid={invalid} />{invalid && <small className={cx(fieldErrorClass)}>{field.email ? "Enter a valid email address." : "Enter an owner name."}</small>}</label>;
    })}</div>
    <div className={cx(dialogFooterClass)}><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Save size={17} />} onClick={() => { setSubmitted(true); if (valid) onSave(draft); }}>Save owners</Button></div>
  </section></div>;
}

export function OwnersScreen() {
  const { ownerRecords, updateOwner, notify } = useSites();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<OwnerRecord | null>(null);
  const [savedName, setSavedName] = useState("");
  const filtered = ownerRecords.filter((owner) => `${owner.program} ${owner.primaryName} ${owner.backupName}`.toLowerCase().includes(query.toLowerCase()) && (category === "all" || owner.category === category));
  return (
    <div className={cx(pageContainerClass)} style={pageContainerStyle}>
      <PageHeader eyebrow="Site workspace" title="Program & standard owners" description="Primary and Backup Owners have equal edit permissions for this assigned site." />
      {savedName ? <InlineMessage tone="success" title={`${savedName} owners updated`}>The new Primary and Backup Owner details are saved for this site.</InlineMessage> : <InlineMessage tone="info" title="Equal permissions">Primary and Backup Owner labels identify responsibility only. Both roles can maintain the same assessment content.</InlineMessage>}
      <div className={cx(contentToolbarClass)} data-tour="owners-controls">
        <label className={cx(searchControlClass)}><Search size={18} /><input className={cx(searchInputClass)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search programs, standards, or people" /></label>
        <Select
          label="Filter owner category"
          icon={<Filter size={18} />}
          value={category}
          onChange={setCategory}
          options={[
            { value: "all", label: "All categories" },
            { value: "Operating System", label: "Operating System" },
            { value: "Performance Standard", label: "Performance Standard" },
          ]}
        />
      </div>
      {filtered.length ? <div className={cx("owner-grid mt-4 grid grid-cols-1 gap-4 md:grid-cols-2")} data-tour="owner-list">{filtered.map((owner) => <OwnerCard owner={owner} onEdit={setEditing} key={owner.id} />)}</div> : <EmptyState icon={<Search size={26} />} title="No owners found" description="Try another name or category." />}
      {editing && <OwnerDialog owner={editing} onClose={() => setEditing(null)} onSave={(owner) => {
        updateOwner(owner);
        // Split by audience: /owners is site-contributor-only, so an administrator given that
        // link would be redirected to their own home instead of the record.
        const ownerNote = {
          title: `${owner.program} owners updated`,
          body: `${owner.primaryName} is Primary Owner, with ${owner.backupName} as Backup Owner.`,
          category: "assignment" as const,
        };
        notify({ ...ownerNote, audience: ["site-contributor"], link: "/owners" });
        notify({ ...ownerNote, audience: ["administrator"], link: "/admin/sites/northstar" });
        setSavedName(owner.program); setEditing(null);
      }} />}
    </div>
  );
}

interface GapRow { requirement: Requirement; question: Requirement }

function ActionDialog({ row, onClose, onSave }: { row: GapRow; onClose: () => void; onSave: (action: ActionItem) => void }) {
  const [description, setDescription] = useState(row.question.action?.description ?? "");
  const [owner, setOwner] = useState(row.question.action?.owner ?? "");
  const [status, setStatus] = useState<NonNullable<ActionItem["status"]>>(row.question.action?.status ?? "Open");
  const [followUp, setFollowUp] = useState(row.question.action?.followUp ?? "");
  return <div className={cx(dialogLayerClass)}><button className={cx(dialogBackdropClass)} aria-label="Close action editor" onClick={onClose} /><section className={cx(dialogClass)} role="dialog" aria-modal="true" aria-labelledby="action-dialog-title">
    <div className={cx(dialogHeaderClass)}><div><p className={cx(eyebrowClasses)}>{row.requirement.number} · Question {row.question.number}</p><h2 id="action-dialog-title" className={cx(dialogTitleClass)}>Complete corrective action</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <p className={cx(dialogContextClass)}>{row.question.text}</p>
    <div className={cx(dialogFormClass)}>
      <label className={cx(fieldWrapClass)}><span className={cx(fieldLabelRowClass)}>Action description</span><textarea className={cx(fieldTextareaClass)} rows={4} value={description} placeholder="Describe the work needed to close this gap" onChange={(event) => setDescription(event.target.value)} /></label>
      <label className={cx(fieldWrapClass)}><span className={cx(fieldLabelRowClass)}>Action owner</span><input className={cx(fieldInputClass)} value={owner} placeholder="Assign an accountable owner" onChange={(event) => setOwner(event.target.value)} /></label>
      <div className={cx(fieldWrapClass)}><span className={cx(fieldLabelRowClass)}>Action status</span><Select label="Action status" value={status} onChange={(value) => setStatus(value as NonNullable<ActionItem["status"]>)} options={[{ value: "Open", label: "Open" }, { value: "In progress", label: "In progress" }, { value: "Complete", label: "Complete" }]} /></div>
      <label className={cx(fieldWrapClass)}><span className={cx(fieldLabelRowClass)}>Follow-up</span><textarea className={cx(fieldTextareaClass)} rows={3} value={followUp} placeholder="Add the next step or follow-up update" onChange={(event) => setFollowUp(event.target.value)} /></label>
    </div>
    <div className={cx(dialogFooterClass)}><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Save size={17} />} onClick={() => onSave({ description: description.trim(), owner: owner.trim(), status, followUp: followUp.trim() })}>Save action</Button></div>
  </section></div>;
}

interface QuestionHistoryRow { requirement: Requirement; question: Requirement }

function QuestionHistoryTimeline({ question }: { question: Requirement }) {
  const entries = [...(question.history ?? [])].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  return (
    <ol className={cx("response-history__timeline actions-response-history__timeline relative mt-0 grid gap-3 border-l-2 border-slate-200 py-0 pr-0 pl-4.5 ml-1.5 list-none dark:border-slate-700")}>
      {entries.map((entry) => (
        <li key={entry.id} className={cx("response-history__entry relative")}>
          <span className={cx("response-history__marker absolute top-4 -left-5.5 size-2.5 rounded-full border-2 border-white bg-kc-blue-600 dark:border-slate-900")} style={{ boxShadow: "0 0 0 1px var(--kc-300)" }} />
          <div className={cx("response-history__entry-card rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900")}>
            <div className={cx("response-history__entry-header flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center")}>
              <div className={cx("grid gap-0.5")}><strong className={cx("text-sm text-slate-900 dark:text-slate-100")}>{entry.event}</strong><span className={cx("text-xs text-slate-500 dark:text-slate-400")}>{entry.recordedBy} · {new Date(entry.recordedAt).toLocaleString()}</span></div>
            </div>
            <div className={cx("response-history__response mt-2.5 flex items-center justify-between gap-3")}><span className={cx("text-sm font-semibold text-slate-500 dark:text-slate-400")}>Response</span><span className={cx(responseChipClass(entry.response))}>{responseLabel(entry.response)}</span></div>
            {entry.action && <div className={cx("response-history__action mt-2.5 rounded-md bg-white p-2.5 dark:bg-slate-800")}><strong className={cx("text-sm text-slate-900 dark:text-slate-100")}>Corrective action</strong><p className={cx("mt-1 text-sm text-slate-800 dark:text-slate-200")}>{entry.action.description || "No action description added."}</p><div className={cx("mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400")}><span>Owner · {entry.action.owner || "Not assigned"}</span><span>Status · {entry.action.status ?? "Open"}</span><span>Follow-up · {entry.action.followUp || "Not added"}</span></div></div>}
            <div className={cx("response-history__evidence mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400")}><Paperclip size={14} /><span>{entry.evidence.length} evidence {entry.evidence.length === 1 ? "item" : "items"} at this point</span>{entry.evidence.length > 0 && <ul className={cx("mt-1 ml-5 basis-full list-disc")}>{entry.evidence.map((item) => (
              // The grid lives on this inner wrapper, not the <li> itself — setting `display:
              // grid` directly on the <li> would drop its bullet marker.
              <li key={item.id}><div className={cx("grid gap-0.5")}><span className={cx("text-slate-700 dark:text-slate-300")}>{item.title}{item.detail ? ` — ${item.detail}` : ""}</span>{item.note && <span className={cx("italic")}>How it meets the requirement: {item.note}</span>}</div></li>
            ))}</ul>}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function QuestionHistoryCard({ row, kind }: { row: QuestionHistoryRow; kind: SectionKind }) {
  const [open, setOpen] = useState(false);
  const entries = [...(row.question.history ?? [])].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  const detailsId = `site-question-history-${row.question.id}`;
  return (
    <article className={cx("actions-response-history overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900", open && "actions-response-history--open border-kc-blue-200 shadow-sm dark:border-kc-blue-800")}>
      <header className={cx("actions-response-history__header flex flex-col gap-3 p-3.5 md:flex-row md:items-center md:gap-4")}>
        <div className={cx("actions-response-history__identity flex min-w-0 flex-1 items-start gap-3")}>
          <span className={cx("actions-response-history__number grid size-10 flex-none place-items-center rounded-lg bg-kc-blue-50 text-xs font-extrabold text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")}>Q{row.question.number}</span>
          <div className={cx("grid min-w-0 gap-1")}>
            <Link className={cx("inline-flex w-fit items-center gap-1 text-xs font-extrabold text-kc-blue-800 hover:text-kc-blue-600 hover:underline dark:text-kc-blue-200 dark:hover:text-kc-blue-400")} to={requirementRoute(row.requirement)}>{row.requirement.number} · Question {row.question.number}<ArrowRight size={14} /></Link>
            <h3 className={cx("truncate text-sm text-slate-900 sm:truncate md:overflow-hidden md:text-ellipsis md:whitespace-nowrap dark:text-slate-100")}>{row.question.text}</h3>
            <span className={cx("text-xs text-slate-500 dark:text-slate-400")}>{row.requirement.sectionName} · {row.question.period}</span>
            <FrameworkBadge kind={kind} compact />
          </div>
        </div>
        <div className={cx("actions-response-history__current flex-none grid justify-items-start gap-1")}><span className={cx("text-xs font-semibold text-slate-500 dark:text-slate-400")}>Current response</span><span className={cx(responseChipClass(row.question.response))}>{responseLabel(row.question.response)}</span></div>
        <button
          type="button"
          className={cx("actions-response-history__toggle inline-flex min-w-28 min-h-9 flex-none items-center justify-between gap-2 self-start rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:not-disabled:border-kc-blue-300 hover:not-disabled:bg-kc-blue-50 hover:not-disabled:text-kc-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kc-blue-500 disabled:cursor-default disabled:border-transparent disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:not-disabled:border-kc-blue-700 dark:hover:not-disabled:bg-kc-blue-950 dark:hover:not-disabled:text-kc-blue-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-500")}
          disabled={!entries.length}
          aria-expanded={entries.length ? open : false}
          aria-controls={entries.length ? detailsId : undefined}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={cx("inline-flex items-center gap-1.5")}><Clock3 size={15} />{entries.length ? `${entries.length} ${entries.length === 1 ? "event" : "events"}` : "No history"}</span>
          {entries.length > 0 && <ChevronDown size={16} className={cx("transition-transform", open && "is-open rotate-180")} />}
        </button>
      </header>
      {entries.length === 0 && <p className={cx("actions-response-history__empty m-0 border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400")}>No response or question activity has been recorded yet.</p>}
      {open && <div id={detailsId} className={cx("actions-response-history__details border-t border-slate-200 bg-slate-50 px-3 py-3.5 md:px-4 dark:border-slate-700 dark:bg-slate-900")}><QuestionHistoryTimeline question={row.question} /></div>}
    </article>
  );
}

export function ActionsScreen() {
  const { requirements, sectionSummaries, updateQuestion } = useSites();
  const sectionKindById = useMemo(() => new Map(sectionSummaries.map((section) => [section.id, section.kind])), [sectionSummaries]);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"actions" | "history">("actions");
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [status, setStatus] = useState<"all" | "Open" | "In progress" | "Complete">("all");
  const [response, setResponse] = useState<"all" | "no" | "partial">("all");
  const [period, setPeriod] = useState<"all" | AssessmentPeriod>("all");
  const [framework, setFramework] = useState<"all" | "operating-system" | "performance-standard">("all");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyResponse, setHistoryResponse] = useState<"all" | "unanswered" | "no" | "partial" | "yes">("all");
  const [historyPeriod, setHistoryPeriod] = useState<"all" | AssessmentPeriod>("all");
  const [editing, setEditing] = useState<GapRow | null>(null);
  const [saved, setSaved] = useState(false);
  const actions = useMemo(() => requirements.filter((requirement) => requirement.response === "no" || requirement.response === "partial").map((requirement) => ({ requirement, question: requirement })), [requirements]);
  const historyRows = useMemo<QuestionHistoryRow[]>(() => requirements.map((requirement) => ({ requirement, question: requirement })), [requirements]);
  const complete = actions.filter(({ question }) => !isActionOpen(question.action)).length;
  const filtered = actions.filter(({ requirement, question }) => {
    const matchesQuery = `${requirement.number} ${requirement.title} ${question.text} ${question.action?.description ?? ""} ${question.action?.owner ?? ""} ${question.action?.followUp ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesFramework = framework === "all" || (sectionKindById.get(requirement.sectionId) ?? "operating-system") === framework;
    return matchesQuery && matchesFramework && (status === "all" || (question.action?.status ?? "Open") === status) && (response === "all" || question.response === response) && (period === "all" || question.period === period);
  });
  const filteredHistoryRows = historyRows.filter(({ requirement, question }) => {
    const matchesQuery = `${requirement.number} ${requirement.title} ${requirement.sectionName} ${question.number} ${question.text} ${(question.history ?? []).map((entry) => `${entry.event} ${entry.recordedBy}`).join(" ")}`.toLowerCase().includes(historyQuery.toLowerCase());
    const matchesResponse = historyResponse === "all" || (historyResponse === "unanswered" ? !question.response : question.response === historyResponse);
    return matchesQuery && matchesResponse && (historyPeriod === "all" || question.period === historyPeriod);
  });
  const historyEventCount = filteredHistoryRows.reduce((total, row) => total + (row.question.history?.length ?? 0), 0);
  return (
    <div className={cx(pageContainerClass, "actions-summary-page")} style={pageContainerStyle}>
      <PageHeader eyebrow="Site workspace" title="Actions summary" description="Track corrective actions and review question-level response history for your assigned site." />
      {saved && <InlineMessage tone="success" title="Corrective action saved">The Actions summary and assessment requirement are now synchronized.</InlineMessage>}
      <div className={cx("actions-summary-tabs inline-flex w-full gap-0 border-b border-slate-200 sm:w-auto sm:gap-5 dark:border-slate-700")} role="tablist" aria-label="Actions summary views">
        <button id="actions-tab" type="button" role="tab" aria-selected={activeTab === "actions"} aria-controls="actions-panel" onClick={() => setActiveTab("actions")} className={cx("inline-flex flex-1 min-h-10 cursor-pointer items-center justify-center gap-2 border-0 border-b-2 bg-transparent px-1.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kc-blue-500 sm:flex-none sm:justify-start sm:px-0", activeTab === "actions" ? "border-kc-blue-700 text-kc-blue-800 dark:border-kc-blue-400 dark:text-kc-blue-200" : "border-transparent dark:text-slate-400 dark:hover:text-slate-100")}><CircleAlert size={17} /><span>Corrective actions</span><small className={cx("inline text-xs", activeTab === "actions" ? "text-kc-blue-800 dark:text-kc-blue-200" : "text-slate-600 dark:text-slate-400")}>{actions.length}</small></button>
        <button id="response-history-tab" type="button" role="tab" aria-selected={activeTab === "history"} aria-controls="response-history-panel" onClick={() => setActiveTab("history")} className={cx("inline-flex flex-1 min-h-10 cursor-pointer items-center justify-center gap-2 border-0 border-b-2 bg-transparent px-1.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-kc-blue-500 sm:flex-none sm:justify-start sm:px-0", activeTab === "history" ? "border-kc-blue-700 text-kc-blue-800 dark:border-kc-blue-400 dark:text-kc-blue-200" : "border-transparent dark:text-slate-400 dark:hover:text-slate-100")}><Clock3 size={17} /><span>Response history</span><small className={cx("inline text-xs", activeTab === "history" ? "text-kc-blue-800 dark:text-kc-blue-200" : "text-slate-600 dark:text-slate-400")}>{historyRows.reduce((total, row) => total + (row.question.history?.length ?? 0), 0)}</small></button>
      </div>
      {activeTab === "actions" ? <div id="actions-panel" role="tabpanel" aria-labelledby="actions-tab">
        <div className={cx("metrics-grid metrics-grid--three mt-5 grid grid-cols-1 gap-4 md:grid-cols-3")}>
          <MetricCard label="Total gaps" value={actions.length} detail="No and Partial responses" icon={<CircleAlert size={21} />} tone="danger" />
          <MetricCard label="Completed actions" value={complete} detail="Marked complete by the action owner" icon={<CheckCircle2 size={21} />} tone="success" />
          <MetricCard label="Open actions" value={actions.length - complete} detail="Open or in progress" icon={<FileWarning size={21} />} tone="warning" />
        </div>
        <section className={cx("table-card", cardClass)}>
          <div className={cx("table-card__header table-card__header--results", cardHeaderClass, "items-center")}><div><p className={cx(eyebrowClasses)}>Current site</p><h2 className={cx(cardHeaderTitleClass)}>Corrective actions</h2></div><span className={cx(cardHeaderDetailClass)}>{filtered.length} of {actions.length} shown</span></div>
          <div className={cx(filterRowClass)} data-tour="actions-filters">
            <label className={cx(searchControlClass)}><Search size={17} /><input className={cx(searchInputClass)} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actions, owners, or requirements" /></label>
            <Select label="Filter action status" icon={<Filter size={17} />} value={status} onChange={(value) => setStatus(value as typeof status)} options={[{ value: "all", label: "All action states" }, { value: "Open", label: "Open" }, { value: "In progress", label: "In progress" }, { value: "Complete", label: "Complete" }]} />
            <Select label="Filter response" value={response} onChange={(value) => setResponse(value as typeof response)} options={[{ value: "all", label: "No and Partial" }, { value: "no", label: "No only" }, { value: "partial", label: "Partial only" }]} />
            <Select label="Filter framework" value={framework} onChange={(value) => setFramework(value as typeof framework)} options={[{ value: "all", label: "All frameworks" }, { value: "operating-system", label: "Operating System" }, { value: "performance-standard", label: "Performance Standard" }]} />
            <Select label="Filter assessment period" icon={<CalendarClock size={17} />} value={period} onChange={(value) => setPeriod(value as typeof period)} options={[{ value: "all", label: "All periods" }, ...assessmentPeriods.map((value) => ({ value, label: value }))]} />
          </div>
          {filtered.length ? <div className={cx("data-table-wrap w-full max-w-full")} data-tour="actions-table"><table className={cx("data-table block w-full min-w-0 table-fixed border-collapse text-sm text-slate-900 shell:table dark:text-slate-100")}>
            <thead className={cx("block sr-only shell:not-sr-only shell:table-header-group")}><tr><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Requirement</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Response</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Action description</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Owner</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Status</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Follow-up</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}><span className={cx("sr-only")}>Actions</span></th></tr></thead>
            <tbody className={cx("grid w-full min-w-0 grid-cols-1 gap-3 p-3.5 md:grid-cols-2 shell:table-row-group shell:p-0")}>{filtered.map(({ requirement, question }) => {
              const currentActionStatus = actionStatus(question.action);
              const cellClass = "data-table__cell flex min-h-12 w-full min-w-0 items-center gap-3 border-b border-slate-200 px-3.5 py-3 text-left align-middle wrap-anywhere dark:border-slate-700 shell:table-cell shell:min-h-0 shell:px-4";
              const cellLabelClass = "w-29 flex-none text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 shell:hidden";
              const lastCellClass = "data-table__cell flex min-h-11 w-full min-w-0 items-center justify-end bg-slate-50 px-3.5 py-3 text-left align-middle wrap-anywhere dark:bg-slate-900 shell:table-cell shell:min-h-0 shell:justify-normal shell:bg-transparent shell:px-4";
              return <tr className={cx("block w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-900 shell:table-row shell:rounded-none shell:border-0 shell:bg-transparent shell:shadow-none")} key={question.id}>
                <td className={cellClass} data-label="Requirement"><span className={cx(cellLabelClass)}>Requirement</span><span className={cx("min-w-0")}><strong className={cx("block")}>{requirement.number} · Question {question.number}</strong><span className={cx("mt-1 block text-xs text-slate-500 dark:text-slate-400")}>{requirement.title}</span><span className="mt-1.5 block"><FrameworkBadge kind={sectionKindById.get(requirement.sectionId) ?? "operating-system"} compact /></span></span></td>
                <td className={cellClass} data-label="Response"><span className={cx(cellLabelClass)}>Response</span><span className={cx(responseChipClass(question.response))}>{question.response === "no" ? "No" : "Partial"}</span></td>
                <td className={cellClass} data-label="Action"><span className={cx(cellLabelClass)}>Action</span>{question.action?.description || <span className={cx(missingValueClass)}>Description not added</span>}</td>
                <td className={cellClass} data-label="Owner"><span className={cx(cellLabelClass)}>Owner</span>{question.action?.owner ? <span className={cx("person-inline inline-flex items-center gap-2 whitespace-nowrap text-slate-700 dark:text-slate-300")}><span className={cx(avatarTinyClass)}>{question.action.owner.split(" ").map((part) => part[0]).join("")}</span>{question.action.owner}</span> : <span className={cx(missingValueClass)}>Owner not assigned</span>}</td>
                <td className={cellClass} data-label="Status"><span className={cx(cellLabelClass)}>Status</span><span className={cx("detail-status inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-bold", currentActionStatus === "Complete" ? "detail-status--complete bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "detail-status--missing bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300")}>{currentActionStatus}</span></td>
                <td className={cellClass} data-label="Follow-up"><span className={cx(cellLabelClass)}>Follow-up</span>{question.action?.followUp || <span className={cx(missingValueClass)}>No follow-up added</span>}</td>
                <td className={lastCellClass} data-label=""><div className={cx("table-row-actions flex items-center gap-0.5")}><Button variant="tertiary" size="compact" icon={<Pencil size={15} />} onClick={() => setEditing({ requirement, question })}>Edit</Button><Link className={cx("table-action inline-grid size-9 place-items-center rounded-md text-kc-blue-700 hover:bg-kc-blue-50 dark:text-kc-blue-300 dark:hover:bg-kc-blue-950")} to={requirementRoute(requirement)} aria-label={`Open ${requirement.title}`}><ChevronRight size={18} /></Link></div></td>
              </tr>;
            })}</tbody>
          </table></div> : <EmptyState icon={<Search size={25} />} title="No actions match" description="Clear a filter or search for another requirement." />}
        </section>
      </div> : <section id="response-history-panel" role="tabpanel" aria-labelledby="response-history-tab" className={cx("table-card actions-response-history-panel overflow-hidden", cardClass)}>
        <div className={cx("table-card__header table-card__header--results", cardHeaderClass, "items-center")}><div><p className={cx(eyebrowClasses)}>Current site</p><h2 className={cx(cardHeaderTitleClass)}>Question response history</h2></div><span className={cx(cardHeaderDetailClass)}>{filteredHistoryRows.length} of {historyRows.length} questions · {historyEventCount} recorded events</span></div>
        <div className={cx(filterRowClass, "actions-response-history__filters")}>
          <label className={cx(searchControlClass)}><Search size={17} /><input className={cx(searchInputClass)} value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} placeholder="Search requirement, question, or contributor" /></label>
          <Select label="Filter current response" value={historyResponse} onChange={(value) => setHistoryResponse(value as typeof historyResponse)} options={[{ value: "all", label: "All responses" }, { value: "unanswered", label: "Not answered" }, { value: "no", label: "No" }, { value: "partial", label: "Partial" }, { value: "yes", label: "Yes" }]} />
          <Select label="Filter assessment period" icon={<CalendarClock size={17} />} value={historyPeriod} onChange={(value) => setHistoryPeriod(value as typeof historyPeriod)} options={[{ value: "all", label: "All periods" }, ...assessmentPeriods.map((value) => ({ value, label: value }))]} />
        </div>
        {filteredHistoryRows.length ? <div className={cx("actions-response-history-list grid gap-3 p-4")}>{filteredHistoryRows.map((row) => <QuestionHistoryCard key={row.question.id} row={row} kind={sectionKindById.get(row.requirement.sectionId) ?? "operating-system"} />)}</div> : <EmptyState icon={<Search size={25} />} title="No questions match" description="Clear a filter or search for another requirement or question." />}
      </section>}
      {editing && <ActionDialog row={editing} onClose={() => setEditing(null)} onSave={(action) => {
        updateQuestion(editing.requirement.id, { action }, user?.name);
        setEditing(null); setSaved(true);
      }} />}
    </div>
  );
}
