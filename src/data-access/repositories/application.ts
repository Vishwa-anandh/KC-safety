import type { AppDataRepository, AppSnapshot } from "../contracts";
import type { DataSourceKind } from "../contracts";
import { demoApplicationRepository } from "../../demo/repositories/application";

const emptySnapshot: AppSnapshot = {
  requirementsBySite: {}, siteContactsBySite: {}, ownerRecordsBySite: {}, homeSiteId: "",
  sections: [], masterRequirements: [], requirementAuditLog: [], importHistory: [], siteUsers: [], sites: [], notifications: [],
  lastUpdated: new Date().toISOString(),
  regions: [], segments: [], sectionNames: [], subsectionNames: [],
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
