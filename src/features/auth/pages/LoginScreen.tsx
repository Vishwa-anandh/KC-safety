import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
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
  "enterprise-viewer": LayoutDashboard,
  administrator: ShieldCheck,
};

export default function LoginScreen() {
  const { demoAccounts, demoEnabled, demoPassword, signIn, signInDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  return (
    <main className={cx("login-page [display:grid] [min-height:100vh] [grid-template-columns:minmax(340px,_0.88fr)_minmax(560px,_1.12fr)] [background:var(--neutral-50)] max-[1120px]:[grid-template-columns:minmax(300px,_0.72fr)_minmax(500px,_1.28fr)] max-[900px]:[grid-template-columns:1fr]")}>
      <section className={cx("login-story [position:sticky] [top:0] [display:flex] [height:100vh] [min-height:680px] [flex-direction:column] [overflow:hidden] [background:radial-gradient(circle_at_8%_12%,_rgb(var(--accent-hero-glow-a)_/_0.28),_transparent_23rem),_radial-gradient(circle_at_92%_88%,_rgb(var(--accent-hero-glow-b)_/_0.2),_transparent_24rem),_linear-gradient(145deg,_var(--accent-hero-from),_var(--accent-hero-mid)_58%,_var(--accent-hero-to))] [color:white] [padding:clamp(1.4rem,_4vw,_3.25rem)] before:[position:absolute] before:[border:1px_solid_rgb(255_255_255_/_0.12)] before:[border-radius:50%] before:[content:''] after:[position:absolute] after:[border:1px_solid_rgb(255_255_255_/_0.12)] after:[border-radius:50%] after:[content:''] before:[top:-12vw] before:[right:-15vw] before:[width:42vw] before:[height:42vw] after:[bottom:-16vw] after:[left:-18vw] after:[width:48vw] after:[height:48vw] [&_h1]:[max-width:12ch] [&_h1]:[color:white] [&_h1]:[font-size:clamp(2.4rem,_5vw,_4.8rem)] [&_h1]:[line-height:0.98] [&_h1]:[letter-spacing:-0.052em] max-[1120px]:[&_h1]:[font-size:clamp(2.25rem,_4vw,_3.5rem)] max-[900px]:[position:relative] max-[900px]:[height:auto] max-[900px]:[min-height:320px] max-[900px]:[padding:1.5rem] max-[900px]:[&_h1]:[max-width:18ch] max-[900px]:[&_h1]:[font-size:clamp(2.1rem,_6vw,_3.2rem)] max-[620px]:[min-height:300px]")} aria-label="Maitsys Assure product introduction">
        <div className={cx("login-story__brand [position:relative] [z-index:1] [display:flex] [align-items:center] [gap:0.75rem] [&_>_div]:[display:grid] [&_strong]:[font-size:1.05rem] [&_span]:[color:rgb(255_255_255_/_0.72)] [&_span]:[font-size:0.75rem]")}><KcLogo /><div><strong>Maitsys Assure</strong><span>Self-Assessment</span></div></div>
        <div className={cx("login-story__content [position:relative] [z-index:1] [display:grid] [max-width:640px] [gap:1rem] [margin:auto_0] [&_>_p]:[max-width:58ch] [&_>_p]:[color:rgb(255_255_255_/_0.76)] [&_>_p]:[font-size:clamp(0.92rem,_1.3vw,_1.08rem)] [&_>_p]:[line-height:1.65] max-[900px]:[margin:2.8rem_0_2rem] max-[620px]:[margin:2.2rem_0_1rem] max-[620px]:[&_>_p]:[font-size:0.85rem]")}>
          <h1>Move every site from assessment to action.</h1>
          <p>Complete governed assessments, close corrective-action gaps, and give enterprise leaders a trusted view of progress.</p>
          <div className={cx("login-story__proof [display:flex] [flex-wrap:wrap] [gap:0.6rem] [margin-top:0.4rem] [&_>_span]:[display:inline-flex] [&_>_span]:[align-items:center] [&_>_span]:[gap:0.4rem] [&_>_span]:[border-radius:9px] [&_>_span]:[background:rgb(255_255_255_/_0.08)] [&_>_span]:[padding:0.45rem_0.6rem] [&_>_span]:[color:rgb(255_255_255_/_0.86)] [&_>_span]:[font-size:0.72rem] [&_svg]:[color:#76dcc7] max-[620px]:[display:none]")}>
            <span><CheckCircle2 size={18} /><span>Role-aware workspaces</span></span>
            <span><CheckCircle2 size={18} /><span>Protected site context</span></span>
            <span><CheckCircle2 size={18} /><span>Guided first-time setup</span></span>
          </div>
        </div>
        <p className={cx("login-story__footer [position:relative] [z-index:1] [color:rgb(255_255_255_/_0.5)] [font-size:0.7rem] max-[900px]:[display:none]")}>Maitsys Assure</p>
      </section>

      <section className={cx("login-access [display:grid] [min-width:0] [min-height:100vh] [align-content:center] [justify-items:center] [gap:0.9rem] [padding:clamp(1.25rem,_4vw,_4rem)] max-[900px]:[min-height:0] max-[900px]:[align-content:start] max-[900px]:[padding:1.5rem_1.25rem_calc(1.5rem_+_env(safe-area-inset-bottom))] max-[620px]:[padding:1rem_0.75rem_calc(1.25rem_+_env(safe-area-inset-bottom))]")}>
        <div className={cx("login-card [width:min(620px,_100%)] [border:1px_solid_var(--neutral-200)] [border-radius:24px] [background:var(--surface-elevated)] [box-shadow:var(--shadow-2)] [padding:clamp(1.1rem,_3vw,_1.75rem)] max-[620px]:[border-radius:19px]")}>
          <div className={cx("login-card__heading [display:flex] [align-items:flex-start] [gap:0.8rem] [&_>_div]:[display:grid] [&_>_div]:[gap:0.2rem] [&_h2]:[font-size:1.32rem] [&_div_>_p:last-child]:[color:var(--neutral-500)] [&_div_>_p:last-child]:[font-size:0.76rem] [&_div_>_p:last-child]:[line-height:1.45] max-[620px]:[align-items:center] max-[620px]:[&_div_>_p:last-child]:[display:none]")}>
            <span className={cx("login-card__icon [display:grid] [width:48px] [height:48px] [flex:0_0_48px] [place-items:center] [border-radius:14px] [background:var(--kc-50)] [color:var(--kc-700)]")}><LockKeyhole size={23} /></span>
            <div><p className={cx("eyebrow [color:var(--kc-700)] [font-size:0.75rem] [font-weight:700] [letter-spacing:0.02em] [line-height:1.3] [.readonly-action_p&]:[margin-bottom:0.3rem] [.setup-complete_&]:[margin-top:1rem]")}>Secure access</p><h2>Sign in to your workspace</h2><p>Your assigned role and site determine what you can view and edit.</p></div>
          </div>

          <form className={cx("login-form [display:grid] [gap:0.8rem] [margin-top:1.25rem]")} onSubmit={handleSubmit} noValidate>
            <label className={cx("auth-field [display:grid] [gap:0.38rem] [color:var(--neutral-700)] [font-size:0.74rem] [font-weight:650] [&_input]:[width:100%] [&_input]:[min-width:0] [&_input]:[min-height:44px] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:10px] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.78rem] [&_input]:[font-size:0.84rem] [&_input]:[font-weight:450] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input:focus]:[border-color:var(--kc-500)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input::placeholder]:[color:var(--neutral-400)]")}><span>Work email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="name@kimberly-clark.com" required /></label>
            <label className={cx("auth-field [display:grid] [gap:0.38rem] [color:var(--neutral-700)] [font-size:0.74rem] [font-weight:650] [&_input]:[width:100%] [&_input]:[min-width:0] [&_input]:[min-height:44px] [&_input]:[border:1px_solid_var(--neutral-300)] [&_input]:[border-radius:10px] [&_input]:[outline:0] [&_input]:[background:var(--surface-input)] [&_input]:[color:var(--neutral-900)] [&_input]:[padding:0.68rem_0.78rem] [&_input]:[font-size:0.84rem] [&_input]:[font-weight:450] [&_input]:[transition:border-color_120ms_ease,_box-shadow_120ms_ease] [&_input:focus]:[border-color:var(--kc-500)] [&_input:focus]:[box-shadow:0_0_0_3px_var(--kc-100)] [&_input::placeholder]:[color:var(--neutral-400)]")}><span>Password</span><div className={cx("password-control [position:relative] [&_input]:[padding-right:3rem] [&_button]:[position:absolute] [&_button]:[top:2px] [&_button]:[right:2px] [&_button]:[display:grid] [&_button]:[width:40px] [&_button]:[height:40px] [&_button]:[place-items:center] [&_button]:[border:0] [&_button]:[border-radius:9px] [&_button]:[background:transparent] [&_button]:[color:var(--neutral-500)] [&_button:hover]:[background:var(--neutral-100)] [&_button:hover]:[color:var(--neutral-800)]")}><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            {error && <div className={cx("auth-error [border:1px_solid_var(--danger-border)] [border-radius:10px] [background:var(--danger-surface)] [color:var(--danger)] [padding:0.65rem_0.75rem] [font-size:0.74rem] [line-height:1.4]")} role="alert">{error}</div>}
            <Button type="submit" variant="primary" size="large" disabled={Boolean(pending)}>{pending === "password" ? "Signing in…" : "Sign in"}</Button>
          </form>

          {demoEnabled && (
            <div className={cx("demo-access [display:grid] [gap:0.65rem] [margin-top:1.2rem] [border-top:1px_solid_var(--neutral-200)] [padding-top:1rem] [&_>_p]:[color:var(--neutral-500)] [&_>_p]:[font-size:0.7rem] [&_>_p]:[line-height:1.45]")}>
              <div className={cx("demo-access__heading [display:flex] [align-items:center] [justify-content:space-between] [gap:0.7rem] [&_>_div]:[display:grid] [&_span]:[color:var(--neutral-800)] [&_span]:[font-size:0.78rem] [&_span]:[font-weight:720] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.65rem]")}><div><span>Demo access</span><small>Temporary and removable before release</small></div><span className={cx("demo-badge [border-radius:999px] [background:var(--provisional-surface)] [color:var(--provisional)]! [padding:0.28rem_0.5rem] [font-size:0.62rem]!")}>Demo mode</span></div>
              <p>Choose a user to see the exact pages, permissions, and guided journey available to that role.</p>
              <div className={cx("demo-role-grid [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:0.45rem] max-[1120px]:[grid-template-columns:1fr] max-[620px]:[grid-template-columns:1fr]")}>
                {demoAccounts.map((account) => {
                  const role = account.role;
                  const Icon = roleIcons[role];
                  return (
                    <button key={role} type="button" className={cx("demo-role-card [display:grid] [min-width:0] [min-height:116px] [grid-template-columns:auto_1fr_auto] [align-content:center] [align-items:center] [gap:0.5rem] [border:1px_solid_var(--neutral-200)] [border-radius:13px] [background:var(--surface-panel)] [color:var(--neutral-600)] [padding:0.65rem] [text-align:left] [transition:border-color_140ms_ease,_background_140ms_ease,_color_140ms_ease,_transform_100ms_ease] [&:hover:not(:disabled)]:[border-color:var(--kc-400)] [&:hover:not(:disabled)]:[background:var(--kc-50)] [&:hover:not(:disabled)]:[color:var(--kc-800)] [&:hover:not(:disabled)]:[transform:translateY(-1px)] disabled:[cursor:wait] disabled:[opacity:0.65] [&_>_span:nth-child(2)]:[display:grid] [&_>_span:nth-child(2)]:[min-width:0] [&_>_span:nth-child(2)]:[gap:0.15rem] [&_strong]:[font-size:0.72rem] [&_small]:[display:-webkit-box] [&_small]:[overflow:hidden] [&_small]:[color:var(--neutral-500)] [&_small]:[font-size:0.62rem] [&_small]:[line-height:1.35] [&_small]:[-webkit-box-orient:vertical] [&_small]:[-webkit-line-clamp:2] [&_>_svg]:[color:var(--kc-600)] max-[1120px]:[min-height:66px] max-[620px]:[min-height:66px]", pending === role && "demo-role-card--pending")} disabled={Boolean(pending)} onClick={() => handleDemo(role)}>
                      <span className={cx("demo-role-card__icon [display:grid] [width:36px] [height:36px] [place-items:center] [border-radius:10px] [background:var(--kc-50)] [color:var(--kc-700)]")}><Icon size={20} /></span>
                      <span><strong>{roleProfiles[role].shortLabel}</strong><small>{account.email}</small><small>{account.name} · {account.scope}</small></span>
                      <ArrowRight size={18} />
                    </button>
                  );
                })}
              </div>
              <p className={cx("demo-credentials [&_strong]:[color:var(--neutral-700)]")}>For form testing, use any demo email above with password <strong>{demoPassword}</strong></p>
            </div>
          )}
        </div>
        <p className={cx("login-support [width:min(620px,_100%)] [color:var(--neutral-500)] [font-size:0.7rem] [text-align:center] [&_a]:[color:var(--kc-700)] [&_a]:[font-weight:680] [&_a:hover]:[text-decoration:underline] [&_a:hover]:[text-underline-offset:0.2em]")}>Need access help? <a href="mailto:ehss-support@example.com?subject=Maitsys%20Assure%20sign-in%20help">Contact Maitsys Assure support</a></p>
      </section>
    </main>
  );
}
