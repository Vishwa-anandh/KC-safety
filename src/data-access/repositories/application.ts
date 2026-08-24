import type { AppDataRepository, AppSnapshot } from "../contracts";
import type { DataSourceKind } from "../contracts";
import { demoApplicationRepository } from "../../demo/repositories/application";

const emptySnapshot: AppSnapshot = {
  requirements: [], sections: [], siteContacts: {
    siteManager: "", siteManagerEmail: "", environmentalLeader: "", environmentalLeaderEmail: "", healthSafetyLeader: "", healthSafetyLeaderEmail: "", occupationalHealthNurse: "", occupationalHealthNurseEmail: "", regionalHealthSafetyLeader: "", regionalHealthSafetyEmail: "", regionalEnvironmentalLeader: "", regionalEnvironmentalEmail: "", regionalOccupationalHealthLeader: "", regionalOccupationalHealthEmail: "",
  }, ownerRecords: [], masterRequirements: [], importHistory: [], siteUsers: [], sites: [], notifications: [],
  assignedSite: { name: "", code: "", region: "", segment: "", updated: "" }, lastUpdated: new Date().toISOString(),
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
