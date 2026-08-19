import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileWarning,
  Filter,
  Mail,
  MapPin,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { actionComplete, requirementRoute, useAppState } from "../AppState";
import { assessmentPeriods, assignedSite } from "../data";
import type { AssessmentPeriod, AssessmentQuestion, OwnerRecord, Requirement, SectionSummary, SiteContacts } from "../types";
import { Button, EmptyState, IconButton, InlineMessage, MetricCard, PageHeader, PerformanceBadge, ProgressBar, SaveStatus, Select } from "../components/UI";
import { cx } from "../utils";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

function SiteContextCard({ updated }: { updated?: string }) {
  const updatedLabel = updated
    ? new Date(updated).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : assignedSite.updated;
  return (
    <section className="site-identity-card" data-tour="site-context">
      <div className="site-identity-card__mark"><Building2 size={27} /></div>
      <div className="site-identity-card__copy">
        <p className="eyebrow">Assigned site</p>
        <h2>{assignedSite.name}</h2>
        <div>
          <span><ShieldCheck size={15} /> {assignedSite.code}</span>
          <span><MapPin size={15} /> {assignedSite.region} · {assignedSite.segment}</span>
          <span><CalendarClock size={15} /> Updated {updatedLabel}</span>
        </div>
      </div>
      <span className="fixed-context-badge">Current site</span>
    </section>
  );
}

function SectionCard({ section, requirement }: { section: SectionSummary; requirement?: Requirement }) {
  const content = (
    <article className="section-card">
      <div className="section-card__top">
        <span className={cx("section-card__icon", `section-card__icon--${section.performance}`)}>{section.kind === "operating-system" ? <ClipboardCheck size={21} /> : <ShieldCheck size={21} />}</span>
        <PerformanceBadge performance={section.performance} compact />
      </div>
      <div className="section-card__body">
        <p className="eyebrow">{section.kind === "operating-system" ? "Operating System" : "Performance Standard"}</p>
        <h3>{section.name}</h3><p>{section.description}</p>
      </div>
      <ProgressBar value={section.completion} label="Completion" />
      <div className="section-card__footer"><span>{section.questions} questions</span><span>{section.gaps} gaps</span><ChevronRight size={18} /></div>
    </article>
  );
  return requirement ? <Link className="card-link" to={requirementRoute(requirement)}>{content}</Link> : content;
}

export function OverviewScreen() {
  const { requirements, sectionSummaries, overallCompletion, overallPerformance, gapCount, missingActionCount, lastUpdated } = useAppState();
  const operating = sectionSummaries.filter((section) => section.kind === "operating-system");
  const allQuestions = requirements.flatMap((requirement) => requirement.questions);
  const completeQuestions = allQuestions.filter((question) => actionComplete(question.response, question.action)).length;
  const nextRequirement = requirements.find((requirement) => requirement.questions.some((question) => !actionComplete(question.response, question.action))) ?? requirements[0];
  const nextRoute = nextRequirement ? requirementRoute(nextRequirement) : "/assessment";
  const nextCopy = missingActionCount > 0 ? "Complete corrective-action details" : "Continue unanswered assessment questions";

  return (
    <div className="page-container">
      <PageHeader eyebrow="Site workspace" title="Assessment overview" description="Review current completion, performance, and the next work needed for your assigned site." actions={<Link className="button button--primary button--default" to={nextRoute} data-tour="continue-assessment"><span>Continue assessment</span><ArrowRight size={18} /></Link>} />
      <SiteContextCard updated={lastUpdated} />
      <div className="metrics-grid">
        <MetricCard label="Assessment completion" value={`${overallCompletion}%`} detail={`${completeQuestions} of ${allQuestions.length} questions complete`} icon={<Target size={21} />} tone="brand" />
        <MetricCard label="Current performance" value={<span className="metric-with-badge"><PerformanceBadge performance={overallPerformance} /></span>} detail="Lowest roll-up across assessed sections" icon={<BarChart3 size={21} />} tone={overallPerformance === "performing" ? "success" : "danger"} />
        <MetricCard label="Gaps requiring action" value={gapCount} detail={`${missingActionCount} actions are missing information`} icon={<FileWarning size={21} />} tone="warning" />
        <MetricCard label="Last activity" value={new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} detail="Changes saved for the current site" icon={<Activity size={21} />} />
      </div>
      <div className="overview-callout">
        <div className="overview-callout__icon"><CircleAlert size={23} /></div>
        <div><p className="eyebrow">Recommended next step</p><h2>{nextCopy}</h2><p>{missingActionCount > 0 ? `${missingActionCount} No or Partial responses still need a complete description and owner.` : "Open the next requirement with unanswered questions and continue the assessment."}</p></div>
        <Link className="button button--primary button--default" to={nextRoute}><span>Review requirement</span><ArrowRight size={18} /></Link>
      </div>
      <section className="page-section">
        <div className="section-title-row"><div><p className="eyebrow">Six Operating System sections</p><h2>Assessment progress</h2></div><Link className="text-link" to="/assessment">View full assessment <ArrowRight size={16} /></Link></div>
        <div className="section-card-grid">{operating.map((section) => <SectionCard section={section} requirement={requirements.find((item) => item.sectionId === section.id)} key={section.id} />)}</div>
      </section>
    </div>
  );
}

