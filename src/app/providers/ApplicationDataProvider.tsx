/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { actionComplete, currentAssessmentPeriod, rollupPerformance } from "../../shared/domain/assessment";
import { useDataSource } from "./DataSourceProvider";
import { applicationRepositoryFor } from "../../data-access/repositories/application";
import type { AppSnapshot, DataSourceStatus, ImportHistoryRecord } from "../../data-access/contracts";
import type {
  ActionItem,
  AppNotification,
  AssessmentHistoryEvent,
  AssessmentPeriod,
  AssessmentQuestion,
  DashboardSite,
  EvidenceItem,
  MasterRequirement,
  OwnerRecord,
  ResponseValue,
  SectionSummary,
  SiteContacts,
  SiteUser,
  SiteUserRole,
} from "../../shared/types";

type PersistedState = AppSnapshot;

function appendQuestionHistory(question: AssessmentQuestion, event: AssessmentHistoryEvent, actorName: string, recordedAt: string, evidence: EvidenceItem[], coalesce = false): AssessmentQuestion {
  const history = question.history ?? [];
  const entry = {
    id: `${question.id}-${recordedAt}-${event.toLowerCase().replaceAll(" ", "-")}`,
    event,
    recordedAt,
    recordedBy: actorName,
    response: question.response,
    action: question.action ? { ...question.action } : undefined,
    evidence: evidence.map((item) => ({ ...item })),
  };
  const previous = history.at(-1);
  const previousTime = previous ? new Date(previous.recordedAt).getTime() : 0;
  const shouldCoalesce = coalesce && previous?.event === event && previous.recordedBy === actorName && new Date(recordedAt).getTime() - previousTime < 5 * 60 * 1000;
  return { ...question, history: shouldCoalesce ? [...history.slice(0, -1), { ...entry, id: previous.id }] : [...history, entry] };
}

interface ApplicationDataValue extends PersistedState {
  dataSourceStatus: DataSourceStatus;
  sectionSummaries: SectionSummary[];
  dashboardSiteRows: DashboardSite[];
  overallCompletion: number;
  overallPerformance: ReturnType<typeof rollupPerformance>;
  gapCount: number;
  missingActionCount: number;
  updateQuestion: (requirementId: string, questionId: string, update: { response?: ResponseValue; action?: ActionItem; period?: AssessmentPeriod }, actorName?: string) => void;
  addEvidence: (requirementId: string, item: EvidenceItem, actorName?: string) => void;
  updateEvidence: (requirementId: string, item: EvidenceItem, actorName?: string) => void;
  removeEvidence: (requirementId: string, evidenceId: string, actorName?: string) => void;
  saveSiteContacts: (contacts: SiteContacts) => void;
  updateOwner: (owner: OwnerRecord) => void;
  addMasterRequirement: (requirement: MasterRequirement) => void;
  updateMasterRequirement: (requirement: MasterRequirement) => void;
  removeMasterRequirement: (requirementId: string) => void;
  submitImportBatch: (fileName: string, siteIds: string[]) => ImportHistoryRecord;
  publishImportBatch: (batchId: string) => void;
  addSiteUser: (user: SiteUser) => void;
  updateSiteUser: (user: SiteUser) => void;
  removeSiteUser: (userId: string) => void;
  addSite: (site: DashboardSite) => void;
  updateSite: (site: DashboardSite) => void;
  importSites: (sites: DashboardSite[]) => { added: number; skipped: string[] };
  notify: (input: Omit<AppNotification, "id" | "createdAt" | "readBy">) => void;
  markNotificationRead: (id: string, role: SiteUserRole) => void;
  markAllNotificationsRead: (role: SiteUserRole) => void;
}

function freshState(): PersistedState {
  return applicationRepositoryFor("demo").loadSnapshot();
}

