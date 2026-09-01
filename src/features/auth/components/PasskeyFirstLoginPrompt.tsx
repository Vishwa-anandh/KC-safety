import { CheckCircle2, KeyRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../model/AuthProvider";
import { Button, IconButton } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

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
    <div className={cx("setup-layer [position:fixed] [z-index:180] [inset:0] [display:grid] [place-items:center] [padding:1rem] max-[620px]:[align-items:end] max-[620px]:[padding:0] passkey-first-login-layer [z-index:230] max-[620px]:[align-items:end] max-[620px]:[padding:0]")}>
      <div className={cx("setup-backdrop [position:absolute] [inset:0] [background:rgb(2_13_25_/_0.64)] [backdrop-filter:blur(8px)] [animation:setup-fade-in_180ms_ease-out]")} />
      <section ref={dialogRef} className={cx("first-login-passkey [position:relative] [display:grid] [width:min(590px,_calc(100vw_-_2rem))] [max-height:calc(100vh_-_2rem)] [gap:1rem] [overflow:hidden_auto] [border:1px_solid_var(--border-glass)] [border-radius:24px] [background:var(--surface-elevated)] [box-shadow:0_28px_90px_rgb(2_13_25_/_0.38)] [padding:1.3rem] [animation:dialog-in_220ms_ease-out] focus:[outline:0] max-[620px]:[width:100%] max-[620px]:[max-height:calc(100vh_-_0.5rem)] max-[620px]:[border-right:0] max-[620px]:[border-bottom:0] max-[620px]:[border-left:0] max-[620px]:[border-radius:24px_24px_0_0] max-[620px]:[padding:1rem_0.9rem_calc(1rem_+_env(safe-area-inset-bottom))]")} role="dialog" aria-modal="true" aria-labelledby="first-login-passkey-title" tabIndex={-1}>
        {complete ? <div className={cx("first-login-passkey__complete [display:grid] [justify-items:center] [gap:0.6rem] [padding:1.25rem_0.75rem] [text-align:center] [&_>_span]:[display:grid] [&_>_span]:[width:68px] [&_>_span]:[height:68px] [&_>_span]:[place-items:center] [&_>_span]:[border-radius:50%] [&_>_span]:[background:var(--success-surface)] [&_>_span]:[color:var(--success)] [&_h2]:[color:var(--neutral-950)] [&_h2]:[font-size:1.3rem] [&_>_p:not(.eyebrow)]:[max-width:48ch] [&_>_p:not(.eyebrow)]:[color:var(--neutral-600)] [&_>_p:not(.eyebrow)]:[font-size:0.78rem] [&_>_p:not(.eyebrow)]:[line-height:1.5]")}><span><CheckCircle2 size={31} /></span><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Passkey added</p><h2 id="first-login-passkey-title">Your next sign-in can be faster</h2><p>This device is now registered for {user.name}. You can rename or remove it later in Settings.</p><Button variant="primary" onClick={finishPasskeyPrompt}>Continue to workspace</Button></div> : <>
          <div className={cx("first-login-passkey__header [display:grid] [grid-template-columns:auto_minmax(0,_1fr)_auto] [align-items:start] [gap:0.75rem] [&_>_span:first-child]:[display:grid] [&_>_span:first-child]:[width:50px] [&_>_span:first-child]:[height:50px] [&_>_span:first-child]:[place-items:center] [&_>_span:first-child]:[border-radius:15px] [&_>_span:first-child]:[background:var(--kc-50)] [&_>_span:first-child]:[color:var(--kc-700)] [&_>_div]:[display:grid] [&_>_div]:[gap:0.18rem] [&_h2]:[color:var(--neutral-950)] [&_h2]:[font-size:1.3rem] max-[620px]:[&_>_span:first-child]:[width:44px] max-[620px]:[&_>_span:first-child]:[height:44px] max-[620px]:[&_h2]:[font-size:1.12rem]")}><span><KeyRound size={25} /></span><div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>First sign-in on this browser</p><h2 id="first-login-passkey-title">Would you like to add a passkey?</h2></div><IconButton label="Not now" onClick={dismissPasskeyPrompt} disabled={pending}><X size={19} /></IconButton></div>
          <p className={cx("first-login-passkey__intro [color:var(--neutral-600)] [font-size:0.82rem] [line-height:1.55]")}>Use your device unlock, fingerprint, face, phone, or security key for a simpler sign-in next time.</p>
          {error && <div className={cx("auth-error [border:1px_solid_var(--danger-border)] [border-radius:10px] [background:var(--danger-surface)] [color:var(--danger)] [padding:0.65rem_0.75rem] [font-size:0.74rem] [line-height:1.4]")} role="alert">{error}</div>}
          <div className={cx("first-login-passkey__actions [display:flex] [justify-content:flex-end] [gap:0.55rem] [border-top:1px_solid_var(--neutral-200)] [padding-top:0.9rem] max-[620px]:[align-items:stretch] max-[620px]:[flex-direction:column-reverse]")}><Button variant="tertiary" onClick={dismissPasskeyPrompt} disabled={pending}>Not now</Button><Button variant="primary" icon={<KeyRound size={18} />} onClick={addPasskey} disabled={pending}>{pending ? "Follow your device prompt…" : "Add a passkey"}</Button></div>
        </>}
      </section>
    </div>
  );
}
