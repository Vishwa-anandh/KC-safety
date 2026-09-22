export type Performance = "initial" | "emerging" | "performing" | "not-assessed";
export type ResponseValue = "no" | "partial" | "yes" | null;
export type CompletionState = "not-started" | "in-progress" | "complete";
export type AssessmentPeriod = "2026 Q1" | "2026 Q2" | "2026 Q3";
export type UserRole = "site-contributor" | "administrator";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: UserRole;
  roleLabel: string;
  scope: string;
}

export interface PasskeyRecord {
  id: string;
  credentialId: string;
  userId: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface SectionSummary {
  id: string;
  shortName: string;
  name: string;
  description: string;
  completion: number;
  performance: Performance;
  questions: number;
  gaps: number;
  kind: "operating-system" | "performance-standard";
}

export interface ActionItem {
  description: string;
  owner: string;
  /** Lifecycle state for the corrective action created from a gap response. */
  status?: "Open" | "In progress" | "Complete";
  /** Optional update, next step, or review note for the action owner. */
  followUp?: string;
  /** Immutable origin and latest-update details shown in the administrator action log. */
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface EvidenceItem {
  id: string;
  type: "file" | "link";
  title: string;
  detail: string;
  /** How this upload satisfies the question's requirement — collected once the response claims
   * some level of implementation (Partial or Yes); a No response has nothing to explain. */
  note?: string;
  uploadedBy: string;
  uploadedAt: string;
  questionId?: string;
}

export type AssessmentHistoryEvent = "Response recorded" | "Response changed" | "Action added" | "Action updated" | "Action removed" | "Evidence added" | "Evidence updated" | "Evidence removed";

export interface AssessmentHistoryEntry {
  id: string;
  event: AssessmentHistoryEvent;
  recordedAt: string;
  recordedBy: string;
  response: ResponseValue;
  action?: ActionItem;
  evidence: EvidenceItem[];
}

/**
 * A requirement IS a single question — there is no separate nested question list. `id` is the
 * one stable identity for the whole record (what a response, evidence item, or audit entry keyed
 * on the old, separate `AssessmentQuestion.id` now keys on directly). `requirementId` is purely
 * the grouping label carried over from the source workbook's "Requirement ID" column (e.g. several
 * rows all reading "LET-01") — it clusters related requirement-questions for display, but no
 * longer merges them into one record with many questions.
 */
export interface Requirement {
  id: string;
  requirementId: string;
  number: string;
  title: string;
  sectionId: string;
  sectionName: string;
  subsection: string;
  requirementText: string;
  text: string;
  /** "How to meet this requirement" steps shown inline under the question — set by an
   *  administrator (imported from a workbook or typed in Master requirements) and carried
   *  through from the matching `MasterRequirement` by shared/domain/requirement-sync.ts. */
  guidance: string[];
  expectedEvidence: string[];
  evidenceRequired?: boolean;
  response: ResponseValue;
  period: AssessmentPeriod;
  respondedAt?: string;
  respondedBy?: string;
  action?: ActionItem;
  /** Append-only snapshots used by the enterprise question history timeline. */
  history?: AssessmentHistoryEntry[];
  evidence: EvidenceItem[];
}

export interface DashboardSite {
  id: string;
  name: string;
  code: string;
  region: string;
  segment: string;
  completion: number;
  performance: Performance;
  gaps: number;
  updated: string;
}

export interface OwnerRecord {
  id: string;
  program: string;
  category: string;
  primaryName: string;
  primaryEmail: string;
  backupName: string;
  backupEmail: string;
}

export interface SiteContacts {
  siteManager: string;
  siteManagerEmail: string;
  environmentalLeader: string;
  environmentalLeaderEmail: string;
  healthSafetyLeader: string;
  healthSafetyLeaderEmail: string;
  occupationalHealthNurse: string;
  occupationalHealthNurseEmail: string;
  regionalHealthSafetyLeader: string;
  regionalHealthSafetyEmail: string;
  regionalEnvironmentalLeader: string;
  regionalEnvironmentalEmail: string;
  regionalOccupationalHealthLeader: string;
  regionalOccupationalHealthEmail: string;
}

/**
 * A master requirement IS a single question — there is no separate nested question list (see
 * the matching note on `Requirement`). `id` is the one stable identity admins manage it by
 * (what used to be the separate question id). `requirementId` is the grouping label carried over
 * from the source workbook's "Requirement ID" column.
 */
export interface MasterRequirement {
  id: string;
  requirementId: string;
  number: string;
  title: string;
  text: string;
  /** "How to meet this requirement" steps shown inline under the question on the site assessment
   *  — set by an administrator, either imported (the workbook's "How to Meet Requirement" column,
   *  its lines after the first, which becomes `text`) or typed directly in Master requirements.
   *  Optional so snapshots saved before this field existed still load. */
  guidance?: string[];
  section: string;
  subsection: string;
  status: "Published" | "Draft";
  siteIds: string[];
  importBatchId?: string;
  expectedEvidence: string[];
  evidenceRequired?: boolean;
  /** 1 = highest. Rank within the question's own section (Operating System section, or
   *  Performance Standard) — the only priority Performance Standard imports provide. */
  sectionPriority?: number;
  /** 1 = highest. Rank across the whole import batch — only Operating System imports provide this. */
  overallPriority?: number;
}

export type RequirementAuditAction = "baseline" | "created" | "updated" | "deleted" | "imported" | "published";
export type RequirementAuditChangeKind = "added" | "updated" | "deleted";
export type RequirementAuditTarget = "requirement" | "status" | "scope" | "question" | "evidence";

export interface RequirementAuditChange {
  kind: RequirementAuditChangeKind;
  target: RequirementAuditTarget;
  label: string;
  before?: string;
  after?: string;
  questionId?: string;
}

export interface RequirementAuditActor {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface RequirementAuditEntry {
  id: string;
  requirementId: string;
  requirementTitle: string;
  action: RequirementAuditAction;
  summary: string;
  recordedAt: string;
  recordedBy: RequirementAuditActor;
  changes: RequirementAuditChange[];
  batchId?: string;
}

/** Mirrors UserRole in GuidedSetup.tsx. Declared here rather than imported so this module
 *  stays free of React component dependencies. */
export type SiteUserRole = UserRole;

export interface SiteUser {
  id: string;
  name: string;
  email: string;
  role: SiteUserRole;
  siteId: string;
  status: "Active" | "Inactive";
}

export type NotificationCategory = "assessment" | "action" | "assignment" | "master-data" | "site";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  createdAt: string;
  /** Roles this notification is addressed to. */
  audience: SiteUserRole[];
  /** Per-role read state. Kept on the record rather than in a separate collection so each
   *  signed-in role marks its own copy read without affecting the others. */
  readBy: SiteUserRole[];
  /** Route opened when the notification is clicked. */
  link?: string;
  siteId?: string;
}
