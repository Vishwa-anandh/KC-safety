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

import type { DashboardSite, MasterQuestion, MasterRequirement, SiteUser, SiteUserRole } from "../../../shared/types";
import { Button, CheckboxList, ConfirmDialog, EmptyState, IconButton, InlineMessage, MetricCard, PageHeader, ProgressBar, Select } from "../../../shared/ui/UI";
import { ContactsPanel, OwnersPanel } from "../../sites/components/SitePanels";
import { cx } from "../../../shared/utils";

const importSteps = ["Select sites", "Upload", "Inspect", "Map", "Validate", "Confirm", "Result"];

const TARGET_FIELDS = [
  { value: "requirement_id", label: "requirement_id" },
  { value: "requirement_text", label: "requirement_text" },
  { value: "guidance", label: "guidance" },
  { value: "expected_evidence", label: "expected_evidence" },
  { value: "subsection", label: "subsection" },
  { value: "section", label: "section" },
  { value: "version", label: "version" },
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
  { source: "How to meet", target: "guidance", sample: "Assign clear accountabilities...", needsReview: false },
  { source: "Evidence requirements", target: "guidance", sample: "Leadership matrix...", needsReview: true },
  { source: "Sub-section", target: "version", sample: "1.2 Leadership commitment", needsReview: true },
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
  return <ol className="step-indicator" aria-label="Import progress" data-tour="import-steps">{importSteps.map((step, index) => {
    const state = index < current ? "complete" : index === current ? "current" : "upcoming";
    return <li className={cx("step-item", `step-item--${state}`)} key={step} aria-current={state === "current" ? "step" : undefined}><span>{state === "complete" ? <Check size={15} /> : index + 1}</span><strong>{step}</strong></li>;
  })}</ol>;
}

function downloadTextFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["﻿", content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

export function AdminImportHistoryScreen() {
  const { importHistory } = useAdministration();
  const [query, setQuery] = useState("");
  const rows = importHistory
    .map((record, index) => ({ record, isActive: index === 0 }))
    .filter(({ record }) => `${record.fileName} ${record.id} ${record.importedBy}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="page-container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/admin/imports">Master data import</Link><ChevronRight size={15} /><span aria-current="page">Import history</span></nav>
      <PageHeader eyebrow="Administration audit" title="Import history" description="Every completed master data import, with its audit reference, result counts, and administrator." />
      <section className="table-card">
        <div className="dashboard-filter-bar">
          <label className="search-control"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search imports" /></label>
        </div>
        <div className="table-card__header table-card__header--results"><div><p className="eyebrow">Audit trail</p><h2>Completed imports</h2></div><span>{rows.length} of {importHistory.length} shown</span></div>
        {rows.length ? <div className="history-list">{rows.map(({ record, isActive }) => <article key={record.id}><span className="history-list__icon"><FileSpreadsheet size={20} /></span><div><strong>{record.fileName}</strong><span>{record.id} · {new Date(record.importedAt).toLocaleString()}</span><small>{record.created} created · {record.updated} updated · {record.unchanged} unchanged · by {record.importedBy}</small></div><span className="history-list__actions">{isActive && <span className="publish-badge">Active</span>}<span className={cx("publish-badge", record.publishStatus === "Draft" && "publish-badge--draft")}>{record.publishStatus}</span><Link className="button button--tertiary button--compact" to={`/admin/imports/${record.id}/preview`}>Preview</Link></span></article>)}</div> : <EmptyState icon={<History size={28} />} title={importHistory.length ? "No imports match" : "No imports recorded"} description={importHistory.length ? "Try another file name, audit reference, or administrator." : "Completed imports will appear here with their audit reference."} />}
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
    <div className="page-container">
      <PageHeader eyebrow="Administration" title="Sites" description="Every site in the KC network, its assessment status, and the governed requirements scoped to it." actions={<><Button variant="secondary" icon={<Upload size={18} />} onClick={() => csvRef.current?.click()}>Import sites</Button><Button variant="primary" icon={<Plus size={18} />} onClick={() => setEditing("new")}>Create site</Button></>} />
      <input ref={csvRef} className="visually-hidden" type="file" accept=".csv,text/csv" onChange={(event) => {
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
      <div className="metrics-grid">
        <MetricCard label="Total sites" value={sites.length} detail={`Across ${regions.length} regions`} icon={<Building2 size={21} />} tone="brand" />
        <MetricCard label="Assessment complete" value={sites.filter((site) => site.completion === 100).length} detail="Reached 100% completion" icon={<CheckCircle2 size={21} />} tone="success" />
        <MetricCard label="Not started" value={sites.filter((site) => site.completion === 0).length} detail="No assessment recorded" icon={<Circle size={21} />} tone="warning" />
        <MetricCard label="Global requirements" value={globalCount} detail="Apply to every site" icon={<FileText size={21} />} />
      </div>
      <section className="table-card">
        <div className="dashboard-filter-bar">
          <label className="search-control"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sites" /></label>
          <Select label="Filter region" icon={<Filter size={18} />} value={region} onChange={setRegion} options={[{ value: "all", label: "All regions" }, ...regions.map((value) => ({ value, label: value }))]} />
        </div>
        <div className="table-card__header table-card__header--results"><div><p className="eyebrow">Site network</p><h2>All sites</h2></div><span>{rows.length} of {sites.length} shown</span></div>
        {rows.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Site</th><th>Region</th><th>Segment</th><th>Users</th><th>Completion</th><th>Requirements</th><th>Last updated</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{rows.map((site) => {
          const scoped = scopedCountFor(site.id);
          const users = usersFor(site.id);
          return (
            <tr key={site.id} className="data-table__row--link" onClick={() => navigate(`/admin/sites/${site.id}`)}>
              <td data-label="Site"><strong>{site.name}</strong><span>{site.code}</span></td>
              <td data-label="Region">{site.region}</td>
              <td data-label="Segment">{site.segment}</td>
              <td data-label="Users">{users.length ? <>{users.length}<span>{users.filter((user) => user.status === "Active").length} active</span></> : "None assigned"}</td>
              <td data-label="Completion"><span className={cx("completion-badge", site.completion === 100 ? "completion-badge--complete" : site.completion === 0 ? "completion-badge--not-started" : "completion-badge--in-progress")}>{site.completion}%</span></td>
              <td data-label="Requirements">{scoped ? `${scoped} scoped` : "Global only"}<span>{globalCount} global</span></td>
              <td data-label="Last updated">{site.updated}</td>
              <td data-label=""><span className="row-actions"><IconButton label={`Edit ${site.name}`} onClick={(event) => { event.stopPropagation(); setEditing(site); }}><Pencil size={17} /></IconButton><Link className="table-action" to={`/admin/sites/${site.id}`} aria-label={`Open ${site.name}`}><ChevronRight size={18} /></Link></span></td>
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
    <div className="page-container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/admin/imports">Master data import</Link><ChevronRight size={15} /><Link to="/admin/imports/history">Import history</Link><ChevronRight size={15} /><span aria-current="page">{batchId}</span></nav>
      <PageHeader
        eyebrow="Administration audit"
        title="Preview imported requirements"
        description={batch ? `${rows.length} requirement${rows.length === 1 ? "" : "s"} from ${batch.fileName}, scoped to ${siteNamesFor(sites, batch.siteIds) || "the selected sites"}.` : "This import batch could not be found."}
        actions={batch && rows.length > 0 && <Button variant="primary" icon={<Check size={17} />} disabled={published} onClick={() => { publishImportBatch(batch.id); notifyBatchPublished(notify, batch, rows.length, sites); }}>{published ? "Published" : `Publish ${rows.length} requirements`}</Button>}
      />
      {published && <InlineMessage tone="success" title="Already published">This batch's requirements are live in the master requirements catalog.</InlineMessage>}
      {!rows.length && <EmptyState icon={<FileSpreadsheet size={28} />} title="No requirements in this batch" description="This import batch has no linked master requirement rows." />}
      {sectionOrder.map((section) => (
        <section className="table-card" key={section}>
          <div className="table-card__header"><div><p className="eyebrow">Category</p><h2>{section}</h2></div><span>{grouped[section].length} requirement{grouped[section].length === 1 ? "" : "s"}</span></div>
          <div className="history-list">{grouped[section].map((item) => (
            <article key={item.id}>
              <span className="history-list__icon"><FileText size={20} /></span>
              <div><strong>{item.id}</strong><span>{item.title}</span></div>
              <span className={cx("publish-badge", item.status === "Draft" && "publish-badge--draft")}>{item.status}</span>
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
    <div className="page-container">
      <PageHeader eyebrow="Administration" title="Master data import" description="Validate an approved KC workbook before applying requirements and hierarchy changes." actions={<Button variant="secondary" icon={<History size={18} />} onClick={() => navigate("/admin/imports/history")} data-tour="import-history">Import history</Button>} />
      <section className="import-card">
        <StepIndicator current={step} />
        <div className="import-stage">
          {step === 0 && <><div className="import-stage__heading"><span className="stage-icon"><Building2 size={23} /></span><div><p className="eyebrow">Step 1 of 7</p><h2>Select sites for this import</h2><p>Choose one or more sites this workbook's requirements apply to.</p></div></div><CheckboxList label="Sites" searchable options={siteOptions} selected={selectedSiteIds} onChange={setSelectedSiteIds} /></>}
          {step === 1 && <><div className="import-stage__heading"><span className="stage-icon"><FileInput size={23} /></span><div><p className="eyebrow">Step 2 of 7</p><h2>Upload source workbook</h2><p>Select the approved KC Operating System and Performance Standards workbook.</p></div></div><input ref={inputRef} className="visually-hidden" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => selectFile(event.target.files?.[0])} />{!file ? <button className={cx("dropzone", "dropzone--large", fileError && "dropzone--invalid")} data-tour="import-upload" onClick={() => inputRef.current?.click()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }} onDragOver={(event) => event.preventDefault()}><span className="dropzone__icon"><Upload size={25} /></span><strong>Choose an Excel workbook or drag it here</strong><span>.xlsx files · Maximum 25 MB</span></button> : <div className="selected-file" data-tour="import-upload"><span className="selected-file__icon"><FileSpreadsheet size={24} /></span><div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to inspect</span></div><Button variant="tertiary" size="compact" onClick={() => inputRef.current?.click()}>Replace</Button><CheckCircle2 size={21} /></div>}{fileError && <InlineMessage tone="danger" title="Workbook not accepted">{fileError}</InlineMessage>}</>}
          {step === 2 && <><div className="import-stage__heading"><span className="stage-icon"><FileSpreadsheet size={23} /></span><div><p className="eyebrow">Step 3 of 7</p><h2>Inspect workbook structure</h2><p>Review detected sheets and records before mapping.</p></div></div><div className="inspection-grid"><div><strong>24</strong><span>Sheets detected</span></div><div><strong>752</strong><span>Requirement rows</span></div><div><strong>0</strong><span>Unknown sheets</span></div><div><strong>2</strong><span>Warnings</span></div></div><div className="inspection-list"><div><FileCheck2 size={18} /><span><strong>Leadership & Engagement</strong><small>68 rows · Valid structure</small></span><CheckCircle2 size={18} /></div><div><FileCheck2 size={18} /><span><strong>Planning</strong><small>94 rows · Valid structure</small></span><CheckCircle2 size={18} /></div><div><AlertCircle size={18} /><span><strong>Machine Safety</strong><small>2 blank guidance cells</small></span><span className="warning-label">Warning</span></div></div></>}
          {step === 3 && <><div className="import-stage__heading"><span className="stage-icon"><ArrowRight size={23} /></span><div><p className="eyebrow">Step 4 of 7</p><h2>Map workbook columns</h2><p>Confirm how source values map into governed master fields. Resolve any flagged row before continuing.</p></div></div><div className="mapping-table">{mappings.map((mapping, index) => <div key={mapping.source} className={cx(mapping.needsReview && "mapping-table__row--flagged")}><span><strong>{mapping.source}</strong><small>Source column</small></span><ArrowRight size={18} /><Select label={`Target field for ${mapping.source}`} value={mapping.target} onChange={(value) => setMappings((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, target: value, needsReview: false } : row))} options={TARGET_FIELDS} /><span className="mapping-sample">{mapping.sample}</span>{mapping.needsReview ? <span className="warning-label">Needs review</span> : <CheckCircle2 size={18} />}</div>)}</div>{needsReview && <InlineMessage tone="warning" title="Resolve flagged mappings">One or more source columns were auto-detected with low confidence. Choose the correct target field for each flagged row before continuing.</InlineMessage>}</>}
          {step === 4 && <><div className="import-stage__heading"><span className="stage-icon"><ShieldCheck size={23} /></span><div><p className="eyebrow">Step 5 of 7</p><h2>Validation results</h2><p>Resolve blocking errors before import. Warnings may be accepted with review.</p></div></div><div className="validation-summary"><div className="validation-summary__success"><CheckCircle2 size={22} /><span><strong>748</strong> valid records</span></div><div className="validation-summary__warning"><AlertCircle size={22} /><span><strong>4</strong> warnings</span></div><div><Circle size={22} /><span><strong>0</strong> blocking errors</span></div></div><InlineMessage tone="warning" title="Four records need review">Two records have blank guidance and two reuse an existing display order. The import can continue without data loss.</InlineMessage><Button variant="secondary" icon={<Download size={17} />} onClick={() => downloadTextFile("Maitsys_Assure_import_validation_report.csv", "row,severity,field,message\r\n214,Warning,guidance,Guidance is blank\r\n389,Warning,guidance,Guidance is blank\r\n521,Warning,display_order,Display order is reused\r\n522,Warning,display_order,Display order is reused")}>Download validation report</Button></>}
          {step === 5 && <><div className="import-stage__heading"><span className="stage-icon"><FileCheck2 size={23} /></span><div><p className="eyebrow">Step 6 of 7</p><h2>Confirm import</h2><p>Review the dry-run result before applying master data changes.</p></div></div><div className="dry-run-grid"><div><span className="dry-run-dot dry-run-dot--create" /><strong>4</strong><span>Create</span></div><div><span className="dry-run-dot dry-run-dot--update" /><strong>2</strong><span>Update</span></div><div><span className="dry-run-dot dry-run-dot--same" /><strong>746</strong><span>Unchanged</span></div><div><span className="dry-run-dot dry-run-dot--conflict" /><strong>0</strong><span>Conflicts</span></div></div><InlineMessage tone="info" title="Import scope">This action updates master requirements for {siteNamesFor(sites, selectedSiteIds) || "the selected sites"} and writes an administrator audit record.</InlineMessage><label className="confirmation-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I reviewed the validation warnings and confirm this import scope.</span></label></>}
          {step === 6 && result && (() => {
            const latest = importHistory.find((record) => record.id === result.id) ?? result;
            const published = latest.publishStatus === "Published";
            const requirementCount = latest.created + latest.updated;
            return (
              <div className="result-state">
                <span className={cx("result-state__icon", published && "result-state__icon--published")}><CheckCircle2 size={34} /></span>
                <p className="eyebrow">{published ? "Published" : "Import complete"}</p>
                <h2>{published ? "Requirements are live" : "Review and publish this import"}</h2>
                <p>{published
                  ? `All ${requirementCount} requirements from this import are now live in the master requirements catalog.`
                  : `${requirementCount} requirements are staged as drafts. They stay invisible to sites until you publish them.`}</p>
                <div className="result-summary">
                  <div><strong>{latest.created}</strong><span>Created</span></div>
                  <div><strong>{latest.updated}</strong><span>Updated</span></div>
                  <div><strong>{latest.unchanged}</strong><span>Unchanged</span></div>
                  <div><strong>{latest.siteIds.length || "All"}</strong><span>{latest.siteIds.length === 1 ? "Site" : "Sites"}</span></div>
                </div>
                <p className="result-state__audit">Audit reference <strong>{latest.id}</strong></p>
                <div className="result-state__primary">
                  {!published && <Button variant="primary" icon={<Check size={17} />} onClick={() => { publishImportBatch(latest.id); notifyBatchPublished(notify, latest, requirementCount, sites); }}>Publish {requirementCount} requirements</Button>}
                  <Button variant="secondary" icon={<FileText size={17} />} onClick={() => navigate(`/admin/imports/${latest.id}/preview`)}>{published ? "View imported requirements" : "Review before publishing"}</Button>
                </div>
                <div className="result-state__links">
                  <button type="button" onClick={() => navigate("/admin/imports/history")}>View audit entry</button>
                  <span className="divider-dot" />
                  <button type="button" onClick={resetImport}>Import another file</button>
                </div>
              </div>
            );
          })()}
        </div>
        {step < 6 && <div className="import-card__footer"><Button variant="tertiary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button><Button variant="primary" onClick={advance} disabled={(step === 0 && selectedSiteIds.length === 0) || (step === 1 && !file) || (step === 3 && needsReview) || (step === 5 && !confirmed)} icon={<ArrowRight size={17} />} iconPosition="end">{step === 5 ? "Confirm import" : "Continue"}</Button></div>}
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
    <div className="question-list">
      {!questions.length && <p className="question-editor-empty">No assessment questions yet. Add the first one below.</p>}
      {questions.map((question, index) => {
        const invalid = submitted && !question.text.trim();
        const evidenceRequired = question.evidenceRequired ?? question.expectedEvidence.length > 0;
        return (
          <article className={cx("question-card", invalid && "question-card--invalid")} key={question.id}>
            <div className="question-card__header">
              <span className="question-number">{index + 1}</span>
              <div>
                <p>Question {index + 1}</p>
                <textarea rows={2} className="question-text-input" value={question.text} onChange={(event) => updateQuestion(question.id, { text: event.target.value })} placeholder="For example, Is the site risk register current and approved?" />
                {invalid && <small className="field-error">Enter the question text.</small>}
              </div>
              <IconButton label={`Delete question ${index + 1}`} onClick={() => removeQuestion(question.id)}><Trash2 size={17} /></IconButton>
            </div>
            <div className="question-evidence question-evidence--editable">
              <label className="question-evidence__toggle"><input type="checkbox" checked={evidenceRequired} onChange={(event) => updateQuestion(question.id, { evidenceRequired: event.target.checked })} /> <span>Evidence required for this question</span></label>
              {evidenceRequired && <><span className="question-evidence__title"><Paperclip size={14} /> Required evidence <small>Shown only with Question {index + 1}</small></span>
              <div className="question-evidence__editor">
                {question.expectedEvidence.map((item, evidenceIndex) => (
                  <div className="question-evidence__item" key={`${question.id}-evidence-${evidenceIndex}`}>
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
    <aside className="assessment-navigator admin-requirement-navigator" aria-label="Master requirement navigator">
      <div className="assessment-navigator__header">
        <div><p className="eyebrow">Master content</p><h2>Requirements</h2></div>
        {onClose && <IconButton label="Close requirement navigator" onClick={onClose}><X size={19} /></IconButton>}
      </div>
      <ProgressBar value={requirements.length ? Math.round((published / requirements.length) * 100) : 0} label="Requirements published" />
      <label className="navigator-search">
        <Search size={17} />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a requirement" />
      </label>
      <div className="navigator-group">
        <div className="navigator-group__trigger" aria-expanded="true"><ChevronDown size={17} /><span>Master requirements</span><small>{published} of {requirements.length}</small></div>
        <div className="navigator-items">
          {filtered.map((requirement) => {
            const isCurrent = requirement.id === current.id;
            return (
              <button key={requirement.id} className={cx("navigator-item", isCurrent && "navigator-item--current")} onClick={() => onNavigate(requirement)}>
                {isCurrent ? <span className="nav-state nav-state--current"><Circle size={12} fill="currentColor" /></span> : requirement.status === "Published" ? <CheckCircle2 size={17} className="nav-state nav-state--complete" /> : <Circle size={16} className="nav-state nav-state--incomplete" />}
                <span><small>{requirement.id} · {requirement.section}</small>{requirement.title}</span>
                <ChevronRight size={16} />
              </button>
            );
          })}
          {!filtered.length && <p className="navigator-empty">No requirements match your search.</p>}
        </div>
      </div>
      <Button className="next-incomplete" variant="secondary" icon={<ListChecks size={18} />} onClick={onViewAll}>All requirements</Button>
    </aside>
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
  const [draft, setDraft] = useState<MasterRequirement>(existing ?? { id: "", title: "", section: defaultSection, version: "v1", status: "Draft", siteIds: [], questions: [] });
  const [submitted, setSubmitted] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<MasterRequirement | "list" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // React reuses this route component when only :requirementId changes. Resetting the editor
  // from the route record keeps the header, fields, and left navigator in lockstep after a
  // requirement is selected from the navigator.
  useEffect(() => {
    setDraft(existing ?? { id: "", title: "", section: defaultSection, version: "v1", status: "Draft", siteIds: [], questions: [] });
    setSubmitted(false);
    setPendingNavigation(null);
  }, [defaultSection, existing, requirementId]);

  if (requirementId && !existing) {
    return (
      <div className="page-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/admin/requirements">Master requirements</Link><ChevronRight size={15} /><span aria-current="page">Not found</span></nav>
        <EmptyState icon={<Search size={27} />} title="Requirement not found" description="This master requirement does not exist or was removed." />
      </div>
    );
  }

  const update = (key: keyof MasterRequirement, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const valid = Boolean(draft.id.trim() && draft.title.trim() && draft.section.trim() && /^v\d+$/i.test(draft.version.trim()) && draft.questions.every((question) => question.text.trim()));
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
      version: draft.version.trim(),
      questions: draft.questions.map((question, index) => ({ ...question, number: String(index + 1), text: question.text.trim(), expectedEvidence: question.expectedEvidence.map((line) => line.trim()).filter(Boolean) })),
    };
    if (isNew) addMasterRequirement(cleaned); else updateMasterRequirement(cleaned);
    navigate("/admin/requirements", { state: { feedback: `${cleaned.id} was ${isNew ? "added" : "updated"}.` } });
  }

  return (
    <div className="requirement-page admin-requirement-page">
      <div className="requirement-mobile-toolbar admin-requirement-mobile-toolbar">
        <Button variant="secondary" icon={<Menu size={18} />} onClick={() => setNavigatorOpen(true)}>Requirements</Button>
        <Button variant="secondary" onClick={() => requestNavigation("list")}>All requirements</Button>
      </div>
      <div className="requirement-layout requirement-layout--admin-editor">
        <div className="requirement-layout__navigator"><AdminRequirementNavigator requirements={masterRequirements} current={navigatorCurrent} onNavigate={requestNavigation} onViewAll={() => requestNavigation("list")} /></div>
        <div className="requirement-main requirement-main--editor">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/admin/requirements">Master requirements</Link><ChevronRight size={15} /><span aria-current="page">{isNew ? "New requirement" : draft.id}</span></nav>
        <header className="requirement-header">
          <div className="requirement-header__meta">
            <input className={cx("requirement-id-input", submitted && !draft.id.trim() && "field-invalid-input")} style={{ width: `${Math.max(8, draft.id.length + 2)}ch` }} value={draft.id} disabled={!isNew} onChange={(event) => update("id", event.target.value)} placeholder="For example, OS 2.4.1" aria-label="Requirement ID" />
            <Select label="Section" value={draft.section} onChange={(value) => update("section", value)} options={sectionOptions} />
          </div>
          <div className="requirement-header__title">
            <div>
              <p className="eyebrow">Requirement</p>
              <textarea className={cx("requirement-title-input", submitted && !draft.title.trim() && "field-invalid-input")} rows={2} value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="Requirement title" aria-label="Requirement title" />
            </div>
            <div className="requirement-header__controls">
              <label className="requirement-version-field"><span>Version</span><input className={cx(submitted && !/^v\d+$/i.test(draft.version.trim()) && "field-invalid-input")} value={draft.version} onChange={(event) => update("version", event.target.value)} placeholder="v1" aria-label="Version" /></label>
              <Select label="Status" value={draft.status} onChange={(value) => update("status", value)} options={[{ value: "Draft", label: "Draft" }, { value: "Published", label: "Published" }]} />
            </div>
          </div>
          <div className="requirement-header__footer">
            <span>{draft.siteIds.length ? `${draft.siteIds.length} of ${sites.length} sites scoped` : "Applies to all sites"}</span>
          </div>
          <div className="field field--wide">
            <span>Sites <small>Leave empty to apply to all sites</small></span>
            <CheckboxList label="Sites" searchable options={siteOptions} selected={draft.siteIds} onChange={(values) => setDraft((current) => ({ ...current, siteIds: values }))} />
            <div className="requirement-selected-sites" aria-live="polite">
              <strong>Selected sites</strong>
              {draft.siteIds.length ? <span className="requirement-selected-sites__list">{siteOptions.filter((site) => draft.siteIds.includes(site.value)).map((site) => <span key={site.value}>{site.label}</span>)}</span> : <span>All sites</span>}
            </div>
          </div>
          {submitted && !valid && <InlineMessage tone="danger" title="Complete required fields">Requirement ID, title, section, a valid version (for example v1), and text for every question are required before saving.</InlineMessage>}
        </header>
        <section className="questions-section" aria-labelledby="admin-questions-title">
          <div className="section-title-row"><div><p className="eyebrow">Assessment questions</p><h2 id="admin-questions-title">Add, edit, or remove questions</h2></div><span className="question-count">{draft.questions.length} questions</span></div>
          <QuestionsEditor questions={draft.questions} onChange={(questions) => setDraft((current) => ({ ...current, questions }))} requirementId={draft.id} submitted={submitted} />
        </section>
        <footer className="requirement-footer">
          <div><Button variant="secondary" onClick={() => navigate("/admin/requirements")}>Cancel</Button>{!isNew && <Button variant="tertiary" icon={<Trash2 size={17} />} onClick={() => setDeleteConfirmOpen(true)}>Delete requirement</Button>}</div>
          <Button variant="primary" icon={<Check size={17} />} onClick={save}>{isNew ? "Add requirement" : "Save changes"}</Button>
        </footer>
      </div>
      </div>
      {navigatorOpen && <div className="sheet-layer"><button className="sheet-backdrop" aria-label="Close requirement navigator" onClick={() => setNavigatorOpen(false)} /><div className="sheet sheet--left"><AdminRequirementNavigator requirements={masterRequirements} current={navigatorCurrent} onNavigate={requestNavigation} onViewAll={() => requestNavigation("list")} onClose={() => setNavigatorOpen(false)} /></div></div>}
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
    <div className="page-container">
      <PageHeader eyebrow="Administration" title="Master requirements" description="Manage governed requirement, guidance, evidence, hierarchy, and version content." actions={<Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate("/admin/requirements/new")} data-tour="add-requirement">Add requirement</Button>} />
      {feedback && <InlineMessage tone={feedback.includes("already exists") ? "warning" : "success"} title={feedback.includes("already exists") ? "Requirement not added" : "Master content saved"}>{feedback}</InlineMessage>}
      <section className="table-card">
        <div className="dashboard-filter-bar" data-tour="requirement-filters">
          <label className="search-control"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID or requirement" /></label>
          <Select label="Filter section" icon={<Filter size={18} />} value={section} onChange={setSection} options={["All sections", ...sections].map((value) => ({ value, label: value }))} />
          <Select label="Filter publishing state" icon={<FileText size={18} />} value={status} onChange={setStatus} options={["Published and draft", "Published", "Draft"].map((value) => ({ value, label: value }))} />
          <Select label="Filter site" icon={<Building2 size={18} />} searchable value={siteFilter} onChange={setSiteFilter} options={[{ value: "all", label: "All sites" }, ...sites.map((site) => ({ value: site.id, label: site.name }))]} />
        </div>
        <div className="table-card__header table-card__header--results"><div><p className="eyebrow">Governed content</p><h2>Requirements</h2></div><span>{rows.length} records shown</span></div>
        {rows.length ? (
          <div className="data-table-wrap">
            <table className="data-table data-table--requirements">
              <thead><tr><th>ID</th><th>Requirement</th><th>Section</th><th>Sites</th><th>Version</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{rows.map((item) => (
                <tr key={item.id} className="data-table__row--link" onClick={() => navigate(`/admin/requirements/${item.id}`)}>
                  <td data-label="ID"><strong>{item.id}</strong></td>
                  <td data-label="Requirement"><strong>{item.title}</strong><span>Guidance and evidence requirements configured</span></td>
                  <td data-label="Section">{item.section}</td>
                  <td data-label="Sites" title={siteCodesSummary(sites, item.siteIds).title}>{siteCodesSummary(sites, item.siteIds).text}</td>
                  <td data-label="Version">{item.version}</td>
                  <td data-label="Status"><span className={cx("publish-badge", item.status === "Draft" && "publish-badge--draft")}>{item.status}</span></td>
                  <td data-label="Actions"><span className="row-actions row-actions--menu">
                    <IconButton label={`Edit ${item.id}`} onClick={(event) => { event.stopPropagation(); navigate(`/admin/requirements/${item.id}`); }}><Pencil size={17} /></IconButton>
                    <IconButton label={`More actions for ${item.id}`} onClick={(event) => { event.stopPropagation(); setMenu(menu === item.id ? null : item.id); }}><MoreHorizontal size={18} /></IconButton>
                    {menu === item.id && <span className="row-menu" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => { updateMasterRequirement({ ...item, status: item.status === "Published" ? "Draft" : "Published" }); setFeedback(`${item.id} status changed to ${item.status === "Published" ? "Draft" : "Published"}.`); setMenu(null); }}>{item.status === "Published" ? "Move to draft" : "Publish"}</button>
                      <button onClick={() => { const copy = { ...item, id: `${item.id}-COPY-${Date.now().toString().slice(-4)}`, title: `${item.title} copy`, status: "Draft" as const, importBatchId: undefined }; addMasterRequirement(copy); setFeedback(`${item.id} was duplicated as a draft.`); setMenu(null); }}><Copy size={15} /> Duplicate</button>
                      <button className="row-menu__delete" onClick={() => { setDeleting(item); setMenu(null); }}><Trash2 size={15} /> Delete requirement</button>
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
  return <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Close user editor" onClick={onClose} /><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="site-user-dialog-title">
    <div className="dialog__header"><div><p className="eyebrow">Site access</p><h2 id="site-user-dialog-title">{user ? `Edit ${user.name}` : "Assign user to site"}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <div className="dialog-form form-grid">
      <label className={cx("field", "field--wide", submitted && !draft.name.trim() && "field--invalid")}>
        <span>Full name <b>Required</b></span>
        <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="For example, Maya Patel" />
        {submitted && !draft.name.trim() && <small className="field-error">Enter a name for this person.</small>}
      </label>
      <label className={cx("field", "field--wide", submitted && !emailValid && "field--invalid")}>
        <span>Email <b>Required</b></span>
        <input type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="name@example.com" />
        {submitted && !emailValid && <small className="field-error">Enter a valid email address.</small>}
      </label>
      <label className="field">
        <span>Role</span>
        <Select label="Role" value={draft.role} onChange={(value) => setDraft((current) => ({ ...current, role: value as SiteUserRole }))} options={(Object.keys(roleLabels) as SiteUserRole[]).map((value) => ({ value, label: roleLabels[value] }))} />
      </label>
      <label className="field">
        <span>Status</span>
        <Select label="Status" value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value as SiteUser["status"] }))} options={[{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }]} />
      </label>
    </div>
    <div className="dialog__footer"><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Check size={17} />} onClick={() => { setSubmitted(true); if (valid) onSave({ ...draft, name: draft.name.trim(), email: draft.email.trim() }); }}>{user ? "Save changes" : "Assign user"}</Button></div>
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
      <div className="page-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/admin/sites">Sites</Link><ChevronRight size={15} /><span aria-current="page">Not found</span></nav>
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
    <div className="page-container">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/admin/sites">Sites</Link><ChevronRight size={15} /><span aria-current="page">{site.name}</span></nav>
      <PageHeader eyebrow="Administration" title={site.name} description={`${site.code} · ${site.region} · ${site.segment}`} actions={<Button variant="primary" icon={<Plus size={18} />} onClick={() => setEditing("new")}>Assign user</Button>} />
      {feedback && <InlineMessage tone={feedback.includes("already assigned") ? "warning" : "success"} title={feedback.includes("already assigned") ? "User not assigned" : "Site access updated"}>{feedback}</InlineMessage>}

      <div className="metrics-grid">
        <MetricCard label="Assigned users" value={users.length} detail={`${users.filter((user) => user.status === "Active").length} active`} icon={<UsersRound size={21} />} tone="brand" />
        <MetricCard label="Completion" value={`${site.completion}%`} detail="Assessment completion" icon={<Target size={21} />} />
        <MetricCard label="Open gaps" value={site.gaps} detail="No and Partial responses" icon={<AlertCircle size={21} />} tone={site.gaps > 20 ? "danger" : "neutral"} />
        <MetricCard label="Last updated" value={site.updated} detail="Current assessment record" icon={<History size={21} />} />
      </div>

      <section className="table-card">
        <div className="table-card__header table-card__header--results"><div><p className="eyebrow">Site access</p><h2>Assigned users</h2></div><span>{users.length} user{users.length === 1 ? "" : "s"}</span></div>
        {users.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>{users.map((user) => (
          <tr key={user.id}>
            <td data-label="Name"><strong>{user.name}</strong></td>
            <td data-label="Email">{user.email}</td>
            <td data-label="Role">{roleLabels[user.role]}</td>
            <td data-label="Status"><span className={cx("publish-badge", user.status === "Inactive" && "publish-badge--draft")}>{user.status}</span></td>
            <td data-label="Actions"><span className="row-actions"><IconButton label={`Edit ${user.name}`} onClick={() => setEditing(user)}><Pencil size={17} /></IconButton><IconButton label={`Remove ${user.name} from this site`} onClick={() => setRemoving(user)}><Trash2 size={17} /></IconButton></span></td>
          </tr>
        ))}</tbody></table></div> : <EmptyState icon={<UsersRound size={27} />} title="No users assigned" description="Assign a user to give them access to this site's workspace." />}
      </section>

      <section className="page-section">
        <div className="section-title-row"><div><p className="eyebrow">Read-only</p><h2>Program &amp; standard owners</h2></div></div>
        <OwnersPanel owners={hasRealSiteRecords ? ownerRecords : null} />
      </section>

      <section className="page-section">
        <div className="section-title-row"><div><p className="eyebrow">Read-only</p><h2>Site information</h2></div></div>
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
      <span className="value-add-new">
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
  return <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Close site editor" onClick={onClose} /><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="site-dialog-title">
    <div className="dialog__header"><div><p className="eyebrow">Site network</p><h2 id="site-dialog-title">{site ? `Edit ${site.name}` : "Create site"}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <div className="dialog-form form-grid">
      <label className={cx("field", "field--wide", submitted && !draft.name.trim() && "field--invalid")}>
        <span>Site name <b>Required</b></span>
        <input value={draft.name} onChange={(event) => set("name", event.target.value)} placeholder="For example, Northstar Manufacturing" />
        {submitted && !draft.name.trim() && <small className="field-error">Enter the site name.</small>}
      </label>
      <label className={cx("field", (submitted && !trimmedCode) || duplicateCode ? "field--invalid" : undefined)}>
        <span>Site code <b>Required</b></span>
        <input value={draft.code} onChange={(event) => set("code", event.target.value)} placeholder="KC-NSM-042" />
        {submitted && !trimmedCode && <small className="field-error">Enter the KC site code.</small>}
        {duplicateCode && <small className="field-error">This site code already exists.</small>}
      </label>
      <label className={cx("field", submitted && !draft.region.trim() && "field--invalid")}>
        <span>Region <b>Required</b></span>
        <ValueWithAddNew
          label="Region"
          value={draft.region}
          options={[...new Set(existing.map((item) => item.region))].filter(Boolean).sort()}
          placeholder="North America"
          invalid={submitted && !draft.region.trim()}
          onChange={(value) => set("region", value)}
        />
        {submitted && !draft.region.trim() && <small className="field-error">Enter the region.</small>}
      </label>
      <label className={cx("field", "field--wide", submitted && !draft.segment.trim() && "field--invalid")}>
        <span>Segment <b>Required</b></span>
        <ValueWithAddNew
          label="Segment"
          value={draft.segment}
          options={[...new Set(existing.map((item) => item.segment))].filter(Boolean).sort()}
          placeholder="Family Care"
          invalid={submitted && !draft.segment.trim()}
          onChange={(value) => set("segment", value)}
        />
        {submitted && !draft.segment.trim() && <small className="field-error">Enter the business segment.</small>}
      </label>
    </div>
    <div className="dialog__footer"><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Check size={17} />} onClick={() => {
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
