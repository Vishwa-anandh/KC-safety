import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../model/AuthProvider";
import { roleProfiles } from "../../onboarding";
import type { UserRole } from "../../../shared/types";
import { Button, KcLogo } from "../../../shared/ui/UI";
import { cx } from "../../../shared/utils";

const roleIcons = {
  "site-contributor": Building2,
  administrator: ShieldCheck,
};

/**
 * The hero panel stacks two accent glows over a three-stop brand gradient, all driven by the
 * [data-accent] variables in tailwind.base.css. Utilities cannot express a layered gradient built
 * from `rgb(var(--token) / alpha)`, so this one declaration stays inline; every other rule on the
 * panel is a canonical utility.
 */
const heroBackground =
  "radial-gradient(circle at 8% 12%, rgb(var(--accent-hero-glow-a) / 0.28), transparent 23rem), radial-gradient(circle at 92% 88%, rgb(var(--accent-hero-glow-b) / 0.2), transparent 24rem), linear-gradient(145deg, var(--accent-hero-from), var(--accent-hero-mid) 58%, var(--accent-hero-to))";

/** The custom elevation ramp (--shadow-1/2/3) is deliberately retained and still theme-swapped. */
const cardShadow = "var(--shadow-2)";

/** Text input recipe, shared by both credential fields. */
const authInput =
  "w-full min-w-0 min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-kc-blue-900";

type LoginMode = "signin" | "forgot" | "forgot-sent";

const loginHeading: Record<LoginMode, { icon: typeof LockKeyhole; eyebrow: string; title: string; description: string }> = {
  signin: {
    icon: LockKeyhole,
    eyebrow: "Secure access",
    title: "Sign in to your workspace",
    description: "Your assigned role and site determine what you can view and edit.",
  },
  forgot: {
    icon: KeyRound,
    eyebrow: "Account recovery",
    title: "Reset your password",
    description: "Enter your work email and we'll send instructions to reset your password.",
  },
  "forgot-sent": {
    icon: MailCheck,
    eyebrow: "Account recovery",
    title: "Reset instructions on the way",
    description: "",
  },
};

