import {
  assignedSite,
  currentAssessmentPeriod,
  dashboardSites,
  initialSiteContacts,
  masterRequirements,
  notifications,
  ownerRecords,
  regions,
  requirements,
  sections,
  segments,
  siteUsers,
} from "../fixtures/assessment";
import type { AppDataRepository, AppSnapshot } from "../../data-access/contracts";
import { createdRequirementAuditChanges } from "../../shared/domain/requirement-audit";
import type { ActionItem, AssessmentHistoryEntry, EvidenceItem, MasterRequirement, Requirement, RequirementAuditEntry } from "../../shared/types";

// Bumped alongside the requirement/question data-model flatten (a requirement is now a single
// question, not a nested list) — old snapshots under the previous key are simply left alone and
// a fresh one is seeded, rather than migrating an incompatible shape in place.
const STORAGE_KEY = "ehss-phase-one-state-v2";

function seededQuestionHistory(requirement: Requirement, action: ActionItem | undefined, evidence: EvidenceItem[]): AssessmentHistoryEntry[] {
  if (!requirement.response) return [];
  const responseAt = new Date(requirement.respondedAt ?? "2026-08-01T09:00:00.000Z").getTime();
  const timestamp = (daysAfterResponse: number, hoursAfterResponse = 0, minutesAfterResponse = 0) => new Date(responseAt + ((daysAfterResponse * 24 + hoursAfterResponse) * 60 + minutesAfterResponse) * 60 * 1000).toISOString();
  const responseActor = requirement.respondedBy ?? "Maya Patel";
  const initialResponse = !action && !evidence.length && requirement.response === "yes" ? "partial" : requirement.response;
  const entries: AssessmentHistoryEntry[] = [{
    id: `${requirement.id}-demo-response-recorded`,
    event: "Response recorded",
    recordedAt: timestamp(0),
    recordedBy: responseActor,
    response: initialResponse,
    evidence: [],
  }];

  if (action) {
    entries.push({
      id: `${requirement.id}-demo-action-added`,
      event: "Action added",
      recordedAt: timestamp(2, 3, 30),
      recordedBy: action.createdBy ?? responseActor,
      response: requirement.response,
      action: { ...action },
      evidence: [],
    });
  }

  if (evidence.length) {
    entries.push({
      id: `${requirement.id}-demo-evidence-added`,
      event: "Evidence added",
      recordedAt: action ? timestamp(4, 7, 15) : timestamp(2, 4, 20),
      recordedBy: evidence.at(-1)?.uploadedBy ?? responseActor,
      response: requirement.response,
      action: action ? { ...action } : undefined,
      evidence: evidence.map((item) => ({ ...item })),
    });
  } else if (!action) {
    entries.push({
      id: `${requirement.id}-demo-response-changed`,
      event: "Response changed",
      recordedAt: timestamp(2, 5, 45),
      recordedBy: responseActor,
      response: requirement.response,
      evidence: [],
    });
  }

  return entries;
}

