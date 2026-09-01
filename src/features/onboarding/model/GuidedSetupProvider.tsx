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
    description: "Validates governed workbooks, reviews detailed audit history, and creates, edits, and publishes master requirements.",
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
    { path: "/assessment", targets: ["assessment-next-incomplete", "assessment-sections"], eyebrow: "Self-assessment", title: "Work through requirements in priority order", description: "Select No, Partial, or Yes. No and Partial automatically create an in-app corrective action that you can maintain here or in Actions summary.", action: "Next: review actions" },
    { path: "/actions", targets: ["actions-filters", "actions-table"], eyebrow: "Corrective actions", title: "Track every assessment gap", description: "No and Partial responses appear here automatically. Maintain each action's description, owner, status, and follow-up without a separate tracker." },
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
    { path: "/admin/requirements", targets: ["add-requirement"], eyebrow: "Master authoring", title: "Create governed requirements", description: "Add unique requirement IDs, maintain questions and expected evidence, then publish or return records to draft with every change recorded." },
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
  return <div className={cx("setup-layer [position:fixed] [z-index:180] [inset:0] [display:grid] [place-items:center] [padding:1rem] max-[620px]:[align-items:end] max-[620px]:[padding:0]")}><div className={cx("setup-backdrop [position:absolute] [inset:0] [background:rgb(2_13_25_/_0.64)] [backdrop-filter:blur(8px)] [animation:setup-fade-in_180ms_ease-out]")} /><section ref={ref} className={cx("setup-welcome [position:relative] [display:grid] [width:min(900px,_calc(100vw_-_2rem))] [max-height:calc(100vh_-_2rem)] [overflow:hidden_auto] [grid-template-columns:minmax(270px,_0.8fr)_minmax(420px,_1.2fr)] [border:1px_solid_var(--border-glass)] [border-radius:28px] [background:var(--surface-elevated)] [box-shadow:0_28px_90px_rgb(2_13_25_/_0.35)] [animation:dialog-in_220ms_ease-out] [&_h1]:[margin-top:1rem] [&_h1]:[color:var(--neutral-950)] [&_h1]:[font-size:clamp(1.65rem,_3vw,_2.25rem)] [&_h1]:[line-height:1.08] [&_h1]:[letter-spacing:-0.04em] max-[900px]:[grid-template-columns:1fr] max-[620px]:[width:100%] max-[620px]:[max-height:calc(100vh_-_1rem)] max-[620px]:[border-right:0] max-[620px]:[border-bottom:0] max-[620px]:[border-left:0] max-[620px]:[border-radius:24px_24px_0_0]")} role="dialog" aria-modal="true" aria-labelledby="setup-welcome-title">
    <div className={cx("setup-welcome__visual [position:relative] [display:grid] [min-height:610px] [place-items:center] [align-content:center] [overflow:hidden] [background:radial-gradient(circle_at_18%_20%,_rgb(76_170_228_/_0.38),_transparent_31%),_radial-gradient(circle_at_80%_75%,_rgb(126_211_192_/_0.25),_transparent_34%),_linear-gradient(150deg,_#073b5c,_#0b577c_55%,_#0b6a7c)] [padding:2rem] before:[position:absolute] before:[width:240px] before:[height:240px] before:[border:1px_solid_rgb(255_255_255_/_0.14)] before:[border-radius:50%] before:[content:''] after:[position:absolute] after:[width:240px] after:[height:240px] after:[border:1px_solid_rgb(255_255_255_/_0.14)] after:[border-radius:50%] after:[content:''] before:[top:-90px] before:[right:-90px] after:[bottom:-110px] after:[left:-90px] [&_>_span]:[position:relative] [&_>_span]:[z-index:1] [&_>_span]:[display:grid] [&_>_span]:[width:78px] [&_>_span]:[height:78px] [&_>_span]:[place-items:center] [&_>_span]:[border:1px_solid_rgb(255_255_255_/_0.38)] [&_>_span]:[border-radius:24px] [&_>_span]:[background:rgb(255_255_255_/_0.14)] [&_>_span]:[box-shadow:inset_0_1px_0_rgb(255_255_255_/_0.25),_0_20px_45px_rgb(0_0_0_/_0.18)] [&_>_span]:[color:white] [&_>_span]:[backdrop-filter:blur(16px)] max-[900px]:[display:none]")}><span><Sparkles size={28} /></span><div className={cx("setup-welcome__visual-line [width:2px] [height:54px] [background:linear-gradient(rgb(255_255_255_/_0.45),_rgb(255_255_255_/_0.08))]")} /><div className={cx("setup-welcome__visual-cards [position:relative] [z-index:1] [display:grid] [width:min(270px,_100%)] [gap:0.65rem] [&_span]:[display:block] [&_span]:[height:72px] [&_span]:[border:1px_solid_rgb(255_255_255_/_0.2)] [&_span]:[border-radius:16px] [&_span]:[background:linear-gradient(105deg,_rgb(255_255_255_/_0.18),_rgb(255_255_255_/_0.07))] [&_span]:[box-shadow:inset_0_1px_0_rgb(255_255_255_/_0.12)] [&_span]:[backdrop-filter:blur(12px)] [&_span:nth-child(2)]:[margin-left:1.5rem] [&_span:nth-child(3)]:[margin-right:1.25rem]")}><span /><span /><span /></div></div>
    <div className={cx("setup-welcome__content [display:flex] [min-width:0] [flex-direction:column] [padding:2rem] [&_>_p]:[margin-top:0.75rem] [&_>_p]:[color:var(--neutral-600)] [&_>_p]:[font-size:0.88rem] [&_>_p]:[line-height:1.6] max-[620px]:[padding:1.25rem_1rem_calc(1.25rem_+_env(safe-area-inset-bottom))]")}><span className={cx("setup-kicker [display:inline-flex] [width:fit-content] [align-items:center] [gap:0.38rem] [border-radius:999px] [background:var(--kc-50)] [color:var(--kc-800)] [padding:0.35rem_0.6rem] [font-size:0.7rem] [font-weight:720]")}><PlayCircle size={16} /> Guided setup</span><h1 id="setup-welcome-title">Welcome to Maitsys Assure</h1><p>The setup highlights each important control and moves to the next page for you. It takes about two minutes.</p><div className={cx("setup-role-current [display:flex] [align-items:center] [gap:0.75rem] [margin-top:1.1rem] [border:1px_solid_var(--kc-200)] [border-radius:14px] [background:var(--kc-50)] [padding:0.75rem] [&_>_div]:[display:grid] [&_>_div]:[min-width:0] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.65rem] [&_strong]:[color:var(--neutral-900)] [&_strong]:[font-size:0.84rem] [&_div_>_span]:[overflow:hidden] [&_div_>_span]:[color:var(--neutral-600)] [&_div_>_span]:[font-size:0.7rem] [&_div_>_span]:[text-overflow:ellipsis] [&_div_>_span]:[white-space:nowrap]")}><span className={cx("avatar [display:inline-grid] [width:38px] [height:38px] [flex:0_0_38px] [place-items:center] [border:1px_solid_var(--kc-200)] [border-radius:50%] [background:linear-gradient(145deg,_var(--kc-100),_var(--surface-elevated))] [color:var(--kc-800)] [font-size:0.72rem] [font-weight:750] max-[740px]:[width:36px] max-[740px]:[height:36px] max-[740px]:[flex-basis:36px]")}>{profile.initials}</span><div><small>Signed in as</small><strong>{profile.name}</strong><span>{profile.label} · {profile.scope}</span></div></div>{canChangeRole && <div className={cx("setup-role-picker [display:grid] [gap:0.5rem] [margin-top:1rem] [&_>_span]:[color:var(--neutral-700)] [&_>_span]:[font-size:0.7rem] [&_>_span]:[font-weight:700] [&_>_div]:[display:grid] [&_>_div]:[grid-template-columns:repeat(3,_minmax(0,_1fr))] [&_>_div]:[gap:0.45rem] [&_button]:[position:relative] [&_button]:[display:grid] [&_button]:[min-width:0] [&_button]:[min-height:92px] [&_button]:[align-content:center] [&_button]:[gap:0.35rem] [&_button]:[border:1px_solid_var(--neutral-200)] [&_button]:[border-radius:13px] [&_button]:[background:var(--surface-panel)] [&_button]:[color:var(--neutral-600)] [&_button]:[padding:0.7rem] [&_button]:[text-align:left] [&_button:hover]:[border-color:var(--kc-300)] [&_button:hover]:[background:var(--kc-50)] [&_button_>_span]:[display:grid] [&_button_>_span]:[min-width:0] [&_strong]:[font-size:0.74rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.63rem] [&_button_>_svg:last-child]:[position:absolute] [&_button_>_svg:last-child]:[top:0.5rem] [&_button_>_svg:last-child]:[right:0.5rem] max-[620px]:[&_>_div]:[grid-template-columns:1fr] max-[620px]:[&_button]:[min-height:58px] max-[620px]:[&_button]:[grid-template-columns:auto_1fr_auto] max-[620px]:[&_button]:[align-items:center] max-[620px]:[&_button]:[align-content:initial] max-[620px]:[&_button_>_svg:last-child]:[position:static]")}><span>Your role</span><div>{[profile].map((item) => { const Icon = item.icon; return <button key={item.id} className={cx("setup-role-option--selected [.setup-role-picker_&]:[border-color:var(--kc-500)] [.setup-role-picker_&]:[background:var(--kc-50)] [.setup-role-picker_&]:[color:var(--kc-800)] [.setup-role-picker_&]:[box-shadow:0_0_0_2px_var(--kc-100)]")} onClick={() => onRoleChange(item.id)} aria-pressed="true"><Icon size={18} /><span><strong>{item.shortLabel}</strong><small>{tours[item.id].length} steps</small></span><Check size={16} /></button>; })}</div></div>}<div className={cx("setup-welcome__actions [display:flex] [justify-content:flex-end] [gap:0.6rem] [margin-top:auto] [padding-top:1.2rem] max-[620px]:[align-items:stretch] max-[620px]:[flex-direction:column-reverse]")}><Button variant="tertiary" onClick={onSkip}>Skip setup</Button><Button variant="primary" icon={<PlayCircle size={18} />} onClick={onStart}>Start guided setup</Button></div></div>
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
  return <div className={cx("tour-layer [position:fixed] [z-index:180] [inset:0] [pointer-events:none]")} aria-live="polite">{targetRect && <div className={cx("tour-spotlight [position:fixed] [z-index:181] [border:2px_solid_#64bff0] [border-radius:16px] [box-shadow:0_0_0_5px_rgb(100_191_240_/_0.22),_0_0_0_9999px_rgb(2_13_25_/_0.68)] [pointer-events:none] [transition:inset_220ms_ease,_top_220ms_ease,_left_220ms_ease,_width_220ms_ease,_height_220ms_ease]")} style={{ top: targetRect.top - 7, left: targetRect.left - 7, width: targetRect.width + 14, height: targetRect.height + 14 }} />}<section ref={ref} className={cx("tour-card [position:fixed] [z-index:182] [top:var(--tour-top)] [left:var(--tour-left)] [width:var(--tour-width)] [border:1px_solid_var(--border-glass)] [border-radius:19px] [background:var(--surface-elevated)] [box-shadow:0_22px_70px_rgb(2_13_25_/_0.32)] [padding:1rem] [pointer-events:auto] [animation:dialog-in_180ms_ease-out] [&_h2]:[margin-top:0.85rem] [&_h2]:[color:var(--neutral-950)] [&_h2]:[font-size:1.16rem] [&_h2]:[line-height:1.2] [&_>_p]:[margin-top:0.45rem] [&_>_p]:[color:var(--neutral-600)] [&_>_p]:[font-size:0.8rem] [&_>_p]:[line-height:1.55] max-[620px]:[top:auto] max-[620px]:[right:0.65rem] max-[620px]:[bottom:calc(78px_+_env(safe-area-inset-bottom))] max-[620px]:[left:0.65rem] max-[620px]:[width:auto] max-[620px]:[border-radius:18px]")} style={cardStyle} role="dialog" aria-modal="true" aria-labelledby="tour-step-title"><div className={cx("tour-card__top [display:flex] [align-items:center] [justify-content:space-between] [gap:0.75rem] [&_>_span]:[color:var(--kc-700)] [&_>_span]:[font-size:0.68rem] [&_>_span]:[font-weight:750] [&_>_button]:[border:0] [&_>_button]:[background:transparent] [&_>_button]:[color:var(--neutral-500)] [&_>_button]:[font-size:0.68rem] [&_>_button]:[font-weight:650] [&_>_button:hover]:[color:var(--neutral-900)]")}><span>{step.eyebrow}</span><button onClick={onSkip}>Skip setup</button></div><div className={cx("tour-card__progress [display:flex] [align-items:center] [justify-content:space-between] [gap:0.75rem] [margin-top:0.65rem] [&_>_span]:[flex:0_0_auto] [&_>_span]:[color:var(--neutral-500)] [&_>_span]:[font-size:0.65rem]")}><span>Step {stepIndex + 1} of {total}</span><ProgressBar value={Math.round(((stepIndex + 1) / total) * 100)} /></div><h2 id="tour-step-title">{step.title}</h2><p>{step.description}</p><div className={cx("tour-card__footer [display:flex] [align-items:center] [justify-content:space-between] [gap:0.75rem] [margin-top:1rem] [border-top:1px_solid_var(--neutral-200)] [padding-top:0.8rem] max-[620px]:[align-items:stretch]")}><Button variant="tertiary" size="compact" icon={<ChevronLeft size={17} />} onClick={onBack} disabled={stepIndex === 0}>Back</Button><Button variant="primary" size="compact" onClick={onNext} icon={<ChevronRight size={17} />} iconPosition="end">{stepIndex === total - 1 ? "Finish setup" : step.action ?? "Next"}</Button></div></section></div>;
}

