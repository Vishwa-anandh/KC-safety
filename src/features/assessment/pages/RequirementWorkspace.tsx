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
import { Button, ConfirmDialog, eyebrowClasses, IconButton, InlineMessage, PerformanceBadge, ProgressBar, SaveStatus, Select } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

// ---------------------------------------------------------------------------------------------
// Canonical class recipes shared across this file's components. Each mirrors a pattern duplicated
// verbatim elsewhere (see src/features/admin/pages/AdminScreens.tsx for the same requirement-page
// chrome, and src/shared/ui/UI.tsx for the field/dialog primitives) — every occurrence uses the
// same constant so the screens don't drift apart.
// ---------------------------------------------------------------------------------------------

const breadcrumbsClass = "breadcrumbs mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400";
const breadcrumbsLinkClass = "font-semibold text-kc-blue-700 dark:text-kc-blue-300";

const sectionTitleRowClass = "section-title-row mb-4 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between";
const sectionTitleHeadingClass = "mt-1 text-lg font-bold text-slate-900 dark:text-slate-100";
const sectionTitleCountClass = "text-sm text-slate-500 dark:text-slate-400";

/** Canonical form-field wrapper: label row, an input/textarea styled directly (Select renders its
 * own trigger so it never needs this), and an inline error — see AdminScreens.tsx fieldClass. */
const fieldClass = "field grid min-w-0 gap-1.5";
const fieldWideWrapClass = "field field--wide grid min-w-0 gap-1.5 md:col-span-2";
const fieldLabelRowClass = "flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-300";
const fieldRequiredMarkClass = "text-xs font-bold tracking-wide text-red-700 dark:text-red-300";
const fieldInputClass = "w-full min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-kc-blue-900";
const fieldInvalidClass = "border-red-600! ring-3 ring-red-100 dark:border-red-400! dark:ring-red-950";
const fieldErrorClass = "field-error mt-1.5 block text-xs font-semibold text-red-700 dark:text-red-300";

const dialogLayerClass = "dialog-layer fixed inset-0 z-100 grid place-items-center p-4";
const dialogBackdropClass = "dialog-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-sm";
// No max-w-* here — it's set per usage below. Two max-w-* utilities on one element are a coin
// flip in Tailwind v4's cascade (output order follows first-seen-in-source, not JSX order), so
// combining this constant with an overriding width class was silently losing to whichever one
// Tailwind happened to emit second; keeping the scale choice mutually exclusive avoids that.
const dialogClass = "dialog relative max-h-full w-full overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-dialog-in dark:border-slate-700 dark:bg-slate-900";
const dialogHeaderClass = "dialog__header flex items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-700";
const dialogHeaderTitleClass = "mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100";
const dialogFormClass = "dialog-form grid gap-4 p-4.5";
const dialogFooterClass = "dialog__footer flex flex-col-reverse items-stretch gap-4 border-t border-slate-200 p-4 max-md:items-stretch md:flex-row md:items-center md:justify-end dark:border-slate-700";

/** Off-canvas "sheet" overlay (mobile requirement navigator / guidance). Mirrors ConfirmDialog's
 * layer recipe: a fixed backdrop plus a panel, anchored to an edge instead of centered. */
const sheetLayerClass = "sheet-layer fixed inset-0 z-100 grid place-items-center wide:hidden";
const sheetBackdropClass = "sheet-backdrop absolute inset-0 border-0 bg-slate-950/50 backdrop-blur-sm";
const sheetClass = "sheet absolute inset-y-0 max-w-97.5 w-full overflow-x-hidden overflow-y-auto bg-white shadow-2xl dark:bg-slate-900";

const requirementMobileToolbarClass = "requirement-mobile-toolbar sticky z-8 flex justify-between gap-2.5 border-b border-slate-200 p-2.5 backdrop-blur-md wide:hidden shell:justify-end dark:border-slate-700";
const requirementNavigatorWrapClass = "requirement-layout__navigator hidden shell:sticky shell:block shell:w-100 shell:flex-none shell:self-start";

const questionEvidenceTitleClass = "question-evidence__title flex items-center gap-1.5 text-xs font-bold tracking-wide text-kc-blue-700 uppercase dark:text-kc-blue-300";
const questionEvidenceNoticeClass = "question-evidence grid gap-2 mt-3.5 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800";
const questionNumberClass = "question-number grid size-8 flex-none place-items-center rounded-lg bg-kc-blue-50 text-sm font-extrabold text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200";
const questionCountClass = "question-count flex-none rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";

const dropzoneClass = "dropzone grid min-h-42 w-full place-content-center place-items-center gap-2 rounded-lg border-2 border-dashed border-kc-blue-300 bg-kc-blue-50 p-4 text-center text-slate-700 hover:border-kc-blue-600 hover:bg-kc-blue-100 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-slate-300 dark:hover:bg-kc-blue-900";
const dropzoneIconClass = "dropzone__icon grid size-12 place-items-center rounded-xl bg-white text-kc-blue-700 shadow-sm dark:bg-slate-800 dark:text-kc-blue-300";

