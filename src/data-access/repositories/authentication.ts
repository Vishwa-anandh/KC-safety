import { demoAuthenticationEnabled } from "../../app/config/environment";
import { demoAccounts } from "../../demo/fixtures/auth";
import { beginDemoPasswordChange, confirmDemoPasswordChange, demoAuthenticationRepository, publicAccount } from "../../demo/repositories/auth";
import type { AuthUser, UserRole } from "../../shared/types";
import type { DataSourceKind } from "../contracts";
import { RestClient } from "../rest/client";
import { RestAuthenticationRepository } from "../rest/repositories";
import { sessionTokenStore } from "../rest/token-store";

export interface AuthenticationGateway {
  readonly kind: DataSourceKind;
  readonly demoEnabled: boolean;
  readonly demoAccounts: readonly AuthUser[];
  readonly demoPassword?: string;
  signInWithPassword(email: string, password: string): Promise<AuthUser>;
  signInDemo(role: UserRole): Promise<AuthUser>;
  findAccount(userId: string): AuthUser | undefined;
  findAccountByRole(role: UserRole): AuthUser | undefined;
  signOut(): Promise<void>;
  /** Always resolves — success never confirms whether the address has an account. */
  requestPasswordReset(email: string): Promise<void>;
  /** `email` identifies the signed-in account; the demo gateway has no server session to infer
   *  it from the way the API gateway does. Validates `currentPassword` and issues an emailed
   *  verification code the caller must pass to confirmPasswordChange. */
  requestPasswordChangeCode(email: string, currentPassword: string): Promise<{ maskedEmail: string; devCode?: string }>;
  confirmPasswordChange(email: string, code: string, newPassword: string): Promise<void>;
}

function isAuthUser(value: unknown): value is AuthUser {
  return Boolean(value && typeof value === "object" && "id" in value && "role" in value && "email" in value);
}

const demoUsers = Object.values(demoAccounts).map(publicAccount);

const demoGateway: AuthenticationGateway = {
  kind: "demo",
  demoEnabled: demoAuthenticationEnabled,
  demoAccounts: demoAuthenticationEnabled ? demoUsers : [],
  demoPassword: demoAuthenticationEnabled ? Object.values(demoAccounts)[0]?.password : undefined,
  signInWithPassword(email, password) {
    if (!demoAuthenticationEnabled) return Promise.reject(new Error("Demo access is disabled."));
    return demoAuthenticationRepository.signInWithPassword(email, password);
  },
  async signInDemo(role) {
    if (!demoAuthenticationEnabled) throw new Error("Demo access is disabled.");
    return publicAccount(demoAccounts[role]);
  },
  findAccount(userId) {
    return demoUsers.find((account) => account.id === userId);
  },
  findAccountByRole(role) {
    return demoUsers.find((account) => account.role === role);
  },
  async signOut() {
    await demoAuthenticationRepository.signOut?.();
  },
  async requestPasswordReset(email) {
    if (!demoAuthenticationEnabled) throw new Error("Password reset is not available in this environment.");
    await demoAuthenticationRepository.requestPasswordReset?.(email);
  },
  async requestPasswordChangeCode(email, currentPassword) {
    if (!demoAuthenticationEnabled) throw new Error("Password changes are not available in this environment.");
    const account = Object.values(demoAccounts).find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!account) throw new Error("Your account could not be found.");
    return beginDemoPasswordChange(account.id, account.password, currentPassword, account.email);
  },
  async confirmPasswordChange(email, code, newPassword) {
    if (!demoAuthenticationEnabled) throw new Error("Password changes are not available in this environment.");
    const account = Object.values(demoAccounts).find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!account) throw new Error("Your account could not be found.");
    confirmDemoPasswordChange(account.id, code, newPassword);
  },
};

function createApiGateway(): AuthenticationGateway {
  const repository = new RestAuthenticationRepository(new RestClient());
  return {
    kind: "api",
    demoEnabled: false,
    demoAccounts: [],
    async signInWithPassword(email, password) {
      const session = await repository.signInWithPassword(email, password);
      if (!isAuthUser(session.user)) throw new Error("The API sign-in response did not contain a valid application user.");
      sessionTokenStore.set(session.accessToken);
      return session.user;
    },
    async signInDemo() {
      throw new Error("Demo access is disabled.");
    },
    findAccount() {
      return undefined;
    },
    findAccountByRole() {
      return undefined;
    },
    async signOut() {
      try {
        await repository.signOut?.();
      } finally {
        sessionTokenStore.clear();
      }
    },
    async requestPasswordReset(email) {
      await repository.requestPasswordReset?.(email);
    },
    async requestPasswordChangeCode(_email, currentPassword) {
      const result = await repository.requestPasswordChangeCode?.(currentPassword);
      if (!result) throw new Error("Password changes are not available in this environment.");
      return result;
    },
    async confirmPasswordChange(_email, code, newPassword) {
      await repository.confirmPasswordChange?.(code, newPassword);
    },
  };
}

export function authenticationGatewayFor(source: DataSourceKind): AuthenticationGateway {
  return source === "demo" ? demoGateway : createApiGateway();
}
