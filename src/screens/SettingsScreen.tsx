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
import { useAuth } from "../Auth";
import { useGuidedSetup, type UserRole } from "../GuidedSetup";
import { ThemeSelector, useTheme } from "../Theme";
import { Button, IconButton, InlineMessage, PageHeader, ProgressBar } from "../components/UI";
import { cx } from "../utils";

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
  administrator: ["Review enterprise performance", "Run governed workbook imports", "Create, version, and publish master requirements"],
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
    <div className="preference-row">
      <div><strong>{label}</strong><span>{description}</span></div>
      <button type="button" className={cx("switch-control", checked && "switch-control--checked")} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>
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
    <div className="page-container settings-workspace">
      <div className="settings-shell">
        <aside className="settings-index" aria-label="Settings navigation">
          <label className="settings-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search settings" aria-label="Search settings" />{query && <button type="button" aria-label="Clear settings search" onClick={() => setQuery("")}><X size={16} /></button>}</label>
          {visibleSections.length > 0 ? (
            <nav>
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <NavLink key={section.id} to={`/settings/${section.id}`} className={({ isActive }) => cx(isActive && "settings-index__item--active")}>
                    <span><Icon size={18} /></span>
                    <span><strong>{section.label}</strong><small>{section.description}</small></span>
                  </NavLink>
                );
              })}
            </nav>
          ) : (
            <div className="settings-index-empty"><Search size={22} /><strong>No settings found</strong><p>Try a broader word such as theme, passkey, alert, or setup.</p><Button size="compact" variant="secondary" onClick={() => setQuery("")}>Clear search</Button></div>
          )}
          <div className="settings-index__account"><span className="avatar">{user?.initials ?? profile.initials}</span><div><strong>{user?.name ?? profile.name}</strong><span>{user?.roleLabel ?? profile.label}</span></div></div>
        </aside>
        <div className="settings-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function AccountSettings() {
  const { user, demoEnabled } = useAuth();
  const { profile } = useGuidedSetup();
  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Account and access" description="Your signed-in account controls your role, work scope, and protected permissions." actions={<span className="managed-badge"><LockKeyhole size={14} /> Organization managed</span>} />
      {demoEnabled && <InlineMessage tone="info" title="Demo environment">Demo accounts, notification preferences, and passkey metadata are stored in this browser for review. Demo mode can be disabled before the production identity service is connected.</InlineMessage>}
      <section className="settings-card">
        <div className="settings-identity settings-identity--expanded">
          <span className="avatar avatar--large">{user?.initials ?? profile.initials}</span>
          <div><strong>{user?.name ?? profile.name}</strong><a href={`mailto:${user?.email}`}>{user?.email}</a></div>
          <dl><div><dt>Role</dt><dd>{user?.roleLabel ?? profile.label}</dd></div><div><dt>Authorized scope</dt><dd>{user?.scope ?? profile.scope}</dd></div></dl>
        </div>
        <div className="access-summary"><div><strong>What you can do</strong><span>Based on your current role</span></div><ul>{roleCapabilities[profile.id].map((capability) => <li key={capability}><Check size={16} />{capability}</li>)}</ul></div>
      </section>
    </>
  );
}

