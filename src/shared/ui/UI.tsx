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

/** Canonical button recipe. Every other file copies these exact strings, so they must not drift. */
const buttonBase = "button inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-semibold whitespace-nowrap transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500";

const buttonVariant = {
  primary: "bg-kc-blue-600 text-white hover:not-disabled:bg-kc-blue-700 active:not-disabled:bg-kc-blue-800",
  secondary: "border-slate-300 bg-white text-slate-800 hover:not-disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:not-disabled:bg-slate-700",
  tertiary: "bg-transparent text-kc-blue-700 hover:not-disabled:bg-kc-blue-50 hover:not-disabled:text-kc-blue-900 dark:text-kc-blue-300 dark:hover:not-disabled:bg-kc-blue-950",
  danger: "bg-red-700 text-white hover:not-disabled:bg-red-800",
};

const buttonSize = {
  compact: "min-h-8 px-3 text-sm",
  default: "min-h-10 px-4 py-2.5",
  large: "min-h-12 px-5 py-3",
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
    <button className={cx(buttonBase, buttonVariant[variant], buttonSize[size], className)} {...props}>
      {iconPosition === "start" && icon}
      <span>{children}</span>
      {iconPosition === "end" && icon}
    </button>
  );
}

/** Tooltip chrome shared by all four placements. The tooltip is always a direct child of the
 * icon button, so its reveal is driven by the button's own named group rather than a
 * descendant selector — a nested `group` in a consumer cannot hijack it. */
const tooltipBase = "app-tooltip pointer-events-none invisible absolute z-320 w-max max-w-56 rounded-lg border border-kc-blue-700 bg-kc-blue-900 px-3 py-2 text-xs leading-tight font-semibold whitespace-normal text-white opacity-0 shadow-lg transition-all delay-100 duration-150 group-hover/icon-button:visible group-hover/icon-button:opacity-100 group-hover/icon-button:delay-200 group-focus-visible/icon-button:visible group-focus-visible/icon-button:opacity-100 group-focus-visible/icon-button:delay-200 after:absolute after:size-2 after:rotate-45 after:border-kc-blue-700 after:bg-kc-blue-950 pointer-coarse:hidden";

