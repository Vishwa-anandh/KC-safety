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
import { useAuth } from "../../auth";
import { actionComplete, performanceForResponse, rollupPerformance } from "../../../shared/domain/assessment";
import { requirementRoute } from "../../../app/router/links";
import type { ActionItem, AssessmentQuestion, EvidenceItem, Requirement, ResponseValue } from "../../../shared/types";
import { Button, ConfirmDialog, IconButton, InlineMessage, PerformanceBadge, ProgressBar, SaveStatus, Select } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

function requirementState(requirement: Requirement, currentId: string) {
  if (requirement.id === currentId) return "current";
  if (requirement.questions.every((question) => actionComplete(question.response, question.action))) return "complete";
  if (requirement.questions.some((question) => question.response === "no" || question.response === "partial")) return "gap";
  return "incomplete";
}

function NavigatorState({ state }: { state: string }) {
  if (state === "complete") return <CheckCircle2 size={17} className={cx("nav-state [flex:0_0_auto] nav-state--complete [color:var(--success)]")} />;
  if (state === "gap") return <AlertTriangle size={17} className={cx("nav-state [flex:0_0_auto] nav-state--gap [color:var(--warning)]")} />;
  if (state === "current") return <span className={cx("nav-state [flex:0_0_auto] nav-state--current [display:grid] [width:19px] [height:19px] [place-items:center] [border-radius:50%] [background:var(--kc-600)] [color:#fff] [box-shadow:0_0_0_3px_var(--kc-200)]")}><Circle size={12} fill="currentColor" /></span>;
  return <Circle size={16} className={cx("nav-state [flex:0_0_auto] nav-state--incomplete [color:var(--neutral-400)]")} />;
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
    <aside className={cx("assessment-navigator [display:flex] [height:100%] [flex-direction:column] [overflow-y:auto] [border-right:1px_solid_var(--neutral-200)] [background:var(--surface-panel)] [padding:1rem] [.sheet_&]:[border:0]")} aria-label="Assessment navigator">
      <div className={cx("assessment-navigator__header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:0.75rem] [margin-bottom:1rem] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1rem]")}>
        <div>
          <p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Current section</p>
          <h2>{current.sectionName}</h2>
        </div>
        {onClose && <IconButton label="Close assessment navigator" onClick={onClose}><X size={19} /></IconButton>}
      </div>
      <ProgressBar value={Math.round((completed / requirements.length) * 100)} label="Requirements complete" />
      <label className={cx("navigator-search [display:flex] [min-height:40px] [align-items:center] [gap:0.45rem] [margin:1rem_0] [border:1px_solid_var(--neutral-300)] [border-radius:9px] [padding:0_0.65rem] [color:var(--neutral-500)] [&:focus-within]:[border-color:var(--kc-600)] [&:focus-within]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input]:[min-width:0] [&_input]:[flex:1] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[font-size:0.8rem]")}>
        <Search size={17} />
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a requirement" />
      </label>
      <div className={cx("navigator-group [flex:1]")}>
        <div className={cx("navigator-group__trigger [display:flex] [width:100%] [align-items:center] [border:0] [text-align:left] [gap:0.45rem] [background:transparent] [color:var(--neutral-700)] [padding:0.45rem_0.35rem] [font-size:0.74rem] [font-weight:700] [&_small]:[margin-left:auto] [&_small]:[color:var(--neutral-500)] [&_small]:[font-weight:500]")} aria-expanded="true">
          <ChevronDown size={17} />
          <span>Assessment requirements</span>
          <small>{completed} of {requirements.length}</small>
        </div>
        <div className={cx("navigator-items [display:grid] [gap:0.15rem] [margin-top:0.25rem]")}>
          {filtered.map((requirement) => {
            const state = requirementState(requirement, current.id);
            return (
              <button key={requirement.id} className={cx("navigator-item [display:flex] [width:100%] [align-items:center] [border:0] [text-align:left] [min-height:51px] [gap:0.6rem] [border-radius:9px] [background:transparent] [padding:0.45rem_0.5rem] [color:var(--neutral-700)] hover:[background:var(--neutral-50)] [&_>_span:nth-child(2)]:[display:grid] [&_>_span:nth-child(2)]:[min-width:0] [&_>_span:nth-child(2)]:[flex:1] [&_>_span:nth-child(2)]:[font-size:0.76rem] [&_>_span:nth-child(2)]:[font-weight:600] [&_>_span:nth-child(2)]:[line-height:1.25] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.64rem] [&_small]:[font-weight:600] [&_>_svg:last-child]:[color:var(--neutral-400)]", state === "current" && "navigator-item--current [background:var(--kc-100)] [border:1px_solid_var(--kc-200)] [color:var(--kc-900)] [font-weight:700] [box-shadow:inset_5px_0_0_var(--kc-600)]")} onClick={() => onNavigate(requirement)}>
                <NavigatorState state={state} />
                <span><small>{requirement.number} · {requirement.sectionName}</small>{requirement.title}</span>
                <ChevronRight size={16} />
              </button>
            );
          })}
          {!filtered.length && <p className={cx("navigator-empty [margin:0] [padding:1rem_0.75rem] [color:var(--neutral-500)] [font-size:0.76rem] [text-align:center]")}>No requirements match your search.</p>}
        </div>
      </div>
      <Button className={cx("next-incomplete [width:100%] [margin-top:1rem]")} variant="secondary" icon={<ListChecks size={18} />} disabled={!nextIncomplete} onClick={() => nextIncomplete && onNavigate(nextIncomplete)}>
        Next incomplete
      </Button>
    </aside>
  );
}

