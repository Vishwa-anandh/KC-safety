/* eslint-disable react-refresh/only-export-components */
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  LayoutDashboard,
  PlayCircle,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/model/AuthProvider";
import { Button, IconButton, ProgressBar } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";
import type { UserRole } from "../../../shared/types";

export type { UserRole } from "../../../shared/types";

interface RoleProfile {
  id: UserRole;
  name: string;
  initials: string;
  label: string;
  shortLabel: string;
  scope: string;
  description: string;
  home: string;
  icon: LucideIcon;
}

export const roleProfiles: Record<UserRole, RoleProfile> = {
  "site-contributor": {
    id: "site-contributor",
    name: "Maya Patel",
    initials: "MP",
    label: "Site contributor",
    shortLabel: "Site user",
    scope: "Northstar Manufacturing",
    description: "Maintains site contacts and owners, completes the assessment, attaches evidence, and closes information gaps.",
    home: "/overview",
    icon: Building2,
  },
  "enterprise-viewer": {
    id: "enterprise-viewer",
    name: "Noah Williams",
    initials: "NW",
    label: "Regional / enterprise viewer",
    shortLabel: "Enterprise viewer",
    scope: "Authorized enterprise sites",
    description: "Reviews completion and performance, filters authorized sites, opens read-only drill-downs, and exports the current view.",
    home: "/dashboard",
    icon: LayoutDashboard,
  },
  administrator: {
    id: "administrator",
    name: "Rachel Morgan",
    initials: "RM",
    label: "Enterprise administrator",
    shortLabel: "Administrator",
    scope: "Global EHS&S administration",
    description: "Validates governed workbooks, reviews audit history, and creates, edits, versions, and publishes master requirements.",
    home: "/dashboard",
    icon: ShieldCheck,
  },
};

interface TourStep {
  path: string;
  targets: string[];
  eyebrow: string;
  title: string;
  description: string;
  action?: string;
}

const tours: Record<UserRole, TourStep[]> = {
  "site-contributor": [
    { path: "/overview", targets: ["site-context"], eyebrow: "Your fixed work context", title: "Confirm your assigned site", description: "Every editable page belongs to this one assigned site. The site context remains visible and cannot be switched here.", action: "Next: continue your work" },
    { path: "/overview", targets: ["continue-assessment"], eyebrow: "Recommended work", title: "Resume from the next incomplete requirement", description: "The overview always points you to the most useful next assessment task, including missing corrective-action details.", action: "Next: maintain contacts" },
    { path: "/site-information", targets: ["site-contacts-form", "site-save"], eyebrow: "Site setup", title: "Maintain site and regional contacts", description: "Keep required leadership names and email addresses current. Site identity remains protected and read-only.", action: "Next: assign owners" },
    { path: "/owners", targets: ["owner-list", "owners-controls"], eyebrow: "Accountability", title: "Confirm Primary and Backup Owners", description: "Both owners can edit the assigned site. Use search and category filters to find the program or standard you need.", action: "Next: open the assessment" },
    { path: "/assessment", targets: ["assessment-next-incomplete", "assessment-sections"], eyebrow: "Self-assessment", title: "Work through requirements in priority order", description: "Select No, Partial, or Yes. No and Partial require both a corrective-action description and an owner before you move on.", action: "Next: review actions" },
    { path: "/actions", targets: ["actions-filters", "actions-table"], eyebrow: "Corrective actions", title: "Complete every information gap", description: "Assessment gaps appear here automatically. Edit missing descriptions or owners and open the exact originating requirement when needed." },
  ],
  "enterprise-viewer": [
    { path: "/dashboard", targets: ["dashboard-filters"], eyebrow: "Authorized scope", title: "Focus the enterprise dashboard", description: "Filter by site, region, segment, completion, performance, and assessment area. Applied filters never change an editable site context.", action: "Next: inspect sites" },
    { path: "/dashboard", targets: ["dashboard-sites"], eyebrow: "Enterprise oversight", title: "Compare authorized sites", description: "Completion and performance remain separate. Select a row to open a site-level drill-down without gaining edit access.", action: "Next: export the view" },
    { path: "/dashboard", targets: ["dashboard-export"], eyebrow: "Reporting", title: "Export the current filtered scope", description: "The export includes only the sites visible in your current authorized and filtered view.", action: "Next: open a drill-down" },
    { path: "/sites/northstar", targets: ["drilldown-sections"], eyebrow: "Read-only detail", title: "Review section-level performance", description: "Inspect completion, performance, and gaps by section. Other-site records remain read-only throughout the journey." },
  ],
  administrator: [
    { path: "/dashboard", targets: ["dashboard-filters"], eyebrow: "Governance overview", title: "Monitor enterprise adoption", description: "Administrators begin with the enterprise view to identify completion risks before changing governed content.", action: "Next: open imports" },
    { path: "/admin/imports", targets: ["import-upload"], eyebrow: "Master data import", title: "Select the approved workbook", description: "Only approved .xlsx workbooks under 25 MB can enter the governed import workflow.", action: "Next: follow validation" },
    { path: "/admin/imports", targets: ["import-steps"], eyebrow: "Protected workflow", title: "Inspect, map, validate, and confirm", description: "The six-step process exposes warnings, blocks invalid records, and requires explicit confirmation before changes are applied.", action: "Next: review audit history" },
    { path: "/admin/imports", targets: ["import-history"], eyebrow: "Auditability", title: "Trace every completed import", description: "Import history records the filename, administrator, time, result counts, and unique audit reference.", action: "Next: manage requirements" },
    { path: "/admin/requirements", targets: ["requirement-filters"], eyebrow: "Governed content", title: "Find master requirements", description: "Search and filter by ID, title, section, and publishing state before editing protected content.", action: "Next: add or publish content" },
    { path: "/admin/requirements", targets: ["add-requirement"], eyebrow: "Master authoring", title: "Create and version requirements", description: "Add unique requirement IDs, maintain versions and sections, then publish or return records to draft through governed actions." },
  ],
};

