import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
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
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAssessment } from "../model/useAssessment";
import { useAuth } from "../../auth";
import { actionComplete, performanceForResponse } from "../../../shared/domain/assessment";
import type { ActionItem, EvidenceItem, Requirement, ResponseValue } from "../../../shared/types";
import { Button, ConfirmDialog, eyebrowClasses, IconButton, PerformanceBadge, ProgressBar, SaveStatus, Select } from "../../../shared/ui/UI";
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

/** Off-canvas "sheet" overlay (mobile requirement navigator). Mirrors ConfirmDialog's layer
 * recipe: a fixed backdrop plus a panel, anchored to an edge instead of centered. */
const sheetLayerClass = "sheet-layer fixed inset-0 z-100 grid place-items-center wide:hidden";
const sheetBackdropClass = "sheet-backdrop absolute inset-0 border-0 bg-slate-950/50 backdrop-blur-sm";
const sheetClass = "sheet absolute inset-y-0 max-w-97.5 w-full overflow-x-hidden overflow-y-auto bg-white shadow-2xl dark:bg-slate-900";

const requirementMobileToolbarClass = "requirement-mobile-toolbar sticky z-8 flex justify-end gap-2.5 border-b border-slate-200 p-2.5 backdrop-blur-md wide:hidden dark:border-slate-700";
const requirementNavigatorWrapClass = "requirement-layout__navigator hidden shell:sticky shell:block shell:w-100 shell:flex-none shell:self-start";

const questionEvidenceTitleClass = "question-evidence__title flex items-center gap-1.5 text-xs font-bold tracking-wide text-kc-blue-700 dark:text-kc-blue-300";
const questionEvidenceNoticeClass = "question-evidence grid gap-2 mt-3.5 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800";
const questionNumberClass = "question-number grid size-8 flex-none place-items-center rounded-lg bg-kc-blue-50 text-sm font-extrabold text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200";

const dropzoneClass = "dropzone grid min-h-42 w-full place-content-center place-items-center gap-2 rounded-lg border-2 border-dashed border-kc-blue-300 bg-kc-blue-50 p-4 text-center text-slate-700 hover:border-kc-blue-600 hover:bg-kc-blue-100 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-slate-300 dark:hover:bg-kc-blue-900";
const dropzoneIconClass = "dropzone__icon grid size-12 place-items-center rounded-xl bg-white text-kc-blue-700 shadow-sm dark:bg-slate-800 dark:text-kc-blue-300";

/** Completed/total count for the navigator's section/sub-section rows — just the figure, no bar;
 * the check/warning/circle state icon next to it already carries the at-a-glance signal. */
function NavProgress({ completed, total }: { completed: number; total: number }) {
  return <small className="nav-progress flex-none text-xs font-semibold whitespace-nowrap text-slate-500 tabular-nums dark:text-slate-400">{completed}/{total}</small>;
}

/** Rollup state for a group of requirements (a section or sub-section), reusing the same
 * complete/gap/incomplete vocabulary the old per-item navigator used. */
function groupState(items: Requirement[]) {
  if (items.every((item) => actionComplete(item.response, item.action))) return "complete";
  if (items.some((item) => item.response === "no" || item.response === "partial")) return "gap";
  return "incomplete";
}

function NavigatorState({ state }: { state: string }) {
  if (state === "complete") return <CheckCircle2 size={16} className="nav-state nav-state--complete flex-none text-emerald-700 dark:text-emerald-300" />;
  if (state === "gap") return <AlertTriangle size={16} className="nav-state nav-state--gap flex-none text-amber-700 dark:text-amber-300" />;
  return <Circle size={15} className="nav-state nav-state--incomplete flex-none text-slate-400 dark:text-slate-500" />;
}

