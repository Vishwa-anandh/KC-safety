import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ExternalLink,
  FileText,
  Link2,
  ListChecks,
  Menu,
  Paperclip,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAssessment } from "../model/useAssessment";
import { actionComplete, performanceForResponse, rollupPerformance } from "../../../shared/domain/assessment";
import { requirementRoute } from "../../../app/router/links";
import type { ActionItem, AssessmentQuestion, EvidenceItem, Requirement, ResponseValue } from "../../../shared/types";
import { Button, ConfirmDialog, IconButton, InlineMessage, PerformanceBadge, ProgressBar, SaveStatus } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

function requirementState(requirement: Requirement, currentId: string) {
  if (requirement.id === currentId) return "current";
  if (requirement.questions.every((question) => actionComplete(question.response, question.action))) return "complete";
  if (requirement.questions.some((question) => question.response === "no" || question.response === "partial")) return "gap";
  return "incomplete";
}

function NavigatorState({ state }: { state: string }) {
  if (state === "complete") return <CheckCircle2 size={17} className="nav-state nav-state--complete" />;
  if (state === "gap") return <AlertTriangle size={17} className="nav-state nav-state--gap" />;
  if (state === "current") return <span className="nav-state nav-state--current"><Circle size={12} fill="currentColor" /></span>;
  return <Circle size={16} className="nav-state nav-state--incomplete" />;
}

