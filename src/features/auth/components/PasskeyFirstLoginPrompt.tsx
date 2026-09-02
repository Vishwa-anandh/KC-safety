import { CheckCircle2, KeyRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../model/AuthProvider";
import { Button, IconButton } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

/*
 * The two entry animations reference keyframes declared globally in tailwind.base.css. Tailwind
 * only ships utilities for its own four keyframe sets, so these stay inline rather than becoming
 * bracket utilities; the reduced-motion overrides in tailwind.base.css still neutralise them.
 */
const backdropAnimation = "setup-fade-in 180ms ease-out";
const dialogAnimation = "dialog-in 220ms ease-out";

export default function PasskeyFirstLoginPrompt() {
  const { user, passkeyPromptOpen, registerPasskey, dismissPasskeyPrompt, finishPasskeyPrompt } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!passkeyPromptOpen) {
      setPending(false);
      setError("");
      setComplete(false);
      return;
    }
    const previous = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => dialogRef.current?.focus());
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) dismissPasskeyPrompt();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')).filter((item) => !item.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => { window.cancelAnimationFrame(frame); document.removeEventListener("keydown", handleKeydown); previous?.focus(); };
  }, [dismissPasskeyPrompt, passkeyPromptOpen, pending]);

  if (!passkeyPromptOpen || !user) return null;

  async function addPasskey() {
    setPending(true);
    setError("");
    try {
      await registerPasskey("This device");
      setComplete(true);
    } catch (passkeyError) {
      setError(passkeyError instanceof Error ? passkeyError.message : "The passkey could not be added.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cx("setup-layer passkey-first-login-layer fixed inset-0 z-230 grid items-end justify-items-center p-0 sm:items-center sm:p-4")}>
      <div
        className={cx("setup-backdrop absolute inset-0 bg-slate-950/65 backdrop-blur-md dark:bg-slate-950/65")}
        style={{ animation: backdropAnimation }}
      />
      <section
        ref={dialogRef}
        className={cx("first-login-passkey relative grid max-h-full w-full max-w-147 gap-4 overflow-x-hidden overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white px-3.5 pt-4 pb-8 shadow-2xl focus:outline-none sm:rounded-3xl sm:border-x sm:border-b sm:p-5 dark:border-slate-700 dark:bg-slate-900")}
        style={{ animation: dialogAnimation }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-login-passkey-title"
        tabIndex={-1}
      >
        {complete ? (
          <div className={cx("first-login-passkey__complete grid justify-items-center gap-2.5 px-3 py-5 text-center")}>
            <span className={cx("grid size-17 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300")}>
              <CheckCircle2 size={31} />
            </span>
            <p className={cx("eyebrow text-sm font-semibold tracking-wide text-kc-blue-700 dark:text-kc-blue-300")}>Passkey added</p>
            <h2 id="first-login-passkey-title" className={cx("text-xl font-bold text-slate-900 dark:text-slate-100")}>Your next sign-in can be faster</h2>
            <p className={cx("max-w-sm text-sm leading-normal text-slate-600 dark:text-slate-400")}>
              This device is now registered for {user.name}. You can rename or remove it later in Settings.
            </p>
            <Button variant="primary" onClick={finishPasskeyPrompt}>Continue to workspace</Button>
          </div>
        ) : (
          <>
            <div className={cx("first-login-passkey__header flex items-start gap-3")}>
              <span className={cx("grid size-11 shrink-0 place-items-center rounded-xl bg-kc-blue-50 text-kc-blue-700 sm:size-12 dark:bg-kc-blue-950 dark:text-kc-blue-300")}>
                <KeyRound size={25} />
              </span>
              <div className={cx("grid min-w-0 flex-1 gap-0.5")}>
                <p className={cx("eyebrow text-sm font-semibold tracking-wide text-kc-blue-700 dark:text-kc-blue-300")}>First sign-in on this browser</p>
                <h2 id="first-login-passkey-title" className={cx("text-lg font-bold text-slate-900 sm:text-xl dark:text-slate-100")}>Would you like to add a passkey?</h2>
              </div>
              <IconButton label="Not now" onClick={dismissPasskeyPrompt} disabled={pending}><X size={19} /></IconButton>
            </div>
            <p className={cx("first-login-passkey__intro text-sm leading-relaxed text-slate-600 dark:text-slate-400")}>
              Use your device unlock, fingerprint, face, phone, or security key for a simpler sign-in next time.
            </p>
            {error && (
              <div className={cx("auth-error rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300")} role="alert">
                {error}
              </div>
            )}
            <div className={cx("first-login-passkey__actions flex flex-col-reverse items-stretch gap-2 border-t border-slate-200 pt-3.5 sm:flex-row sm:justify-end dark:border-slate-700")}>
              <Button variant="tertiary" onClick={dismissPasskeyPrompt} disabled={pending}>Not now</Button>
              <Button variant="primary" icon={<KeyRound size={18} />} onClick={addPasskey} disabled={pending}>{pending ? "Follow your device prompt…" : "Add a passkey"}</Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