function AssessmentNavigator({
  requirements,
  currentSectionId,
  currentSubsection,
  onNavigate,
  onClose,
}: {
  requirements: Requirement[];
  currentSectionId: string;
  currentSubsection?: string;
  onNavigate: (requirement: Requirement) => void;
  onClose?: () => void;
}) {
  // Sections nest sub-sections, which nest their requirement-questions. The navigator only ever
  // surfaces the section/sub-section names and a rollup progress — the individual questions
  // themselves are read from the main panel now, which lists every one of them in place.
  const sectionGroups = useMemo(() => {
    const bySection = new Map<string, { sectionId: string; subsections: Map<string, Requirement[]> }>();
    requirements.forEach((requirement) => {
      const section = bySection.get(requirement.sectionName) ?? { sectionId: requirement.sectionId, subsections: new Map<string, Requirement[]>() };
      const items = section.subsections.get(requirement.subsection) ?? [];
      items.push(requirement);
      section.subsections.set(requirement.subsection, items);
      bySection.set(requirement.sectionName, section);
    });
    return [...bySection.entries()].map(([sectionName, section]) => ({
      sectionName,
      sectionId: section.sectionId,
      items: [...section.subsections.values()].flat(),
      subsections: [...section.subsections.entries()].map(([subsection, items]) => ({ subsection, items })),
    }));
  }, [requirements]);
  const completed = requirements.filter((requirement) => actionComplete(requirement.response, requirement.action)).length;
  const isIncomplete = (requirement: Requirement) => !actionComplete(requirement.response, requirement.action);
  const currentSectionIndex = requirements.findIndex((requirement) => requirement.sectionId === currentSectionId);
  const ordered = [...requirements.slice(currentSectionIndex + 1), ...requirements.slice(0, currentSectionIndex + 1)];
  const nextIncomplete = ordered.find(isIncomplete);
  // Rendered both as the sticky desktop rail (no onClose) and inside the mobile sheet (onClose
  // supplied) — the sheet already draws its own edge, so the rail-only border is dropped there.
  const inSheet = Boolean(onClose);
  const currentSection = sectionGroups.find((section) => section.sectionId === currentSectionId);

  return (
    <aside className={cx("assessment-navigator flex h-full flex-col overflow-x-hidden overflow-y-auto bg-white p-4 dark:bg-slate-900", !inSheet && "border-r border-slate-200 dark:border-slate-700")} aria-label="Assessment navigator">
      <div className="assessment-navigator__header mb-4 flex items-start justify-between gap-3">
        <div>
          <p className={eyebrowClasses}>Current section</p>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{currentSection?.sectionName ?? "Assessment"}</h2>
        </div>
        {onClose && <IconButton label="Close assessment navigator" onClick={onClose}><X size={19} /></IconButton>}
      </div>
      <ProgressBar value={Math.round((completed / requirements.length) * 100)} label="Requirements complete" />
      <div className="navigator-group mt-4 flex-1">
        <div className="navigator-items grid gap-1">
          {sectionGroups.map((section) => {
            const sectionCompleted = section.items.filter((item) => actionComplete(item.response, item.action)).length;
            const sectionActive = section.sectionId === currentSectionId;
            return (
              <div key={section.sectionId} className="navigator-section grid gap-0.5">
                <button
                  type="button"
                  className="navigator-section__trigger flex w-full min-w-0 items-center gap-2 rounded-lg border border-transparent bg-transparent px-1.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => onNavigate(section.items[0])}
                >
                  <NavigatorState state={groupState(section.items)} />
                  <span className={cx("min-w-0 flex-1 truncate text-[11px] font-normal tracking-wide", sectionActive ? "text-kc-blue-700 dark:text-kc-blue-300" : "text-slate-500 dark:text-slate-400")}>{section.sectionName}</span>
                  <NavProgress completed={sectionCompleted} total={section.items.length} />
                </button>
                <div className="navigator-subgroup grid gap-0.5 pl-6.5">
                  {section.subsections.map((sub) => {
                    const subCompleted = sub.items.filter((item) => actionComplete(item.response, item.action)).length;
                    const subActive = sectionActive && sub.subsection === currentSubsection;
                    return (
                      <button
                        key={`${section.sectionId}::${sub.subsection}`}
                        type="button"
                        className={cx(
                          "navigator-subgroup__trigger flex min-h-9.5 w-full min-w-0 items-center gap-2 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-left hover:bg-slate-50 dark:hover:bg-slate-800",
                          subActive && "navigator-subgroup__trigger--active border-kc-blue-300 bg-linear-to-r from-kc-blue-50 to-kc-blue-100 shadow-sm dark:border-kc-blue-600 dark:from-kc-blue-950 dark:to-kc-blue-900",
                        )}
                        onClick={() => onNavigate(sub.items[0])}
                      >
                        <NavigatorState state={groupState(sub.items)} />
                        <span className={cx("min-w-0 flex-1 truncate text-sm font-semibold", subActive ? "text-kc-blue-900 dark:text-kc-blue-100" : "text-slate-600 dark:text-slate-400")}>{sub.subsection || "General"}</span>
                        <NavProgress completed={subCompleted} total={sub.items.length} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
    <div className="question-evidence question-evidence--attachments grid gap-2 mt-3.5 rounded-md border border-slate-200 bg-kc-blue-50 p-3.5 dark:border-slate-700 dark:bg-kc-blue-950">
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

/** One requirement's editable card in the section list. Owns its own response/action draft and
 * save state so many of these can sit on the page at once without a single page-wide dirty flag —
 * each card is reviewed and saved independently, matching the explicit Save model (no autosave). */
function RequirementCard({
  requirement,
  highlighted,
  onSave,
  onAddEvidence,
  onViewEvidence,
  onEditEvidence,
  onDeleteEvidence,
}: {
  requirement: Requirement;
  highlighted: boolean;
  onSave: (id: string, update: { response: ResponseValue; action?: ActionItem }) => void;
  onAddEvidence: (requirementId: string) => void;
  onViewEvidence: (item: EvidenceItem) => void;
  onEditEvidence: (item: EvidenceItem) => void;
  onDeleteEvidence: (item: EvidenceItem) => void;
}) {
  const [draft, setDraft] = useState(requirement);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"saving" | "saved" | "failed" | "attention">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(requirement);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirement.id]);

  function change(update: Partial<Requirement>) {
    setDraft((current) => ({ ...current, ...update }));
    setDirty(true);
  }

  function save() {
    onSave(draft.id, { response: draft.response, action: draft.action });
    setDirty(false);
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState("saved"), 500);
  }

  return (
    <article
      className={cx(
        "question-card rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm max-md:p-3.5 dark:border-slate-700 dark:bg-slate-900",
        highlighted && "question-card--highlighted border-kc-blue-400 ring-3 ring-kc-blue-100 dark:border-kc-blue-500 dark:ring-kc-blue-900",
      )}
      id={`question-${requirement.id}`}
    >
      <div className="question-card__header flex flex-wrap items-start gap-3">
        <span className={questionNumberClass}>{draft.number}</span>
        <div className="min-w-0 flex-1">
          <p className={eyebrowClasses}>{draft.requirementId}{draft.subsection ? ` · ${draft.subsection}` : ""}</p>
          <h3 className="mt-1 max-w-195 text-base leading-relaxed whitespace-pre-line text-slate-900 dark:text-slate-100">{draft.text}</h3>
        </div>
        <PerformanceBadge performance={performanceForResponse(draft.response)} compact />
      </div>
      {Boolean(draft.guidance?.length) && (
        <details className="how-to-meet mt-3.5 rounded-md border border-kc-blue-200 bg-kc-blue-50 px-3 py-2.5 dark:border-kc-blue-800 dark:bg-kc-blue-950">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-bold tracking-wide text-kc-blue-700 dark:text-kc-blue-300">
            <BookOpen size={14} /> How to meet this requirement
          </summary>
          <ul className="m-0 mt-2 grid gap-1.5 pl-4.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {draft.guidance.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </details>
      )}
      {/* A "No" response means the requirement isn't in place yet, so there's nothing to attach
          evidence of — the evidence panel only applies once a response of Partial or Yes claims
          some level of implementation. */}
      {Boolean(draft.evidenceRequired ?? draft.expectedEvidence?.length) && draft.response !== "no" && (
        <>
          <div className={questionEvidenceNoticeClass}>
            <span className={questionEvidenceTitleClass}><Paperclip size={14} /> Evidence required <small className="ml-auto text-xs font-medium text-slate-500 normal-case tracking-normal dark:text-slate-400">Attach evidence even when the response is Partial or Yes, if it is available.</small></span>
            <ul className="m-0 mt-2 grid gap-1.5 pl-4.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {(draft.expectedEvidence ?? []).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <QuestionEvidenceAttachments evidence={requirement.evidence} questionNumber={draft.number} onAdd={() => onAddEvidence(requirement.id)} onView={onViewEvidence} onEdit={onEditEvidence} onDelete={onDeleteEvidence} />
        </>
      )}
      <ResponseSelector questionId={draft.id} value={draft.response} onChange={(response) => change({ response })} />
      <ActionEditor action={draft.action} response={draft.response} onChange={(action) => change({ action })} onRemove={() => change({ action: undefined })} />
      <div className="question-card__footer mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span>{draft.response ? "Answered" : "Not yet answered"}</span>
        <span className="divider-dot size-1 rounded-full bg-slate-400 max-sm:hidden dark:bg-slate-500" />
        <span className="max-sm:hidden"><SaveStatus state={saveState} /></span>
        <Button className="ml-auto" variant="secondary" disabled={!dirty} onClick={save} icon={<Check size={16} />}>Save</Button>
      </div>
    </article>
  );
}

export default function RequirementWorkspace() {
  const { sectionId, requirementId } = useParams();
  const navigate = useNavigate();
  const { requirements, updateQuestion, addEvidence, updateEvidence, removeEvidence } = useAssessment();
  const { user } = useAuth();
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [evidenceEditor, setEvidenceEditor] = useState<{ mode: "new"; requirementId: string } | { mode: "edit"; requirementId: string; item: EvidenceItem } | null>(null);
  const [evidenceViewer, setEvidenceViewer] = useState<EvidenceItem | null>(null);
  const [evidenceRemoving, setEvidenceRemoving] = useState<{ requirementId: string; item: EvidenceItem } | null>(null);

  const sectionRequirements = useMemo(() => requirements.filter((item) => item.sectionId === sectionId), [requirements, sectionId]);
  const highlighted = sectionRequirements.find((item) => item.id === requirementId) ?? sectionRequirements[0];
  const subsectionGroups = useMemo(() => {
    const bySubsection = new Map<string, Requirement[]>();
    sectionRequirements.forEach((item) => {
      const items = bySubsection.get(item.subsection) ?? [];
      items.push(item);
      bySubsection.set(item.subsection, items);
    });
    return [...bySubsection.entries()].map(([subsection, items]) => ({ subsection, items }));
  }, [sectionRequirements]);

  const sectionOrder = useMemo(() => [...new Set(requirements.map((item) => item.sectionId))], [requirements]);
  const sectionIndex = sectionOrder.indexOf(sectionId ?? "");
  const previousSectionId = sectionIndex > 0 ? sectionOrder[sectionIndex - 1] : undefined;
  const nextSectionId = sectionIndex >= 0 && sectionIndex < sectionOrder.length - 1 ? sectionOrder[sectionIndex + 1] : undefined;
  const firstInSection = (id: string) => requirements.find((item) => item.sectionId === id);

  useEffect(() => {
    if (!requirementId) return;
    document.getElementById(`question-${requirementId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sectionId, requirementId]);

  if (!sectionRequirements.length) return <Navigate to="/assessment" replace />;

  function saveRequirement(id: string, update: { response: ResponseValue; action?: ActionItem }) {
    updateQuestion(id, update, user?.name);
  }

  function moveTo(target: Requirement) {
    setNavigatorOpen(false);
    navigate(`/assessment/${target.sectionId}/${target.id}`);
  }

  return (
    <div className="requirement-page min-w-0">
      <div className={requirementMobileToolbarClass} style={{ top: "var(--content-offset)", background: "var(--surface-mobile-bar)" }}>
        <Button variant="secondary" icon={<Menu size={18} />} onClick={() => setNavigatorOpen(true)}>Requirements</Button>
      </div>
      <div className="requirement-layout min-w-0 w-full shell:flex shell:items-stretch" style={{ minHeight: "calc(100vh - var(--content-offset))" }}>
        <div className={requirementNavigatorWrapClass} style={{ top: "var(--content-offset)", height: "calc(100vh - var(--content-offset))" }}>
          <AssessmentNavigator requirements={requirements} currentSectionId={sectionId ?? ""} currentSubsection={highlighted?.subsection} onNavigate={moveTo} />
        </div>
        <div className="requirement-main min-w-0 pt-4 pb-12 shell:flex-1 md:pt-6 md:pb-16" style={{ paddingInline: "var(--page-gutter)" }}>
          <nav className={breadcrumbsClass} aria-label="Breadcrumb">
            <Link className={breadcrumbsLinkClass} to="/assessment">Self-assessment</Link>
            <ChevronRight size={15} />
            <span aria-current="page">{sectionRequirements[0].sectionName}</span>
          </nav>
          {subsectionGroups.map((group, groupIndex) => (
            <section className={cx("questions-section", groupIndex === 0 ? "mt-2" : "mt-6")} aria-labelledby={`subsection-${group.subsection}`} key={group.subsection}>
              <div className={sectionTitleRowClass}>
                <div>
                  <p className={eyebrowClasses}>Sub-section</p>
                  <h2 className={sectionTitleHeadingClass} id={`subsection-${group.subsection}`}>{group.subsection || "General"}</h2>
                </div>
                <span className={sectionTitleCountClass}>{group.items.filter((item) => actionComplete(item.response, item.action)).length} of {group.items.length} answered</span>
              </div>
              <div className="question-list grid gap-4">
                {group.items.map((item) => (
                  <RequirementCard
                    key={item.id}
                    requirement={item}
                    highlighted={item.id === highlighted?.id}
                    onSave={saveRequirement}
                    onAddEvidence={(id) => setEvidenceEditor({ mode: "new", requirementId: id })}
                    onViewEvidence={setEvidenceViewer}
                    onEditEvidence={(evidenceItem) => setEvidenceEditor({ mode: "edit", requirementId: item.id, item: evidenceItem })}
                    onDeleteEvidence={(evidenceItem) => setEvidenceRemoving({ requirementId: item.id, item: evidenceItem })}
                  />
                ))}
              </div>
            </section>
          ))}
          <footer
            className="requirement-footer sticky bottom-24 z-5 mt-6 flex w-full items-center justify-between gap-2.5 rounded-xl border p-3 shell:bottom-6 shell:p-3.5"
            style={{
              borderColor: "var(--border-translucent)",
              background: "var(--surface-translucent)",
              boxShadow: "0 12px 34px rgb(15 23 42 / 0.12)",
              backdropFilter: "blur(18px)",
              // Adds the device safe-area inset ON TOP of the padding the p-3/p-3.5 classes
              // already set — a plain `env(safe-area-inset-bottom)` here would replace that
              // padding outright (inline styles win over classes), collapsing it to 0 on any
              // browser without a safe-area inset and pinning the buttons to the bottom edge.
              paddingBottom: "calc(0.875rem + env(safe-area-inset-bottom))",
            }}
          >
            <Button variant="secondary" icon={<ArrowLeft size={18} />} disabled={!previousSectionId} onClick={() => { const target = previousSectionId && firstInSection(previousSectionId); if (target) moveTo(target); }}>Previous section</Button>
            <Button variant="primary" disabled={!nextSectionId} onClick={() => { const target = nextSectionId && firstInSection(nextSectionId); if (target) moveTo(target); }} icon={<ArrowRight size={18} />} iconPosition="end">Next section</Button>
          </footer>
        </div>
      </div>
      {navigatorOpen && (
        <div className={sheetLayerClass}>
          <button className={sheetBackdropClass} aria-label="Close navigator" onClick={() => setNavigatorOpen(false)} />
          <div className={cx(sheetClass, "sheet--left left-0 right-8")}>
            <AssessmentNavigator requirements={requirements} currentSectionId={sectionId ?? ""} currentSubsection={highlighted?.subsection} onNavigate={moveTo} onClose={() => setNavigatorOpen(false)} />
          </div>
        </div>
      )}
      {evidenceEditor && <EvidenceDialog
        item={evidenceEditor.mode === "new" ? undefined : evidenceEditor.item}
        response={sectionRequirements.find((item) => item.id === evidenceEditor.requirementId)?.response ?? null}
        onClose={() => setEvidenceEditor(null)} onSave={(item) => {
        if (evidenceEditor.mode === "new") addEvidence(evidenceEditor.requirementId, { ...item, questionId: evidenceEditor.requirementId }, user?.name); else updateEvidence(evidenceEditor.requirementId, item, user?.name);
        setEvidenceEditor(null);
      }} />}
      {evidenceViewer && <EvidenceViewer item={evidenceViewer} onClose={() => setEvidenceViewer(null)} />}
      {evidenceRemoving && <ConfirmDialog eyebrow="Evidence" title={`Delete ${evidenceRemoving.item.title}?`} body="This evidence record will be removed from this requirement. This cannot be undone." confirmLabel="Delete evidence" cancelLabel="Keep evidence" onCancel={() => setEvidenceRemoving(null)} onConfirm={() => { removeEvidence(evidenceRemoving.requirementId, evidenceRemoving.item.id, user?.name); setEvidenceRemoving(null); }} />}
    </div>
  );
}