function loadState(): PersistedState {
  return freshState();
  /*
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return freshState();
    const parsed = JSON.parse(saved) as Partial<PersistedState>;
    return {
      ...freshState(),
      ...parsed,
      // Backfill fields added after some browsers may already have a persisted snapshot from
      // an earlier schema — without this, a stale record missing e.g. `siteIds` would throw the
      // moment code reads `.length` on it, rather than just quietly defaulting.
      requirements: parsed.requirements?.length
        ? parsed.requirements.map((requirement) => ({
          ...requirement,
          questions: requirement.questions.map((question) => ({ ...question, period: question.period ?? currentAssessmentPeriod })),
        }))
        : structuredClone(seedRequirements),
      ownerRecords: parsed.ownerRecords?.length ? parsed.ownerRecords : structuredClone(seedOwnerRecords),
      masterRequirements: parsed.masterRequirements?.length
        ? parsed.masterRequirements.map((requirement) => ({ ...requirement, siteIds: requirement.siteIds ?? [] }))
        : structuredClone(seedMasterRequirements),
      importHistory: (parsed.importHistory ?? []).map((record) => ({ ...record, siteIds: record.siteIds ?? [], publishStatus: record.publishStatus ?? "Published" })),
      siteUsers: parsed.siteUsers ?? structuredClone(seedSiteUsers),
      sites: parsed.sites?.length ? parsed.sites : structuredClone(seedSites),
      notifications: (parsed.notifications ?? structuredClone(seedNotifications)).map((record) => ({ ...record, audience: record.audience ?? [], readBy: record.readBy ?? [] })),
    };
  } catch {
    return freshState();
  }
  */
}

const ApplicationDataContext = createContext<ApplicationDataValue | null>(null);

