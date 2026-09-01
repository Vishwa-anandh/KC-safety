import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  FileInput,
  FileText,
  History,
  LogOut,
  LayoutDashboard,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApplicationData } from "../providers/ApplicationDataProvider";
import { useAuth } from "../../features/auth";
import { useGuidedSetup, type UserRole } from "../../features/onboarding";
import { useNotifications } from "../../features/notifications";
import type { AppNotification, NotificationCategory } from "../../shared/types";
import { ThemeSelector, useTheme } from "../../features/settings";
import { IconButton, KcLogo } from "../../shared/ui/UI";
import { cx } from "../../shared/utils";
import { appPaths } from "../router/route-manifest";

const navigation = [
  {
    label: "Site workspace",
    roles: ["site-contributor"] as UserRole[],
    items: [
      { to: appPaths.overview, label: "Overview", icon: LayoutDashboard },
      { to: appPaths.siteInformation, label: "Site information", icon: Building2 },
      { to: appPaths.owners, label: "Program owners", icon: UsersRound },
      { to: appPaths.assessment, label: "Self-assessment", icon: ClipboardCheck },
      { to: appPaths.actions, label: "Actions summary", icon: Activity },
    ],
  },
  {
    label: "Oversight",
    roles: ["enterprise-viewer", "administrator"] as UserRole[],
    items: [{ to: appPaths.dashboard, label: "Enterprise dashboard", icon: BarChart3 }],
  },
  {
    label: "Administration",
    roles: ["administrator"] as UserRole[],
    items: [
      { to: appPaths.adminSites, label: "Sites", icon: Building2 },
      { to: appPaths.adminImports, label: "Imports", icon: FileInput },
      { to: appPaths.adminRequirements, label: "Master requirements", icon: FileText },
      { to: appPaths.adminRequirementAudit, label: "Audit log", icon: History },
    ],
  },
];

const bottomTabs = [
  { to: appPaths.overview, label: "Overview", icon: LayoutDashboard, matches: [appPaths.overview], roles: ["site-contributor"] as UserRole[] },
  { to: appPaths.assessment, label: "Assessment", icon: ClipboardCheck, matches: [appPaths.assessment], roles: ["site-contributor"] as UserRole[] },
  { to: appPaths.actions, label: "Actions", icon: Activity, matches: [appPaths.actions], roles: ["site-contributor"] as UserRole[] },
  { to: appPaths.dashboard, label: "Dashboard", icon: BarChart3, matches: [appPaths.dashboard, "/sites/"], roles: ["enterprise-viewer", "administrator"] as UserRole[] },
  { to: appPaths.adminSites, label: "Sites", icon: Building2, matches: [appPaths.adminSites], roles: ["administrator"] as UserRole[] },
  { to: appPaths.adminImports, label: "Imports", icon: FileInput, matches: [appPaths.adminImports], roles: ["administrator"] as UserRole[] },
  { to: appPaths.adminRequirements, label: "Requirements", icon: FileText, matches: [appPaths.adminRequirements], roles: ["administrator"] as UserRole[] },
];