export function AssessmentHomeScreen() {
  const { requirements, sectionSummaries, overallCompletion, overallPerformance, gapCount, missingActionCount } = useAppState();
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
    <div className="page-container">
      <PageHeader eyebrow="Self-assessment" title="Assessment sections" description="Work through the Operating System, Health & Safety, and Occupational Health requirements for your assigned site." actions={next && <Link className="button button--primary button--default" to={requirementRoute(next)} data-tour="assessment-next-incomplete"><BookOpenCheck size={18} /><span>Open next incomplete</span></Link>} />
      <div className="assessment-summary-strip">
        <div><strong>{overallCompletion}%</strong><span>Overall completion</span></div>
        <div><PerformanceBadge performance={overallPerformance} /><span>Current performance</span></div>
        <div><strong>{gapCount}</strong><span>No / Partial gaps</span></div>
        <div><strong>{missingActionCount}</strong><span>Missing action details</span></div>
      </div>
      <div className="content-toolbar">
        <label className="search-control"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sections and standards" /></label>
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
      {operating.length > 0 && <section className="page-section" data-tour="assessment-sections"><div className="section-title-row"><div><p className="eyebrow">Framework</p><h2>Operating System</h2></div><span>{operating.length} sections</span></div><div className="section-card-grid">{operating.map((section) => <SectionCard section={section} requirement={requirements.find((item) => item.sectionId === section.id)} key={section.id} />)}</div></section>}
      {standards.length > 0 && <section className="page-section"><div className="section-title-row"><div><p className="eyebrow">Assessment standards</p><h2>Performance Standards</h2></div><span>Health, Safety, and Occupational Health</span></div><div className="section-card-grid">{standards.map((section) => <SectionCard section={section} requirement={requirements.find((item) => item.sectionId === section.id)} key={section.id} />)}</div></section>}
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
  return <div className="form-grid">{siteFields.filter((field) => field.group === group).map((field) => (
    <label className={cx("field", errors.has(field.key) && "field--invalid")} key={field.key}>
      <span>{field.label} <b>Required</b></span>
      {field.email ? <span className="field-control-with-icon"><Mail size={17} /><input type="email" value={draft[field.key]} onChange={(event) => onChange(field.key, event.target.value)} aria-invalid={errors.has(field.key)} /></span> : <input value={draft[field.key]} onChange={(event) => onChange(field.key, event.target.value)} aria-invalid={errors.has(field.key)} />}
      {errors.has(field.key) && <small className="field-error">{field.email ? "Enter a valid email address." : "This contact is required."}</small>}
    </label>
  ))}</div>;
}

