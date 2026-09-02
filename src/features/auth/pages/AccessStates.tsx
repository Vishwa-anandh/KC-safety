import { CircleHelp, KeyRound, LogIn, UserRoundX } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../model/AuthProvider";
import { EmptyState } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

/*
 * These three targets are <a>/<Link>, not <button>, so they cannot use the shared Button
 * component and instead reproduce its canonical recipe. Only the recipe itself is inlined —
 * the disabled-state utilities are omitted because an anchor is never :disabled.
 */
const linkButton =
  "button inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors";
const linkButtonPrimary = "bg-kc-blue-600 text-white hover:bg-kc-blue-700 active:bg-kc-blue-800 dark:bg-kc-blue-600";
const linkButtonTertiary =
  "bg-transparent text-kc-blue-700 hover:bg-kc-blue-50 hover:text-kc-blue-900 dark:text-kc-blue-300 dark:hover:bg-kc-blue-950 dark:hover:text-kc-blue-100";

const stateActions = "state-actions mt-5 flex flex-wrap justify-center gap-2.5";

export function NoAssignmentScreen() {
  return (
    <StandaloneState>
      <EmptyState
        icon={<UserRoundX size={35} />}
        title="No site is assigned to your account"
        description="Your sign-in was successful, but you do not currently have permission to work with a KC site. Ask an administrator to assign your site and role."
        action={
          <div className={cx(stateActions)}>
            <a className={cx(linkButton, linkButtonPrimary)} href="mailto:ehss-support@example.com?subject=Site%20assignment%20request">
              <CircleHelp size={18} />
              <span>Contact support</span>
            </a>
            <SignOutLink />
          </div>
        }
      />
    </StandaloneState>
  );
}

export function SessionExpiredScreen() {
  const { signOut } = useAuth();
  useEffect(() => signOut(), [signOut]);
  return (
    <StandaloneState>
      <EmptyState
        icon={<KeyRound size={35} />}
        title="Your session has expired"
        description="Sign in again to continue. Changes confirmed as saved before the session ended are available; any unconfirmed changes may need to be entered again."
        action={
          <div className={cx(stateActions)}>
            <Link className={cx(linkButton, linkButtonPrimary)} to="/login">
              <LogIn size={18} />
              <span>Sign in again</span>
            </Link>
            <a className={cx(linkButton, linkButtonTertiary)} href="mailto:ehss-support@example.com?subject=Sign-in%20help">
              <span>Get sign-in help</span>
            </a>
          </div>
        }
      />
    </StandaloneState>
  );
}

function SignOutLink() {
  const { signOut } = useAuth();
  return (
    <Link className={cx(linkButton, linkButtonTertiary)} to="/login" onClick={signOut}>
      <span>Sign out</span>
    </Link>
  );
}

/*
 * The two accent glows come from [data-accent] channel triplets used at low alpha, which no
 * utility can express, so they stay inline as background-image only. The canvas colour underneath
 * them is a normal utility pair, so the surface still inverts with the theme.
 */
const standaloneGlow =
  "radial-gradient(circle at 18% 0%, rgb(var(--accent-soft-rgb) / 0.19), transparent 26rem), radial-gradient(circle at 86% 100%, rgb(var(--accent-rgb) / 0.14), transparent 28rem)";

function StandaloneState({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cx("standalone-state flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950")}
      style={{ backgroundImage: standaloneGlow }}
    >
      <div className={cx("standalone-state__brand flex items-center gap-2.5 px-6 py-5")}>
        <span className={cx("grid size-10 place-items-center rounded-xl bg-kc-blue-800 font-bold text-white dark:bg-kc-blue-800")}>KC</span>
        <div className={cx("grid")}>
          <strong className={cx("text-slate-900 dark:text-slate-100")}>EHS360</strong>
          <small className={cx("text-slate-500 dark:text-slate-400")}>Self-Assessment</small>
        </div>
      </div>
      <main className={cx("grid grow place-items-center px-4 py-8")}>{children}</main>
      <footer className={cx("p-5 text-center text-xs text-slate-500 dark:text-slate-400")}>EHS360</footer>
    </div>
  );
}