function SideNav({ collapsed, role, onNavigate }: { collapsed: boolean; role: UserRole; onNavigate?: () => void }) {
  return (
    <nav className={cx("side-nav [--scrollbar-thumb:var(--nav-scrollbar-thumb)] [--scrollbar-thumb-hover:var(--nav-scrollbar-thumb-hover)] [--scrollbar-thumb-active:var(--nav-scrollbar-thumb-active)] [flex:1] [overflow:visible] [padding:1rem_0.75rem_1.5rem] [transition:padding_var(--motion-sidebar)] [@media_(max-height:_680px)_and_(min-width:_1101px)]:[overflow-y:auto] [@media_(max-height:_680px)_and_(min-width:_1101px)]:[overflow-x:hidden] [.app-shell--collapsed_.desktop-sidebar_&]:[padding-inline:0.65rem]")} aria-label="Primary navigation">
      {navigation.filter((group) => group.roles.includes(role)).map((group) => (
        <div className={cx("nav-group [.nav-group_+_&]:[margin-top:1.3rem] [transition:margin_var(--motion-sidebar),_padding_var(--motion-sidebar),_border-color_var(--motion-sidebar)] [.app-shell--collapsed_.desktop-sidebar_&]:[margin-top:0.7rem] [.app-shell--collapsed_.desktop-sidebar_&]:[padding-top:0.7rem] [.app-shell--collapsed_.desktop-sidebar_&]:[border-top:1px_solid_var(--nav-divider)] [.app-shell--collapsed_.desktop-sidebar_&:first-child]:[margin-top:0] [.app-shell--collapsed_.desktop-sidebar_&:first-child]:[padding-top:0] [.app-shell--collapsed_.desktop-sidebar_&:first-child]:[border-top:0]")} key={group.label}>
          <p className={cx("nav-group__label [max-height:20px] [overflow:hidden] [margin:0_0_0.45rem_0.7rem] [color:var(--nav-group-text)] [font-size:0.67rem] [font-weight:700] [letter-spacing:0.025em] [opacity:1] [transform:translateX(0)] [transform-origin:left_center] [transition:max-height_var(--motion-sidebar),_margin_var(--motion-sidebar),_opacity_140ms_ease_80ms,_transform_var(--motion-sidebar)] [.app-shell--collapsed_.desktop-sidebar_&]:[max-height:0] [.app-shell--collapsed_.desktop-sidebar_&]:[margin:0] [.app-shell--collapsed_.desktop-sidebar_&]:[opacity:0] [.app-shell--collapsed_.desktop-sidebar_&]:[transform:translateX(-8px)] [.app-shell--collapsed_.desktop-sidebar_&]:[transition-delay:0ms]")} aria-hidden={collapsed}>{group.label}</p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const tooltipId = `nav-tooltip-${item.to.replaceAll("/", "-").replace(/^-/, "")}`;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) => cx("nav-item [position:relative] [display:flex] [min-height:48px] [align-items:center] [gap:0.62rem] [margin:0.18rem_0] [padding:0.42rem_0.5rem] [border:1px_solid_transparent] [border-radius:12px] [color:var(--nav-text)] [font-size:0.875rem] [font-weight:560] [transition:gap_var(--motion-sidebar),_padding_var(--motion-sidebar),_background_160ms_ease,_color_160ms_ease,_box-shadow_160ms_ease] hover:[background:var(--nav-hover)] hover:[color:var(--nav-text-strong)] [.app-shell--collapsed_.desktop-sidebar_&]:[gap:0] [.app-shell--collapsed_.desktop-sidebar_&]:[justify-content:center] [.app-shell--collapsed_.desktop-sidebar_&]:[padding:0.42rem]", isActive && "nav-item--active [border-color:transparent] [background:var(--nav-active-background)] [color:var(--nav-text-strong)] [box-shadow:var(--nav-active-shadow)] before:[position:absolute] before:[top:50%] before:[left:-0.75rem] before:[width:4px] before:[height:24px] before:[border-radius:0_6px_6px_0] before:[background:var(--kc-300)] before:[box-shadow:0_0_12px_rgb(var(--accent-dark-glow-rgb)_/_0.55)] before:[content:''] before:[transform:translateY(-50%)] [.app-shell--collapsed_.desktop-sidebar_&]:[background:var(--nav-active-collapsed)] [.app-shell--collapsed_.desktop-sidebar_&]:[box-shadow:none] [.app-shell--collapsed_.desktop-sidebar_&::before]:[left:-0.65rem] [@media_(forced-colors:_active)]:[border:2px_solid_currentColor]")}
                aria-label={collapsed ? item.label : undefined}
                aria-describedby={collapsed ? tooltipId : undefined}
                data-tour={`nav-${item.to.split("/").filter(Boolean).join("-")}`}
              >
                <span className={cx("nav-item__icon [display:grid] [width:34px] [height:34px] [flex:0_0_auto] [place-items:center] [border-radius:10px] [color:var(--nav-text)] [transform:scale(1)] [transition:transform_var(--motion-sidebar),_background_160ms_ease,_color_160ms_ease,_box-shadow_160ms_ease] [.nav-item:hover_&]:[background:var(--nav-icon-hover)] [.nav-item:hover_&]:[color:var(--nav-text-strong)] [.nav-item--active_&]:[background:var(--nav-active-icon-background)] [.nav-item--active_&]:[color:var(--brand-solid-active)] [.nav-item--active_&]:[box-shadow:0_5px_14px_rgb(2_19_31_/_0.22)] [.app-shell--collapsed_.desktop-sidebar_&]:[transform:scale(0.96)]")}><Icon size={19} /></span>
                <span className={cx("nav-item__label [min-width:0] [max-width:180px] [flex:1] [overflow:hidden] [opacity:1] [transform:translateX(0)] [white-space:nowrap] [transition:max-width_var(--motion-sidebar),_opacity_140ms_ease_80ms,_transform_var(--motion-sidebar)] [.app-shell--collapsed_.desktop-sidebar_&]:[max-width:0] [.app-shell--collapsed_.desktop-sidebar_&]:[opacity:0] [.app-shell--collapsed_.desktop-sidebar_&]:[transform:translateX(-8px)] [.app-shell--collapsed_.desktop-sidebar_&]:[transition-delay:0ms]")} aria-hidden={collapsed}>{item.label}</span>
                <ChevronRight className={cx("nav-item__chevron [flex:0_0_auto] [max-width:15px] [opacity:0] [transform:translateX(-4px)] [transition:max-width_var(--motion-sidebar),_opacity_160ms_ease,_transform_var(--motion-sidebar)] [.nav-item--active_&]:[opacity:0.72] [.nav-item--active_&]:[transform:translateX(0)] [.app-shell--collapsed_.desktop-sidebar_&]:[max-width:0] [.app-shell--collapsed_.desktop-sidebar_&]:[opacity:0] [.app-shell--collapsed_.desktop-sidebar_&]:[transform:translateX(-8px)]")} size={15} aria-hidden="true" />
                <span id={tooltipId} className={cx("nav-item__tooltip [position:absolute] [z-index:70] [top:50%] [left:calc(100%_+_14px)] [width:max-content] [max-width:220px] [padding:0.52rem_0.68rem] [border:1px_solid_rgb(var(--accent-dark-scroll-rgb)_/_0.24)] [border-radius:10px] [background:linear-gradient(145deg,_var(--brand-deep),_var(--brand-deepest))] [box-shadow:inset_0_1px_0_rgb(255_255_255_/_0.1),_0_12px_30px_rgb(2_19_31_/_0.28)] [color:#fff] [font-family:var(--font-sans)] [font-size:0.72rem] [font-weight:600] [letter-spacing:0.005em] [line-height:1.25] [opacity:0] [pointer-events:none] [transform:translate(4px,_-50%)] [visibility:hidden] [transition:opacity_120ms_ease_120ms,_transform_150ms_ease_120ms,_visibility_0ms_linear_240ms] before:[position:absolute] before:[top:calc(50%_-_4px)] before:[left:-5px] before:[width:8px] before:[height:8px] before:[border:1px_solid_rgb(var(--accent-dark-scroll-rgb)_/_0.2)] before:[border-top:0] before:[border-right:0] before:[background:var(--kc-950)] before:[content:''] before:[transform:rotate(45deg)] [.app-shell--collapsed_.desktop-sidebar_.nav-item:hover_&]:[opacity:1] [.app-shell--collapsed_.desktop-sidebar_.nav-item:hover_&]:[transform:translate(0,_-50%)] [.app-shell--collapsed_.desktop-sidebar_.nav-item:hover_&]:[visibility:visible] [.app-shell--collapsed_.desktop-sidebar_.nav-item:hover_&]:[transition-delay:180ms,_180ms,_0ms] [.app-shell--collapsed_.desktop-sidebar_.nav-item:focus-visible_&]:[opacity:1] [.app-shell--collapsed_.desktop-sidebar_.nav-item:focus-visible_&]:[transform:translate(0,_-50%)] [.app-shell--collapsed_.desktop-sidebar_.nav-item:focus-visible_&]:[visibility:visible] [.app-shell--collapsed_.desktop-sidebar_.nav-item:focus-visible_&]:[transition-delay:180ms,_180ms,_0ms] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:hover_&]:[opacity:1] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:hover_&]:[transform:translate(0,_-50%)] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:hover_&]:[visibility:visible] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:hover_&]:[transition-delay:180ms,_180ms,_0ms] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:focus-within_&]:[opacity:1] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:focus-within_&]:[transform:translate(0,_-50%)] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:focus-within_&]:[visibility:visible] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:focus-within_&]:[transition-delay:180ms,_180ms,_0ms] max-[1100px]:[.mobile-sidebar_&]:[display:none]")} role="tooltip">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}


function relativeTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const notificationIcons: Record<NotificationCategory, typeof Bell> = {
  assessment: ClipboardCheck,
  action: Activity,
  assignment: UsersRound,
  "master-data": FileText,
  site: Building2,
};

/**
 * Notification centre. Modeled on ProfileMenu — same popover conventions (useId, outside
 * pointerdown + Escape to close, aria-controls/expanded, role="dialog", --up placement).
 * Notifications are addressed by role, and read state is tracked per role, so each demo
 * login sees its own list and its own unread count.
 */
function NotificationMenu({ menuPlacement = "down" }: { menuPlacement?: "down" | "up" }) {
  const { role } = useGuidedSetup();
  const { notifications, markRead, markAllRead } = useNotifications(role);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  const mine = notifications;
  const unread = mine.filter((item) => !item.readBy.includes(role)).length;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function openNotification(item: AppNotification) {
    markRead(item.id);
    setOpen(false);
    if (item.link) navigate(item.link);
  }

  return (
    <div className={cx("notification-menu-wrap [position:relative] [flex:none]")} ref={wrapRef}>
      <button
        type="button"
        className={cx("notification-button [position:relative] [display:grid] [width:38px] [height:38px] [place-items:center] [border:1px_solid_transparent] [border-radius:11px] [background:none] [color:var(--nav-text)] [cursor:pointer] hover:[border-color:var(--nav-border)] hover:[background:var(--nav-hover)] hover:[color:var(--nav-text-strong)]")}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={19} />
        {unread > 0 && <span className={cx("notification-badge [position:absolute] [top:2px] [right:2px] [min-width:17px] [height:17px] [padding:0_4px] [border-radius:999px] [background:var(--danger)] [color:#fff] [font-size:0.6rem] [font-weight:750] [line-height:17px] [text-align:center]")} aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div id={menuId} className={cx("notification-panel max-[1100px]:[.mobile-shell-strip_&]:[position:fixed] max-[1100px]:[.mobile-shell-strip_&]:[top:calc(var(--topbar)_+_0.4rem)] max-[1100px]:[.mobile-shell-strip_&]:[right:0.75rem] max-[1100px]:[.mobile-shell-strip_&]:[left:0.75rem] max-[1100px]:[.mobile-shell-strip_&]:[width:auto] max-[1100px]:[.mobile-shell-strip_&]:[max-height:calc(100vh_-_var(--topbar)_-_1.5rem)] [position:absolute] [z-index:180] [top:calc(100%_+_0.65rem)] [right:0] [display:flex] [flex-direction:column] [width:min(380px,_calc(100vw_-_1.5rem))] [max-height:min(460px,_calc(100vh_-_6rem))] [overflow:hidden] [border:1px_solid_var(--border-translucent)] [border-radius:18px] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [color:var(--neutral-900)] [animation:profile-menu-in_160ms_cubic-bezier(0.22,_1,_0.36,_1)]", menuPlacement === "up" && "notification-panel--up [.notification-panel&]:[top:auto] [.notification-panel&]:[right:auto] [.notification-panel&]:[bottom:calc(100%_+_0.65rem)] [.notification-panel&]:[left:0] [.notification-panel&]:[animation-name:profile-menu-in-up]")} role="dialog" aria-label="Notifications">
          <div className={cx("notification-panel__header [display:flex] [flex:none] [align-items:center] [justify-content:space-between] [gap:0.75rem] [border-bottom:1px_solid_var(--neutral-200)] [padding:0.85rem_1rem] [&_strong]:[font-size:0.9rem] [&_button]:[flex:none] [&_button]:[border:0] [&_button]:[background:none] [&_button]:[padding:0] [&_button]:[color:var(--kc-700)] [&_button]:[font-size:0.75rem] [&_button]:[font-weight:650] [&_button]:[cursor:pointer] [&_button:hover]:[color:var(--kc-800)] [&_button:hover]:[text-decoration:underline]")}>
            <div>
              <p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Notifications</p>
              <strong>{unread ? `${unread} unread` : "All caught up"}</strong>
            </div>
            {unread > 0 && <button type="button" onClick={markAllRead}>Mark all as read</button>}
          </div>
          {mine.length ? (
            <ul className={cx("notification-list [flex:1] [overflow-y:auto] [margin:0] [padding:0.35rem] [list-style:none]")}>
              {mine.map((item) => {
                const Icon = notificationIcons[item.category];
                const isUnread = !item.readBy.includes(role);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cx("notification-item [display:flex] [width:100%] [align-items:flex-start] [gap:0.65rem] [border:0] [border-radius:12px] [background:none] [padding:0.7rem] [text-align:left] [cursor:pointer] hover:[background:var(--neutral-50)]", isUnread && "notification-item--unread [background:var(--kc-50)] hover:[background:var(--kc-100)]")}
                      onClick={() => openNotification(item)}
                    >
                      <span className={cx("notification-item__icon [display:grid] [flex:none] [width:30px] [height:30px] [place-items:center] [border-radius:9px] [background:var(--surface-panel)] [color:var(--kc-700)]")}><Icon size={17} /></span>
                      <span className={cx("notification-item__copy [display:grid] [gap:0.15rem] [min-width:0] [&_strong]:[color:var(--neutral-900)] [&_strong]:[font-size:0.8rem] [&_strong]:[line-height:1.3] [&_small]:[color:var(--neutral-600)] [&_small]:[font-size:0.72rem] [&_small]:[line-height:1.35] [&_time]:[color:var(--neutral-500)] [&_time]:[font-size:0.66rem]")}>
                        <strong>{item.title}</strong>
                        <small>{item.body}</small>
                        <time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
                      </span>
                      {isUnread && <span className={cx("notification-item__dot [flex:none] [align-self:center] [width:8px] [height:8px] [border-radius:50%] [background:var(--kc-600)]")} aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={cx("notification-empty [padding:1.5rem_1.1rem] [color:var(--neutral-500)] [font-size:0.8rem] [text-align:center]")}>No notifications yet. Activity relevant to your role will appear here.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ compact = false, menuPlacement = "down" }: { compact?: boolean; menuPlacement?: "down" | "up" }) {
  const { role, profile, startTour } = useGuidedSetup();
  const { user, demoEnabled, signOut } = useAuth();
  const { preference, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={cx("profile-menu-wrap [.sidebar-footer_&]:[min-width:0] [.sidebar-footer_&]:[flex:1] [position:relative]")} ref={wrapRef}>
      <button
        className={cx("profile-button [.sidebar-footer_&]:[width:100%] [.sidebar-footer_&]:[color:var(--nav-text)] [.sidebar-footer_&:hover]:[background:var(--nav-hover)] [.app-shell--collapsed_.desktop-sidebar_&]:[justify-content:center] [.app-shell--collapsed_.desktop-sidebar_&]:[padding:0.25rem] [display:flex] [min-height:46px] [align-items:center] [gap:0.55rem] [border:0] [border-radius:12px] [background:transparent] [padding:0.25rem_0.45rem_0.25rem_0.25rem] [color:var(--neutral-600)] [text-align:left] hover:[background:var(--neutral-100)]", compact && "profile-button--compact [.profile-button&]:[min-height:auto] [.profile-button&]:[gap:0] [.profile-button&]:[padding:0]")}
        aria-label="Open profile menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cx("avatar [display:inline-grid] [width:38px] [height:38px] [flex:0_0_38px] [place-items:center] [border:1px_solid_var(--kc-200)] [border-radius:50%] [background:linear-gradient(145deg,_var(--kc-100),_var(--surface-elevated))] [color:var(--kc-800)] [font-size:0.72rem] [font-weight:750] max-[740px]:[width:36px] max-[740px]:[height:36px] max-[740px]:[flex-basis:36px]")}>{profile.initials}</span>
        <span className={cx("profile-button__copy [.sidebar-footer_&_strong]:[color:var(--nav-text-strong)] [.sidebar-footer_&_small]:[color:var(--nav-text-muted)] [.profile-button--compact_&]:[display:none] [.app-shell--collapsed_.desktop-sidebar_&]:[display:none] [display:grid] [&_strong]:[color:var(--neutral-800)] [&_strong]:[font-size:0.8rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.67rem]")}>
          <strong>{profile.name}</strong>
          <small>{profile.label}</small>
        </span>
        <ChevronDown className={cx("profile-button__chevron [.profile-button--compact_&]:[display:none] [.app-shell--collapsed_.desktop-sidebar_&]:[display:none] [transition:transform_160ms_ease]", open && "profile-button__chevron--open [transform:rotate(180deg)]")} size={16} />
      </button>

      {open && (
        <div id={menuId} className={cx("profile-menu [position:absolute] [z-index:180] [top:calc(100%_+_0.65rem)] [right:0] [width:min(330px,_calc(100vw_-_1.5rem))] [overflow:hidden] [border:1px_solid_var(--border-translucent)] [border-radius:18px] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [color:var(--neutral-900)] [animation:profile-menu-in_160ms_cubic-bezier(0.22,_1,_0.36,_1)]", menuPlacement === "up" && "profile-menu--up [.profile-menu&]:[top:auto] [.profile-menu&]:[right:auto] [.profile-menu&]:[bottom:calc(100%_+_0.65rem)] [.profile-menu&]:[left:0] [.profile-menu&]:[animation-name:profile-menu-in-up]")} role="dialog" aria-label="Profile and appearance">
          <div className={cx("profile-menu__identity [display:flex] [align-items:center] [gap:0.75rem] [padding:1rem] [border-bottom:1px_solid_var(--neutral-200)] [background:linear-gradient(135deg,_var(--kc-50),_transparent)] [&_>_div]:[display:grid] [&_>_div]:[min-width:0] [&_strong]:[color:var(--neutral-900)] [&_strong]:[font-size:0.88rem] [&_span:last-child]:[color:var(--neutral-500)] [&_span:last-child]:[font-size:0.73rem]")}>
            <span className={cx("avatar [display:inline-grid] [width:38px] [height:38px] [flex:0_0_38px] [place-items:center] [border:1px_solid_var(--kc-200)] [border-radius:50%] [background:linear-gradient(145deg,_var(--kc-100),_var(--surface-elevated))] [color:var(--kc-800)] [font-size:0.72rem] [font-weight:750] max-[740px]:[width:36px] max-[740px]:[height:36px] max-[740px]:[flex-basis:36px]")}>{profile.initials}</span>
            <div>
              <strong>{profile.name}</strong>
              <span>{profile.label}</span>
            </div>
          </div>
          <div className={cx("profile-menu__section [display:grid] [gap:0.75rem] [padding:1rem]")}>
            <div className={cx("profile-menu__section-heading [display:flex] [align-items:baseline] [justify-content:space-between] [gap:0.75rem] [&_>_span]:[color:var(--neutral-800)] [&_>_span]:[font-size:0.8rem] [&_>_span]:[font-weight:700] [&_>_small]:[color:var(--neutral-500)] [&_>_small]:[font-size:0.66rem] [&_>_small]:[text-transform:capitalize]")}>
              <span>Appearance</span>
              <small>{preference === "system" ? `${resolvedTheme} from system` : `${preference} selected`}</small>
            </div>
            <ThemeSelector compact />
          </div>
          {demoEnabled && (
            <div className={cx("profile-menu__section [display:grid] [gap:0.75rem] [padding:1rem] profile-role-section [display:grid] [gap:0.65rem]")}>
              <button className={cx("profile-setup-action [display:flex] [width:100%] [min-height:38px] [align-items:center] [gap:0.5rem] [border:1px_solid_var(--neutral-200)] [border-radius:9px] [background:var(--surface-panel)] [color:var(--kc-700)] [padding:0.45rem_0.55rem] [font-size:0.75rem] [font-weight:650] [text-align:left] hover:[background:var(--kc-50)] hover:[color:var(--kc-800)]")} onClick={() => { startTour(role, true); setOpen(false); }}>
                <PlayCircle size={17} />
                <span>Replay guided setup</span>
              </button>
            </div>
          )}
          <div className={cx("profile-menu__section [display:grid] [gap:0.75rem] [padding:1rem] profile-menu__session [&_a]:[display:flex] [&_a]:[align-items:center] [&_a]:[gap:0.5rem] [&_a]:[border-radius:9px] [&_a]:[color:var(--neutral-700)] [&_a]:[padding:0.55rem_0.65rem] [&_a]:[font-size:0.78rem] [&_a]:[font-weight:650] [&_a:hover]:[background:var(--kc-50)] [&_a:hover]:[color:var(--kc-800)] [&_a]:[width:100%] [&_a]:[min-height:38px] [&_a]:[border:0] [&_a]:[background:transparent] [&_a]:[text-align:left] [&_button]:[display:flex] [&_button]:[width:100%] [&_button]:[min-height:38px] [&_button]:[align-items:center] [&_button]:[gap:0.5rem] [&_button]:[border:0] [&_button]:[border-radius:9px] [&_button]:[background:transparent] [&_button]:[color:var(--neutral-700)] [&_button]:[padding:0.55rem_0.65rem] [&_button]:[font-size:0.78rem] [&_button]:[font-weight:650] [&_button]:[text-align:left] [&_button:hover]:[background:var(--danger-surface)] [&_button:hover]:[color:var(--danger)]")}>
            <Link to={appPaths.settings} onClick={() => setOpen(false)}><Settings size={17} /><span>Open settings</span></Link>
            <Link to={appPaths.settingsSupport} onClick={() => setOpen(false)}><CircleHelp size={17} /><span>Help and support</span></Link>
            <button type="button" onClick={() => { signOut(); setOpen(false); navigate(appPaths.login, { replace: true }); }}>
              <LogOut size={17} />
              <span>Sign out {user?.name ? `as ${user.name}` : ""}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { assignedSite, dataSourceStatus } = useApplicationData();
  const { role, profile, openHelp } = useGuidedSetup();
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem("ehss-navigation-collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapseTooltipId = useId();
  const location = useLocation();
  const moreTabActive = mobileOpen || [appPaths.siteInformation, appPaths.owners, "/admin/", appPaths.settings].some((path) => location.pathname.startsWith(path));
  const availableBottomTabs = bottomTabs.filter((tab) => tab.roles.includes(role));
  const ScopeIcon = role === "site-contributor" ? Building2 : role === "enterprise-viewer" ? BarChart3 : ShieldCheck;

  useEffect(() => {
    window.localStorage.setItem("ehss-navigation-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div className={cx("app-shell [display:grid] [min-height:100vh] [grid-template-columns:var(--sidebar)_minmax(0,_1fr)] [transition:grid-template-columns_var(--motion-sidebar)] max-[1100px]:[display:block]", collapsed && "app-shell--collapsed [--sidebar:80px] max-[1100px]:[display:block]")}>
      <a className={cx("skip-link [position:fixed] [left:1rem] [top:-4rem] [z-index:1000] [border-radius:var(--radius-md)] [background:var(--neutral-900)] [color:#fff] [padding:0.7rem_1rem] [font-weight:650] [transition:top_120ms_ease] focus:[top:1rem]")} href="#main-content">Skip to main content</a>
      {!dataSourceStatus.connected && dataSourceStatus.message && <div role="status" style={{ position: "fixed", right: 12, bottom: 54, zIndex: 9999, maxWidth: 300, padding: "9px 11px", borderRadius: 8, background: "#fff3cd", color: "#664d03", fontSize: 12, boxShadow: "0 4px 16px rgb(0 0 0 / 0.15)" }}>{dataSourceStatus.message}</div>}

      <aside className={cx("desktop-sidebar [position:sticky] [z-index:20] [top:0] [display:flex] [height:100vh] [grid-column:1] [grid-row:1] [flex-direction:column] [overflow:visible] [border-right:1px_solid_var(--nav-border)] [background:var(--nav-background)] [color:var(--nav-text-strong)] [will-change:width] max-[1100px]:[display:none]")}>
        <div className={cx("brand-lockup [display:flex] [height:var(--topbar)] [flex:0_0_var(--topbar)] [align-items:center] [gap:0.7rem] [padding:0_1.15rem] [border-bottom:1px_solid_var(--nav-border)] [transition:gap_var(--motion-sidebar),_padding_var(--motion-sidebar)] [&_>_div:last-child]:[display:grid] [&_>_div:last-child]:[min-width:0] [&_>_div:last-child]:[max-width:170px] [&_>_div:last-child]:[overflow:hidden] [&_>_div:last-child]:[opacity:1] [&_>_div:last-child]:[transform:translateX(0)] [&_>_div:last-child]:[transform-origin:left_center] [&_>_div:last-child]:[transition:max-width_var(--motion-sidebar),_opacity_150ms_ease_80ms,_transform_var(--motion-sidebar)] [&_strong]:[font-size:1.05rem] [&_strong]:[line-height:1.15] [&_strong]:[letter-spacing:0.01em] [&_span]:[color:var(--nav-text-muted)] [&_span]:[font-size:0.75rem] [&_span]:[white-space:nowrap] [.app-shell--collapsed_.desktop-sidebar_&]:[gap:0] [.app-shell--collapsed_.desktop-sidebar_&]:[justify-content:center] [.app-shell--collapsed_.desktop-sidebar_&]:[padding-inline:0] [.app-shell--collapsed_.desktop-sidebar_&_>_div:last-child]:[max-width:0] [.app-shell--collapsed_.desktop-sidebar_&_>_div:last-child]:[opacity:0] [.app-shell--collapsed_.desktop-sidebar_&_>_div:last-child]:[transform:translateX(-8px)_scale(0.96)] [.app-shell--collapsed_.desktop-sidebar_&_>_div:last-child]:[transition-delay:0ms]")}>
          <KcLogo />
          <div aria-hidden={collapsed}>
            <strong>Maitsys Assure</strong>
            <span>Self-Assessment</span>
          </div>
        </div>
        <div
          className={cx("site-context [display:flex] [min-width:0] [align-items:center] [gap:0.65rem] [color:var(--neutral-600)] [&_>_svg]:[color:var(--kc-700)] [&_>_div]:[display:grid] [&_span:not(.nav-item__tooltip)]:[color:var(--neutral-500)] [&_span:not(.nav-item__tooltip)]:[font-size:0.68rem] [&_span:not(.nav-item__tooltip)]:[line-height:1.05] [&_strong]:[overflow:hidden] [&_strong]:[color:var(--neutral-900)] [&_strong]:[font-size:0.87rem] [&_strong]:[line-height:1.35] [&_strong]:[text-overflow:ellipsis] [&_strong]:[white-space:nowrap] sidebar-context [position:relative] [margin:0.85rem_1.15rem_0.35rem] [padding:0.7rem_0.85rem] [border:1px_solid_var(--nav-border)] [border-radius:var(--radius-md)] [background:rgb(255_255_255_/_0.04)] [transition:padding_var(--motion-sidebar),_margin_var(--motion-sidebar)] [.site-context&]:[flex-wrap:wrap] [.site-context&]:[color:var(--nav-text)] [.site-context&_>_svg]:[color:var(--nav-accent)] [.site-context&_span:not(.nav-item__tooltip)]:[color:var(--nav-text-muted)] [.site-context&_strong]:[color:var(--nav-text-strong)] [.app-shell--collapsed_.desktop-sidebar_&]:[display:grid] [.app-shell--collapsed_.desktop-sidebar_&]:[place-items:center] [.app-shell--collapsed_.desktop-sidebar_&]:[margin-inline:0.65rem] [.app-shell--collapsed_.desktop-sidebar_&]:[padding:0.55rem] [.app-shell--collapsed_.desktop-sidebar_&_>_div]:[display:none]")}
          aria-label={role === "site-contributor" ? `Current assigned site: ${assignedSite.name} · ${assignedSite.code}` : `Current authorized scope: ${profile.scope}`}
          data-tour="site-context"
        >
          <ScopeIcon size={17} />
          <div>
            <span>{role === "site-contributor" ? "Assigned site" : "Authorized scope"}</span>
            <strong>{role === "site-contributor" ? assignedSite.name : profile.scope}</strong>
          </div>
          {role === "site-contributor" && <span className={cx("site-context__code [.site-context.sidebar-context_&]:[width:100%] [.site-context.sidebar-context_&]:[margin-left:0] [.site-context.sidebar-context_&]:[border-left:0] [.site-context.sidebar-context_&]:[padding-left:0] [.site-context.sidebar-context_&]:[color:var(--nav-text-muted)] [.site-context.sidebar-context_&]:[font-size:0.72rem] [.site-context.sidebar-context_&]:[white-space:nowrap] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context_>_&]:[display:none] [margin-left:0.25rem] [border-left:1px_solid_var(--neutral-200)] [padding-left:0.65rem] [font-weight:600]")}>{assignedSite.code}</span>}
          <span className={cx("nav-item__tooltip [position:absolute] [z-index:70] [top:50%] [left:calc(100%_+_14px)] [width:max-content] [max-width:220px] [padding:0.52rem_0.68rem] [border:1px_solid_rgb(var(--accent-dark-scroll-rgb)_/_0.24)] [border-radius:10px] [background:linear-gradient(145deg,_var(--brand-deep),_var(--brand-deepest))] [box-shadow:inset_0_1px_0_rgb(255_255_255_/_0.1),_0_12px_30px_rgb(2_19_31_/_0.28)] [color:#fff] [font-family:var(--font-sans)] [font-size:0.72rem] [font-weight:600] [letter-spacing:0.005em] [line-height:1.25] [opacity:0] [pointer-events:none] [transform:translate(4px,_-50%)] [visibility:hidden] [transition:opacity_120ms_ease_120ms,_transform_150ms_ease_120ms,_visibility_0ms_linear_240ms] before:[position:absolute] before:[top:calc(50%_-_4px)] before:[left:-5px] before:[width:8px] before:[height:8px] before:[border:1px_solid_rgb(var(--accent-dark-scroll-rgb)_/_0.2)] before:[border-top:0] before:[border-right:0] before:[background:var(--kc-950)] before:[content:''] before:[transform:rotate(45deg)] [.app-shell--collapsed_.desktop-sidebar_.nav-item:hover_&]:[opacity:1] [.app-shell--collapsed_.desktop-sidebar_.nav-item:hover_&]:[transform:translate(0,_-50%)] [.app-shell--collapsed_.desktop-sidebar_.nav-item:hover_&]:[visibility:visible] [.app-shell--collapsed_.desktop-sidebar_.nav-item:hover_&]:[transition-delay:180ms,_180ms,_0ms] [.app-shell--collapsed_.desktop-sidebar_.nav-item:focus-visible_&]:[opacity:1] [.app-shell--collapsed_.desktop-sidebar_.nav-item:focus-visible_&]:[transform:translate(0,_-50%)] [.app-shell--collapsed_.desktop-sidebar_.nav-item:focus-visible_&]:[visibility:visible] [.app-shell--collapsed_.desktop-sidebar_.nav-item:focus-visible_&]:[transition-delay:180ms,_180ms,_0ms] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:hover_&]:[opacity:1] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:hover_&]:[transform:translate(0,_-50%)] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:hover_&]:[visibility:visible] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:hover_&]:[transition-delay:180ms,_180ms,_0ms] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:focus-within_&]:[opacity:1] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:focus-within_&]:[transform:translate(0,_-50%)] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:focus-within_&]:[visibility:visible] [.app-shell--collapsed_.desktop-sidebar_.sidebar-context:focus-within_&]:[transition-delay:180ms,_180ms,_0ms] max-[1100px]:[.mobile-sidebar_&]:[display:none]")} role="tooltip" aria-hidden="true">
            {role === "site-contributor" ? `${assignedSite.name} · ${assignedSite.code}` : profile.scope}
          </span>
        </div>
        <SideNav collapsed={collapsed} role={role} />
        <div className={cx("sidebar-footer [display:flex] [min-width:0] [align-items:center] [gap:0.4rem] [margin-top:auto] [padding:0.85rem_1.15rem] [border-top:1px_solid_var(--nav-divider)] [.app-shell--collapsed_.desktop-sidebar_&]:[flex-direction:column]")}>
          <NotificationMenu menuPlacement="up" />
          <ProfileMenu menuPlacement="up" />
        </div>
        <button
          className={cx("collapse-control [position:absolute] [z-index:35] [top:calc(var(--topbar)_-_16px)] [right:-16px] [display:grid] [width:32px] [height:32px] [place-items:center] [border:1px_solid_var(--neutral-200)] [border-radius:50%] [background:var(--surface-elevated)] [box-shadow:0_7px_20px_rgb(15_23_42_/_0.18)] [color:var(--kc-800)] [transition:color_140ms_ease,_transform_140ms_ease,_box-shadow_140ms_ease,_background_140ms_ease,_border-color_140ms_ease] hover:[color:var(--kc-600)] hover:[box-shadow:0_9px_24px_rgb(15_23_42_/_0.24)] hover:[transform:translateY(-1px)] [&:active]:[transform:translateY(0)_scale(0.94)]")}
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-describedby={collapseTooltipId}
          aria-expanded={!collapsed}
        >
          <span className={cx("collapse-control__icons [position:relative] [display:grid] [width:19px] [height:19px] [place-items:center]")} aria-hidden="true">
            <PanelLeftClose className={cx("collapse-control__icon [position:absolute] [inset:0] [opacity:1] [transform:rotate(0)_scale(1)] [transition:opacity_140ms_ease,_transform_var(--motion-sidebar)] collapse-control__icon--close [.app-shell--collapsed_.desktop-sidebar_&]:[opacity:0] [.app-shell--collapsed_.desktop-sidebar_&]:[transform:rotate(28deg)_scale(0.72)]")} size={19} />
            <PanelLeftOpen className={cx("collapse-control__icon [position:absolute] [inset:0] [opacity:1] [transform:rotate(0)_scale(1)] [transition:opacity_140ms_ease,_transform_var(--motion-sidebar)] collapse-control__icon--open [opacity:0] [transform:rotate(-28deg)_scale(0.72)] [.app-shell--collapsed_.desktop-sidebar_&]:[opacity:1] [.app-shell--collapsed_.desktop-sidebar_&]:[transform:rotate(0)_scale(1)]")} size={19} />
          </span>
          <span id={collapseTooltipId} className={cx("app-tooltip [position:absolute] [z-index:320] [width:max-content] [max-width:230px] [padding:0.52rem_0.68rem] [border:1px_solid_rgb(var(--accent-dark-scroll-rgb)_/_0.24)] [border-radius:10px] [background:linear-gradient(145deg,_var(--brand-deep),_var(--brand-deepest))] [box-shadow:inset_0_1px_0_rgb(255_255_255_/_0.1),_0_12px_30px_rgb(2_19_31_/_0.24)] [color:#fff] [font-family:var(--font-sans)] [font-size:0.72rem] [font-weight:600] [letter-spacing:0.005em] [line-height:1.25] [opacity:0] [pointer-events:none] [visibility:hidden] [white-space:normal] [transition:opacity_120ms_ease_120ms,_transform_150ms_ease_120ms,_visibility_0ms_linear_240ms] after:[position:absolute] after:[width:8px] after:[height:8px] after:[border:1px_solid_rgb(var(--accent-dark-scroll-rgb)_/_0.2)] after:[background:var(--kc-950)] after:[content:''] [.icon-button:hover_>_&]:[opacity:1] [.icon-button:hover_>_&]:[visibility:visible] [.icon-button:hover_>_&]:[transition-delay:180ms,_180ms,_0ms] [.icon-button:focus-visible_>_&]:[opacity:1] [.icon-button:focus-visible_>_&]:[visibility:visible] [.icon-button:focus-visible_>_&]:[transition-delay:180ms,_180ms,_0ms] [.collapse-control:hover_>_&]:[opacity:1] [.collapse-control:hover_>_&]:[visibility:visible] [.collapse-control:hover_>_&]:[transition-delay:180ms,_180ms,_0ms] [.collapse-control:focus-visible_>_&]:[opacity:1] [.collapse-control:focus-visible_>_&]:[visibility:visible] [.collapse-control:focus-visible_>_&]:[transition-delay:180ms,_180ms,_0ms] [.desktop-sidebar:has(.nav-item:hover)_.collapse-control_>_&]:[opacity:0] [.desktop-sidebar:has(.nav-item:hover)_.collapse-control_>_&]:[visibility:hidden] [.desktop-sidebar:has(.nav-item:hover)_.collapse-control_>_&]:[transition-delay:0ms] max-[1100px]:[.mobile-sidebar_&]:[display:none] [@media_(hover:_none)]:[display:none] [.row-actions--menu:has(.row-menu)_&]:[opacity:0]! [.row-actions--menu:has(.row-menu)_&]:[visibility:hidden]! app-tooltip--right [top:50%] [left:calc(100%_+_11px)] [transform:translate(4px,_-50%)] after:[top:calc(50%_-_4px)] after:[left:-5px] after:[border-top:0] after:[border-right:0] after:[transform:rotate(45deg)] [.icon-button:hover_>_&]:[transform:translate(0,_-50%)] [.icon-button:focus-visible_>_&]:[transform:translate(0,_-50%)] [.collapse-control:hover_>_&]:[transform:translate(0,_-50%)] [.collapse-control:focus-visible_>_&]:[transform:translate(0,_-50%)]")} role="tooltip">
            {collapsed ? "Expand navigation" : "Collapse navigation"}
          </span>
        </button>
      </aside>

      {mobileOpen && (
        <div className={cx("mobile-nav-layer [display:none] max-[1100px]:[position:fixed] max-[1100px]:[z-index:120] max-[1100px]:[inset:0] max-[1100px]:[display:block]")}>
          <button className={cx("mobile-nav-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside id="mobile-navigation-drawer" className={cx("mobile-sidebar max-[1100px]:[--scrollbar-thumb:var(--nav-scrollbar-thumb)] max-[1100px]:[--scrollbar-thumb-hover:var(--nav-scrollbar-thumb-hover)] max-[1100px]:[--scrollbar-thumb-active:var(--nav-scrollbar-thumb-active)] max-[1100px]:[position:absolute] max-[1100px]:[top:0] max-[1100px]:[bottom:0] max-[1100px]:[left:0] max-[1100px]:[width:min(340px,_calc(100%_-_2rem))] max-[1100px]:[overflow-x:hidden] max-[1100px]:[overflow-y:auto] max-[1100px]:[background:var(--nav-background)] max-[1100px]:[color:var(--nav-text-strong)] max-[1100px]:[box-shadow:var(--shadow-3)] max-[1100px]:[animation:nav-in_180ms_ease-out]")} aria-label="Mobile navigation">
            <div className={cx("mobile-sidebar__header max-[1100px]:[display:flex] max-[1100px]:[align-items:center] max-[1100px]:[justify-content:space-between] max-[1100px]:[border-bottom:1px_solid_var(--nav-border)]")}>
              <div className={cx("brand-lockup [display:flex] [height:var(--topbar)] [flex:0_0_var(--topbar)] [align-items:center] [gap:0.7rem] [padding:0_1.15rem] [border-bottom:1px_solid_var(--nav-border)] [transition:gap_var(--motion-sidebar),_padding_var(--motion-sidebar)] [&_>_div:last-child]:[display:grid] [&_>_div:last-child]:[min-width:0] [&_>_div:last-child]:[max-width:170px] [&_>_div:last-child]:[overflow:hidden] [&_>_div:last-child]:[opacity:1] [&_>_div:last-child]:[transform:translateX(0)] [&_>_div:last-child]:[transform-origin:left_center] [&_>_div:last-child]:[transition:max-width_var(--motion-sidebar),_opacity_150ms_ease_80ms,_transform_var(--motion-sidebar)] [&_strong]:[font-size:1.05rem] [&_strong]:[line-height:1.15] [&_strong]:[letter-spacing:0.01em] [&_span]:[color:var(--nav-text-muted)] [&_span]:[font-size:0.75rem] [&_span]:[white-space:nowrap] [.app-shell--collapsed_.desktop-sidebar_&]:[gap:0] [.app-shell--collapsed_.desktop-sidebar_&]:[justify-content:center] [.app-shell--collapsed_.desktop-sidebar_&]:[padding-inline:0] [.app-shell--collapsed_.desktop-sidebar_&_>_div:last-child]:[max-width:0] [.app-shell--collapsed_.desktop-sidebar_&_>_div:last-child]:[opacity:0] [.app-shell--collapsed_.desktop-sidebar_&_>_div:last-child]:[transform:translateX(-8px)_scale(0.96)] [.app-shell--collapsed_.desktop-sidebar_&_>_div:last-child]:[transition-delay:0ms]")}>
                <KcLogo />
                <div>
                  <strong>Maitsys Assure</strong>
                  <span>Self-Assessment</span>
                </div>
              </div>
              <IconButton label="Close navigation" onClick={() => setMobileOpen(false)}>
                <X size={20} />
              </IconButton>
            </div>
            <SideNav collapsed={false} role={role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cx("mobile-shell-strip [display:none] max-[1100px]:[position:sticky] max-[1100px]:[z-index:15] max-[1100px]:[top:0] max-[1100px]:[display:flex] max-[1100px]:[height:var(--topbar)] max-[1100px]:[align-items:center] max-[1100px]:[justify-content:space-between] max-[1100px]:[gap:0.75rem] max-[1100px]:[padding:0_1rem] max-[1100px]:[border-bottom:1px_solid_var(--border-translucent)] max-[1100px]:[background:var(--surface-topbar)] max-[1100px]:[box-shadow:0_1px_8px_rgb(15_23_42_/_0.03)] max-[1100px]:[backdrop-filter:blur(18px)_saturate(140%)] max-[740px]:[gap:0.4rem] max-[740px]:[padding-inline:0.65rem]")}>
        <div className={cx("mobile-shell-strip__badge max-[1100px]:[display:flex] max-[1100px]:[min-width:0] max-[1100px]:[align-items:center] max-[1100px]:[gap:0.45rem] max-[1100px]:[overflow:hidden] max-[1100px]:[color:var(--neutral-700)] max-[1100px]:[font-size:0.78rem] max-[1100px]:[font-weight:650] max-[1100px]:[white-space:nowrap] max-[1100px]:[&_>_svg]:[flex:0_0_auto] max-[1100px]:[&_>_svg]:[color:var(--kc-700)] max-[1100px]:[&_>_span]:[overflow:hidden] max-[1100px]:[&_>_span]:[text-overflow:ellipsis]")} aria-label={role === "site-contributor" ? "Current assigned site" : "Current authorized scope"} data-tour="site-context">
          <ScopeIcon size={16} />
          <span>{role === "site-contributor" ? assignedSite.code : profile.scope}</span>
        </div>
        <div className={cx("mobile-shell-strip__actions max-[1100px]:[display:flex] max-[1100px]:[flex:0_0_auto] max-[1100px]:[align-items:center] max-[1100px]:[gap:0.35rem]")}>
          <NotificationMenu />
            <IconButton label="Help and guided setup" onClick={openHelp} data-tour="help">
            <CircleHelp size={18} />
          </IconButton>
          <ProfileMenu compact />
        </div>
      </div>

      <main id="main-content" className={cx("main-content [min-width:0] [grid-column:2] [grid-row:1] max-[1100px]:[grid-column:auto] max-[1100px]:[padding-bottom:calc(88px_+_env(safe-area-inset-bottom))]")}>
        {children}
      </main>

      <nav className={cx("bottom-tab-bar [display:none] max-[1100px]:[position:fixed] max-[1100px]:[z-index:90] max-[1100px]:[right:50%] max-[1100px]:[bottom:calc(0.65rem_+_env(safe-area-inset-bottom))] max-[1100px]:[display:grid] max-[1100px]:[width:min(720px,_calc(100%_-_2rem))] max-[1100px]:[grid-template-columns:repeat(var(--bottom-tab-count,_5),_minmax(0,_1fr))] max-[1100px]:[gap:0.25rem] max-[1100px]:[padding:0.35rem] max-[1100px]:[border:1px_solid_var(--border-translucent)] max-[1100px]:[border-radius:22px] max-[1100px]:[background:var(--surface-translucent)] max-[1100px]:[box-shadow:0_18px_50px_rgb(15_23_42_/_0.2)] max-[1100px]:[backdrop-filter:blur(22px)_saturate(150%)] max-[1100px]:[transform:translateX(50%)] max-[740px]:[right:0] max-[740px]:[bottom:0] max-[740px]:[left:0] max-[740px]:[width:100%] max-[740px]:[gap:0] max-[740px]:[padding:0.35rem_0.25rem_calc(0.35rem_+_env(safe-area-inset-bottom))] max-[740px]:[border-right:0] max-[740px]:[border-bottom:0] max-[740px]:[border-left:0] max-[740px]:[border-radius:20px_20px_0_0] max-[740px]:[transform:none]")} aria-label="Primary tabs" style={{ "--bottom-tab-count": availableBottomTabs.length + 1 } as CSSProperties}>
        {availableBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.matches.some((path) => location.pathname === path || location.pathname.startsWith(path.endsWith("/") ? path : `${path}/`));
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cx("bottom-tab-item [position:relative] [display:grid] [min-width:0] [min-height:54px] [place-items:center] [align-content:center] [gap:0.18rem] [border:0] [border-radius:15px] [background:transparent] [color:var(--neutral-500)] [font-size:0.66rem] [font-weight:650] [line-height:1] [transition:background_150ms_ease,_color_150ms_ease,_transform_100ms_ease] hover:[background:var(--neutral-100)] hover:[color:var(--neutral-800)] [&:active]:[transform:scale(0.96)] max-[740px]:[min-height:56px] max-[740px]:[padding-inline:0.1rem] max-[740px]:[font-size:0.61rem]", active && "bottom-tab-item--active [background:var(--kc-50)] [color:var(--kc-800)]")}
              aria-current={active ? "page" : undefined}
              data-tour={`tab-${tab.to.split("/").filter(Boolean).join("-")}`}
            >
              <span className={cx("bottom-tab-item__icon [display:grid] [width:31px] [height:27px] [place-items:center] [border-radius:10px] [transition:background_150ms_ease,_color_150ms_ease,_transform_180ms_ease] [.bottom-tab-item--active_&]:[background:var(--surface-elevated)] [.bottom-tab-item--active_&]:[color:var(--kc-700)] [.bottom-tab-item--active_&]:[box-shadow:var(--shadow-1)] [.bottom-tab-item--active_&]:[transform:translateY(-1px)]")}><Icon size={21} /></span>
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
        <button
          className={cx("bottom-tab-item [position:relative] [display:grid] [min-width:0] [min-height:54px] [place-items:center] [align-content:center] [gap:0.18rem] [border:0] [border-radius:15px] [background:transparent] [color:var(--neutral-500)] [font-size:0.66rem] [font-weight:650] [line-height:1] [transition:background_150ms_ease,_color_150ms_ease,_transform_100ms_ease] hover:[background:var(--neutral-100)] hover:[color:var(--neutral-800)] [&:active]:[transform:scale(0.96)] max-[740px]:[min-height:56px] max-[740px]:[padding-inline:0.1rem] max-[740px]:[font-size:0.61rem]", moreTabActive && "bottom-tab-item--active [background:var(--kc-50)] [color:var(--kc-800)]")}
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open more navigation"
          aria-controls="mobile-navigation-drawer"
          aria-expanded={mobileOpen}
        >
          <span className={cx("bottom-tab-item__icon [display:grid] [width:31px] [height:27px] [place-items:center] [border-radius:10px] [transition:background_150ms_ease,_color_150ms_ease,_transform_180ms_ease] [.bottom-tab-item--active_&]:[background:var(--surface-elevated)] [.bottom-tab-item--active_&]:[color:var(--kc-700)] [.bottom-tab-item--active_&]:[box-shadow:var(--shadow-1)] [.bottom-tab-item--active_&]:[transform:translateY(-1px)]")}><MoreHorizontal size={22} /></span>
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
