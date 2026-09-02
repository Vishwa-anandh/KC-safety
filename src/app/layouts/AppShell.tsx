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
  FileText,
  History,
  KeyRound,
  LogOut,
  LayoutDashboard,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PlayCircle,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApplicationData } from "../providers/ApplicationDataProvider";
import { ChangePasswordDialog, useAuth } from "../../features/auth";
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
      { to: appPaths.overview, label: "Overview", icon: LayoutDashboard, matches: [appPaths.overview] },
      { to: appPaths.siteInformation, label: "Site information", icon: Building2, matches: [appPaths.siteInformation] },
      { to: appPaths.owners, label: "Program owners", icon: UsersRound, matches: [appPaths.owners] },
      { to: appPaths.assessment, label: "Self-assessment", icon: ClipboardCheck, matches: [appPaths.assessment] },
      { to: appPaths.actions, label: "Actions summary", icon: Activity, matches: [appPaths.actions] },
    ],
  },
  {
    label: "Oversight",
    roles: ["administrator"] as UserRole[],
    items: [{ to: appPaths.dashboard, label: "Enterprise dashboard", icon: BarChart3, matches: [appPaths.dashboard, "/sites/"] }],
  },
  {
    label: "Administration",
    roles: ["administrator"] as UserRole[],
    items: [
      { to: appPaths.adminSites, label: "Sites", icon: Building2, matches: [appPaths.adminSites] },
      { to: appPaths.adminRequirements, label: "Master data", icon: FileText, matches: [appPaths.adminRequirements, appPaths.adminImports] },
      { to: appPaths.adminRequirementAudit, label: "Audit log", icon: History, matches: [appPaths.adminRequirementAudit] },
      { to: appPaths.adminConfig, label: "Config", icon: SlidersHorizontal, matches: [appPaths.adminConfig] },
    ],
  },
];

const bottomTabs = [
  { to: appPaths.overview, label: "Overview", icon: LayoutDashboard, matches: [appPaths.overview], roles: ["site-contributor"] as UserRole[] },
  { to: appPaths.assessment, label: "Assessment", icon: ClipboardCheck, matches: [appPaths.assessment], roles: ["site-contributor"] as UserRole[] },
  { to: appPaths.actions, label: "Actions", icon: Activity, matches: [appPaths.actions], roles: ["site-contributor"] as UserRole[] },
  { to: appPaths.dashboard, label: "Dashboard", icon: BarChart3, matches: [appPaths.dashboard, "/sites/"], roles: ["administrator"] as UserRole[] },
  { to: appPaths.adminSites, label: "Sites", icon: Building2, matches: [appPaths.adminSites], roles: ["administrator"] as UserRole[] },
  { to: appPaths.adminRequirements, label: "Master data", icon: FileText, matches: [appPaths.adminRequirements, appPaths.adminImports], roles: ["administrator"] as UserRole[] },
];

/*
 * The shell keeps a small set of CSS variables that Tailwind utilities cannot express, applied
 * through inline `style` props rather than arbitrary utilities:
 *   --nav-background        layered radial + linear gradient behind both sidebars
 *   --nav-active-background layered gradient behind the active nav item
 *   --nav-active-shadow     accent-tinted glow under the active nav item
 *   --nav-scrollbar-*       assignments to the global --scrollbar-* custom properties
 *   --shadow-1 / --shadow-3 the custom elevation ramp
 *   --surface-topbar / --surface-translucent  frosted translucent bars
 *   --border-translucent    the glass hairline on those bars and on the shell popovers
 *   --topbar                shell strip / brand row height (72px desktop, 66px below 1100px)
 * All of those still swap by theme in tailwind.base.css, so they stay theme-correct without a
 * `dark:` counterpart. Every other colour is a canonical utility plus an explicit `dark:` variant.
 */
const navScrollbarStyle = {
  "--scrollbar-thumb": "var(--nav-scrollbar-thumb)",
  "--scrollbar-thumb-hover": "var(--nav-scrollbar-thumb-hover)",
  "--scrollbar-thumb-active": "var(--nav-scrollbar-thumb-active)",
} as CSSProperties;

const topbarHeightStyle: CSSProperties = { height: "var(--topbar)", flexBasis: "var(--topbar)" };

/* Shared chrome for the collapsed-sidebar tooltips. Hidden by default; each call site adds its own
   group-hover/group-focus reveal because Tailwind needs the literal variant in the source. */
