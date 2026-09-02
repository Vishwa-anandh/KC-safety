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
import { ChangePasswordDialog, useAuth } from "../../auth";
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

// Shared recipes duplicated across this file's six settings screens — keep them in one place so
// every section's card/badge/subheading looks identical (canonical card / tinted-pill recipes).
const settingsCardClass = "settings-card grid min-w-0 gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4.5 dark:border-slate-700 dark:bg-slate-900";
const settingSubheadingClass = "setting-subheading flex flex-col items-start justify-between gap-1.5 sm:flex-row sm:gap-4";
const settingSubheadingLabelClass = "text-sm text-slate-800 dark:text-slate-200";
const settingSubheadingHintClass = "text-xs leading-snug text-slate-500 dark:text-slate-400";
const statusPillBaseClass = "inline-flex w-fit flex-none items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold";
const dialogLayerClass = "dialog-layer fixed inset-0 z-100 grid place-items-center p-4";
const dialogBackdropClass = "dialog-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-sm";
const dialogClass = "dialog dialog--compact relative max-h-full w-full max-w-md overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-dialog-in dark:border-slate-700 dark:bg-slate-900";
const dialogHeaderClass = "dialog__header flex items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-700";
const dialogTitleEyebrowClass = "eyebrow text-sm font-semibold text-kc-blue-700 dark:text-kc-blue-300";
const dialogTitleClass = "mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100";
const dialogContextClass = "dialog-context mx-4 mt-4 border-l-3 border-kc-blue-500 py-1 pl-3 text-sm text-slate-700 dark:border-kc-blue-400 dark:text-slate-300";
const dialogFooterClass = "dialog__footer flex flex-col-reverse items-stretch gap-4 border-t border-slate-200 p-4 md:flex-row md:items-center md:justify-end dark:border-slate-700";
const actionTileGridClass = "grid grid-cols-1 gap-2.5 lg:grid-cols-3";
const actionTileClass = "flex min-w-0 min-h-24 items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left text-slate-700 transition-colors hover:border-kc-blue-300 hover:bg-kc-blue-50 hover:text-kc-blue-800 lg:min-h-18 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-kc-blue-700 dark:hover:bg-kc-blue-950 dark:hover:text-kc-blue-200";
const actionTileIconClass = "grid size-9 flex-none place-items-center rounded-lg bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300";
const actionTileTitleClass = "text-sm font-semibold text-slate-900 dark:text-slate-100";
const actionTileHintClass = "text-xs leading-snug text-slate-500 dark:text-slate-400";

