/* eslint-disable react-refresh/only-export-components */
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
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
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/model/AuthProvider";
import { Button, eyebrowClasses, IconButton, ProgressBar } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";
import type { UserRole } from "../../../shared/types";

export type { UserRole } from "../../../shared/types";

/**
 * The setup-flow entry animations reference keyframes declared globally in tailwind.base.css.
 * `dialog-in` has a registered `--animate-dialog-in` token at 180ms (used directly as a class
 * below wherever a dialog's own duration matches that), but these three run at custom durations
 * and `setup-fade-in` has no registered token at all, so all three stay inline rather than
 * becoming bracket utilities — the same convention PasskeyFirstLoginPrompt uses for this pair.
 */
const setupBackdropAnimation = "setup-fade-in 180ms ease-out";
const setupDialogAnimation = "dialog-in 220ms ease-out";
const completeDialogAnimation = "dialog-in 200ms ease-out";

/**
 * The welcome visual's layered gradient (radial glows over a diagonal brand gradient) can't be
 * expressed as canonical utilities, so — like LoginScreen's `heroBackground` — it stays a single
 * inline declaration while every other rule on the panel is a canonical utility.
 */
const setupVisualBackground =
  "radial-gradient(circle at 18% 20%, rgb(76 170 228 / 0.38), transparent 31%), radial-gradient(circle at 80% 75%, rgb(126 211 192 / 0.25), transparent 34%), linear-gradient(150deg, #073b5c, #0b577c 55%, #0b6a7c)";

/**
 * Copied verbatim from UI.tsx's buttonBase + buttonVariant.tertiary + buttonSize.default. The
 * "Contact support" control has to be a real `<a href="mailto:...">`, not a `<button>`, so it
 * can't use the shared Button component and needs the same recipe classes reproduced directly.
 */