const navTooltipBase =
  "nav-item__tooltip pointer-events-none invisible absolute top-1/2 left-full z-70 ml-3.5 w-max max-w-56 -translate-y-1/2 translate-x-1 rounded-lg border border-kc-blue-300/25 bg-linear-145 from-kc-blue-900 to-kc-blue-950 px-2.5 py-2 font-sans text-xs leading-tight font-semibold text-white opacity-0 shadow-2xl shadow-slate-950/30 transition-all duration-150 ease-out inset-shadow-2xs inset-shadow-white/10 before:absolute before:top-1/2 before:-left-1.5 before:-mt-1 before:size-2 before:rotate-45 before:border before:border-t-0 before:border-r-0 before:border-kc-blue-300/20 before:bg-kc-blue-950 dark:border-kc-blue-300/25 dark:from-kc-blue-900 dark:to-kc-blue-950 dark:text-white dark:before:border-kc-blue-300/20 dark:before:bg-kc-blue-950";

/* Brand row shared by the desktop sidebar and the mobile drawer. */
function BrandLockup({ collapsed, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  return (
    <div
      className={cx(
        "brand-lockup relative flex flex-none items-center border-b border-kc-blue-700/15 transition-all duration-300 ease-out dark:border-white/10",
        collapsed ? "justify-center gap-0 px-0" : "gap-3 px-4.5",
      )}
      style={topbarHeightStyle}
    >
      <span className={cx("brand-lockup__mark inline-grid transition-all duration-150 ease-out", collapsed && "group-hover/sidebar:scale-75 group-hover/sidebar:opacity-0 pointer-coarse:scale-75 pointer-coarse:opacity-0")}>
        <KcLogo />
      </span>
      {collapsed && onToggle && (
        <button
          type="button"
          className={cx("collapsed-sidebar-toggle absolute inset-0 z-10 grid place-items-center text-kc-blue-800 opacity-0 pointer-events-none transition-all duration-150 ease-out group-hover/sidebar:opacity-100 group-hover/sidebar:pointer-events-auto hover:bg-kc-blue-50/70 focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:outline-3 focus-visible:outline-offset-[-3px] focus-visible:outline-kc-blue-500 pointer-coarse:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:bg-kc-blue-50/70 dark:text-kc-blue-200 dark:hover:bg-kc-blue-950/60 dark:pointer-coarse:bg-kc-blue-950/60")}
          onClick={onToggle}
          aria-label="Expand navigation"
        >
          <PanelLeftOpen size={21} aria-hidden="true" />
        </button>
      )}
      <div
        className={cx(
          "grid min-w-0 origin-left overflow-hidden transition-all duration-300 ease-out",
          collapsed ? "max-w-0 -translate-x-2 scale-95 opacity-0" : "max-w-42 translate-x-0 opacity-100",
        )}
        aria-hidden={collapsed}
      >
        <strong className={cx("text-lg leading-tight tracking-normal")}>EHS360</strong>
        <span className={cx("text-sm whitespace-nowrap text-slate-500 dark:text-white/65")}>Self-Assessment</span>
      </div>
    </div>
  );
}

function SideNav({ collapsed, role, onNavigate }: { collapsed: boolean; role: UserRole; onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav
      className={cx(
        "side-nav flex-1 overflow-visible pt-4 pb-6 transition-all duration-300 ease-out",
        /* Normally overflow-visible so the collapsed tooltips can escape the rail; only short
           desktop viewports trade that for scrolling. No canonical height-based variant exists. */
        "[@media(max-height:680px)_and_(min-width:1101px)]:overflow-x-hidden [@media(max-height:680px)_and_(min-width:1101px)]:overflow-y-auto",
        collapsed ? "px-2.5" : "px-3",
      )}
      style={navScrollbarStyle}
      aria-label="Primary navigation"
    >
      {navigation.filter((group) => group.roles.includes(role)).map((group) => (
        <div
          className={cx(
            "nav-group transition-all duration-300 ease-out",
            collapsed
              ? "mt-2.5 border-t border-kc-blue-700/10 pt-2.5 first:mt-0 first:border-t-0 first:pt-0 dark:border-white/10"
              : "mt-5 first:mt-0",
          )}
          key={group.label}
        >
          <p
            className={cx(
              "nav-group__label origin-left overflow-hidden text-xs font-bold tracking-wide text-slate-500 transition-all duration-300 ease-out dark:text-white/45",
              collapsed ? "m-0 max-h-0 -translate-x-2 opacity-0" : "mb-2 ml-3 max-h-5 translate-x-0 opacity-100",
            )}
            aria-hidden={collapsed}
          >
            {group.label}
          </p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const tooltipId = `nav-tooltip-${item.to.replaceAll("/", "-").replace(/^-/, "")}`;
            const routeMatches = item.matches?.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`)) ?? false;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) => {
                  const active = isActive || routeMatches;
                  return cx(
                  "nav-item group/nav relative my-0.5 flex min-h-12 items-center rounded-xl border border-transparent text-sm font-medium transition-all duration-300 ease-out",
                  collapsed ? "justify-center gap-0 p-1.5" : "gap-2.5 px-2 py-1.5",
                  active
                    ? "nav-item--active text-slate-900 forced-colors:border-2 forced-colors:border-current dark:text-white"
                    : "text-slate-600 hover:bg-kc-blue-700/7 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/7 dark:hover:text-white",
                  /* The active marker bar. Only drawn on the expanded rail's left edge and on the
                     collapsed rail slightly closer in. */
                  active && "before:absolute before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-md before:bg-kc-blue-300 before:shadow-md before:shadow-kc-blue-400/55",
                  active && (collapsed ? "bg-kc-blue-700/10 shadow-none before:-left-2.5 dark:bg-white/8" : "before:-left-3"),
                );
                }}
                style={({ isActive }) => ((isActive || routeMatches) && !collapsed
                  ? { background: "var(--nav-active-background)", boxShadow: "var(--nav-active-shadow)" }
                  : undefined)}
                aria-label={collapsed ? item.label : undefined}
                aria-describedby={collapsed ? tooltipId : undefined}
                data-tour={`nav-${item.to.split("/").filter(Boolean).join("-")}`}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cx(
                        "nav-item__icon grid size-8 flex-none place-items-center rounded-lg transition-all duration-300 ease-out",
                        collapsed ? "scale-95" : "scale-100",
                        isActive
                          ? "bg-white text-kc-blue-800 shadow-md shadow-slate-950/20 dark:bg-white dark:text-kc-blue-800"
                          : "text-slate-600 group-hover/nav:bg-kc-blue-700/10 group-hover/nav:text-slate-900 dark:text-white/70 dark:group-hover/nav:bg-white/10 dark:group-hover/nav:text-white",
                      )}
                    >
                      <Icon size={19} />
                    </span>
                    <span
                      className={cx(
                        "nav-item__label min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                        collapsed ? "max-w-0 -translate-x-2 opacity-0" : "max-w-44 translate-x-0 opacity-100",
                      )}
                      aria-hidden={collapsed}
                    >
                      {item.label}
                    </span>
                    <ChevronRight
                      className={cx(
                        "nav-item__chevron flex-none transition-all duration-300 ease-out",
                        collapsed
                          ? "max-w-0 -translate-x-2 opacity-0"
                          : isActive
                            ? "max-w-4 translate-x-0 opacity-70"
                            : "max-w-4 -translate-x-1 opacity-0",
                      )}
                      size={15}
                      aria-hidden="true"
                    />
                    <span
                      id={tooltipId}
                      className={cx(
                        navTooltipBase,
                        collapsed
                          ? "group-hover/nav:visible group-hover/nav:translate-x-0 group-hover/nav:opacity-100 group-hover/nav:delay-200 group-focus-visible/nav:visible group-focus-visible/nav:translate-x-0 group-focus-visible/nav:opacity-100 group-focus-visible/nav:delay-200"
                          : "hidden",
                      )}
                      role="tooltip"
                    >
                      {item.label}
                    </span>
                  </>
                )}
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

  /* "up" placement is only ever used from the sidebar footer, and "down" only from the mobile
     shell strip, so the placement also selects which panel geometry applies. That replaces the
     dissolved `.mobile-shell-strip &` descendant rule: the strip exists only below 1100px, so the
     strip panel needs no desktop geometry and the sidebar panel needs no mobile geometry. */
  const inSidebar = menuPlacement === "up";

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
    <div className={cx("notification-menu-wrap relative flex-none")} ref={wrapRef}>
      <button
        type="button"
        className={cx("notification-button relative grid size-10 place-items-center rounded-xl border border-transparent bg-transparent text-slate-600 hover:border-kc-blue-700/15 hover:bg-kc-blue-700/7 hover:text-slate-900 dark:text-white/70 dark:hover:border-white/10 dark:hover:bg-white/7 dark:hover:text-white")}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={19} />
        {unread > 0 && <span className={cx("notification-badge absolute top-0.5 right-0.5 h-4 min-w-4 rounded-full bg-red-700 px-1 text-center text-xs leading-4 font-bold text-white dark:bg-red-700 dark:text-white")} aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div
          id={menuId}
          className={cx(
            "notification-panel z-180 flex flex-col overflow-hidden rounded-2xl border bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100",
            inSidebar
              ? "notification-panel--up absolute bottom-full left-0 mb-2.5 w-95"
              : "fixed right-3 left-3 w-auto",
          )}
          style={inSidebar
            ? {
              maxHeight: "min(460px, calc(100vh - 6rem))",
              borderColor: "var(--border-translucent)",
              boxShadow: "var(--shadow-3)",
              animation: "profile-menu-in-up 160ms cubic-bezier(0.22, 1, 0.36, 1)",
            }
            : {
              top: "calc(var(--topbar) + 0.4rem)",
              maxHeight: "calc(100vh - var(--topbar) - 1.5rem)",
              borderColor: "var(--border-translucent)",
              boxShadow: "var(--shadow-3)",
              animation: "profile-menu-in 160ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          role="dialog"
          aria-label="Notifications"
        >
          <div className={cx("notification-panel__header flex flex-none items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-slate-700")}>
            <div>
              <p className={cx("eyebrow text-sm leading-snug font-bold tracking-wide text-kc-blue-700 dark:text-kc-blue-300")}>Notifications</p>
              <strong className={cx("text-base")}>{unread ? `${unread} unread` : "All caught up"}</strong>
            </div>
            {unread > 0 && (
              <button
                type="button"
                className={cx("flex-none bg-transparent p-0 text-sm font-semibold text-kc-blue-700 hover:text-kc-blue-800 hover:underline dark:text-kc-blue-300 dark:hover:text-kc-blue-200")}
                onClick={markAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          {mine.length ? (
            <ul className={cx("notification-list m-0 flex-1 list-none overflow-y-auto p-1")}>
              {mine.map((item) => {
                const Icon = notificationIcons[item.category];
                const isUnread = !item.readBy.includes(role);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cx(
                        "notification-item flex w-full items-start gap-2.5 rounded-xl p-3 text-left",
                        isUnread
                          ? "notification-item--unread bg-kc-blue-50 hover:bg-kc-blue-100 dark:bg-kc-blue-950 dark:hover:bg-kc-blue-900"
                          : "bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800",
                      )}
                      onClick={() => openNotification(item)}
                    >
                      <span className={cx("notification-item__icon grid size-8 flex-none place-items-center rounded-lg bg-white text-kc-blue-700 dark:bg-slate-900 dark:text-kc-blue-300")}><Icon size={17} /></span>
                      <span className={cx("notification-item__copy grid min-w-0 gap-0.5")}>
                        <strong className={cx("text-sm leading-tight text-slate-900 dark:text-slate-100")}>{item.title}</strong>
                        <small className={cx("text-xs leading-snug text-slate-600 dark:text-slate-400")}>{item.body}</small>
                        <time className={cx("text-xs text-slate-500 dark:text-slate-400")} dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
                      </span>
                      {isUnread && <span className={cx("notification-item__dot size-2 flex-none self-center rounded-full bg-kc-blue-600 dark:bg-kc-blue-600")} aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={cx("notification-empty px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400")}>No notifications yet. Activity relevant to your role will appear here.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ compact = false, menuPlacement = "down", collapsed = false }: { compact?: boolean; menuPlacement?: "down" | "up"; collapsed?: boolean }) {
  const { role, profile, startTour } = useGuidedSetup();
  const { user, demoEnabled, signOut } = useAuth();
  const { preference, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  /* "up" placement is only used from the sidebar footer, so it also selects the nav-tinted
     trigger treatment that used to come from the `.sidebar-footer &` descendant rule. */
  const inSidebar = menuPlacement === "up";

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
    <div className={cx("profile-menu-wrap relative", inSidebar && "min-w-0 flex-1")} ref={wrapRef}>
      <button
        className={cx(
          "profile-button flex items-center rounded-xl bg-transparent text-left",
          compact ? "profile-button--compact min-h-0 gap-0 p-0" : collapsed ? "min-h-12 justify-center gap-0 p-1" : "min-h-12 gap-2 py-1 pr-2 pl-1",
          inSidebar
            ? "w-full text-slate-600 hover:bg-kc-blue-700/7 dark:text-white/70 dark:hover:bg-white/7"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
        )}
        aria-label="Open profile menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cx("avatar inline-grid size-9 flex-none place-items-center rounded-full border border-kc-blue-200 bg-kc-blue-50 text-xs font-bold text-kc-blue-800 md:size-10 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")}>{profile.initials}</span>
        <span className={cx("profile-button__copy grid", (compact || collapsed) && "hidden")}>
          <strong className={cx("text-sm", inSidebar ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200")}>{profile.name}</strong>
          <small className={cx("text-xs", inSidebar ? "text-slate-500 dark:text-white/65" : "text-slate-500 dark:text-slate-400")}>{profile.label}</small>
        </span>
        <ChevronDown
          className={cx(
            "profile-button__chevron transition-transform duration-150 ease-out",
            (compact || collapsed) && "hidden",
            open && "profile-button__chevron--open rotate-180",
          )}
          size={16}
        />
      </button>

      {open && (
        <div
          id={menuId}
          className={cx(
            "profile-menu absolute z-180 overflow-hidden rounded-2xl border bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100",
            menuPlacement === "up" ? "profile-menu--up bottom-full left-0 mb-2.5" : "top-full right-0 mt-2.5",
          )}
          style={{
            width: "min(330px, calc(100vw - 1.5rem))",
            borderColor: "var(--border-translucent)",
            boxShadow: "var(--shadow-3)",
            animation: `${menuPlacement === "up" ? "profile-menu-in-up" : "profile-menu-in"} 160ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
          role="dialog"
          aria-label="Profile and appearance"
        >
          <div className={cx("profile-menu__identity flex items-center gap-3 border-b border-slate-200 bg-linear-135 from-kc-blue-50 to-transparent p-4 dark:border-slate-700 dark:from-kc-blue-950 dark:to-transparent")}>
            <span className={cx("avatar inline-grid size-9 flex-none place-items-center rounded-full border border-kc-blue-200 bg-kc-blue-50 text-xs font-bold text-kc-blue-800 md:size-10 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")}>{profile.initials}</span>
            <div className={cx("grid min-w-0")}>
              <strong className={cx("text-base text-slate-900 dark:text-slate-100")}>{profile.name}</strong>
              <span className={cx("text-xs text-slate-500 dark:text-slate-400")}>{profile.label}</span>
            </div>
          </div>
          <div className={cx("profile-menu__section grid gap-3 p-4")}>
            <div className={cx("profile-menu__section-heading flex items-baseline justify-between gap-3")}>
              <span className={cx("text-sm font-bold text-slate-800 dark:text-slate-200")}>Appearance</span>
              <small className={cx("text-xs text-slate-500 capitalize dark:text-slate-400")}>{preference === "system" ? `${resolvedTheme} from system` : `${preference} selected`}</small>
            </div>
            <ThemeSelector compact />
          </div>
          {demoEnabled && (
            <div className={cx("profile-menu__section profile-role-section grid gap-2.5 p-4")}>
              <button className={cx("profile-setup-action flex min-h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-left text-sm font-semibold text-kc-blue-700 hover:bg-kc-blue-50 hover:text-kc-blue-800 dark:border-slate-700 dark:bg-slate-900 dark:text-kc-blue-300 dark:hover:bg-kc-blue-950 dark:hover:text-kc-blue-200")} onClick={() => { startTour(role, true); setOpen(false); }}>
                <PlayCircle size={17} />
                <span>Replay guided setup</span>
              </button>
            </div>
          )}
          <div className={cx("profile-menu__section profile-menu__session grid gap-3 p-4")}>
            <Link
              className={cx("flex min-h-10 w-full items-center gap-2 rounded-lg bg-transparent px-2.5 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-kc-blue-50 hover:text-kc-blue-800 dark:text-slate-300 dark:hover:bg-kc-blue-950 dark:hover:text-kc-blue-200")}
              to={appPaths.settings}
              onClick={() => setOpen(false)}
            >
              <Settings size={17} /><span>Open settings</span>
            </Link>
            <button
              className={cx("flex min-h-10 w-full items-center gap-2 rounded-lg bg-transparent px-2.5 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-kc-blue-50 hover:text-kc-blue-800 dark:text-slate-300 dark:hover:bg-kc-blue-950 dark:hover:text-kc-blue-200")}
              type="button"
              onClick={() => { setOpen(false); setChangePasswordOpen(true); }}
            >
              <KeyRound size={17} /><span>Change password</span>
            </button>
            <Link
              className={cx("flex min-h-10 w-full items-center gap-2 rounded-lg bg-transparent px-2.5 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-kc-blue-50 hover:text-kc-blue-800 dark:text-slate-300 dark:hover:bg-kc-blue-950 dark:hover:text-kc-blue-200")}
              to={appPaths.settingsSupport}
              onClick={() => setOpen(false)}
            >
              <CircleHelp size={17} /><span>Help and support</span>
            </Link>
            <button
              className={cx("flex min-h-10 w-full items-center gap-2 rounded-lg bg-transparent px-2.5 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-950 dark:hover:text-red-300")}
              type="button"
              onClick={() => { signOut(); setOpen(false); navigate(appPaths.login, { replace: true }); }}
            >
              <LogOut size={17} />
              <span>Sign out {user?.name ? `as ${user.name}` : ""}</span>
            </button>
          </div>
        </div>
      )}
      {changePasswordOpen && <ChangePasswordDialog onClose={() => setChangePasswordOpen(false)} />}
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
  const ScopeIcon = role === "site-contributor" ? Building2 : ShieldCheck;

  useEffect(() => {
    window.localStorage.setItem("ehss-navigation-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div
      className={cx("app-shell block min-h-screen transition-all duration-300 ease-out shell:grid", collapsed && "app-shell--collapsed")}
      /* The rail width is the one grid track that has to animate, and Tailwind has no on-scale
         utility for a fixed first column. Below shell: the shell is display:block, so the
         declaration is inert there. */
      style={{ gridTemplateColumns: collapsed ? "80px minmax(0, 1fr)" : "268px minmax(0, 1fr)" }}
    >
      <a className={cx("skip-link fixed -top-16 left-4 z-1000 rounded-md bg-slate-900 px-4 py-3 font-semibold text-white transition-all duration-150 ease-out focus:top-4 dark:bg-slate-100 dark:text-slate-900")} href="#main-content">Skip to main content</a>
      {!dataSourceStatus.connected && dataSourceStatus.message && <div role="status" style={{ position: "fixed", right: 12, bottom: 54, zIndex: 9999, maxWidth: 300, padding: "9px 11px", borderRadius: 8, background: "#fff3cd", color: "#664d03", fontSize: 12, boxShadow: "0 4px 16px rgb(0 0 0 / 0.15)" }}>{dataSourceStatus.message}</div>}

      <aside
        className={cx("desktop-sidebar group/sidebar sticky top-0 z-20 hidden h-screen flex-col overflow-visible border-r border-kc-blue-700/15 text-slate-900 shell:col-start-1 shell:row-start-1 shell:flex dark:border-white/10 dark:text-white")}
        style={{ background: "var(--nav-background)", willChange: "width" }}
      >
        <BrandLockup collapsed={collapsed} onToggle={() => setCollapsed(false)} />
        <div
          className={cx(
            "site-context sidebar-context group/context relative min-w-0 items-center rounded-md border border-kc-blue-700/15 bg-white/5 text-slate-600 transition-all duration-300 ease-out dark:border-white/10 dark:text-white/70",
            collapsed ? "mx-2.5 mt-3.5 mb-1 grid place-items-center gap-2.5 p-2" : "mx-4.5 mt-3.5 mb-1 flex flex-wrap gap-2.5 px-3.5 py-3",
          )}
          aria-label={role === "site-contributor" ? `Current assigned site: ${assignedSite.name} · ${assignedSite.code}` : `Current authorized scope: ${profile.scope}`}
          data-tour="site-context"
        >
          <ScopeIcon className={cx("text-kc-blue-700 dark:text-kc-blue-300")} size={17} />
          <div className={cx("grid", collapsed && "hidden")}>
            <span className={cx("text-xs leading-none text-slate-500 dark:text-white/65")}>{role === "site-contributor" ? "Assigned site" : "Authorized scope"}</span>
            <strong className={cx("overflow-hidden text-sm leading-snug text-ellipsis whitespace-nowrap text-slate-900 dark:text-white")}>{role === "site-contributor" ? assignedSite.name : profile.scope}</strong>
          </div>
          {role === "site-contributor" && <span className={cx("site-context__code w-full text-xs font-semibold whitespace-nowrap text-slate-500 dark:text-white/65", collapsed && "hidden")}>{assignedSite.code}</span>}
          <span
            className={cx(
              navTooltipBase,
              collapsed
                ? "group-hover/context:visible group-hover/context:translate-x-0 group-hover/context:opacity-100 group-hover/context:delay-200 group-focus-within/context:visible group-focus-within/context:translate-x-0 group-focus-within/context:opacity-100 group-focus-within/context:delay-200"
                : "hidden",
            )}
            role="tooltip"
            aria-hidden="true"
          >
            {role === "site-contributor" ? `${assignedSite.name} · ${assignedSite.code}` : profile.scope}
          </span>
        </div>
        <SideNav collapsed={collapsed} role={role} />
        <div className={cx("sidebar-footer mt-auto flex min-w-0 items-center gap-1.5 border-t border-kc-blue-700/10 px-4.5 py-3.5 dark:border-white/10", collapsed && "flex-col")}>
          <NotificationMenu menuPlacement="up" />
          <ProfileMenu menuPlacement="up" collapsed={collapsed} />
        </div>
        {!collapsed && <button
          className={cx("collapse-control group/collapse absolute top-14 -right-4 z-35 grid size-8 place-items-center rounded-full border border-slate-200 bg-white text-kc-blue-800 shadow-lg shadow-slate-900/20 transition-all duration-150 ease-out hover:-translate-y-px hover:text-kc-blue-600 hover:shadow-xl active:translate-y-0 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-kc-blue-200 dark:hover:text-kc-blue-400")}
          onClick={() => setCollapsed(true)}
          aria-label="Collapse navigation"
          aria-describedby={collapseTooltipId}
          aria-expanded="true"
        >
          <PanelLeftClose size={19} aria-hidden="true" />
          <span
            id={collapseTooltipId}
            className={cx(
              "app-tooltip app-tooltip--right pointer-events-none invisible absolute top-1/2 left-full z-320 ml-3 w-max max-w-58 -translate-y-1/2 translate-x-1 rounded-lg border border-kc-blue-300/25 bg-linear-145 from-kc-blue-900 to-kc-blue-950 px-2.5 py-2 font-sans text-xs leading-tight font-semibold whitespace-normal text-white opacity-0 shadow-2xl shadow-slate-950/25 transition-all duration-150 ease-out inset-shadow-2xs inset-shadow-white/10 after:absolute after:top-1/2 after:-left-1.5 after:-mt-1 after:size-2 after:rotate-45 after:border after:border-t-0 after:border-r-0 after:border-kc-blue-300/20 after:bg-kc-blue-950 group-hover/collapse:visible group-hover/collapse:translate-x-0 group-hover/collapse:opacity-100 group-hover/collapse:delay-200 group-focus-visible/collapse:visible group-focus-visible/collapse:translate-x-0 group-focus-visible/collapse:opacity-100 group-focus-visible/collapse:delay-200 pointer-coarse:hidden dark:border-kc-blue-300/25 dark:from-kc-blue-900 dark:to-kc-blue-950 dark:text-white dark:after:border-kc-blue-300/20 dark:after:bg-kc-blue-950",
              "group-has-[.nav-item:hover]/sidebar:invisible group-has-[.nav-item:hover]/sidebar:opacity-0 group-has-[.nav-item:hover]/sidebar:delay-0",
            )}
            role="tooltip"
          >
            Collapse navigation
          </span>
        </button>}
      </aside>

      {mobileOpen && (
        <div className={cx("mobile-nav-layer fixed inset-0 z-120 block shell:hidden")}>
          <button className={cx("mobile-nav-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-xs dark:bg-slate-950/50")} aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside
            id="mobile-navigation-drawer"
            className={cx("mobile-sidebar absolute inset-y-0 left-0 overflow-x-hidden overflow-y-auto text-slate-900 dark:text-white")}
            style={{
              ...navScrollbarStyle,
              width: "min(340px, calc(100% - 2rem))",
              background: "var(--nav-background)",
              boxShadow: "var(--shadow-3)",
              animation: "nav-in 180ms ease-out",
            }}
            aria-label="Mobile navigation"
          >
            <div className={cx("mobile-sidebar__header flex items-center justify-between border-b border-kc-blue-700/15 dark:border-white/10")}>
              <BrandLockup />
              <IconButton label="Close navigation" onClick={() => setMobileOpen(false)}>
                <X size={20} />
              </IconButton>
            </div>
            <SideNav collapsed={false} role={role} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div
        className={cx("mobile-shell-strip sticky top-0 z-15 flex items-center justify-between gap-1.5 border-b px-2.5 shadow-xs backdrop-blur-lg backdrop-saturate-150 md:gap-3 md:px-4 shell:hidden")}
        style={{ height: "var(--topbar)", borderColor: "var(--border-translucent)", background: "var(--surface-topbar)" }}
      >
        <div className={cx("mobile-shell-strip__badge flex min-w-0 items-center gap-1.5 overflow-hidden text-sm font-semibold whitespace-nowrap text-slate-700 dark:text-slate-300")} aria-label={role === "site-contributor" ? "Current assigned site" : "Current authorized scope"} data-tour="site-context">
          <ScopeIcon className={cx("flex-none text-kc-blue-700 dark:text-kc-blue-300")} size={16} />
          <span className={cx("overflow-hidden text-ellipsis")}>{role === "site-contributor" ? assignedSite.code : profile.scope}</span>
        </div>
        <div className={cx("mobile-shell-strip__actions flex flex-none items-center gap-1")}>
          <NotificationMenu />
            <IconButton label="Help and guided setup" onClick={openHelp} data-tour="help">
            <CircleHelp size={18} />
          </IconButton>
          <ProfileMenu compact />
        </div>
      </div>

      {/* The bottom tab bar overlaps the content on mobile, so the column reserves its height plus
          the iOS home-indicator inset — env() has no on-scale utility equivalent. */}
      <main id="main-content" className={cx("main-content min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] shell:col-start-2 shell:row-start-1 shell:pb-0")}>
        {children}
      </main>

      <nav
        className={cx("bottom-tab-bar fixed right-0 bottom-0 left-0 z-90 grid w-full translate-x-0 gap-0 rounded-t-3xl border-t px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] shadow-2xl shadow-slate-900/20 backdrop-blur-xl backdrop-saturate-150 md:right-1/2 md:bottom-[calc(0.625rem+env(safe-area-inset-bottom))] md:left-auto md:w-180 md:max-w-full md:translate-x-1/2 md:gap-1 md:rounded-3xl md:border md:p-1.5 shell:hidden")}
        aria-label="Primary tabs"
        style={{
          gridTemplateColumns: `repeat(${availableBottomTabs.length + 1}, minmax(0, 1fr))`,
          borderColor: "var(--border-translucent)",
          background: "var(--surface-translucent)",
        }}
      >
        {availableBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.matches.some((path) => location.pathname === path || location.pathname.startsWith(path.endsWith("/") ? path : `${path}/`));
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cx(
                "bottom-tab-item relative grid min-h-14 min-w-0 place-items-center content-center gap-0.5 rounded-2xl px-0.5 text-xs leading-none font-semibold transition-all duration-150 ease-out active:scale-95 md:px-0",
                active
                  ? "bottom-tab-item--active bg-kc-blue-50 text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200"
                  : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
              )}
              aria-current={active ? "page" : undefined}
              data-tour={`tab-${tab.to.split("/").filter(Boolean).join("-")}`}
            >
              <span
                className={cx(
                  "bottom-tab-item__icon grid h-7 w-8 place-items-center rounded-lg transition-all duration-150 ease-out",
                  active && "-translate-y-px bg-white text-kc-blue-700 dark:bg-slate-900 dark:text-kc-blue-300",
                )}
                style={active ? { boxShadow: "var(--shadow-1)" } : undefined}
              >
                <Icon size={21} />
              </span>
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
        <button
          className={cx(
            "bottom-tab-item relative grid min-h-14 min-w-0 place-items-center content-center gap-0.5 rounded-2xl px-0.5 text-xs leading-none font-semibold transition-all duration-150 ease-out active:scale-95 md:px-0",
            moreTabActive
              ? "bottom-tab-item--active bg-kc-blue-50 text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200"
              : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
          )}
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open more navigation"
          aria-controls="mobile-navigation-drawer"
          aria-expanded={mobileOpen}
        >
          <span
            className={cx(
              "bottom-tab-item__icon grid h-7 w-8 place-items-center rounded-lg transition-all duration-150 ease-out",
              moreTabActive && "-translate-y-px bg-white text-kc-blue-700 dark:bg-slate-900 dark:text-kc-blue-300",
            )}
            style={moreTabActive ? { boxShadow: "var(--shadow-1)" } : undefined}
          >
            <MoreHorizontal size={22} />
          </span>
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
