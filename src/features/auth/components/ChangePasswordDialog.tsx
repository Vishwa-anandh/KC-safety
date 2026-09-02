import { Check, KeyRound, Mail, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { useAuth } from "../model/AuthProvider";
import { Button, IconButton, InlineMessage } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

/**
 * A self-contained popup, reusable from anywhere authenticated (the profile menu, Security
 * settings) rather than living inline in one page. Two steps, mirroring an email-verified change
 * in production: step one checks the current password and requests a code; step two applies the
 * new password only once that code is confirmed.
 */
type Step = "form" | "verify" | "done";

const dialogLayerClass = "dialog-layer fixed inset-0 z-100 grid place-items-center p-4";
const dialogBackdropClass = "dialog-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-sm";
const dialogClass = "dialog dialog--compact relative max-h-full w-full max-w-md overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-dialog-in dark:border-slate-700 dark:bg-slate-900";
const dialogHeaderClass = "dialog__header flex items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-700";
const dialogTitleEyebrowClass = "eyebrow text-sm font-semibold text-kc-blue-700 dark:text-kc-blue-300";
const dialogTitleClass = "mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100";
const dialogBodyClass = "grid gap-3 p-4";
const dialogFooterClass = "dialog__footer flex flex-col-reverse items-stretch gap-4 border-t border-slate-200 p-4 md:flex-row md:items-center md:justify-end dark:border-slate-700";
const fieldInputClass = "w-full min-w-0 min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 transition-colors outline-none focus:border-kc-blue-500 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const { requestPasswordChangeCode, confirmPasswordChange } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const currentPasswordRef = useRef<HTMLInputElement>(null);

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Re-enter the new password so both fields match.");
      return;
    }
    setPending(true);
    try {
      const result = await requestPasswordChangeCode(currentPassword);
      setMaskedEmail(result.maskedEmail);
      setDevCode(result.devCode ?? null);
      setStep("verify");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The password change could not be started.");
    } finally {
      setPending(false);
    }
  }

  async function handleConfirmCode(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      await confirmPasswordChange(code, newPassword);
      setStep("done");
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "That code could not be verified.");
    } finally {
      setPending(false);
    }
  }

  function backToForm() {
    setStep("form");
    setCode("");
    setError("");
    window.setTimeout(() => currentPasswordRef.current?.focus(), 50);
  }

  const titleId = "change-password-title";

  return (
    <div className={dialogLayerClass}>
      <button className={dialogBackdropClass} aria-label="Close" onClick={onClose} />
      <section className={dialogClass} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={dialogHeaderClass}>
          <div>
            <p className={dialogTitleEyebrowClass}>Account security</p>
            <h2 id={titleId} className={dialogTitleClass}>
              {step === "form" ? "Change password" : step === "verify" ? "Verify it's you" : "Password changed"}
            </h2>
          </div>
          <IconButton label="Close" onClick={onClose}><X size={20} /></IconButton>
        </div>

        {step === "form" && (
          <form onSubmit={handleRequestCode}>
            <div className={dialogBodyClass}>
              <label className="auth-field grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Current password</span>
                <input
                  ref={currentPasswordRef}
                  className={fieldInputClass}
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoFocus
                  required
                />
              </label>
              <label className="auth-field grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>New password</span>
                <input
                  className={fieldInputClass}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </label>
              <label className="auth-field grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Confirm new password</span>
                <input
                  className={fieldInputClass}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </label>
              <small className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Use at least 8 characters. We'll email a verification code to confirm this change before it takes effect.
              </small>
              {error && (
                <div className="auth-error rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300" role="alert">
                  {error}
                </div>
              )}
            </div>
            <div className={dialogFooterClass}>
              <Button type="button" variant="tertiary" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary" icon={<Mail size={17} />} disabled={pending}>{pending ? "Sending code…" : "Send verification code"}</Button>
            </div>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleConfirmCode}>
            <div className={dialogBodyClass}>
              <div className="flex items-start gap-2.5 rounded-xl border border-kc-blue-200 bg-kc-blue-50 p-3 text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200">
                <Mail size={19} className="mt-0.5 flex-none" />
                <p className="text-sm leading-relaxed">We sent a 6-digit verification code to <strong>{maskedEmail}</strong>. Enter it below to finish changing your password.</p>
              </div>
              {devCode && (
                <InlineMessage tone="warning" title="Review build — no email delivery connected">
                  Your code is <strong className={cx("font-mono text-sm")}>{devCode}</strong>. Production sends this by email instead of showing it here.
                </InlineMessage>
              )}
              <label className="auth-field grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Verification code</span>
                <input
                  className={cx(fieldInputClass, "text-center font-mono text-lg tracking-widest")}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  autoFocus
                  required
                />
              </label>
              {error && (
                <div className="auth-error rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300" role="alert">
                  {error}
                </div>
              )}
              <button type="button" className="w-fit border-0 bg-transparent p-0 text-xs font-bold text-kc-blue-700 hover:underline hover:underline-offset-2 dark:text-kc-blue-300" onClick={backToForm}>
                Change details or resend
              </button>
            </div>
            <div className={dialogFooterClass}>
              <Button type="button" variant="tertiary" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="primary" icon={<KeyRound size={17} />} disabled={pending || code.length < 6}>{pending ? "Verifying…" : "Verify and change password"}</Button>
            </div>
          </form>
        )}

        {step === "done" && (
          <>
            <div className={cx(dialogBodyClass, "justify-items-center text-center")}>
              <span className="grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Check size={26} />
              </span>
              <p className="max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Your password has been changed. Use it the next time you sign in — you'll stay signed in on this device.
              </p>
            </div>
            <div className={dialogFooterClass}>
              <Button variant="primary" onClick={onClose}>Done</Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
