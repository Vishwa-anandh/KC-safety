import type {
  AdministrationRepository,
  AssessmentRepository,
  AuthenticationRepository,
  ImportHistoryRecord,
  NotificationRepository,
  SiteRepository,
  UserPreferences,
  UserPreferencesRepository,
  WebAuthnRepository,
} from "../contracts";
import type { AppNotification, DashboardSite, OwnerRecord, Requirement, SiteContacts, SiteUser, UserRole } from "../../shared/types";
import { RestClient } from "./client";

/**
 * REST adapters are intentionally small and typed. Backend-specific DTO conversion belongs here,
 * never in a screen or feature hook. Paths are the contract documented in docs/api-integration.md.
 */
export class RestAssessmentRepository implements AssessmentRepository {
  constructor(private readonly client: RestClient) {}
  getAssessment(siteId: string) { return this.client.request<Requirement[]>(`/sites/${siteId}/assessment`); }
  updateQuestion(requirementId: string, questionId: string, input: unknown) { return this.client.request<void>(`/requirements/${requirementId}/questions/${questionId}`, { method: "PATCH", body: JSON.stringify(input) }); }
  createEvidence(requirementId: string, input: FormData | unknown) { return this.client.request<void>(`/requirements/${requirementId}/evidence`, { method: "POST", body: input instanceof FormData ? input : JSON.stringify(input) }); }
  updateEvidence(requirementId: string, evidenceId: string, input: unknown) { return this.client.request<void>(`/requirements/${requirementId}/evidence/${evidenceId}`, { method: "PATCH", body: JSON.stringify(input) }); }
  removeEvidence(requirementId: string, evidenceId: string) { return this.client.request<void>(`/requirements/${requirementId}/evidence/${evidenceId}`, { method: "DELETE" }); }
}

export class RestSiteRepository implements SiteRepository {
  constructor(private readonly client: RestClient) {}
  getSite(siteId: string) { return this.client.request<DashboardSite>(`/sites/${siteId}`); }
  updateContacts(siteId: string, contacts: SiteContacts) { return this.client.request<SiteContacts>(`/sites/${siteId}/contacts`, { method: "PUT", body: JSON.stringify(contacts) }); }
  getOwners(siteId: string) { return this.client.request<OwnerRecord[]>(`/sites/${siteId}/owners`); }
}

export class RestAdministrationRepository implements AdministrationRepository {
  constructor(private readonly client: RestClient) {}
  getSites() { return this.client.request<DashboardSite[]>("/sites"); }
  getSiteUsers(siteId: string) { return this.client.request<SiteUser[]>(`/sites/${siteId}/users`); }
  createSiteUser(siteId: string, input: Omit<SiteUser, "id">) { return this.client.request<SiteUser>(`/sites/${siteId}/users`, { method: "POST", body: JSON.stringify(input) }); }
  updateSiteUser(siteId: string, user: SiteUser) { return this.client.request<SiteUser>(`/sites/${siteId}/users/${user.id}`, { method: "PUT", body: JSON.stringify(user) }); }
  removeSiteUser(siteId: string, userId: string) { return this.client.request<void>(`/sites/${siteId}/users/${userId}`, { method: "DELETE" }); }
  importRequirements(input: FormData) { return this.client.request<ImportHistoryRecord>("/imports/requirements", { method: "POST", body: input }); }
  publishImport(batchId: string) { return this.client.request<void>(`/imports/${batchId}/publish`, { method: "POST" }); }
}

export class RestNotificationRepository implements NotificationRepository {
  constructor(private readonly client: RestClient) {}
  getNotifications() { return this.client.request<AppNotification[]>("/notifications"); }
  markRead(id: string) { return this.client.request<void>(`/notifications/${id}/read`, { method: "POST" }); }
  markAllRead(role: UserRole) { return this.client.request<void>("/notifications/read-all", { method: "POST", body: JSON.stringify({ role }) }); }
}

export class RestUserPreferencesRepository implements UserPreferencesRepository {
  constructor(private readonly client: RestClient) {}
  getPreferences() { return this.client.request<UserPreferences>("/preferences"); }
  updatePreferences(input: Partial<UserPreferences>) { return this.client.request<UserPreferences>("/preferences", { method: "PUT", body: JSON.stringify(input) }); }
}

export class RestWebAuthnRepository implements WebAuthnRepository {
  constructor(private readonly client: RestClient) {}
  beginRegistration() { return this.client.request<unknown>("/auth/passkeys/registration/options", { method: "POST" }); }
  finishRegistration(credential: unknown) { return this.client.request<void>("/auth/passkeys/registration/verify", { method: "POST", body: JSON.stringify(credential) }); }
  beginAuthentication() { return this.client.request<unknown>("/auth/passkeys/authentication/options", { method: "POST" }); }
  finishAuthentication(credential: unknown) { return this.client.request<unknown>("/auth/passkeys/authentication/verify", { method: "POST", body: JSON.stringify(credential) }); }
}

export interface RestSession { accessToken: string; user: unknown; }
export class RestAuthenticationRepository implements AuthenticationRepository<RestSession> {
  constructor(private readonly client: RestClient) {}
  signInWithPassword(email: string, password: string) { return this.client.request<RestSession>("/auth/session", { method: "POST", body: JSON.stringify({ email, password }) }); }
  signOut() { return this.client.request<void>("/auth/session", { method: "DELETE" }); }
}
