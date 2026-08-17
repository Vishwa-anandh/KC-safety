import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  FileCheck2,
  FileInput,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useAppState, type ImportHistoryRecord } from "../AppState";
import type { MasterRequirement } from "../types";
import { Button, EmptyState, IconButton, InlineMessage, PageHeader } from "../components/UI";
import { cx } from "../utils";

const importSteps = ["Upload", "Inspect", "Map", "Validate", "Confirm", "Result"];

function StepIndicator({ current }: { current: number }) {
  return <ol className="step-indicator" aria-label="Import progress" data-tour="import-steps">{importSteps.map((step, index) => {
    const state = index < current ? "complete" : index === current ? "current" : "upcoming";
    return <li className={cx("step-item", `step-item--${state}`)} key={step} aria-current={state === "current" ? "step" : undefined}><span>{state === "complete" ? <Check size={15} /> : index + 1}</span><strong>{step}</strong></li>;
  })}</ol>;
}

function downloadTextFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["\ufeff", content], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
}

function ImportHistoryDialog({ records, onClose }: { records: ImportHistoryRecord[]; onClose: () => void }) {
  return <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Close import history" onClick={onClose} /><section className="dialog dialog--wide" role="dialog" aria-modal="true" aria-labelledby="history-title"><div className="dialog__header"><div><p className="eyebrow">Administration audit</p><h2 id="history-title">Import history</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>{records.length ? <div className="history-list">{records.map((record) => <article key={record.id}><span className="history-list__icon"><FileSpreadsheet size={20} /></span><div><strong>{record.fileName}</strong><span>{record.id} · {new Date(record.importedAt).toLocaleString()}</span><small>{record.created} created · {record.updated} updated · {record.unchanged} unchanged · by {record.importedBy}</small></div><span className="publish-badge">{record.status}</span></article>)}</div> : <EmptyState icon={<History size={28} />} title="No imports recorded" description="Completed imports will appear here with their audit reference." />}<div className="dialog__footer"><Button variant="primary" onClick={onClose}>Done</Button></div></section></div>;
}

