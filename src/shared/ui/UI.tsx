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
    <button className={cx("button [display:inline-flex] [min-width:0] [align-items:center] [justify-content:center] [gap:0.5rem] [border:1px_solid_transparent] [border-radius:var(--radius-md)] [font-size:0.9rem] [font-weight:650] [line-height:1] [white-space:nowrap] [transition:background_120ms_ease,_border-color_120ms_ease,_box-shadow_120ms_ease,_color_120ms_ease,_transform_80ms_ease] disabled:[background:var(--neutral-100)] disabled:[border-color:var(--neutral-200)] disabled:[color:var(--neutral-400)] disabled:[box-shadow:none] [.question-evidence__editor_>_&]:[justify-self:start] [.question-evidence__attachments-header_>_&]:[flex:0_0_auto] [.site-assessment-area-row_>_&]:[justify-self:end] max-[900px]:[.site-assessment-area-row_>_&]:[grid-column:1_/_-1] max-[900px]:[.site-assessment-area-row_>_&]:[justify-self:stretch] max-[900px]:[.site-assessment-area-row_>_&]:[width:100%] max-[760px]:[.site-assessment-priority_&]:[width:100%] [.action-editor__header_>_&]:[margin-left:auto] max-[1500px]:[.requirement-mobile-toolbar_&:first-child]:[display:none] max-[1100px]:[.requirement-mobile-toolbar_&:first-child]:[display:inline-flex] max-[740px]:[.page-header__actions_&]:[width:100%] max-[740px]:[.overview-callout_&]:[grid-column:1_/_-1] max-[740px]:[.overview-callout_&]:[width:100%] max-[740px]:[.requirement-footer_>_&]:[width:100%] max-[740px]:[.requirement-footer_>_div_&]:[width:100%] max-[740px]:[.dialog__footer_&]:[width:100%] max-[740px]:[.section-drilldown-row_>_&]:[grid-column:1_/_-1] max-[740px]:[.section-drilldown-row_>_&]:[width:100%] max-[740px]:[.import-card__footer_&]:[width:100%] max-[740px]:[.result-state_&]:[width:100%] [.help-role-grid_&]:[width:100%] [.help-role-grid_&]:[margin-top:auto] max-[900px]:[.help-role-grid_&]:[width:auto] max-[620px]:[.setup-welcome__actions_&]:[width:100%] max-[620px]:[.tour-card__footer_&:last-child]:[flex:1] max-[620px]:[.setup-reminder_>_&]:[grid-column:2_/_-1] max-[620px]:[.setup-reminder_>_&]:[grid-row:2] max-[620px]:[.setup-reminder_>_&]:[width:100%] max-[620px]:[.help-role-grid_&]:[grid-column:1_/_-1] max-[620px]:[.help-role-grid_&]:[width:100%] max-[620px]:[.setup-complete_&]:[width:100%] [.passkey-add_&]:[width:100%] [.passkey-setup-message_&]:[flex:0_0_auto] max-[620px]:[.passkey-enrollment-choice_&]:[grid-column:2] max-[620px]:[.passkey-enrollment-choice_&]:[justify-self:start] max-[620px]:[.settings-card--split_>_&]:[width:100%] [.settings-index-empty_&]:[margin-top:0.3rem] max-[620px]:[.session-panel_&]:[grid-column:1_/_-1] max-[620px]:[.session-panel_&]:[width:100%] [.first-login-passkey__complete_&]:[margin-top:0.35rem] max-[620px]:[.first-login-passkey__actions_&]:[width:100%]", `button--${variant}`, `button--${size}`, className)} {...props}>
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
    <button {...props} className={cx("icon-button [position:relative] [display:inline-flex] [width:40px] [height:40px] [flex:0_0_40px] [align-items:center] [justify-content:center] [border:0] [border-radius:var(--radius-md)] [background:transparent] [color:var(--neutral-600)] [transition:background_120ms_ease,_color_120ms_ease] hover:[background:var(--neutral-100)] hover:[color:var(--neutral-900)] max-[1100px]:[.mobile-sidebar__header_&]:[margin-right:0.7rem] max-[1100px]:[.mobile-sidebar__header_&]:[color:var(--nav-text-strong)] max-[740px]:[.question-card__header_>_&]:[grid-column:2] max-[740px]:[.question-card__header_>_&]:[justify-self:start] max-[740px]:[.evidence-item_>_&]:[grid-column:2] max-[740px]:[.evidence-item_>_&]:[justify-self:end] max-[620px]:[.setup-reminder_>_&]:[position:absolute] max-[620px]:[.setup-reminder_>_&]:[top:0.3rem] max-[620px]:[.setup-reminder_>_&]:[right:0.3rem] [.passkey-item__actions_&:last-child:hover]:[background:var(--danger-surface)] [.passkey-item__actions_&:last-child:hover]:[color:var(--danger)]", className)} aria-label={label} aria-describedby={tooltipId}>
      {children}
      <span id={tooltipId} className={cx("app-tooltip [position:absolute] [z-index:320] [width:max-content] [max-width:230px] [padding:0.52rem_0.68rem] [border:1px_solid_rgb(var(--accent-dark-scroll-rgb)_/_0.24)] [border-radius:10px] [background:linear-gradient(145deg,_var(--brand-deep),_var(--brand-deepest))] [box-shadow:inset_0_1px_0_rgb(255_255_255_/_0.1),_0_12px_30px_rgb(2_19_31_/_0.24)] [color:#fff] [font-family:var(--font-sans)] [font-size:0.72rem] [font-weight:600] [letter-spacing:0.005em] [line-height:1.25] [opacity:0] [pointer-events:none] [visibility:hidden] [white-space:normal] [transition:opacity_120ms_ease_120ms,_transform_150ms_ease_120ms,_visibility_0ms_linear_240ms] after:[position:absolute] after:[width:8px] after:[height:8px] after:[border:1px_solid_rgb(var(--accent-dark-scroll-rgb)_/_0.2)] after:[background:var(--kc-950)] after:[content:''] [.icon-button:hover_>_&]:[opacity:1] [.icon-button:hover_>_&]:[visibility:visible] [.icon-button:hover_>_&]:[transition-delay:180ms,_180ms,_0ms] [.icon-button:focus-visible_>_&]:[opacity:1] [.icon-button:focus-visible_>_&]:[visibility:visible] [.icon-button:focus-visible_>_&]:[transition-delay:180ms,_180ms,_0ms] [.collapse-control:hover_>_&]:[opacity:1] [.collapse-control:hover_>_&]:[visibility:visible] [.collapse-control:hover_>_&]:[transition-delay:180ms,_180ms,_0ms] [.collapse-control:focus-visible_>_&]:[opacity:1] [.collapse-control:focus-visible_>_&]:[visibility:visible] [.collapse-control:focus-visible_>_&]:[transition-delay:180ms,_180ms,_0ms] [.desktop-sidebar:has(.nav-item:hover)_.collapse-control_>_&]:[opacity:0] [.desktop-sidebar:has(.nav-item:hover)_.collapse-control_>_&]:[visibility:hidden] [.desktop-sidebar:has(.nav-item:hover)_.collapse-control_>_&]:[transition-delay:0ms] max-[1100px]:[.mobile-sidebar_&]:[display:none] [@media_(hover:_none)]:[display:none] [.row-actions--menu:has(.row-menu)_&]:[opacity:0]! [.row-actions--menu:has(.row-menu)_&]:[visibility:hidden]!", `app-tooltip--${tooltipPlacement}`)} role="tooltip">
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
        className={cx("select-option [display:flex] [min-height:36px] [align-items:center] [gap:0.5rem] [border-radius:8px] [padding:0.4rem_0.55rem] [color:var(--neutral-700)] [font-size:0.83rem] [cursor:pointer] [&_>_span:last-child]:[overflow:hidden] [&_>_span:last-child]:[text-overflow:ellipsis] [&_>_span:last-child]:[white-space:nowrap]", index === highlighted && "select-option--highlighted [background:var(--kc-50)]", option.value === value && "select-option--selected [color:var(--kc-800)] [font-weight:650]")}
        onMouseEnter={() => setHighlighted(index)}
        onClick={() => choose(index)}
      >
        <span className={cx("select-option__check [display:grid] [width:15px] [flex:0_0_15px] [place-items:center] [color:var(--kc-600)]")}>{option.value === value && <Check size={15} />}</span>
        <span>{option.label}</span>
      </li>
    );
  }

  return (
    <div className={cx("select-control [position:relative] [display:flex] [min-width:170px] [align-items:center] [&_>_svg:first-child]:[position:absolute] [&_>_svg:first-child]:[left:0.75rem] [&_>_svg:first-child]:[pointer-events:none] [&_>_svg:first-child]:[color:var(--neutral-500)] max-[740px]:[width:100%] max-[740px]:[max-width:none] max-[740px]:[min-width:0] [.dashboard-filter-bar--expanded_&]:[flex:1] [.dashboard-filter-bar--expanded_&]:[min-width:170px] max-[720px]:[.filter-row_&]:[width:100%]", open && "select-control--open", className)} ref={wrapRef}>
      {icon}
      <button
        type="button"
        className={cx("select-control__trigger [.select-control:has(>_svg:first-child)_&]:[padding-left:2.15rem] [display:flex] [width:100%] [min-height:42px] [align-items:center] [justify-content:space-between] [gap:0.5rem] [border:1px_solid_var(--neutral-300)] [border-radius:var(--radius-md)] [outline:0] [background:var(--surface-input)] [color:var(--neutral-800)] [padding:0_0.7rem_0_0.75rem] [font-size:0.85rem] [text-align:left] [transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_>_span]:[overflow:hidden] [&_>_span]:[text-overflow:ellipsis] [&_>_span]:[white-space:nowrap] focus-visible:[border-color:var(--kc-600)] focus-visible:[box-shadow:0_0_0_3px_var(--kc-100)] [.select-control--open_&]:[border-color:var(--kc-600)] [.select-control--open_&]:[box-shadow:0_0_0_3px_var(--kc-100)]")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => (open ? setOpen(false) : openList())}
      >
        <span>{current?.label}</span>
        <ChevronDown size={16} className={cx("select-control__chevron [flex:0_0_auto] [color:var(--neutral-500)] [transition:transform_140ms_ease]", open && "select-control__chevron--open [transform:rotate(180deg)]")} />
      </button>
      {open && anchor && createPortal(
        <div
          ref={popoverRef}
          className={cx("select-portal [position:fixed] [z-index:400] [display:flex] [&_>_*]:[max-height:100%]")}
          style={{ left: anchor.left, top: anchor.top, minWidth: anchor.width, maxHeight: anchor.maxHeight }}
        >
          {searchable ? (
            <div className={cx("select-popover [width:max-content] [min-width:100%] [max-width:320px] [overflow-y:auto] [margin:0] [padding:0.35rem] [list-style:none] [border:1px_solid_var(--border-translucent)] [border-radius:var(--radius-md)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:select-popover-in_140ms_cubic-bezier(0.22,_1,_0.36,_1)] select-popover--searchable [.select-popover&]:[display:flex] [.select-popover&]:[flex-direction:column] [.select-popover&]:[max-height:320px] [.select-popover&]:[overflow:hidden] [.select-popover&]:[padding:0]")}>
              <input
                ref={searchRef}
                className={cx("select-popover__search [flex:none] [margin:0.4rem] [border:1px_solid_var(--neutral-200)] [border-radius:8px] [padding:0.5rem_0.6rem] [font-size:0.83rem] focus:[outline:none] focus:[border-color:var(--kc-600)] focus:[box-shadow:0_0_0_3px_var(--kc-100)]")}
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
                className={cx("select-popover__list [flex:1] [overflow-y:auto] [margin:0] [padding:0_0.35rem_0.35rem] [list-style:none]")}
                tabIndex={-1}
              >
                {filteredOptions.length ? filteredOptions.map(renderOption) : <li className={cx("select-popover__empty [padding:0.6rem] [color:var(--neutral-500)] [font-size:0.8rem] [text-align:center]")}>No matches</li>}
              </ul>
            </div>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              aria-label={label}
              aria-activedescendant={options.length ? `${listId}-${highlighted}` : undefined}
              className={cx("select-popover [width:max-content] [min-width:100%] [max-width:320px] [overflow-y:auto] [margin:0] [padding:0.35rem] [list-style:none] [border:1px_solid_var(--border-translucent)] [border-radius:var(--radius-md)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:select-popover-in_140ms_cubic-bezier(0.22,_1,_0.36,_1)]")}
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
    <span className={cx("status-badge [display:inline-flex] [min-height:29px] [align-items:center] [gap:0.35rem] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.58rem] [font-size:0.77rem] [font-weight:700] [line-height:1] [white-space:nowrap] [.site-assessment-hero__facts_&]:[margin-top:0.2rem] max-[740px]:[.requirement-header__title_&]:[justify-self:start] max-[740px]:[.question-card__header_>_&]:[grid-column:2] max-[740px]:[.question-card__header_>_&]:[justify-self:start] [@media_(forced-colors:_active)]:[border:2px_solid_currentColor]", `status-badge--${performance}`, compact && "status-badge--compact [min-height:27px] [padding:0.22rem_0.5rem] [font-size:0.72rem]")}>
      {performanceIcon[performance]}
      {performanceLabel(performance)}
    </span>
  );
}

export function CompletionBadge({ value }: { value: number }) {
  const state = value === 0 ? "not-started" : value === 100 ? "complete" : "in-progress";
  const icon = state === "complete" ? <Check size={14} /> : state === "not-started" ? <Circle size={13} /> : <Clock3 size={14} />;
  return (
    <span className={cx("completion-badge [display:inline-flex] [min-height:29px] [align-items:center] [gap:0.35rem] [border:1px_solid] [border-radius:999px] [padding:0.25rem_0.58rem] [font-size:0.77rem] [font-weight:700] [line-height:1] [white-space:nowrap] max-[1100px]:[.data-table_&]:[justify-self:start] [@media_(forced-colors:_active)]:[border:2px_solid_currentColor]", `completion-badge--${state}`)}>
      {icon}
      {value}%
    </span>
  );
}

export function ProgressBar({ value, label, tone = "brand" }: { value: number; label?: string; tone?: "brand" | "success" | "warning" }) {
  return (
    <div className={cx("progress-wrap [min-width:0] [.site-assessment-hero__copy_&]:[max-width:420px] [.site-assessment-hero__copy_&]:[margin-top:0.25rem] [.tour-card__progress_&]:[width:100%]")}>
      {label && (
        <div className={cx("progress-label [display:flex] [justify-content:space-between] [gap:1rem] [margin-bottom:0.4rem] [color:var(--neutral-600)] [font-size:0.76rem] [&_strong]:[color:var(--neutral-800)]")}>
          <span>{label}</span>
          <strong>{value}%</strong>
        </div>
      )}
      <div className={cx("progress-track [position:relative] [height:7px] [overflow:hidden] [border-radius:999px] [background:var(--neutral-200)]")} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label ?? "Progress"}>
        <span className={cx("progress-fill [display:block] [height:100%] [border-radius:inherit] [background:var(--kc-600)] [transition:width_240ms_ease] [@media_(forced-colors:_active)]:[background:Highlight]", `progress-fill--${tone}`)} style={{ width: `${value}%` }} />
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
    <header className={cx("page-header [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:2rem] [margin-bottom:1.75rem] [&_h1]:[margin-top:0.4rem] max-[740px]:[display:grid] max-[740px]:[gap:1rem] [.actions-summary-page_>_&]:[margin-bottom:0.75rem]")}>
      <div className={cx("page-header__copy [max-width:780px] [&_>_p:last-child]:[max-width:720px] [&_>_p:last-child]:[margin-top:0.6rem] [&_>_p:last-child]:[color:var(--neutral-600)] [&_>_p:last-child]:[line-height:1.55]")}>
        {eyebrow && <p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className={cx("page-header__actions [display:flex] [flex-wrap:wrap] [justify-content:flex-end] [gap:0.65rem] [padding-top:0.2rem] max-[740px]:[justify-content:stretch] max-[620px]:[.settings-workspace_&]:[width:100%]")}>{actions}</div>}
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
    <article className={cx("metric-card [position:relative] [display:grid] [min-width:0] [grid-template-columns:auto_minmax(0,_1fr)] [gap:0.85rem] [overflow:hidden] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [background:var(--surface-translucent)] [padding:1rem] [box-shadow:var(--shadow-1)] before:[position:absolute] before:[z-index:-1] before:[top:0] before:[right:0] before:[width:62px] before:[height:62px] before:[border-radius:0_0_0_100%] before:[background:var(--neutral-50)] before:[content:''] [&_>_div:last-child]:[display:grid] [&_>_div:last-child]:[min-width:0] [&_>_div:last-child]:[gap:0.1rem] [&_p]:[color:var(--neutral-500)] [&_p]:[font-size:0.75rem] [&_p]:[font-weight:600] [&_>_div_>_strong]:[color:var(--neutral-900)] [&_>_div_>_strong]:[font-size:1.55rem] [&_>_div_>_strong]:[font-variant-numeric:tabular-nums] [&_>_div_>_strong]:[letter-spacing:-0.035em] [&_>_div_>_strong]:[line-height:1.25] [&_>_div_>_span:last-child]:[color:var(--neutral-500)] [&_>_div_>_span:last-child]:[font-size:0.72rem] [&_>_div_>_span:last-child]:[line-height:1.35]", `metric-card--${tone}`)}>
      <div className={cx("metric-card__icon [display:grid] [width:40px] [height:40px] [place-items:center] [border-radius:11px] [background:var(--neutral-100)] [color:var(--neutral-700)] [.metric-card--brand_&]:[background:var(--kc-50)] [.metric-card--brand_&]:[color:var(--kc-700)] [.metric-card--success_&]:[background:var(--success-surface)] [.metric-card--success_&]:[color:var(--success)] [.metric-card--warning_&]:[background:var(--warning-surface)] [.metric-card--warning_&]:[color:var(--warning)] [.metric-card--danger_&]:[background:var(--danger-surface)] [.metric-card--danger_&]:[color:var(--danger)]")}>{icon}</div>
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
    <div className={cx("inline-message [display:grid] [grid-template-columns:auto_minmax(0,_1fr)] [gap:0.75rem] [border:1px_solid] [border-radius:var(--radius-lg)] [padding:0.85rem_1rem] [font-size:0.85rem] [&_strong]:[display:block] [&_strong]:[margin-bottom:0.12rem] [&_strong]:[color:var(--neutral-900)] [&_strong]:[font-size:0.87rem] [&_div_div]:[color:var(--neutral-600)] [.guidance-panel_>_&]:[margin-top:1rem] [.requirement-main_>_&]:[margin-top:1rem] [.validation-summary_+_&]:[margin-bottom:1rem] [.dialog_>_&]:[margin:1rem_1.1rem_0] [.settings-card_>_&]:[margin:0] [.settings-content_>_&]:[margin:0] [&.inline-message--info]:[border-color:var(--kc-200)] [&.inline-message--info]:[background:var(--kc-50)] [&.inline-message--success]:[border-color:var(--success-border)] [&.inline-message--success]:[background:var(--success-surface)] [&.inline-message--warning]:[border-color:var(--warning-border)] [&.inline-message--warning]:[background:var(--warning-surface)] [&.inline-message--danger]:[border-color:var(--danger-border)] [&.inline-message--danger]:[background:var(--danger-surface)]", `inline-message--${tone}`, className)}>
      <span className={cx("inline-message__icon [margin-top:0.05rem] [.inline-message--info_&]:[color:var(--kc-700)] [.inline-message--success_&]:[color:var(--success)] [.inline-message--warning_&]:[color:var(--warning)] [.inline-message--danger_&]:[color:var(--danger)]")}>{icon}</span>
      <div>
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function SaveStatus({ state = "saved" }: { state?: "saving" | "saved" | "failed" | "attention" }) {
  return (
    <span className={cx("save-status [display:inline-flex] [align-items:center] [gap:0.38rem] [color:var(--neutral-500)] [font-size:0.76rem] [font-weight:600] [white-space:nowrap] max-[740px]:[.requirement-footer_>_div_&]:[display:none]", `save-status--${state}`)} role="status" aria-live="polite">
      {state === "saved" && <CheckCircle2 size={16} />}
      {state === "saving" && <CircleDotDashed size={16} className={cx("spin [animation:spin_900ms_linear_infinite]")} />}
      {state === "failed" && <AlertCircle size={16} />}
      {state === "attention" && <AlertCircle size={16} />}
      {state === "saved" ? "Saved just now" : state === "saving" ? "Saving changes" : state === "attention" ? "Action details required" : "Save failed"}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className={cx("empty-state [display:grid] [width:min(560px,_100%)] [margin:0_auto] [justify-items:center] [border:1px_solid_var(--border-translucent)] [border-radius:24px] [background:var(--surface-translucent)] [padding:2.3rem] [box-shadow:0_20px_50px_rgb(15_23_42_/_0.09)] [text-align:center] [backdrop-filter:blur(18px)] [.table-card_&]:[border:none] [.table-card_&]:[background:none] [.table-card_&]:[box-shadow:none] [.table-card_&]:[backdrop-filter:none] [.table-card_&]:[padding:3rem_1.25rem] [&_h2]:[font-size:1.45rem] [&_p]:[max-width:460px] [&_p]:[margin-top:0.65rem] [&_p]:[color:var(--neutral-600)] max-[740px]:[padding:1.5rem_1rem]")}>
      <div className={cx("empty-state__icon [display:grid] [width:72px] [height:72px] [place-items:center] [margin-bottom:1rem] [border-radius:20px] [background:var(--kc-50)] [color:var(--kc-700)]")}>{icon}</div>
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
    <div className={cx("checkbox-list-wrap [display:grid] [gap:0.6rem]")}>
      {searchable && (
        <div className={cx("checkbox-list__toolbar [display:flex] [flex-wrap:wrap] [align-items:center] [gap:0.6rem_0.75rem]")}>
          <label className={cx("search-control [display:flex] [min-width:250px] [min-height:42px] [flex:1] [align-items:center] [gap:0.55rem] [border:1px_solid_var(--neutral-300)] [border-radius:var(--radius-md)] [background:var(--surface-input)] [padding:0_0.75rem] [color:var(--neutral-500)] [&:focus-within]:[border-color:var(--kc-600)] [&:focus-within]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input]:[min-width:0] [&_input]:[flex:1] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[color:var(--neutral-900)] [&_input]:[font-size:0.85rem] [.dashboard-filter-bar_&]:[flex:0_1_420px] [.dashboard-filter-bar_&]:[min-width:0] [.dashboard-filter-bar--expanded_&]:[flex:0_1_420px] [.dashboard-filter-bar--expanded_&]:[min-width:0] [.filter-row_&]:[flex:0_1_420px] [.filter-row_&]:[min-width:0] [.content-toolbar_&]:[flex:0_1_420px] [.content-toolbar_&]:[min-width:0] [.requirement-main--editor_.checkbox-list__toolbar_&]:[flex:1_1_320px] [.requirement-main--editor_.checkbox-list__toolbar_&]:[min-width:0] [.checkbox-list__toolbar_&_>_input]:[min-height:0] [.checkbox-list__toolbar_&_>_input]:[border:0]! [.checkbox-list__toolbar_&_>_input]:[border-radius:0] [.checkbox-list__toolbar_&_>_input]:[box-shadow:none]! [.checkbox-list__toolbar_&_>_input]:[outline:0]! [.checkbox-list__toolbar_&_>_input]:[padding:0] [.checkbox-list__toolbar_&]:[flex:0_1_420px] [.checkbox-list__toolbar_&]:[min-width:0] max-[1100px]:[.dashboard-filter-bar_&]:[width:100%] max-[1100px]:[.dashboard-filter-bar_&]:[flex-basis:100%] max-[1100px]:[.dashboard-filter-bar_&]:[min-width:0] max-[740px]:[width:100%] max-[740px]:[max-width:none] max-[740px]:[min-width:0]")}>
            <Search size={16} />
            <input type="text" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label}`} />
          </label>
          <div className={cx("checkbox-list__bulk [display:flex] [flex:none] [align-items:center] [gap:0.9rem] [margin-left:auto] [white-space:nowrap] [&_>_button]:[border:1px_solid_var(--neutral-300)] [&_>_button]:[border-radius:8px] [&_>_button]:[background:var(--surface-panel)] [&_>_button]:[padding:0.45rem_0.7rem] [&_>_button]:[color:var(--neutral-700)] [&_>_button]:[font-size:0.78rem] [&_>_button]:[font-weight:650] [&_>_button]:[cursor:pointer] [&_>_button:hover:not(:disabled)]:[border-color:var(--kc-400)] [&_>_button:hover:not(:disabled)]:[color:var(--kc-800)] [&_>_button:disabled]:[color:var(--neutral-400)] [&_>_button:disabled]:[cursor:not-allowed]")}>
            <button type="button" onClick={toggleAllFiltered} disabled={!filtered.length}>{allFilteredSelected ? "Deselect all" : query.trim() ? "Select all matching" : "Select all"}</button>
            <span className={cx("checkbox-list__count [display:flex] [align-items:center] [gap:0.5rem] [flex:none] [white-space:nowrap] [color:var(--neutral-500)] [font-size:0.78rem] [&_button]:[border:0] [&_button]:[background:none] [&_button]:[padding:0] [&_button]:[color:var(--kc-700)] [&_button]:[font-size:0.78rem] [&_button]:[font-weight:650] [&_button]:[cursor:pointer]")}>
              {selected.length} selected
              {selected.length > 0 && <button type="button" onClick={() => onChange([])}>Clear</button>}
            </span>
          </div>
        </div>
      )}
      <div className={cx("checkbox-list [display:grid] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-lg)] [overflow:hidden]", searchable && "checkbox-list--scroll [.checkbox-list&]:[max-height:320px] [.checkbox-list&]:[overflow-y:auto]")} role="group" aria-label={label}>
        {filtered.length ? filtered.map((option, index) => {
          const checked = selected.includes(option.value);
          const showGroupHeading = option.group && option.group !== filtered[index - 1]?.group;
          return (
            <Fragment key={option.value}>
              {showGroupHeading && <p className={cx("checkbox-list__group [margin:0] [border-bottom:1px_solid_var(--neutral-200)] [background:var(--neutral-25)] [padding:0.4rem_0.85rem] [color:var(--neutral-500)] [font-size:0.68rem] [font-weight:700] [letter-spacing:0.04em] [text-transform:uppercase]")}>{option.group}</p>}
              <label className={cx("checkbox-list__row [display:flex] [align-items:center] [gap:0.7rem] [padding:0.75rem_0.85rem] [border-bottom:1px_solid_var(--neutral-200)] [cursor:pointer] [&:last-child]:[border-bottom:0] hover:[background:var(--kc-50)] [&_input]:[width:18px] [&_input]:[height:18px] [&_input]:[accent-color:var(--kc-600)] [&_>_span]:[display:grid] [&_>_span]:[flex:1] [&_small]:[color:var(--neutral-500)] [&_>_svg:last-child]:[color:var(--success)]", checked && "checkbox-list__row--checked [background:var(--kc-50)]")}>
                <input type="checkbox" checked={checked} onChange={() => toggle(option.value)} />
                <span>
                  <strong>{option.label}</strong>
                  {option.hint && <small>{option.hint}</small>}
                </span>
                {checked && <CheckCircle2 size={18} />}
              </label>
            </Fragment>
          );
        }) : <p className={cx("checkbox-list__empty [padding:1.1rem] [color:var(--neutral-500)] [font-size:0.82rem] [text-align:center]")}>No matches for "{query}"</p>}
      </div>
    </div>
  );
}

export function KcLogo() {
  return (
    <div className={cx("kc-mark [display:grid] [width:43px] [height:43px] [flex:0_0_43px] [place-items:center] [border:1px_solid_var(--nav-mark-border)] [border-radius:13px] [background:var(--nav-mark-background)] [color:var(--nav-accent)] [&_svg]:[width:31px] [&_svg]:[height:31px] [&_svg]:[fill:currentColor] [.login-story__brand_&]:[border-color:rgb(255_255_255_/_0.22)] [.login-story__brand_&]:[background:rgb(255_255_255_/_0.12)] [.login-story__brand_&]:[color:white] max-[620px]:[.login-story__brand_&]:[width:40px] max-[620px]:[.login-story__brand_&]:[height:40px]")} aria-label="Kimberly-Clark">
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
    <div className={cx("dialog-layer [position:fixed] [z-index:100] [inset:0] [display:grid] [place-items:center]")}>
      <button className={cx("dialog-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label={cancelLabel} onClick={onCancel} />
      <section className={cx("dialog [position:relative] [width:min(560px,_calc(100%_-_2rem))] [max-height:calc(100vh_-_2rem)] [overflow-y:auto] [border:1px_solid_var(--border-glass)] [border-radius:var(--radius-xl)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:dialog-in_180ms_ease-out] dialog--compact [width:min(470px,_calc(100%_-_2rem))]")} role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={cx("dialog__header [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [padding:1rem_1.1rem] [border-bottom:1px_solid_var(--neutral-200)] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.2rem]")}>
          <div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>{eyebrow}</p><h2 id={titleId}>{title}</h2></div>
          <IconButton label={cancelLabel} onClick={onCancel}><X size={20} /></IconButton>
        </div>
        <p className={cx("dialog-context [margin:1rem_1.1rem_0] [border-left:3px_solid_var(--kc-500)] [color:var(--neutral-700)] [padding:0.25rem_0_0.25rem_0.75rem] [font-size:0.82rem]")}>{body}</p>
        <div className={cx("dialog__footer [display:flex] [align-items:center] [justify-content:flex-end] [gap:1rem] [padding:1rem_1.1rem] [border-top:1px_solid_var(--neutral-200)] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column-reverse]")}>
          <Button autoFocus variant="tertiary" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant="danger" icon={<Trash2 size={17} />} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
}
