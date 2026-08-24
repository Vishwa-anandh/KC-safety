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

function normalizeActionMetadata(records: AppSnapshot["requirements"]) {
  return records.map((requirement) => ({
    ...requirement,
    questions: requirement.questions.map((question) => {
      const action = question.action ?? (question.response === "no" || question.response === "partial"
        ? { description: "", owner: "", status: "Open" as const, followUp: "" }
        : undefined);
      const responseHistory = question.response ? {
        respondedAt: question.respondedAt ?? "2026-08-01T09:00:00.000Z",
        respondedBy: question.respondedBy ?? "Maya Patel",
      } : {};
      const normalizedAction = action ? {
        ...action,
        status: action.status ?? "Open",
        followUp: action.followUp ?? "",
        createdAt: action.createdAt ?? "2026-08-01T09:00:00.000Z",
        createdBy: action.createdBy ?? "Maya Patel",
        updatedAt: action.updatedAt ?? "2026-08-01T09:00:00.000Z",
        updatedBy: action.updatedBy ?? "Maya Patel",
      } : undefined;
      const evidence = requirement.evidence.filter((item) => item.questionId === question.id).map((item) => ({ ...item }));
      const history = question.history?.length ? question.history : question.response ? [{
        id: `${question.id}-seed-response`,
        event: "Response recorded" as const,
        recordedAt: question.respondedAt ?? "2026-08-01T09:00:00.000Z",
        recordedBy: question.respondedBy ?? "Maya Patel",
        response: question.response,
        action: normalizedAction ? { ...normalizedAction } : undefined,
        evidence,
      }] : [];
      return {
        ...question,
        ...responseHistory,
        action: normalizedAction,
        history,
      };
    }),
  }));
}

function freshSnapshot(): AppSnapshot {
  return {
    requirements: normalizeActionMetadata(structuredClone(requirements)),
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

function restoreMasterRequirements(records: AppSnapshot["masterRequirements"] | undefined, fallback: AppSnapshot["masterRequirements"]) {
  if (!records?.length) return fallback;
  const fixtureById = new Map(fallback.map((requirement) => [requirement.id, requirement]));
  return records.map((requirement) => {
    const fixture = fixtureById.get(requirement.id);
    // Older persisted demo snapshots stored the master list before its question/evidence content
    // existed. Hydrate only those seeded records from the current fixture; administrator-created
    // drafts (which do not have a fixture match) retain their intentionally empty question list.
    const questions = requirement.questions?.length ? requirement.questions : fixture?.questions ?? [];
    return {
      ...requirement,
      siteIds: requirement.siteIds ?? [],
      questions: questions.map((question) => ({
        ...question,
        expectedEvidence: question.expectedEvidence ?? [],
        evidenceRequired: question.evidenceRequired ?? question.expectedEvidence?.length > 0,
      })),
    };
  });
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
        ? normalizeActionMetadata(parsed.requirements.map((requirement) => ({
          ...requirement,
          questions: requirement.questions.map((question) => ({
            ...question,
            period: question.period ?? currentAssessmentPeriod,
            respondedAt: question.response ? question.respondedAt ?? "2026-08-01T09:00:00.000Z" : undefined,
            respondedBy: question.response ? question.respondedBy ?? "Maya Patel" : undefined,
            action: question.action ? {
              ...question.action,
              status: question.action.status ?? "Open",
              followUp: question.action.followUp ?? "",
              createdAt: question.action.createdAt ?? "2026-08-01T09:00:00.000Z",
              createdBy: question.action.createdBy ?? "Maya Patel",
              updatedAt: question.action.updatedAt ?? "2026-08-01T09:00:00.000Z",
              updatedBy: question.action.updatedBy ?? "Maya Patel",
            } : question.response === "no" || question.response === "partial"
              ? { description: "", owner: "", status: "Open", followUp: "", createdAt: "2026-08-01T09:00:00.000Z", createdBy: "Maya Patel", updatedAt: "2026-08-01T09:00:00.000Z", updatedBy: "Maya Patel" }
              : undefined,
          })),
          // Requirement-level evidence was the original demo shape. Preserve it by associating
          // old records with the first question that requests evidence.
          evidence: (requirement.evidence ?? []).map((evidence) => evidence.questionId ? evidence : {
            ...evidence,
            questionId: requirement.questions.find((question) => question.evidenceRequired ?? question.expectedEvidence?.length)?.id ?? requirement.questions[0]?.id,
          }),
        })))
        : fallback.requirements,
      ownerRecords: parsed.ownerRecords?.length ? parsed.ownerRecords : fallback.ownerRecords,
      masterRequirements: restoreMasterRequirements(parsed.masterRequirements, fallback.masterRequirements),
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
