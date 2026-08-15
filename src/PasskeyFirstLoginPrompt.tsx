import { CheckCircle2, KeyRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./Auth";
import { Button, IconButton } from "./components/UI";

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
    <div className="setup-layer passkey-first-login-layer">
      <div className="setup-backdrop" />
      <section ref={dialogRef} className="first-login-passkey" role="dialog" aria-modal="true" aria-labelledby="first-login-passkey-title" tabIndex={-1}>
        {complete ? <div className="first-login-passkey__complete"><span><CheckCircle2 size={31} /></span><p className="eyebrow">Passkey added</p><h2 id="first-login-passkey-title">Your next sign-in can be faster</h2><p>This device is now registered for {user.name}. You can rename or remove it later in Settings.</p><Button variant="primary" onClick={finishPasskeyPrompt}>Continue to workspace</Button></div> : <>
          <div className="first-login-passkey__header"><span><KeyRound size={25} /></span><div><p className="eyebrow">First sign-in on this browser</p><h2 id="first-login-passkey-title">Would you like to add a passkey?</h2></div><IconButton label="Not now" onClick={dismissPasskeyPrompt} disabled={pending}><X size={19} /></IconButton></div>
          <p className="first-login-passkey__intro">Use your device unlock, fingerprint, face, phone, or security key for a simpler sign-in next time.</p>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <div className="first-login-passkey__actions"><Button variant="tertiary" onClick={dismissPasskeyPrompt} disabled={pending}>Not now</Button><Button variant="primary" icon={<KeyRound size={18} />} onClick={addPasskey} disabled={pending}>{pending ? "Follow your device prompt…" : "Add a passkey"}</Button></div>
        </>}
      </section>
    </div>
  );
}
