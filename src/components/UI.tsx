import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Circle,
  CircleDotDashed,
  Clock3,
  Info,
  Minus,
  X,
} from "lucide-react";
import { performanceLabel } from "../data";
import type { Performance } from "../types";
import { cx } from "../utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "compact" | "default" | "large";
  icon?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "default",
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cx("button", `button--${variant}`, `button--${size}`, className)} {...props}>
      {icon}
      <span>{children}</span>
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
