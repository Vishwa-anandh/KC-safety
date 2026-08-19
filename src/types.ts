export type Performance = "initial" | "emerging" | "performing" | "not-assessed";
export type ResponseValue = "no" | "partial" | "yes" | null;
export type CompletionState = "not-started" | "in-progress" | "complete";
export type AssessmentPeriod = "2026 Q1" | "2026 Q2" | "2026 Q3";

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
}

export interface EvidenceItem {
  id: string;
  type: "file" | "link";
  title: string;
  detail: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AssessmentQuestion {
  id: string;
  number: string;
  text: string;
  response: ResponseValue;
  period: AssessmentPeriod;
  action?: ActionItem;
}

export interface Requirement {
  id: string;
  number: string;
  title: string;
  sectionId: string;
  sectionName: string;
  subsection: string;
  requirementText: string;
  guidance: string[];
  expectedEvidence: string[];
  questions: AssessmentQuestion[];
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

export interface MasterRequirement {
  id: string;
  title: string;
  section: string;
  version: string;
  status: "Published" | "Draft";
  siteIds: string[];
  importBatchId?: string;
}

/** Mirrors UserRole in GuidedSetup.tsx. Declared here rather than imported so this module
 *  stays free of React component dependencies. */
export type SiteUserRole = "site-contributor" | "enterprise-viewer" | "administrator";

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