function AssessmentNavigator({
  requirements,
  current,
  onNavigate,
  onClose,
}: {
  requirements: Requirement[];
  current: Requirement;
  onNavigate: (requirement: Requirement) => void;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = requirements.filter((requirement) =>
    `${requirement.number} ${requirement.title} ${requirement.sectionName}`.toLowerCase().includes(query.toLowerCase()),
  );
  const completed = requirements.filter((requirement) => requirement.questions.every((question) => actionComplete(question.response, question.action))).length;
  const isIncomplete = (requirement: Requirement) => requirement.questions.some((question) => !actionComplete(question.response, question.action));
  const currentIndex = requirements.findIndex((requirement) => requirement.id === current.id);
  const ordered = [...requirements.slice(currentIndex + 1), ...requirements.slice(0, currentIndex + 1)];
  const nextIncomplete = ordered.find((requirement) => requirement.id !== current.id && isIncomplete(requirement));

  return (
    <aside className="assessment-navigator" aria-label="Assessment navigator">
      <div className="assessment-navigator__header">
        <div>
          <p className="eyebrow">Current section</p>
          <h2>{current.sectionName}</h2>
        </div>
        {onClose && <IconButton label="Close assessment navigator" onClick={onClose}><X size={19} /></IconButton>}
      </div>
      <ProgressBar value={Math.round((completed / requirements.length) * 100)} label="Requirements complete" />
      <label className="navigator-search">
        <Search size={17} />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a requirement" />
      </label>
      <div className="navigator-group">
        <div className="navigator-group__trigger" aria-expanded="true">
          <ChevronDown size={17} />
          <span>Assessment requirements</span>
          <small>{completed} of {requirements.length}</small>
        </div>
        <div className="navigator-items">
          {filtered.map((requirement) => {
            const state = requirementState(requirement, current.id);
            return (
              <button key={requirement.id} className={cx("navigator-item", state === "current" && "navigator-item--current")} onClick={() => onNavigate(requirement)}>
                <NavigatorState state={state} />
                <span><small>{requirement.number} · {requirement.sectionName}</small>{requirement.title}</span>
                <ChevronRight size={16} />
              </button>
            );
          })}
          {!filtered.length && <p className="navigator-empty">No requirements match your search.</p>}
        </div>
      </div>
      <Button className="next-incomplete" variant="secondary" icon={<ListChecks size={18} />} disabled={!nextIncomplete} onClick={() => nextIncomplete && onNavigate(nextIncomplete)}>
        Next incomplete
      </Button>
    </aside>
  );
}

function ResponseSelector({ value, onChange, questionId }: { value: ResponseValue; onChange: (value: Exclude<ResponseValue, null>) => void; questionId: string }) {
  const options: Array<{ value: Exclude<ResponseValue, null>; label: string; performance: string; description: string }> = [
    { value: "no", label: "No", performance: "Initial", description: "The requirement is not in place." },
    { value: "partial", label: "Partial", performance: "Emerging", description: "Some elements are in place." },
    { value: "yes", label: "Yes", performance: "Performing", description: "The requirement is fully in place." },
  ];
  return (
    <fieldset className="response-fieldset">
      <legend>Response <span>Choose one</span></legend>
      <div className="response-options">
        {options.map((option) => (
          <label key={option.value} className={cx("response-option", `response-option--${option.value}`, value === option.value && "response-option--selected")}>
            <input type="radio" name={`response-${questionId}`} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className="response-option__control">{value === option.value ? <Check size={15} /> : <Circle size={14} />}</span>
            <span className="response-option__copy"><strong>{option.label}</strong><small>{option.performance}</small><em>{option.description}</em></span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ActionEditor({ action, response, onChange }: { action?: ActionItem; response: ResponseValue; onChange: (action: ActionItem) => void }) {
  const required = response === "no" || response === "partial";
  if (!required && !action) return null;
  return (
    <div className={cx("action-editor", required ? "action-editor--required" : "action-editor--retained")}>
      <div className="action-editor__header">
        <div className="action-editor__icon"><AlertTriangle size={18} /></div>
        <div>
          <strong>{required ? "Corrective action required" : "Existing action retained"}</strong>
          <p>{required ? "No and Partial responses require both an action description and an owner." : "This action remains available even though the response is now Yes."}</p>
        </div>
      </div>
      <div className="form-grid form-grid--action">
        <label className={cx("field", "field--wide")}>
          <span>Action description {required && <b>Required</b>}</span>
          <textarea rows={3} value={action?.description ?? ""} placeholder="Describe the specific action needed to close this gap" onChange={(event) => onChange({ description: event.target.value, owner: action?.owner ?? "" })} />
        </label>
        <label className="field">
          <span>Action owner {required && <b>Required</b>}</span>
          <span className="field-control-with-icon">
            <UserRound size={17} />
            <input type="text" value={action?.owner ?? ""} placeholder="Search or enter owner" onChange={(event) => onChange({ description: action?.description ?? "", owner: event.target.value })} />
          </span>
        </label>
      </div>
    </div>
  );
}

function EvidencePanel({ evidence, onAdd, onView, onEdit, onDelete }: { evidence: EvidenceItem[]; onAdd: () => void; onView: (item: EvidenceItem) => void; onEdit: (item: EvidenceItem) => void; onDelete: (item: EvidenceItem) => void }) {
  return (
    <section className="evidence-card">
      <div className="section-title-row">
        <div><p className="eyebrow">Supporting material</p><h2>Attached evidence</h2><span>{evidence.length} items connected to this requirement</span></div>
        <Button variant="secondary" icon={<Plus size={17} />} onClick={onAdd}>Add evidence</Button>
      </div>
      {evidence.length ? (
        <div className="evidence-list">
          {evidence.map((item) => (
            <article className="evidence-item" key={item.id}>
              <div className={cx("evidence-item__icon", `evidence-item__icon--${item.type}`)}>{item.type === "file" ? <FileText size={20} /> : <Link2 size={20} />}</div>
              <button className="evidence-item__copy evidence-item__copy--button" onClick={() => onView(item)}>
                <strong>{item.title}</strong><span>{item.detail}</span><small>Added by {item.uploadedBy} · {item.uploadedAt}</small>
              </button>
              <div className="evidence-item__actions">
                <IconButton label={`Edit ${item.title}`} onClick={() => onEdit(item)}><Pencil size={17} /></IconButton>
                <IconButton label={`Delete ${item.title}`} onClick={() => onDelete(item)}><Trash2 size={17} /></IconButton>
                <IconButton label={`View ${item.title}`} onClick={() => onView(item)}><ExternalLink size={18} /></IconButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="evidence-empty"><Paperclip size={22} /><strong>No evidence attached yet</strong><span>Add a file or secure link to support this requirement.</span></div>
      )}
    </section>
  );
}

function GuidancePanel({ requirement }: { requirement: Requirement }) {
  return (
    <aside className="guidance-panel">
      <div className="guidance-panel__top"><div><p className="eyebrow">Read-only master content</p><h2>How to meet</h2></div><BookOpen size={20} /></div>
      <ul className="guidance-list">{requirement.guidance.map((item) => <li key={item}>{item}</li>)}</ul>
      <div className="expected-evidence">
        <div className="expected-evidence__title"><Paperclip size={18} /><h3>Expected evidence</h3></div>
        <ul>{requirement.expectedEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="master-protection-note"><ShieldCheck size={17} /><span>Managed by KC administrators</span></div>
      <InlineMessage tone="info" title="How this result is calculated">The requirement result is the lowest response below. No maps to Initial, Partial to Emerging, and Yes to Performing.</InlineMessage>
    </aside>
  );
}

function EvidenceDialog({ item, onClose, onSave }: { item?: EvidenceItem; onClose: () => void; onSave: (item: EvidenceItem) => void }) {
  const [type, setType] = useState<"file" | "link">(item?.type ?? "file");
  const [title, setTitle] = useState(item?.title ?? "");
  const [url, setUrl] = useState(item?.type === "link" ? item.detail : "");
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const validUrl = type !== "link" || /^https?:\/\//i.test(url.trim());
  const valid = Boolean(title.trim() && validUrl && (type === "link" || file || item?.type === "file"));

  return (
    <div className="dialog-layer" role="presentation">
      <button className="dialog-backdrop" onClick={onClose} aria-label="Close evidence dialog" />
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="evidence-dialog-title">
        <div className="dialog__header">
          <div><p className="eyebrow">Supporting material</p><h2 id="evidence-dialog-title">{item ? "Edit evidence" : "Add evidence"}</h2></div>
          <IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="evidence-type-tabs" role="tablist" aria-label="Evidence type">
          <button role="tab" aria-selected={type === "file"} onClick={() => setType("file")}><Upload size={18} /> Upload file</button>
          <button role="tab" aria-selected={type === "link"} onClick={() => setType("link")}><Link2 size={18} /> Add link</button>
        </div>
        <div className="dialog-form">
          <label className={cx("field", submitted && !title.trim() && "field--invalid")}>
            <span>Evidence title <b>Required</b></span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="For example, August review minutes" aria-invalid={submitted && !title.trim()} />
            {submitted && !title.trim() && <small className="field-error">Enter a clear evidence title.</small>}
          </label>
          {type === "file" ? (
            <>
              <input ref={fileInput} className="visually-hidden" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              <button type="button" className={cx("dropzone", submitted && !file && item?.type !== "file" && "dropzone--invalid")} onClick={() => fileInput.current?.click()}>
                <span className="dropzone__icon"><Upload size={23} /></span>
                <strong>{file?.name ?? (item?.type === "file" ? item.detail.split(" · ")[0] : "Choose a file")}</strong>
                <span>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB selected` : "PDF, Word, Excel, image, or other approved record"}</span>
              </button>
              {submitted && !file && item?.type !== "file" && <small className="field-error">Choose a file to upload.</small>}
            </>
          ) : (
            <label className={cx("field", submitted && !validUrl && "field--invalid")}>
              <span>Secure link <b>Required</b></span>
              <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" aria-invalid={submitted && !validUrl} />
              {submitted && !validUrl && <small className="field-error">Enter a complete link beginning with http:// or https://.</small>}
            </label>
          )}
        </div>
        <div className="dialog__footer">
          <Button variant="tertiary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={<Check size={17} />} onClick={() => {
            setSubmitted(true);
            if (!valid) return;
            const detail = type === "file"
              ? (file ? `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB` : item?.detail ?? "Evidence file")
              : url.trim();
            onSave({ id: item?.id ?? `ev-${Date.now()}`, type, title: title.trim(), detail, uploadedBy: "Rachel Morgan", uploadedAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) });
          }}>{item ? "Save changes" : "Add evidence"}</Button>
        </div>
      </section>
    </div>
  );
}

function EvidenceViewer({ item, onClose }: { item: EvidenceItem; onClose: () => void }) {
  const isLink = item.type === "link";
  return (
    <div className="dialog-layer" role="presentation">
      <button className="dialog-backdrop" onClick={onClose} aria-label="Close evidence details" />
      <section className="dialog dialog--compact" role="dialog" aria-modal="true" aria-labelledby="evidence-view-title">
        <div className="dialog__header"><div><p className="eyebrow">Evidence details</p><h2 id="evidence-view-title">{item.title}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
        <div className="evidence-preview"><span>{isLink ? <Link2 size={28} /> : <FileText size={28} />}</span><strong>{item.detail}</strong><small>Added by {item.uploadedBy} on {item.uploadedAt}</small></div>
        <div className="dialog__footer"><Button variant="tertiary" onClick={onClose}>Close</Button>{isLink && <Button variant="primary" icon={<ExternalLink size={17} />} onClick={() => window.open(item.detail, "_blank", "noopener,noreferrer")}>Open secure link</Button>}</div>
      </section>
    </div>
  );
}

export default function RequirementWorkspace() {
  const { sectionId, requirementId } = useParams();
  const navigate = useNavigate();
  const { requirements, updateQuestion, addEvidence, updateEvidence, removeEvidence } = useAssessment();
  const requirement = requirements.find((item) => item.id === requirementId && item.sectionId === sectionId);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "failed" | "attention">("saved");
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [evidenceEditor, setEvidenceEditor] = useState<EvidenceItem | null | "new">(null);
  const [evidenceViewer, setEvidenceViewer] = useState<EvidenceItem | null>(null);
  const [evidenceRemoving, setEvidenceRemoving] = useState<EvidenceItem | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentIndex = requirement ? requirements.findIndex((item) => item.id === requirement.id) : -1;
  const performance = useMemo(() => rollupPerformance(requirement?.questions.map((question) => question.response) ?? []), [requirement]);
  const answered = requirement?.questions.filter((question) => question.response).length ?? 0;

  if (!requirement) return <Navigate to="/assessment" replace />;

  function queueSavedState() {
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState("saved"), 500);
  }

  function changeQuestion(questionId: string, update: Partial<AssessmentQuestion>) {
    updateQuestion(requirement!.id, questionId, update);
    queueSavedState();
  }

  // Every requirement is always reachable — from the navigator, Next incomplete, or Previous/Next
  // requirement — regardless of whether the current requirement's action details are complete.
  // Incomplete No/Partial actions still surface as gaps elsewhere (Actions summary, dashboard),
  // they just no longer block moving around the assessment.
  function moveTo(target: Requirement) {
    setNavigatorOpen(false);
    setGuidanceOpen(false);
    navigate(requirementRoute(target));
  }

  const previous = requirements[currentIndex - 1];
  const next = requirements[currentIndex + 1];

  return (
    <div className="requirement-page">
      <div className="requirement-mobile-toolbar">
        <Button variant="secondary" icon={<Menu size={18} />} onClick={() => setNavigatorOpen(true)}>Requirements</Button>
        <Button variant="secondary" icon={<BookOpen size={18} />} onClick={() => setGuidanceOpen(true)}>Guidance</Button>
      </div>
      <div className="requirement-layout">
        <div className="requirement-layout__navigator"><AssessmentNavigator requirements={requirements} current={requirement} onNavigate={moveTo} /></div>
        <div className="requirement-main">
          <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/assessment">Self-assessment</Link><ChevronRight size={15} /><span>{requirement.sectionName}</span><ChevronRight size={15} /><span aria-current="page">{requirement.number}</span></nav>
          <header className="requirement-header">
            <div className="requirement-header__meta"><span className="requirement-id">{requirement.number}</span><span>{requirement.subsection}</span></div>
            <div className="requirement-header__title"><div><p className="eyebrow">Requirement</p><h1>{requirement.title}</h1></div><PerformanceBadge performance={performance} /></div>
            <p className="requirement-text">{requirement.requirementText}</p>
            <div className="requirement-header__footer"><span>{answered} of {requirement.questions.length} questions answered</span><span className="divider-dot" /><span>Result uses the lowest question level</span><span className="requirement-save"><SaveStatus state={saveState} /></span></div>
          </header>
          <section className="questions-section" aria-labelledby="questions-title">
            <div className="section-title-row"><div><p className="eyebrow">Assessment questions</p><h2 id="questions-title">Evaluate this requirement</h2></div><span className="question-count">{requirement.questions.length} questions</span></div>
            <div className="question-list">
              {requirement.questions.map((question) => (
                <article className="question-card" key={question.id} id={`question-${question.id}`}>
                  <div className="question-card__header"><span className="question-number">{question.number}</span><div><p>Question {question.number}</p><h3>{question.text}</h3></div><PerformanceBadge performance={performanceForResponse(question.response)} compact /></div>
                  <ResponseSelector questionId={question.id} value={question.response} onChange={(response) => changeQuestion(question.id, { response })} />
                  <ActionEditor action={question.action} response={question.response} onChange={(action) => changeQuestion(question.id, { action })} />
                </article>
              ))}
            </div>
          </section>
          <EvidencePanel evidence={requirement.evidence} onAdd={() => setEvidenceEditor("new")} onView={setEvidenceViewer} onEdit={setEvidenceEditor} onDelete={setEvidenceRemoving} />
          <footer className="requirement-footer">
            <Button variant="secondary" icon={<ArrowLeft size={18} />} disabled={!previous} onClick={() => previous && moveTo(previous)}>Previous requirement</Button>
            <div><SaveStatus state={saveState} /><Button variant="primary" disabled={!next} onClick={() => next && moveTo(next)} icon={<ArrowRight size={18} />} iconPosition="end">Next requirement</Button></div>
          </footer>
        </div>
        <div className="requirement-layout__guidance"><GuidancePanel requirement={requirement} /></div>
      </div>
      {navigatorOpen && <div className="sheet-layer"><button className="sheet-backdrop" aria-label="Close navigator" onClick={() => setNavigatorOpen(false)} /><div className="sheet sheet--left"><AssessmentNavigator requirements={requirements} current={requirement} onNavigate={moveTo} onClose={() => setNavigatorOpen(false)} /></div></div>}
      {guidanceOpen && <div className="sheet-layer"><button className="sheet-backdrop" aria-label="Close guidance" onClick={() => setGuidanceOpen(false)} /><div className="sheet sheet--right"><div className="sheet__close"><IconButton label="Close guidance" onClick={() => setGuidanceOpen(false)}><X size={20} /></IconButton></div><GuidancePanel requirement={requirement} /></div></div>}
      {evidenceEditor && <EvidenceDialog item={evidenceEditor === "new" ? undefined : evidenceEditor} onClose={() => setEvidenceEditor(null)} onSave={(item) => {
        if (evidenceEditor === "new") addEvidence(requirement.id, item); else updateEvidence(requirement.id, item);
        setEvidenceEditor(null);
        queueSavedState();
      }} />}
      {evidenceViewer && <EvidenceViewer item={evidenceViewer} onClose={() => setEvidenceViewer(null)} />}
      {evidenceRemoving && <ConfirmDialog eyebrow="Evidence" title={`Delete ${evidenceRemoving.title}?`} body="This evidence record will be removed from this requirement. This cannot be undone." confirmLabel="Delete evidence" cancelLabel="Keep evidence" onCancel={() => setEvidenceRemoving(null)} onConfirm={() => { removeEvidence(requirement.id, evidenceRemoving.id); queueSavedState(); setEvidenceRemoving(null); }} />}
    </div>
  );
}