export default function LoginScreen() {
  const { demoAccounts, demoEnabled, demoPassword, requestPasswordReset, signIn, signInDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<LoginMode>("signin");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState("");

  function finish(role: UserRole) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    navigate(from && from !== "/login" ? from : roleProfiles[role].home, { replace: true });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPending("password");
    setError("");
    try {
      const account = await signIn(email, password);
      finish(account.role);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign-in could not be completed.");
    } finally {
      setPending(null);
    }
  }

  async function handleDemo(role: UserRole) {
    setPending(role);
    setError("");
    try {
      const account = await signInDemo(role);
      finish(account.role);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Demo sign-in could not be completed.");
    } finally {
      setPending(null);
    }
  }

  function openForgotPassword() {
    setResetEmail(email);
    setResetError("");
    setMode("forgot");
  }

  function backToSignIn() {
    setMode("signin");
    setResetError("");
  }

  async function handleResetRequest(event: FormEvent) {
    event.preventDefault();
    setResetPending(true);
    setResetError("");
    try {
      await requestPasswordReset(resetEmail);
      setMode("forgot-sent");
    } catch (resetRequestError) {
      setResetError(resetRequestError instanceof Error ? resetRequestError.message : "The reset request could not be completed.");
    } finally {
      setResetPending(false);
    }
  }

  const heading = loginHeading[mode];
  const HeadingIcon = heading.icon;

  return (
    <main className={cx("login-page grid min-h-screen bg-slate-50 lg:grid-cols-9 dark:bg-slate-950")}>
      <section
        className={cx(
          "login-story relative flex min-h-75 flex-col overflow-hidden p-6 text-white sm:min-h-80 lg:sticky lg:top-0 lg:col-span-4 lg:h-screen lg:min-h-170 lg:p-10 xl:p-13",
        )}
        style={{ background: heroBackground }}
        aria-label="EHS360 product introduction"
      >
        {/*
         * Two decorative rings, previously ::before/::after. Their geometry is expressed in vw, which
         * has no place on Tailwind's scale, so they became real aria-hidden nodes with inline
         * geometry rather than bracket utilities. Purely presentational — no behaviour attached.
         */}
        <span
          aria-hidden="true"
          className={cx("pointer-events-none absolute rounded-full border border-white/10")}
          style={{ top: "-12vw", right: "-15vw", width: "42vw", height: "42vw" }}
        />
        <span
          aria-hidden="true"
          className={cx("pointer-events-none absolute rounded-full border border-white/10")}
          style={{ bottom: "-16vw", left: "-18vw", width: "48vw", height: "48vw" }}
        />

        <div className={cx("login-story__brand relative z-10 flex items-center gap-3")}>
          <KcLogo />
          <div className={cx("grid")}>
            <strong className={cx("text-lg")}>EHS360</strong>
            <span className={cx("text-xs text-white/70")}>Self-Assessment</span>
          </div>
        </div>

        <div className={cx("login-story__content relative z-10 mt-9 mb-4 grid max-w-2xl gap-4 sm:mt-11 sm:mb-8 lg:my-auto")}>
          <h1 className={cx("max-w-xs text-4xl leading-none font-bold tracking-tighter text-white sm:max-w-sm sm:text-5xl lg:max-w-md lg:text-6xl xl:text-7xl")}>
            Move every site from assessment to action.
          </h1>
          <p className={cx("max-w-lg text-sm leading-relaxed text-white/75 sm:text-base")}>
            Complete governed assessments, close corrective-action gaps, and give enterprise leaders a trusted view of progress.
          </p>
          <div className={cx("login-story__proof mt-1.5 hidden flex-wrap gap-2.5 sm:flex")}>
            <span className={cx("inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-2 text-xs text-white/85")}>
              <CheckCircle2 size={18} className={cx("text-emerald-300")} />
              <span>Role-aware workspaces</span>
            </span>
            <span className={cx("inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-2 text-xs text-white/85")}>
              <CheckCircle2 size={18} className={cx("text-emerald-300")} />
              <span>Protected site context</span>
            </span>
            <span className={cx("inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-2 text-xs text-white/85")}>
              <CheckCircle2 size={18} className={cx("text-emerald-300")} />
              <span>Guided first-time setup</span>
            </span>
          </div>
        </div>

        <p className={cx("login-story__footer relative z-10 hidden text-xs text-white/50 lg:block")}>EHS360</p>
      </section>

      <section className={cx("login-access grid min-h-0 min-w-0 content-start justify-items-center gap-3.5 px-3 pt-4 pb-8 sm:px-5 sm:pt-6 sm:pb-6 lg:col-span-5 lg:min-h-screen lg:content-center lg:p-10 xl:p-16")}>
        <div
          className={cx("login-card w-full max-w-155 rounded-2xl border border-slate-200 bg-white p-4 sm:rounded-3xl sm:p-5 lg:p-7 dark:border-slate-700 dark:bg-slate-900")}
          style={{ boxShadow: cardShadow }}
        >
          <div className={cx("login-card__heading flex items-center gap-3 sm:items-start")}>
            <span className={cx("login-card__icon grid size-12 shrink-0 place-items-center rounded-xl bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300")}>
              <HeadingIcon size={23} />
            </span>
            <div className={cx("grid gap-0.5")}>
              <p className={cx("eyebrow text-sm font-semibold tracking-wide text-kc-blue-700 dark:text-kc-blue-300")}>{heading.eyebrow}</p>
              <h2 className={cx("text-xl font-bold text-slate-900 dark:text-slate-100")}>{heading.title}</h2>
              {heading.description && (
                <p className={cx("hidden text-sm leading-snug text-slate-500 sm:block dark:text-slate-400")}>{heading.description}</p>
              )}
            </div>
          </div>

          {mode === "signin" && (
            <form className={cx("login-form mt-5 grid gap-3")} onSubmit={handleSubmit} noValidate>
              <label className={cx("auth-field grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300")}>
                <span>Work email</span>
                <input
                  type="email"
                  className={cx(authInput)}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  placeholder="name@kimberly-clark.com"
                  required
                />
              </label>
              <div className={cx("grid gap-1.5")}>
                <div className={cx("flex items-center justify-between gap-2")}>
                  <label htmlFor="login-password" className={cx("text-sm font-semibold text-slate-700 dark:text-slate-300")}>Password</label>
                  <button
                    type="button"
                    className={cx("border-0 bg-transparent p-0 text-xs font-bold text-kc-blue-700 hover:underline hover:underline-offset-2 dark:text-kc-blue-300")}
                    onClick={openForgotPassword}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className={cx("password-control relative")}>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    className={cx(authInput, "pr-12")}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className={cx("absolute top-0.5 right-0.5 grid size-10 place-items-center rounded-lg border-0 bg-transparent text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100")}
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              {error && (
                <div className={cx("auth-error rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300")} role="alert">
                  {error}
                </div>
              )}
              <Button type="submit" variant="primary" size="large" disabled={Boolean(pending)}>{pending === "password" ? "Signing in…" : "Sign in"}</Button>
            </form>
          )}

          {mode === "forgot" && (
            <div className={cx("login-forgot mt-5 grid gap-3")}>
              <button
                type="button"
                className={cx("inline-flex w-fit items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100")}
                onClick={backToSignIn}
              >
                <ArrowLeft size={14} /> Back to sign in
              </button>
              <form className={cx("grid gap-3")} onSubmit={handleResetRequest} noValidate>
                <label className={cx("auth-field grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300")}>
                  <span>Work email</span>
                  <input
                    type="email"
                    className={cx(authInput)}
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    autoComplete="username"
                    placeholder="name@kimberly-clark.com"
                    required
                  />
                </label>
                {resetError && (
                  <div className={cx("auth-error rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-snug text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300")} role="alert">
                    {resetError}
                  </div>
                )}
                <Button type="submit" variant="primary" size="large" disabled={resetPending}>{resetPending ? "Sending…" : "Send reset link"}</Button>
              </form>
            </div>
          )}

          {mode === "forgot-sent" && (
            <div className={cx("login-forgot-sent mt-5 grid justify-items-center gap-3 text-center")}>
              <span className={cx("grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300")}>
                <MailCheck size={26} />
              </span>
              <p className={cx("max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400")}>
                If an account exists for <strong className={cx("text-slate-800 dark:text-slate-200")}>{resetEmail}</strong>, reset instructions are on their way.
              </p>
              <p className={cx("text-xs leading-snug text-slate-500 dark:text-slate-400")}>
                This review build does not send real email yet. Production reset delivery is handled by the organization authentication service.
              </p>
              <Button variant="secondary" onClick={backToSignIn}>Back to sign in</Button>
            </div>
          )}

          {mode === "signin" && demoEnabled && (
            <div className={cx("demo-access mt-5 grid gap-2.5 border-t border-slate-200 pt-4 dark:border-slate-700")}>
              <div className={cx("demo-access__heading flex items-center justify-between gap-3")}>
                <div className={cx("grid")}>
                  <span className={cx("text-sm font-bold text-slate-800 dark:text-slate-200")}>Demo access</span>
                  <small className={cx("text-xs text-slate-500 dark:text-slate-400")}>Temporary and removable before release</small>
                </div>
                <span className={cx("demo-badge w-fit rounded-full bg-violet-50 px-2 py-1 text-xs whitespace-nowrap text-violet-700 dark:bg-violet-950 dark:text-violet-300")}>Demo mode</span>
              </div>
              <p className={cx("text-xs leading-snug text-slate-500 dark:text-slate-400")}>
                Choose a user to see the exact pages, permissions, and guided journey available to that role.
              </p>
              <div className={cx("demo-role-grid grid gap-2 xl:grid-cols-3")}>
                {demoAccounts.map((account) => {
                  const role = account.role;
                  const Icon = roleIcons[role];
                  return (
                    <button
                      key={role}
                      type="button"
                      className={cx(
                        "demo-role-card flex min-h-16 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-left text-slate-600 transition hover:not-disabled:-translate-y-px hover:not-disabled:border-kc-blue-400 hover:not-disabled:bg-kc-blue-50 hover:not-disabled:text-kc-blue-800 disabled:cursor-wait disabled:opacity-65 xl:min-h-29 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
                        pending === role && "demo-role-card--pending",
                      )}
                      disabled={Boolean(pending)}
                      onClick={() => handleDemo(role)}
                    >
                      <span className={cx("demo-role-card__icon grid size-9 shrink-0 place-items-center rounded-lg bg-kc-blue-50 text-kc-blue-700 dark:bg-kc-blue-950 dark:text-kc-blue-300")}>
                        <Icon size={20} />
                      </span>
                      <span className={cx("grid min-w-0 flex-1 gap-0.5")}>
                        <strong className={cx("text-xs")}>{roleProfiles[role].shortLabel}</strong>
                        <small className={cx("line-clamp-2 text-xs leading-tight text-slate-500 dark:text-slate-400")}>{account.email}</small>
                        <small className={cx("line-clamp-2 text-xs leading-tight text-slate-500 dark:text-slate-400")}>{account.name} · {account.scope}</small>
                      </span>
                      <ArrowRight size={18} className={cx("shrink-0 text-kc-blue-600 dark:text-kc-blue-400")} />
                    </button>
                  );
                })}
              </div>
              <p className={cx("demo-credentials text-xs leading-snug text-slate-500 dark:text-slate-400")}>
                For form testing, use any demo email above with password <strong className={cx("text-slate-700 dark:text-slate-300")}>{demoPassword}</strong>
              </p>
            </div>
          )}
        </div>
        <p className={cx("login-support w-full max-w-155 text-center text-xs text-slate-500 dark:text-slate-400")}>
          Need access help?{" "}
          <a
            className={cx("font-bold text-kc-blue-700 hover:underline hover:underline-offset-2 dark:text-kc-blue-300")}
            href="mailto:ehss-support@example.com?subject=EHS360%20sign-in%20help"
          >
            Contact EHS360 support
          </a>
        </p>
      </section>
    </main>
  );
}
