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
import { Button, CompletionBadge, EmptyState, InlineMessage, MetricCard, PageHeader, PerformanceBadge, ProgressBar, Select } from "../../../shared/ui/UI";
import { ContactsPanel, SiteUsersPanel } from "../../sites/components/SitePanels";
import { cx } from "../../../shared/utils";

function DistributionBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  return <div className="distribution-row"><div className="distribution-row__label"><span>{label}</span><strong>{value}</strong></div><div className="distribution-track"><span className={`distribution-fill distribution-fill--${tone}`} style={{ width: `${total ? (value / total) * 100 : 0}%` }} /></div></div>;
}

function QuestionResponseHistory({ question }: { question: AssessmentQuestion }) {
  const [open, setOpen] = useState(false);
  const entries = [...(question.history ?? [])].sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  if (!entries.length) return null;
  return <div className="response-history">
    <button type="button" className="response-history__trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span><Clock3 size={16} /> Response history</span><span>{entries.length} {entries.length === 1 ? "entry" : "entries"}<ChevronDown size={16} className={cx(open && "response-history__chevron--open")} /></span></button>
    {open && <ol className="response-history__timeline">{entries.map((entry, index) => <li key={entry.id} className="response-history__entry">
      <span className="response-history__marker" />
      <div className="response-history__entry-card">
        <div className="response-history__entry-header"><div><strong>{entry.event}</strong><span>{entry.recordedBy} · {new Date(entry.recordedAt).toLocaleString()}</span></div>{index === 0 && <span className="publish-badge">Latest</span>}</div>
        <div className="response-history__response"><span>Response</span><span className={cx("response-chip", `response-chip--${entry.response ?? "none"}`)}>{responseLabel(entry.response)}</span></div>
        {entry.action && <div className="response-history__action"><strong>Corrective action</strong><p>{entry.action.description || "No action description added."}</p><div><span>Owner · {entry.action.owner || "Not assigned"}</span><span>Status · {entry.action.status ?? "Open"}</span><span>Follow-up · {entry.action.followUp || "Not added"}</span></div></div>}
        <div className="response-history__evidence"><Paperclip size={14} /><span>{entry.evidence.length} evidence {entry.evidence.length === 1 ? "item" : "items"} at this point</span>{entry.evidence.length > 0 && <ul>{entry.evidence.map((item) => <li key={item.id}>{item.title}</li>)}</ul>}</div>
      </div>
    </li>)}</ol>}
  </div>;
}