function requirementState(requirement: Requirement, currentId: string) {
  if (requirement.id === currentId) return "current";
  if (requirement.questions.every((question) => actionComplete(question.response, question.action))) return "complete";
  if (requirement.questions.some((question) => question.response === "no" || question.response === "partial")) return "gap";
  return "incomplete";
}

function NavigatorState({ state }: { state: string }) {
  if (state === "complete") return <CheckCircle2 size={17} className="nav-state nav-state--complete flex-none text-emerald-700 dark:text-emerald-300" />;
  if (state === "gap") return <AlertTriangle size={17} className="nav-state nav-state--gap flex-none text-amber-700 dark:text-amber-300" />;
  if (state === "current") return <span className="nav-state nav-state--current grid size-5 flex-none place-items-center rounded-full bg-kc-blue-600 text-white ring-3 ring-kc-blue-200 dark:ring-kc-blue-800"><Circle size={12} fill="currentColor" /></span>;
  return <Circle size={16} className="nav-state nav-state--incomplete flex-none text-slate-400 dark:text-slate-500" />;
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
  // Rendered both as the sticky desktop rail (no onClose) and inside the mobile sheet (onClose
  // supplied) — the sheet already draws its own edge, so the rail-only border is dropped there.
  const inSheet = Boolean(onClose);

  return (
    <aside className={cx("assessment-navigator flex h-full flex-col overflow-x-hidden overflow-y-auto bg-white p-4 dark:bg-slate-900", !inSheet && "border-r border-slate-200 dark:border-slate-700")} aria-label="Assessment navigator">
      <div className="assessment-navigator__header mb-4 flex items-start justify-between gap-3">
        <div>
          <p className={eyebrowClasses}>Current section</p>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{current.sectionName}</h2>
        </div>
        {onClose && <IconButton label="Close assessment navigator" onClick={onClose}><X size={19} /></IconButton>}
      </div>
      <ProgressBar value={Math.round((completed / requirements.length) * 100)} label="Requirements complete" />
      <label className="navigator-search my-4 flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-2.5 text-slate-500 focus-within:border-kc-blue-600 focus-within:ring-3 focus-within:ring-kc-blue-100 dark:border-slate-600 dark:text-slate-400 dark:focus-within:ring-kc-blue-900">
        <Search size={17} />
        <input className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a requirement" />
      </label>
      <div className="navigator-group flex-1">
        <div className="navigator-group__trigger flex w-full items-center gap-2 border-0 bg-transparent px-1.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-300" aria-expanded="true">
          <ChevronDown size={17} />
          <span>Assessment requirements</span>
          <small className="ml-auto font-medium text-slate-500 dark:text-slate-400">{completed} of {requirements.length}</small>
        </div>
        <div className="navigator-items mt-1 grid gap-0.5">
          {filtered.map((requirement) => {
            const state = requirementState(requirement, current.id);
            return (
              <button
                key={requirement.id}
                className={cx(
                  "navigator-item flex min-h-13 w-full items-center gap-2.5 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-left text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800",
                  state === "current" && "navigator-item--current border-kc-blue-200 border-l-4 border-l-kc-blue-600 bg-kc-blue-100 pl-1.5 font-bold text-kc-blue-900 dark:border-kc-blue-800 dark:border-l-kc-blue-500 dark:bg-kc-blue-900 dark:text-kc-blue-100",
                )}
                onClick={() => onNavigate(requirement)}
              >
                <NavigatorState state={state} />
                <span className="grid min-w-0 flex-1 gap-0.5 text-sm font-semibold leading-tight">
                  <small className="text-xs font-semibold text-slate-500 dark:text-slate-400">{requirement.number} · {requirement.sectionName}</small>
                  {requirement.title}
                </span>
                <ChevronRight size={16} className="flex-none text-slate-400 dark:text-slate-500" />
              </button>
            );
          })}
          {!filtered.length && <p className="navigator-empty m-0 p-4 text-center text-sm text-slate-500 dark:text-slate-400">No requirements match your search.</p>}
        </div>
      </div>
      <Button className="next-incomplete mt-4 w-full" variant="secondary" icon={<ListChecks size={18} />} disabled={!nextIncomplete} onClick={() => nextIncomplete && onNavigate(nextIncomplete)}>
        Next incomplete
      </Button>
    </aside>
  );
}

/** Selection tone per response value — border/background for the selected card, and the same
 * tone as a solid fill for the small radio control inside it. */
const responseToneClasses: Record<Exclude<ResponseValue, null>, { selected: string; control: string }> = {
  no: {
    selected: "border-red-600 bg-red-50 dark:border-red-500 dark:bg-red-950",
    control: "border-red-600 bg-red-600 text-white dark:border-red-500 dark:bg-red-500",
  },
  partial: {
    selected: "border-amber-600 bg-amber-50 dark:border-amber-500 dark:bg-amber-950",
    control: "border-amber-600 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500",
  },
  yes: {
    selected: "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950",
    control: "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500",
  },
};

