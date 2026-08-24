import {
  assignedSite,
  currentAssessmentPeriod,
  dashboardSites,
  initialSiteContacts,
  masterRequirements,
  notifications,
  ownerRecords,
  requirements,
  sections,
  siteUsers,
} from "../fixtures/assessment";
import type { AppDataRepository, AppSnapshot } from "../../data-access/contracts";

const STORAGE_KEY = "ehss-phase-one-state-v1";

function freshSnapshot(): AppSnapshot {
  return {
    requirements: structuredClone(requirements),
    sections: structuredClone(sections),
    siteContacts: structuredClone(initialSiteContacts),
    ownerRecords: structuredClone(ownerRecords),
    masterRequirements: structuredClone(masterRequirements),
    importHistory: [],
    siteUsers: structuredClone(siteUsers),
    sites: structuredClone(dashboardSites),
    notifications: structuredClone(notifications),
    assignedSite: structuredClone(assignedSite),
    lastUpdated: new Date().toISOString(),
  };
}

function restoreSnapshot(): AppSnapshot {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return freshSnapshot();
    const parsed = JSON.parse(saved) as Partial<AppSnapshot>;
    const fallback = freshSnapshot();
    return {
      ...fallback,
      ...parsed,
      requirements: parsed.requirements?.length
        ? parsed.requirements.map((requirement) => ({
          ...requirement,
          questions: requirement.questions.map((question) => ({ ...question, period: question.period ?? currentAssessmentPeriod })),
        }))
        : fallback.requirements,
      ownerRecords: parsed.ownerRecords?.length ? parsed.ownerRecords : fallback.ownerRecords,
      masterRequirements: parsed.masterRequirements?.length
        ? parsed.masterRequirements.map((requirement) => ({ ...requirement, siteIds: requirement.siteIds ?? [], questions: requirement.questions ?? [] }))
        : fallback.masterRequirements,
      importHistory: (parsed.importHistory ?? []).map((record) => ({ ...record, siteIds: record.siteIds ?? [], publishStatus: record.publishStatus ?? "Published" })),
      siteUsers: parsed.siteUsers ?? fallback.siteUsers,
      sites: parsed.sites?.length ? parsed.sites : fallback.sites,
      notifications: (parsed.notifications ?? fallback.notifications).map((record) => ({ ...record, audience: record.audience ?? [], readBy: record.readBy ?? [] })),
      assignedSite: parsed.assignedSite ?? fallback.assignedSite,
      sections: parsed.sections?.length ? parsed.sections : fallback.sections,
    };
  } catch {
    return freshSnapshot();
  }
}

export const demoApplicationRepository: AppDataRepository = {
  kind: "demo",
  status: { connected: true },
  loadSnapshot: restoreSnapshot,
  saveSnapshot(snapshot) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  },
};

/** Demo metadata is deliberately colocated with fixtures so it can be removed as one package. */
export const demoSectionFixtures = sections;