interface GuidedSetupContextValue {
  role: UserRole;
  profile: RoleProfile;
  completed: boolean;
  skipped: boolean;
  progress: number;
  totalSteps: number;
  changeRole: (role: UserRole, openWelcome?: boolean) => void;
  startTour: (role?: UserRole, fromBeginning?: boolean) => void;
  resetSetup: () => void;
  openWelcome: (role?: UserRole) => void;
  openHelp: () => void;
}

const GuidedSetupContext = createContext<GuidedSetupContextValue | null>(null);
const ROLE_KEY = "ehss-active-role-v1";
const COMPLETED_KEY = "ehss-guided-setup-completed-v1";
const SKIPPED_KEY = "ehss-guided-setup-skipped-v1";
const PROGRESS_KEY = "ehss-guided-setup-progress-v1";
const HIDDEN_KEY = "ehss-guided-setup-reminder-hidden-v1";

function readRole(): UserRole {
  const saved = window.localStorage.getItem(ROLE_KEY);
  return saved === "enterprise-viewer" || saved === "administrator" ? saved : "site-contributor";
}

function readRoleMap(): Partial<Record<UserRole, boolean>> {
  try { return JSON.parse(window.localStorage.getItem(COMPLETED_KEY) ?? "{}"); } catch { return {}; }
}

function readBooleanMap(key: string): Partial<Record<UserRole, boolean>> {
  try { return JSON.parse(window.localStorage.getItem(key) ?? "{}"); } catch { return {}; }
}

function readProgressMap(): Partial<Record<UserRole, number>> {
  try { return JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}"); } catch { return {}; }
}

