import type {
  AppNotification,
  DashboardSite,
  EvidenceItem,
  MasterRequirement,
  OwnerRecord,
  RequirementAuditEntry,
  Requirement,
  SectionSummary,
  SiteContacts,
  SiteUser,
  UserRole,
} from "../shared/types";

export interface ImportHistoryRecord {
  id: string;
  fileName: string;
  mode?: "new" | "update";
  importedAt: string;
  importedBy: string;
  siteIds: string[];
  created: number;
  updated: number;
  unchanged: number;
  status: "Completed";
  publishStatus: "Draft" | "Published";
}

export interface RequirementImportValidationResult {
  valid: boolean;
  errors: Array<{ row: number; field?: string; message: string }>;
  warnings: Array<{ row: number; field?: string; message: string }>;
}

export interface RequirementImportPreview {
  batch: ImportHistoryRecord;
  requirements: MasterRequirement[];
  changes: Array<{ requirementId: string; questionId?: string; field: string; before?: string; after?: string }>;
}

export interface AssignedSite {
  name: string;
  code: string;
  region: string;
  segment: string;
  updated: string;
}

export interface AppSnapshot {
  requirements: Requirement[];
  sections: SectionSummary[];
  siteContacts: SiteContacts;
  ownerRecords: OwnerRecord[];
  masterRequirements: MasterRequirement[];
  requirementAuditLog: RequirementAuditEntry[];
  importHistory: ImportHistoryRecord[];
  siteUsers: SiteUser[];
  sites: DashboardSite[];
  notifications: AppNotification[];
  assignedSite: AssignedSite;
  lastUpdated: string;
  /** Admin-curated dropdown values shown on the site form — see the Config screen. */
  regions: string[];
  segments: string[];
  /** Admin-curated Section/Sub-Section values for master requirements — shown on the create/edit
   *  form and validated against on import. Named distinctly from `sections` (SectionSummary[]
   *  dashboard rollups) above, which is a different, unrelated concept. */
  masterSections: string[];
  masterSubSections: string[];
}

export type DataSourceKind = "demo" | "api";

export interface DataSourceStatus {
  connected: boolean;
  message?: string;
}

/** The state boundary used by the existing UI. API adapters can replace it progressively by domain. */
export interface AppDataRepository {
  readonly kind: DataSourceKind;
  readonly status: DataSourceStatus;
  loadSnapshot(): AppSnapshot;
  saveSnapshot(snapshot: AppSnapshot): void;
}

export interface AuthenticationRepository<TUser> {
  signInWithPassword(email: string, password: string): Promise<TUser>;
  signOut?(): Promise<void>;
  /** Always resolves, whether or not the address has an account — callers must not use success
   *  to infer that an account exists. */
  requestPasswordReset?(email: string): Promise<void>;
  /** Server infers the account from the caller's session; there is no user id parameter.
   *  Validates `currentPassword` and emails a short-lived code to confirm the change. */
  requestPasswordChangeCode?(currentPassword: string): Promise<{ maskedEmail: string; devCode?: string }>;
  /** Applies `newPassword` once `code` (from requestPasswordChangeCode) is verified. */
  confirmPasswordChange?(code: string, newPassword: string): Promise<void>;
}

export interface WebAuthnRepository {
  beginRegistration(): Promise<unknown>;
  finishRegistration(credential: unknown): Promise<void>;
  beginAuthentication(): Promise<unknown>;
  finishAuthentication(credential: unknown): Promise<unknown>;
}

export interface QuestionUpdateInput {
  response?: "no" | "partial" | "yes" | null;
  action?: { description: string; owner: string };
  period?: string;
}

export type EvidenceInput = FormData | Omit<EvidenceItem, "id">;

/** REST resource contracts. UI code must depend on feature hooks, never on these paths. */
export interface AssessmentRepository {
  getAssessment(siteId: string): Promise<Requirement[]>;
  updateQuestion(requirementId: string, questionId: string, input: QuestionUpdateInput): Promise<void>;
  createEvidence(requirementId: string, input: EvidenceInput): Promise<void>;
  updateEvidence(requirementId: string, evidenceId: string, input: EvidenceInput): Promise<void>;
  removeEvidence(requirementId: string, evidenceId: string): Promise<void>;
}

export interface SiteRepository {
  getSite(siteId: string): Promise<DashboardSite>;
  updateContacts(siteId: string, contacts: SiteContacts): Promise<SiteContacts>;
  getOwners(siteId: string): Promise<OwnerRecord[]>;
}

export interface AdministrationRepository {
  getSites(): Promise<DashboardSite[]>;
  getSiteUsers(siteId: string): Promise<SiteUser[]>;
  createSiteUser(siteId: string, input: Omit<SiteUser, "id">): Promise<SiteUser>;
  updateSiteUser(siteId: string, user: SiteUser): Promise<SiteUser>;
  removeSiteUser(siteId: string, userId: string): Promise<void>;
  validateRequirementImport(input: FormData): Promise<RequirementImportValidationResult>;
  stageRequirementImport(input: FormData): Promise<RequirementImportPreview>;
  getRequirementImportPreview(batchId: string): Promise<RequirementImportPreview>;
  publishImport(batchId: string): Promise<void>;
}

export interface NotificationRepository {
  getNotifications(): Promise<AppNotification[]>;
  markRead(id: string): Promise<void>;
  markAllRead(role: UserRole): Promise<void>;
}

export interface UserPreferences {
  theme: "system" | "light" | "dark";
  accent: string;
  notifications: Record<string, boolean>;
}

export interface UserPreferencesRepository {
  getPreferences(): Promise<UserPreferences>;
  updatePreferences(input: Partial<UserPreferences>): Promise<UserPreferences>;
}
