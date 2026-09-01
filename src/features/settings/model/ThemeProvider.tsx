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
    <div className={cx("theme-selector [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:0.55rem] max-[620px]:[&:not(.theme-selector--compact)]:[grid-template-columns:1fr]", compact && "theme-selector--compact [gap:0.35rem] [.profile-menu_&]:[grid-template-columns:repeat(3,_minmax(0,_1fr))]")} role="radiogroup" aria-label="Color theme">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            className={cx("theme-choice [display:flex] [min-width:0] [min-height:70px] [align-items:center] [gap:0.65rem] [border:1px_solid_var(--neutral-200)] [border-radius:13px] [background:var(--surface-panel)] [color:var(--neutral-600)] [padding:0.75rem] [text-align:left] [transition:border-color_140ms_ease,_background_140ms_ease,_color_140ms_ease,_box-shadow_140ms_ease,_transform_100ms_ease] hover:[border-color:var(--kc-300)] hover:[background:var(--kc-50)] hover:[color:var(--kc-800)] [&:active]:[transform:scale(0.985)] [&_>_span]:[display:grid] [&_>_span]:[min-width:0] [&_strong]:[font-size:0.8rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.68rem] [.theme-selector--compact_&]:[min-height:42px] [.theme-selector--compact_&]:[justify-content:center] [.theme-selector--compact_&]:[gap:0.35rem] [.theme-selector--compact_&]:[border-radius:10px] [.theme-selector--compact_&]:[padding:0.5rem] [.theme-selector--compact_&_strong]:[font-size:0.7rem] max-[620px]:[.theme-selector:not(.theme-selector--compact)_&]:[min-height:56px]", preference === option.value && "theme-choice--selected [border-color:var(--kc-500)] [background:var(--kc-50)] [color:var(--kc-800)] [box-shadow:0_0_0_2px_var(--kc-100)]")}
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

const accentOptions: Array<{ value: AccentPreference; label: string; detail: string; swatch: string }> = [
  { value: "signature", label: "Signature blue", detail: "The original application palette", swatch: "#2178b2" },
  { value: "kc-brand", label: "KC brand blue", detail: "Matches the Kimberly-Clark logo", swatch: "#0047bb" },
];

export function AccentSelector() {
  const { accent, setAccent } = useTheme();
  return (
    <div className={cx("accent-selector [display:grid] [gap:0.5rem]")} role="radiogroup" aria-label="Accent colour">
      {accentOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx("accent-choice [display:flex] [align-items:center] [gap:0.7rem] [border:1px_solid_var(--neutral-200)] [border-radius:12px] [background:var(--surface-panel)] [padding:0.7rem_0.85rem] [color:var(--neutral-700)] [text-align:left] [cursor:pointer] hover:[border-color:var(--kc-300)] [&_>_span:nth-child(2)]:[display:grid] [&_>_span:nth-child(2)]:[flex:1] [&_>_span:nth-child(2)]:[min-width:0] [&_strong]:[font-size:0.83rem] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.72rem] [&_>_svg]:[flex:none] [&_>_svg]:[color:var(--kc-700)]", accent === option.value && "accent-choice--selected [border-color:var(--kc-600)] [background:var(--kc-50)] [color:var(--kc-800)]")}
          role="radio"
          aria-checked={accent === option.value}
          onClick={() => setAccent(option.value)}
        >
          <span className={cx("accent-choice__swatch [flex:none] [width:26px] [height:26px] [border:1px_solid_rgb(15_23_42_/_0.12)] [border-radius:8px]")} style={{ background: option.swatch }} aria-hidden="true" />
          <span><strong>{option.label}</strong><small>{option.detail}</small></span>
          {accent === option.value && <Check size={17} />}
        </button>
      ))}
    </div>
  );
}
