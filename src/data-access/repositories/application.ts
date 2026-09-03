import type { AppDataRepository, AppSnapshot } from "../contracts";
import type { DataSourceKind } from "../contracts";
import type { MasterQuestion } from "../../shared/types";
import { demoImportedQuestionsFor } from "../../demo/fixtures/imports";
import { demoApplicationRepository } from "../../demo/repositories/application";

const emptySnapshot: AppSnapshot = {
  requirements: [], sections: [], siteContacts: {
    siteManager: "", siteManagerEmail: "", environmentalLeader: "", environmentalLeaderEmail: "", healthSafetyLeader: "", healthSafetyLeaderEmail: "", occupationalHealthNurse: "", occupationalHealthNurseEmail: "", regionalHealthSafetyLeader: "", regionalHealthSafetyEmail: "", regionalEnvironmentalLeader: "", regionalEnvironmentalEmail: "", regionalOccupationalHealthLeader: "", regionalOccupationalHealthEmail: "",
  }, ownerRecords: [], masterRequirements: [], requirementAuditLog: [], importHistory: [], siteUsers: [], sites: [], notifications: [],
  assignedSite: { name: "", code: "", region: "", segment: "", updated: "" }, lastUpdated: new Date().toISOString(),
  regions: [], segments: [], masterSections: [], masterSubSections: [],
};

const apiApplicationRepository: AppDataRepository = {
  kind: "api",
  status: { connected: false, message: "The live API source is selected, but application endpoints have not been connected yet." },
  loadSnapshot: () => structuredClone(emptySnapshot),
  saveSnapshot: () => undefined,
};

export function applicationRepositoryFor(source: DataSourceKind): AppDataRepository {
  return source === "demo" ? demoApplicationRepository : apiApplicationRepository;
}

export function importedQuestionsFor(source: DataSourceKind, requirementId: string, templateIndex: number): MasterQuestion[] {
  return source === "demo" ? demoImportedQuestionsFor(requirementId, templateIndex) : [];
}