function SetupReminder({ role, progress, total, onContinue, onDismiss }: { role: UserRole; progress: number; total: number; onContinue: () => void; onDismiss: () => void }) {
  return <aside className={cx("setup-reminder [position:fixed] [z-index:95] [right:1.25rem] [bottom:5.5rem] [display:grid] [width:min(470px,_calc(100vw_-_2rem))] [grid-template-columns:auto_minmax(0,_1fr)_auto_auto] [align-items:center] [gap:0.65rem] [border:1px_solid_var(--kc-200)] [border-radius:16px] [background:var(--surface-translucent)] [box-shadow:var(--shadow-3)] [padding:0.65rem] [backdrop-filter:blur(20px)_saturate(150%)] [animation:dialog-in_180ms_ease-out] [&_>_div]:[display:grid] [&_strong]:[font-size:0.77rem] [&_div_>_span]:[color:var(--neutral-500)] [&_div_>_span]:[font-size:0.66rem] max-[900px]:[bottom:calc(86px_+_env(safe-area-inset-bottom))] max-[620px]:[right:0.65rem] max-[620px]:[bottom:calc(75px_+_env(safe-area-inset-bottom))] max-[620px]:[left:0.65rem] max-[620px]:[width:auto] max-[620px]:[grid-template-columns:auto_minmax(0,_1fr)_auto]")} aria-label="Guided setup reminder"><span className={cx("setup-reminder__icon [display:grid] [width:40px] [height:40px] [place-items:center] [border-radius:11px] [background:var(--kc-50)] [color:var(--kc-700)]")}><Settings2 size={20} /></span><div><strong>Continue {roleProfiles[role].shortLabel.toLowerCase()} setup</strong><span>{Math.min(progress + 1, total)} of {total} steps ready</span></div><Button variant="primary" size="compact" onClick={onContinue}>Continue</Button><IconButton label="Dismiss setup reminder" onClick={onDismiss}><X size={17} /></IconButton></aside>;
}

