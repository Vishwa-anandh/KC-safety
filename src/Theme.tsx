/* eslint-disable react-refresh/only-export-components */
import { Gauge, Laptop, Minus, Moon, Sun } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cx } from "./utils";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";
export type MotionPreference = "system" | "reduced" | "full";

interface ThemeContextValue {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  motionPreference: MotionPreference;
  reducedMotion: boolean;
  setMotionPreference: (preference: MotionPreference) => void;
}

const THEME_KEY = "ehss-theme";
const MOTION_KEY = "ehss-motion";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPreference(): ThemePreference {
  const saved = window.localStorage.getItem(THEME_KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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
    if (motionPreference === "system") window.localStorage.removeItem(MOTION_KEY);
    else window.localStorage.setItem(MOTION_KEY, motionPreference);
    document.documentElement.dataset.motion = reducedMotion ? "reduced" : "full";
    document.documentElement.dataset.motionPreference = motionPreference;
  }, [motionPreference, reducedMotion]);

  const value = useMemo(() => ({ preference, resolvedTheme, setPreference, motionPreference, reducedMotion, setMotionPreference }), [motionPreference, preference, reducedMotion, resolvedTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const motionOptions: Array<{ value: MotionPreference; label: string; detail: string; icon: typeof Gauge }> = [
  { value: "system", label: "System", detail: "Match this device", icon: Laptop },
  { value: "reduced", label: "Reduced", detail: "Minimize movement", icon: Minus },
  { value: "full", label: "Standard", detail: "Use standard motion", icon: Gauge },
];

export function MotionSelector() {
  const { motionPreference, setMotionPreference } = useTheme();
  return (
    <div className="theme-selector motion-selector" role="radiogroup" aria-label="Motion preference">
      {motionOptions.map((option) => {
        const Icon = option.icon;
        return <button key={option.value} type="button" className={cx("theme-choice", motionPreference === option.value && "theme-choice--selected")} role="radio" aria-checked={motionPreference === option.value} onClick={() => setMotionPreference(option.value)}><Icon size={18} /><span><strong>{option.label}</strong><small>{option.detail}</small></span></button>;
      })}
    </div>
  );
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
    <div className={cx("theme-selector", compact && "theme-selector--compact")} role="radiogroup" aria-label="Color theme">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            className={cx("theme-choice", preference === option.value && "theme-choice--selected")}
            role="radio"
            aria-checked={preference === option.value}
            onClick={() => setPreference(option.value)}
          >
            <Icon size={18} />
            <span><strong>{option.label}</strong>{!compact && <small>{option.detail}</small>}</span>
          </button>
        );
      })}
    </div>
  );
}
