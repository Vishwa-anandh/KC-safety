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
import { demoAccounts, useAuth } from "../Auth";
import { roleProfiles, type UserRole } from "../GuidedSetup";
import { Button, KcLogo } from "../components/UI";
import { cx } from "../utils";

const roleIcons = {
  "site-contributor": Building2,
  "enterprise-viewer": LayoutDashboard,
  administrator: ShieldCheck,
};

export default function LoginScreen() {
  const { demoEnabled, signIn, signInDemo } = useAuth();
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
    <main className="login-page">
      <section className="login-story" aria-label="KC EHS&S product introduction">
        <div className="login-story__brand"><KcLogo /><div><strong>EHS&S</strong><span>Self-Assessment</span></div></div>
        <div className="login-story__content">
          <h1>Move every site from assessment to action.</h1>
          <p>Complete governed assessments, close corrective-action gaps, and give enterprise leaders a trusted view of progress.</p>
          <div className="login-story__proof">
            <span><CheckCircle2 size={18} /><span>Role-aware workspaces</span></span>
            <span><CheckCircle2 size={18} /><span>Protected site context</span></span>
            <span><CheckCircle2 size={18} /><span>Guided first-time setup</span></span>
          </div>
        </div>
        <p className="login-story__footer">Kimberly-Clark EHS&S</p>
      </section>

      <section className="login-access">
        <div className="login-card">
          <div className="login-card__heading">
            <span className="login-card__icon"><LockKeyhole size={23} /></span>
            <div><p className="eyebrow">Secure access</p><h2>Sign in to your workspace</h2><p>Your assigned role and site determine what you can view and edit.</p></div>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field"><span>Work email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="name@kimberly-clark.com" required /></label>
            <label className="auth-field"><span>Password</span><div className="password-control"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <Button type="submit" variant="primary" size="large" disabled={Boolean(pending)}>{pending === "password" ? "Signing in…" : "Sign in"}</Button>
          </form>

          {demoEnabled && (
            <div className="demo-access">
              <div className="demo-access__heading"><div><span>Demo access</span><small>Temporary and removable before release</small></div><span className="demo-badge">Demo mode</span></div>
              <p>Choose a user to see the exact pages, permissions, and guided journey available to that role.</p>
              <div className="demo-role-grid">
                {(Object.keys(demoAccounts) as UserRole[]).map((role) => {
                  const account = demoAccounts[role];
                  const Icon = roleIcons[role];
                  return (
                    <button key={role} type="button" className={cx("demo-role-card", pending === role && "demo-role-card--pending")} disabled={Boolean(pending)} onClick={() => handleDemo(role)}>
                      <span className="demo-role-card__icon"><Icon size={20} /></span>
                      <span><strong>{roleProfiles[role].shortLabel}</strong><small>{account.email}</small><small>{account.name} · {account.scope}</small></span>
                      <ArrowRight size={18} />
                    </button>
                  );
                })}
              </div>
              <p className="demo-credentials">For form testing, use any demo email above with password <strong>Welcome123!</strong></p>
            </div>
          )}
        </div>
        <p className="login-support">Need access help? <a href="mailto:ehss-support@example.com?subject=EHS%26S%20sign-in%20help">Contact EHS&S support</a></p>
      </section>
    </main>
  );
}