export function SiteInformationScreen() {
  const { siteContacts, saveSiteContacts } = useAppState();
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
    <div className="page-container">
      <PageHeader eyebrow="Site workspace" title="Site information" description="Maintain leadership and contact details for your assigned site. Core site identity is governed centrally." actions={<Button variant="primary" icon={<Save size={18} />} onClick={save} disabled={saved} data-tour="site-save">Save changes</Button>} />
      {confirmation && <InlineMessage tone="success" title="Site contacts saved">The updated contact information is now available across this site workspace.</InlineMessage>}
      {errors.size > 0 && <InlineMessage tone="danger" title="Review the highlighted fields">Complete every contact and use a valid email address before saving.</InlineMessage>}
      <section className="form-card" data-tour="site-contacts-form">
        <div className="form-card__header"><div><p className="eyebrow">Local leadership</p><h2>Site contacts</h2><span>People responsible for site-level EHS&S coordination.</span></div>{saved ? <SaveStatus /> : <span className="unsaved-state">Unsaved changes</span>}</div>
        <ContactsGroup group="local" draft={draft} errors={errors} onChange={change} />
      </section>
      <section className="form-card">
        <div className="form-card__header"><div><p className="eyebrow">Reference contacts</p><h2>Regional leadership</h2><span>Used for escalation and enterprise communication.</span></div></div>
        <ContactsGroup group="regional" draft={draft} errors={errors} onChange={change} />
      </section>
    </div>
  );
}

function OwnerCard({ owner, onEdit }: { owner: OwnerRecord; onEdit: (owner: OwnerRecord) => void }) {
  const initials = (name: string) => name.split(" ").filter(Boolean).map((part) => part[0]).join("");
  return (
    <article className="owner-card">
      <div className="owner-card__header"><div><p>{owner.category}</p><h3>{owner.program}</h3></div><Button variant="tertiary" size="compact" icon={<Pencil size={16} />} onClick={() => onEdit(owner)}>Edit</Button></div>
      <div className="owner-person"><span className="avatar avatar--soft">{initials(owner.primaryName)}</span><div><small>Primary Owner</small><strong>{owner.primaryName}</strong><a href={`mailto:${owner.primaryEmail}`}>{owner.primaryEmail}</a></div></div>
      <div className="owner-person"><span className="avatar avatar--soft">{initials(owner.backupName)}</span><div><small>Backup Owner</small><strong>{owner.backupName}</strong><a href={`mailto:${owner.backupEmail}`}>{owner.backupEmail}</a></div></div>
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
  return <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Close owner editor" onClick={onClose} /><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="owner-dialog-title">
    <div className="dialog__header"><div><p className="eyebrow">{owner.category}</p><h2 id="owner-dialog-title">Edit {owner.program} owners</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <InlineMessage tone="info" title="Both owners can edit">The labels show accountability; Primary and Backup Owners have the same site permissions.</InlineMessage>
    <div className="dialog-form form-grid">{fields.map((field) => {
      const value = draft[field.key];
      const invalid = submitted && (!String(value).trim() || (field.email && !isEmail(String(value))));
      return <label className={cx("field", invalid && "field--invalid")} key={field.key}><span>{field.label} <b>Required</b></span><input type={field.email ? "email" : "text"} value={value} onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))} aria-invalid={invalid} />{invalid && <small className="field-error">{field.email ? "Enter a valid email address." : "Enter an owner name."}</small>}</label>;
    })}</div>
    <div className="dialog__footer"><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Save size={17} />} onClick={() => { setSubmitted(true); if (valid) onSave(draft); }}>Save owners</Button></div>
  </section></div>;
}