const tooltipPlacementClasses = {
  bottom: "top-full left-1/2 mt-2.5 -translate-x-1/2 -translate-y-1 group-hover/icon-button:translate-y-0 group-focus-visible/icon-button:translate-y-0 after:-top-1 after:left-1/2 after:-ml-1 after:border-t after:border-l",
  top: "bottom-full left-1/2 mb-2.5 -translate-x-1/2 translate-y-1 group-hover/icon-button:translate-y-0 group-focus-visible/icon-button:translate-y-0 after:-bottom-1 after:left-1/2 after:-ml-1 after:border-r after:border-b",
  right: "top-1/2 left-full ml-3 translate-x-1 -translate-y-1/2 group-hover/icon-button:translate-x-0 group-focus-visible/icon-button:translate-x-0 after:top-1/2 after:-left-1 after:-mt-1 after:border-b after:border-l",
  left: "top-1/2 right-full mr-3 -translate-x-1 -translate-y-1/2 group-hover/icon-button:translate-x-0 group-focus-visible/icon-button:translate-x-0 after:top-1/2 after:-right-1 after:-mt-1 after:border-t after:border-r",
};

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
    <button {...props} className={cx("icon-button group/icon-button relative inline-flex size-10 flex-none items-center justify-center rounded-lg bg-transparent text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100", className)} aria-label={label} aria-describedby={tooltipId}>
      {children}
      <span id={tooltipId} className={cx(tooltipBase, tooltipPlacementClasses[tooltipPlacement])} role="tooltip">
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
        className={cx("select-option flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 dark:text-slate-300", index === highlighted && "select-option--highlighted bg-kc-blue-50 dark:bg-kc-blue-950", option.value === value && "select-option--selected font-semibold text-kc-blue-800 dark:text-kc-blue-200")}
        onMouseEnter={() => setHighlighted(index)}
        onClick={() => choose(index)}
      >
        <span className={cx("select-option__check grid w-4 flex-none place-items-center text-kc-blue-600 dark:text-kc-blue-400")}>{option.value === value && <Check size={15} />}</span>
        <span className={cx("min-w-0 truncate")}>{option.label}</span>
      </li>
    );
  }

  return (
    <div className={cx("select-control relative flex w-full min-w-0 items-center md:w-auto md:min-w-44", open && "select-control--open", className)} ref={wrapRef}>
      {icon && <span className={cx("select-control__icon pointer-events-none absolute left-3 text-slate-500 dark:text-slate-400")}>{icon}</span>}
      <button
        type="button"
        className={cx("select-control__trigger flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white pr-3 text-left text-sm text-slate-800 outline-none transition-colors focus-visible:border-kc-blue-600 focus-visible:ring-3 focus-visible:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:ring-kc-blue-900", icon ? "pl-8" : "pl-3", open && "border-kc-blue-600 ring-3 ring-kc-blue-100 dark:ring-kc-blue-900")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <span className={cx("min-w-0 truncate")}>{current?.label}</span>
        <ChevronDown size={16} className={cx("select-control__chevron flex-none text-slate-500 transition-transform dark:text-slate-400", open && "select-control__chevron--open rotate-180")} />
      </button>
      {open && anchor && createPortal(
        <div
          ref={popoverRef}
          className={cx("select-portal fixed z-400 flex")}
          style={{ left: anchor.left, top: anchor.top, minWidth: anchor.width, maxHeight: anchor.maxHeight }}
        >
          {searchable ? (
            // max-height comes from the portal wrapper's inline style (the space actually
            // available), so the popover takes max-h-full and scrolls its list internally.
            <div className={cx("select-popover select-popover--searchable flex max-h-full w-max min-w-full max-w-80 flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl animate-select-popover-in dark:border-slate-600 dark:bg-slate-800")}>
              <input
                ref={searchRef}
                className={cx("select-popover__search m-1.5 min-w-0 flex-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-kc-blue-900")}
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
                className={cx("select-popover__list m-0 flex-1 list-none overflow-y-auto px-1 pb-1")}
                tabIndex={-1}
              >
                {filteredOptions.length ? filteredOptions.map(renderOption) : <li className={cx("select-popover__empty p-2.5 text-center text-sm text-slate-500 dark:text-slate-400")}>No matches</li>}
              </ul>
            </div>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              aria-label={label}
              aria-activedescendant={options.length ? `${listId}-${highlighted}` : undefined}
              className={cx("select-popover m-0 max-h-full w-max min-w-full max-w-80 list-none overflow-y-auto rounded-lg border border-slate-300 bg-white p-1 shadow-2xl animate-select-popover-in dark:border-slate-600 dark:bg-slate-800")}
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

/** Canonical tinted pill recipe, shared by every status/response/publish badge in the app. */
const pillBase = "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold whitespace-nowrap forced-colors:border-2 forced-colors:border-current";

const pillTone = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  neutral: "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
  brand: "border-kc-blue-200 bg-kc-blue-50 text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200",
};

const performanceTone = {
  initial: pillTone.danger,
  emerging: pillTone.warning,
  performing: pillTone.success,
  "not-assessed": pillTone.neutral,
};

export function PerformanceBadge({ performance, compact = false }: { performance: Performance; compact?: boolean }) {
  return (
    <span className={cx("status-badge", pillBase, performanceTone[performance], compact && "px-2 py-0.5")}>
      {performanceIcon[performance]}
      {performanceLabel(performance)}
    </span>
  );
}

export function CompletionBadge({ value }: { value: number }) {
  const state = value === 0 ? "not-started" : value === 100 ? "complete" : "in-progress";
  const icon = state === "complete" ? <Check size={14} /> : state === "not-started" ? <Circle size={13} /> : <Clock3 size={14} />;
  const tone = state === "complete" ? pillTone.success : state === "not-started" ? pillTone.neutral : pillTone.brand;
  return (
    <span className={cx("completion-badge", pillBase, tone)}>
      {icon}
      {value}%
    </span>
  );
}

export function ProgressBar({ value, label, tone = "brand" }: { value: number; label?: string; tone?: "brand" | "success" | "warning" }) {
  const fillTone = {
    brand: "bg-kc-blue-600",
    success: "bg-emerald-600 dark:bg-emerald-500",
    warning: "bg-amber-600 dark:bg-amber-500",
  }[tone];
  return (
    <div className={cx("progress-wrap min-w-0")}>
      {label && (
        <div className={cx("progress-label mb-1.5 flex justify-between gap-4 text-xs text-slate-600 dark:text-slate-400")}>
          <span>{label}</span>
          <strong className={cx("text-slate-800 dark:text-slate-200")}>{value}%</strong>
        </div>
      )}
      <div className={cx("progress-track relative h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700")} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label ?? "Progress"}>
        <span className={cx("progress-fill block h-full rounded-full transition-all duration-300 forced-colors:bg-forced-highlight", fillTone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** Canonical page-header type recipe. Reused by every screen's own header block. */
export const eyebrowClasses = "eyebrow text-sm font-semibold text-kc-blue-700 dark:text-kc-blue-300";

export function PageHeader({
  eyebrow,
  title,
  description,
  descriptionClassName,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  descriptionClassName?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={cx("page-header mb-7 grid gap-4 md:flex md:items-start md:justify-between md:gap-8")}>
      <div className={cx("page-header__copy max-w-3xl")}>
        {eyebrow && <p className={cx(eyebrowClasses)}>{eyebrow}</p>}
        <h1 className={cx("mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-slate-100")}>{title}</h1>
        {description && <p className={cx("mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400", descriptionClassName)}>{description}</p>}
      </div>
      {actions && <div className={cx("page-header__actions flex flex-wrap justify-stretch gap-2.5 pt-0.5 md:justify-end")}>{actions}</div>}
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
  const iconTone = {
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    brand: "bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300",
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  }[tone];
  return (
    // `isolate` makes the card its own stacking context, so the decorative -z-10 corner accent
    // paints above the card background but still behind the label, value, and detail text.
    <article className={cx("metric-card relative isolate flex min-w-0 items-start gap-3.5 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm before:absolute before:top-0 before:right-0 before:-z-10 before:size-16 before:rounded-bl-full before:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:before:bg-slate-800", `metric-card--${tone}`)}>
      <div className={cx("metric-card__icon grid size-10 flex-none place-items-center rounded-lg", iconTone)}>{icon}</div>
      <div className={cx("grid min-w-0 flex-1 gap-0.5")}>
        <p className={cx("text-xs font-semibold text-slate-500 dark:text-slate-400")}>{label}</p>
        <strong className={cx("text-2xl leading-tight font-bold tracking-tight tabular-nums text-slate-900 dark:text-slate-100")}>{value}</strong>
        {/* Detail text wraps: a long qualifier must never be clipped or ellipsised. */}
        <span className={cx("text-xs leading-snug text-slate-500 dark:text-slate-400")}>{detail}</span>
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
  const surface = {
    info: "border-kc-blue-200 bg-kc-blue-50 dark:border-kc-blue-800 dark:bg-kc-blue-950",
    success: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
    warning: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
    danger: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  }[tone];
  const iconTone = {
    info: "text-kc-blue-700 dark:text-kc-blue-300",
    success: "text-emerald-700 dark:text-emerald-300",
    warning: "text-amber-700 dark:text-amber-300",
    danger: "text-red-700 dark:text-red-300",
  }[tone];
  return (
    <div className={cx("inline-message flex gap-3 rounded-xl border px-4 py-3.5 text-sm", surface, className)}>
      <span className={cx("inline-message__icon mt-0.5 flex-none", iconTone)}>{icon}</span>
      <div className={cx("min-w-0 flex-1")}>
        <strong className={cx("mb-0.5 block text-sm font-bold text-slate-900 dark:text-slate-100")}>{title}</strong>
        <div className={cx("text-slate-600 dark:text-slate-400")}>{children}</div>
      </div>
    </div>
  );
}

export function SaveStatus({ state = "saved" }: { state?: "saving" | "saved" | "failed" | "attention" }) {
  const failed = state === "failed" || state === "attention";
  return (
    <span className={cx("save-status inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap", failed ? "text-red-700 dark:text-red-300" : "text-slate-500 dark:text-slate-400")} role="status" aria-live="polite">
      {state === "saved" && <CheckCircle2 size={16} className={cx("flex-none text-emerald-700 dark:text-emerald-300")} />}
      {state === "saving" && <CircleDotDashed size={16} className={cx("flex-none animate-spin text-kc-blue-600 dark:text-kc-blue-400")} />}
      {state === "failed" && <AlertCircle size={16} className={cx("flex-none")} />}
      {state === "attention" && <AlertCircle size={16} className={cx("flex-none")} />}
      {state === "saved" ? "Saved just now" : state === "saving" ? "Saving changes" : state === "attention" ? "Action details required" : "Save failed"}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className={cx("empty-state mx-auto grid w-full max-w-xl justify-items-center rounded-3xl border border-slate-200 bg-white px-4 py-6 text-center shadow-xl md:p-9 dark:border-slate-700 dark:bg-slate-900")}>
      <div className={cx("empty-state__icon mb-4 grid size-18 place-items-center rounded-2xl bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300")}>{icon}</div>
      <h2 className={cx("text-2xl font-bold text-slate-900 dark:text-slate-100")}>{title}</h2>
      <p className={cx("mt-2.5 max-w-md text-sm text-slate-600 dark:text-slate-400")}>{description}</p>
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
    <div className={cx("checkbox-list-wrap grid gap-2.5")}>
      {searchable && (
        <div className={cx("checkbox-list__toolbar flex flex-wrap items-center gap-x-3 gap-y-2.5")}>
          <label className={cx("search-control flex min-h-10 w-full min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-slate-500 focus-within:border-kc-blue-600 focus-within:ring-3 focus-within:ring-kc-blue-100 md:w-auto md:min-w-64 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:focus-within:ring-kc-blue-900")}>
            <Search size={16} className={cx("flex-none")} />
            {/* The input is nested inside the bordered control, so every browser or generic form
                style is reset here — focus must produce one outline around the whole field. */}
            <input className={cx("min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-sm text-slate-900 shadow-none outline-none dark:text-slate-100")} type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label}`} />
          </label>
          <div className={cx("checkbox-list__bulk ml-auto flex flex-none items-center gap-3.5 whitespace-nowrap")}>
            <button className={cx("rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:not-disabled:border-kc-blue-400 hover:not-disabled:text-kc-blue-800 disabled:cursor-not-allowed disabled:text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:not-disabled:border-kc-blue-500 dark:hover:not-disabled:text-kc-blue-200 dark:disabled:text-slate-500")} type="button" onClick={toggleAllFiltered} disabled={!filtered.length}>{allFilteredSelected ? "Deselect all" : query.trim() ? "Select all matching" : "Select all"}</button>
            <span className={cx("checkbox-list__count flex flex-none items-center gap-2 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400")}>
              {selected.length} selected
              {selected.length > 0 && <button className={cx("border-0 bg-transparent p-0 text-xs font-semibold text-kc-blue-700 dark:text-kc-blue-300")} type="button" onClick={() => onChange([])}>Clear</button>}
            </span>
          </div>
        </div>
      )}
      <div className={cx("checkbox-list grid overflow-x-hidden rounded-xl border border-slate-200 dark:border-slate-700", searchable ? "checkbox-list--scroll max-h-80 overflow-y-auto" : "overflow-y-hidden")} role="group" aria-label={label}>
        {filtered.length ? filtered.map((option, index) => {
          const checked = selected.includes(option.value);
          const showGroupHeading = option.group && option.group !== filtered[index - 1]?.group;
          return (
            <Fragment key={option.value}>
              {showGroupHeading && <p className={cx("checkbox-list__group m-0 border-b border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400")}>{option.group}</p>}
              <label className={cx("checkbox-list__row flex cursor-pointer items-center gap-3 border-b border-slate-200 px-3.5 py-3 last:border-b-0 hover:bg-kc-blue-50 dark:border-slate-700 dark:hover:bg-kc-blue-950", checked && "checkbox-list__row--checked bg-kc-blue-50 dark:bg-kc-blue-950")}>
                {/* size-5 keeps a fixed square box; flex-none stops the flex row stretching it. */}
                <input className={cx("size-5 flex-none accent-kc-blue-600")} type="checkbox" checked={checked} onChange={() => toggle(option.value)} />
                <span className={cx("grid min-w-0 flex-1")}>
                  <strong className={cx("text-slate-900 dark:text-slate-100")}>{option.label}</strong>
                  {option.hint && <small className={cx("text-slate-500 dark:text-slate-400")}>{option.hint}</small>}
                </span>
                {checked && <CheckCircle2 size={18} className={cx("flex-none text-emerald-700 dark:text-emerald-300")} />}
              </label>
            </Fragment>
          );
        }) : <p className={cx("checkbox-list__empty p-4 text-center text-sm text-slate-500 dark:text-slate-400")}>No matches for "{query}"</p>}
      </div>
    </div>
  );
}

export function KcLogo() {
  return (
    <div className={cx("kc-mark grid size-11 flex-none place-items-center rounded-xl border border-kc-blue-200 bg-kc-blue-100 text-kc-blue-700 dark:border-kc-blue-800 dark:bg-kc-blue-900 dark:text-kc-blue-300")} aria-label="Kimberly-Clark">
      <svg className={cx("size-8 fill-current")} viewBox="0 0 40 40" aria-hidden="true">
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
    // The layer's own padding supplies the 1rem viewport gutter the dialog used to express as
    // min(470px, 100% - 2rem) / calc(100vh - 2rem).
    <div className={cx("dialog-layer fixed inset-0 z-100 grid place-items-center p-4")}>
      <button className={cx("dialog-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-sm")} aria-label={cancelLabel} onClick={onCancel} />
      <section className={cx("dialog dialog--compact relative max-h-full w-full max-w-md overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-dialog-in dark:border-slate-700 dark:bg-slate-900")} role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={cx("dialog__header flex items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-700")}>
          <div><p className={cx(eyebrowClasses)}>{eyebrow}</p><h2 id={titleId} className={cx("mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100")}>{title}</h2></div>
          {/* This button sits at the dialog's top-right corner, so its default centered-below
              tooltip overflows past the right edge — the dialog clips that with overflow-x:
              hidden. Pointing it left keeps the tooltip inside the dialog's own width. */}
          <IconButton label={cancelLabel} tooltipPlacement="left" onClick={onCancel}><X size={20} /></IconButton>
        </div>
        <p className={cx("dialog-context mx-4 mt-4 border-l-3 border-kc-blue-500 py-1 pl-3 text-sm text-slate-700 dark:border-kc-blue-400 dark:text-slate-300")}>{body}</p>
        <div className={cx("dialog__footer flex flex-col-reverse items-stretch gap-4 border-t border-slate-200 p-4 md:flex-row md:items-center md:justify-end dark:border-slate-700")}>
          <Button autoFocus variant="tertiary" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="danger" icon={<Trash2 size={17} />} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
}
