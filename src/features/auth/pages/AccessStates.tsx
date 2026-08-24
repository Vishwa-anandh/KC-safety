import { CircleHelp, KeyRound, LogIn, UserRoundX } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../model/AuthProvider";
import { EmptyState } from "../../../shared/ui/UI";

export function NoAssignmentScreen() {
  return <StandaloneState><EmptyState icon={<UserRoundX size={35} />} title="No site is assigned to your account" description="Your sign-in was successful, but you do not currently have permission to work with a KC site. Ask an administrator to assign your site and role." action={<div className="state-actions"><a className="button button--primary button--default" href="mailto:ehss-support@example.com?subject=Site%20assignment%20request"><CircleHelp size={18} /><span>Contact support</span></a><SignOutLink /></div>} /></StandaloneState>;
}

export function SessionExpiredScreen() {
  const { signOut } = useAuth();
  useEffect(() => signOut(), [signOut]);
  return <StandaloneState><EmptyState icon={<KeyRound size={35} />} title="Your session has expired" description="Sign in again to continue. Changes confirmed as saved before the session ended are available; any unconfirmed changes may need to be entered again." action={<div className="state-actions"><Link className="button button--primary button--default" to="/login"><LogIn size={18} /><span>Sign in again</span></Link><a className="button button--tertiary button--default" href="mailto:ehss-support@example.com?subject=Sign-in%20help"><span>Get sign-in help</span></a></div>} /></StandaloneState>;
}

function SignOutLink() {
  const { signOut } = useAuth();
  return <Link className="button button--tertiary button--default" to="/login" onClick={signOut}><span>Sign out</span></Link>;
}

function StandaloneState({ children }: { children: React.ReactNode }) {
  return <div className="standalone-state"><div className="standalone-state__brand"><span>KC</span><div><strong>EHS&S</strong><small>Self-Assessment</small></div></div><main>{children}</main><footer>Kimberly-Clark EHS&S Self-Assessment</footer></div>;
}