// Border/background color utilities are deliberately absent from these two base classes and
// live only in the mutually-exclusive default/tone classes below. Tailwind v4 orders generated
// utilities by first-seen-in-source rather than by JSX class order, so an always-on
// `border-slate-300` sitting next to a conditional `border-red-600` is a coin flip for which one
// wins the cascade — this was silently losing the red/amber/emerald selected state to gray.
const responseOptionBaseClass = "response-option flex min-w-0 min-h-22 items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition-colors max-md:min-h-0 forced-colors:border-2 forced-colors:border-current";
const responseOptionDefaultClass = "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-900";
const responseOptionControlClass = "response-option__control grid size-6 flex-none place-items-center rounded-full border transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-kc-blue-500 peer-focus-visible:outline-offset-2";
const responseOptionControlDefaultClass = "border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500";

function ResponseSelector({ value, onChange, questionId }: { value: ResponseValue; onChange: (value: ResponseValue) => void; questionId: string }) {
  const options: Array<{ value: Exclude<ResponseValue, null>; label: string; performance: string; description: string }> = [
    { value: "no", label: "No", performance: "Initial", description: "The requirement is not in place." },
    { value: "partial", label: "Partial", performance: "Emerging", description: "Some elements are in place." },
    { value: "yes", label: "Yes", performance: "Performing", description: "The requirement is fully in place." },
  ];
  return (
    <fieldset className="response-fieldset mt-4 min-w-0 border-0 p-0">
      <legend className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
        Response <span className="ml-1.5 font-medium text-slate-400 dark:text-slate-500">Choose one if assessed</span>
      </legend>
      <div className="response-options grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value;
          const tone = responseToneClasses[option.value];
          return (
            <label key={option.value} className={cx(responseOptionBaseClass, `response-option--${option.value}`, selected ? cx("response-option--selected", tone.selected) : responseOptionDefaultClass)}>
              <input className="peer sr-only" type="radio" name={`response-${questionId}`} value={option.value} checked={selected} onChange={() => onChange(option.value)} />
              <span className={cx(responseOptionControlClass, selected ? tone.control : responseOptionControlDefaultClass)}>{selected ? <Check size={15} /> : <Circle size={14} />}</span>
              <span className="response-option__copy grid min-w-0 gap-0.5">
                <strong className="text-sm text-slate-900 dark:text-slate-100">{option.label}</strong>
                <small className="text-xs font-semibold text-slate-500 dark:text-slate-400">{option.performance}</small>
                <em className="mt-1 text-xs leading-snug font-normal text-slate-500 not-italic max-md:hidden dark:text-slate-400">{option.description}</em>
              </span>
            </label>
          );
        })}
      </div>
      {/* The "Clear response" link and the action-editor below are the site of the earlier
          black-stroke / inherited-colour bug reports — every colour here is explicit with a
          dark: counterpart rather than relying on cascade. */}
      {value && (
        <button
          type="button"
          className="response-clear mt-2.5 border-0 bg-transparent p-0 text-sm font-semibold text-kc-blue-700 hover:text-kc-blue-900 hover:underline dark:text-kc-blue-300 dark:hover:text-kc-blue-100"
          onClick={() => onChange(null)}
        >
          Clear response
        </button>
      )}
    </fieldset>
  );
}

function ActionEditor({ action, response, onChange, onRemove }: { action?: ActionItem; response: ResponseValue; onChange: (action: ActionItem) => void; onRemove: () => void }) {
  if (!response) return null;
  const requiredByResponse = response === "no" || response === "partial";
  if (!action) {
    return (
      <Button className="action-editor-add mt-4" variant="tertiary" icon={<Plus size={17} />} onClick={() => onChange({ description: "", owner: "", status: "Open", followUp: "" })}>
        Add corrective action <span className="text-slate-500 dark:text-slate-400">(optional)</span>
      </Button>
    );
  }
  const update = (change: Partial<ActionItem>) => onChange({
    description: action.description,
    owner: action.owner,
    status: action.status ?? "Open",
    followUp: action.followUp ?? "",
    ...change,
  });
  return (
    <div className="action-editor mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-900">
      <div className="action-editor__header flex items-start gap-2.5">
        <div className="action-editor__icon text-amber-700 dark:text-amber-300"><AlertTriangle size={18} /></div>
        <div className="min-w-0 flex-1">
          <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">Corrective action</strong>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{requiredByResponse ? "Created automatically from this assessment gap and tracked in Actions summary." : "Optional supporting action for this assessment response."}</p>
        </div>
        {!requiredByResponse && <Button className="flex-none" variant="tertiary" onClick={onRemove}>Remove action</Button>}
      </div>
      <div className="form-grid grid grid-cols-1 gap-4 pt-3.5 md:grid-cols-2">
        <label className={fieldWideWrapClass}>
          <span className={fieldLabelRowClass}>Action description</span>
          <textarea className={cx(fieldInputClass, "resize-y leading-relaxed")} rows={3} value={action.description} placeholder="Describe the specific action needed to close this gap" onChange={(event) => update({ description: event.target.value })} />
        </label>
        <label className={fieldClass}>
          <span className={fieldLabelRowClass}>Action owner</span>
          <span className="field-control-with-icon relative flex items-center">
            <UserRound size={17} className="pointer-events-none absolute left-3 text-slate-500 dark:text-slate-400" />
            <input className={cx(fieldInputClass, "pl-9")} type="text" value={action.owner} placeholder="Search or enter owner" onChange={(event) => update({ owner: event.target.value })} />
          </span>
        </label>
        <div className={fieldClass}>
          <span className={fieldLabelRowClass}>Action status</span>
          <Select label="Action status" value={action.status ?? "Open"} onChange={(value) => update({ status: value as ActionItem["status"] })} options={[{ value: "Open", label: "Open" }, { value: "In progress", label: "In progress" }, { value: "Complete", label: "Complete" }]} />
        </div>
        <label className={fieldWideWrapClass}>
          <span className={fieldLabelRowClass}>Follow-up</span>
          <textarea className={cx(fieldInputClass, "resize-y leading-relaxed")} rows={2} value={action.followUp ?? ""} placeholder="Add the next step, due-date note, or follow-up update" onChange={(event) => update({ followUp: event.target.value })} />
        </label>
      </div>
    </div>
  );
}

