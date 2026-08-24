/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useDataSource } from "../../../app/providers/DataSourceProvider";
import { authenticationGatewayFor } from "../../../data-access/repositories/authentication";
import type { AuthUser, PasskeyRecord, UserRole } from "../../../shared/types";

export type { AuthUser, PasskeyRecord } from "../../../shared/types";

interface AuthContextValue {
  user: AuthUser | null;
  demoEnabled: boolean;
  demoAccounts: readonly AuthUser[];
  demoPassword?: string;
  isAuthenticated: boolean;
  passkeys: PasskeyRecord[];
  passkeyPromptOpen: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signInDemo: (role: UserRole) => Promise<AuthUser>;
  signInWithPasskey: () => Promise<AuthUser>;
  signOut: () => void;
  switchDemoRole: (role: UserRole) => void;
  registerPasskey: (name: string) => Promise<PasskeyRecord>;
  renamePasskey: (id: string, name: string) => void;
  removePasskey: (id: string) => void;
  dismissPasskeyPrompt: () => void;
  finishPasskeyPrompt: () => void;
}

const SESSION_KEY = "ehss-auth-session-v1";
const PASSKEYS_KEY = "ehss-passkeys-v1";
const FIRST_LOGIN_PASSKEY_KEY = "ehss-first-login-passkey-prompt-v2";
const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(source: "demo" | "api"): AuthUser | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? "null") as AuthUser | null;
    if (!saved?.id || !saved?.role) return null;
    if (source === "api" && saved.id.startsWith("demo-")) return null;
    return saved;
  } catch {
    return null;
  }
}

function readPasskeys(): PasskeyRecord[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PASSKEYS_KEY) ?? "[]") as PasskeyRecord[];
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function persistSession(user: AuthUser | null) {
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(SESSION_KEY);
}

function passkeyCeremonyAvailable() {
  return window.isSecureContext && "PublicKeyCredential" in window && Boolean(navigator.credentials);
}

function readInitialPasskeyPrompt(source: "demo" | "api") {
  const user = readSession(source);
  const records = readPasskeys();
  return Boolean(user && passkeyCeremonyAvailable() && !records.some((item) => item.userId === user.id) && window.localStorage.getItem(FIRST_LOGIN_PASSKEY_KEY) === "pending");
}

function randomChallenge() {
  return window.crypto.getRandomValues(new Uint8Array(32));
}

function encodeText(value: string) {
  return new TextEncoder().encode(value);
}

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return window.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = window.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function assertPasskeySupport() {
  if (!window.isSecureContext || !("PublicKeyCredential" in window) || !navigator.credentials) {
    throw new Error("Passkeys are not available in this browser or connection. Use a supported browser on a secure connection.");
  }
}