export function ApplicationDataProvider({ children }: { children: ReactNode }) {
  const { source } = useDataSource();
  const repository = useMemo(() => applicationRepositoryFor(source), [source]);
  const [state, setState] = useState<PersistedState>(() => repository.loadSnapshot() || loadState());

  useEffect(() => {
    setState(repository.loadSnapshot());
  }, [repository]);

  useEffect(() => {
    repository.saveSnapshot(state);
  }, [repository, state]);

  const derived = useMemo(() => {
    const sectionSummaries = state.sections.map((section) => {
      const questions = state.requirements
        .filter((requirement) => requirement.sectionId === section.id)
        .flatMap((requirement) => requirement.questions);
      if (!questions.length) return section;
      const completed = questions.filter((question) => actionComplete(question.response, question.action)).length;
      return {
        ...section,
        completion: Math.round((completed / questions.length) * 100),
        performance: rollupPerformance(questions.map((question) => question.response)),
        questions: questions.length,
        gaps: questions.filter((question) => question.response === "no" || question.response === "partial").length,
      };
    });
    const allQuestions = state.requirements.flatMap((requirement) => requirement.questions);
    const completed = allQuestions.filter((question) => actionComplete(question.response, question.action)).length;
    const overallCompletion = allQuestions.length ? Math.round((completed / allQuestions.length) * 100) : 0;
    const overallPerformance = rollupPerformance(allQuestions.map((question) => question.response));
    const gapCount = allQuestions.filter((question) => question.response === "no" || question.response === "partial").length;
    const missingActionCount = 0;
    const dashboardSiteRows = state.sites.map((site) => site.id === "northstar" ? {
      ...site,
      completion: overallCompletion,
      performance: overallPerformance,
      gaps: gapCount,
      updated: new Date(state.lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    } : site);
    return { sectionSummaries, overallCompletion, overallPerformance, gapCount, missingActionCount, dashboardSiteRows };
  }, [state.lastUpdated, state.requirements, state.sections, state.sites]);

  function touch(update: (current: PersistedState) => PersistedState) {
    setState((current) => ({ ...update(current), lastUpdated: new Date().toISOString() }));
  }

  function updateQuestion(requirementId: string, questionId: string, update: { response?: ResponseValue; action?: ActionItem; period?: AssessmentPeriod }, actorName = "Site contributor") {
    // Setting a response tags it with the current assessment period unless a period was
    // explicitly given — this is descriptive metadata on the one live response, not a new
    // versioning axis (there is still exactly one response per question).
    const tagged = update.response !== undefined && update.period === undefined
      ? { ...update, period: currentAssessmentPeriod }
      : update;
    const changedAt = new Date().toISOString();
    touch((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) => requirement.id === requirementId ? {
        ...requirement,
        questions: requirement.questions.map((question) => {
          if (question.id !== questionId) return question;
          // A No or Partial response is itself the trigger for an in-app corrective action.
          // Preserve any action already being worked on; a Yes response may still carry an
          // optional action added by the user, but never creates one automatically.
          const response = tagged.response ?? question.response;
          const autoAction = (response === "no" || response === "partial") && !question.action && tagged.action === undefined
            ? { description: "", owner: "", status: "Open" as const, followUp: "", createdAt: changedAt, createdBy: actorName, updatedAt: changedAt, updatedBy: actorName }
            : undefined;
          const action = tagged.action ? {
            ...tagged.action,
            status: tagged.action.status ?? question.action?.status ?? "Open",
            followUp: tagged.action.followUp ?? question.action?.followUp ?? "",
            createdAt: question.action?.createdAt ?? changedAt,
            createdBy: question.action?.createdBy ?? actorName,
            updatedAt: changedAt,
            updatedBy: actorName,
          } : autoAction;
          const responseHistory = update.response !== undefined
            ? { respondedAt: changedAt, respondedBy: actorName }
            : {};
          const nextQuestion = { ...question, ...tagged, ...responseHistory, ...(action ? { action } : {}) };
          const responseChanged = update.response !== undefined && update.response !== question.response;
          const actionChanged = Object.prototype.hasOwnProperty.call(update, "action");
          const event: AssessmentHistoryEvent | undefined = responseChanged
            ? (question.response ? "Response changed" : "Response recorded")
            : actionChanged
              ? (tagged.action ? (question.action ? "Action updated" : "Action added") : "Action removed")
              : undefined;
          return event
            ? appendQuestionHistory(nextQuestion, event, actorName, changedAt, requirement.evidence.filter((item) => item.questionId === questionId), event === "Action updated")
            : nextQuestion;
        }),
      } : requirement),
    }));
  }

  function addEvidence(requirementId: string, item: EvidenceItem, actorName = "Site contributor") {
    const changedAt = new Date().toISOString();
    touch((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) => requirement.id === requirementId
        ? (() => {
          const evidence = [...requirement.evidence, item];
          return { ...requirement, evidence, questions: requirement.questions.map((question) => question.id === item.questionId ? appendQuestionHistory(question, "Evidence added", actorName, changedAt, evidence.filter((record) => record.questionId === question.id)) : question) };
        })()
        : requirement),
    }));
  }

  function updateEvidence(requirementId: string, item: EvidenceItem, actorName = "Site contributor") {
    const changedAt = new Date().toISOString();
    touch((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) => requirement.id === requirementId
        ? (() => {
          const evidence = requirement.evidence.map((record) => record.id === item.id ? item : record);
          return { ...requirement, evidence, questions: requirement.questions.map((question) => question.id === item.questionId ? appendQuestionHistory(question, "Evidence updated", actorName, changedAt, evidence.filter((record) => record.questionId === question.id)) : question) };
        })()
        : requirement),
    }));
  }

  function removeEvidence(requirementId: string, evidenceId: string, actorName = "Site contributor") {
    const changedAt = new Date().toISOString();
    touch((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) => {
        if (requirement.id !== requirementId) return requirement;
        const removed = requirement.evidence.find((item) => item.id === evidenceId);
        const evidence = requirement.evidence.filter((item) => item.id !== evidenceId);
        return { ...requirement, evidence, questions: requirement.questions.map((question) => question.id === removed?.questionId ? appendQuestionHistory(question, "Evidence removed", actorName, changedAt, evidence.filter((record) => record.questionId === question.id)) : question) };
      }),
    }));
  }

  function saveSiteContacts(siteContacts: SiteContacts) {
    touch((current) => ({ ...current, siteContacts }));
  }

  function updateOwner(owner: OwnerRecord) {
    touch((current) => ({
      ...current,
      ownerRecords: current.ownerRecords.map((record) => record.id === owner.id ? owner : record),
    }));
  }

  function addMasterRequirement(requirement: MasterRequirement) {
    touch((current) => ({ ...current, masterRequirements: [requirement, ...current.masterRequirements] }));
  }

  function removeMasterRequirement(requirementId: string) {
    touch((current) => ({
      ...current,
      masterRequirements: current.masterRequirements.filter((requirement) => requirement.id !== requirementId),
      // Master requirements govern the site assessment. Removing one therefore removes its
      // matching live requirement and its question-scoped evidence from the demo assessment.
      requirements: current.requirements.filter((requirement) => requirement.number !== requirementId),
    }));
  }

  // Master Requirements is the source of truth for question definitions: saving a requirement
  // here also reconciles its questions into the matching live `Requirement` (joined by
  // `requirement.number === masterRequirement.id`) — updating kept questions' text/evidence in
  // place (response/action/period are the contributor's own data and are never touched), adding
  // new ones as unanswered, and hard-deleting ones removed from the master list.
  function updateMasterRequirement(requirement: MasterRequirement) {
    touch((current) => ({
      ...current,
      masterRequirements: current.masterRequirements.map((record) => record.id === requirement.id ? requirement : record),
      requirements: current.requirements.map((liveRequirement) => {
        if (liveRequirement.number !== requirement.id) return liveRequirement;
        // A master record with no questions defined means "not yet authored here", not "delete
        // every question" — skip reconciliation entirely so the live requirement's existing
        // questions (and any recorded responses) are left untouched.
        if (requirement.questions.length === 0) return liveRequirement;
        const keptQuestions = liveRequirement.questions
          .filter((question) => requirement.questions.some((masterQuestion) => masterQuestion.id === question.id))
          .map((question) => {
            const masterQuestion = requirement.questions.find((item) => item.id === question.id)!;
            return { ...question, number: masterQuestion.number, text: masterQuestion.text, expectedEvidence: masterQuestion.expectedEvidence, evidenceRequired: masterQuestion.evidenceRequired ?? masterQuestion.expectedEvidence.length > 0 };
          });
        const addedQuestions: AssessmentQuestion[] = requirement.questions
          .filter((masterQuestion) => !liveRequirement.questions.some((question) => question.id === masterQuestion.id))
          .map((masterQuestion) => ({
            id: masterQuestion.id,
            number: masterQuestion.number,
            text: masterQuestion.text,
            expectedEvidence: masterQuestion.expectedEvidence,
            evidenceRequired: masterQuestion.evidenceRequired ?? masterQuestion.expectedEvidence.length > 0,
            response: null,
            period: currentAssessmentPeriod,
          }));
        return { ...liveRequirement, questions: [...keptQuestions, ...addedQuestions] };
      }),
    }));
  }

  function submitImportBatch(fileName: string, siteIds: string[]) {
    const batchId = `IMP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    // Illustrative mock batch: a small, real set of rows is actually written to state (so the
    // numbers shown match what happened), rather than fabricating the full workbook scale.
    // Selection/counts are decided from the current render's `state` (safe here — this function
    // makes exactly one `touch` call, so `state` is still fresh); the write itself below still
    // derives from `current` inside `touch`, matching this file's usual pattern.
    const sectionPool = ["Leadership & Engagement", "Planning", "Support", "Operation", "Performance Evaluation"];
    const createdRows: MasterRequirement[] = Array.from({ length: 4 }, (_, index) => ({
      id: `OS ${20 + index}.1.${index + 1}`,
      title: `Imported requirement ${index + 1} from ${fileName}`,
      section: sectionPool[index % sectionPool.length],
      version: "v1",
      status: "Draft",
      siteIds,
      importBatchId: batchId,
      questions: [],
    }));
    const updateCandidateIds = state.masterRequirements.slice(0, 2).map((requirement) => requirement.id);
    const record: ImportHistoryRecord = {
      id: batchId,
      fileName,
      importedAt: new Date().toISOString(),
      importedBy: "Rachel Morgan",
      siteIds,
      created: createdRows.length,
      updated: updateCandidateIds.length,
      unchanged: state.masterRequirements.length - updateCandidateIds.length,
      status: "Completed",
      publishStatus: "Draft",
    };
    touch((current) => ({
      ...current,
      masterRequirements: [
        ...createdRows,
        ...current.masterRequirements.map((requirement) => updateCandidateIds.includes(requirement.id)
          ? {
            ...requirement,
            status: "Draft" as const,
            importBatchId: batchId,
            siteIds: [...new Set([...requirement.siteIds, ...siteIds])],
            version: `v${Number(requirement.version.replace(/^v/, "")) + 1}`,
          }
          : requirement),
      ],
      importHistory: [record, ...current.importHistory],
    }));
    return record;
  }

  // Newest first, matching importHistory. `notify` is called from screens rather than from
  // inside the other mutators because AppState has no access to the signed-in user — the
  // calling screen does, along with the record the event is about.
  function notify(input: Omit<AppNotification, "id" | "createdAt" | "readBy">) {
    const record: AppNotification = {
      ...input,
      id: `ntf-${Date.now().toString(36)}-${Math.floor(performance.now() * 1000).toString(36)}`,
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    touch((current) => ({ ...current, notifications: [record, ...current.notifications] }));
  }

  function markNotificationRead(id: string, role: SiteUserRole) {
    touch((current) => ({
      ...current,
      notifications: current.notifications.map((record) => record.id === id && !record.readBy.includes(role)
        ? { ...record, readBy: [...record.readBy, role] }
        : record),
    }));
  }

  function markAllNotificationsRead(role: SiteUserRole) {
    touch((current) => ({
      ...current,
      notifications: current.notifications.map((record) => record.audience.includes(role) && !record.readBy.includes(role)
        ? { ...record, readBy: [...record.readBy, role] }
        : record),
    }));
  }

  function addSite(site: DashboardSite) {
    touch((current) => ({ ...current, sites: [...current.sites, site] }));
  }

  function updateSite(site: DashboardSite) {
    touch((current) => ({
      ...current,
      sites: current.sites.map((record) => record.id === site.id ? site : record),
    }));
  }

  // Rows whose code already exists are skipped rather than overwritten, so an import can never
  // silently change site records that assessments and user assignments already point at.
  function importSites(incoming: DashboardSite[]) {
    const existingCodes = new Set(state.sites.map((site) => site.code.toLowerCase()));
    const skipped: string[] = [];
    const additions: DashboardSite[] = [];
    incoming.forEach((site) => {
      const code = site.code.toLowerCase();
      if (existingCodes.has(code) || additions.some((added) => added.code.toLowerCase() === code)) { skipped.push(site.code); return; }
      additions.push(site);
    });
    if (additions.length) touch((current) => ({ ...current, sites: [...current.sites, ...additions] }));
    return { added: additions.length, skipped };
  }

  function addSiteUser(user: SiteUser) {
    touch((current) => ({ ...current, siteUsers: [user, ...current.siteUsers] }));
  }

  function updateSiteUser(user: SiteUser) {
    touch((current) => ({
      ...current,
      siteUsers: current.siteUsers.map((record) => record.id === user.id ? user : record),
    }));
  }

  function removeSiteUser(userId: string) {
    touch((current) => ({ ...current, siteUsers: current.siteUsers.filter((record) => record.id !== userId) }));
  }

  function publishImportBatch(batchId: string) {
    touch((current) => ({
      ...current,
      masterRequirements: current.masterRequirements.map((requirement) =>
        requirement.importBatchId === batchId ? { ...requirement, status: "Published" as const } : requirement),
      importHistory: current.importHistory.map((record) =>
        record.id === batchId ? { ...record, publishStatus: "Published" as const } : record),
    }));
  }

  const value: ApplicationDataValue = {
    ...state,
    dataSourceStatus: repository.status,
    ...derived,
    updateQuestion,
    addEvidence,
    updateEvidence,
    removeEvidence,
    saveSiteContacts,
    updateOwner,
    addMasterRequirement,
    updateMasterRequirement,
    removeMasterRequirement,
    submitImportBatch,
    publishImportBatch,
    addSiteUser,
    updateSiteUser,
    removeSiteUser,
    addSite,
    updateSite,
    importSites,
    notify,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <ApplicationDataContext.Provider value={value}>{children}</ApplicationDataContext.Provider>;
}

export function useApplicationData() {
  const value = useContext(ApplicationDataContext);
  if (!value) throw new Error("useApplicationData must be used within ApplicationDataProvider");
  return value;
}

export type { ImportHistoryRecord } from "../../data-access/contracts";