// Kept temporarily for backward-compatible component extraction; site-user rendering is now
// question-scoped and does not invoke this legacy requirement-level panel.
export function EvidencePanel({ evidence, onAdd, onView, onEdit, onDelete }: { evidence: EvidenceItem[]; onAdd: () => void; onView: (item: EvidenceItem) => void; onEdit: (item: EvidenceItem) => void; onDelete: (item: EvidenceItem) => void }) {
  return (
    <section className="evidence-card mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className={sectionTitleRowClass}>
        <div>
          <p className={eyebrowClasses}>Supporting material</p>
          <h2 className={sectionTitleHeadingClass}>Attached evidence</h2>
          <span className={sectionTitleCountClass}>{evidence.length} items connected to this requirement</span>
        </div>
        <Button variant="secondary" icon={<Plus size={17} />} onClick={onAdd}>Add evidence</Button>
      </div>
      {evidence.length ? (
        <div className="evidence-list grid gap-2">
          {evidence.map((item) => (
            <article className="evidence-item flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900" key={item.id}>
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className={cx("evidence-item__icon grid size-10 flex-none place-items-center rounded-lg", item.type === "file" ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300")}>
                  {item.type === "file" ? <FileText size={20} /> : <Link2 size={20} />}
                </div>
                <button className="evidence-item__copy grid min-w-0 flex-1 border-0 bg-transparent p-0 text-left text-slate-800 dark:text-slate-200" onClick={() => onView(item)}>
                  <strong className="truncate text-sm text-slate-900 dark:text-slate-100">{item.title}</strong>
                  <span className="truncate text-xs text-slate-500 dark:text-slate-400">{item.detail}</span>
                  <small className="truncate text-xs text-slate-500 dark:text-slate-400">Added by {item.uploadedBy} · {item.uploadedAt}</small>
                </button>
              </div>
              <div className="evidence-item__actions flex flex-none items-center gap-0.5 max-sm:w-full max-sm:justify-end">
                <IconButton label={`Edit ${item.title}`} onClick={() => onEdit(item)}><Pencil size={17} /></IconButton>
                <IconButton label={`Delete ${item.title}`} onClick={() => onDelete(item)}><Trash2 size={17} /></IconButton>
                <IconButton label={`View ${item.title}`} onClick={() => onView(item)}><ExternalLink size={18} /></IconButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="evidence-empty grid min-h-38 place-items-center place-content-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400">
          <Paperclip size={22} className="text-kc-blue-600 dark:text-kc-blue-400" />
          <strong className="text-sm text-slate-800 dark:text-slate-200">No evidence attached yet</strong>
          <span className="text-xs text-slate-500 dark:text-slate-400">Add a file or secure link to support this requirement.</span>
        </div>
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
    <div className="question-evidence question-evidence--attachments grid gap-2 mt-3.5 rounded-md border border-slate-200 bg-kc-blue-50 p-3 px-3.5 dark:border-slate-700 dark:bg-kc-blue-950">
      <div className="question-evidence__attachments-header flex flex-wrap items-center justify-between gap-2.5">
        <span className={questionEvidenceTitleClass}><Paperclip size={14} /> Evidence attached to Question {questionNumber}</span>
        <Button variant="tertiary" icon={<Plus size={15} />} onClick={onAdd}>Add evidence</Button>
      </div>
      {evidence.length ? (
        <div className="question-evidence__attachments-list grid gap-1.5">
          {evidence.map((item) => (
            <div className="question-evidence__attachment flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2 px-2.5 dark:border-slate-700 dark:bg-slate-800" key={item.id}>
              <button type="button" className="question-evidence__attachment-copy grid min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left text-slate-800 dark:text-slate-200" onClick={() => onView(item)}>
                <strong className="truncate text-sm text-slate-900 dark:text-slate-100">{item.title}</strong>
                <small className="truncate text-xs text-slate-500 dark:text-slate-400">{item.detail}</small>
                {item.note && <small className="mt-0.5 truncate text-xs text-slate-600 italic dark:text-slate-300">{item.note}</small>}
              </button>
              <span className="question-evidence__attachment-actions flex flex-none gap-0.5">
                <IconButton label={`Edit ${item.title}`} onClick={() => onEdit(item)}><Pencil size={15} /></IconButton>
                <IconButton label={`Delete ${item.title}`} onClick={() => onDelete(item)}><Trash2 size={15} /></IconButton>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="question-evidence__attachment-empty m-0 text-sm text-slate-500 dark:text-slate-400">No evidence attached yet. Add a file or secure link for this question.</p>
      )}
    </div>
  );
}

function GuidancePanel({ requirement, onCollapse }: { requirement: Requirement; onCollapse?: () => void }) {
  // Rendered both as the collapsible desktop rail (onCollapse supplied) and inside the mobile
  // sheet (no onCollapse) — the sheet already draws its own edge and close control.
  const isRail = Boolean(onCollapse);
  return (
    <aside className={cx("guidance-panel h-full overflow-x-hidden overflow-y-auto bg-linear-to-b from-kc-blue-50 to-white p-4.5 dark:from-kc-blue-950 dark:to-slate-900", isRail && "border-l border-slate-200 dark:border-slate-700")}>
      <div className="guidance-panel__top flex items-start justify-between gap-2.5 mb-4 text-kc-blue-700 dark:text-kc-blue-300">
        <div>
          <p className={eyebrowClasses}>Read-only master content</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">How to meet</h2>
        </div>
        <div className="guidance-panel__top-actions flex items-center gap-1.5">
          <BookOpen size={20} />
          {onCollapse && <IconButton label="Minimize guidance panel" onClick={onCollapse}><ChevronRight size={18} /></IconButton>}
        </div>
      </div>
      <ul className="guidance-list mt-4 grid gap-3 pl-4.5 text-sm leading-relaxed text-slate-700 marker:text-kc-blue-600 dark:text-slate-300 dark:marker:text-kc-blue-400">
        {requirement.guidance.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className="expected-evidence mt-5.5 rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="expected-evidence__title flex items-center gap-2 text-kc-blue-700 dark:text-kc-blue-300">
          <Paperclip size={18} />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Expected evidence</h3>
        </div>
        <ul className="mt-3 grid gap-2 pl-4.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {requirement.expectedEvidence.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
      <div className="master-protection-note flex items-center gap-1.5 mt-4 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck size={17} /><span>Managed by KC administrators</span>
      </div>
      <InlineMessage className="mt-4" tone="info" title="How this result is calculated">The requirement result is the lowest response below. No maps to Initial, Partial to Emerging, and Yes to Performing.</InlineMessage>
    </aside>
  );
}

function EvidenceDialog({ item, response, onClose, onSave }: { item?: EvidenceItem; response: ResponseValue; onClose: () => void; onSave: (item: EvidenceItem) => void }) {
  const [type, setType] = useState<"file" | "link">(item?.type ?? "file");
  const [title, setTitle] = useState(item?.title ?? "");
  const [url, setUrl] = useState(item?.type === "link" ? item.detail : "");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState(item?.note ?? "");
  const [submitted, setSubmitted] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const validUrl = type !== "link" || /^https?:\/\//i.test(url.trim());
  // A Partial or Yes response claims some level of implementation, so this is where the site
  // explains how the upload backs that claim — a No or not-yet-assessed question has nothing to
  // explain yet.
  const showNote = response === "partial" || response === "yes";
  const valid = Boolean(title.trim() && validUrl && (type === "link" || file || item?.type === "file") && (!showNote || note.trim()));

  return (
    <div className={dialogLayerClass} role="presentation">
      <button className={dialogBackdropClass} onClick={onClose} aria-label="Close evidence dialog" />
      <section className={cx(dialogClass, "max-w-lg")} role="dialog" aria-modal="true" aria-labelledby="evidence-dialog-title">
        <div className={dialogHeaderClass}>
          <div>
            <p className={eyebrowClasses}>Supporting material</p>
            <h2 id="evidence-dialog-title" className={dialogHeaderTitleClass}>{item ? "Edit evidence" : "Add evidence"}</h2>
          </div>
          <IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="evidence-type-tabs mx-4.5 mt-4 grid grid-cols-2 gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800" role="tablist" aria-label="Evidence type">
          <button
            type="button"
            role="tab"
            aria-selected={type === "file"}
            className={cx("flex min-h-10 items-center justify-center gap-1.5 rounded-md border-0 bg-transparent text-sm font-semibold text-slate-600 dark:text-slate-400", type === "file" && "bg-white text-kc-blue-800 shadow-sm dark:bg-slate-900 dark:text-kc-blue-200")}
            onClick={() => setType("file")}
          >
            <Upload size={18} /> Upload file
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={type === "link"}
            className={cx("flex min-h-10 items-center justify-center gap-1.5 rounded-md border-0 bg-transparent text-sm font-semibold text-slate-600 dark:text-slate-400", type === "link" && "bg-white text-kc-blue-800 shadow-sm dark:bg-slate-900 dark:text-kc-blue-200")}
            onClick={() => setType("link")}
          >
            <Link2 size={18} /> Add link
          </button>
        </div>
        <div className={dialogFormClass}>
          <label className={fieldClass}>
            <span className={fieldLabelRowClass}>Evidence title <b className={fieldRequiredMarkClass}>Required</b></span>
            <input className={cx(fieldInputClass, submitted && !title.trim() && fieldInvalidClass)} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="For example, August review minutes" aria-invalid={submitted && !title.trim()} />
            {submitted && !title.trim() && <small className={fieldErrorClass}>Enter a clear evidence title.</small>}
          </label>
          {type === "file" ? (
            <>
              <input ref={fileInput} className="sr-only" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              <button
                type="button"
                className={cx(dropzoneClass, submitted && !file && item?.type !== "file" && "dropzone--invalid border-red-600 ring-3 ring-red-100 dark:border-red-400 dark:ring-red-950")}
                onClick={() => fileInput.current?.click()}
              >
                <span className={dropzoneIconClass}><Upload size={23} /></span>
                <strong className="text-base text-slate-900 dark:text-slate-100">{file?.name ?? (item?.type === "file" ? item.detail.split(" · ")[0] : "Choose a file")}</strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">{file ? `${Math.max(1, Math.round(file.size / 1024))} KB selected` : "PDF, Word, Excel, image, or other approved record"}</span>
              </button>
              {submitted && !file && item?.type !== "file" && <small className={fieldErrorClass}>Choose a file to upload.</small>}
            </>
          ) : (
            <label className={fieldClass}>
              <span className={fieldLabelRowClass}>Secure link <b className={fieldRequiredMarkClass}>Required</b></span>
              <input className={cx(fieldInputClass, submitted && !validUrl && fieldInvalidClass)} type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" aria-invalid={submitted && !validUrl} />
              {submitted && !validUrl && <small className={fieldErrorClass}>Enter a complete link beginning with http:// or https://.</small>}
            </label>
          )}
          {showNote && (
            <label className={fieldClass}>
              <span className={fieldLabelRowClass}>How does this evidence meet the requirement? <b className={fieldRequiredMarkClass}>Required</b></span>
              <textarea className={cx(fieldInputClass, "resize-y leading-relaxed", submitted && !note.trim() && fieldInvalidClass)} rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain what this file or link shows and how it satisfies the requirement" aria-invalid={submitted && !note.trim()} />
              {submitted && !note.trim() && <small className={fieldErrorClass}>Explain how this evidence meets the requirement.</small>}
            </label>
          )}
        </div>
        <div className={dialogFooterClass}>
          <Button variant="tertiary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={<Check size={17} />} onClick={() => {
            setSubmitted(true);
            if (!valid) return;
            const detail = type === "file"
              ? (file ? `${file.name} · ${Math.max(1, Math.round(file.size / 1024))} KB` : item?.detail ?? "Evidence file")
              : url.trim();
            onSave({ id: item?.id ?? `ev-${Date.now()}`, type, title: title.trim(), detail, note: showNote ? note.trim() : undefined, uploadedBy: "Rachel Morgan", uploadedAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) });
          }}>{item ? "Save changes" : "Add evidence"}</Button>
        </div>
      </section>
    </div>
  );
}

function EvidenceViewer({ item, onClose }: { item: EvidenceItem; onClose: () => void }) {
  const isLink = item.type === "link";
  return (
    <div className={dialogLayerClass} role="presentation">
      <button className={dialogBackdropClass} onClick={onClose} aria-label="Close evidence details" />
      <section className={cx(dialogClass, "dialog--compact max-w-sm")} role="dialog" aria-modal="true" aria-labelledby="evidence-view-title">
        <div className={dialogHeaderClass}>
          <div>
            <p className={eyebrowClasses}>Evidence details</p>
            <h2 id="evidence-view-title" className={dialogHeaderTitleClass}>{item.title}</h2>
          </div>
          <IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="evidence-preview grid justify-items-center gap-2 m-4.5 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-900">
          <span className="grid size-14 place-items-center rounded-2xl bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300">{isLink ? <Link2 size={28} /> : <FileText size={28} />}</span>
          <strong className="max-w-full font-bold break-words text-slate-900 dark:text-slate-100">{item.detail}</strong>
          <small className="text-slate-500 dark:text-slate-400">Added by {item.uploadedBy} on {item.uploadedAt}</small>
        </div>
        {item.note && (
          <div className="evidence-preview__note mx-4.5 mb-4.5 grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">How this meets the requirement</span>
            <p className="m-0 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{item.note}</p>
          </div>
        )}
        <div className={dialogFooterClass}>
          <Button variant="tertiary" onClick={onClose}>Close</Button>
          {isLink && <Button variant="primary" icon={<ExternalLink size={17} />} onClick={() => window.open(item.detail, "_blank", "noopener,noreferrer")}>Open secure link</Button>}
        </div>
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
    <div className="requirement-page min-w-0">
      <div className={requirementMobileToolbarClass} style={{ top: "var(--content-offset)", background: "var(--surface-mobile-bar)" }}>
        <Button variant="secondary" icon={<Menu size={18} />} onClick={() => setNavigatorOpen(true)}>Requirements</Button>
        <Button variant="secondary" icon={<BookOpen size={18} />} onClick={() => setGuidanceOpen(true)}>Guidance</Button>
      </div>
      <div className="requirement-layout min-w-0 w-full shell:flex shell:items-stretch" style={{ minHeight: "calc(100vh - var(--content-offset))" }}>
        <div className={requirementNavigatorWrapClass} style={{ top: "var(--content-offset)", height: "calc(100vh - var(--content-offset))" }}>
          <AssessmentNavigator requirements={requirements} current={requirement} onNavigate={moveTo} />
        </div>
        <div className="requirement-main min-w-0 pt-4 pb-12 shell:flex-1 md:pt-6 md:pb-16" style={{ paddingInline: "var(--page-gutter)" }}>
          <nav className={breadcrumbsClass} aria-label="Breadcrumb">
            <Link className={breadcrumbsLinkClass} to="/assessment">Self-assessment</Link>
            <ChevronRight size={15} />
            <span>{requirement.sectionName}</span>
            <ChevronRight size={15} />
            <span aria-current="page">{requirement.number}</span>
          </nav>
          <header className="requirement-header rounded-xl border border-slate-200 bg-white p-5 shadow-sm max-md:p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="requirement-header__meta flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="requirement-id rounded-full border border-kc-blue-200 bg-kc-blue-50 px-2 py-1 text-xs font-bold text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200">{requirement.number}</span>
              <span>{requirement.subsection}</span>
            </div>
            <div className="requirement-header__title mt-3 flex items-start justify-between gap-4 max-md:grid">
              <div className="min-w-0 flex-1">
                <p className={eyebrowClasses}>Requirement</p>
                <h1 className="mt-1 max-w-180 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-slate-100">{requirement.title}</h1>
              </div>
              <PerformanceBadge performance={performance} />
            </div>
            <p className="requirement-text mt-3.5 max-w-205 text-base leading-relaxed text-slate-700 dark:text-slate-300">{requirement.requirementText}</p>
            <div className="requirement-header__footer mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span className="text-slate-500 dark:text-slate-400">{answered} of {requirement.questions.length} questions answered</span>
              <span className="divider-dot size-1 rounded-full bg-slate-400 max-md:hidden dark:bg-slate-500" />
              <span className="text-slate-500 dark:text-slate-400">Result uses the lowest question level</span>
              <span className="requirement-save ml-auto max-md:hidden"><SaveStatus state={saveState} /></span>
            </div>
          </header>
          <section className="questions-section mt-6" aria-labelledby="questions-title">
            <div className={sectionTitleRowClass}>
              <div>
                <p className={eyebrowClasses}>Assessment questions</p>
                <h2 className={sectionTitleHeadingClass} id="questions-title">Evaluate this requirement</h2>
              </div>
              <span className={questionCountClass}>{requirement.questions.length} questions</span>
            </div>
            <div className="question-list grid gap-4">
              {requirement.questions.map((question) => (
                <article className="question-card rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm max-md:p-3.5 dark:border-slate-700 dark:bg-slate-900" key={question.id} id={`question-${question.id}`}>
                  <div className="question-card__header flex flex-wrap items-start gap-3">
                    <span className={questionNumberClass}>{question.number}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Question {question.number}</p>
                      <h3 className="mt-1 max-w-195 text-base leading-relaxed text-slate-900 dark:text-slate-100">{question.text}</h3>
                    </div>
                    <PerformanceBadge performance={performanceForResponse(question.response)} compact />
                  </div>
                  {/* A "No" response means the requirement isn't in place yet, so there's nothing
                      to attach evidence of — the evidence panel only applies once a response of
                      Partial or Yes claims some level of implementation. */}
                  {Boolean(question.evidenceRequired ?? question.expectedEvidence?.length) && question.response !== "no" && (
                    <>
                      <div className={questionEvidenceNoticeClass}>
                        <span className={questionEvidenceTitleClass}><Paperclip size={14} /> Evidence required <small className="ml-auto text-xs font-medium text-slate-500 normal-case tracking-normal dark:text-slate-400">Attach evidence even when the response is Partial or Yes, if it is available.</small></span>
                        <ul className="m-0 mt-2 grid gap-1.5 pl-4.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {(question.expectedEvidence ?? []).map((item) => <li key={item}>{item}</li>)}
                        </ul>
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
          <footer
            className="requirement-footer sticky bottom-18 z-5 mt-6 grid w-full grid-cols-2 items-center gap-2.5 rounded-xl border p-2.5 shell:bottom-3 shell:flex shell:justify-between shell:gap-3.5"
            style={{
              borderColor: "var(--border-translucent)",
              background: "var(--surface-translucent)",
              boxShadow: "0 12px 34px rgb(15 23 42 / 0.12)",
              backdropFilter: "blur(18px)",
              // env() has no Tailwind scale token; kept as inline padding (rather than folded
              // into the sticky `bottom` offset) specifically so the shell: breakpoint above can
              // still override the position with a plain class — an inline style always wins over
              // a class, so an arbitrary-value bottom offset could never be overridden responsively.
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <Button variant="secondary" icon={<ArrowLeft size={18} />} disabled={!previous} onClick={() => previous && moveTo(previous)}>Previous requirement</Button>
            <div className="flex items-center gap-3.5 max-md:w-full">
              <SaveStatus state={saveState} />
              <Button variant="primary" disabled={!next} onClick={() => next && moveTo(next)} icon={<ArrowRight size={18} />} iconPosition="end">Next requirement</Button>
            </div>
          </footer>
        </div>
        <div className={cx("requirement-layout__guidance hidden wide:sticky wide:block wide:flex-none wide:self-start", guidanceMinimized ? "wide:w-14" : "wide:w-80")} style={{ top: "var(--content-offset)", height: "calc(100vh - var(--content-offset))" }}>
          {guidanceMinimized ? (
            <button
              type="button"
              className="guidance-panel-restore flex h-full w-full cursor-pointer flex-col items-center gap-2.5 border-0 border-l border-slate-200 bg-linear-to-b from-kc-blue-50 to-white px-0 py-4 text-kc-blue-700 hover:bg-kc-blue-100 hover:text-kc-blue-800 focus-visible:relative focus-visible:z-1 focus-visible:outline-3 focus-visible:outline-sky-600/25 focus-visible:-outline-offset-3 dark:border-slate-700 dark:from-kc-blue-950 dark:to-slate-900 dark:text-kc-blue-300 dark:hover:text-kc-blue-200"
              onClick={() => setGuidanceMinimized(false)}
              aria-label="Expand guidance panel"
            >
              <BookOpen size={19} />
              <span className="text-xs font-bold tracking-widest text-slate-700 dark:text-slate-300" style={{ writingMode: "vertical-rl" }}>Guidance</span>
              <ChevronRight size={17} className="rotate-180" />
            </button>
          ) : (
            <GuidancePanel requirement={requirement} onCollapse={() => setGuidanceMinimized(true)} />
          )}
        </div>
      </div>
      {navigatorOpen && (
        <div className={sheetLayerClass}>
          <button className={sheetBackdropClass} aria-label="Close navigator" onClick={() => setNavigatorOpen(false)} />
          <div className={cx(sheetClass, "sheet--left left-0 right-8")}>
            <AssessmentNavigator requirements={requirements} current={requirement} onNavigate={moveTo} onClose={() => setNavigatorOpen(false)} />
          </div>
        </div>
      )}
      {guidanceOpen && (
        <div className={sheetLayerClass}>
          <button className={sheetBackdropClass} aria-label="Close guidance" onClick={() => setGuidanceOpen(false)} />
          <div className={cx(sheetClass, "sheet--right right-0 left-8")}>
            <div className="sheet__close flex justify-end p-2">
              <IconButton label="Close guidance" onClick={() => setGuidanceOpen(false)}><X size={20} /></IconButton>
            </div>
            <GuidancePanel requirement={requirement} />
          </div>
        </div>
      )}
      {evidenceEditor && <EvidenceDialog
        item={evidenceEditor.mode === "new" ? undefined : evidenceEditor.item}
        response={requirement.questions.find((question) => question.id === (evidenceEditor.mode === "new" ? evidenceEditor.questionId : evidenceEditor.item.questionId))?.response ?? null}
        onClose={() => setEvidenceEditor(null)} onSave={(item) => {
        if (evidenceEditor.mode === "new") addEvidence(requirement.id, { ...item, questionId: evidenceEditor.questionId }, user?.name); else updateEvidence(requirement.id, item, user?.name);
        setEvidenceEditor(null);
        queueSavedState();
      }} />}
      {evidenceViewer && <EvidenceViewer item={evidenceViewer} onClose={() => setEvidenceViewer(null)} />}
      {evidenceRemoving && <ConfirmDialog eyebrow="Evidence" title={`Delete ${evidenceRemoving.title}?`} body="This evidence record will be removed from this requirement. This cannot be undone." confirmLabel="Delete evidence" cancelLabel="Keep evidence" onCancel={() => setEvidenceRemoving(null)} onConfirm={() => { removeEvidence(requirement.id, evidenceRemoving.id, user?.name); queueSavedState(); setEvidenceRemoving(null); }} />}
    </div>
  );
}
