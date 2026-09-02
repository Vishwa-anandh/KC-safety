import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileWarning,
  Filter,
  Mail,
  MapPin,
  Paperclip,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSites } from "../model/useSites";
import { useAuth } from "../../auth";
import { actionComplete, assessmentPeriods, responseLabel } from "../../../shared/domain/assessment";
import { requirementRoute } from "../../../app/router/links";
import type { ActionItem, AssessmentPeriod, AssessmentQuestion, OwnerRecord, Requirement, SectionSummary, SiteContacts } from "../../../shared/types";
import { Button, EmptyState, eyebrowClasses, IconButton, InlineMessage, MetricCard, PageHeader, PerformanceBadge, ProgressBar, SaveStatus, Select } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/* Every page in this file shares the same outer shell. Padding-inline stays a CSS var (a fluid
   clamp() the Tailwind spacing scale cannot express); text colour is set here so every plain,
   unstyled heading/paragraph nested below inherits a readable colour in dark mode too. */
const pageContainerStyle = { paddingInline: "var(--page-gutter)" } as const;
const pageContainerClass = "page-container w-full pt-5 pb-14 text-slate-900 md:pt-8 md:pb-16 dark:text-slate-100";

const pageSectionClass = "page-section mt-9";
const sectionTitleRowClass = "section-title-row mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end";
const sectionCardGridClass = "section-card-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3";
const metricsGridClass = "metrics-grid mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 wide:grid-cols-4";

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

function SiteContextCard({ updated }: { updated?: string }) {
  const { assignedSite } = useSites();
  const updatedLabel = updated
    ? new Date(updated).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : assignedSite.updated;
  return (
    <section className={cx("site-identity-card relative mb-5 flex flex-wrap items-start gap-4 overflow-hidden rounded-2xl border border-kc-blue-200 bg-gradient-to-br from-kc-blue-50 to-white p-4 md:flex-nowrap md:items-center md:p-5 dark:border-kc-blue-800 dark:from-kc-blue-950 dark:to-slate-900")} style={{ boxShadow: "var(--shadow-1)" }} data-tour="site-context">
      <div className={cx("site-identity-card__mark grid size-12 flex-none place-items-center rounded-2xl bg-kc-blue-600 text-white shadow-md md:size-13")}><Building2 size={27} /></div>
      <div className={cx("site-identity-card__copy min-w-0 flex-1")}>
        <p className={cx(eyebrowClasses)}>Assigned site</p>
        <h2 className={cx("mt-1 text-xl font-bold text-slate-900 dark:text-slate-100")}>{assignedSite.name}</h2>
        <div className={cx("mt-2 grid gap-1.5 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-2")}>
          <span className={cx("inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400")}><ShieldCheck size={15} /> {assignedSite.code}</span>
          <span className={cx("inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400")}><MapPin size={15} /> {assignedSite.region} · {assignedSite.segment}</span>
          <span className={cx("inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400")}><CalendarClock size={15} /> Updated {updatedLabel}</span>
        </div>
      </div>
      <span className={cx("fixed-context-badge w-full rounded-full border border-kc-blue-200 bg-white px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-kc-blue-800 md:w-auto dark:border-kc-blue-800 dark:bg-slate-900 dark:text-kc-blue-200")}>Current site</span>
    </section>
  );
}

function SectionCard({ section, requirement }: { section: SectionSummary; requirement?: Requirement }) {
  const content = (
    <article className={cx("section-card flex min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition duration-150 hover:border-kc-blue-300 hover:-translate-y-0.5 hover:shadow-lg md:min-h-67 dark:border-slate-700 dark:bg-slate-900")}>
      <div className={cx("section-card__top flex items-center justify-between")}>
        <span className={cx("section-card__icon grid size-10 place-items-center rounded-xl bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300")}>{section.kind === "operating-system" ? <ClipboardCheck size={21} /> : <ShieldCheck size={21} />}</span>
        <PerformanceBadge performance={section.performance} compact />
      </div>
      <div className={cx("section-card__body my-4 flex-1")}>
        <p className={cx(eyebrowClasses)}>{section.kind === "operating-system" ? "Operating System" : "Performance Standard"}</p>
        <h3 className={cx("mt-1 mb-1.5 text-lg font-bold text-slate-900 dark:text-slate-100")}>{section.name}</h3>
        <p className={cx("text-sm leading-snug text-slate-600 dark:text-slate-400")}>{section.description}</p>
      </div>
      <ProgressBar value={section.completion} label="Completion" />
      <div className={cx("section-card__footer mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400")}><span>{section.questions} questions</span><span>{section.gaps} gaps</span><ChevronRight size={18} className={cx("ml-auto text-kc-blue-700 dark:text-kc-blue-300")} /></div>
    </article>
  );
  return requirement ? <Link className={cx("card-link block rounded-lg")} to={requirementRoute(requirement)}>{content}</Link> : content;
}

