import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilterX,

  MapPin,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { requirementRoute, useAppState } from "../AppState";
import { useGuidedSetup } from "../GuidedSetup";
import { performanceForResponse, performanceLabel, responseLabel, sections as seedSections } from "../data";
import type { DashboardSite, Performance } from "../types";
import { Button, CompletionBadge, EmptyState, InlineMessage, MetricCard, PageHeader, PerformanceBadge, ProgressBar, Select } from "../components/UI";
import { ContactsPanel } from "../components/SitePanels";
import { cx } from "../utils";

function DistributionBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  return <div className="distribution-row"><div className="distribution-row__label"><span>{label}</span><strong>{value}</strong></div><div className="distribution-track"><span className={`distribution-fill distribution-fill--${tone}`} style={{ width: `${total ? (value / total) * 100 : 0}%` }} /></div></div>;
}

function DashboardTable({ sites }: { sites: DashboardSite[] }) {
  return <div className="data-table-wrap" data-tour="dashboard-sites"><table className="data-table dashboard-table"><thead><tr><th>Site</th><th>Region / segment</th><th>Completion</th><th>Performance</th><th>Gaps</th><th>Last updated</th><th><span className="sr-only">View</span></th></tr></thead><tbody>{sites.map((site) => (
    <tr key={site.id}><td data-label="Site"><strong>{site.name}</strong><span>{site.code}</span></td><td data-label="Region / segment"><strong>{site.region}</strong><span>{site.segment}</span></td><td data-label="Completion"><div className="table-completion"><CompletionBadge value={site.completion} /><span className="table-progress"><span style={{ width: `${site.completion}%` }} /></span></div></td><td data-label="Performance"><PerformanceBadge performance={site.performance} compact /></td><td data-label="Gaps"><span className={cx("gap-count", site.gaps > 20 && "gap-count--high")}>{site.gaps}</span></td><td data-label="Last updated">{site.updated}</td><td data-label=""><Link className="table-action" to={`/sites/${site.id}`} aria-label={`View ${site.name}`}><ChevronRight size={18} /></Link></td></tr>
  ))}</tbody></table></div>;
}