function DashboardTable({ sites }: { sites: DashboardSite[] }) {
  const navigate = useNavigate();
  return <div className="data-table-wrap" data-tour="dashboard-sites"><table className="data-table dashboard-table"><thead><tr><th>Site</th><th>Region / segment</th><th>Completion</th><th>Self-assessed performance</th><th>Gaps</th><th>Last updated</th><th><span className="sr-only">View</span></th></tr></thead><tbody>{sites.map((site) => (
    <tr key={site.id} className="data-table__row--link" onClick={() => navigate(`/sites/${site.id}`)}><td data-label="Site"><strong>{site.name}</strong><span>{site.code}</span></td><td data-label="Region / segment"><strong>{site.region}</strong><span>{site.segment}</span></td><td data-label="Completion"><div className="table-completion"><CompletionBadge value={site.completion} /><span className="table-progress"><span style={{ width: `${site.completion}%` }} /></span></div></td><td data-label="Self-assessed performance"><PerformanceBadge performance={site.performance} compact /></td><td data-label="Gaps"><span className={cx("gap-count", site.gaps > 20 && "gap-count--high")}>{site.gaps}</span></td><td data-label="Last updated">{site.updated}</td><td data-label=""><Link className="table-action" to={`/sites/${site.id}`} aria-label={`View ${site.name}`}><ChevronRight size={18} /></Link></td></tr>
  ))}</tbody></table></div>;
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
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
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
  function exportDashboard() { downloadSiteExport(sites, `Maitsys_Assure_dashboard_${new Date().toISOString().slice(0, 10)}.csv`, focus, user?.role === "administrator" ? requirements : [], user?.role === "administrator" ? assignedSite : undefined); setExported(true); window.setTimeout(() => setExported(false), 2600); }

  return (
    <div className="page-container">
      <PageHeader eyebrow="Enterprise oversight" title="Maitsys Assure dashboard" description="Track completion and self-assessed performance across the sites in your authorized scope." actions={<Button variant="primary" icon={<ArrowDownToLine size={18} />} onClick={exportDashboard} disabled={!sites.length} data-tour="dashboard-export">Export to Excel</Button>} />
      {exported && <InlineMessage className="floating-feedback" tone="success" title="Export downloaded">The current filtered site view{user?.role === "administrator" ? " and question-level evidence register" : ""} were downloaded and can be opened in Excel.</InlineMessage>}
      <div className="dashboard-summary">
        <div className="metrics-grid metrics-grid--2x2">
          <MetricCard label="Sites in scope" value={total} detail={`Across ${regions.length} regions`} icon={<MapPin size={21} />} tone="brand" />
          <MetricCard label="Assessment complete" value={`${Math.round((complete / total) * 100)}%`} detail={`${complete} of ${total} sites`} icon={<CheckCircle2 size={21} />} tone="success" />
          <MetricCard label="Average completion" value={`${average}%`} detail="Completion only—not performance" icon={<Target size={21} />} tone="brand" />
          <MetricCard label="Sites at Initial" value={initialSites} detail="Prioritize leadership review" icon={<CircleAlert size={21} />} tone="danger" />
        </div>
        <div className="dashboard-insights">
          <section className="insight-card"><div className="insight-card__header"><div><p className="eyebrow">Completion</p><h2>Assessment status</h2></div><Clock3 size={21} /></div><DistributionBar label="Complete" value={complete} total={total} tone="success" /><DistributionBar label="In progress" value={inProgress} total={total} tone="brand" /><DistributionBar label="Not started" value={notStarted} total={total} tone="neutral" /></section>
        </div>
      </div>
      <section className="table-card">
        <div className="dashboard-filter-bar dashboard-filter-bar--expanded" data-tour="dashboard-filters">
          <label className="search-control"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search site name or code" /></label>
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
            className="select-control--focus"
            label="Assessment area"
            value={focus}
            onChange={setFocus}
            options={["All assessment areas", ...sectionSummaries.map((section) => section.name)].map((value) => ({ value, label: value }))}
          />
          <Button variant="tertiary" icon={<FilterX size={17} />} onClick={reset}>Reset</Button>
        </div>
        {activeFilters.length > 0 && <div className="active-filter-row"><span>Active view</span>{activeFilters.map((filter) => <span className="filter-chip" key={filter}>{filter}</span>)}<button onClick={reset}>Clear all</button></div>}
        <div className="table-card__header table-card__header--results"><div><p className="eyebrow">Authorized scope</p><h2>Sites</h2></div><span>Showing {sites.length} of {total} sites</span></div>
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
      <div className="page-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/dashboard">Dashboard</Link><ChevronRight size={15} /><Link to={`/sites/${site.id}`}>{site.name}</Link><ChevronRight size={15} /><span aria-current="page">Section</span></nav>
        <EmptyState icon={<Search size={27} />} title="Section not found" description="This assessment section is not part of the current site's framework." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link><ChevronRight size={15} />
        <Link to={`/sites/${site.id}`}>{site.name}</Link><ChevronRight size={15} />
        <span aria-current="page">{section.shortName}</span>
      </nav>
      <PageHeader eyebrow="Assessment detail" title={section.name} description={`${site.code} · ${section.description}`} />
      <InlineMessage tone="info" title="Read-only site record">This view is available within your enterprise scope. Only the currently assigned site can be edited.</InlineMessage>
      <div className="metrics-grid">
        <MetricCard label="Completion" value={`${section.completion}%`} detail="Section completion" icon={<Target size={21} />} tone="brand" />
        <MetricCard label="Performance" value={performanceLabel(section.performance)} detail="Lowest question level" icon={<BarChart3 size={21} />} tone={section.performance === "performing" ? "success" : section.performance === "emerging" ? "warning" : "danger"} />
        <MetricCard label="Questions" value={section.questions} detail="In this section" icon={<CheckCircle2 size={21} />} />
        <MetricCard label="Gaps" value={section.gaps} detail="No and Partial responses" icon={<CircleAlert size={21} />} tone="danger" />
      </div>
      <section className="page-section" aria-labelledby="site-questions-title">
        <div className="section-title-row"><div><p className="eyebrow">Assessment questions</p><h2 id="site-questions-title">Recorded responses</h2></div>{requirement && <span className="question-count">{requirement.questions.length} questions</span>}</div>
        {requirement ? (
          <div className="question-list">
            {requirement.questions.map((question) => (
              <article className="question-card" key={question.id}>
                <div className="question-card__header">
                  <span className="question-number">{question.number}</span>
                  <div><p>Question {question.number}</p><h3>{question.text}</h3></div>
                  <PerformanceBadge performance={performanceForResponse(question.response)} compact />
                </div>
                {Boolean(question.expectedEvidence?.length) && (
                  <div className="question-evidence">
                    <span className="question-evidence__title"><Paperclip size={14} /> Evidence required</span>
                    <ul>{question.expectedEvidence!.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                )}
                <div className="readonly-response">
                  <span>Response</span>
                  <span className={cx("response-chip", `response-chip--${question.response ?? "none"}`)}>{responseLabel(question.response)}</span>
                  {question.response && <small>Recorded by {question.respondedBy ?? question.action?.createdBy ?? "Site contributor"}{question.respondedAt ? ` · ${new Date(question.respondedAt).toLocaleString()}` : ""}</small>}
                </div>
                {question.action && (
                  <div className="readonly-action">
                    <p className="eyebrow">Corrective action · {question.action.createdBy ?? "Site contributor"}</p>
                    <p>{question.action.description || "No action description added yet."}</p>
                    <div className="readonly-action__details"><span>Owner · {question.action.owner || "Not assigned"}</span><span>Status · {question.action.status ?? "Open"}</span><span>Follow-up · {question.action.followUp || "Not added"}</span><span>Updated by {question.action.updatedBy ?? question.action.createdBy ?? "Site contributor"}{question.action.updatedAt ? ` · ${new Date(question.action.updatedAt).toLocaleString()}` : ""}</span></div>
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
    <div className="page-container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/dashboard">Dashboard</Link><ChevronRight size={15} /><span aria-current="page">{site.name}</span></nav>
      <PageHeader
        eyebrow="Site assessment"
        title={site.name}
        description={`${site.code} · ${site.region} · ${site.segment}`}
        actions={<>{role === "administrator" && <Link className="button button--tertiary button--default" to={`/admin/sites/${site.id}`}><UsersRound size={18} /><span>Manage site</span></Link>}<Button variant="secondary" icon={<ArrowDownToLine size={18} />} onClick={() => downloadSiteExport([site], `Maitsys_Assure_${site.code}_assessment.csv`)}>Export assessment</Button></>}
      />

      <section className="site-assessment-hero" aria-labelledby="assessment-snapshot-title">
        <div className="site-assessment-hero__overview">
          <div className="site-assessment-hero__score" aria-label={`${site.completion}% assessment completion`}><strong>{site.completion}</strong><span>%</span></div>
          <div className="site-assessment-hero__copy">
            <p className="eyebrow">Assessment snapshot</p>
            <h2 id="assessment-snapshot-title">{assessmentState}</h2>
            <p>{responsesRecorded} of {totalQuestions} assessment questions have a recorded response.</p>
            <ProgressBar value={site.completion} />
          </div>
        </div>
        <div className="site-assessment-hero__facts" aria-label="Assessment summary">
          <div><span>Self-assessed performance</span><PerformanceBadge performance={site.performance} /></div>
          <div><span>Open gaps</span><strong className={cx(site.gaps > 0 && "text-danger")}>{site.gaps}</strong><small>No and Partial responses</small></div>
          <div><span>Last updated</span><strong>{site.updated}</strong><small>Current assessment record</small></div>
        </div>
        {prioritySection && <div className="site-assessment-priority">
          <div><span className="site-assessment-priority__icon"><CircleAlert size={19} /></span><div><p className="eyebrow">Priority review</p><strong>{prioritySection.name}</strong><span>{prioritySection.gaps} {prioritySection.gaps === 1 ? "gap" : "gaps"} · {prioritySection.completion}% complete</span></div></div>
          <Link className="button button--primary button--compact" to={sectionRoute(prioritySection)}><span>Review details</span><ArrowRight size={16} /></Link>
        </div>}
      </section>

      <section className="table-card site-assessment-sections" aria-labelledby="assessment-sections-title">
        <div className="table-card__header site-assessment-sections__header">
          <div><p className="eyebrow">Assessment details</p><h2 id="assessment-sections-title">Assessment areas</h2><span>Review completion, performance, and gaps before opening question-level details.</span></div>
          <div className="site-section-filters" role="group" aria-label="Filter assessment areas">
            <button type="button" className={cx(sectionFilter === "all" && "is-active")} aria-pressed={sectionFilter === "all"} onClick={() => setSectionFilter("all")}>All <span>{assessmentSections.length}</span></button>
            <button type="button" className={cx(sectionFilter === "attention" && "is-active")} aria-pressed={sectionFilter === "attention"} onClick={() => setSectionFilter("attention")}>Needs attention <span>{needsAttention.length}</span></button>
            <button type="button" className={cx(sectionFilter === "complete" && "is-active")} aria-pressed={sectionFilter === "complete"} onClick={() => setSectionFilter("complete")}>Complete <span>{completeSections.length}</span></button>
          </div>
        </div>
        {visibleSections.length ? <><div className="site-assessment-area-columns" aria-hidden="true"><span>Assessment area</span><span>Completion</span><span>Performance</span><span>Open gaps</span><span>Action</span></div><div className="site-assessment-area-list" data-tour="drilldown-sections">{visibleSections.map((section) => {
          const sectionNumber = assessmentSections.findIndex((item) => item.id === section.id) + 1;
          return <article key={section.id} className="site-assessment-area-row">
            <div className="site-assessment-area-row__identity"><span className="section-index" aria-hidden="true">{String(sectionNumber).padStart(2, "0")}</span><div><span className="site-assessment-area-row__kind">{section.kind === "operating-system" ? "Operating System" : "Performance Standard"}</span><strong>{section.name}</strong><span>{section.questions} assessment questions</span></div></div>
            <div className="site-assessment-area-row__completion">
              <span className="site-assessment-area-row__label">Completion</span>
              <div className="site-assessment-area-row__meter"><span className="site-assessment-area-row__track" role="progressbar" aria-label={`${section.name} completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={section.completion}><span style={{ width: `${section.completion}%` }} /></span><strong>{section.completion}%</strong></div>
            </div>
            <div className="site-assessment-area-row__result"><span className="site-assessment-area-row__label">Performance</span><PerformanceBadge performance={section.performance} compact /></div>
            <div className="site-assessment-area-row__result site-assessment-area-row__gaps"><span className="site-assessment-area-row__label">Open gaps</span><strong className={cx(section.gaps > 0 && "text-danger")}>{section.gaps}</strong><small>{section.gaps > 0 ? "Needs attention" : section.completion === 100 ? "Complete" : "No gaps recorded"}</small></div>
            <Link className="button button--tertiary button--compact" to={sectionRoute(section)}><span>{canEditAssignedSite ? "Open assessment" : "Review details"}</span><ArrowRight size={16} /></Link>
          </article>;
        })}</div></> : <EmptyState icon={<CheckCircle2 size={27} />} title="No assessment areas in this view" description="Choose another filter to review the site's assessment areas." />}
      </section>

      <details className="site-support-details">
        <summary><span><UsersRound size={20} /><span><strong>Site people and contacts</strong><small>Secondary site context · {assignedUsers.length} assigned {assignedUsers.length === 1 ? "user" : "users"}</small></span></span><ChevronDown size={19} /></summary>
        <div className="site-support-details__content">
          <section aria-labelledby="site-users-title"><div className="section-title-row"><div><p className="eyebrow">Read-only</p><h2 id="site-users-title">Assigned users</h2></div><span>{assignedUsers.length} assigned</span></div><SiteUsersPanel users={assignedUsers} /></section>
          <section aria-labelledby="site-contacts-title"><div className="section-title-row"><div><p className="eyebrow">Read-only</p><h2 id="site-contacts-title">Site contacts</h2></div></div><ContactsPanel contacts={hasRealContacts ? siteContacts : null} /></section>
        </div>
      </details>
    </div>
  );
}