export function OverviewScreen() {
  const { requirements, sectionSummaries, overallCompletion, overallPerformance, gapCount, missingActionCount, lastUpdated } = useSites();
  const operating = sectionSummaries.filter((section) => section.kind === "operating-system");
  const allQuestions = requirements.flatMap((requirement) => requirement.questions);
  const completeQuestions = allQuestions.filter((question) => actionComplete(question.response, question.action)).length;
  const nextRequirement = requirements.find((requirement) => requirement.questions.some((question) => !actionComplete(question.response, question.action))) ?? requirements[0];
  const nextRoute = nextRequirement ? requirementRoute(nextRequirement) : "/assessment";
  const nextCopy = missingActionCount > 0 ? "Complete corrective-action details" : "Continue unanswered assessment questions";

  return (
    <div className={cx(pageContainerClass)} style={pageContainerStyle}>
      <PageHeader eyebrow="Site workspace" title="Assessment overview" description="Review current completion, performance, and the next work needed for your assigned site." actions={<Link className={cx(primaryLinkButtonClass)} to={nextRoute} data-tour="continue-assessment"><span>Continue assessment</span><ArrowRight size={18} /></Link>} />
      <SiteContextCard updated={lastUpdated} />
      <div className={cx(metricsGridClass)}>
        <MetricCard label="Assessment completion" value={`${overallCompletion}%`} detail={`${completeQuestions} of ${allQuestions.length} questions complete`} icon={<Target size={21} />} tone="brand" />
        <MetricCard label="Current self-assessed performance level" value={<span className={cx("metric-with-badge inline-flex min-h-8 items-center")}><PerformanceBadge performance={overallPerformance} /></span>} detail="Lowest roll-up across assessed sections" icon={<BarChart3 size={21} />} tone={overallPerformance === "performing" ? "success" : "danger"} />
        <MetricCard label="Gaps requiring action" value={gapCount} detail={`${missingActionCount} actions are missing information`} icon={<FileWarning size={21} />} tone="warning" />
        <MetricCard label="Last activity" value={new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} detail="Changes saved for the current site" icon={<Activity size={21} />} />
      </div>
      <div className={cx("overview-callout mt-5 flex flex-wrap items-center gap-4 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 md:flex-nowrap dark:border-amber-800 dark:from-amber-950 dark:to-slate-900")}>
        <div className={cx("overview-callout__icon grid size-11 flex-none place-items-center rounded-xl bg-white text-amber-700 dark:bg-slate-900 dark:text-amber-300")}><CircleAlert size={23} /></div>
        <div className={cx("min-w-0 flex-1")}><p className={cx(eyebrowClasses)}>Recommended next step</p><h2 className={cx("mt-1 mb-1 text-lg font-bold text-slate-900 dark:text-slate-100")}>{nextCopy}</h2><p className={cx("text-sm text-slate-600 dark:text-slate-400")}>{missingActionCount > 0 ? `${missingActionCount} No or Partial responses still need a complete description and owner.` : "Open the next requirement with unanswered questions and continue the assessment."}</p></div>
        <Link className={cx(primaryLinkButtonClass, "w-full md:w-auto")} to={nextRoute}><span>Review requirement</span><ArrowRight size={18} /></Link>
      </div>
      <section className={cx(pageSectionClass)}>
        <div className={cx(sectionTitleRowClass)}><div><p className={cx(eyebrowClasses)}>Six Operating System sections</p><h2 className={cx("mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100")}>Assessment progress</h2></div><Link className={cx("text-link inline-flex items-center gap-1.5 text-sm font-semibold text-kc-blue-700 hover:text-kc-blue-900 hover:underline hover:underline-offset-4 dark:text-kc-blue-300 dark:hover:text-kc-blue-100")} to="/assessment">View full assessment <ArrowRight size={16} /></Link></div>
        <div className={cx(sectionCardGridClass)}>{operating.map((section) => <SectionCard section={section} requirement={requirements.find((item) => item.sectionId === section.id)} key={section.id} />)}</div>
      </section>
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
  const next = requirements.find((requirement) => requirement.questions.some((question) => !actionComplete(question.response, question.action))) ?? requirements[0];
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

interface GapRow { requirement: Requirement; question: AssessmentQuestion }

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

interface QuestionHistoryRow { requirement: Requirement; question: AssessmentQuestion }

function QuestionHistoryTimeline({ question }: { question: AssessmentQuestion }) {
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
            <div className={cx("response-history__evidence mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400")}><Paperclip size={14} /><span>{entry.evidence.length} evidence {entry.evidence.length === 1 ? "item" : "items"} at this point</span>{entry.evidence.length > 0 && <ul className={cx("mt-1 ml-5 basis-full")}>{entry.evidence.map((item) => <li key={item.id}>{item.title}</li>)}</ul>}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function QuestionHistoryCard({ row }: { row: QuestionHistoryRow }) {
  const [open, setOpen] = useState(false);
  const entries = [...(row.question.history ?? [])].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  const detailsId = `site-question-history-${row.question.id}`;
  return (
    <article className={cx("actions-response-history overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900", open && "actions-response-history--open border-kc-blue-200 shadow-sm dark:border-kc-blue-800")}>
      <header className={cx("actions-response-history__header flex flex-col gap-3 p-3.5 md:flex-row md:items-center md:gap-4")}>
        <div className={cx("actions-response-history__identity flex min-w-0 flex-1 items-start gap-3")}>
          <span className={cx("actions-response-history__number grid size-10 flex-none place-items-center rounded-lg bg-kc-blue-50 text-xs font-extrabold text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")}>Q{row.question.number}</span>
          <div className={cx("grid min-w-0 gap-0.5")}>
            <Link className={cx("inline-flex w-fit items-center gap-1 text-xs font-extrabold text-kc-blue-800 hover:text-kc-blue-600 hover:underline dark:text-kc-blue-200 dark:hover:text-kc-blue-400")} to={requirementRoute(row.requirement)}>{row.requirement.number} · Question {row.question.number}<ArrowRight size={14} /></Link>
            <h3 className={cx("truncate text-sm text-slate-900 sm:truncate md:overflow-hidden md:text-ellipsis md:whitespace-nowrap dark:text-slate-100")}>{row.question.text}</h3>
            <span className={cx("text-xs text-slate-500 dark:text-slate-400")}>{row.requirement.sectionName} · {row.question.period}</span>
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
  const { requirements, updateQuestion } = useSites();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"actions" | "history">("actions");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "Open" | "In progress" | "Complete">("all");
  const [response, setResponse] = useState<"all" | "no" | "partial">("all");
  const [period, setPeriod] = useState<"all" | AssessmentPeriod>("all");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyResponse, setHistoryResponse] = useState<"all" | "unanswered" | "no" | "partial" | "yes">("all");
  const [historyPeriod, setHistoryPeriod] = useState<"all" | AssessmentPeriod>("all");
  const [editing, setEditing] = useState<GapRow | null>(null);
  const [saved, setSaved] = useState(false);
  const actions = useMemo(() => requirements.flatMap((requirement) => requirement.questions.filter((question) => question.response === "no" || question.response === "partial").map((question) => ({ requirement, question }))), [requirements]);
  const historyRows = useMemo<QuestionHistoryRow[]>(() => requirements.flatMap((requirement) => requirement.questions.map((question) => ({ requirement, question }))), [requirements]);
  const complete = actions.filter(({ question }) => (question.action?.status ?? "Open") === "Complete").length;
  const filtered = actions.filter(({ requirement, question }) => {
    const matchesQuery = `${requirement.number} ${requirement.title} ${question.text} ${question.action?.description ?? ""} ${question.action?.owner ?? ""} ${question.action?.followUp ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || (question.action?.status ?? "Open") === status) && (response === "all" || question.response === response) && (period === "all" || question.period === period);
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
            <Select label="Filter assessment period" icon={<CalendarClock size={17} />} value={period} onChange={(value) => setPeriod(value as typeof period)} options={[{ value: "all", label: "All periods" }, ...assessmentPeriods.map((value) => ({ value, label: value }))]} />
          </div>
          {filtered.length ? <div className={cx("data-table-wrap w-full max-w-full")} data-tour="actions-table"><table className={cx("data-table block w-full min-w-0 table-fixed border-collapse text-sm text-slate-900 shell:table dark:text-slate-100")}>
            <thead className={cx("block sr-only shell:not-sr-only shell:table-header-group")}><tr><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Requirement</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Response</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Action description</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Owner</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Status</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>Follow-up</th><th className={cx("border-b border-slate-200 bg-slate-50 px-4 py-3 text-left align-middle text-xs font-bold tracking-wide wrap-anywhere text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}><span className={cx("sr-only")}>Actions</span></th></tr></thead>
            <tbody className={cx("grid w-full min-w-0 grid-cols-1 gap-3 p-3.5 md:grid-cols-2 shell:table-row-group shell:p-0")}>{filtered.map(({ requirement, question }) => {
              const actionStatus = question.action?.status ?? "Open";
              const cellClass = "data-table__cell flex min-h-12 w-full min-w-0 items-center gap-3 border-b border-slate-200 px-3.5 py-3 text-left align-middle wrap-anywhere dark:border-slate-700 shell:table-cell shell:min-h-0 shell:px-4";
              const cellLabelClass = "w-29 flex-none text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 shell:hidden";
              const lastCellClass = "data-table__cell flex min-h-11 w-full min-w-0 items-center justify-end bg-slate-50 px-3.5 py-3 text-left align-middle wrap-anywhere dark:bg-slate-900 shell:table-cell shell:min-h-0 shell:justify-normal shell:bg-transparent shell:px-4";
              return <tr className={cx("block w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-900 shell:table-row shell:rounded-none shell:border-0 shell:bg-transparent shell:shadow-none")} key={question.id}>
                <td className={cellClass} data-label="Requirement"><span className={cx(cellLabelClass)}>Requirement</span><span className={cx("min-w-0")}><strong className={cx("block")}>{requirement.number} · Question {question.number}</strong><span className={cx("mt-1 block text-xs text-slate-500 dark:text-slate-400")}>{requirement.title}</span></span></td>
                <td className={cellClass} data-label="Response"><span className={cx(cellLabelClass)}>Response</span><span className={cx(responseChipClass(question.response))}>{question.response === "no" ? "No" : "Partial"}</span></td>
                <td className={cellClass} data-label="Action"><span className={cx(cellLabelClass)}>Action</span>{question.action?.description || <span className={cx(missingValueClass)}>Description not added</span>}</td>
                <td className={cellClass} data-label="Owner"><span className={cx(cellLabelClass)}>Owner</span>{question.action?.owner ? <span className={cx("person-inline inline-flex items-center gap-2 whitespace-nowrap text-slate-700 dark:text-slate-300")}><span className={cx(avatarTinyClass)}>{question.action.owner.split(" ").map((part) => part[0]).join("")}</span>{question.action.owner}</span> : <span className={cx(missingValueClass)}>Owner not assigned</span>}</td>
                <td className={cellClass} data-label="Status"><span className={cx(cellLabelClass)}>Status</span><span className={cx("detail-status inline-flex items-center rounded-full px-2.5 py-1.5 text-xs font-bold", actionStatus === "Complete" ? "detail-status--complete bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "detail-status--missing bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300")}>{actionStatus}</span></td>
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
        {filteredHistoryRows.length ? <div className={cx("actions-response-history-list grid gap-3 p-4")}>{filteredHistoryRows.map((row) => <QuestionHistoryCard key={row.question.id} row={row} />)}</div> : <EmptyState icon={<Search size={25} />} title="No questions match" description="Clear a filter or search for another requirement or question." />}
      </section>}
      {editing && <ActionDialog row={editing} onClose={() => setEditing(null)} onSave={(action) => {
        updateQuestion(editing.requirement.id, editing.question.id, { action }, user?.name);
        setEditing(null); setSaved(true);
      }} />}
    </div>
  );
}
