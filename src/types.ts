export type Performance = "initial" | "emerging" | "performing" | "not-assessed";
export type ResponseValue = "no" | "partial" | "yes" | null;
export type CompletionState = "not-started" | "in-progress" | "complete";

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
}