function SettingToggle({ checked, label, description, onChange }: { checked: boolean; label: string; description: string; onChange: (checked: boolean) => void }) {
  return (
    <div className="preference-row flex min-h-16 items-center justify-between gap-4 bg-white px-3.5 py-3 sm:min-h-17 dark:bg-slate-900">
      <div className="grid min-w-0">
        <strong className="text-sm text-slate-900 dark:text-slate-100">{label}</strong>
        <span className="text-xs leading-snug text-slate-500 dark:text-slate-400">{description}</span>
      </div>
      <button
        type="button"
        className={cx(
          "switch-control relative h-7 w-11.5 shrink-0 rounded-full border border-slate-300 bg-slate-200 p-0.5 transition-colors dark:border-slate-600 dark:bg-slate-700",
          checked && "switch-control--checked border-emerald-700 bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500",
        )}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
      >
        <span className={cx("block size-5.5 rounded-full bg-white shadow-sm transition-transform", checked && "translate-x-4.5")} />
      </button>
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
    <div
      className="page-container settings-workspace w-full pt-5 pb-14 sm:pt-9 sm:pb-16"
      style={{ paddingLeft: "var(--page-gutter)", paddingRight: "var(--page-gutter)" }}
    >
      <div className="settings-shell flex min-w-0 items-start gap-3 sm:gap-4 lg:flex-row lg:items-start max-lg:flex-col">
        <aside
          className="settings-index sticky z-10 grid gap-2.5 overflow-auto rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm lg:w-65 lg:flex-none lg:p-2.5 dark:border-slate-700 dark:bg-slate-900"
          style={{ top: "calc(var(--content-offset) + 1rem)", maxHeight: "calc(100vh - var(--content-offset) - 2rem)" }}
          aria-label="Settings navigation"
        >
          <label className="settings-search relative flex min-h-10.5 items-center gap-2 rounded-xl border border-slate-300 bg-white px-2.5 text-slate-500 focus-within:border-kc-blue-500 focus-within:ring-3 focus-within:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800">
            <Search size={17} />
            <input
              className="w-full min-w-0 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search settings"
              aria-label="Search settings"
            />
            {query && (
              <button
                type="button"
                className="grid size-7 flex-none place-items-center rounded-lg border-0 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Clear settings search"
                onClick={() => setQuery("")}
              >
                <X size={16} />
              </button>
            )}
          </label>
          {visibleSections.length > 0 ? (
            <nav className="grid gap-1 lg:flex lg:flex-wrap lg:gap-1">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <NavLink
                    key={section.id}
                    to={settingsRoute(section.id)}
                    className={({ isActive }) =>
                      cx(
                        "flex min-h-13.5 min-w-0 items-center gap-2.5 rounded-xl border border-transparent p-2 text-left text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 active:scale-99 lg:min-h-10.5 lg:flex-1 lg:basis-40 lg:p-2 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                        isActive && "settings-index__item--active border-kc-blue-200 bg-kc-blue-50 text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200",
                      )
                    }
                  >
                    <span className={cx("grid size-8.5 flex-none place-items-center rounded-lg bg-slate-50 text-slate-500 lg:size-7.5 dark:bg-slate-800 dark:text-slate-400")}>
                      <Icon size={18} />
                    </span>
                    <span className="grid min-w-0">
                      <strong className="overflow-hidden text-xs text-ellipsis whitespace-nowrap">{section.label}</strong>
                      <small className="overflow-hidden text-xs text-slate-500 text-ellipsis whitespace-nowrap lg:hidden dark:text-slate-400">{section.description}</small>
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          ) : (
            <div className="settings-index-empty grid place-items-center gap-1.5 rounded-xl border border-dashed border-slate-300 p-7 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
              <Search size={22} className="text-kc-blue-600 dark:text-kc-blue-400" />
              <strong className="text-sm text-slate-800 dark:text-slate-200">No settings found</strong>
              <p className="text-xs">Try a broader word such as theme, passkey, alert, or setup.</p>
              <Button size="compact" variant="secondary" onClick={() => setQuery("")}>Clear search</Button>
            </div>
          )}
          <div className="settings-index__account hidden min-w-0 items-center gap-2 border-t border-slate-200 px-1.5 pt-2.5 lg:flex dark:border-slate-700">
            <span className="avatar inline-grid size-9.5 flex-none place-items-center rounded-full border border-kc-blue-200 bg-kc-blue-50 text-xs font-bold text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200">
              {user?.initials ?? profile.initials}
            </span>
            <div className="grid min-w-0">
              <strong className="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-slate-900 dark:text-slate-100">{user?.name ?? profile.name}</strong>
              <span className="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-slate-500 dark:text-slate-400">{user?.roleLabel ?? profile.label}</span>
            </div>
          </div>
        </aside>
        <div className="settings-content grid min-w-0 flex-1 gap-3.5">
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
      <PageHeader
        eyebrow="Personal workspace"
        title="Account and access"
        description="Your signed-in account controls your role, work scope, and protected permissions."
        actions={
          <span className="managed-badge inline-flex flex-none items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <LockKeyhole size={14} /> Organization managed
          </span>
        }
      />
      <section className={settingsCardClass}>
        <div className="settings-identity grid grid-cols-[auto_1fr] items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[auto_minmax(120px,0.65fr)_minmax(200px,1.35fr)] dark:border-slate-700 dark:bg-slate-900">
          <span className="avatar avatar--large inline-grid size-13 flex-none place-items-center rounded-full border border-kc-blue-200 bg-kc-blue-50 text-sm font-bold text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200">
            {user?.initials ?? profile.initials}
          </span>
          <div className="grid min-w-0">
            <strong className="text-sm text-slate-900 dark:text-slate-100">{user?.name ?? profile.name}</strong>
            <a href={`mailto:${user?.email}`} className="overflow-hidden text-xs text-ellipsis text-slate-500 dark:text-slate-400">{user?.email}</a>
          </div>
          <dl className="col-span-full m-0 grid grid-cols-1 gap-2.5 sm:col-span-1">
            <div className="grid gap-0.5 border-t border-slate-200 pt-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3.5 dark:border-slate-700">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Role</dt>
              <dd className="m-0 text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.roleLabel ?? profile.label}</dd>
            </div>
            <div className="grid gap-0.5 border-t border-slate-200 pt-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3.5 dark:border-slate-700">
              <dt className="text-xs text-slate-500 dark:text-slate-400">Authorized scope</dt>
              <dd className="m-0 text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.scope ?? profile.scope}</dd>
            </div>
          </dl>
        </div>
        <div className="access-summary grid grid-cols-1 items-start gap-4 border-t border-slate-200 pt-4 lg:grid-cols-[minmax(150px,0.5fr)_minmax(0,1.5fr)] dark:border-slate-700">
          <div className="grid gap-0.5">
            <strong className="text-sm text-slate-900 dark:text-slate-100">What you can do</strong>
            <span className="text-xs text-slate-500 dark:text-slate-400">Based on your current role</span>
          </div>
          <ul className="m-0 grid grid-cols-1 gap-2 p-0 sm:grid-cols-3">
            {roleCapabilities[profile.id].map((capability) => (
              <li key={capability} className="flex items-start gap-1.5 rounded-lg bg-slate-50 p-2.5 text-xs leading-snug text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Check size={16} className="flex-none text-emerald-700 dark:text-emerald-400" />
                {capability}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export function AppearanceSettings() {
  const { preference, resolvedTheme } = useTheme();
  return (
    <>
      <PageHeader
        eyebrow="Personal workspace"
        title="Appearance"
        description="Choose how the application looks without changing your work."
        actions={<small className="settings-page-state text-xs text-slate-500 dark:text-slate-400">{preference === "system" ? `${resolvedTheme} from system` : `${preference} selected`}</small>}
      />
      <section className={settingsCardClass}>
        <div className="appearance-setting grid gap-2.5 not-first:border-t not-first:border-slate-200 not-first:pt-4 dark:not-first:border-slate-700">
          <div className={settingSubheadingClass}>
            <div className="grid gap-0.5">
              <strong className={settingSubheadingLabelClass}>Color theme</strong>
              <span className={settingSubheadingHintClass}>System follows this device and updates automatically.</span>
            </div>
          </div>
          <ThemeSelector />
        </div>
        <div className="appearance-setting grid gap-2.5 not-first:border-t not-first:border-slate-200 not-first:pt-4 dark:not-first:border-slate-700">
          <div className={settingSubheadingClass}>
            <div className="grid gap-0.5">
              <strong className={settingSubheadingLabelClass}>Accent colour</strong>
              <span className={settingSubheadingHintClass}>Applies to buttons, links, and highlights in both light and dark themes.</span>
            </div>
          </div>
          <AccentSelector />
        </div>
        <div
          className="appearance-preview relative grid min-h-27.5 grid-cols-[52px_1fr] overflow-hidden rounded-2xl border border-slate-200 sm:min-h-31.5 sm:grid-cols-[68px_1fr] dark:border-slate-700"
          aria-label={`${resolvedTheme} theme preview`}
        >
          <div className="appearance-preview__rail grid content-start gap-2 p-2.5" style={{ background: "var(--nav-background)" }}>
            <span className="h-2.75 w-9 rounded-md opacity-42" style={{ background: "var(--nav-accent)" }} />
            <span className="h-2.75 rounded-md" style={{ background: "var(--nav-hover)" }} />
            <span className="h-2.75 rounded-md" style={{ background: "var(--nav-hover)" }} />
          </div>
          <div className="appearance-preview__body grid grid-cols-2 content-start gap-2 bg-slate-50 p-3 dark:bg-slate-900">
            <span className="col-span-full h-3 rounded-md bg-slate-200 dark:bg-slate-700" />
            <div className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800">
              <span className="h-2 w-1/2 rounded bg-kc-blue-300 dark:bg-kc-blue-700" />
              <span className="h-2 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800">
              <span className="h-2 w-1/2 rounded bg-kc-blue-300 dark:bg-kc-blue-700" />
              <span className="h-2 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
          <small className="absolute right-2.5 bottom-2 text-xs text-slate-500 dark:text-slate-400">Live {resolvedTheme} preview</small>
        </div>
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
      <PageHeader
        eyebrow="Personal workspace"
        title="Notifications"
        description="Choose which work changes should reach you and how often summaries are prepared."
        actions={
          savedAt && (
            <span className="settings-saved inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" role="status">
              <Check size={16} /> Preferences saved
            </span>
          )
        }
      />
      <section className={settingsCardClass}>
        <div className="preference-list grid divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
          <SettingToggle checked={notifications.assessmentReminders} label="Assessment reminders" description="Remind me when assigned assessment work remains incomplete." onChange={(checked) => saveNotifications({ ...notifications, assessmentReminders: checked })} />
          <SettingToggle checked={notifications.correctiveActionAlerts} label="Corrective-action alerts" description="Notify me when required action details change or need attention." onChange={(checked) => saveNotifications({ ...notifications, correctiveActionAlerts: checked })} />
          <SettingToggle checked={notifications.assignmentChanges} label="Owner assignment changes" description="Notify me when Primary or Backup Owner responsibility changes." onChange={(checked) => saveNotifications({ ...notifications, assignmentChanges: checked })} />
          <SettingToggle checked={notifications.summaryEnabled} label="Work summary" description="Prepare a digest of assessment progress, gaps, and assigned actions." onChange={(checked) => saveNotifications({ ...notifications, summaryEnabled: checked })} />
          <SettingToggle checked={notifications.productGuidance} label="Product guidance" description="Show occasional guidance when important workflow capabilities change." onChange={(checked) => saveNotifications({ ...notifications, productGuidance: checked })} />
        </div>
        <label
          className={cx(
            "frequency-setting flex flex-col items-stretch justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900",
            !notifications.summaryEnabled && "frequency-setting--disabled opacity-58",
          )}
        >
          <span className="grid">
            <strong className="text-sm text-slate-900 dark:text-slate-100">Summary frequency</strong>
            <small className="text-xs text-slate-500 dark:text-slate-400">Applies when Work summary is enabled.</small>
          </span>
          <select
            className="min-h-10 min-w-35 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 sm:w-auto dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            value={notifications.summaryFrequency}
            disabled={!notifications.summaryEnabled}
            onChange={(event) => saveNotifications({ ...notifications, summaryFrequency: event.target.value as NotificationPreferences["summaryFrequency"] })}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
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
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

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

  useEffect(() => {
    if (searchParams.get("setup") === "password") {
      setChangePasswordOpen(true);
      setSearchParams({}, { replace: true });
    }
    // Only reacts to the deep link that opens this dialog, not to setSearchParams changing identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      <PageHeader
        eyebrow="Personal workspace"
        title="Security"
        description="Manage passwordless sign-in and review the device using your current session."
        actions={
          <span
            className={cx(
              statusPillBaseClass,
              passkeySupported ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            )}
          >
            <ShieldCheck size={15} />{passkeySupported ? "Secure connection" : "Unavailable"}
          </span>
        }
      />
      <section className={cx(settingsCardClass, passkeySetupRequested && "settings-card--attention border-kc-blue-500 ring-3 ring-kc-blue-100 animate-passkey-attention dark:ring-kc-blue-900")}>
        {passkeySetupRequested && (
          <InlineMessage tone={passkeySupported ? "info" : "warning"} title={passkeySupported ? "Finish setting up your passkey" : "Passkeys are unavailable here"}>
            <div className="passkey-setup-message flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                {passkeySupported
                  ? "Name this passkey, choose Add a passkey, and follow your device prompt. If device verification is not configured, the prompt will show other choices or guide you through setup."
                  : "Use a supported browser on a secure connection, or continue signing in with your password."}
              </span>
              <Button size="compact" variant="tertiary" onClick={() => setSearchParams({}, { replace: true })}>Maybe later</Button>
            </div>
          </InlineMessage>
        )}
        <div className="security-subsection grid gap-3 not-first:border-t not-first:border-slate-200 not-first:pt-4 dark:not-first:border-slate-700">
          <div className={settingSubheadingClass}>
            <div className="grid gap-0.5">
              <strong className={settingSubheadingLabelClass}>Passkeys</strong>
              <span className={settingSubheadingHintClass}>Use device unlock, biometrics, a phone, or a security key.</span>
            </div>
            <span className="device-readiness inline-flex w-fit flex-none items-center gap-1.5 rounded-full bg-kc-blue-50 px-2.5 py-1.5 text-xs font-bold text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300">
              <MonitorSmartphone size={16} />
              {platformAuthenticator === null ? "Checking this device" : platformAuthenticator ? "Built-in verification available" : "Phone or security key available"}
            </span>
          </div>
          <div className="passkey-layout grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(260px,0.72fr)_minmax(360px,1.28fr)]">
            <form className="passkey-add grid content-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-900" onSubmit={addPasskey}>
              <label className="auth-field grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Passkey name</span>
                <input
                  className="w-full min-w-0 min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 transition-colors outline-none placeholder:text-slate-400 focus:border-kc-blue-500 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  ref={passkeyNameRef}
                  value={passkeyName}
                  onChange={(event) => setPasskeyName(event.target.value)}
                  maxLength={40}
                  placeholder="For example, work laptop"
                  required
                />
              </label>
              <Button type="submit" variant="primary" icon={<Plus size={18} />} disabled={pending || !passkeySupported}>{pending ? "Follow your device prompt…" : "Add a passkey"}</Button>
              <small className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">Your device controls the private credential. Production verification is completed by the organization authentication service.</small>
            </form>
            <div className="passkey-list grid content-start gap-2" aria-label="Registered passkeys">
              {userPasskeys.length === 0 ? (
                <div className="passkey-empty grid min-h-38.5 place-items-center content-center gap-1.5 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  <KeyRound size={24} className="text-kc-blue-600 dark:text-kc-blue-400" />
                  <strong className="text-sm text-slate-700 dark:text-slate-300">No passkeys added</strong>
                  <span className="text-xs">Add one to enable faster sign-in on this browser.</span>
                </div>
              ) : (
                userPasskeys.map((item) => (
                  <article className="passkey-item grid min-w-0 grid-cols-[auto_1fr] items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] dark:border-slate-700 dark:bg-slate-900" key={item.id}>
                    <span className="passkey-item__icon grid size-10 place-items-center rounded-xl bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300">
                      <KeyRound size={19} />
                    </span>
                    {editingId === item.id ? (
                      <div className="passkey-rename col-span-2 flex min-w-0 flex-wrap items-center gap-2 sm:col-span-1 sm:flex-nowrap">
                        <input
                          className="min-h-9.5 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 transition-colors outline-none focus:border-kc-blue-500 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          aria-label="New passkey name"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          maxLength={40}
                          autoFocus
                        />
                        <Button size="compact" variant="primary" icon={<Check size={16} />} onClick={() => saveRename(item.id)} disabled={!editingName.trim()}>Save</Button>
                        <IconButton label="Cancel rename" onClick={() => setEditingId(null)}><X size={17} /></IconButton>
                      </div>
                    ) : (
                      <div className="passkey-item__copy grid min-w-0">
                        <strong className="text-sm text-slate-900 dark:text-slate-100">{item.name}</strong>
                        <span className="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-slate-500 dark:text-slate-400">
                          Added {formatDate(item.createdAt)}{item.lastUsedAt ? ` · Last used ${formatDate(item.lastUsedAt)}` : ""}
                        </span>
                      </div>
                    )}
                    {editingId !== item.id && (
                      <div className="passkey-item__actions flex justify-self-start sm:col-span-1">
                        <IconButton label={`Rename ${item.name}`} onClick={() => { setEditingId(item.id); setEditingName(item.name); }}><Pencil size={17} /></IconButton>
                        <IconButton label={`Remove ${item.name}`} onClick={() => setRemovingId(item.id)}><Trash2 size={17} /></IconButton>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
          {message && <InlineMessage tone={message.tone} title={message.title}>{message.detail}</InlineMessage>}
        </div>
        <div className="security-subsection flex flex-col items-start justify-between gap-3 not-first:border-t not-first:border-slate-200 not-first:pt-4 sm:flex-row sm:items-center dark:not-first:border-slate-700">
          <div className="grid gap-0.5">
            <strong className={settingSubheadingLabelClass}>Password</strong>
            <span className={settingSubheadingHintClass}>Change the password used to sign in with your work email.</span>
          </div>
          <Button variant="secondary" icon={<KeyRound size={17} />} onClick={() => setChangePasswordOpen(true)}>Change password</Button>
        </div>
        <div className="security-subsection session-panel grid grid-cols-[auto_1fr] items-center gap-3 border-t border-slate-200 pt-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] dark:border-slate-700">
          <div className="session-panel__icon grid size-11 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Laptop size={21} />
          </div>
          <div className="grid">
            <strong className="text-sm text-slate-900 dark:text-slate-100">Current session</strong>
            <span className="text-xs text-slate-500 dark:text-slate-400">{deviceDescription()}</span>
            <small className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="size-1.75 rounded-full bg-emerald-500 ring-3 ring-emerald-50 dark:ring-emerald-950" /> Active now · {window.isSecureContext ? "Secure connection" : "Connection needs attention"}
            </small>
          </div>
          <Button variant="danger" icon={<LogOut size={18} />} onClick={() => setSignOutOpen(true)}>Sign out</Button>
        </div>
      </section>

      {removingId && (
        <ConfirmDialog
          eyebrow="Passkey security"
          title="Remove this passkey?"
          body="You will no longer be able to select this credential when signing in to this application."
          confirmLabel="Remove passkey"
          cancelLabel="Keep passkey"
          onCancel={() => setRemovingId(null)}
          onConfirm={confirmRemove}
        />
      )}
      {signOutOpen && (
        <div className={dialogLayerClass}>
          <button className={dialogBackdropClass} aria-label="Cancel sign out" onClick={() => setSignOutOpen(false)} />
          <section className={dialogClass} role="alertdialog" aria-modal="true" aria-labelledby="settings-signout-title">
            <div className={dialogHeaderClass}>
              <div>
                <p className={dialogTitleEyebrowClass}>Current session</p>
                <h2 id="settings-signout-title" className={dialogTitleClass}>Sign out of this device?</h2>
              </div>
              <IconButton label="Cancel sign out" onClick={() => setSignOutOpen(false)}><X size={20} /></IconButton>
            </div>
            <p className={dialogContextClass}>Saved work remains available. You will need your password or passkey to return.</p>
            <div className={dialogFooterClass}>
              <Button variant="tertiary" onClick={() => setSignOutOpen(false)}>Stay signed in</Button>
              <Button variant="danger" icon={<LogOut size={17} />} onClick={confirmSignOut}>Sign out</Button>
            </div>
          </section>
        </div>
      )}
      {changePasswordOpen && <ChangePasswordDialog onClose={() => setChangePasswordOpen(false)} />}
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
      <PageHeader
        eyebrow="Personal workspace"
        title="Guided setup"
        description="Review your assigned journey, continue from saved progress, or start again."
        actions={
          <span
            className={cx(
              statusPillBaseClass,
              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
              completed && "setup-state--complete bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
              skipped && "setup-state--paused bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            )}
          >
            {completed ? "Complete" : skipped ? "Paused" : progress > 0 ? "In progress" : "Not started"}
          </span>
        }
      />
      <section className={settingsCardClass}>
        <div className="setup-progress-card grid grid-cols-1 items-center gap-4 rounded-2xl border border-kc-blue-200 bg-kc-blue-50 p-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.65fr)] dark:border-kc-blue-800 dark:bg-kc-blue-950">
          <div className="flex items-start gap-2.5">
            <span className="setup-progress-card__icon grid size-10.5 flex-none place-items-center rounded-xl bg-white text-kc-blue-700 shadow-sm dark:bg-slate-900 dark:text-kc-blue-300">
              <BookOpen size={22} />
            </span>
            <div className="grid">
              <strong className="text-sm text-slate-900 dark:text-slate-100">{profile.label} journey</strong>
              <span className="text-xs leading-snug text-slate-600 dark:text-slate-300">{profile.description}</span>
            </div>
          </div>
          <ProgressBar value={Math.round((progress / totalSteps) * 100)} label={`${progress} of ${totalSteps} steps`} />
        </div>
        <div className={actionTileGridClass}>
          <button type="button" className={actionTileClass} onClick={() => startTour(profile.id, !skipped)}>
            <span className={actionTileIconClass}><PlayCircle size={20} /></span>
            <div className="grid gap-0.5">
              <strong className={actionTileTitleClass}>{skipped ? "Continue guided setup" : "Replay guided setup"}</strong>
              <small className={actionTileHintClass}>{skipped ? "Resume from your saved step." : "Start the role journey from step one."}</small>
            </div>
          </button>
          <button type="button" className={actionTileClass} onClick={openHelp}>
            <span className={actionTileIconClass}><CircleHelp size={20} /></span>
            <div className="grid gap-0.5">
              <strong className={actionTileTitleClass}>Open the learning center</strong>
              <small className={actionTileHintClass}>Review how each authorized user works.</small>
            </div>
          </button>
          <button type="button" className={actionTileClass} onClick={() => setResetOpen(true)}>
            <span className={actionTileIconClass}><RotateCcw size={20} /></span>
            <div className="grid gap-0.5">
              <strong className={actionTileTitleClass}>Reset setup progress</strong>
              <small className={actionTileHintClass}>Clear completion and begin the welcome experience again.</small>
            </div>
          </button>
        </div>
      </section>
      {resetOpen && (
        <div className={dialogLayerClass}>
          <button className={dialogBackdropClass} aria-label="Cancel setup reset" onClick={() => setResetOpen(false)} />
          <section className={dialogClass} role="alertdialog" aria-modal="true" aria-labelledby="settings-reset-title">
            <div className={dialogHeaderClass}>
              <div>
                <p className={dialogTitleEyebrowClass}>Guided setup</p>
                <h2 id="settings-reset-title" className={dialogTitleClass}>Reset your setup progress?</h2>
              </div>
              <IconButton label="Cancel setup reset" onClick={() => setResetOpen(false)}><X size={20} /></IconButton>
            </div>
            <p className={dialogContextClass}>Completion and saved step information for {profile.shortLabel.toLowerCase()} will be cleared. Your assessment data and preferences will not change.</p>
            <div className={dialogFooterClass}>
              <Button variant="tertiary" onClick={() => setResetOpen(false)}>Keep progress</Button>
              <Button variant="primary" icon={<RotateCcw size={17} />} onClick={confirmSetupReset}>Reset and restart</Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export function SupportSettings() {
  const { openHelp } = useGuidedSetup();
  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Help and support" description="Find workflow guidance or contact the EHS360 support team." />
      <section className={settingsCardClass}>
        <div className={actionTileGridClass}>
          <button type="button" className={actionTileClass} onClick={openHelp}>
            <span className={actionTileIconClass}><BookOpen size={21} /></span>
            <div className="grid gap-0.5">
              <strong className={actionTileTitleClass}>Learning center</strong>
              <small className={actionTileHintClass}>Open role guidance and replay a walkthrough.</small>
            </div>
          </button>
          <a className={actionTileClass} href="mailto:ehss-support@example.com?subject=EHS360%20application%20support">
            <span className={actionTileIconClass}><Mail size={21} /></span>
            <div className="grid gap-0.5">
              <strong className={actionTileTitleClass}>Contact support</strong>
              <small className={actionTileHintClass}>Ask for access, sign-in, or workflow assistance.</small>
            </div>
          </a>
          <article className={actionTileClass}>
            <span className={actionTileIconClass}><SlidersHorizontal size={21} /></span>
            <div className="grid gap-0.5">
              <strong className={actionTileTitleClass}>Application information</strong>
              <small className={actionTileHintClass}>EHS360 · Phase 1 review build</small>
            </div>
          </article>
        </div>
        <div className="support-note flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <ShieldCheck size={19} className="flex-none text-kc-blue-700 dark:text-kc-blue-300" />
          <div className="grid gap-0.5">
            <strong className="text-xs text-slate-800 dark:text-slate-200">Your preferences stay with this browser</strong>
            <span className="text-xs leading-relaxed">In this review build, appearance, notifications, guided progress, and demo session details are stored locally. Production policies and access remain organization managed.</span>
          </div>
        </div>
      </section>
    </>
  );
}