function downloadSiteExport(sites: DashboardSite[], fileName: string, focus = "All assessment areas") {
  const columns = ["Site", "Site code", "Region", "Segment", "Completion", "Performance", "Gaps", "Assessment area", "Last updated"];
  const escapeCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = sites.map((site) => [site.name, site.code, site.region, site.segment, `${site.completion}%`, performanceLabel(site.performance), site.gaps, focus, site.updated]);
  const csv = [columns, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

type CompletionFilter = "all" | "complete" | "in-progress" | "not-started";

export function DashboardScreen() {
  const { dashboardSiteRows, sectionSummaries } = useAppState();
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
  function exportDashboard() { downloadSiteExport(sites, `EHSS_assessment_dashboard_${new Date().toISOString().slice(0, 10)}.csv`, focus); setExported(true); window.setTimeout(() => setExported(false), 2600); }

  return (
    <div className="page-container">
      <PageHeader eyebrow="Enterprise oversight" title="EHS&S assessment dashboard" description="Track completion and self-assessed performance across the sites in your authorized scope." actions={<Button variant="primary" icon={<ArrowDownToLine size={18} />} onClick={exportDashboard} disabled={!sites.length} data-tour="dashboard-export">Export to Excel</Button>} />
      {exported && <InlineMessage className="floating-feedback" tone="success" title="Export downloaded">The current filtered site view was downloaded and can be opened in Excel.</InlineMessage>}
      <div className="metrics-grid">
        <MetricCard label="Sites in scope" value={total} detail={`Across ${regions.length} regions`} icon={<MapPin size={21} />} tone="brand" />
        <MetricCard label="Assessment complete" value={`${Math.round((complete / total) * 100)}%`} detail={`${complete} of ${total} sites`} icon={<CheckCircle2 size={21} />} tone="success" />
        <MetricCard label="Average completion" value={`${average}%`} detail="Completion only—not performance" icon={<Target size={21} />} tone="brand" />
        <MetricCard label="Sites at Initial" value={initialSites} detail="Prioritize leadership review" icon={<CircleAlert size={21} />} tone="danger" />
      </div>
      <div className="dashboard-insights">
        <section className="insight-card"><div className="insight-card__header"><div><p className="eyebrow">Completion</p><h2>Assessment status</h2></div><Clock3 size={21} /></div><DistributionBar label="Complete" value={complete} total={total} tone="success" /><DistributionBar label="In progress" value={inProgress} total={total} tone="brand" /><DistributionBar label="Not started" value={notStarted} total={total} tone="neutral" /></section>
        <section className="insight-card"><div className="insight-card__header"><div><p className="eyebrow">Performance</p><h2>Current distribution</h2></div><BarChart3 size={21} /></div>{(["performing", "emerging", "initial", "not-assessed"] as Performance[]).map((level) => <DistributionBar key={level} label={performanceLabel(level)} value={dashboardSiteRows.filter((site) => site.performance === level).length} total={total} tone={level === "performing" ? "success" : level === "emerging" ? "warning" : level === "initial" ? "danger" : "neutral"} />)}</section>
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
  const { dashboardSiteRows, sectionSummaries, requirements } = useAppState();
  const site = dashboardSiteRows.find((item) => item.id === siteId) ?? dashboardSiteRows[0];
  const siteSections = site.id === "northstar" ? sectionSummaries : seedSections;
  const section = siteSections.find((item) => item.id === sectionId);
  // Same gating as the drill-down list: real per-question answers exist only for the one real
  // site, so other mock sites must not borrow Northstar's answers.
  const requirement = site.id === "northstar" ? requirements.find((item) => item.sectionId === sectionId) : undefined;

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
                <div className="readonly-response">
                  <span>Response</span>
                  <span className={cx("response-chip", `response-chip--${question.response ?? "none"}`)}>{responseLabel(question.response)}</span>
                </div>
                {question.action?.description && (
                  <div className="readonly-action">
                    <p className="eyebrow">Corrective action</p>
                    <p>{question.action.description}</p>
                    {question.action.owner && <span>Owner · {question.action.owner}</span>}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon={<Search size={27} />} title="Question-level detail not available" description="Individual assessment responses are only recorded for sites with live self-assessment data. Completion and performance summaries above are tracked for every site in your authorized scope." />
        )}
      </section>
    </div>
  );
}

export function SiteDrilldownScreen() {
  const { siteId } = useParams();
  const { dashboardSiteRows, sectionSummaries, requirements, siteContacts } = useAppState();
  const { role } = useGuidedSetup();
  const site = dashboardSiteRows.find((item) => item.id === siteId) ?? dashboardSiteRows[0];
  const siteSections = site.id === "northstar" ? sectionSummaries : seedSections;
  const canEditAssignedSite = role === "site-contributor" && site.id === "northstar";
  // Only "northstar" has real seeded contact data (siteContacts is a single global record, not
  // yet keyed by site) — every other mock dashboard site shows the empty state rather than
  // fabricated placeholder contacts, which would misleadingly imply fictitious people are real
  // site leadership in a compliance app.
  const hasRealContacts = site.id === "northstar";
  return (
    <div className="page-container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/dashboard">Dashboard</Link><ChevronRight size={15} /><span aria-current="page">{site.name}</span></nav>
      <PageHeader eyebrow="Site drill-down" title={site.name} description={`${site.code} · ${site.region} · ${site.segment}`} actions={<Button variant="secondary" icon={<ArrowDownToLine size={18} />} onClick={() => downloadSiteExport([site], `EHSS_${site.code}_assessment.csv`)}>Export site view</Button>} />
      <InlineMessage tone="info" title={canEditAssignedSite ? "Assigned site—editing available" : "Read-only enterprise view"}>{canEditAssignedSite ? "Open any section below to continue work in your assigned site assessment." : "You can inspect this site's assessment details. Enterprise and administrative oversight does not grant site editing access."}</InlineMessage>
      <div className="metrics-grid"><MetricCard label="Completion" value={`${site.completion}%`} detail="Assessment completion" icon={<Target size={21} />} tone="brand" /><MetricCard label="Performance" value={performanceLabel(site.performance)} detail="Current lowest roll-up" icon={<BarChart3 size={21} />} tone={site.performance === "performing" ? "success" : site.performance === "emerging" ? "warning" : "danger"} /><MetricCard label="Gaps" value={site.gaps} detail="No and Partial responses" icon={<CircleAlert size={21} />} tone="danger" /><MetricCard label="Last updated" value={site.updated} detail="Current assessment record" icon={<RefreshCw size={21} />} /></div>
      <section className="page-section"><div className="section-title-row"><div><p className="eyebrow">Read-only</p><h2>Site contacts</h2></div></div><ContactsPanel contacts={hasRealContacts ? siteContacts : null} /></section>
      <section className="table-card"><div className="table-card__header"><div><p className="eyebrow">Assessment detail</p><h2>Operating System sections</h2></div><PerformanceBadge performance={site.performance} /></div><div className="section-drilldown-list" data-tour="drilldown-sections">{siteSections.filter((section) => section.kind === "operating-system").map((section, index) => {
        // `requirements` is one global list of real, answered assessment data tied to the one
        // real site ("northstar") — every mock dashboard site shares the same sectionId space,
        // so this lookup must stay gated to that one real site. Otherwise a different site's
        // drill-down would show Northstar's actual answers as if they belonged to it.
        const requirement = site.id === "northstar" ? requirements.find((item) => item.sectionId === section.id) : undefined;
        return <article key={section.id} className="section-drilldown-row"><div className="section-drilldown-row__name"><span className="section-index">{index + 1}</span><div><strong>{section.name}</strong><span>{section.questions} questions · {section.gaps} gaps</span></div></div><div><span className="mobile-label">Completion</span><ProgressBar value={section.completion} /></div><div><span className="mobile-label">Performance</span><PerformanceBadge performance={section.performance} compact /></div>{canEditAssignedSite && requirement ? <Link className="button button--tertiary button--compact" to={requirementRoute(requirement)}><span>Open</span><ArrowRight size={16} /></Link> : <Link className="button button--tertiary button--compact" to={`/sites/${site.id}/sections/${section.id}`}><span>View</span><ArrowRight size={16} /></Link>}</article>;
      })}</div></section>
    </div>
  );
}