function firstVisibleTarget(targets: string[]) {
  for (const name of targets) {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
    const visible = elements.find((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    });
    if (visible) return visible;
  }
  return null;
}

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, onEscape: () => void, enabled: boolean) {
  const escapeRef = useRef(onEscape);
  useEffect(() => { escapeRef.current = onEscape; }, [onEscape]);
  useEffect(() => {
    if (!enabled) return;
    const root = ref.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(root.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((item) => !item.hasAttribute("disabled"));
    window.requestAnimationFrame(() => focusable()[0]?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); escapeRef.current(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [enabled, ref]);
}

export function GuidedSetupProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, demoEnabled, passkeyPromptOpen, switchDemoRole } = useAuth();
  const [role, setRole] = useState<UserRole>(readRole);
  const [completedMap, setCompletedMap] = useState(readRoleMap);
  const [skippedMap, setSkippedMap] = useState(() => readBooleanMap(SKIPPED_KEY));
  const [progressMap, setProgressMap] = useState(readProgressMap);
  const [hiddenMap, setHiddenMap] = useState(() => readBooleanMap(HIDDEN_KEY));
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [finishedRole, setFinishedRole] = useState<UserRole | null>(null);
  const steps = tours[role];
  const step = steps[stepIndex];

  useEffect(() => { window.localStorage.setItem(ROLE_KEY, role); }, [role]);
  useEffect(() => { window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(completedMap)); }, [completedMap]);
  useEffect(() => { window.localStorage.setItem(SKIPPED_KEY, JSON.stringify(skippedMap)); }, [skippedMap]);
  useEffect(() => { window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressMap)); }, [progressMap]);
  useEffect(() => { window.localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenMap)); }, [hiddenMap]);

  useEffect(() => {
    if (user && user.role !== role) setRole(user.role);
  }, [role, user]);

  useEffect(() => {
    if (!user || passkeyPromptOpen || completedMap[role] || skippedMap[role]) return;
    const timer = window.setTimeout(() => setWelcomeOpen(true), 450);
    return () => window.clearTimeout(timer);
  }, [completedMap, passkeyPromptOpen, role, skippedMap, user]);

  useEffect(() => {
    if (user) return;
    setWelcomeOpen(false);
    setHelpOpen(false);
    setTourActive(false);
    setFinishedRole(null);
  }, [user]);

  useEffect(() => {
    if (!tourActive || !step) return;
    if (location.pathname !== step.path) navigate(step.path);
  }, [location.pathname, navigate, step, tourActive]);

  useLayoutEffect(() => {
    if (!tourActive || !step || location.pathname !== step.path) { setTargetRect(null); return; }
    let frame = 0;
    let settleTimer = 0;
    const update = () => {
      const target = firstVisibleTarget(step.targets);
      if (!target) { setTargetRect(null); return; }
      const rect = target.getBoundingClientRect();
      if (rect.top < 72 || rect.bottom > window.innerHeight - 80) target.scrollIntoView({ behavior: "smooth", block: "center" });
      frame = window.requestAnimationFrame(() => setTargetRect(target.getBoundingClientRect()));
      settleTimer = window.setTimeout(() => setTargetRect(target.getBoundingClientRect()), 360);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(settleTimer); window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [location.pathname, step, tourActive]);

  function changeRole(nextRole: UserRole, openWelcome = false) {
    if (!demoEnabled) return;
    switchDemoRole(nextRole);
    setRole(nextRole);
    setTourActive(false);
    setHelpOpen(false);
    setFinishedRole(null);
    setWelcomeOpen(openWelcome);
    navigate(roleProfiles[nextRole].home);
  }

  function startTour(nextRole = role, fromBeginning = true) {
    const nextIndex = fromBeginning ? 0 : Math.min(progressMap[nextRole] ?? 0, tours[nextRole].length - 1);
    setRole(nextRole);
    setStepIndex(nextIndex);
    setWelcomeOpen(false);
    setHelpOpen(false);
    setFinishedRole(null);
    setHiddenMap((current) => ({ ...current, [nextRole]: false }));
    setTourActive(true);
    navigate(tours[nextRole][nextIndex].path);
  }

  function openWelcome(nextRole = role) {
    setRole(nextRole); setHelpOpen(false); setTourActive(false); setWelcomeOpen(true);
  }

  function skipSetup() {
    setTourActive(false); setWelcomeOpen(false);
    setSkippedMap((current) => ({ ...current, [role]: true }));
    setProgressMap((current) => ({ ...current, [role]: stepIndex }));
  }

  function nextStep() {
    const next = stepIndex + 1;
    if (next >= steps.length) {
      setTourActive(false);
      setCompletedMap((current) => ({ ...current, [role]: true }));
      setSkippedMap((current) => ({ ...current, [role]: false }));
      setProgressMap((current) => ({ ...current, [role]: steps.length }));
      setFinishedRole(role);
      return;
    }
    setStepIndex(next);
    setProgressMap((current) => ({ ...current, [role]: next }));
  }

  function resetSetup() {
    setTourActive(false);
    setWelcomeOpen(false);
    setFinishedRole(null);
    setCompletedMap((current) => ({ ...current, [role]: false }));
    setSkippedMap((current) => ({ ...current, [role]: false }));
    setProgressMap((current) => ({ ...current, [role]: 0 }));
    setHiddenMap((current) => ({ ...current, [role]: false }));
    setStepIndex(0);
  }

  const contextValue: GuidedSetupContextValue = {
    role,
    profile: roleProfiles[role],
    completed: Boolean(completedMap[role]),
    skipped: Boolean(skippedMap[role]),
    progress: completedMap[role] ? steps.length : progressMap[role] ?? 0,
    totalSteps: steps.length,
    changeRole,
    startTour,
    resetSetup,
    openWelcome,
    openHelp: () => setHelpOpen(true),
  };

  const showReminder = Boolean(user) && !passkeyPromptOpen && !completedMap[role] && Boolean(skippedMap[role]) && !hiddenMap[role] && !tourActive && !welcomeOpen && !helpOpen;

  return (
    <GuidedSetupContext.Provider value={contextValue}>
      {children}
      {welcomeOpen && <WelcomeDialog role={role} canChangeRole={demoEnabled} onRoleChange={(nextRole) => changeRole(nextRole, true)} onStart={() => startTour(role, true)} onSkip={skipSetup} />}
      {helpOpen && <HelpDialog currentRole={role} canChangeRole={demoEnabled} onClose={() => setHelpOpen(false)} onStart={(nextRole) => startTour(nextRole, true)} />}
      {tourActive && step && <Coachmark step={step} stepIndex={stepIndex} total={steps.length} targetRect={targetRect} onBack={() => setStepIndex((current) => Math.max(0, current - 1))} onNext={nextStep} onSkip={skipSetup} />}
      {showReminder && <SetupReminder role={role} progress={progressMap[role] ?? 0} total={steps.length} onContinue={() => startTour(role, false)} onDismiss={() => setHiddenMap((current) => ({ ...current, [role]: true }))} />}
      {finishedRole && <CompletionDialog role={finishedRole} onClose={() => setFinishedRole(null)} onReplay={() => startTour(finishedRole, true)} />}
    </GuidedSetupContext.Provider>
  );
}

function WelcomeDialog({ role, canChangeRole, onRoleChange, onStart, onSkip }: { role: UserRole; canChangeRole: boolean; onRoleChange: (role: UserRole) => void; onStart: () => void; onSkip: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, onSkip, true);
  const profile = roleProfiles[role];
  return <div className="setup-layer"><div className="setup-backdrop" /><section ref={ref} className="setup-welcome" role="dialog" aria-modal="true" aria-labelledby="setup-welcome-title">
    <div className="setup-welcome__visual"><span><Sparkles size={28} /></span><div className="setup-welcome__visual-line" /><div className="setup-welcome__visual-cards"><span /><span /><span /></div></div>
    <div className="setup-welcome__content"><span className="setup-kicker"><PlayCircle size={16} /> Guided setup</span><h1 id="setup-welcome-title">Welcome to your EHS&S workspace</h1><p>The setup highlights each important control and moves to the next page for you. It takes about two minutes.</p><div className="setup-role-current"><span className="avatar">{profile.initials}</span><div><small>Signed in as</small><strong>{profile.name}</strong><span>{profile.label} · {profile.scope}</span></div></div>{canChangeRole && <div className="setup-role-picker"><span>Your role</span><div>{[profile].map((item) => { const Icon = item.icon; return <button key={item.id} className="setup-role-option--selected" onClick={() => onRoleChange(item.id)} aria-pressed="true"><Icon size={18} /><span><strong>{item.shortLabel}</strong><small>{tours[item.id].length} steps</small></span><Check size={16} /></button>; })}</div></div>}<div className="setup-welcome__actions"><Button variant="tertiary" onClick={onSkip}>Skip setup</Button><Button variant="primary" icon={<PlayCircle size={18} />} onClick={onStart}>Start guided setup</Button></div></div>
  </section></div>;
}

function Coachmark({ step, stepIndex, total, targetRect, onBack, onNext, onSkip }: { step: TourStep; stepIndex: number; total: number; targetRect: DOMRect | null; onBack: () => void; onNext: () => void; onSkip: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, onSkip, true);
  const width = Math.min(390, window.innerWidth - 32);
  let top = targetRect ? targetRect.bottom + 14 : window.innerHeight / 2 - 140;
  if (top + 300 > window.innerHeight) top = targetRect ? Math.max(16, targetRect.top - 300) : 16;
  const left = targetRect ? Math.min(Math.max(16, targetRect.left), window.innerWidth - width - 16) : (window.innerWidth - width) / 2;
  const cardStyle = { "--tour-top": `${top}px`, "--tour-left": `${left}px`, "--tour-width": `${width}px` } as CSSProperties;
  return <div className="tour-layer" aria-live="polite">{targetRect && <div className="tour-spotlight" style={{ top: targetRect.top - 7, left: targetRect.left - 7, width: targetRect.width + 14, height: targetRect.height + 14 }} />}<section ref={ref} className="tour-card" style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="tour-step-title"><div className="tour-card__top"><span>{step.eyebrow}</span><button onClick={onSkip}>Skip setup</button></div><div className="tour-card__progress"><span>Step {stepIndex + 1} of {total}</span><ProgressBar value={Math.round(((stepIndex + 1) / total) * 100)} /></div><h2 id="tour-step-title">{step.title}</h2><p>{step.description}</p><div className="tour-card__footer"><Button variant="tertiary" size="compact" icon={<ChevronLeft size={17} />} onClick={onBack} disabled={stepIndex === 0}>Back</Button><Button variant="primary" size="compact" onClick={onNext} icon={<ChevronRight size={17} />} iconPosition="end">{stepIndex === total - 1 ? "Finish setup" : step.action ?? "Next"}</Button></div></section></div>;
}

function SetupReminder({ role, progress, total, onContinue, onDismiss }: { role: UserRole; progress: number; total: number; onContinue: () => void; onDismiss: () => void }) {
  return <aside className="setup-reminder" aria-label="Guided setup reminder"><span className="setup-reminder__icon"><Settings2 size={20} /></span><div><strong>Continue {roleProfiles[role].shortLabel.toLowerCase()} setup</strong><span>{Math.min(progress + 1, total)} of {total} steps ready</span></div><Button variant="primary" size="compact" onClick={onContinue}>Continue</Button><IconButton label="Dismiss setup reminder" onClick={onDismiss}><X size={17} /></IconButton></aside>;
}

function HelpDialog({ currentRole, canChangeRole, onClose, onStart }: { currentRole: UserRole; canChangeRole: boolean; onClose: () => void; onStart: (role: UserRole) => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, onClose, true);
  const availableProfiles = (Object.values(roleProfiles) as RoleProfile[]).filter((profile) => canChangeRole || profile.id === currentRole);
  return <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Close help" onClick={onClose} /><section ref={ref} className="dialog dialog--wide help-center" role="dialog" aria-modal="true" aria-labelledby="help-center-title"><div className="dialog__header"><div><p className="eyebrow">Help and learning</p><h2 id="help-center-title">How each user works</h2></div><IconButton label="Close help" onClick={onClose}><X size={20} /></IconButton></div><div className="help-center__intro"><CircleHelp size={22} /><p>{canChangeRole ? "Choose a role to replay its guided journey. In production, the assigned role and authorized scope come from sign-in." : "Replay the guided journey for your assigned role and authorized scope."}</p></div><div className="help-role-grid">{availableProfiles.map((profile) => { const Icon = profile.icon; return <article className={cx(currentRole === profile.id && "help-role-card--current")} key={profile.id}><span className="help-role-card__icon"><Icon size={22} /></span><div><p>{currentRole === profile.id ? "Current role" : "Role journey"}</p><h3>{profile.label}</h3><span>{profile.description}</span></div><Button variant={currentRole === profile.id ? "primary" : "secondary"} size="compact" icon={<PlayCircle size={16} />} onClick={() => onStart(profile.id)}>Start {profile.shortLabel.toLowerCase()} tour</Button></article>; })}</div><div className="dialog__footer"><a className="button button--tertiary button--default" href="mailto:ehss-support@example.com?subject=EHS%26S%20application%20support"><CircleHelp size={17} /><span>Contact support</span></a><Button variant="secondary" onClick={onClose}>Close</Button></div></section></div>;
}

function CompletionDialog({ role, onClose, onReplay }: { role: UserRole; onClose: () => void; onReplay: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, onClose, true);
  const profile = roleProfiles[role];
  const article = role === "site-contributor" ? "a" : "an";
  return <div className="setup-layer"><div className="setup-backdrop" /><section ref={ref} className="setup-complete" role="dialog" aria-modal="true" aria-labelledby="setup-complete-title"><span className="setup-complete__icon"><Check size={30} /></span><p className="eyebrow">Setup complete</p><h2 id="setup-complete-title">You’re ready to work as {article} {profile.shortLabel.toLowerCase()}</h2><p>{profile.description}</p><div><Button variant="tertiary" onClick={onReplay}>Replay setup</Button><Button variant="primary" onClick={onClose}>Go to workspace</Button></div></section></div>;
}

export function useGuidedSetup() {
  const value = useContext(GuidedSetupContext);
  if (!value) throw new Error("useGuidedSetup must be used within GuidedSetupProvider");
  return value;
}