export function AdminImportsScreen() {
  const navigate = useNavigate();
  const { importHistory, recordImport } = useAppState();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<ImportHistoryRecord | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(selected?: File) {
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".xlsx")) { setFile(null); setFileError("Choose an Excel .xlsx workbook."); return; }
    if (selected.size > 25 * 1024 * 1024) { setFile(null); setFileError("The workbook must be 25 MB or smaller."); return; }
    setFile(selected); setFileError("");
  }
  function advance() {
    if (step === 4 && file) { const audit = recordImport(file.name); setResult(audit); setStep(5); return; }
    setStep((value) => Math.min(5, value + 1));
  }
  function resetImport() { setStep(0); setFile(null); setFileError(""); setConfirmed(false); setResult(null); }

  return (
    <div className="page-container">
      <PageHeader eyebrow="Administration" title="Master data import" description="Validate an approved KC workbook before applying requirements and hierarchy changes." actions={<Button variant="secondary" icon={<History size={18} />} onClick={() => setHistoryOpen(true)} data-tour="import-history">Import history</Button>} />
      <InlineMessage tone="warning" title="Administrative action">Imports update governed master requirements for every authorized site. Inspect the workbook, review the dry run, and resolve blocking errors before confirmation.</InlineMessage>
      <section className="import-card">
        <StepIndicator current={step} />
        <div className="import-stage">
          {step === 0 && <><div className="import-stage__heading"><span className="stage-icon"><FileInput size={23} /></span><div><p className="eyebrow">Step 1 of 6</p><h2>Upload source workbook</h2><p>Select the approved KC Operating System and Performance Standards workbook.</p></div></div><input ref={inputRef} className="visually-hidden" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => selectFile(event.target.files?.[0])} />{!file ? <button className={cx("dropzone", "dropzone--large", fileError && "dropzone--invalid")} data-tour="import-upload" onClick={() => inputRef.current?.click()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }} onDragOver={(event) => event.preventDefault()}><span className="dropzone__icon"><Upload size={25} /></span><strong>Choose an Excel workbook or drag it here</strong><span>.xlsx files · Maximum 25 MB</span></button> : <div className="selected-file" data-tour="import-upload"><span className="selected-file__icon"><FileSpreadsheet size={24} /></span><div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to inspect</span></div><Button variant="tertiary" size="compact" onClick={() => inputRef.current?.click()}>Replace</Button><CheckCircle2 size={21} /></div>}{fileError && <InlineMessage tone="danger" title="Workbook not accepted">{fileError}</InlineMessage>}</>}
          {step === 1 && <><div className="import-stage__heading"><span className="stage-icon"><FileSpreadsheet size={23} /></span><div><p className="eyebrow">Step 2 of 6</p><h2>Inspect workbook structure</h2><p>Review detected sheets and records before mapping.</p></div></div><div className="inspection-grid"><div><strong>24</strong><span>Sheets detected</span></div><div><strong>752</strong><span>Requirement rows</span></div><div><strong>0</strong><span>Unknown sheets</span></div><div><strong>2</strong><span>Warnings</span></div></div><div className="inspection-list"><div><FileCheck2 size={18} /><span><strong>Leadership & Engagement</strong><small>68 rows · Valid structure</small></span><CheckCircle2 size={18} /></div><div><FileCheck2 size={18} /><span><strong>Planning</strong><small>94 rows · Valid structure</small></span><CheckCircle2 size={18} /></div><div><AlertCircle size={18} /><span><strong>Machine Safety</strong><small>2 blank guidance cells</small></span><span className="warning-label">Warning</span></div></div></>}
          {step === 2 && <><div className="import-stage__heading"><span className="stage-icon"><ArrowRight size={23} /></span><div><p className="eyebrow">Step 3 of 6</p><h2>Map workbook columns</h2><p>Confirm how source values map into governed master fields.</p></div></div><div className="mapping-table">{[["Requirement ID", "requirement_id", "OS 1.2.1"], ["Requirement text", "requirement_text", "Site leadership establishes..."], ["How to meet", "guidance", "Assign clear accountabilities..."], ["Evidence requirements", "expected_evidence", "Leadership matrix..."], ["Sub-section", "subsection", "1.2 Leadership commitment"]].map(([source, target, sample]) => <div key={source}><span><strong>{source}</strong><small>Source column</small></span><ArrowRight size={18} /><span><strong>{target}</strong><small>Target field</small></span><span className="mapping-sample">{sample}</span><CheckCircle2 size={18} /></div>)}</div></>}
          {step === 3 && <><div className="import-stage__heading"><span className="stage-icon"><ShieldCheck size={23} /></span><div><p className="eyebrow">Step 4 of 6</p><h2>Validation results</h2><p>Resolve blocking errors before import. Warnings may be accepted with review.</p></div></div><div className="validation-summary"><div className="validation-summary__success"><CheckCircle2 size={22} /><span><strong>748</strong> valid records</span></div><div className="validation-summary__warning"><AlertCircle size={22} /><span><strong>4</strong> warnings</span></div><div><Circle size={22} /><span><strong>0</strong> blocking errors</span></div></div><InlineMessage tone="warning" title="Four records need review">Two records have blank guidance and two reuse an existing display order. The import can continue without data loss.</InlineMessage><Button variant="secondary" icon={<Download size={17} />} onClick={() => downloadTextFile("EHSS_import_validation_report.csv", "row,severity,field,message\r\n214,Warning,guidance,Guidance is blank\r\n389,Warning,guidance,Guidance is blank\r\n521,Warning,display_order,Display order is reused\r\n522,Warning,display_order,Display order is reused")}>Download validation report</Button></>}
          {step === 4 && <><div className="import-stage__heading"><span className="stage-icon"><FileCheck2 size={23} /></span><div><p className="eyebrow">Step 5 of 6</p><h2>Confirm import</h2><p>Review the dry-run result before applying master data changes.</p></div></div><div className="dry-run-grid"><div><span className="dry-run-dot dry-run-dot--create" /><strong>18</strong><span>Create</span></div><div><span className="dry-run-dot dry-run-dot--update" /><strong>46</strong><span>Update</span></div><div><span className="dry-run-dot dry-run-dot--same" /><strong>688</strong><span>Unchanged</span></div><div><span className="dry-run-dot dry-run-dot--conflict" /><strong>0</strong><span>Conflicts</span></div></div><InlineMessage tone="info" title="Import scope">This action updates master requirements for all sites and writes an administrator audit record.</InlineMessage><label className="confirmation-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I reviewed the validation warnings and confirm this import scope.</span></label></>}
          {step === 5 && result && <div className="result-state"><span className="result-state__icon"><CheckCircle2 size={34} /></span><p className="eyebrow">Import complete</p><h2>Master data was processed successfully</h2><p>{result.created} records created, {result.updated} updated, and {result.unchanged} unchanged. Audit reference <strong>{result.id}</strong>.</p><div><Button variant="secondary" onClick={() => setHistoryOpen(true)}>View audit entry</Button><Button variant="primary" onClick={() => navigate("/admin/requirements")}>Open master requirements</Button><Button variant="tertiary" onClick={resetImport}>Import another file</Button></div></div>}
        </div>
        {step < 5 && <div className="import-card__footer"><Button variant="tertiary" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>Back</Button><Button variant="primary" onClick={advance} disabled={(step === 0 && !file) || (step === 4 && !confirmed)}>{step === 4 ? "Confirm import" : "Continue"} <ArrowRight size={17} /></Button></div>}
      </section>
      {historyOpen && <ImportHistoryDialog records={importHistory} onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}

function RequirementDialog({ item, onClose, onSave }: { item?: MasterRequirement; onClose: () => void; onSave: (item: MasterRequirement) => void }) {
  const [draft, setDraft] = useState<MasterRequirement>(item ?? { id: "", title: "", section: "", version: "v1", status: "Draft" });
  const [submitted, setSubmitted] = useState(false);
  const valid = Boolean(draft.id.trim() && draft.title.trim() && draft.section.trim() && /^v\d+$/i.test(draft.version.trim()));
  const update = (key: keyof MasterRequirement, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Close requirement editor" onClick={onClose} /><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="master-dialog-title"><div className="dialog__header"><div><p className="eyebrow">Governed content</p><h2 id="master-dialog-title">{item ? `Edit ${item.id}` : "Add requirement"}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div><div className="dialog-form form-grid"><label className={cx("field", submitted && !draft.id.trim() && "field--invalid")}><span>Requirement ID <b>Required</b></span><input value={draft.id} disabled={Boolean(item)} onChange={(event) => update("id", event.target.value)} placeholder="For example, OS 2.4.1" />{submitted && !draft.id.trim() && <small className="field-error">Enter a unique requirement ID.</small>}</label><label className={cx("field", submitted && !/^v\d+$/i.test(draft.version.trim()) && "field--invalid")}><span>Version <b>Required</b></span><input value={draft.version} onChange={(event) => update("version", event.target.value)} placeholder="v1" />{submitted && !/^v\d+$/i.test(draft.version.trim()) && <small className="field-error">Use a version such as v1 or v12.</small>}</label><label className={cx("field", "field--wide", submitted && !draft.title.trim() && "field--invalid")}><span>Requirement title <b>Required</b></span><textarea rows={3} value={draft.title} onChange={(event) => update("title", event.target.value)} />{submitted && !draft.title.trim() && <small className="field-error">Enter the requirement title.</small>}</label><label className={cx("field", submitted && !draft.section.trim() && "field--invalid")}><span>Section <b>Required</b></span><input value={draft.section} onChange={(event) => update("section", event.target.value)} />{submitted && !draft.section.trim() && <small className="field-error">Enter the governed section.</small>}</label><label className="field"><span>Status</span><select value={draft.status} onChange={(event) => update("status", event.target.value)}><option>Draft</option><option>Published</option></select></label></div><div className="dialog__footer"><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Check size={17} />} onClick={() => { setSubmitted(true); if (valid) onSave({ ...draft, id: draft.id.trim(), title: draft.title.trim(), section: draft.section.trim(), version: draft.version.trim() }); }}>{item ? "Save changes" : "Add requirement"}</Button></div></section></div>;
}

export function AdminRequirementsScreen() {
  const { masterRequirements, addMasterRequirement, updateMasterRequirement } = useAppState();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("All sections");
  const [status, setStatus] = useState("Published and draft");
  const [editing, setEditing] = useState<MasterRequirement | "new" | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const sections = [...new Set(masterRequirements.map((item) => item.section))];
  const rows = masterRequirements.filter((item) => (`${item.title} ${item.id}`.toLowerCase().includes(query.toLowerCase())) && (section === "All sections" || item.section === section) && (status === "Published and draft" || item.status === status));
  function save(item: MasterRequirement) {
    const duplicateId = editing === "new" && masterRequirements.some((record) => record.id.toLowerCase() === item.id.toLowerCase());
    if (duplicateId) { setFeedback(`Requirement ${item.id} already exists. Open it to edit the existing record.`); setEditing(null); return; }
    if (editing === "new") addMasterRequirement(item); else updateMasterRequirement(item);
    setFeedback(`${item.id} was ${editing === "new" ? "added" : "updated"}.`); setEditing(null);
  }
  return (
    <div className="page-container">
      <PageHeader eyebrow="Administration" title="Master requirements" description="Manage governed requirement, guidance, evidence, hierarchy, and version content." actions={<Button variant="primary" icon={<Plus size={18} />} onClick={() => setEditing("new")} data-tour="add-requirement">Add requirement</Button>} />
      {feedback ? <InlineMessage tone={feedback.includes("already exists") ? "warning" : "success"} title={feedback.includes("already exists") ? "Requirement not added" : "Master content saved"}>{feedback}</InlineMessage> : <InlineMessage tone="info" title="Protected master content">Only authorized administrators can edit these records. Site and regional users always see them as read-only.</InlineMessage>}
      <section className="table-card">
        <div className="dashboard-filter-bar" data-tour="requirement-filters"><label className="search-control"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ID or requirement" /></label><label className="select-control"><Filter size={18} /><select value={section} onChange={(event) => setSection(event.target.value)}>{["All sections", ...sections].map((value) => <option key={value}>{value}</option>)}</select></label><label className="select-control"><FileText size={18} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option>Published and draft</option><option>Published</option><option>Draft</option></select></label></div>
        <div className="table-card__header table-card__header--results"><div><p className="eyebrow">Governed content</p><h2>Requirements</h2></div><span>{rows.length} records shown</span></div>
        {rows.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>ID</th><th>Requirement</th><th>Section</th><th>Version</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td data-label="ID"><strong>{item.id}</strong></td><td data-label="Requirement"><strong>{item.title}</strong><span>Guidance and evidence requirements configured</span></td><td data-label="Section">{item.section}</td><td data-label="Version">{item.version}</td><td data-label="Status"><span className={cx("publish-badge", item.status === "Draft" && "publish-badge--draft")}>{item.status}</span></td><td data-label="Actions"><span className="row-actions row-actions--menu"><IconButton label={`Edit ${item.id}`} onClick={() => setEditing(item)}><Pencil size={17} /></IconButton><IconButton label={`More actions for ${item.id}`} onClick={() => setMenu(menu === item.id ? null : item.id)}><MoreHorizontal size={18} /></IconButton>{menu === item.id && <span className="row-menu"><button onClick={() => { updateMasterRequirement({ ...item, status: item.status === "Published" ? "Draft" : "Published" }); setFeedback(`${item.id} status changed to ${item.status === "Published" ? "Draft" : "Published"}.`); setMenu(null); }}>{item.status === "Published" ? "Move to draft" : "Publish"}</button><button onClick={() => { const copy = { ...item, id: `${item.id}-COPY-${Date.now().toString().slice(-4)}`, title: `${item.title} copy`, status: "Draft" as const }; addMasterRequirement(copy); setFeedback(`${item.id} was duplicated as a draft.`); setMenu(null); }}><Copy size={15} /> Duplicate</button></span>}</span></td></tr>)}</tbody></table></div> : <EmptyState icon={<Search size={27} />} title="No requirements match" description="Try another ID, title, section, or publishing state." />}
      </section>
      {editing && <RequirementDialog item={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}
