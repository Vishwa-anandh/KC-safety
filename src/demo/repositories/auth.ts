import type { AuthenticationRepository } from "../../data-access/contracts";
import type { AuthUser } from "../../shared/types";
import { demoAccounts } from "../fixtures/auth";

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
    if (!account || account.password !== password) throw new Error("The email or password is incorrect. Use one of the demo accounts shown below.");
    return publicAccount(account);
  },
};
