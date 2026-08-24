import { demoAuthenticationEnabled } from "../../app/config/environment";
import { demoAccounts } from "../../demo/fixtures/auth";
import { demoAuthenticationRepository, publicAccount } from "../../demo/repositories/auth";
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
  };
}

export function authenticationGatewayFor(source: DataSourceKind): AuthenticationGateway {
  return source === "demo" ? demoGateway : createApiGateway();
}