function ResponseSelector({ value, onChange, questionId }: { value: ResponseValue; onChange: (value: ResponseValue) => void; questionId: string }) {
  const options: Array<{ value: Exclude<ResponseValue, null>; label: string; performance: string; description: string }> = [
    { value: "no", label: "No", performance: "Initial", description: "The requirement is not in place." },
    { value: "partial", label: "Partial", performance: "Emerging", description: "Some elements are in place." },
    { value: "yes", label: "Yes", performance: "Performing", description: "The requirement is fully in place." },
  ];
  return (
    <fieldset className={cx("response-fieldset [min-width:0] [margin:1rem_0_0] [border:0] [padding:0] [&_legend]:[margin-bottom:0.5rem] [&_legend]:[color:var(--neutral-700)] [&_legend]:[font-size:0.75rem] [&_legend]:[font-weight:700] [&_legend_span]:[margin-left:0.35rem] [&_legend_span]:[color:var(--neutral-400)] [&_legend_span]:[font-weight:500]")}>
      <legend>Response <span>Choose one if assessed</span></legend>
      <div className={cx("response-options [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:0.65rem] max-[740px]:[grid-template-columns:1fr]")}>
        {options.map((option) => (
          <label key={option.value} className={cx("response-option [display:grid] [min-width:0] [min-height:86px] [grid-template-columns:auto_minmax(0,_1fr)] [align-items:start] [gap:0.55rem] [border:1px_solid_var(--neutral-300)] [border-radius:12px] [background:var(--surface-elevated)] [padding:0.7rem] [cursor:pointer] [transition:border-color_120ms_ease,_background_120ms_ease,_box-shadow_120ms_ease] hover:[border-color:var(--neutral-400)] hover:[background:var(--neutral-25)] [&_input]:[position:absolute] [&_input]:[width:1px] [&_input]:[height:1px] [&_input]:[opacity:0] [&:has(input:focus-visible)]:[outline:3px_solid_var(--kc-500)] [&:has(input:focus-visible)]:[outline-offset:3px] max-[740px]:[min-height:0]", `response-option--${option.value}`, value === option.value && "response-option--selected [.response-option--no&]:[border-color:var(--danger)] [.response-option--no&]:[background:var(--danger-surface)] [.response-option--no&]:[box-shadow:0_0_0_1px_var(--danger)] [.response-option--partial&]:[border-color:var(--warning)] [.response-option--partial&]:[background:var(--warning-surface)] [.response-option--partial&]:[box-shadow:0_0_0_1px_var(--warning)] [.response-option--yes&]:[border-color:var(--success)] [.response-option--yes&]:[background:var(--success-surface)] [.response-option--yes&]:[box-shadow:0_0_0_1px_var(--success)] [@media_(forced-colors:_active)]:[border:2px_solid_currentColor]")}>
            <input type="radio" name={`response-${questionId}`} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className={cx("response-option__control [display:grid] [width:24px] [height:24px] [place-items:center] [border:1px_solid_var(--neutral-300)] [border-radius:50%] [color:var(--neutral-400)] [.response-option--no.response-option--selected_&]:[border-color:var(--danger-solid)] [.response-option--no.response-option--selected_&]:[background:var(--danger-solid)] [.response-option--no.response-option--selected_&]:[color:#fff] [.response-option--partial.response-option--selected_&]:[border-color:var(--warning-solid)] [.response-option--partial.response-option--selected_&]:[background:var(--warning-solid)] [.response-option--partial.response-option--selected_&]:[color:#fff] [.response-option--yes.response-option--selected_&]:[border-color:var(--success-solid)] [.response-option--yes.response-option--selected_&]:[background:var(--success-solid)] [.response-option--yes.response-option--selected_&]:[color:#fff]")}>{value === option.value ? <Check size={15} /> : <Circle size={14} />}</span>
            <span className={cx("response-option__copy [display:grid] [min-width:0] [&_strong]:[color:var(--neutral-900)] [&_strong]:[font-size:0.82rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.68rem] [&_small]:[font-weight:600] [&_em]:[margin-top:0.25rem] [&_em]:[color:var(--neutral-500)] [&_em]:[font-size:0.67rem] [&_em]:[font-style:normal] [&_em]:[line-height:1.35] max-[740px]:[&_em]:[display:none]")}><strong>{option.label}</strong><small>{option.performance}</small><em>{option.description}</em></span>
          </label>
        ))}
      </div>
      {value && <button type="button" className={cx("response-clear [margin-top:0.65rem] [border:0] [background:transparent] [padding:0] [color:var(--kc-700)] [font-size:0.76rem] [font-weight:650] [cursor:pointer] hover:[color:var(--kc-900)] hover:[text-decoration:underline]")} onClick={() => onChange(null)}>Clear response</button>}
    </fieldset>
  );
}

function ActionEditor({ action, response, onChange, onRemove }: { action?: ActionItem; response: ResponseValue; onChange: (action: ActionItem) => void; onRemove: () => void }) {
  if (!response) return null;
  const requiredByResponse = response === "no" || response === "partial";
  if (!action) return <Button className={cx("action-editor-add [margin-top:1rem]")} variant="tertiary" icon={<Plus size={17} />} onClick={() => onChange({ description: "", owner: "", status: "Open", followUp: "" })}>Add corrective action <span>(optional)</span></Button>;
  const update = (change: Partial<ActionItem>) => onChange({
    description: action.description,
    owner: action.owner,
    status: action.status ?? "Open",
    followUp: action.followUp ?? "",
    ...change,
  });
  return (
    <div className={cx("action-editor [margin-top:1rem] [border:1px_solid] [border-radius:var(--radius-lg)] [padding:0.9rem] action-editor--optional [border-color:var(--neutral-200)]! [background:var(--neutral-50)]")}>
      <div className={cx("action-editor__header [display:flex] [gap:0.6rem] [&_strong]:[font-size:0.8rem] [&_p]:[margin-top:0.12rem] [&_p]:[color:var(--neutral-600)] [&_p]:[font-size:0.72rem]")}>
        <div className={cx("action-editor__icon [color:var(--warning)]")}><AlertTriangle size={18} /></div>
        <div>
          <strong>Corrective action</strong>
          <p>{requiredByResponse ? "Created automatically from this assessment gap and tracked in Actions summary." : "Optional supporting action for this assessment response."}</p>
        </div>
        {!requiredByResponse && <Button variant="tertiary" onClick={onRemove}>Remove action</Button>}
      </div>
      <div className={cx("form-grid [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:1rem_1.15rem] [padding:1.2rem] max-[740px]:[grid-template-columns:1fr] form-grid--action [grid-template-columns:1.6fr_1fr] [padding:0.9rem_0_0] max-[740px]:[grid-template-columns:1fr]")}>
        <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", "field--wide [grid-column:1_/_-1]")}>
          <span>Action description</span>
          <textarea rows={3} value={action.description} placeholder="Describe the specific action needed to close this gap" onChange={(event) => update({ description: event.target.value })} />
        </label>
        <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]")}>
          <span>Action owner</span>
          <span className={cx("field-control-with-icon [position:relative] [display:flex] [align-items:center] [&_>_svg]:[position:absolute] [&_>_svg]:[left:0.75rem] [&_>_svg]:[color:var(--neutral-500)] [&_input]:[padding-left:2.25rem]")}>
            <UserRound size={17} />
            <input type="text" value={action.owner} placeholder="Search or enter owner" onChange={(event) => update({ owner: event.target.value })} />
          </span>
        </label>
        <div className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]")}>
          <span>Action status</span>
          <Select label="Action status" value={action.status ?? "Open"} onChange={(value) => update({ status: value as ActionItem["status"] })} options={[{ value: "Open", label: "Open" }, { value: "In progress", label: "In progress" }, { value: "Complete", label: "Complete" }]} />
        </div>
        <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", "field--wide [grid-column:1_/_-1]")}>
          <span>Follow-up</span>
          <textarea rows={2} value={action.followUp ?? ""} placeholder="Add the next step, due-date note, or follow-up update" onChange={(event) => update({ followUp: event.target.value })} />
        </label>
      </div>
    </div>
  );
}