const supportLinkClasses =
  "button inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-transparent text-sm font-semibold whitespace-nowrap transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800 dark:disabled:text-slate-500 bg-transparent text-kc-blue-700 hover:not-disabled:bg-kc-blue-50 hover:not-disabled:text-kc-blue-900 dark:text-kc-blue-300 dark:hover:not-disabled:bg-kc-blue-950 min-h-10 px-4 py-2.5";

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
  return saved === "administrator" ? saved : "site-contributor";
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
  return (
    <div className={cx("setup-layer fixed inset-0 z-180 grid items-end justify-items-center p-0 sm:items-center sm:p-4")}>
      <div
        className={cx("setup-backdrop absolute inset-0 bg-slate-950/64 backdrop-blur-sm dark:bg-slate-950/64")}
        style={{ animation: setupBackdropAnimation }}
      />
      <section
        ref={ref}
        className={cx(
          "setup-welcome relative grid max-h-full w-full max-w-4xl overflow-x-hidden overflow-y-auto rounded-t-3xl border-t bg-white shadow-2xl sm:rounded-3xl sm:border-x sm:border-b lg:grid-cols-[minmax(270px,0.8fr)_minmax(420px,1.2fr)] dark:bg-slate-900",
        )}
        style={{ animation: setupDialogAnimation, borderColor: "var(--border-glass)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-welcome-title"
      >
        <div
          className={cx("setup-welcome__visual relative hidden min-h-152.5 place-items-center content-center overflow-hidden p-8 lg:grid")}
          style={{ background: setupVisualBackground }}
        >
          <span aria-hidden="true" className={cx("absolute -top-22.5 -right-22.5 size-60 rounded-full border border-white/14")} />
          <span aria-hidden="true" className={cx("absolute -bottom-27.5 -left-22.5 size-60 rounded-full border border-white/14")} />
          <span className={cx("relative z-1 grid size-19.5 place-items-center rounded-3xl border border-white/38 bg-white/14 text-white shadow-lg backdrop-blur-lg inset-shadow-2xs inset-shadow-white/25")}>
            <Sparkles size={28} />
          </span>
          <div
            className={cx("setup-welcome__visual-line h-13.5 w-0.5")}
            style={{ background: "linear-gradient(rgb(255 255 255 / 0.45), rgb(255 255 255 / 0.08))" }}
          />
          <div className={cx("setup-welcome__visual-cards relative z-1 grid w-full max-w-67.5 gap-2.5")}>
            <span
              className={cx("block h-18 rounded-2xl border border-white/20 backdrop-blur-md inset-shadow-2xs inset-shadow-white/12")}
              style={{ background: "linear-gradient(105deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.07))" }}
            />
            <span
              className={cx("ml-6 block h-18 rounded-2xl border border-white/20 backdrop-blur-md inset-shadow-2xs inset-shadow-white/12")}
              style={{ background: "linear-gradient(105deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.07))" }}
            />
            <span
              className={cx("mr-5 block h-18 rounded-2xl border border-white/20 backdrop-blur-md inset-shadow-2xs inset-shadow-white/12")}
              style={{ background: "linear-gradient(105deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.07))" }}
            />
          </div>
        </div>
        <div className={cx("setup-welcome__content flex min-w-0 flex-col px-4 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-8")}>
          <span className={cx("setup-kicker inline-flex w-fit items-center gap-1.5 rounded-full bg-kc-blue-50 px-2.5 py-1 text-xs font-bold text-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")}>
            <PlayCircle size={16} /> Guided setup
          </span>
          <h1 id="setup-welcome-title" className={cx("mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-slate-100")}>
            Welcome to EHS360
          </h1>
          <p className={cx("mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400")}>
            The setup highlights each important control and moves to the next page for you. It takes about two minutes.
          </p>
          <div className={cx("setup-role-current mt-4 flex items-center gap-3 rounded-xl border border-kc-blue-200 bg-kc-blue-50 p-3 dark:border-kc-blue-800 dark:bg-kc-blue-950")}>
            <span className={cx("avatar inline-grid size-9 shrink-0 place-items-center rounded-full border border-kc-blue-200 bg-kc-blue-50 text-xs font-bold text-kc-blue-800 md:size-10 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")}>
              {profile.initials}
            </span>
            <div className={cx("grid min-w-0")}>
              <small className={cx("text-xs text-slate-500 dark:text-slate-400")}>Signed in as</small>
              <strong className={cx("text-sm text-slate-900 dark:text-slate-100")}>{profile.name}</strong>
              <span className={cx("overflow-hidden text-xs text-ellipsis whitespace-nowrap text-slate-600 dark:text-slate-400")}>{profile.label} · {profile.scope}</span>
            </div>
          </div>
          {canChangeRole && (
            <div className={cx("setup-role-picker mt-4 grid gap-2")}>
              <span className={cx("text-xs font-bold text-slate-700 dark:text-slate-300")}>Your role</span>
              <div className={cx("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-3")}>
                {[profile].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={cx(
                        "setup-role-option--selected relative grid min-h-14.5 min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-kc-blue-500 bg-kc-blue-50 p-3 text-left text-kc-blue-800 ring-2 ring-kc-blue-100 sm:min-h-23 sm:grid-cols-1 sm:content-center sm:items-start sm:gap-1.5 dark:border-kc-blue-400 dark:bg-kc-blue-950 dark:text-kc-blue-200 dark:ring-kc-blue-900",
                      )}
                      onClick={() => onRoleChange(item.id)}
                      aria-pressed="true"
                    >
                      <Icon size={18} />
                      <span className={cx("grid min-w-0")}>
                        <strong className={cx("text-sm text-kc-blue-800 dark:text-kc-blue-200")}>{item.shortLabel}</strong>
                        <small className={cx("text-xs text-slate-500 dark:text-slate-400")}>{tours[item.id].length} steps</small>
                      </span>
                      <Check size={16} className={cx("sm:absolute sm:top-2 sm:right-2")} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className={cx("setup-welcome__actions mt-auto flex flex-col-reverse items-stretch justify-end gap-2.5 pt-5 sm:flex-row sm:items-center")}>
            <Button variant="tertiary" onClick={onSkip}>Skip setup</Button>
            <Button variant="primary" icon={<PlayCircle size={18} />} onClick={onStart}>Start guided setup</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Coachmark({ step, stepIndex, total, targetRect, onBack, onNext, onSkip }: { step: TourStep; stepIndex: number; total: number; targetRect: DOMRect | null; onBack: () => void; onNext: () => void; onSkip: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, onSkip, true);
  const isMobile = window.innerWidth < 640;
  const width = Math.min(390, window.innerWidth - 32);
  let top = targetRect ? targetRect.bottom + 14 : window.innerHeight / 2 - 140;
  if (top + 300 > window.innerHeight) top = targetRect ? Math.max(16, targetRect.top - 300) : 16;
  const left = targetRect ? Math.min(Math.max(16, targetRect.left), window.innerWidth - width - 16) : (window.innerWidth - width) / 2;
  return (
    <div className={cx("tour-layer fixed inset-0 z-180 pointer-events-none")} aria-live="polite">
      {targetRect && (
        <div
          className={cx("tour-spotlight fixed z-181 rounded-2xl border-2 border-kc-blue-400 pointer-events-none transition-all duration-200 ease-out dark:border-kc-blue-300")}
          style={{
            top: targetRect.top - 7,
            left: targetRect.left - 7,
            width: targetRect.width + 14,
            height: targetRect.height + 14,
            boxShadow: "0 0 0 5px rgb(100 191 240 / 0.22), 0 0 0 9999px rgb(2 13 25 / 0.68)",
          }}
        />
      )}
      <section
        ref={ref}
        className={cx(
          "tour-card fixed z-182 rounded-2xl border bg-white p-4 pointer-events-auto shadow-2xl animate-dialog-in dark:bg-slate-900",
          isMobile && "right-2.5 bottom-[calc(4.875rem+env(safe-area-inset-bottom))] left-2.5 w-auto",
        )}
        style={isMobile ? { borderColor: "var(--border-glass)" } : { top, left, width, borderColor: "var(--border-glass)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
      >
        <div className={cx("tour-card__top flex items-center justify-between gap-3")}>
          <span className={cx("text-xs font-bold text-kc-blue-700 dark:text-kc-blue-300")}>{step.eyebrow}</span>
          <button
            type="button"
            className={cx("border-0 bg-transparent p-0 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100")}
            onClick={onSkip}
          >
            Skip setup
          </button>
        </div>
        <div className={cx("tour-card__progress mt-2.5 flex items-center justify-between gap-3")}>
          <span className={cx("flex-none text-xs text-slate-500 dark:text-slate-400")}>Step {stepIndex + 1} of {total}</span>
          <ProgressBar value={Math.round(((stepIndex + 1) / total) * 100)} />
        </div>
        <h2 id="tour-step-title" className={cx("mt-3.5 text-lg font-bold text-slate-900 dark:text-slate-100")}>{step.title}</h2>
        <p className={cx("mt-2 text-sm leading-normal text-slate-600 dark:text-slate-400")}>{step.description}</p>
        <div className={cx("tour-card__footer mt-4 flex items-stretch justify-between gap-3 border-t border-slate-200 pt-3 sm:items-center dark:border-slate-700")}>
          <Button variant="tertiary" size="compact" icon={<ChevronLeft size={17} />} onClick={onBack} disabled={stepIndex === 0}>Back</Button>
          <Button variant="primary" size="compact" onClick={onNext} icon={<ChevronRight size={17} />} iconPosition="end" className="flex-1 sm:flex-none">
            {stepIndex === total - 1 ? "Finish setup" : step.action ?? "Next"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function SetupReminder({ role, progress, total, onContinue, onDismiss }: { role: UserRole; progress: number; total: number; onContinue: () => void; onDismiss: () => void }) {
  return (
    <aside
      className={cx(
        "setup-reminder fixed z-95 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 right-2.5 bottom-[calc(4.6875rem+env(safe-area-inset-bottom))] left-2.5 w-auto rounded-2xl border border-kc-blue-200 p-2.5 backdrop-blur-xl backdrop-saturate-150 animate-dialog-in sm:right-5 sm:bottom-[calc(5.375rem+env(safe-area-inset-bottom))] sm:left-auto sm:w-117.5 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] lg:bottom-22 dark:border-kc-blue-800",
      )}
      style={{ background: "var(--surface-translucent)", boxShadow: "var(--shadow-3)" }}
      aria-label="Guided setup reminder"
    >
      <span className={cx("setup-reminder__icon grid size-10 place-items-center rounded-lg bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300")}>
        <Settings2 size={20} />
      </span>
      <div className={cx("grid")}>
        <strong className={cx("text-sm text-slate-900 dark:text-slate-100")}>Continue {roleProfiles[role].shortLabel.toLowerCase()} setup</strong>
        <span className={cx("text-xs text-slate-500 dark:text-slate-400")}>{Math.min(progress + 1, total)} of {total} steps ready</span>
      </div>
      <Button variant="primary" size="compact" onClick={onContinue} className="col-start-2 col-end-4 row-start-2 w-full sm:col-auto sm:row-auto sm:w-auto">Continue</Button>
      <IconButton label="Dismiss setup reminder" onClick={onDismiss} className="col-start-3 row-start-1 sm:col-auto sm:row-auto"><X size={17} /></IconButton>
    </aside>
  );
}

function HelpDialog({ currentRole, canChangeRole, onClose, onStart }: { currentRole: UserRole; canChangeRole: boolean; onClose: () => void; onStart: (role: UserRole) => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, onClose, true);
  const availableProfiles = (Object.values(roleProfiles) as RoleProfile[]).filter((profile) => canChangeRole || profile.id === currentRole);
  return (
    <div className={cx("dialog-layer fixed inset-0 z-100 grid place-items-center p-4")}>
      <button className={cx("dialog-backdrop absolute inset-0 bg-slate-950/48 backdrop-blur-xs")} aria-label="Close help" onClick={onClose} />
      <section
        ref={ref}
        className={cx("dialog dialog--wide help-center relative max-h-full w-full max-w-3xl overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-dialog-in dark:border-slate-700 dark:bg-slate-900")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-center-title"
      >
        <div className={cx("dialog__header flex items-center justify-between gap-4 border-b border-slate-200 px-4.5 py-4 dark:border-slate-700")}>
          <div>
            <p className={cx(eyebrowClasses)}>Help and learning</p>
            <h2 id="help-center-title" className={cx("mt-1 text-xl font-bold text-slate-900 dark:text-slate-100")}>How each user works</h2>
          </div>
          <IconButton label="Close help" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className={cx("help-center__intro mx-4.5 mt-4 flex items-start gap-2.5 rounded-xl border border-kc-blue-200 bg-kc-blue-50 p-3 text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200")}>
          <CircleHelp size={22} />
          <p className={cx("text-sm leading-normal text-slate-700 dark:text-slate-300")}>
            {canChangeRole ? "Choose a role to replay its guided journey. In production, the assigned role and authorized scope come from sign-in." : "Replay the guided journey for your assigned role and authorized scope."}
          </p>
        </div>
        <div className={cx("help-role-grid grid grid-cols-1 gap-2.5 px-4.5 py-4 lg:grid-cols-3")}>
          {availableProfiles.map((profile) => {
            const Icon = profile.icon;
            const isCurrent = currentRole === profile.id;
            return (
              <article
                key={profile.id}
                className={cx(
                  "help-role-card grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] lg:flex lg:flex-col lg:items-start dark:border-slate-700 dark:bg-slate-900",
                  isCurrent && "help-role-card--current border-kc-blue-400 ring-2 ring-kc-blue-100 dark:border-kc-blue-500 dark:ring-kc-blue-900",
                )}
              >
                <span className={cx("help-role-card__icon grid size-10.5 place-items-center rounded-xl bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300")}>
                  <Icon size={22} />
                </span>
                <div className={cx("grid gap-0.5")}>
                  <p className={cx("text-xs font-bold text-kc-blue-700 dark:text-kc-blue-300")}>{isCurrent ? "Current role" : "Role journey"}</p>
                  <h3 className={cx("text-base font-semibold text-slate-900 dark:text-slate-100")}>{profile.label}</h3>
                  <span className={cx("text-xs leading-normal text-slate-600 dark:text-slate-400")}>{profile.description}</span>
                </div>
                <Button
                  variant={isCurrent ? "primary" : "secondary"}
                  size="compact"
                  icon={<PlayCircle size={16} />}
                  onClick={() => onStart(profile.id)}
                  className="mt-auto w-full sm:w-auto lg:w-full"
                >
                  Start {profile.shortLabel.toLowerCase()} tour
                </Button>
              </article>
            );
          })}
        </div>
        <div className={cx("dialog__footer flex flex-col-reverse items-stretch justify-end gap-4 border-t border-slate-200 px-4.5 py-4 md:flex-row md:items-center dark:border-slate-700")}>
          <a className={cx(supportLinkClasses)} href="mailto:ehss-support@example.com?subject=EHS360%20application%20support">
            <CircleHelp size={17} /><span>Contact support</span>
          </a>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </section>
    </div>
  );
}

function CompletionDialog({ role, onClose, onReplay }: { role: UserRole; onClose: () => void; onReplay: () => void }) {
  const ref = useRef<HTMLElement>(null);
  useFocusTrap(ref, onClose, true);
  const profile = roleProfiles[role];
  const article = role === "site-contributor" ? "a" : "an";
  return (
    <div className={cx("setup-layer fixed inset-0 z-180 grid items-end justify-items-center p-0 sm:items-center sm:p-4")}>
      <div
        className={cx("setup-backdrop absolute inset-0 bg-slate-950/64 backdrop-blur-sm dark:bg-slate-950/64")}
        style={{ animation: setupBackdropAnimation }}
      />
      <section
        ref={ref}
        className={cx(
          "setup-complete relative grid max-h-full w-full max-w-125 justify-items-center overflow-x-hidden overflow-y-auto rounded-t-3xl border-t bg-white p-8 text-center shadow-2xl sm:rounded-3xl sm:border-x sm:border-b dark:bg-slate-900",
        )}
        style={{ animation: completeDialogAnimation, borderColor: "var(--border-glass)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-complete-title"
      >
        <span className={cx("setup-complete__icon grid size-17 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300")}>
          <Check size={30} />
        </span>
        <p className={cx(eyebrowClasses, "mt-4")}>Setup complete</p>
        <h2 id="setup-complete-title" className={cx("mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100")}>You’re ready to work as {article} {profile.shortLabel.toLowerCase()}</h2>
        <p className={cx("mt-2 text-sm leading-normal text-slate-600 dark:text-slate-400")}>{profile.description}</p>
        <div className={cx("flex flex-col-reverse gap-2.5 mt-5 sm:flex-row")}>
          <Button variant="tertiary" onClick={onReplay}>Replay setup</Button>
          <Button variant="primary" onClick={onClose}>Go to workspace</Button>
        </div>
      </section>
    </div>
  );
}

export function useGuidedSetup() {
  const value = useContext(GuidedSetupContext);
  if (!value) throw new Error("useGuidedSetup must be used within GuidedSetupProvider");
  return value;
}