function readablePasskeyError(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") return new Error("The passkey request was cancelled or timed out.");
  if (error instanceof Error) return error;
  return new Error("The passkey request could not be completed.");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { source } = useDataSource();
  const authenticationGateway = useMemo(() => authenticationGatewayFor(source), [source]);
  const demoEnabled = authenticationGateway.demoEnabled;
  const [user, setUser] = useState<AuthUser | null>(() => readSession(source));
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>(readPasskeys);
  const [passkeyPromptOpen, setPasskeyPromptOpen] = useState(() => readInitialPasskeyPrompt(source));

  function updateSession(nextUser: AuthUser | null) {
    setUser(nextUser);
    persistSession(nextUser);
  }

  function updatePasskeys(nextPasskeys: PasskeyRecord[]) {
    setPasskeys(nextPasskeys);
    window.localStorage.setItem(PASSKEYS_KEY, JSON.stringify(nextPasskeys));
  }

  function prepareFirstLoginPasskeyPrompt(account: AuthUser) {
    const existingState = window.localStorage.getItem(FIRST_LOGIN_PASSKEY_KEY);
    const hasPasskey = passkeys.some((item) => item.userId === account.id);
    if (hasPasskey) {
      window.localStorage.setItem(FIRST_LOGIN_PASSKEY_KEY, "completed");
      setPasskeyPromptOpen(false);
      return;
    }
    if (!existingState && passkeyCeremonyAvailable()) {
      window.localStorage.setItem(FIRST_LOGIN_PASSKEY_KEY, "pending");
      setPasskeyPromptOpen(true);
    }
  }

  async function signIn(email: string, password: string) {
    const safeAccount = await authenticationGateway.signInWithPassword(email, password);
    updateSession(safeAccount);
    prepareFirstLoginPasskeyPrompt(safeAccount);
    return safeAccount;
  }

  async function signInDemo(role: UserRole) {
    if (!demoEnabled) throw new Error("Demo access is disabled.");
    const safeAccount = await authenticationGateway.signInDemo(role);
    updateSession(safeAccount);
    prepareFirstLoginPasskeyPrompt(safeAccount);
    return safeAccount;
  }

  function switchDemoRole(role: UserRole) {
    if (!demoEnabled || !user?.id.startsWith("demo-")) return;
    const account = authenticationGateway.findAccountByRole(role);
    if (account) updateSession(account);
  }

  async function registerPasskey(name: string) {
    if (!user) throw new Error("Sign in before adding a passkey.");
    assertPasskeySupport();
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: randomChallenge(),
          rp: { name: "Maitsys Assure" },
          user: { id: encodeText(user.id), name: user.email, displayName: user.name },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
          timeout: 60_000,
          attestation: "none",
        },
      }) as PublicKeyCredential | null;
      if (!credential) throw new Error("No passkey was created.");
      const record: PasskeyRecord = {
        id: window.crypto.randomUUID(),
        credentialId: toBase64Url(credential.rawId),
        userId: user.id,
        name: name.trim() || "This device",
        createdAt: new Date().toISOString(),
      };
      updatePasskeys([...passkeys, record]);
      return record;
    } catch (error) {
      throw readablePasskeyError(error);
    }
  }

  async function signInWithPasskey() {
    if (!demoEnabled) throw new Error("Organization passkey sign-in is not connected in this environment.");
    assertPasskeySupport();
    if (!passkeys.length) throw new Error("No passkey is registered in this browser yet. Sign in with a demo account and add one from Settings.");
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          allowCredentials: passkeys.map((item) => ({ id: fromBase64Url(item.credentialId), type: "public-key" as const })),
          userVerification: "preferred",
          timeout: 60_000,
        },
      }) as PublicKeyCredential | null;
      if (!credential) throw new Error("No passkey was selected.");
      const credentialId = toBase64Url(credential.rawId);
      const match = passkeys.find((item) => item.credentialId === credentialId);
      if (!match) throw new Error("This passkey is not registered for the application.");
      const account = authenticationGateway.findAccount(match.userId);
      if (!account) throw new Error("The account for this passkey is no longer available.");
      updatePasskeys(passkeys.map((item) => item.id === match.id ? { ...item, lastUsedAt: new Date().toISOString() } : item));
      updateSession(account);
      return account;
    } catch (error) {
      throw readablePasskeyError(error);
    }
  }

  function renamePasskey(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    updatePasskeys(passkeys.map((item) => item.id === id ? { ...item, name: trimmed } : item));
  }

  function removePasskey(id: string) {
    updatePasskeys(passkeys.filter((item) => item.id !== id));
  }

  function dismissPasskeyPrompt() {
    window.localStorage.setItem(FIRST_LOGIN_PASSKEY_KEY, "dismissed");
    setPasskeyPromptOpen(false);
  }

  function finishPasskeyPrompt() {
    window.localStorage.setItem(FIRST_LOGIN_PASSKEY_KEY, "completed");
    setPasskeyPromptOpen(false);
  }

  function signOut() {
    setPasskeyPromptOpen(false);
    updateSession(null);
    void authenticationGateway.signOut();
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    demoEnabled,
    demoAccounts: authenticationGateway.demoAccounts,
    demoPassword: authenticationGateway.demoPassword,
    isAuthenticated: Boolean(user),
    passkeys,
    passkeyPromptOpen,
    signIn,
    signInDemo,
    signInWithPasskey,
    signOut,
    switchDemoRole,
    registerPasskey,
    renamePasskey,
    removePasskey,
    dismissPasskeyPrompt,
    finishPasskeyPrompt,
  // Functions intentionally close over the latest local session and passkey state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [authenticationGateway, demoEnabled, passkeyPromptOpen, passkeys, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
