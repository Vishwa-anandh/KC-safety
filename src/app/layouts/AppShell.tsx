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
    <nav className="side-nav" aria-label="Primary navigation">
      {navigation.filter((group) => group.roles.includes(role)).map((group) => (
        <div className="nav-group" key={group.label}>
          <p className="nav-group__label" aria-hidden={collapsed}>{group.label}</p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const tooltipId = `nav-tooltip-${item.to.replaceAll("/", "-").replace(/^-/, "")}`;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) => cx("nav-item", isActive && "nav-item--active")}
                aria-label={collapsed ? item.label : undefined}
                aria-describedby={collapsed ? tooltipId : undefined}
                data-tour={`nav-${item.to.split("/").filter(Boolean).join("-")}`}
              >
                <span className="nav-item__icon"><Icon size={19} /></span>
                <span className="nav-item__label" aria-hidden={collapsed}>{item.label}</span>
                <ChevronRight className="nav-item__chevron" size={15} aria-hidden="true" />
                <span id={tooltipId} className="nav-item__tooltip" role="tooltip">{item.label}</span>
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
    <div className="notification-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="notification-button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={19} />
        {unread > 0 && <span className="notification-badge" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div id={menuId} className={cx("notification-panel", menuPlacement === "up" && "notification-panel--up")} role="dialog" aria-label="Notifications">
          <div className="notification-panel__header">
            <div>
              <p className="eyebrow">Notifications</p>
              <strong>{unread ? `${unread} unread` : "All caught up"}</strong>
            </div>
            {unread > 0 && <button type="button" onClick={markAllRead}>Mark all as read</button>}
          </div>
          {mine.length ? (
            <ul className="notification-list">
              {mine.map((item) => {
                const Icon = notificationIcons[item.category];
                const isUnread = !item.readBy.includes(role);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cx("notification-item", isUnread && "notification-item--unread")}
                      onClick={() => openNotification(item)}
                    >
                      <span className="notification-item__icon"><Icon size={17} /></span>
                      <span className="notification-item__copy">
                        <strong>{item.title}</strong>
                        <small>{item.body}</small>
                        <time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
                      </span>
                      {isUnread && <span className="notification-item__dot" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="notification-empty">No notifications yet. Activity relevant to your role will appear here.</p>
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
    <div className="profile-menu-wrap" ref={wrapRef}>
      <button
        className={cx("profile-button", compact && "profile-button--compact")}
        aria-label="Open profile menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="avatar">{profile.initials}</span>
        <span className="profile-button__copy">
          <strong>{profile.name}</strong>
          <small>{profile.label}</small>
        </span>
        <ChevronDown className={cx("profile-button__chevron", open && "profile-button__chevron--open")} size={16} />
      </button>

      {open && (
        <div id={menuId} className={cx("profile-menu", menuPlacement === "up" && "profile-menu--up")} role="dialog" aria-label="Profile and appearance">
          <div className="profile-menu__identity">
            <span className="avatar">{profile.initials}</span>
            <div>
              <strong>{profile.name}</strong>
              <span>{profile.label}</span>
            </div>
          </div>
          <div className="profile-menu__section">
            <div className="profile-menu__section-heading">
              <span>Appearance</span>
              <small>{preference === "system" ? `${resolvedTheme} from system` : `${preference} selected`}</small>
            </div>
            <ThemeSelector compact />
          </div>
          {demoEnabled && (
            <div className="profile-menu__section profile-role-section">
              <button className="profile-setup-action" onClick={() => { startTour(role, true); setOpen(false); }}>
                <PlayCircle size={17} />
                <span>Replay guided setup</span>
              </button>
            </div>
          )}
          <div className="profile-menu__section profile-menu__session">
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
    <div className={cx("app-shell", collapsed && "app-shell--collapsed")}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {!dataSourceStatus.connected && dataSourceStatus.message && <div role="status" style={{ position: "fixed", right: 12, bottom: 54, zIndex: 9999, maxWidth: 300, padding: "9px 11px", borderRadius: 8, background: "#fff3cd", color: "#664d03", fontSize: 12, boxShadow: "0 4px 16px rgb(0 0 0 / 0.15)" }}>{dataSourceStatus.message}</div>}

      <aside className="desktop-sidebar">
        <div className="brand-lockup">
          <KcLogo />
          <div aria-hidden={collapsed}>
            <strong>Maitsys Assure</strong>
            <span>Self-Assessment</span>
          </div>
        </div>
        <div
          className="site-context sidebar-context"
          aria-label={role === "site-contributor" ? `Current assigned site: ${assignedSite.name} · ${assignedSite.code}` : `Current authorized scope: ${profile.scope}`}
          data-tour="site-context"
        >
          <ScopeIcon size={17} />
          <div>
            <span>{role === "site-contributor" ? "Assigned site" : "Authorized scope"}</span>
            <strong>{role === "site-contributor" ? assignedSite.name : profile.scope}</strong>
          </div>
          {role === "site-contributor" && <span className="site-context__code">{assignedSite.code}</span>}
          <span className="nav-item__tooltip" role="tooltip" aria-hidden="true">
            {role === "site-contributor" ? `${assignedSite.name} · ${assignedSite.code}` : profile.scope}
          </span>
        </div>
        <SideNav collapsed={collapsed} role={role} />
        <div className="sidebar-footer">
          <NotificationMenu menuPlacement="up" />
          <ProfileMenu menuPlacement="up" />
        </div>
        <button
          className="collapse-control"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-describedby={collapseTooltipId}
          aria-expanded={!collapsed}
        >
          <span className="collapse-control__icons" aria-hidden="true">
            <PanelLeftClose className="collapse-control__icon collapse-control__icon--close" size={19} />
            <PanelLeftOpen className="collapse-control__icon collapse-control__icon--open" size={19} />
          </span>
          <span id={collapseTooltipId} className="app-tooltip app-tooltip--right" role="tooltip">
            {collapsed ? "Expand navigation" : "Collapse navigation"}
          </span>
        </button>
      </aside>

      {mobileOpen && (
        <div className="mobile-nav-layer">
          <button className="mobile-nav-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside id="mobile-navigation-drawer" className="mobile-sidebar" aria-label="Mobile navigation">
            <div className="mobile-sidebar__header">
              <div className="brand-lockup">
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

      <div className="mobile-shell-strip">
        <div className="mobile-shell-strip__badge" aria-label={role === "site-contributor" ? "Current assigned site" : "Current authorized scope"} data-tour="site-context">
          <ScopeIcon size={16} />
          <span>{role === "site-contributor" ? assignedSite.code : profile.scope}</span>
        </div>
        <div className="mobile-shell-strip__actions">
          <NotificationMenu />
            <IconButton label="Help and guided setup" onClick={openHelp} data-tour="help">
            <CircleHelp size={18} />
          </IconButton>
          <ProfileMenu compact />
        </div>
      </div>

      <main id="main-content" className="main-content">
        {children}
      </main>

      <nav className="bottom-tab-bar" aria-label="Primary tabs" style={{ "--bottom-tab-count": availableBottomTabs.length + 1 } as CSSProperties}>
        {availableBottomTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.matches.some((path) => location.pathname === path || location.pathname.startsWith(path.endsWith("/") ? path : `${path}/`));
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={cx("bottom-tab-item", active && "bottom-tab-item--active")}
              aria-current={active ? "page" : undefined}
              data-tour={`tab-${tab.to.split("/").filter(Boolean).join("-")}`}
            >
              <span className="bottom-tab-item__icon"><Icon size={21} /></span>
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
        <button
          className={cx("bottom-tab-item", moreTabActive && "bottom-tab-item--active")}
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open more navigation"
          aria-controls="mobile-navigation-drawer"
          aria-expanded={mobileOpen}
        >
          <span className="bottom-tab-item__icon"><MoreHorizontal size={22} /></span>
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
