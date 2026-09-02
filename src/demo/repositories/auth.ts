import type { AuthenticationRepository } from "../../data-access/contracts";
import type { AuthUser } from "../../shared/types";
import { demoAccounts } from "../fixtures/auth";

const PASSWORD_OVERRIDES_KEY = "ehss-demo-password-overrides-v1";
const CHANGE_CODE_KEY = "ehss-demo-password-change-code-v1";
const CHANGE_CODE_TTL_MS = 10 * 60 * 1000;

/**
 * Demo accounts start with the fixed password in fixtures/auth.ts, but Security settings lets a
 * signed-in demo user change it. There is no backend to persist that to, so the new value is
 * kept per-account in localStorage and layered over the fixture password on every sign-in check.
 */
function readPasswordOverrides(): Record<string, string> {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PASSWORD_OVERRIDES_KEY) ?? "{}") as unknown;
    return saved && typeof saved === "object" ? (saved as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function activeDemoPassword(userId: string, fixturePassword: string): string {
  return readPasswordOverrides()[userId] ?? fixturePassword;
}

function setDemoPasswordOverride(userId: string, password: string) {
  const overrides = readPasswordOverrides();
  overrides[userId] = password;
  window.localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify(overrides));
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(local.length - visible.length, 3))}@${domain}`;
}

function generateChangeCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function publicAccount(account: AuthUser & { password: string }): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    initials: account.initials,
    role: account.role,
    roleLabel: account.roleLabel,
    scope: account.scope,
  };
}

export const demoAuthenticationRepository: AuthenticationRepository<AuthUser> = {
  async signInWithPassword(email, password) {
    const account = Object.values(demoAccounts).find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!account || activeDemoPassword(account.id, account.password) !== password) {
      throw new Error("The email or password is incorrect. Use one of the demo accounts shown below.");
    }
    return publicAccount(account);
  },
  async requestPasswordReset() {
    // This review build has no email delivery connected. The account is not looked up here
    // either, so success never confirms whether an address has one — same as production would.
  },
};

/**
 * Used by the demo AuthenticationGateway, which resolves the signed-in account by email before
 * calling these — the shared AuthenticationRepository contract has no user id to work with.
 *
 * Password changes are two steps, mirroring how a real email-verified change works: step one
 * checks the current password and issues a short-lived code; step two requires that exact code
 * before the new password takes effect. There is no email delivery in this review build, so the
 * code is returned as `devCode` for the dialog to display directly rather than mailed out.
 */
export function beginDemoPasswordChange(userId: string, fixturePassword: string, currentPassword: string, email: string) {
  if (activeDemoPassword(userId, fixturePassword) !== currentPassword) throw new Error("Your current password is incorrect.");
  const code = generateChangeCode();
  window.localStorage.setItem(CHANGE_CODE_KEY, JSON.stringify({ userId, code, expiresAt: Date.now() + CHANGE_CODE_TTL_MS }));
  return { maskedEmail: maskEmail(email), devCode: code };
}

export function confirmDemoPasswordChange(userId: string, code: string, newPassword: string) {
  if (newPassword.length < 8) throw new Error("Choose a new password with at least 8 characters.");
  const raw = window.localStorage.getItem(CHANGE_CODE_KEY);
  const parsed = raw ? (JSON.parse(raw) as { userId: string; code: string; expiresAt: number }) : null;
  if (!parsed || parsed.userId !== userId || parsed.expiresAt < Date.now()) {
    throw new Error("This code has expired. Request a new one.");
  }
  if (parsed.code !== code.trim()) throw new Error("That code doesn't match. Check the code and try again.");
  setDemoPasswordOverride(userId, newPassword);
  window.localStorage.removeItem(CHANGE_CODE_KEY);
}
