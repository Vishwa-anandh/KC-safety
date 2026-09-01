import {
  Accessibility,
  Bell,
  BookOpen,
  Check,
  CircleHelp,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  Mail,
  MonitorSmartphone,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { NavLink, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth";
import { useGuidedSetup, type UserRole } from "../../onboarding";
import { AccentSelector, ThemeSelector, useTheme } from "../model/ThemeProvider";
import { Button, ConfirmDialog, IconButton, InlineMessage, PageHeader, ProgressBar } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";
import { appPaths } from "../../../app/router/route-manifest";
import { settingsRoute } from "../../../app/router/links";

type SettingsSectionId = "account" | "appearance" | "notifications" | "security" | "guidance" | "support";

interface NotificationPreferences {
  assessmentReminders: boolean;
  correctiveActionAlerts: boolean;
  assignmentChanges: boolean;
  summaryEnabled: boolean;
  productGuidance: boolean;
  summaryFrequency: "daily" | "weekly";
}

const NOTIFICATIONS_KEY = "ehss-notification-preferences-v1";

const defaultNotifications: NotificationPreferences = {
  assessmentReminders: true,
  correctiveActionAlerts: true,
  assignmentChanges: true,
  summaryEnabled: true,
  productGuidance: false,
  summaryFrequency: "weekly",
};

const sections: Array<{ id: SettingsSectionId; label: string; description: string; icon: LucideIcon; keywords: string }> = [
  { id: "account", label: "Account and access", description: "Profile, role, and scope", icon: UserRound, keywords: "profile email identity role permission site authorized scope" },
  { id: "appearance", label: "Appearance", description: "Theme and display", icon: Accessibility, keywords: "theme system light dark appearance display accessibility contrast" },
  { id: "notifications", label: "Notifications", description: "Alerts and summaries", icon: Bell, keywords: "email alert reminder corrective action assignment summary digest" },
  { id: "security", label: "Security", description: "Passkeys and session", icon: ShieldCheck, keywords: "passkey password device browser session sign out security" },
  { id: "guidance", label: "Guided setup", description: "Progress and learning", icon: PlayCircle, keywords: "tour onboarding progress replay reset walkthrough" },
  { id: "support", label: "Help and support", description: "Resources and assistance", icon: CircleHelp, keywords: "help support contact documentation privacy demo" },
];

const roleCapabilities: Record<UserRole, string[]> = {
  "site-contributor": ["Edit the assigned site assessment", "Maintain site contacts and program owners", "Complete corrective-action information and evidence"],
  "enterprise-viewer": ["Review authorized enterprise sites", "Open read-only site drill-downs", "Export the current filtered dashboard view"],
  administrator: ["Review enterprise performance", "Run governed workbook imports", "Create, audit, and publish master requirements"],
};

function readNotificationPreferences(): NotificationPreferences {
  try {
    return { ...defaultNotifications, ...JSON.parse(window.localStorage.getItem(NOTIFICATIONS_KEY) ?? "{}") };
  } catch {
    return defaultNotifications;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function deviceDescription() {
  const agent = window.navigator.userAgent;
  const browser = agent.includes("Edg/") ? "Microsoft Edge" : agent.includes("Chrome/") ? "Chrome" : agent.includes("Firefox/") ? "Firefox" : agent.includes("Safari/") ? "Safari" : "Current browser";
  const platform = agent.includes("Windows") ? "Windows" : agent.includes("Macintosh") ? "macOS" : agent.includes("Android") ? "Android" : agent.includes("iPhone") || agent.includes("iPad") ? "iOS or iPadOS" : "this device";
  return `${browser} on ${platform}`;
}

function SettingToggle({ checked, label, description, onChange }: { checked: boolean; label: string; description: string; onChange: (checked: boolean) => void }) {
  return (
    <div className={cx("preference-row [display:flex] [min-height:68px] [align-items:center] [justify-content:space-between] [gap:1rem] [background:var(--surface-panel)] [padding:0.75rem_0.85rem] [.preference-row_+_&]:[border-top:1px_solid_var(--neutral-200)] [&_>_div]:[display:grid] [&_>_div]:[min-width:0] [&_strong]:[font-size:0.76rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.67rem] [&_span]:[line-height:1.4] max-[620px]:[min-height:64px] max-[620px]:[padding:0.68rem]")}>
      <div><strong>{label}</strong><span>{description}</span></div>
      <button type="button" className={cx("switch-control [position:relative] [width:46px] [height:28px] [flex:0_0_46px] [border:1px_solid_var(--neutral-300)] [border-radius:999px] [background:var(--neutral-200)] [padding:2px] [transition:border-color_160ms_ease,_background_160ms_ease] [&_>_span]:[display:block] [&_>_span]:[width:22px] [&_>_span]:[height:22px] [&_>_span]:[border-radius:50%] [&_>_span]:[background:white] [&_>_span]:[box-shadow:0_2px_6px_rgb(15_23_42_/_0.22)] [&_>_span]:[transform:translateX(0)] [&_>_span]:[transition:transform_180ms_cubic-bezier(0.22,_1,_0.36,_1)]", checked && "switch-control--checked [border-color:var(--success-solid)] [background:var(--success-solid)] [&_>_span]:[transform:translateX(17px)]")} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>
    </div>
  );
}

/**
 * Layout for every /settings/* route: the sticky index (search + section nav + account footer)
 * plus whichever section is active, rendered via <Outlet/>. Each section is its own routed page
 * with its own PageHeader — this aside is navigation, not a table of contents into one long page.
 */
export function SettingsLayout() {
  const { user } = useAuth();
  const { profile } = useGuidedSetup();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleSections = sections.filter((section) => !normalizedQuery || `${section.label} ${section.description} ${section.keywords}`.toLowerCase().includes(normalizedQuery));

  return (
    <div className={cx("page-container [width:100%] [padding:clamp(1.5rem,_2.4vw,_2.35rem)_var(--page-gutter)_4rem] max-[740px]:[padding-top:1.25rem] max-[740px]:[padding-bottom:3.5rem] settings-workspace")}>
      <div className={cx("settings-shell [display:grid] [min-width:0] [grid-template-columns:260px_minmax(0,_1fr)] [align-items:start] [gap:1rem] max-[900px]:[grid-template-columns:1fr] max-[620px]:[gap:0.7rem]")}>
        <aside className={cx("settings-index [position:sticky] [top:calc(var(--content-offset)_+_1rem)] [display:grid] [max-height:calc(100vh_-_var(--content-offset)_-_2rem)] [gap:0.7rem] [overflow:hidden_auto] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-xl)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)] [padding:0.7rem] [&_nav]:[display:grid] [&_nav]:[gap:0.18rem] [&_nav_>_a]:[display:flex] [&_nav_>_a]:[min-width:0] [&_nav_>_a]:[min-height:54px] [&_nav_>_a]:[align-items:center] [&_nav_>_a]:[gap:0.6rem] [&_nav_>_a]:[border:1px_solid_transparent] [&_nav_>_a]:[border-radius:11px] [&_nav_>_a]:[background:transparent] [&_nav_>_a]:[color:var(--neutral-600)] [&_nav_>_a]:[padding:0.48rem] [&_nav_>_a]:[text-align:left] [&_nav_>_a]:[transition:border-color_130ms_ease,_background_130ms_ease,_color_130ms_ease,_transform_100ms_ease] [&_nav_>_a:hover]:[background:var(--neutral-50)] [&_nav_>_a:hover]:[color:var(--neutral-900)] [&_nav_>_a:active]:[transform:scale(0.99)] [&_nav_>_a_>_span:first-child]:[display:grid] [&_nav_>_a_>_span:first-child]:[width:34px] [&_nav_>_a_>_span:first-child]:[height:34px] [&_nav_>_a_>_span:first-child]:[flex:0_0_34px] [&_nav_>_a_>_span:first-child]:[place-items:center] [&_nav_>_a_>_span:first-child]:[border-radius:9px] [&_nav_>_a_>_span:first-child]:[background:var(--neutral-50)] [&_nav_>_a_>_span:first-child]:[color:var(--neutral-500)] [&_nav_>_a_>_span:last-child]:[display:grid] [&_nav_>_a_>_span:last-child]:[min-width:0] [&_nav_strong]:[overflow:hidden] [&_nav_strong]:[font-size:0.76rem] [&_nav_strong]:[text-overflow:ellipsis] [&_nav_strong]:[white-space:nowrap] [&_nav_small]:[overflow:hidden] [&_nav_small]:[color:var(--neutral-500)] [&_nav_small]:[font-size:0.64rem] [&_nav_small]:[text-overflow:ellipsis] [&_nav_small]:[white-space:nowrap] max-[900px]:[z-index:15] max-[900px]:[top:calc(var(--content-offset)_+_0.5rem)] max-[900px]:[display:grid] max-[900px]:[max-height:none] max-[900px]:[overflow:visible] max-[900px]:[border-radius:16px] max-[900px]:[&_nav]:[display:flex] max-[900px]:[&_nav]:[flex-wrap:wrap] max-[900px]:[&_nav]:[padding-bottom:0.15rem] max-[900px]:[&_nav_>_a]:[min-height:42px] max-[900px]:[&_nav_>_a]:[flex:0_1_auto] max-[900px]:[&_nav_>_a]:[padding:0.35rem_0.55rem] max-[900px]:[&_nav_>_a_>_span:first-child]:[width:30px] max-[900px]:[&_nav_>_a_>_span:first-child]:[height:30px] max-[900px]:[&_nav_>_a_>_span:first-child]:[flex-basis:30px] max-[900px]:[&_nav_small]:[display:none] max-[620px]:[top:calc(var(--content-offset)_+_0.35rem)] max-[620px]:[border-radius:14px] max-[620px]:[padding:0.55rem] max-[620px]:[&_nav_>_a]:[min-height:40px] max-[620px]:[&_nav_>_a_>_span:first-child]:[display:none] max-[620px]:[&_nav_strong]:[font-size:0.69rem]")} aria-label="Settings navigation">
          <label className={cx("settings-search [position:relative] [display:flex] [min-height:42px] [align-items:center] [gap:0.45rem] [border:1px_solid_var(--neutral-300)] [border-radius:11px] [background:var(--surface-input)] [color:var(--neutral-500)] [padding:0_0.65rem] [&:focus-within]:[border-color:var(--kc-500)] [&:focus-within]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input]:[width:100%] [&_input]:[min-width:0] [&_input]:[border:0] [&_input]:[outline:0] [&_input]:[background:transparent] [&_input]:[color:var(--neutral-900)] [&_input]:[font-size:0.78rem] [&_input::placeholder]:[color:var(--neutral-400)] [&_>_button]:[display:grid] [&_>_button]:[width:28px] [&_>_button]:[height:28px] [&_>_button]:[flex:0_0_28px] [&_>_button]:[place-items:center] [&_>_button]:[border:0] [&_>_button]:[border-radius:8px] [&_>_button]:[background:transparent] [&_>_button]:[color:var(--neutral-500)] [&_>_button:hover]:[background:var(--neutral-100)] [&_>_button:hover]:[color:var(--neutral-800)]")}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search settings" aria-label="Search settings" />{query && <button type="button" aria-label="Clear settings search" onClick={() => setQuery("")}><X size={16} /></button>}</label>
          {visibleSections.length > 0 ? (
            <nav>
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <NavLink key={section.id} to={settingsRoute(section.id)} className={({ isActive }) => cx(isActive && "settings-index__item--active [.settings-index_nav_>_&]:[border-color:var(--kc-200)] [.settings-index_nav_>_&]:[background:var(--kc-50)] [.settings-index_nav_>_&]:[color:var(--kc-800)] [.settings-index_nav_>_&_>_span:first-child]:[background:var(--surface-panel)] [.settings-index_nav_>_&_>_span:first-child]:[color:var(--kc-700)] [.settings-index_nav_>_&_>_span:first-child]:[box-shadow:var(--shadow-1)]")}>
                    <span><Icon size={18} /></span>
                    <span><strong>{section.label}</strong><small>{section.description}</small></span>
                  </NavLink>
                );
              })}
            </nav>
          ) : (
            <div className={cx("settings-index-empty [display:grid] [place-items:center] [gap:0.4rem] [padding:1.75rem_0.75rem] [border:1px_dashed_var(--neutral-300)] [border-radius:var(--radius-lg)] [color:var(--neutral-500)] [text-align:center] [&_svg]:[color:var(--kc-600)] [&_strong]:[color:var(--neutral-800)] [&_strong]:[font-size:0.82rem] [&_p]:[font-size:0.7rem]")}><Search size={22} /><strong>No settings found</strong><p>Try a broader word such as theme, passkey, alert, or setup.</p><Button size="compact" variant="secondary" onClick={() => setQuery("")}>Clear search</Button></div>
          )}
          <div className={cx("settings-index__account [display:flex] [min-width:0] [align-items:center] [gap:0.55rem] [border-top:1px_solid_var(--neutral-200)] [padding:0.7rem_0.35rem_0.1rem] [&_>_div]:[display:grid] [&_>_div]:[min-width:0] [&_strong]:[overflow:hidden] [&_strong]:[text-overflow:ellipsis] [&_strong]:[white-space:nowrap] [&_span]:[overflow:hidden] [&_span]:[text-overflow:ellipsis] [&_span]:[white-space:nowrap] [&_strong]:[font-size:0.73rem] [&_div_>_span]:[color:var(--neutral-500)] [&_div_>_span]:[font-size:0.62rem] max-[900px]:[display:none]")}><span className={cx("avatar [display:inline-grid] [width:38px] [height:38px] [flex:0_0_38px] [place-items:center] [border:1px_solid_var(--kc-200)] [border-radius:50%] [background:linear-gradient(145deg,_var(--kc-100),_var(--surface-elevated))] [color:var(--kc-800)] [font-size:0.72rem] [font-weight:750] max-[740px]:[width:36px] max-[740px]:[height:36px] max-[740px]:[flex-basis:36px]")}>{user?.initials ?? profile.initials}</span><div><strong>{user?.name ?? profile.name}</strong><span>{user?.roleLabel ?? profile.label}</span></div></div>
        </aside>
        <div className={cx("settings-content [min-width:0] [display:grid] [grid-template-columns:minmax(0,_1fr)] [gap:0.85rem]")}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function AccountSettings() {
  const { user } = useAuth();
  const { profile } = useGuidedSetup();
  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Account and access" description="Your signed-in account controls your role, work scope, and protected permissions." actions={<span className={cx("managed-badge [display:inline-flex] [flex:0_0_auto] [align-items:center] [gap:0.32rem] [border-radius:999px] [padding:0.32rem_0.55rem] [font-size:0.64rem] [font-weight:700] [margin-left:auto] [background:var(--neutral-100)] [color:var(--neutral-600)] max-[620px]:[margin-left:0]")}><LockKeyhole size={14} /> Organization managed</span>} />
      <section className={cx("settings-card [display:grid] [min-width:0] [gap:1rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-xl)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)] [padding:1.1rem] max-[620px]:[padding:0.9rem]")}>
        <div className={cx("settings-identity [display:grid] [grid-template-columns:auto_minmax(120px,_0.7fr)_minmax(200px,_1.3fr)] [align-items:center] [gap:0.9rem] [border-radius:14px] [background:var(--neutral-25)] [padding:0.9rem] [&_>_div]:[display:grid] [&_>_div]:[min-width:0] [&_>_div_strong]:[font-size:0.88rem] [&_>_div_a]:[overflow:hidden] [&_>_div_a]:[color:var(--neutral-500)] [&_>_div_a]:[font-size:0.72rem] [&_>_div_a]:[text-overflow:ellipsis] [&_dl]:[display:grid] [&_dl]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [&_dl]:[gap:0.65rem] [&_dl]:[margin:0] [&_dl_>_div]:[display:grid] [&_dl_>_div]:[gap:0.12rem] [&_dl_>_div]:[border-left:1px_solid_var(--neutral-200)] [&_dl_>_div]:[padding-left:0.8rem] [&_dt]:[color:var(--neutral-500)] [&_dt]:[font-size:0.65rem] [&_dd]:[margin:0] [&_dd]:[color:var(--neutral-800)] [&_dd]:[font-size:0.76rem] [&_dd]:[font-weight:650] max-[900px]:[grid-template-columns:auto_1fr] max-[900px]:[&_dl]:[grid-column:1_/_-1] max-[620px]:[grid-template-columns:auto_1fr] max-[620px]:[padding:0.75rem] max-[620px]:[&_dl]:[grid-template-columns:1fr] max-[620px]:[&_dl_>_div]:[border-top:1px_solid_var(--neutral-200)] max-[620px]:[&_dl_>_div]:[border-left:0] max-[620px]:[&_dl_>_div]:[padding-top:0.55rem] max-[620px]:[&_dl_>_div]:[padding-left:0] settings-identity--expanded [grid-template-columns:auto_minmax(120px,_0.65fr)_minmax(200px,_1.35fr)] [border:1px_solid_var(--neutral-200)] max-[900px]:[grid-template-columns:auto_minmax(0,_1fr)] max-[900px]:[&_dl]:[grid-column:1_/_-1] max-[620px]:[grid-template-columns:auto_minmax(0,_1fr)]")}>
          <span className={cx("avatar [display:inline-grid] [width:38px] [height:38px] [flex:0_0_38px] [place-items:center] [border:1px_solid_var(--kc-200)] [border-radius:50%] [background:linear-gradient(145deg,_var(--kc-100),_var(--surface-elevated))] [color:var(--kc-800)] [font-size:0.72rem] [font-weight:750] max-[740px]:[width:36px] max-[740px]:[height:36px] max-[740px]:[flex-basis:36px] avatar--large [width:52px]! [height:52px]! [font-size:0.84rem]")}>{user?.initials ?? profile.initials}</span>
          <div><strong>{user?.name ?? profile.name}</strong><a href={`mailto:${user?.email}`}>{user?.email}</a></div>
          <dl><div><dt>Role</dt><dd>{user?.roleLabel ?? profile.label}</dd></div><div><dt>Authorized scope</dt><dd>{user?.scope ?? profile.scope}</dd></div></dl>
        </div>
        <div className={cx("access-summary [display:grid] [grid-template-columns:minmax(150px,_0.5fr)_minmax(0,_1.5fr)] [align-items:start] [gap:1rem] [border-top:1px_solid_var(--neutral-200)] [padding-top:0.95rem] [&_>_div]:[display:grid] [&_>_div_strong]:[font-size:0.78rem] [&_>_div_span]:[color:var(--neutral-500)] [&_>_div_span]:[font-size:0.66rem] [&_ul]:[display:grid] [&_ul]:[grid-template-columns:repeat(3,_minmax(0,_1fr))] [&_ul]:[gap:0.55rem] [&_ul]:[margin:0] [&_ul]:[padding:0] [&_ul]:[list-style:none] [&_li]:[display:flex] [&_li]:[align-items:flex-start] [&_li]:[gap:0.4rem] [&_li]:[border-radius:10px] [&_li]:[background:var(--neutral-25)] [&_li]:[color:var(--neutral-700)] [&_li]:[padding:0.65rem] [&_li]:[font-size:0.69rem] [&_li]:[line-height:1.4] [&_li_svg]:[flex:0_0_auto] [&_li_svg]:[color:var(--success)] max-[1180px]:[grid-template-columns:1fr] max-[1180px]:[&_ul]:[grid-template-columns:1fr] max-[620px]:[&_li]:[padding:0.6rem]")}><div><strong>What you can do</strong><span>Based on your current role</span></div><ul>{roleCapabilities[profile.id].map((capability) => <li key={capability}><Check size={16} />{capability}</li>)}</ul></div>
      </section>
    </>
  );
}

export function AppearanceSettings() {
  const { preference, resolvedTheme } = useTheme();
  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Appearance" description="Choose how the application looks without changing your work." actions={<small className={cx("settings-page-state [color:var(--neutral-500)] [font-size:0.68rem]")}>{preference === "system" ? `${resolvedTheme} from system` : `${preference} selected`}</small>} />
      <section className={cx("settings-card [display:grid] [min-width:0] [gap:1rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-xl)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)] [padding:1.1rem] max-[620px]:[padding:0.9rem]")}>
        <div className={cx("appearance-setting [display:grid] [gap:0.65rem] [.appearance-setting_+_&]:[border-top:1px_solid_var(--neutral-200)] [.appearance-setting_+_&]:[padding-top:1rem]")}><div className={cx("setting-subheading [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [&_>_div]:[display:grid] [&_strong]:[font-size:0.78rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.66rem] [&_span]:[line-height:1.4] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.66rem] [&_small]:[line-height:1.4] max-[620px]:[flex-direction:column] max-[620px]:[gap:0.3rem]")}><div><strong>Color theme</strong><span>System follows this device and updates automatically.</span></div></div><ThemeSelector /></div>
        <div className={cx("appearance-setting [display:grid] [gap:0.65rem] [.appearance-setting_+_&]:[border-top:1px_solid_var(--neutral-200)] [.appearance-setting_+_&]:[padding-top:1rem]")}><div className={cx("setting-subheading [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [&_>_div]:[display:grid] [&_strong]:[font-size:0.78rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.66rem] [&_span]:[line-height:1.4] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.66rem] [&_small]:[line-height:1.4] max-[620px]:[flex-direction:column] max-[620px]:[gap:0.3rem]")}><div><strong>Accent colour</strong><span>Applies to buttons, links, and highlights in both light and dark themes.</span></div></div><AccentSelector /></div>
        <div className={cx("appearance-preview [position:relative] [display:grid] [min-height:126px] [grid-template-columns:68px_minmax(0,_1fr)] [overflow:hidden] [border:1px_solid_var(--neutral-200)] [border-radius:14px] [background:var(--neutral-25)] [&_>_small]:[position:absolute] [&_>_small]:[right:0.65rem] [&_>_small]:[bottom:0.45rem] [&_>_small]:[color:var(--neutral-500)] [&_>_small]:[font-size:0.58rem] max-[620px]:[min-height:110px] max-[620px]:[grid-template-columns:52px_minmax(0,_1fr)]")} aria-label={`${resolvedTheme} theme preview`}><div className={cx("appearance-preview__rail [display:grid] [align-content:start] [gap:0.45rem] [background:var(--nav-background)] [padding:0.85rem_0.65rem] [&_span]:[height:11px] [&_span]:[border-radius:5px] [&_span]:[background:var(--nav-hover)] [&_span:first-child]:[width:72%] [&_span:first-child]:[background:var(--nav-accent)] [&_span:first-child]:[opacity:0.42]")}><span /><span /><span /></div><div className={cx("appearance-preview__body [display:grid] [grid-template-columns:repeat(2,_minmax(0,_1fr))] [align-content:start] [gap:0.55rem] [padding:0.85rem] [&_>_span]:[height:12px] [&_>_span]:[grid-column:1_/_-1] [&_>_span]:[border-radius:5px] [&_>_span]:[background:var(--neutral-200)] [&_>_div]:[display:grid] [&_>_div]:[gap:0.35rem] [&_>_div]:[border:1px_solid_var(--neutral-200)] [&_>_div]:[border-radius:9px] [&_>_div]:[background:var(--surface-panel)] [&_>_div]:[padding:0.6rem] [&_div_>_span]:[height:8px] [&_div_>_span]:[border-radius:4px] [&_div_>_span]:[background:var(--neutral-200)] [&_div_>_span:first-child]:[width:55%] [&_div_>_span:first-child]:[background:var(--kc-300)]")}><span /><div><span /><span /></div><div><span /><span /></div></div><small>Live {resolvedTheme} preview</small></div>
      </section>
    </>
  );
}