function normalizeActionMetadata(records: AppSnapshot["requirements"]) {
  return records.map((requirement) => {
    const action = requirement.action ?? (requirement.response === "no" || requirement.response === "partial"
      ? { description: "", owner: "", status: "Open" as const, followUp: "" }
      : undefined);
    const responseHistory = requirement.response ? {
      respondedAt: requirement.respondedAt ?? "2026-08-01T09:00:00.000Z",
      respondedBy: requirement.respondedBy ?? "Maya Patel",
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
    const evidence = requirement.evidence.map((item) => ({ ...item }));
    const existingHistory = requirement.history ?? [];
    const isGeneratedEntry = (entry: AssessmentHistoryEntry) => entry.id === `${requirement.id}-seed-response` || entry.id.startsWith(`${requirement.id}-demo-`);
    const hasGeneratedHistory = existingHistory.some(isGeneratedEntry);
    const recordedHistory = existingHistory.filter((entry) => !isGeneratedEntry(entry));
    const history = requirement.response && (!existingHistory.length || hasGeneratedHistory)
      ? [...seededQuestionHistory(requirement, normalizedAction, evidence), ...recordedHistory]
      : existingHistory;
    return {
      ...requirement,
      ...responseHistory,
      action: normalizedAction,
      history,
    };
  });
}

function requirementAuditBaseline(requirementsToRecord: MasterRequirement[]): RequirementAuditEntry[] {
  const baselineAt = "2026-08-01T08:00:00.000Z";
  return requirementsToRecord.map((requirement, index) => ({
    id: `audit-baseline-${requirement.id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    requirementId: requirement.id,
    requirementTitle: requirement.title,
    action: "baseline",
    summary: "Initial master requirement baseline recorded.",
    recordedAt: new Date(new Date(baselineAt).getTime() + index * 60_000).toISOString(),
    recordedBy: { id: "demo-rachel-morgan", name: "Rachel Morgan", email: "rachel.morgan@demo.kc", role: "administrator" },
    changes: createdRequirementAuditChanges(requirement),
  }));
}

function requirementAuditDemoEvents(requirementsToRecord: MasterRequirement[]): RequirementAuditEntry[] {
  const knownById = new Map([...masterRequirements, ...requirementsToRecord].map((requirement) => [requirement.id, requirement]));
  const knownRequirements = [...knownById.values()];
  // `id` below is the flattened requirement-question's own id (e.g. "q-1"); `groupTitle` looks up
  // by the shared "Requirement ID" grouping label (e.g. "OS 1.2.1") since several flattened items
  // can share one requirement's title.
  const groupTitle = (requirementGroupId: string, fallback: string) => knownRequirements.find((item) => item.requirementId === requirementGroupId)?.title ?? fallback;
  const questionText = (id: string, fallback: string) => knownById.get(id)?.text ?? fallback;
  const evidenceText = (id: string, fallback: string) => knownById.get(id)?.expectedEvidence.join("; ") || fallback;
  const rachel = { id: "demo-rachel-morgan", name: "Rachel Morgan", email: "rachel.morgan@demo.kc", role: "administrator" as const };
  const jordan = { id: "demo-jordan-reed", name: "Jordan Reed", email: "jordan.reed@demo.kc", role: "administrator" as const };

  return [
    {
      id: "audit-demo-import-os-1-2-1",
      requirementId: "OS 1.2.1",
      requirementTitle: groupTitle("OS 1.2.1", "Leadership commitment and accountability"),
      action: "imported",
      summary: "Requirement imported with assessment questions and expected evidence.",
      recordedAt: "2026-08-04T09:15:00.000Z",
      recordedBy: rachel,
      batchId: "IMP-2026-450497",
      changes: [
        { kind: "added", target: "requirement", label: "Requirement imported", after: groupTitle("OS 1.2.1", "Leadership commitment and accountability") },
        { kind: "added", target: "question", label: "Question 1 added", after: questionText("q-1", "Are site leadership responsibilities documented and communicated?") },
        { kind: "added", target: "evidence", label: "Expected evidence added to Question 1", after: evidenceText("q-1", "Leadership accountability matrix") },
      ],
    },
    {
      id: "audit-demo-edit-os-1-2-1",
      requirementId: "OS 1.2.1",
      requirementTitle: groupTitle("OS 1.2.1", "Leadership commitment and accountability"),
      action: "updated",
      summary: "Question wording and expected evidence edited.",
      recordedAt: "2026-08-07T14:40:00.000Z",
      recordedBy: jordan,
      changes: [
        { kind: "updated", target: "question", label: "Question 2 edited", before: "Are EHS&S objectives reviewed during business meetings?", after: questionText("q-2", "Are EHS&S objectives and results reviewed as part of the site's normal business operating rhythm?") },
        { kind: "updated", target: "evidence", label: "Expected evidence edited for Question 2", before: "EHS&S scorecard.", after: evidenceText("q-2", "Business review agenda; objectives tracking sheet") },
      ],
    },
    {
      id: "audit-demo-add-question-os-2-1-3",
      requirementId: "OS 2.1.3",
      requirementTitle: groupTitle("OS 2.1.3", "Risks, opportunities, and planning controls"),
      action: "updated",
      summary: "A new assessment question and its evidence requirements were added.",
      recordedAt: "2026-08-10T11:20:00.000Z",
      recordedBy: rachel,
      changes: [
        { kind: "added", target: "question", label: "Question 2 added", after: questionText("planning-q-2", "Are measurable EHS&S objectives connected to the highest-priority risks?") },
        { kind: "added", target: "evidence", label: "Expected evidence added to Question 2", after: evidenceText("planning-q-2", "Approved objectives; risk-to-objective traceability") },
      ],
    },
    {
      id: "audit-demo-remove-question-os-4-3-2",
      requirementId: "OS 4.3.2",
      requirementTitle: groupTitle("OS 4.3.2", "Management of operational change"),
      action: "updated",
      summary: "An obsolete question and its expected evidence were removed.",
      recordedAt: "2026-08-12T16:05:00.000Z",
      recordedBy: jordan,
      changes: [
        { kind: "deleted", target: "question", label: "Question 3 removed", before: "Are contractors briefed on every temporary operational change?" },
        { kind: "deleted", target: "evidence", label: "Expected evidence removed from Question 3", before: "Contractor change briefing acknowledgement." },
      ],
    },
    {
      id: "audit-demo-publish-os-2-1-3",
      requirementId: "OS 2.1.3",
      requirementTitle: groupTitle("OS 2.1.3", "Risks, opportunities, and planning controls"),
      action: "published",
      summary: "Requirement published for site assessments.",
      recordedAt: "2026-08-13T10:30:00.000Z",
      recordedBy: rachel,
      changes: [{ kind: "updated", target: "status", label: "Publishing state changed", before: "Draft", after: "Published" }],
    },
    {
      id: "audit-demo-remove-evidence-ps-7-2-1",
      requirementId: "PS 7.2.1",
      requirementTitle: groupTitle("PS 7.2.1", "Machine safeguarding verification"),
      action: "updated",
      summary: "Outdated expected evidence was removed from a question.",
      recordedAt: "2026-08-15T13:10:00.000Z",
      recordedBy: jordan,
      changes: [{ kind: "deleted", target: "evidence", label: "Expected evidence removed from Question 1", before: "Legacy guard photo inventory." }],
    },
    {
      id: "audit-demo-delete-ps-8-4-2",
      requirementId: "PS 8.4.2",
      requirementTitle: "Legacy contractor induction standard",
      action: "deleted",
      summary: "Duplicate master requirement deleted after content review.",
      recordedAt: "2026-08-16T15:45:00.000Z",
      recordedBy: rachel,
      changes: [
        { kind: "deleted", target: "requirement", label: "Requirement deleted", before: "PS 8.4.2 · Legacy contractor induction standard" },
        { kind: "deleted", target: "question", label: "Question 1 removed", before: "Have all contractors completed the legacy induction module?" },
        { kind: "deleted", target: "evidence", label: "Expected evidence removed", before: "Legacy induction completion report." },
      ],
    },
    {
      id: "audit-demo-create-oh-3-1-4",
      requirementId: "OH 3.1.4",
      requirementTitle: groupTitle("OH 3.1.4", "Occupational exposure assessment"),
      action: "created",
      summary: "New occupational health requirement added.",
      recordedAt: "2026-08-18T09:25:00.000Z",
      recordedBy: jordan,
      changes: [
        { kind: "added", target: "requirement", label: "Requirement added", after: groupTitle("OH 3.1.4", "Occupational exposure assessment") },
        { kind: "added", target: "question", label: "Question 1 added", after: questionText("occupational-q-1", "Is the occupational exposure inventory current?") },
        { kind: "added", target: "evidence", label: "Expected evidence added", after: evidenceText("occupational-q-1", "Current exposure inventory; similar exposure group list") },
      ],
    },
    {
      id: "audit-demo-edit-ps-7-2-1",
      requirementId: "PS 7.2.1",
      requirementTitle: groupTitle("PS 7.2.1", "Machine safeguarding verification"),
      action: "updated",
      summary: "Requirement title and inspection question edited.",
      recordedAt: "2026-08-20T12:35:00.000Z",
      recordedBy: rachel,
      changes: [
        { kind: "updated", target: "requirement", label: "Requirement title edited", before: "Machine safeguarding checks", after: groupTitle("PS 7.2.1", "Machine safeguarding verification") },
        { kind: "updated", target: "question", label: "Question 2 edited", before: "Are safeguards inspected regularly?", after: questionText("machine-q-2", "Are safeguard inspections recorded at the required frequency?") },
      ],
    },
  ];
}

function freshSnapshot(): AppSnapshot {
  const masterRequirementRecords = structuredClone(masterRequirements);
  return {
    requirements: normalizeActionMetadata(structuredClone(requirements)),
    sections: structuredClone(sections),
    siteContacts: structuredClone(initialSiteContacts),
    ownerRecords: structuredClone(ownerRecords),
    masterRequirements: masterRequirementRecords,
    requirementAuditLog: [...requirementAuditBaseline(masterRequirementRecords), ...requirementAuditDemoEvents(masterRequirementRecords)],
    importHistory: [],
    siteUsers: structuredClone(siteUsers),
    sites: structuredClone(dashboardSites),
    notifications: structuredClone(notifications),
    assignedSite: structuredClone(assignedSite),
    lastUpdated: new Date().toISOString(),
    regions: structuredClone(regions),
    segments: structuredClone(segments),
  };
}

function restoreMasterRequirements(records: AppSnapshot["masterRequirements"] | undefined, fallback: AppSnapshot["masterRequirements"]) {
  if (!records?.length) return fallback;
  return records.map((requirement) => ({
    ...requirement,
    siteIds: requirement.siteIds ?? [],
    expectedEvidence: requirement.expectedEvidence ?? [],
    evidenceRequired: requirement.evidenceRequired ?? (requirement.expectedEvidence?.length ?? 0) > 0,
  }));
}

function restoreSnapshot(): AppSnapshot {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return freshSnapshot();
    const parsed = JSON.parse(saved) as Partial<AppSnapshot>;
    const fallback = freshSnapshot();
    const restoredMasterRequirements = restoreMasterRequirements(parsed.masterRequirements, fallback.masterRequirements);
    return {
      ...fallback,
      ...parsed,
      requirements: parsed.requirements?.length
        ? normalizeActionMetadata(parsed.requirements.map((requirement) => {
          const fallbackRequirement = fallback.requirements.find((item) => item.id === requirement.id);
          const expectedEvidence = requirement.expectedEvidence ?? fallbackRequirement?.expectedEvidence ?? [];
          return {
            ...requirement,
            expectedEvidence,
            evidenceRequired: requirement.evidenceRequired ?? fallbackRequirement?.evidenceRequired ?? expectedEvidence.length > 0,
            period: requirement.period ?? currentAssessmentPeriod,
            respondedAt: requirement.response ? requirement.respondedAt ?? "2026-08-01T09:00:00.000Z" : undefined,
            respondedBy: requirement.response ? requirement.respondedBy ?? "Maya Patel" : undefined,
            evidence: (requirement.evidence ?? []).map((item) => ({ ...item })),
            action: requirement.action ? {
              ...requirement.action,
              status: requirement.action.status ?? "Open",
              followUp: requirement.action.followUp ?? "",
              createdAt: requirement.action.createdAt ?? "2026-08-01T09:00:00.000Z",
              createdBy: requirement.action.createdBy ?? "Maya Patel",
              updatedAt: requirement.action.updatedAt ?? "2026-08-01T09:00:00.000Z",
              updatedBy: requirement.action.updatedBy ?? "Maya Patel",
            } : requirement.response === "no" || requirement.response === "partial"
              ? { description: "", owner: "", status: "Open", followUp: "", createdAt: "2026-08-01T09:00:00.000Z", createdBy: "Maya Patel", updatedAt: "2026-08-01T09:00:00.000Z", updatedBy: "Maya Patel" }
              : undefined,
          };
        }))
        : fallback.requirements,
      ownerRecords: parsed.ownerRecords?.length ? parsed.ownerRecords : fallback.ownerRecords,
      masterRequirements: restoredMasterRequirements,
      requirementAuditLog: (() => {
        const restoredEntries = parsed.requirementAuditLog ?? requirementAuditBaseline(restoredMasterRequirements);
        const existingIds = new Set(restoredEntries.map((entry) => entry.id));
        const missingDemoEntries = requirementAuditDemoEvents(restoredMasterRequirements).filter((entry) => !existingIds.has(entry.id));
        return [...restoredEntries, ...missingDemoEntries];
      })(),
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