export function AppearanceSettings() {
  const { preference, resolvedTheme } = useTheme();
  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Appearance" description="Choose how the application looks without changing your work." actions={<small className="settings-page-state">{preference === "system" ? `${resolvedTheme} from system` : `${preference} selected`}</small>} />
      <section className="settings-card">
        <div className="appearance-setting"><div className="setting-subheading"><div><strong>Color theme</strong><span>System follows this device and updates automatically.</span></div></div><ThemeSelector /></div>
        <div className="appearance-preview" aria-label={`${resolvedTheme} theme preview`}><div className="appearance-preview__rail"><span /><span /><span /></div><div className="appearance-preview__body"><span /><div><span /><span /></div><div><span /><span /></div></div><small>Live {resolvedTheme} preview</small></div>
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
      <PageHeader eyebrow="Personal workspace" title="Notifications" description="Choose which work changes should reach you and how often summaries are prepared." actions={savedAt && <span className="settings-saved" role="status"><Check size={16} /> Preferences saved</span>} />
      <section className="settings-card">
        <div className="preference-list">
          <SettingToggle checked={notifications.assessmentReminders} label="Assessment reminders" description="Remind me when assigned assessment work remains incomplete." onChange={(checked) => saveNotifications({ ...notifications, assessmentReminders: checked })} />
          <SettingToggle checked={notifications.correctiveActionAlerts} label="Corrective-action alerts" description="Notify me when required action details change or need attention." onChange={(checked) => saveNotifications({ ...notifications, correctiveActionAlerts: checked })} />
          <SettingToggle checked={notifications.assignmentChanges} label="Owner assignment changes" description="Notify me when Primary or Backup Owner responsibility changes." onChange={(checked) => saveNotifications({ ...notifications, assignmentChanges: checked })} />
          <SettingToggle checked={notifications.summaryEnabled} label="Work summary" description="Prepare a digest of assessment progress, gaps, and assigned actions." onChange={(checked) => saveNotifications({ ...notifications, summaryEnabled: checked })} />
          <SettingToggle checked={notifications.productGuidance} label="Product guidance" description="Show occasional guidance when important workflow capabilities change." onChange={(checked) => saveNotifications({ ...notifications, productGuidance: checked })} />
        </div>
        <label className={cx("frequency-setting", !notifications.summaryEnabled && "frequency-setting--disabled")}><span><strong>Summary frequency</strong><small>Applies when Work summary is enabled.</small></span><select value={notifications.summaryFrequency} disabled={!notifications.summaryEnabled} onChange={(event) => saveNotifications({ ...notifications, summaryFrequency: event.target.value as NotificationPreferences["summaryFrequency"] })}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
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
    navigate("/login", { replace: true });
  }

  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Security" description="Manage passwordless sign-in and review the device using your current session." actions={<span className={passkeySupported ? "capability capability--ready" : "capability capability--unavailable"}><ShieldCheck size={15} />{passkeySupported ? "Secure connection" : "Unavailable"}</span>} />
      <section className={cx("settings-card", passkeySetupRequested && "settings-card--attention")}>
        {passkeySetupRequested && <InlineMessage tone={passkeySupported ? "info" : "warning"} title={passkeySupported ? "Finish setting up your passkey" : "Passkeys are unavailable here"}><div className="passkey-setup-message"><span>{passkeySupported ? "Name this passkey, choose Add a passkey, and follow your device prompt. If device verification is not configured, the prompt will show other choices or guide you through setup." : "Use a supported browser on a secure connection, or continue signing in with your password."}</span><Button size="compact" variant="tertiary" onClick={() => setSearchParams({}, { replace: true })}>Maybe later</Button></div></InlineMessage>}
        <div className="security-subsection"><div className="setting-subheading"><div><strong>Passkeys</strong><span>Use device unlock, biometrics, a phone, or a security key.</span></div><span className="device-readiness"><MonitorSmartphone size={16} />{platformAuthenticator === null ? "Checking this device" : platformAuthenticator ? "Built-in verification available" : "Phone or security key available"}</span></div>
          <div className="passkey-layout">
            <form className="passkey-add" onSubmit={addPasskey}>
              <label className="auth-field"><span>Passkey name</span><input ref={passkeyNameRef} value={passkeyName} onChange={(event) => setPasskeyName(event.target.value)} maxLength={40} placeholder="For example, work laptop" required /></label>
              <Button type="submit" variant="primary" icon={<Plus size={18} />} disabled={pending || !passkeySupported}>{pending ? "Follow your device prompt…" : "Add a passkey"}</Button>
              <small>Your device controls the private credential. Production verification is completed by the organization authentication service.</small>
            </form>
            <div className="passkey-list" aria-label="Registered passkeys">
              {userPasskeys.length === 0 ? <div className="passkey-empty"><KeyRound size={24} /><strong>No passkeys added</strong><span>Add one to enable faster sign-in on this browser.</span></div> : userPasskeys.map((item) => (
                <article className="passkey-item" key={item.id}>
                  <span className="passkey-item__icon"><KeyRound size={19} /></span>
                  {editingId === item.id ? <div className="passkey-rename"><input aria-label="New passkey name" value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={40} autoFocus /><Button size="compact" variant="primary" icon={<Check size={16} />} onClick={() => saveRename(item.id)} disabled={!editingName.trim()}>Save</Button><IconButton label="Cancel rename" onClick={() => setEditingId(null)}><X size={17} /></IconButton></div> : <div className="passkey-item__copy"><strong>{item.name}</strong><span>Added {formatDate(item.createdAt)}{item.lastUsedAt ? ` · Last used ${formatDate(item.lastUsedAt)}` : ""}</span></div>}
                  {editingId !== item.id && <div className="passkey-item__actions"><IconButton label={`Rename ${item.name}`} onClick={() => { setEditingId(item.id); setEditingName(item.name); }}><Pencil size={17} /></IconButton><IconButton label={`Remove ${item.name}`} onClick={() => setRemovingId(item.id)}><Trash2 size={17} /></IconButton></div>}
                </article>
              ))}
            </div>
          </div>
          {message && <InlineMessage tone={message.tone} title={message.title}>{message.detail}</InlineMessage>}
        </div>
        <div className="security-subsection session-panel"><div className="session-panel__icon"><Laptop size={21} /></div><div><strong>Current session</strong><span>{deviceDescription()}</span><small><span className="session-live-dot" /> Active now · {window.isSecureContext ? "Secure connection" : "Connection needs attention"}</small></div><Button variant="danger" icon={<LogOut size={18} />} onClick={() => setSignOutOpen(true)}>Sign out</Button></div>
      </section>

      {removingId && <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Cancel passkey removal" onClick={() => setRemovingId(null)} /><section className="dialog dialog--compact" role="alertdialog" aria-modal="true" aria-labelledby="remove-passkey-title"><div className="dialog__header"><div><p className="eyebrow">Passkey security</p><h2 id="remove-passkey-title">Remove this passkey?</h2></div><IconButton label="Cancel passkey removal" onClick={() => setRemovingId(null)}><X size={20} /></IconButton></div><p className="dialog-context">You will no longer be able to select this credential when signing in to this application.</p><div className="dialog__footer"><Button variant="tertiary" onClick={() => setRemovingId(null)}>Keep passkey</Button><Button variant="danger" icon={<Trash2 size={17} />} onClick={confirmRemove}>Remove passkey</Button></div></section></div>}
      {signOutOpen && <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Cancel sign out" onClick={() => setSignOutOpen(false)} /><section className="dialog dialog--compact" role="alertdialog" aria-modal="true" aria-labelledby="settings-signout-title"><div className="dialog__header"><div><p className="eyebrow">Current session</p><h2 id="settings-signout-title">Sign out of this device?</h2></div><IconButton label="Cancel sign out" onClick={() => setSignOutOpen(false)}><X size={20} /></IconButton></div><p className="dialog-context">Saved work remains available. You will need your password or passkey to return.</p><div className="dialog__footer"><Button variant="tertiary" onClick={() => setSignOutOpen(false)}>Stay signed in</Button><Button variant="danger" icon={<LogOut size={17} />} onClick={confirmSignOut}>Sign out</Button></div></section></div>}
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
      <PageHeader eyebrow="Personal workspace" title="Guided setup" description="Review your assigned journey, continue from saved progress, or start again." actions={<span className={cx("setup-state", completed && "setup-state--complete", skipped && "setup-state--paused")}>{completed ? "Complete" : skipped ? "Paused" : progress > 0 ? "In progress" : "Not started"}</span>} />
      <section className="settings-card">
        <div className="setup-progress-card"><div><span className="setup-progress-card__icon"><BookOpen size={22} /></span><div><strong>{profile.label} journey</strong><span>{profile.description}</span></div></div><ProgressBar value={Math.round((progress / totalSteps) * 100)} label={`${progress} of ${totalSteps} steps`} /></div>
        <div className="setup-action-grid"><button type="button" onClick={() => startTour(profile.id, !skipped)}><span><PlayCircle size={20} /></span><div><strong>{skipped ? "Continue guided setup" : "Replay guided setup"}</strong><small>{skipped ? "Resume from your saved step." : "Start the role journey from step one."}</small></div></button><button type="button" onClick={openHelp}><span><CircleHelp size={20} /></span><div><strong>Open the learning center</strong><small>Review how each authorized user works.</small></div></button><button type="button" onClick={() => setResetOpen(true)}><span><RotateCcw size={20} /></span><div><strong>Reset setup progress</strong><small>Clear completion and begin the welcome experience again.</small></div></button></div>
      </section>
      {resetOpen && <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Cancel setup reset" onClick={() => setResetOpen(false)} /><section className="dialog dialog--compact" role="alertdialog" aria-modal="true" aria-labelledby="settings-reset-title"><div className="dialog__header"><div><p className="eyebrow">Guided setup</p><h2 id="settings-reset-title">Reset your setup progress?</h2></div><IconButton label="Cancel setup reset" onClick={() => setResetOpen(false)}><X size={20} /></IconButton></div><p className="dialog-context">Completion and saved step information for {profile.shortLabel.toLowerCase()} will be cleared. Your assessment data and preferences will not change.</p><div className="dialog__footer"><Button variant="tertiary" onClick={() => setResetOpen(false)}>Keep progress</Button><Button variant="primary" icon={<RotateCcw size={17} />} onClick={confirmSetupReset}>Reset and restart</Button></div></section></div>}
    </>
  );
}

export function SupportSettings() {
  const { openHelp } = useGuidedSetup();
  return (
    <>
      <PageHeader eyebrow="Personal workspace" title="Help and support" description="Find workflow guidance or contact the EHS&S support team." />
      <section className="settings-card">
        <div className="support-grid"><button type="button" onClick={openHelp}><span><BookOpen size={21} /></span><div><strong>Learning center</strong><small>Open role guidance and replay a walkthrough.</small></div></button><a href="mailto:ehss-support@example.com?subject=EHS%26S%20application%20support"><span><Mail size={21} /></span><div><strong>Contact support</strong><small>Ask for access, sign-in, or workflow assistance.</small></div></a><article><span><SlidersHorizontal size={21} /></span><div><strong>Application information</strong><small>KC EHS&S Self-Assessment · Phase 1 review build</small></div></article></div>
        <div className="support-note"><ShieldCheck size={19} /><div><strong>Your preferences stay with this browser</strong><span>In this review build, appearance, notifications, guided progress, and demo session details are stored locally. Production policies and access remain organization managed.</span></div></div>
      </section>
    </>
  );
}