function HelpDialog({ currentRole, canChangeRole, onClose, onStart }: { currentRole: UserRole; canChangeRole: boolean; onClose: () => void; onStart: (role: UserRole) => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, onClose, true);
  const availableProfiles = (Object.values(roleProfiles) as RoleProfile[]).filter((profile) => canChangeRole || profile.id === currentRole);
  return <div className={cx("dialog-layer [position:fixed] [z-index:100] [inset:0] [display:grid] [place-items:center]")}><button className={cx("dialog-backdrop [position:absolute] [inset:0] [border:0] [background:rgb(2_6_23_/_0.48)] [backdrop-filter:blur(3px)]")} aria-label="Close help" onClick={onClose} /><section ref={ref} className={cx("dialog [position:relative] [width:min(560px,_calc(100%_-_2rem))] [max-height:calc(100vh_-_2rem)] [overflow-y:auto] [border:1px_solid_var(--border-glass)] [border-radius:var(--radius-xl)] [background:var(--surface-elevated)] [box-shadow:var(--shadow-3)] [animation:dialog-in_180ms_ease-out] dialog--wide [width:min(760px,_calc(100%_-_2rem))] help-center")} role="dialog" aria-modal="true" aria-labelledby="help-center-title"><div className={cx("dialog__header [display:flex] [align-items:center] [justify-content:space-between] [gap:1rem] [padding:1rem_1.1rem] [border-bottom:1px_solid_var(--neutral-200)] [&_h2]:[margin-top:0.2rem] [&_h2]:[font-size:1.2rem]")}><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Help and learning</p><h2 id="help-center-title">How each user works</h2></div><IconButton label="Close help" onClick={onClose}><X size={20} /></IconButton></div><div className={cx("help-center__intro [display:flex] [align-items:flex-start] [gap:0.65rem] [margin:1rem_1.1rem_0] [border:1px_solid_var(--kc-200)] [border-radius:12px] [background:var(--kc-50)] [color:var(--kc-800)] [padding:0.75rem] [&_p]:[color:var(--neutral-700)] [&_p]:[font-size:0.76rem] [&_p]:[line-height:1.5]")}><CircleHelp size={22} /><p>{canChangeRole ? "Choose a role to replay its guided journey. In production, the assigned role and authorized scope come from sign-in." : "Replay the guided journey for your assigned role and authorized scope."}</p></div><div className={cx("help-role-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:0.65rem] [padding:1rem_1.1rem] [&_article]:[display:flex] [&_article]:[min-width:0] [&_article]:[flex-direction:column] [&_article]:[align-items:flex-start] [&_article]:[gap:0.65rem] [&_article]:[border:1px_solid_var(--neutral-200)] [&_article]:[border-radius:15px] [&_article]:[background:var(--surface-panel)] [&_article]:[padding:0.85rem] [&_article_>_div]:[display:grid] [&_article_>_div]:[gap:0.2rem] [&_p]:[color:var(--kc-700)] [&_p]:[font-size:0.63rem] [&_p]:[font-weight:720] [&_h3]:[font-size:0.88rem] [&_article_>_div_>_span]:[color:var(--neutral-600)] [&_article_>_div_>_span]:[font-size:0.7rem] [&_article_>_div_>_span]:[line-height:1.45] max-[900px]:[grid-template-columns:1fr] max-[900px]:[&_article]:[display:grid] max-[900px]:[&_article]:[grid-template-columns:auto_minmax(0,_1fr)_auto] max-[900px]:[&_article]:[align-items:center] max-[620px]:[&_article]:[grid-template-columns:auto_minmax(0,_1fr)]")}>{availableProfiles.map((profile) => { const Icon = profile.icon; return <article className={cx(currentRole === profile.id && "help-role-card--current [.help-role-grid_&]:[border-color:var(--kc-400)] [.help-role-grid_&]:[box-shadow:0_0_0_2px_var(--kc-100)]")} key={profile.id}><span className={cx("help-role-card__icon [display:grid] [width:42px] [height:42px] [place-items:center] [border-radius:12px] [background:var(--kc-50)] [color:var(--kc-700)]")}><Icon size={22} /></span><div><p>{currentRole === profile.id ? "Current role" : "Role journey"}</p><h3>{profile.label}</h3><span>{profile.description}</span></div><Button variant={currentRole === profile.id ? "primary" : "secondary"} size="compact" icon={<PlayCircle size={16} />} onClick={() => onStart(profile.id)}>Start {profile.shortLabel.toLowerCase()} tour</Button></article>; })}</div><div className={cx("dialog__footer [display:flex] [align-items:center] [justify-content:flex-end] [gap:1rem] [padding:1rem_1.1rem] [border-top:1px_solid_var(--neutral-200)] max-[740px]:[align-items:stretch] max-[740px]:[flex-direction:column-reverse]")}><a className={cx("button [display:inline-flex] [min-width:0] [align-items:center] [justify-content:center] [gap:0.5rem] [border:1px_solid_transparent] [border-radius:var(--radius-md)] [font-size:0.9rem] [font-weight:650] [line-height:1] [white-space:nowrap] [transition:background_120ms_ease,_border-color_120ms_ease,_box-shadow_120ms_ease,_color_120ms_ease,_transform_80ms_ease] disabled:[background:var(--neutral-100)] disabled:[border-color:var(--neutral-200)] disabled:[color:var(--neutral-400)] disabled:[box-shadow:none] [.question-evidence__editor_>_&]:[justify-self:start] [.question-evidence__attachments-header_>_&]:[flex:0_0_auto] [.site-assessment-area-row_>_&]:[justify-self:end] max-[900px]:[.site-assessment-area-row_>_&]:[grid-column:1_/_-1] max-[900px]:[.site-assessment-area-row_>_&]:[justify-self:stretch] max-[900px]:[.site-assessment-area-row_>_&]:[width:100%] max-[760px]:[.site-assessment-priority_&]:[width:100%] [.action-editor__header_>_&]:[margin-left:auto] max-[1500px]:[.requirement-mobile-toolbar_&:first-child]:[display:none] max-[1100px]:[.requirement-mobile-toolbar_&:first-child]:[display:inline-flex] max-[740px]:[.page-header__actions_&]:[width:100%] max-[740px]:[.overview-callout_&]:[grid-column:1_/_-1] max-[740px]:[.overview-callout_&]:[width:100%] max-[740px]:[.requirement-footer_>_&]:[width:100%] max-[740px]:[.requirement-footer_>_div_&]:[width:100%] max-[740px]:[.dialog__footer_&]:[width:100%] max-[740px]:[.section-drilldown-row_>_&]:[grid-column:1_/_-1] max-[740px]:[.section-drilldown-row_>_&]:[width:100%] max-[740px]:[.import-card__footer_&]:[width:100%] max-[740px]:[.result-state_&]:[width:100%] [.help-role-grid_&]:[width:100%] [.help-role-grid_&]:[margin-top:auto] max-[900px]:[.help-role-grid_&]:[width:auto] max-[620px]:[.setup-welcome__actions_&]:[width:100%] max-[620px]:[.tour-card__footer_&:last-child]:[flex:1] max-[620px]:[.setup-reminder_>_&]:[grid-column:2_/_-1] max-[620px]:[.setup-reminder_>_&]:[grid-row:2] max-[620px]:[.setup-reminder_>_&]:[width:100%] max-[620px]:[.help-role-grid_&]:[grid-column:1_/_-1] max-[620px]:[.help-role-grid_&]:[width:100%] max-[620px]:[.setup-complete_&]:[width:100%] [.passkey-add_&]:[width:100%] [.passkey-setup-message_&]:[flex:0_0_auto] max-[620px]:[.passkey-enrollment-choice_&]:[grid-column:2] max-[620px]:[.passkey-enrollment-choice_&]:[justify-self:start] max-[620px]:[.settings-card--split_>_&]:[width:100%] [.settings-index-empty_&]:[margin-top:0.3rem] max-[620px]:[.session-panel_&]:[grid-column:1_/_-1] max-[620px]:[.session-panel_&]:[width:100%] [.first-login-passkey__complete_&]:[margin-top:0.35rem] max-[620px]:[.first-login-passkey__actions_&]:[width:100%] button--tertiary [background:transparent] [color:var(--kc-700)] [&:hover:not(:disabled)]:[background:var(--kc-50)] [&:hover:not(:disabled)]:[color:var(--kc-900)] button--default [min-height:42px] [padding:0.68rem_1rem]")} href="mailto:ehss-support@example.com?subject=Maitsys%20Assure%20application%20support"><CircleHelp size={17} /><span>Contact support</span></a><Button variant="secondary" onClick={onClose}>Close</Button></div></section></div>;
}