export function NotificationsSettings() {
  const [notifications, setNotifications] = useState<NotificationPreferences>(readNotificationPreferences);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function saveNotifications(next: NotificationPreferences) {
    setNotifications(next);
    window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(next));
    setSavedAt(new Date());
  }

  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Notifications" description="Choose which work changes should reach you and how often summaries are prepared." actions={savedAt && <span className={cx("settings-saved [display:inline-flex] [align-items:center] [gap:0.35rem] [border-radius:999px] [background:var(--success-surface)] [color:var(--success)] [padding:0.38rem_0.6rem] [font-size:0.7rem] [font-weight:700]")} role="status"><Check size={16} /> Preferences saved</span>} />
      <section className={cx("settings-card [display:grid] [min-width:0] [gap:1rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-xl)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)] [padding:1.1rem] max-[620px]:[padding:0.9rem]")}>
        <div className={cx("preference-list [display:grid] [border:1px_solid_var(--neutral-200)] [border-radius:14px] [overflow:hidden]")}>
          <SettingToggle checked={notifications.assessmentReminders} label="Assessment reminders" description="Remind me when assigned assessment work remains incomplete." onChange={(checked) => saveNotifications({ ...notifications, assessmentReminders: checked })} />
          <SettingToggle checked={notifications.correctiveActionAlerts} label="Corrective-action alerts" description="Notify me when required action details change or need attention." onChange={(checked) => saveNotifications({ ...notifications, correctiveActionAlerts: checked })} />
          <SettingToggle checked={notifications.assignmentChanges} label="Owner assignment changes" description="Notify me when Primary or Backup Owner responsibility changes." onChange={(checked) => saveNotifications({ ...notifications, assignmentChanges: checked })} />
          <SettingToggle checked={notifications.summaryEnabled} label="Work summary" description="Prepare a digest of assessment progress, gaps, and assigned actions." onChange={(checked) => saveNotifications({ ...notifications, summaryEnabled: checked })} />
          <SettingToggle checked={notifications.productGuidance} label="Product guidance" description="Show occasional guidance when important workflow capabilities change." onChange={(checked) => saveNotifications({ ...notifications, productGuidance: checked })} />
        </div>
        <label className={cx("frequency-setting [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [border:1px_solid_var(--neutral-200)] [border-radius:12px] [background:var(--neutral-25)] [padding:0.7rem_0.85rem] [&_>_span]:[display:grid] [&_strong]:[font-size:0.75rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.64rem] [&_select]:[min-width:140px] [&_select]:[min-height:40px] [&_select]:[border:1px_solid_var(--neutral-300)] [&_select]:[border-radius:10px] [&_select]:[background:var(--surface-input)] [&_select]:[color:var(--neutral-800)] [&_select]:[padding:0.45rem_0.7rem] [&_select]:[font-size:0.74rem] max-[620px]:[align-items:stretch] max-[620px]:[flex-direction:column] max-[620px]:[&_select]:[width:100%]", !notifications.summaryEnabled && "frequency-setting--disabled [opacity:0.58]")}><span><strong>Summary frequency</strong><small>Applies when Work summary is enabled.</small></span><select value={notifications.summaryFrequency} disabled={!notifications.summaryEnabled} onChange={(event) => saveNotifications({ ...notifications, summaryFrequency: event.target.value as NotificationPreferences["summaryFrequency"] })}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
        <InlineMessage tone="info" title="Delivery connection">Preferences are saved now. Email and enterprise delivery begin when the organization notification service is connected.</InlineMessage>
      </section>
    </>
  );
}