// Kept temporarily for backward-compatible component extraction; site-user rendering is now
// question-scoped and does not invoke this legacy requirement-level panel.
export function EvidencePanel({ evidence, onAdd, onView, onEdit, onDelete }: { evidence: EvidenceItem[]; onAdd: () => void; onView: (item: EvidenceItem) => void; onEdit: (item: EvidenceItem) => void; onDelete: (item: EvidenceItem) => void }) {
  return (
    <section className={cx("evidence-card [margin-top:1.5rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [padding:1rem] [box-shadow:var(--shadow-1)]")}>
      <div className={cx("section-title-row [display:flex] [align-items:flex-end] [justify-content:space-between] [gap:1rem] [margin-bottom:1rem] [&_h2]:[margin-top:0.25rem] [&_>_div_>_span]:[color:var(--neutral-500)] [&_>_div_>_span]:[font-size:0.85rem] [&_>_span]:[color:var(--neutral-500)] [&_>_span]:[font-size:0.85rem] [.site-support-details__content_&]:[margin-bottom:1rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column]")}>
        <div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Supporting material</p><h2>Attached evidence</h2><span>{evidence.length} items connected to this requirement</span></div>
        <Button variant="secondary" icon={<Plus size={17} />} onClick={onAdd}>Add evidence</Button>
      </div>
      {evidence.length ? (
        <div className={cx("evidence-list [display:grid] [gap:0.55rem]")}>
          {evidence.map((item) => (
            <article className={cx("evidence-item [display:grid] [grid-template-columns:auto_minmax(0,_1fr)_auto] [align-items:center] [gap:0.7rem] [border:1px_solid_var(--neutral-200)] [border-radius:11px] [background:var(--neutral-25)] [padding:0.7rem] max-[740px]:[grid-template-columns:auto_minmax(0,_1fr)] max-[720px]:[grid-template-columns:auto_minmax(0,_1fr)]")} key={item.id}>
              <div className={cx("evidence-item__icon [display:grid] [width:39px] [height:39px] [place-items:center] [border-radius:10px]", `evidence-item__icon--${item.type}`)}>{item.type === "file" ? <FileText size={20} /> : <Link2 size={20} />}</div>
              <button className={cx("evidence-item__copy [display:grid] [min-width:0] [&_strong]:[font-size:0.8rem] [&_span]:[overflow:hidden] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.68rem] [&_span]:[text-overflow:ellipsis] [&_span]:[white-space:nowrap] [&_small]:[overflow:hidden] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.68rem] [&_small]:[text-overflow:ellipsis] [&_small]:[white-space:nowrap] evidence-item__copy--button [min-width:0] [border:0] [outline:0] [background:transparent] [color:inherit] [padding:0] [text-align:left] [&:hover_strong]:[color:var(--kc-700)] [&:focus-visible_strong]:[color:var(--kc-700)]")} onClick={() => onView(item)}>
                <strong>{item.title}</strong><span>{item.detail}</span><small>Added by {item.uploadedBy} · {item.uploadedAt}</small>
              </button>
              <div className={cx("evidence-item__actions [display:flex] [align-items:center] [gap:0.15rem] max-[720px]:[grid-column:2] max-[720px]:[justify-self:start]")}>
                <IconButton label={`Edit ${item.title}`} onClick={() => onEdit(item)}><Pencil size={17} /></IconButton>
                <IconButton label={`Delete ${item.title}`} onClick={() => onDelete(item)}><Trash2 size={17} /></IconButton>
                <IconButton label={`View ${item.title}`} onClick={() => onView(item)}><ExternalLink size={18} /></IconButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={cx("evidence-empty [display:grid] [min-height:150px] [place-items:center] [align-content:center] [gap:0.35rem] [border:1px_dashed_var(--neutral-300)] [border-radius:var(--radius-lg)] [background:var(--neutral-25)] [color:var(--neutral-500)] [text-align:center] [&_svg]:[color:var(--kc-600)] [&_strong]:[color:var(--neutral-800)] [&_strong]:[font-size:0.86rem] [&_span]:[font-size:0.74rem]")}><Paperclip size={22} /><strong>No evidence attached yet</strong><span>Add a file or secure link to support this requirement.</span></div>
      )}
    </section>
  );
}

function QuestionEvidenceAttachments({
  evidence,
  questionNumber,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: {
  evidence: EvidenceItem[];
  questionNumber: string;
  onAdd: () => void;
  onView: (item: EvidenceItem) => void;
  onEdit: (item: EvidenceItem) => void;
  onDelete: (item: EvidenceItem) => void;
}) {
  return (
    <div className={cx("question-evidence [display:grid] [gap:0.5rem] [margin:0.85rem_0_0] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-md)] [background:var(--surface-elevated)] [padding:0.75rem_0.9rem] [&_ul]:[display:grid] [&_ul]:[gap:0.3rem] [&_ul]:[margin:0] [&_ul]:[padding-left:1.1rem] [&_ul]:[color:var(--neutral-600)] [&_ul]:[font-size:0.76rem] [&_ul]:[line-height:1.5] question-evidence--attachments [background:var(--kc-50)]")}>
      <div className={cx("question-evidence__attachments-header [display:flex] [flex-wrap:wrap] [align-items:center] [justify-content:space-between] [gap:0.65rem]")}>
        <span className={cx("question-evidence__title [&_small]:[margin-left:auto] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.66rem] [&_small]:[font-weight:500] [&_small]:[text-transform:none] [&_small]:[letter-spacing:normal] [display:flex] [align-items:center] [gap:0.4rem] [color:var(--kc-700)] [font-size:0.72rem] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.02em]")}><Paperclip size={14} /> Evidence attached to Question {questionNumber}</span>
        <Button variant="tertiary" icon={<Plus size={15} />} onClick={onAdd}>Add evidence</Button>
      </div>
      {evidence.length ? <div className={cx("question-evidence__attachments-list [display:grid] [gap:0.35rem]")}>{evidence.map((item) => (
        <div className={cx("question-evidence__attachment [display:flex] [align-items:center] [gap:0.6rem] [border:1px_solid_var(--neutral-200)] [border-radius:9px] [background:var(--surface-panel)] [padding:0.45rem_0.55rem]")} key={item.id}>
          <button type="button" className={cx("question-evidence__attachment-copy [display:grid] [min-width:0] [flex:1] [border:0] [background:transparent] [padding:0] [color:var(--neutral-800)] [text-align:left] [cursor:pointer] [&_strong]:[overflow:hidden] [&_strong]:[text-overflow:ellipsis] [&_strong]:[white-space:nowrap] [&_small]:[overflow:hidden] [&_small]:[text-overflow:ellipsis] [&_small]:[white-space:nowrap] [&_strong]:[font-size:0.76rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.68rem]")} onClick={() => onView(item)}><strong>{item.title}</strong><small>{item.detail}</small></button>
          <span className={cx("question-evidence__attachment-actions [display:flex] [flex:0_0_auto] [gap:0.15rem]")}><IconButton label={`Edit ${item.title}`} onClick={() => onEdit(item)}><Pencil size={15} /></IconButton><IconButton label={`Delete ${item.title}`} onClick={() => onDelete(item)}><Trash2 size={15} /></IconButton></span>
        </div>
      ))}</div> : <p className={cx("question-evidence__attachment-empty [margin:0] [color:var(--neutral-500)] [font-size:0.74rem]")}>No evidence attached yet. Add a file or secure link for this question.</p>}
    </div>
  );
}

function GuidancePanel({ requirement, onCollapse }: { requirement: Requirement; onCollapse?: () => void }) {
  return (
    <aside className={cx("guidance-panel [height:100%] [overflow-y:auto] [border-left:1px_solid_var(--neutral-200)] [background:linear-gradient(180deg,_var(--kc-50),_var(--surface-panel)_14rem)] [padding:1.15rem] [.sheet_&]:[border:0]")}>
      <div className={cx("guidance-panel__top [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:0.7rem] [margin-bottom:1rem] [color:var(--kc-700)] [&_h2]:[margin-top:0.15rem] [&_h2]:[color:var(--neutral-900)] [&_h2]:[font-size:1.05rem]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Read-only master content</p><h2>How to meet</h2></div><div className={cx("guidance-panel__top-actions [display:flex] [align-items:center] [gap:0.35rem]")}><BookOpen size={20} />{onCollapse && <IconButton label="Minimize guidance panel" onClick={onCollapse}><ChevronRight size={18} /></IconButton>}</div></div>
      <ul className={cx("guidance-list [display:grid] [gap:0.75rem] [margin:1rem_0_0] [padding-left:1.1rem] [color:var(--neutral-700)] [font-size:0.79rem] [line-height:1.55] [&_li::marker]:[color:var(--kc-600)]")}>{requirement.guidance.map((item) => <li key={item}>{item}</li>)}</ul>
      <div className={cx("expected-evidence [&_ul]:[display:grid] [&_ul]:[gap:0.55rem] [&_ul]:[margin:1rem_0_0] [&_ul]:[padding-left:1.1rem] [&_ul]:[color:var(--neutral-700)] [&_ul]:[font-size:0.75rem] [&_ul]:[line-height:1.55] [margin-top:1.4rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-elevated)] [padding:0.9rem] [box-shadow:var(--shadow-1)] [&_h3]:[color:var(--neutral-800)] [&_h3]:[font-size:0.88rem] [&_ul]:[margin-top:0.7rem]")}>
        <div className={cx("expected-evidence__title [display:flex] [align-items:center] [gap:0.5rem] [color:var(--kc-700)]")}><Paperclip size={18} /><h3>Expected evidence</h3></div>
        <ul>{requirement.expectedEvidence.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className={cx("master-protection-note [display:flex] [align-items:center] [gap:0.4rem] [margin-top:1rem] [color:var(--neutral-500)] [font-size:0.7rem]")}><ShieldCheck size={17} /><span>Managed by KC administrators</span></div>
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
    <div className={cx("dialog-layer [position:fixed] [z-index:100] [inset:0] [display:grid] [place-items:center]")} role="presentation">
      <button className={cx("dialog-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} onClick={onClose} aria-label="Close evidence dialog" />
      <section className={cx("dialog [position:relative] [width:min(560px,_calc(100%_-_2rem))] [max-height:calc(100vh_-_2rem)] [overflow-y:auto] [border:1px_solid_var(--border-glass)] [border-radius:var(--radius-xl)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:dialog-in_180ms_ease-out]")} role="dialog" aria-modal="true" aria-labelledby="evidence-dialog-title">
        <div className={cx("dialog__header [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [padding:1rem_1.1rem] [border-bottom:1px_solid_var(--neutral-200)] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.2rem]")}>
          <div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Supporting material</p><h2 id="evidence-dialog-title">{item ? "Edit evidence" : "Add evidence"}</h2></div>
          <IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className={cx("evidence-type-tabs [display:grid] [grid-template-columns:1fr_1fr] [margin:1rem_1.1rem_0] [border:1px_solid_var(--neutral-200)] [border-radius:11px] [background:var(--neutral-100)] [padding:0.2rem] [&_button]:[display:flex] [&_button]:[min-height:40px] [&_button]:[align-items:center] [&_button]:[justify-content:center] [&_button]:[gap:0.45rem] [&_button]:[border:0] [&_button]:[border-radius:8px] [&_button]:[background:transparent] [&_button]:[color:var(--neutral-600)] [&_button]:[font-size:0.82rem] [&_button]:[font-weight:650] [&_button[aria-selected='true']]:[background:var(--surface-elevated)] [&_button[aria-selected='true']]:[color:var(--kc-800)] [&_button[aria-selected='true']]:[box-shadow:var(--shadow-1)]")} role="tablist" aria-label="Evidence type">
          <button role="tab" aria-selected={type === "file"} onClick={() => setType("file")}><Upload size={18} /> Upload file</button>
          <button role="tab" aria-selected={type === "link"} onClick={() => setType("link")}><Link2 size={18} /> Add link</button>
        </div>
        <div className={cx("dialog-form [display:grid] [gap:1rem] [padding:1.1rem]")}>
          <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", submitted && !title.trim() && "field--invalid [&_input]:[border-color:var(--danger)]! [&_input]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_textarea]:[border-color:var(--danger)]! [&_textarea]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_select]:[border-color:var(--danger)]! [&_select]:[box-shadow:0_0_0_3px_var(--danger-surface)]")}>
            <span>Evidence title <b>Required</b></span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="For example, August review minutes" aria-invalid={submitted && !title.trim()} />
            {submitted && !title.trim() && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Enter a clear evidence title.</small>}
          </label>
          {type === "file" ? (
            <>
              <input ref={fileInput} className={cx("visually-hidden [position:absolute]! [width:1px]! [height:1px]! [padding:0]! [margin:-1px]! [overflow:hidden]! [clip:rect(0,_0,_0,_0)]! [white-space:nowrap]! [border:0]!")} type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              <button type="button" className={cx("dropzone [display:grid] [width:calc(100%_-_2.2rem)] [min-height:170px] [place-items:center] [align-content:center] [gap:0.45rem] [margin:1rem_1.1rem] [border:1.5px_dashed_var(--kc-300)] [border-radius:var(--radius-lg)] [background:var(--kc-50)] [color:var(--neutral-700)] [padding:1rem] hover:[border-color:var(--kc-600)] hover:[background:var(--kc-100)] [&_strong]:[font-size:0.9rem] [&_span:last-child]:[color:var(--neutral-500)] [&_span:last-child]:[font-size:0.72rem]", submitted && !file && item?.type !== "file" && "dropzone--invalid [border-color:var(--danger)]! [box-shadow:0_0_0_3px_var(--danger-surface)]")} onClick={() => fileInput.current?.click()}>
                <span className={cx("dropzone__icon [display:grid] [width:48px] [height:48px] [place-items:center] [border-radius:14px] [background:var(--surface-elevated)] [color:var(--kc-700)] [box-shadow:var(--shadow-1)]")}><Upload size={23} /></span>
                <strong>{file?.name ?? (item?.type === "file" ? item.detail.split(" · ")[0] : "Choose a file")}</strong>
                <span>{file ? `${Math.max(1, Math.round(file.size / 1024))} KB selected` : "PDF, Word, Excel, image, or other approved record"}</span>
              </button>
              {submitted && !file && item?.type !== "file" && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Choose a file to upload.</small>}
            </>
          ) : (
            <label className={cx("field [display:grid] [min-width:0] [gap:0.4rem] [&_>_span:first-child]:[display:flex] [&_>_span:first-child]:[align-items:center] [&_>_span:first-child]:[justify-content:space-between] [&_>_span:first-child]:[color:var(--neutral-700)] [&_>_span:first-child]:[font-size:0.78rem] [&_>_span:first-child]:[font-weight:650] [&_b]:[color:var(--danger)] [&_b]:[font-size:0.64rem] [&_b]:[letter-spacing:0.01em] [&_input]:[width:100%] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:var(--radius-md)] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.75rem] [&_input]:[font-size:0.86rem] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_var(--neutral-300)] [&_textarea]:[border-radius:var(--radius-md)] [&_textarea]:[outline:0] [&_textarea]:[background:var(--surface-input)] [&_textarea]:[color:var(--neutral-900)] [&_textarea]:[padding:0.68rem_0.75rem] [&_textarea]:[font-size:0.86rem] [&_textarea]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input]:[min-height:42px] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.5] [&_input:focus]:[border-color:var(--kc-600)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_textarea:focus]:[border-color:var(--kc-600)] [&_textarea:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [.requirement-header_>_&]:[margin-top:1rem]", submitted && !validUrl && "field--invalid [&_input]:[border-color:var(--danger)]! [&_input]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_textarea]:[border-color:var(--danger)]! [&_textarea]:[box-shadow:0_0_0_3px_var(--danger-surface)] [&_select]:[border-color:var(--danger)]! [&_select]:[box-shadow:0_0_0_3px_var(--danger-surface)]")}>
              <span>Secure link <b>Required</b></span>
              <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" aria-invalid={submitted && !validUrl} />
              {submitted && !validUrl && <small className={cx("field-error [display:block] [margin-top:0.35rem] [color:var(--danger)] [font-size:0.7rem] [font-weight:620]")}>Enter a complete link beginning with http:// or https://.</small>}
            </label>
          )}
        </div>
        <div className={cx("dialog__footer [display:flex] [align-items:center] [justify-content:flex-end] [gap:1rem] [padding:1rem_1.1rem] [border-top:1px_solid_var(--neutral-200)] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column-reverse]")}>
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
    <div className={cx("dialog-layer [position:fixed] [z-index:100] [inset:0] [display:grid] [place-items:center]")} role="presentation">
      <button className={cx("dialog-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} onClick={onClose} aria-label="Close evidence details" />
      <section className={cx("dialog [position:relative] [width:min(560px,_calc(100%_-_2rem))] [max-height:calc(100vh_-_2rem)] [overflow-y:auto] [border:1px_solid_var(--border-glass)] [border-radius:var(--radius-xl)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:dialog-in_180ms_ease-out] dialog--compact [width:min(470px,_calc(100%_-_2rem))]")} role="dialog" aria-modal="true" aria-labelledby="evidence-view-title">
        <div className={cx("dialog__header [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [padding:1rem_1.1rem] [border-bottom:1px_solid_var(--neutral-200)] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.2rem]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Evidence details</p><h2 id="evidence-view-title">{item.title}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
        <div className={cx("evidence-preview [display:grid] [justify-items:center] [gap:0.5rem] [margin:1.1rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--neutral-50)] [padding:1.5rem] [text-align:center] [&_>_span]:[display:grid] [&_>_span]:[width:58px] [&_>_span]:[height:58px] [&_>_span]:[place-items:center] [&_>_span]:[border-radius:16px] [&_>_span]:[background:var(--kc-50)] [&_>_span]:[color:var(--kc-700)] [&_strong]:[max-width:100%] [&_strong]:[overflow-wrap:anywhere] [&_small]:[color:var(--neutral-500)]")}><span>{isLink ? <Link2 size={28} /> : <FileText size={28} />}</span><strong>{item.detail}</strong><small>Added by {item.uploadedBy} on {item.uploadedAt}</small></div>
        <div className={cx("dialog__footer [display:flex] [align-items:center] [justify-content:flex-end] [gap:1rem] [padding:1rem_1.1rem] [border-top:1px_solid_var(--neutral-200)] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column-reverse]")}><Button variant="tertiary" onClick={onClose}>Close</Button>{isLink && <Button variant="primary" icon={<ExternalLink size={17} />} onClick={() => window.open(item.detail, "_blank", "noopener,noreferrer")}>Open secure link</Button>}</div>
      </section>
    </div>
  );
}

export default function RequirementWorkspace() {
  const { sectionId, requirementId } = useParams();
  const navigate = useNavigate();
  const { requirements, updateQuestion, addEvidence, updateEvidence, removeEvidence } = useAssessment();
  const { user } = useAuth();
  const requirement = requirements.find((item) => item.id === requirementId && item.sectionId === sectionId);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "failed" | "attention">("saved");
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [guidanceMinimized, setGuidanceMinimized] = useState(true);
  const [evidenceEditor, setEvidenceEditor] = useState<{ mode: "new"; questionId: string } | { mode: "edit"; item: EvidenceItem } | null>(null);
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
    updateQuestion(requirement!.id, questionId, update, user?.name);
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
    <div className={cx("requirement-page [min-width:0]")}>
      <div className={cx("requirement-mobile-toolbar [display:none] max-[1500px]:[position:sticky] max-[1500px]:[z-index:8] max-[1500px]:[top:var(--content-offset)] max-[1500px]:[display:flex] max-[1500px]:[justify-content:flex-end] max-[1500px]:[gap:0.55rem] max-[1500px]:[border-bottom:1px_solid_var(--neutral-200)] max-[1500px]:[background:var(--surface-mobile-bar)] max-[1500px]:[padding:0.55rem_1rem] max-[1500px]:[backdrop-filter:blur(15px)] max-[1100px]:[top:var(--content-offset)] max-[1100px]:[justify-content:space-between]")}>
        <Button variant="secondary" icon={<Menu size={18} />} onClick={() => setNavigatorOpen(true)}>Requirements</Button>
        <Button variant="secondary" icon={<BookOpen size={18} />} onClick={() => setGuidanceOpen(true)}>Guidance</Button>
      </div>
      <div className={cx("requirement-layout [display:grid] [width:100%] [min-width:0] [min-height:calc(100vh_-_var(--content-offset))] [grid-template-columns:400px_minmax(500px,_1fr)_320px] max-[1500px]:[grid-template-columns:320px_minmax(500px,_1fr)] max-[1100px]:[display:block]", guidanceMinimized && "requirement-layout--guidance-minimized [grid-template-columns:400px_minmax(500px,_1fr)_54px]!")}>
        <div className={cx("requirement-layout__navigator [position:sticky] [top:var(--content-offset)] [height:calc(100vh_-_var(--content-offset))] [align-self:start] max-[1500px]:[top:calc(var(--content-offset)_+_55px)] max-[1500px]:[height:calc(100vh_-_var(--content-offset)_-_55px)] max-[1100px]:[display:none]")}><AssessmentNavigator requirements={requirements} current={requirement} onNavigate={moveTo} /></div>
        <div className={cx("requirement-main [min-width:0] [padding:1.5rem_var(--page-gutter)_4rem] max-[740px]:[padding:1rem_0.85rem_3rem]")}>
          <nav className={cx("breadcrumbs [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.35rem] [margin-bottom:1rem] [color:var(--neutral-500)] [font-size:0.72rem] [&_a]:[color:var(--kc-700)] [&_a]:[font-weight:600]")} aria-label="Breadcrumb"><Link to="/assessment">Self-assessment</Link><ChevronRight size={15} /><span>{requirement.sectionName}</span><ChevronRight size={15} /><span aria-current="page">{requirement.number}</span></nav>
          <header className={cx("requirement-header [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-xl)] [background:radial-gradient(circle_at_95%_0%,_rgb(var(--accent-soft-rgb)_/_0.12),_transparent_15rem),_var(--surface-panel)] [padding:1.2rem_1.25rem] [box-shadow:var(--shadow-1)] max-[740px]:[padding:1rem]")}>
            <div className={cx("requirement-header__meta [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.6rem] [color:var(--neutral-500)] [font-size:0.72rem]")}><span className={cx("requirement-id [border:1px_solid_var(--kc-200)] [border-radius:999px] [background:var(--kc-50)] [color:var(--kc-800)] [padding:0.22rem_0.5rem] [font-weight:750]")}>{requirement.number}</span><span>{requirement.subsection}</span></div>
            <div className={cx("requirement-header__title [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [margin-top:0.8rem] [&_>_div:first-child]:[flex:1] [&_>_div:first-child]:[min-width:0] [&_h1]:[max-width:720px] [&_h1]:[margin-top:0.2rem] [&_h1]:[font-size:clamp(1.45rem,_2.6vw,_1.9rem)] max-[740px]:[display:grid]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Requirement</p><h1>{requirement.title}</h1></div><PerformanceBadge performance={performance} /></div>
            <p className={cx("requirement-text [max-width:820px] [margin-top:0.9rem] [color:var(--neutral-700)] [font-size:0.92rem] [line-height:1.65]")}>{requirement.requirementText}</p>
            <div className={cx("requirement-header__footer [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.6rem] [margin-top:1rem] [border-top:1px_solid_var(--neutral-100)] [padding-top:0.75rem] [color:var(--neutral-500)] [font-size:0.72rem]")}><span>{answered} of {requirement.questions.length} questions answered</span><span className={cx("divider-dot [width:3px] [height:3px] [border-radius:50%] [background:var(--neutral-400)] max-[740px]:[display:none]")} /><span>Result uses the lowest question level</span><span className={cx("requirement-save [margin-left:auto] max-[740px]:[display:none]")}><SaveStatus state={saveState} /></span></div>
          </header>
          <section className={cx("questions-section [margin-top:1.5rem]")} aria-labelledby="questions-title">
            <div className={cx("section-title-row [display:flex] [align-items:flex-end] [justify-content:space-between] [gap:1rem] [margin-bottom:1rem] [&_h2]:[margin-top:0.25rem] [&_>_div_>_span]:[color:var(--neutral-500)] [&_>_div_>_span]:[font-size:0.85rem] [&_>_span]:[color:var(--neutral-500)] [&_>_span]:[font-size:0.85rem] [.site-support-details__content_&]:[margin-bottom:1rem] max-[740px]:[align-items:flex-start] max-[740px]:[flex-direction:column]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Assessment questions</p><h2 id="questions-title">Evaluate this requirement</h2></div><span className={cx("question-count [border:1px_solid_var(--neutral-200)] [border-radius:999px] [background:var(--surface-elevated)] [padding:0.35rem_0.6rem] [font-size:0.72rem] [font-weight:650] [.history-list_article_.import-preview-questions__header_&]:[flex:none] [.history-list_article_.import-preview-questions__header_&]:[overflow:visible] [.history-list_article_.import-preview-questions__header_&]:[color:var(--neutral-700)] [.history-list_article_.import-preview-questions__header_&]:[font-size:0.72rem] [.history-list_article_.import-preview-questions__header_&]:[white-space:nowrap]")}>{requirement.questions.length} questions</span></div>
            <div className={cx("question-list [display:grid] [gap:1rem]")}>
              {requirement.questions.map((question) => (
                <article className={cx("question-card [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-panel)] [padding:1.1rem] [box-shadow:var(--shadow-1)] max-[740px]:[padding:0.9rem]")} key={question.id} id={`question-${question.id}`}>
                  <div className={cx("question-card__header [display:grid] [grid-template-columns:auto_minmax(0,_1fr)_auto] [align-items:start] [gap:0.8rem] [&_p]:[color:var(--neutral-500)] [&_p]:[font-size:0.68rem] [&_p]:[font-weight:600] [&_h3]:[max-width:780px] [&_h3]:[margin-top:0.2rem] [&_h3]:[font-size:0.95rem] [&_h3]:[line-height:1.5] max-[740px]:[grid-template-columns:auto_minmax(0,_1fr)]")}><span className={cx("question-number [display:grid] [width:31px] [height:31px] [place-items:center] [border-radius:9px] [background:var(--kc-50)] [color:var(--kc-800)] [font-size:0.8rem] [font-weight:750] [.history-list_article_.import-preview-question-list_&]:[overflow:visible] [.history-list_article_.import-preview-question-list_&]:[color:var(--kc-800)] [.history-list_article_.import-preview-question-list_&]:[font-size:0.8rem] [.history-list_article_.import-preview-question-list_&]:[white-space:nowrap]")}>{question.number}</span><div><p>Question {question.number}</p><h3>{question.text}</h3></div><PerformanceBadge performance={performanceForResponse(question.response)} compact /></div>
                  {Boolean(question.evidenceRequired ?? question.expectedEvidence?.length) && (
                    <>
                      <div className={cx("question-evidence [display:grid] [gap:0.5rem] [margin:0.85rem_0_0] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-md)] [background:var(--surface-elevated)] [padding:0.75rem_0.9rem] [&_ul]:[display:grid] [&_ul]:[gap:0.3rem] [&_ul]:[margin:0] [&_ul]:[padding-left:1.1rem] [&_ul]:[color:var(--neutral-600)] [&_ul]:[font-size:0.76rem] [&_ul]:[line-height:1.5]")}>
                        <span className={cx("question-evidence__title [&_small]:[margin-left:auto] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.66rem] [&_small]:[font-weight:500] [&_small]:[text-transform:none] [&_small]:[letter-spacing:normal] [display:flex] [align-items:center] [gap:0.4rem] [color:var(--kc-700)] [font-size:0.72rem] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.02em]")}><Paperclip size={14} /> Evidence required <small>Attach evidence even when the response is Yes, if it is available.</small></span>
                        <ul>{(question.expectedEvidence ?? []).map((item) => <li key={item}>{item}</li>)}</ul>
                      </div>
                      <QuestionEvidenceAttachments evidence={requirement.evidence.filter((item) => item.questionId === question.id)} questionNumber={question.number} onAdd={() => setEvidenceEditor({ mode: "new", questionId: question.id })} onView={setEvidenceViewer} onEdit={(item) => setEvidenceEditor({ mode: "edit", item })} onDelete={setEvidenceRemoving} />
                    </>
                  )}
                  <ResponseSelector questionId={question.id} value={question.response} onChange={(response) => changeQuestion(question.id, { response })} />
                  <ActionEditor action={question.action} response={question.response} onChange={(action) => changeQuestion(question.id, { action })} onRemove={() => changeQuestion(question.id, { action: undefined })} />
                </article>
              ))}
            </div>
          </section>
          <footer className={cx("requirement-footer [position:sticky] [z-index:5] [bottom:0.75rem] [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [margin-top:1.5rem] [border:1px_solid_var(--border-translucent)] [border-radius:var(--radius-lg)] [background:var(--surface-translucent)] [padding:0.65rem] [box-shadow:0_12px_34px_rgb(15_23_42_/_0.12)] [backdrop-filter:blur(18px)] [&_>_div]:[display:flex] [&_>_div]:[align-items:center] [&_>_div]:[gap:0.85rem] max-[1100px]:[bottom:calc(82px_+_env(safe-area-inset-bottom))] max-[740px]:[bottom:calc(72px_+_env(safe-area-inset-bottom))] max-[740px]:[display:grid] max-[740px]:[grid-template-columns:1fr_1fr] max-[740px]:[gap:0.55rem] max-[740px]:[padding:0.5rem] max-[740px]:[&_>_div]:[width:100%]")}>
            <Button variant="secondary" icon={<ArrowLeft size={18} />} disabled={!previous} onClick={() => previous && moveTo(previous)}>Previous requirement</Button>
            <div><SaveStatus state={saveState} /><Button variant="primary" disabled={!next} onClick={() => next && moveTo(next)} icon={<ArrowRight size={18} />} iconPosition="end">Next requirement</Button></div>
          </footer>
        </div>
        <div className={cx("requirement-layout__guidance [position:sticky] [top:var(--content-offset)] [height:calc(100vh_-_var(--content-offset))] [align-self:start] max-[1500px]:[display:none]", guidanceMinimized && "requirement-layout__guidance--minimized")}>
          {guidanceMinimized
            ? <button type="button" className={cx("guidance-panel-restore [display:flex] [width:100%] [height:100%] [align-items:center] [flex-direction:column] [gap:0.65rem] [border:0] [border-left:1px_solid_var(--neutral-200)] [background:linear-gradient(180deg,_var(--kc-50),_var(--surface-panel)_14rem)] [color:var(--kc-700)] [padding:1rem_0] [cursor:pointer] [font:inherit] [&_span]:[color:var(--neutral-700)] [&_span]:[font-size:0.72rem] [&_span]:[font-weight:700] [&_span]:[letter-spacing:0.04em] [&_span]:[writing-mode:vertical-rl] [&_>_svg:last-child]:[transform:rotate(180deg)] hover:[background:var(--kc-100)] hover:[color:var(--kc-800)] focus-visible:[position:relative] focus-visible:[z-index:1] focus-visible:[outline:3px_solid_rgb(2_132_199_/_0.25)] focus-visible:[outline-offset:-3px]")} onClick={() => setGuidanceMinimized(false)} aria-label="Expand guidance panel"><BookOpen size={19} /><span>Guidance</span><ChevronRight size={17} /></button>
            : <GuidancePanel requirement={requirement} onCollapse={() => setGuidanceMinimized(true)} />}
        </div>
      </div>
      {navigatorOpen && <div className={cx("sheet-layer [position:fixed] [z-index:100] [inset:0] [display:none] [place-items:center] max-[1500px]:[display:block]")}><button className={cx("sheet-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label="Close navigator" onClick={() => setNavigatorOpen(false)} /><div className={cx("sheet [position:absolute] [top:0] [bottom:0] [width:min(390px,_calc(100%_-_2rem))] [overflow-y:auto] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] sheet--left [left:0]")}><AssessmentNavigator requirements={requirements} current={requirement} onNavigate={moveTo} onClose={() => setNavigatorOpen(false)} /></div></div>}
      {guidanceOpen && <div className={cx("sheet-layer [position:fixed] [z-index:100] [inset:0] [display:none] [place-items:center] max-[1500px]:[display:block]")}><button className={cx("sheet-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label="Close guidance" onClick={() => setGuidanceOpen(false)} /><div className={cx("sheet [position:absolute] [top:0] [bottom:0] [width:min(390px,_calc(100%_-_2rem))] [overflow-y:auto] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] sheet--right [right:0]")}><div className={cx("sheet__close [display:flex] [justify-content:flex-end] [padding:0.5rem]")}><IconButton label="Close guidance" onClick={() => setGuidanceOpen(false)}><X size={20} /></IconButton></div><GuidancePanel requirement={requirement} /></div></div>}
      {evidenceEditor && <EvidenceDialog item={evidenceEditor.mode === "new" ? undefined : evidenceEditor.item} onClose={() => setEvidenceEditor(null)} onSave={(item) => {
        if (evidenceEditor.mode === "new") addEvidence(requirement.id, { ...item, questionId: evidenceEditor.questionId }, user?.name); else updateEvidence(requirement.id, item, user?.name);
        setEvidenceEditor(null);
        queueSavedState();
      }} />}
      {evidenceViewer && <EvidenceViewer item={evidenceViewer} onClose={() => setEvidenceViewer(null)} />}
      {evidenceRemoving && <ConfirmDialog eyebrow="Evidence" title={`Delete ${evidenceRemoving.title}?`} body="This evidence record will be removed from this requirement. This cannot be undone." confirmLabel="Delete evidence" cancelLabel="Keep evidence" onCancel={() => setEvidenceRemoving(null)} onConfirm={() => { removeEvidence(requirement.id, evidenceRemoving.id, user?.name); queueSavedState(); setEvidenceRemoving(null); }} />}
    </div>
  );
}