function CompletionDialog({ role, onClose, onReplay }: { role: UserRole; onClose: () => void; onReplay: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, onClose, true);
  const profile = roleProfiles[role];
  const article = role === "site-contributor" ? "a" : "an";
  return <div className={cx("setup-layer [position:fixed] [z-index:180] [inset:0] [display:grid] [place-items:center] [padding:1rem] max-[620px]:[align-items:end] max-[620px]:[padding:0]")}><div className={cx("setup-backdrop [position:absolute] [inset:0] [background:rgb(2_13_25_/_0.64)] [backdrop-filter:blur(8px)] [animation:setup-fade-in_180ms_ease-out]")} /><section ref={ref} className={cx("setup-complete [position:relative] [display:grid] [width:min(500px,_calc(100vw_-_2rem))] [justify-items:center] [border:1px_solid_var(--border-glass)] [border-radius:24px] [background:var(--surface-elevated)] [box-shadow:0_28px_90px_rgb(2_13_25_/_0.35)] [padding:2rem] [text-align:center] [animation:dialog-in_200ms_ease-out] [&_h2]:[margin-top:0.3rem] [&_h2]:[font-size:1.35rem] [&_>_p:not(.eyebrow)]:[margin-top:0.55rem] [&_>_p:not(.eyebrow)]:[color:var(--neutral-600)] [&_>_p:not(.eyebrow)]:[font-size:0.8rem] [&_>_p:not(.eyebrow)]:[line-height:1.5] [&_>_div]:[display:flex] [&_>_div]:[gap:0.6rem] [&_>_div]:[margin-top:1.2rem] max-[620px]:[width:100%] max-[620px]:[border-right:0] max-[620px]:[border-bottom:0] max-[620px]:[border-left:0] max-[620px]:[border-radius:24px_24px_0_0] max-[620px]:[&_>_div]:[width:100%] max-[620px]:[&_>_div]:[flex-direction:column-reverse]")} role="dialog" aria-modal="true" aria-labelledby="setup-complete-title"><span className={cx("setup-complete__icon [display:grid] [width:68px] [height:68px] [place-items:center] [border-radius:50%] [background:var(--success-surface)] [color:var(--success)]")}><Check size={30} /></span><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Setup complete</p><h2 id="setup-complete-title">You’re ready to work as {article} {profile.shortLabel.toLowerCase()}</h2><p>{profile.description}</p><div><Button variant="tertiary" onClick={onReplay}>Replay setup</Button><Button variant="primary" onClick={onClose}>Go to workspace</Button></div></section></div>;
}

export function useGuidedSetup() {
  const value = useContext(GuidedSetupContext);
  if (!value) throw new Error("useGuidedSetup must be used within GuidedSetupProvider");
  return value;
}