export function SecuritySettings() {
  const { passkeys, user, registerPasskey, renamePasskey, removePasskey, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [passkeyName, setPasskeyName] = useState("This device");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger" | "info"; title: string; detail: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [platformAuthenticator, setPlatformAuthenticator] = useState<boolean | null>(null);
  const passkeyNameRef = useRef<HTMLInputElement>(null);

  const userPasskeys = passkeys.filter((item) => item.userId === user?.id);
  const passkeySupported = window.isSecureContext && "PublicKeyCredential" in window;
  const passkeySetupRequested = searchParams.get("setup") === "passkey";

  useEffect(() => {
    if (!passkeySupported || typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") return;
    let current = true;
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then((available) => { if (current) setPlatformAuthenticator(available); }).catch(() => { if (current) setPlatformAuthenticator(false); });
    return () => { current = false; };
  }, [passkeySupported]);

  useEffect(() => {
    if (!passkeySetupRequested) return;
    const timer = window.setTimeout(() => passkeyNameRef.current?.focus(), 280);
    return () => window.clearTimeout(timer);
  }, [passkeySetupRequested]);

  async function addPasskey(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    try {
      const record = await registerPasskey(passkeyName);
      setMessage({ tone: "success", title: "Passkey added", detail: `${record.name} can now be used to sign in from this browser.` });
      setPasskeyName("This device");
      setSearchParams({}, { replace: true });
    } catch (error) {
      setMessage({ tone: "danger", title: "Passkey not added", detail: error instanceof Error ? error.message : "The passkey request could not be completed." });
    } finally {
      setPending(false);
    }
  }

  function saveRename(id: string) {
    renamePasskey(id, editingName);
    setEditingId(null);
    setEditingName("");
    setMessage({ tone: "success", title: "Passkey renamed", detail: "The new device name has been saved." });
  }

  function confirmRemove() {
    if (!removingId) return;
    removePasskey(removingId);
    setRemovingId(null);
    setMessage({ tone: "success", title: "Passkey removed", detail: "That credential can no longer be selected by this application." });
  }

  function confirmSignOut() {
    signOut();
    navigate(appPaths.login, { replace: true });
  }

  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Security" description="Manage passwordless sign-in and review the device using your current session." actions={<span className={cx(passkeySupported ? "capability [.settings-card__heading_>_&]:[margin-left:auto] [display:inline-flex] [flex:0_0_auto] [align-items:center] [gap:0.3rem] [border-radius:999px] [padding:0.3rem_0.5rem] [font-size:0.65rem] [font-weight:700] max-[620px]:[.settings-card__heading_>_&]:[margin-left:0] capability--ready [background:var(--success-surface)] [color:var(--success)]" : "capability [.settings-card__heading_>_&]:[margin-left:auto] [display:inline-flex] [flex:0_0_auto] [align-items:center] [gap:0.3rem] [border-radius:999px] [padding:0.3rem_0.5rem] [font-size:0.65rem] [font-weight:700] max-[620px]:[.settings-card__heading_>_&]:[margin-left:0] capability--unavailable [background:var(--warning-surface)] [color:var(--warning)]")}><ShieldCheck size={15} />{passkeySupported ? "Secure connection" : "Unavailable"}</span>} />
      <section className={cx("settings-card [display:grid] [min-width:0] [gap:1rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-xl)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)] [padding:1.1rem] max-[620px]:[padding:0.9rem]", passkeySetupRequested && "settings-card--attention [border-color:var(--kc-500)] [box-shadow:0_0_0_3px_var(--kc-100),_var(--shadow-2)] [animation:passkey-attention_900ms_ease-out]")}>
        {passkeySetupRequested && <InlineMessage tone={passkeySupported ? "info" : "warning"} title={passkeySupported ? "Finish setting up your passkey" : "Passkeys are unavailable here"}><div className={cx("passkey-setup-message [display:flex] [align-items:center] [justify-content:space-between] [gap:0.75rem] [&_>_span]:[color:var(--neutral-700)] [&_>_span]:[font-size:0.72rem] [&_>_span]:[line-height:1.5] max-[620px]:[align-items:flex-start] max-[620px]:[flex-direction:column]")}><span>{passkeySupported ? "Name this passkey, choose Add a passkey, and follow your device prompt. If device verification is not configured, the prompt will show other choices or guide you through setup." : "Use a supported browser on a secure connection, or continue signing in with your password."}</span><Button size="compact" variant="tertiary" onClick={() => setSearchParams({}, { replace: true })}>Maybe later</Button></div></InlineMessage>}
        <div className={cx("security-subsection [display:grid] [gap:0.75rem] [.security-subsection_+_&]:[border-top:1px_solid_var(--neutral-200)] [.security-subsection_+_&]:[padding-top:1rem]")}><div className={cx("setting-subheading [display:flex] [align-items:flex-start] [justify-content:space-between] [gap:1rem] [&_>_div]:[display:grid] [&_strong]:[font-size:0.78rem] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.66rem] [&_span]:[line-height:1.4] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.66rem] [&_small]:[line-height:1.4] max-[620px]:[flex-direction:column] max-[620px]:[gap:0.3rem]")}><div><strong>Passkeys</strong><span>Use device unlock, biometrics, a phone, or a security key.</span></div><span className={cx("device-readiness [display:inline-flex] [flex:0_0_auto] [align-items:center] [gap:0.32rem] [border-radius:999px] [padding:0.32rem_0.55rem] [font-size:0.64rem] [font-weight:700] [background:var(--kc-50)] [color:var(--kc-700)]! max-[620px]:[width:fit-content]")}><MonitorSmartphone size={16} />{platformAuthenticator === null ? "Checking this device" : platformAuthenticator ? "Built-in verification available" : "Phone or security key available"}</span></div>
          <div className={cx("passkey-layout [display:grid] [grid-template-columns:minmax(260px,_0.72fr)_minmax(360px,_1.28fr)] [gap:0.9rem] max-[900px]:[grid-template-columns:1fr]")}>
            <form className={cx("passkey-add [display:grid] [align-content:start] [gap:0.65rem] [border:1px_solid_var(--neutral-200)] [border-radius:14px] [background:var(--neutral-25)] [padding:0.85rem] [&_>_small]:[color:var(--neutral-500)] [&_>_small]:[font-size:0.65rem] [&_>_small]:[line-height:1.45]")} onSubmit={addPasskey}>
              <label className={cx("auth-field [display:grid] [gap:0.38rem] [color:var(--neutral-700)] [font-size:0.74rem] [font-weight:650] [&_input]:[width:100%] [&_input]:[min-width:0] [&_input]:[min-height:44px] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:10px] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.78rem] [&_input]:[font-size:0.84rem] [&_input]:[font-weight:450] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input:focus]:[border-color:var(--kc-500)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input::placeholder]:[color:var(--neutral-400)]")}><span>Passkey name</span><input ref={passkeyNameRef} value={passkeyName} onChange={(event) => setPasskeyName(event.target.value)} maxLength={40} placeholder="For example, work laptop" required /></label>
              <Button type="submit" variant="primary" icon={<Plus size={18} />} disabled={pending || !passkeySupported}>{pending ? "Follow your device prompt…" : "Add a passkey"}</Button>
              <small>Your device controls the private credential. Production verification is completed by the organization authentication service.</small>
            </form>
            <div className={cx("passkey-list [display:grid] [align-content:start] [gap:0.5rem]")} aria-label="Registered passkeys">
              {userPasskeys.length === 0 ? <div className={cx("passkey-empty [display:grid] [min-height:154px] [place-items:center] [align-content:center] [gap:0.3rem] [border:1px_dashed_var(--neutral-300)] [border-radius:14px] [color:var(--neutral-500)] [text-align:center] [&_svg]:[color:var(--kc-600)] [&_strong]:[color:var(--neutral-700)] [&_strong]:[font-size:0.78rem] [&_span]:[font-size:0.68rem]")}><KeyRound size={24} /><strong>No passkeys added</strong><span>Add one to enable faster sign-in on this browser.</span></div> : userPasskeys.map((item) => (
                <article className={cx("passkey-item [display:grid] [min-width:0] [grid-template-columns:auto_minmax(0,_1fr)_auto] [align-items:center] [gap:0.65rem] [border:1px_solid_var(--neutral-200)] [border-radius:13px] [background:var(--surface-panel)] [padding:0.7rem] max-[620px]:[grid-template-columns:auto_minmax(0,_1fr)]")} key={item.id}>
                  <span className={cx("passkey-item__icon [display:grid] [width:40px] [height:40px] [place-items:center] [border-radius:11px] [background:var(--kc-50)] [color:var(--kc-700)]")}><KeyRound size={19} /></span>
                  {editingId === item.id ? <div className={cx("passkey-rename [&_input]:[width:100%] [&_input]:[min-width:0] [&_input]:[min-height:38px] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:10px] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.78rem] [&_input]:[font-size:0.84rem] [&_input]:[font-weight:450] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input:focus]:[border-color:var(--kc-500)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [display:flex] [min-width:0] [align-items:center] [gap:0.35rem] max-[620px]:[grid-column:2] max-[620px]:[flex-wrap:wrap]")}><input aria-label="New passkey name" value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={40} autoFocus /><Button size="compact" variant="primary" icon={<Check size={16} />} onClick={() => saveRename(item.id)} disabled={!editingName.trim()}>Save</Button><IconButton label="Cancel rename" onClick={() => setEditingId(null)}><X size={17} /></IconButton></div> : <div className={cx("passkey-item__copy [display:grid] [min-width:0] [&_strong]:[font-size:0.78rem] [&_span]:[overflow:hidden] [&_span]:[color:var(--neutral-500)] [&_span]:[font-size:0.65rem] [&_span]:[text-overflow:ellipsis] [&_span]:[white-space:nowrap]")}><strong>{item.name}</strong><span>Added {formatDate(item.createdAt)}{item.lastUsedAt ? ` · Last used ${formatDate(item.lastUsedAt)}` : ""}</span></div>}
                  {editingId !== item.id && <div className={cx("passkey-item__actions [display:flex] max-[620px]:[grid-column:2] max-[620px]:[justify-self:start]")}><IconButton label={`Rename ${item.name}`} onClick={() => { setEditingId(item.id); setEditingName(item.name); }}><Pencil size={17} /></IconButton><IconButton label={`Remove ${item.name}`} onClick={() => setRemovingId(item.id)}><Trash2 size={17} /></IconButton></div>}
                </article>
              ))}
            </div>
          </div>
          {message && <InlineMessage tone={message.tone} title={message.title}>{message.detail}</InlineMessage>}
        </div>
        <div className={cx("security-subsection [display:grid] [gap:0.75rem] [.security-subsection_+_&]:[border-top:1px_solid_var(--neutral-200)] [.security-subsection_+_&]:[padding-top:1rem] session-panel [grid-template-columns:auto_minmax(0,_1fr)_auto] [align-items:center] [gap:0.75rem] [&_>_div:nth-child(2)]:[display:grid] [&_strong]:[font-size:0.77rem] [&_>_div:nth-child(2)_span]:[color:var(--neutral-500)] [&_>_div:nth-child(2)_span]:[font-size:0.65rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.65rem] [&_small]:[display:flex] [&_small]:[align-items:center] [&_small]:[gap:0.32rem] max-[620px]:[grid-template-columns:auto_minmax(0,_1fr)]")}><div className={cx("session-panel__icon [display:grid] [width:44px] [height:44px] [place-items:center] [border-radius:12px] [background:var(--neutral-100)] [color:var(--neutral-700)]")}><Laptop size={21} /></div><div><strong>Current session</strong><span>{deviceDescription()}</span><small><span className={cx("session-live-dot [width:7px] [height:7px] [border-radius:50%] [background:var(--success-solid)] [box-shadow:0_0_0_3px_var(--success-surface)]")} /> Active now · {window.isSecureContext ? "Secure connection" : "Connection needs attention"}</small></div><Button variant="danger" icon={<LogOut size={18} />} onClick={() => setSignOutOpen(true)}>Sign out</Button></div>
      </section>

      {removingId && <ConfirmDialog eyebrow="Passkey security" title="Remove this passkey?" body="You will no longer be able to select this credential when signing in to this application." confirmLabel="Remove passkey" cancelLabel="Keep passkey" onCancel={() => setRemovingId(null)} onConfirm={confirmRemove} />}
      {signOutOpen && <div className={cx("dialog-layer [position:fixed] [z-index:100] [inset:0] [display:grid] [place-items:center]")}><button className={cx("dialog-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label="Cancel sign out" onClick={() => setSignOutOpen(false)} /><section className={cx("dialog [position:relative] [width:min(560px,_calc(100%_-_2rem))] [max-height:calc(100vh_-_2rem)] [overflow-y:auto] [border:1px_solid_var(--border-glass)] [border-radius:var(--radius-xl)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:dialog-in_180ms_ease-out] dialog--compact [width:min(470px,_calc(100%_-_2rem))]")} role="alertdialog" aria-modal="true" aria-labelledby="settings-signout-title"><div className={cx("dialog__header [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [padding:1rem_1.1rem] [border-bottom:1px_solid_var(--neutral-200)] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.2rem]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Current session</p><h2 id="settings-signout-title">Sign out of this device?</h2></div><IconButton label="Cancel sign out" onClick={() => setSignOutOpen(false)}><X size={20} /></IconButton></div><p className={cx("dialog-context [margin:1rem_1.1rem_0] [border-left:3px_solid_var(--kc-500)] [color:var(--neutral-700)] [padding:0.25rem_0_0.25rem_0.75rem] [font-size:0.82rem]")}>Saved work remains available. You will need your password or passkey to return.</p><div className={cx("dialog__footer [display:flex] [align-items:center] [justify-content:flex-end] [gap:1rem] [padding:1rem_1.1rem] [border-top:1px_solid_var(--neutral-200)] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column-reverse]")}><Button variant="tertiary" onClick={() => setSignOutOpen(false)}>Stay signed in</Button><Button variant="danger" icon={<LogOut size={17} />} onClick={confirmSignOut}>Sign out</Button></div></section></div>}
    </>
  );
}

export function GuidanceSettings() {
  const { profile, completed, skipped, progress, totalSteps, startTour, resetSetup, openHelp } = useGuidedSetup();
  const [resetOpen, setResetOpen] = useState(false);

  function confirmSetupReset() {
    setResetOpen(false);
    resetSetup();
  }

  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Guided setup" description="Review your assigned journey, continue from saved progress, or start again." actions={<span className={cx("setup-state [display:inline-flex] [flex:0_0_auto] [align-items:center] [gap:0.32rem] [border-radius:999px] [padding:0.32rem_0.55rem] [font-size:0.64rem] [font-weight:700] [margin-left:auto] [background:var(--neutral-100)] [color:var(--neutral-600)] max-[620px]:[margin-left:0]", completed && "setup-state--complete [background:var(--success-surface)] [color:var(--success)]", skipped && "setup-state--paused [background:var(--warning-surface)] [color:var(--warning)]")}>{completed ? "Complete" : skipped ? "Paused" : progress > 0 ? "In progress" : "Not started"}</span>} />
      <section className={cx("settings-card [display:grid] [min-width:0] [gap:1rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-xl)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)] [padding:1.1rem] max-[620px]:[padding:0.9rem]")}>
        <div className={cx("setup-progress-card [display:grid] [grid-template-columns:minmax(0,_1fr)_minmax(220px,_0.65fr)] [align-items:center] [gap:1rem] [border:1px_solid_var(--kc-200)] [border-radius:14px] [background:var(--kc-50)] [padding:0.85rem] [&_>_div:first-child]:[display:flex] [&_>_div:first-child]:[align-items:flex-start] [&_>_div:first-child]:[gap:0.65rem] [&_>_div:first-child_>_div]:[display:grid] [&_strong]:[font-size:0.78rem] [&_span]:[color:var(--neutral-600)] [&_span]:[font-size:0.66rem] [&_span]:[line-height:1.4] max-[900px]:[grid-template-columns:1fr] max-[620px]:[padding:0.75rem]")}><div><span className={cx("setup-progress-card__icon [display:grid] [width:42px] [height:42px] [flex:0_0_42px] [place-items:center] [border-radius:12px] [background:var(--surface-panel)] [color:var(--kc-700)] [box-shadow:var(--shadow-1)]")}><BookOpen size={22} /></span><div><strong>{profile.label} journey</strong><span>{profile.description}</span></div></div><ProgressBar value={Math.round((progress / totalSteps) * 100)} label={`${progress} of ${totalSteps} steps`} /></div>
        <div className={cx("setup-action-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:0.65rem] [&_>_button]:[display:flex] [&_>_button]:[min-width:0] [&_>_button]:[min-height:96px] [&_>_button]:[align-items:flex-start] [&_>_button]:[gap:0.6rem] [&_>_button]:[border:1px_solid_var(--neutral-200)] [&_>_button]:[border-radius:13px] [&_>_button]:[background:var(--surface-panel)] [&_>_button]:[color:var(--neutral-700)] [&_>_button]:[padding:0.75rem] [&_>_button]:[text-align:left] [&_>_button]:[transition:border-color_130ms_ease,_background_130ms_ease,_color_130ms_ease,_transform_100ms_ease] [&_>_button:hover]:[border-color:var(--kc-300)] [&_>_button:hover]:[background:var(--kc-50)] [&_>_button:hover]:[color:var(--kc-800)] [&_>_button:hover]:[transform:translateY(-1px)] [&_>_button_>_span]:[display:grid] [&_>_button_>_span]:[width:36px] [&_>_button_>_span]:[height:36px] [&_>_button_>_span]:[flex:0_0_36px] [&_>_button_>_span]:[place-items:center] [&_>_button_>_span]:[border-radius:10px] [&_>_button_>_span]:[background:var(--kc-50)] [&_>_button_>_span]:[color:var(--kc-700)] [&_>_button_>_div]:[display:grid] [&_>_button_>_div]:[gap:0.2rem] [&_strong]:[font-size:0.73rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.64rem] [&_small]:[line-height:1.4] max-[1180px]:[grid-template-columns:1fr] max-[1180px]:[&_>_button]:[min-height:72px] max-[620px]:[grid-template-columns:1fr]")}><button type="button" onClick={() => startTour(profile.id, !skipped)}><span><PlayCircle size={20} /></span><div><strong>{skipped ? "Continue guided setup" : "Replay guided setup"}</strong><small>{skipped ? "Resume from your saved step." : "Start the role journey from step one."}</small></div></button><button type="button" onClick={openHelp}><span><CircleHelp size={20} /></span><div><strong>Open the learning center</strong><small>Review how each authorized user works.</small></div></button><button type="button" onClick={() => setResetOpen(true)}><span><RotateCcw size={20} /></span><div><strong>Reset setup progress</strong><small>Clear completion and begin the welcome experience again.</small></div></button></div>
      </section>
      {resetOpen && <div className={cx("dialog-layer [position:fixed] [z-index:100] [inset:0] [display:grid] [place-items:center]")}><button className={cx("dialog-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label="Cancel setup reset" onClick={() => setResetOpen(false)} /><section className={cx("dialog [position:relative] [width:min(560px,_calc(100%_-_2rem))] [max-height:calc(100vh_-_2rem)] [overflow-y:auto] [border:1px_solid_var(--border-glass)] [border-radius:var(--radius-xl)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:dialog-in_180ms_ease-out] dialog--compact [width:min(470px,_calc(100%_-_2rem))]")} role="alertdialog" aria-modal="true" aria-labelledby="settings-reset-title"><div className={cx("dialog__header [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [padding:1rem_1.1rem] [border-bottom:1px_solid_var(--neutral-200)] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.2rem]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Guided setup</p><h2 id="settings-reset-title">Reset your setup progress?</h2></div><IconButton label="Cancel setup reset" onClick={() => setResetOpen(false)}><X size={20} /></IconButton></div><p className={cx("dialog-context [margin:1rem_1.1rem_0] [border-left:3px_solid_var(--kc-500)] [color:var(--neutral-700)] [padding:0.25rem_0_0.25rem_0.75rem] [font-size:0.82rem]")}>Completion and saved step information for {profile.shortLabel.toLowerCase()} will be cleared. Your assessment data and preferences will not change.</p><div className={cx("dialog__footer [display:flex] [align-items:center] [justify-content:flex-end] [gap:1rem] [padding:1rem_1.1rem] [border-top:1px_solid_var(--neutral-200)] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column-reverse]")}><Button variant="tertiary" onClick={() => setResetOpen(false)}>Keep progress</Button><Button variant="primary" icon={<RotateCcw size={17} />} onClick={confirmSetupReset}>Reset and restart</Button></div></section></div>}
    </>
  );
}

export function SupportSettings() {
  const { openHelp } = useGuidedSetup();
  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Help and support" description="Find workflow guidance or contact the Maitsys Assure support team." />
      <section className={cx("settings-card [display:grid] [min-width:0] [gap:1rem] [border:1px_solid_var(--neutral-200)] [border-radius:var(--radius-xl)] [background:var(--surface-panel)] [box-shadow:var(--shadow-1)] [padding:1.1rem] max-[620px]:[padding:0.9rem]")}>
        <div className={cx("support-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:0.65rem] [&_>_button]:[display:flex] [&_>_button]:[min-width:0] [&_>_button]:[min-height:96px] [&_>_button]:[align-items:flex-start] [&_>_button]:[gap:0.6rem] [&_>_button]:[border:1px_solid_var(--neutral-200)] [&_>_button]:[border-radius:13px] [&_>_button]:[background:var(--surface-panel)] [&_>_button]:[color:var(--neutral-700)] [&_>_button]:[padding:0.75rem] [&_>_button]:[text-align:left] [&_>_button]:[transition:border-color_130ms_ease,_background_130ms_ease,_color_130ms_ease,_transform_100ms_ease] [&_>_a]:[display:flex] [&_>_a]:[min-width:0] [&_>_a]:[min-height:96px] [&_>_a]:[align-items:flex-start] [&_>_a]:[gap:0.6rem] [&_>_a]:[border:1px_solid_var(--neutral-200)] [&_>_a]:[border-radius:13px] [&_>_a]:[background:var(--surface-panel)] [&_>_a]:[color:var(--neutral-700)] [&_>_a]:[padding:0.75rem] [&_>_a]:[text-align:left] [&_>_a]:[transition:border-color_130ms_ease,_background_130ms_ease,_color_130ms_ease,_transform_100ms_ease] [&_>_article]:[display:flex] [&_>_article]:[min-width:0] [&_>_article]:[min-height:96px] [&_>_article]:[align-items:flex-start] [&_>_article]:[gap:0.6rem] [&_>_article]:[border:1px_solid_var(--neutral-200)] [&_>_article]:[border-radius:13px] [&_>_article]:[background:var(--surface-panel)] [&_>_article]:[color:var(--neutral-700)] [&_>_article]:[padding:0.75rem] [&_>_article]:[text-align:left] [&_>_article]:[transition:border-color_130ms_ease,_background_130ms_ease,_color_130ms_ease,_transform_100ms_ease] [&_>_button:hover]:[border-color:var(--kc-300)] [&_>_button:hover]:[background:var(--kc-50)] [&_>_button:hover]:[color:var(--kc-800)] [&_>_button:hover]:[transform:translateY(-1px)] [&_>_a:hover]:[border-color:var(--kc-300)] [&_>_a:hover]:[background:var(--kc-50)] [&_>_a:hover]:[color:var(--kc-800)] [&_>_a:hover]:[transform:translateY(-1px)] [&_>_*_>_span]:[display:grid] [&_>_*_>_span]:[width:36px] [&_>_*_>_span]:[height:36px] [&_>_*_>_span]:[flex:0_0_36px] [&_>_*_>_span]:[place-items:center] [&_>_*_>_span]:[border-radius:10px] [&_>_*_>_span]:[background:var(--kc-50)] [&_>_*_>_span]:[color:var(--kc-700)] [&_>_*_>_div]:[display:grid] [&_>_*_>_div]:[gap:0.2rem] [&_strong]:[font-size:0.73rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.64rem] [&_small]:[line-height:1.4] max-[1180px]:[grid-template-columns:1fr] max-[1180px]:[&_>_button]:[min-height:72px] max-[1180px]:[&_>_a]:[min-height:72px] max-[1180px]:[&_>_article]:[min-height:72px] max-[620px]:[grid-template-columns:1fr]")}><button type="button" onClick={openHelp}><span><BookOpen size={21} /></span><div><strong>Learning center</strong><small>Open role guidance and replay a walkthrough.</small></div></button><a href="mailto:ehss-support@example.com?subject=Maitsys%20Assure%20application%20support"><span><Mail size={21} /></span><div><strong>Contact support</strong><small>Ask for access, sign-in, or workflow assistance.</small></div></a><article><span><SlidersHorizontal size={21} /></span><div><strong>Application information</strong><small>Maitsys Assure · Phase 1 review build</small></div></article></div>
        <div className={cx("support-note [display:flex] [align-items:flex-start] [gap:0.6rem] [border-radius:12px] [background:var(--neutral-25)] [color:var(--neutral-600)] [padding:0.75rem] [&_>_svg]:[flex:0_0_auto] [&_>_svg]:[color:var(--kc-700)] [&_>_div]:[display:grid] [&_>_div]:[gap:0.12rem] [&_strong]:[color:var(--neutral-800)] [&_strong]:[font-size:0.72rem] [&_span]:[font-size:0.65rem] [&_span]:[line-height:1.45]")}><ShieldCheck size={19} /><div><strong>Your preferences stay with this browser</strong><span>In this review build, appearance, notifications, guided progress, and demo session details are stored locally. Production policies and access remain organization managed.</span></div></div>
      </section>
    </>
  );
}