export function OwnersScreen() {
  const { ownerRecords, updateOwner, notify } = useAppState();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<OwnerRecord | null>(null);
  const [savedName, setSavedName] = useState("");
  const filtered = ownerRecords.filter((owner) => `${owner.program} ${owner.primaryName} ${owner.backupName}`.toLowerCase().includes(query.toLowerCase()) && (category === "all" || owner.category === category));
  return (
    <div className="page-container">
      <PageHeader eyebrow="Site workspace" title="Program & standard owners" description="Primary and Backup Owners have equal edit permissions for this assigned site." />
      {savedName ? <InlineMessage tone="success" title={`${savedName} owners updated`}>The new Primary and Backup Owner details are saved for this site.</InlineMessage> : <InlineMessage tone="info" title="Equal permissions">Primary and Backup Owner labels identify responsibility only. Both roles can maintain the same assessment content.</InlineMessage>}
      <div className="content-toolbar" data-tour="owners-controls">
        <label className="search-control"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search programs, standards, or people" /></label>
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
      {filtered.length ? <div className="owner-grid" data-tour="owner-list">{filtered.map((owner) => <OwnerCard owner={owner} onEdit={setEditing} key={owner.id} />)}</div> : <EmptyState icon={<Search size={26} />} title="No owners found" description="Try another name or category." />}
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

function ActionDialog({ row, onClose, onSave }: { row: GapRow; onClose: () => void; onSave: (action: { description: string; owner: string }) => void }) {
  const [description, setDescription] = useState(row.question.action?.description ?? "");
  const [owner, setOwner] = useState(row.question.action?.owner ?? "");
  const [submitted, setSubmitted] = useState(false);
  return <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Close action editor" onClick={onClose} /><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="action-dialog-title">
    <div className="dialog__header"><div><p className="eyebrow">{row.requirement.number} · Question {row.question.number}</p><h2 id="action-dialog-title">Complete corrective action</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <p className="dialog-context">{row.question.text}</p>
    <div className="dialog-form"><label className={cx("field", submitted && !description.trim() && "field--invalid")}><span>Action description <b>Required</b></span><textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />{submitted && !description.trim() && <small className="field-error">Describe the work needed to close the gap.</small>}</label><label className={cx("field", submitted && !owner.trim() && "field--invalid")}><span>Action owner <b>Required</b></span><input value={owner} onChange={(event) => setOwner(event.target.value)} />{submitted && !owner.trim() && <small className="field-error">Assign an accountable owner.</small>}</label></div>
    <div className="dialog__footer"><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Save size={17} />} onClick={() => { setSubmitted(true); if (description.trim() && owner.trim()) onSave({ description: description.trim(), owner: owner.trim() }); }}>Save action</Button></div>
  </section></div>;
}

export function ActionsScreen() {
  const { requirements, updateQuestion, notify } = useAppState();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "complete" | "needs-info">("all");
  const [response, setResponse] = useState<"all" | "no" | "partial">("all");
  const [period, setPeriod] = useState<"all" | AssessmentPeriod>("all");
  const [editing, setEditing] = useState<GapRow | null>(null);
  const [saved, setSaved] = useState(false);
  const actions = useMemo(() => requirements.flatMap((requirement) => requirement.questions.filter((question) => question.response === "no" || question.response === "partial").map((question) => ({ requirement, question }))), [requirements]);
  const complete = actions.filter(({ question }) => actionComplete(question.response, question.action)).length;
  const filtered = actions.filter(({ requirement, question }) => {
    const matchesQuery = `${requirement.number} ${requirement.title} ${question.text} ${question.action?.description ?? ""} ${question.action?.owner ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const isComplete = actionComplete(question.response, question.action);
    return matchesQuery && (status === "all" || (status === "complete" ? isComplete : !isComplete)) && (response === "all" || question.response === response) && (period === "all" || question.period === period);
  });
  return (
    <div className="page-container">
      <PageHeader eyebrow="Site workspace" title="Actions summary" description="Review and complete corrective actions created from No and Partial assessment responses." />
      {saved && <InlineMessage tone="success" title="Corrective action saved">The Actions summary and assessment requirement are now synchronized.</InlineMessage>}
      <div className="metrics-grid metrics-grid--three">
        <MetricCard label="Total gaps" value={actions.length} detail="No and Partial responses" icon={<CircleAlert size={21} />} tone="danger" />
        <MetricCard label="Complete action details" value={complete} detail="Description and owner present" icon={<CheckCircle2 size={21} />} tone="success" />
        <MetricCard label="Needs information" value={actions.length - complete} detail="Missing description or owner" icon={<FileWarning size={21} />} tone="warning" />
      </div>
      <section className="table-card">
        <div className="table-card__header table-card__header--results"><div><p className="eyebrow">Current site</p><h2>Corrective actions</h2></div><span>{filtered.length} of {actions.length} shown</span></div>
        <div className="filter-row" data-tour="actions-filters">
          <label className="search-control"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actions, owners, or requirements" /></label>
          <Select
            label="Filter action status"
            icon={<Filter size={17} />}
            value={status}
            onChange={(value) => setStatus(value as typeof status)}
            options={[
              { value: "all", label: "All action states" },
              { value: "needs-info", label: "Needs information" },
              { value: "complete", label: "Complete details" },
            ]}
          />
          <Select
            label="Filter response"
            value={response}
            onChange={(value) => setResponse(value as typeof response)}
            options={[
              { value: "all", label: "No and Partial" },
              { value: "no", label: "No only" },
              { value: "partial", label: "Partial only" },
            ]}
          />
          <Select
            label="Filter assessment period"
            icon={<CalendarClock size={17} />}
            value={period}
            onChange={(value) => setPeriod(value as typeof period)}
            options={[{ value: "all", label: "All periods" }, ...assessmentPeriods.map((value) => ({ value, label: value }))]}
          />
        </div>
        {filtered.length ? <div className="data-table-wrap" data-tour="actions-table"><table className="data-table"><thead><tr><th>Requirement</th><th>Response</th><th>Action description</th><th>Owner</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map(({ requirement, question }) => {
          const ready = actionComplete(question.response, question.action);
          return <tr key={question.id}><td data-label="Requirement"><strong>{requirement.number} · Question {question.number}</strong><span>{requirement.title}</span></td><td data-label="Response"><span className={cx("response-chip", `response-chip--${question.response}`)}>{question.response === "no" ? "No" : "Partial"}</span></td><td data-label="Action">{question.action?.description || <span className="missing-value">Description needed</span>}</td><td data-label="Owner">{question.action?.owner ? <span className="person-inline"><span className="avatar avatar--tiny">{question.action.owner.split(" ").map((part) => part[0]).join("")}</span>{question.action.owner}</span> : <span className="missing-value">Owner needed</span>}</td><td data-label="Status"><span className={cx("detail-status", ready ? "detail-status--complete" : "detail-status--missing")}>{ready ? "Complete" : "Needs information"}</span></td><td data-label="Actions"><div className="table-row-actions"><Button variant="tertiary" size="compact" icon={<Pencil size={15} />} onClick={() => setEditing({ requirement, question })}>Edit</Button><Link className="table-action" to={requirementRoute(requirement)} aria-label={`Open ${requirement.title}`}><ChevronRight size={18} /></Link></div></td></tr>;
        })}</tbody></table></div> : <EmptyState icon={<Search size={25} />} title="No actions match" description="Clear a filter or search for another requirement." />}
      </section>
      {editing && <ActionDialog row={editing} onClose={() => setEditing(null)} onSave={(action) => {
        updateQuestion(editing.requirement.id, editing.question.id, { action });
        // Only worth telling someone about when the gap is still real.
        if (!action.owner.trim()) {
          notify({
            title: `Action on ${editing.requirement.number} still needs an owner`,
            body: editing.requirement.title,
            category: "action",
            audience: ["site-contributor"],
            link: "/actions",
          });
        }
        setEditing(null); setSaved(true);
      }} />}
    </div>
  );
}
