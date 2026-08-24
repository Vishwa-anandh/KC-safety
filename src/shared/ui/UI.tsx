import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDotDashed,
  Clock3,
  Info,
  Minus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { performanceLabel } from "../domain/assessment";
import type { Performance } from "../types";
import { cx } from "../utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "compact" | "default" | "large";
  icon?: ReactNode;
  /** Which side of the label `icon` renders on. Icon and label are always separate flex
   * children of the button — never siblings inside the same <span> — so an icon (display:
   * block, per the global svg reset) can never force a line break in the middle of the label. */
  iconPosition?: "start" | "end";
};

export function Button({
  variant = "secondary",
  size = "default",
  icon,
  iconPosition = "start",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cx("button", `button--${variant}`, `button--${size}`, className)} {...props}>
      {iconPosition === "start" && icon}
      <span>{children}</span>
      {iconPosition === "end" && icon}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className,
  tooltipPlacement = "bottom",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tooltipPlacement?: "top" | "right" | "bottom" | "left";
}) {
  const tooltipId = useId();
  return (
    <button {...props} className={cx("icon-button", className)} aria-label={label} aria-describedby={tooltipId}>
      {children}
      <span id={tooltipId} className={cx("app-tooltip", `app-tooltip--${tooltipPlacement}`)} role="tooltip">
        {label}
      </span>
    </button>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Custom single-select dropdown — replaces native <select> for filter menus, which render
 * an OS-drawn popup no CSS can restyle. Themeable, matches the app's other popovers (see
 * ProfileMenu), and follows the ARIA listbox pattern: trigger button (aria-haspopup="listbox")
 * + role="listbox" popup, arrow-key/Home/End navigation, Enter/Space to choose, Escape or an
 * outside click to dismiss without changing the value.
 */
export function Select({
  value,
  onChange,
  options,
  label,
  icon,
  className,
  searchable = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  icon?: ReactNode;
  className?: string;
  /** Adds a search box above the list — use for lists long enough that arrow-keying through
   * every option (e.g. a site list that can run into the hundreds) is impractical. */
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value) ?? options[0];
  const filteredOptions = searchable && query.trim()
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  // The popover renders in a portal on document.body (see below), so it must be positioned
  // manually against the trigger. Recomputed on open, scroll, and resize.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = wrapRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const GAP = 6;
      const MARGIN = 12;
      const wanted = Math.min(320, Math.max(120, filteredOptions.length * 36 + (searchable ? 56 : 12)));
      const spaceBelow = window.innerHeight - trigger.bottom - GAP - MARGIN;
      const spaceAbove = trigger.top - GAP - MARGIN;
      // Prefer below, but drop above when there is meaningfully more room there. Either way the
      // popover is capped to the space actually available, so it can never run off-screen —
      // a plain flip still overflowed when neither side could fit the full list.
      const openUp = spaceBelow < wanted && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, Math.min(wanted, openUp ? spaceAbove : spaceBelow));
      setAnchor({
        left: Math.max(MARGIN, Math.min(trigger.left, window.innerWidth - trigger.width - MARGIN)),
        top: openUp ? trigger.top - GAP - maxHeight : trigger.bottom + GAP,
        width: trigger.width,
        maxHeight,
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, searchable, filteredOptions.length]);

  useEffect(() => {
    if (!open) return;
    (searchable ? searchRef.current : listRef.current)?.focus();
    const closeOnOutsidePress = (event: PointerEvent) => {
      // The popover is portalled outside wrapRef, so it must be checked separately —
      // otherwise pointerdown on an option would close the list before its click landed.
      const target = event.target as Node;
      if (!wrapRef.current?.contains(target) && !popoverRef.current?.contains(target)) setOpen(false);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, searchable]);

  function openList() {
    setQuery("");
    const activeIndex = options.findIndex((option) => option.value === value);
    setHighlighted(activeIndex >= 0 ? activeIndex : 0);
    setOpen(true);
  }

  function choose(index: number) {
    const option = filteredOptions[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLUListElement | HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setHighlighted((current) => Math.min(filteredOptions.length - 1, current + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setHighlighted((current) => Math.max(0, current - 1)); }
    else if (event.key === "Home") { event.preventDefault(); setHighlighted(0); }
    else if (event.key === "End") { event.preventDefault(); setHighlighted(filteredOptions.length - 1); }
    else if (event.key === "Enter") { event.preventDefault(); choose(highlighted); }
    else if (event.key === " " && !searchable) { event.preventDefault(); choose(highlighted); }
    else if (event.key === "Tab") { setOpen(false); }
  }

  function renderOption(option: SelectOption, index: number) {
    return (
      <li
        key={option.value}
        id={`${listId}-${index}`}
        role="option"
        aria-selected={option.value === value}
        className={cx("select-option", index === highlighted && "select-option--highlighted", option.value === value && "select-option--selected")}
        onMouseEnter={() => setHighlighted(index)}
        onClick={() => choose(index)}
      >
        <span className="select-option__check">{option.value === value && <Check size={15} />}</span>
        <span>{option.label}</span>
      </li>
    );
  }

  return (
    <div className={cx("select-control", open && "select-control--open", className)} ref={wrapRef}>
      {icon}
      <button
        type="button"
        className="select-control__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <span>{current?.label}</span>
        <ChevronDown size={16} className={cx("select-control__chevron", open && "select-control__chevron--open")} />
      </button>
      {open && anchor && createPortal(
        <div
          ref={popoverRef}
          className="select-portal"
          style={{ left: anchor.left, top: anchor.top, minWidth: anchor.width, maxHeight: anchor.maxHeight }}
        >
          {searchable ? (
            <div className="select-popover select-popover--searchable">
              <input
                ref={searchRef}
                className="select-popover__search"
                type="text"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setHighlighted(0); }}
                onKeyDown={handleListKeyDown}
                placeholder={`Search ${label.toLowerCase()}`}
                aria-label={`Search ${label}`}
              />
              <ul
                ref={listRef}
                role="listbox"
                aria-label={label}
                aria-activedescendant={filteredOptions.length ? `${listId}-${highlighted}` : undefined}
                className="select-popover__list"
                tabIndex={-1}
              >
                {filteredOptions.length ? filteredOptions.map(renderOption) : <li className="select-popover__empty">No matches</li>}
              </ul>
            </div>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              aria-label={label}
              aria-activedescendant={options.length ? `${listId}-${highlighted}` : undefined}
              className="select-popover"
              tabIndex={-1}
              onKeyDown={handleListKeyDown}
            >
              {options.map(renderOption)}
            </ul>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

const performanceIcon = {
  initial: <X size={14} strokeWidth={2.6} />,
  emerging: <Minus size={14} strokeWidth={2.6} />,
  performing: <Check size={14} strokeWidth={2.6} />,
  "not-assessed": <Circle size={13} />,
};

export function PerformanceBadge({ performance, compact = false }: { performance: Performance; compact?: boolean }) {
  return (
    <span className={cx("status-badge", `status-badge--${performance}`, compact && "status-badge--compact")}>
      {performanceIcon[performance]}
      {performanceLabel(performance)}
    </span>
  );
}

export function CompletionBadge({ value }: { value: number }) {
  const state = value === 0 ? "not-started" : value === 100 ? "complete" : "in-progress";
  const icon = state === "complete" ? <Check size={14} /> : state === "not-started" ? <Circle size={13} /> : <Clock3 size={14} />;
  return (
    <span className={cx("completion-badge", `completion-badge--${state}`)}>
      {icon}
      {value}%
    </span>
  );
}

export function ProgressBar({ value, label, tone = "brand" }: { value: number; label?: string; tone?: "brand" | "success" | "warning" }) {
  return (
    <div className="progress-wrap">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          <strong>{value}%</strong>
        </div>
      )}
      <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label ?? "Progress"}>
        <span className={cx("progress-fill", `progress-fill--${tone}`)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger";
}) {
  return (
    <article className={cx("metric-card", `metric-card--${tone}`)}>
      <div className="metric-card__icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

export function InlineMessage({
  tone,
  title,
  children,
  className,
}: {
  tone: "info" | "success" | "warning" | "danger";
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const icon = {
    info: <Info size={20} />,
    success: <CheckCircle2 size={20} />,
    warning: <AlertCircle size={20} />,
    danger: <AlertCircle size={20} />,
  }[tone];
  return (
    <div className={cx("inline-message", `inline-message--${tone}`, className)}>
      <span className="inline-message__icon">{icon}</span>
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function SaveStatus({ state = "saved" }: { state?: "saving" | "saved" | "failed" | "attention" }) {
  return (
    <span className={cx("save-status", `save-status--${state}`)} role="status" aria-live="polite">
      {state === "saved" && <CheckCircle2 size={16} />}
      {state === "saving" && <CircleDotDashed size={16} className="spin" />}
      {state === "failed" && <AlertCircle size={16} />}
      {state === "attention" && <AlertCircle size={16} />}
      {state === "saved" ? "Saved just now" : state === "saving" ? "Saving changes" : state === "attention" ? "Action details required" : "Save failed"}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}

export interface CheckboxListOption {
  value: string;
  label: string;
  hint?: string;
  /** Optional group heading (e.g. a region) — options should already be sorted by group;
   * a heading row is inserted wherever the group changes between consecutive options. */
  group?: string;
}

export function CheckboxList({
  options,
  selected,
  onChange,
  label,
  searchable = false,
}: {
  options: CheckboxListOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  label: string;
  /** Adds a search box, a scrollable capped height, and Select all/Clear actions — use once
   * the option count can run into the hundreds (e.g. a site list), where a flat unbounded list
   * with no bulk actions stops working. */
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = searchable && query.trim()
    ? options.filter((option) => `${option.label} ${option.hint ?? ""} ${option.group ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()))
    : options;
  const allFilteredSelected = filtered.length > 0 && filtered.every((option) => selected.includes(option.value));

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((current) => current !== value) : [...selected, value]);
  }

  // Selects (or clears) every option currently visible under the search filter, leaving any
  // selection outside that filtered set untouched — so narrowing to "APAC" and hitting Select
  // all doesn't disturb sites already picked from an earlier search.
  function toggleAllFiltered() {
    const filteredValues = filtered.map((option) => option.value);
    onChange(allFilteredSelected
      ? selected.filter((value) => !filteredValues.includes(value))
      : [...new Set([...selected, ...filteredValues])]);
  }

  return (
    <div className="checkbox-list-wrap">
      {searchable && (
        <div className="checkbox-list__toolbar">
          <label className="search-control">
            <Search size={16} />
            <input type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label}`} />
          </label>
          <div className="checkbox-list__bulk">
            <button type="button" onClick={toggleAllFiltered} disabled={!filtered.length}>{allFilteredSelected ? "Deselect all" : query.trim() ? "Select all matching" : "Select all"}</button>
            <span className="checkbox-list__count">
              {selected.length} selected
              {selected.length > 0 && <button type="button" onClick={() => onChange([])}>Clear</button>}
            </span>
          </div>
        </div>
      )}
      <div className={cx("checkbox-list", searchable && "checkbox-list--scroll")} role="group" aria-label={label}>
        {filtered.length ? filtered.map((option, index) => {
          const checked = selected.includes(option.value);
          const showGroupHeading = option.group && option.group !== filtered[index - 1]?.group;
          return (
            <Fragment key={option.value}>
              {showGroupHeading && <p className="checkbox-list__group">{option.group}</p>}
              <label className={cx("checkbox-list__row", checked && "checkbox-list__row--checked")}>
                <input type="checkbox" checked={checked} onChange={() => toggle(option.value)} />
                <span>
                  <strong>{option.label}</strong>
                  {option.hint && <small>{option.hint}</small>}
                </span>
                {checked && <CheckCircle2 size={18} />}
              </label>
            </Fragment>
          );
        }) : <p className="checkbox-list__empty">No matches for "{query}"</p>}
      </div>
    </div>
  );
}

export function KcLogo() {
  return (
    <div className="kc-mark" aria-label="Kimberly-Clark">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M7 20c0-7.2 5.8-13 13-13 5 0 9.4 2.8 11.6 7l-6.2 3.2A6.2 6.2 0 0 0 20 14a6 6 0 1 0 5.5 8.5l6.4 2.8A13 13 0 0 1 7 20Z" />
        <path d="m21 8 7 12-7 12-4.8-2.8 5.4-9.2-5.4-9.2L21 8Z" opacity=".52" />
      </svg>
    </div>
  );
}

/**
 * Confirmation for destructive actions. Uses role="alertdialog" (not "dialog") because it
 * interrupts the user to confirm a consequence, and focuses the cancel button so the safe
 * option is the one that responds to an immediate Enter press.
 */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  eyebrow = "Confirm",
  onConfirm,
  onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  eyebrow?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  return (
    <div className="dialog-layer">
      <button className="dialog-backdrop" aria-label={cancelLabel} onClick={onCancel} />
      <section className="dialog dialog--compact" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="dialog__header">
          <div><p className="eyebrow">{eyebrow}</p><h2 id={titleId}>{title}</h2></div>
          <IconButton label={cancelLabel} onClick={onCancel}><X size={20} /></IconButton>
        </div>
        <p className="dialog-context">{body}</p>
        <div className="dialog__footer">
          <Button autoFocus variant="tertiary" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="danger" icon={<Trash2 size={17} />} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
}
