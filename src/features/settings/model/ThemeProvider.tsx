/* eslint-disable react-refresh/only-export-components */
import { Check, Laptop, Moon, Sun } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cx } from "../../../shared/utils";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";
export type MotionPreference = "system" | "reduced" | "full";
/** Accent palette. "signature" is the original sky-blue scale; "kc-brand" is the deeper
 *  Kimberly-Clark logo blue. Both drive the same --kc-* / --brand-* tokens. */
export type AccentPreference = "signature" | "kc-brand";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  motionPreference: MotionPreference;
  reducedMotion: boolean;
  setMotionPreference: (preference: MotionPreference) => void;
  accent: AccentPreference;
  setAccent: (accent: AccentPreference) => void;
}

const THEME_KEY = "ehss-theme";
const MOTION_KEY = "ehss-motion";
const ACCENT_KEY = "ehss-accent";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPreference(): ThemePreference {
  const saved = window.localStorage.getItem(THEME_KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readAccent(): AccentPreference {
  return window.localStorage.getItem(ACCENT_KEY) === "kc-brand" ? "kc-brand" : "signature";
}

function readMotionPreference(): MotionPreference {
  const saved = window.localStorage.getItem(MOTION_KEY);
  return saved === "reduced" || saved === "full" ? saved : "system";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystemTheme);
  const [motionPreference, setMotionPreference] = useState<MotionPreference>(readMotionPreference);
  const [systemReducedMotion, setSystemReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [accent, setAccent] = useState<AccentPreference>(readAccent);
  const resolvedTheme = preference === "system" ? systemTheme : preference;
  const reducedMotion = motionPreference === "system" ? systemReducedMotion : motionPreference === "reduced";

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (event: MediaQueryListEvent | MediaQueryList) => setSystemTheme(event.matches ? "dark" : "light");
    update(query);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (event: MediaQueryListEvent | MediaQueryList) => setSystemReducedMotion(event.matches);
    update(query);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (preference === "system") window.localStorage.removeItem(THEME_KEY);
    else window.localStorage.setItem(THEME_KEY, preference);
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themePreference = preference;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolvedTheme === "dark" ? "#0c2a3e" : "#f8fafc");
  }, [preference, resolvedTheme]);

  useEffect(() => {
    // The default palette leaves the attribute off entirely, so the base :root tokens apply
    // unchanged and only the opt-in accent needs an override block.
    if (accent === "signature") {
      window.localStorage.removeItem(ACCENT_KEY);
      delete document.documentElement.dataset.accent;
    } else {
      window.localStorage.setItem(ACCENT_KEY, accent);
      document.documentElement.dataset.accent = accent;
    }
  }, [accent]);

  useEffect(() => {
    if (motionPreference === "system") window.localStorage.removeItem(MOTION_KEY);
    else window.localStorage.setItem(MOTION_KEY, motionPreference);
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
    document.documentElement.dataset.motionPreference = motionPreference;
  }, [motionPreference, reducedMotion]);

  const value = useMemo(() => ({ preference, resolvedTheme, setPreference, motionPreference, reducedMotion, setMotionPreference, accent, setAccent }), [accent, motionPreference, preference, reducedMotion, resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

const options: Array<{ value: ThemePreference; label: string; detail: string; icon: typeof Laptop }> = [
  { value: "system", label: "System", detail: "Match this device", icon: Laptop },
  { value: "light", label: "Light", detail: "Always use light", icon: Sun },
  { value: "dark", label: "Dark", detail: "Always use dark", icon: Moon },
];

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { preference, setPreference } = useTheme();
  return (
    <div className={cx("theme-selector grid grid-cols-1 gap-2 sm:grid-cols-3", compact && "theme-selector--compact gap-1.5 sm:grid-cols-3")} role="radiogroup" aria-label="Color theme">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            className={cx("theme-choice flex min-h-14 min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-left text-slate-600 transition-colors hover:border-kc-blue-300 hover:bg-kc-blue-50 hover:text-kc-blue-800 active:scale-95 sm:min-h-17 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-kc-blue-700 dark:hover:bg-kc-blue-950 dark:hover:text-kc-blue-200", compact && "min-h-10 justify-center gap-1.5 rounded-lg p-2 sm:min-h-10", preference === option.value && "theme-choice--selected border-kc-blue-500 bg-kc-blue-50 text-kc-blue-800 ring-2 ring-kc-blue-100 dark:border-kc-blue-400 dark:bg-kc-blue-950 dark:text-kc-blue-200 dark:ring-kc-blue-900")}
            role="radio"
            aria-checked={preference === option.value}
            onClick={() => setPreference(option.value)}
          >
            <Icon size={18} />
            <span className={cx("grid min-w-0")}><strong className={cx("text-sm")}>{option.label}</strong>{!compact && <small className={cx("text-xs text-slate-500 dark:text-slate-400")}>{option.detail}</small>}</span>
          </button>
        );
      })}
    </div>
  );
}

const accentOptions: Array<{ value: AccentPreference; label: string; detail: string; swatch: string }> = [
  { value: "signature", label: "Signature blue", detail: "The original application palette", swatch: "#2178b2" },
  { value: "kc-brand", label: "KC brand blue", detail: "Matches the Kimberly-Clark logo", swatch: "#0047bb" },
];

export function AccentSelector() {
  const { accent, setAccent } = useTheme();
  return (
    <div className={cx("accent-selector grid gap-2")} role="radiogroup" aria-label="Accent colour">
      {accentOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx("accent-choice flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-slate-700 transition-colors hover:border-kc-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-kc-blue-700", accent === option.value && "accent-choice--selected border-kc-blue-600 bg-kc-blue-50 text-kc-blue-800 dark:border-kc-blue-400 dark:bg-kc-blue-950 dark:text-kc-blue-200")}
          role="radio"
          aria-checked={accent === option.value}
          onClick={() => setAccent(option.value)}
        >
          <span className={cx("accent-choice__swatch size-6.5 shrink-0 rounded-lg border border-slate-900/10")} style={{ background: option.swatch }} aria-hidden="true" />
          <span className={cx("grid min-w-0 flex-1")}><strong className={cx("text-sm")}>{option.label}</strong><small className={cx("text-xs text-slate-500 dark:text-slate-400")}>{option.detail}</small></span>
          {accent === option.value && <Check size={17} className={cx("shrink-0 text-kc-blue-700 dark:text-kc-blue-300")} />}
        </button>
      ))}
    </div>
  );
}
