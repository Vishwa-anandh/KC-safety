/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  currentAssessmentPeriod,
  dashboardSites as seedSites,
  initialSiteContacts,
  masterRequirements as seedMasterRequirements,
  ownerRecords as seedOwnerRecords,
  requirements as seedRequirements,
  siteUsers as seedSiteUsers,
  rollupPerformance,
  sections as seedSections,
} from "./data";
import type {
  ActionItem,
  AssessmentPeriod,
  DashboardSite,
  EvidenceItem,
  MasterRequirement,
  OwnerRecord,
  Requirement,
  ResponseValue,
  SectionSummary,
  SiteContacts,
  SiteUser,
} from "./types";

const STORAGE_KEY = "ehss-phase-one-state-v1";

export interface ImportHistoryRecord {
  id: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  siteIds: string[];
  created: number;
  updated: number;
  unchanged: number;
  status: "Completed";
  publishStatus: "Draft" | "Published";
}

interface PersistedState {
  requirements: Requirement[];
  siteContacts: SiteContacts;
  ownerRecords: OwnerRecord[];
  masterRequirements: MasterRequirement[];
  importHistory: ImportHistoryRecord[];
  siteUsers: SiteUser[];
  sites: DashboardSite[];
  lastUpdated: string;
}

interface AppStateValue extends PersistedState {
  sectionSummaries: SectionSummary[];
  dashboardSiteRows: DashboardSite[];
  overallCompletion: number;
  overallPerformance: ReturnType<typeof rollupPerformance>;
  gapCount: number;
  missingActionCount: number;
  updateQuestion: (requirementId: string, questionId: string, update: { response?: ResponseValue; action?: ActionItem; period?: AssessmentPeriod }) => void;
  addEvidence: (requirementId: string, item: EvidenceItem) => void;
  updateEvidence: (requirementId: string, item: EvidenceItem) => void;
  removeEvidence: (requirementId: string, evidenceId: string) => void;
  saveSiteContacts: (contacts: SiteContacts) => void;
  updateOwner: (owner: OwnerRecord) => void;
  addMasterRequirement: (requirement: MasterRequirement) => void;
  updateMasterRequirement: (requirement: MasterRequirement) => void;
  submitImportBatch: (fileName: string, siteIds: string[]) => ImportHistoryRecord;
  publishImportBatch: (batchId: string) => void;
  addSiteUser: (user: SiteUser) => void;
  updateSiteUser: (user: SiteUser) => void;
  removeSiteUser: (userId: string) => void;
  addSite: (site: DashboardSite) => void;
  updateSite: (site: DashboardSite) => void;
  importSites: (sites: DashboardSite[]) => { added: number; skipped: string[] };
}

function freshState(): PersistedState {
  return {
    requirements: structuredClone(seedRequirements),
    siteContacts: structuredClone(initialSiteContacts),
    ownerRecords: structuredClone(seedOwnerRecords),
    masterRequirements: structuredClone(seedMasterRequirements),
    importHistory: [],
    siteUsers: structuredClone(seedSiteUsers),
    sites: structuredClone(seedSites),
    lastUpdated: new Date().toISOString(),
  };
}

function loadState(): PersistedState {
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
    };
  } catch {
    return freshState();
  }
}

function actionComplete(response: "no" | "partial" | "yes" | null, action?: ActionItem) {
  if (response !== "no" && response !== "partial") return response === "yes";
  return Boolean(action?.description.trim() && action?.owner.trim());
}

function requirementRoute(requirement: Requirement) {
  return `/assessment/${requirement.sectionId}/${requirement.id}`;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const derived = useMemo(() => {
    const sectionSummaries = seedSections.map((section) => {
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
    const missingActionCount = allQuestions.filter((question) =>
      (question.response === "no" || question.response === "partial") && !actionComplete(question.response, question.action),
    ).length;
    const dashboardSiteRows = state.sites.map((site) => site.id === "northstar" ? {
      ...site,
      completion: overallCompletion,
      performance: overallPerformance,
      gaps: gapCount,
      updated: new Date(state.lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    } : site);
    return { sectionSummaries, overallCompletion, overallPerformance, gapCount, missingActionCount, dashboardSiteRows };
  }, [state.lastUpdated, state.requirements, state.sites]);

  function touch(update: (current: PersistedState) => PersistedState) {
    setState((current) => ({ ...update(current), lastUpdated: new Date().toISOString() }));
  }

  function updateQuestion(requirementId: string, questionId: string, update: { response?: ResponseValue; action?: ActionItem; period?: AssessmentPeriod }) {
    // Setting a response tags it with the current assessment period unless a period was
    // explicitly given — this is descriptive metadata on the one live response, not a new
    // versioning axis (there is still exactly one response per question).
    const tagged = update.response !== undefined && update.period === undefined
      ? { ...update, period: currentAssessmentPeriod }
      : update;
    touch((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) => requirement.id === requirementId ? {
        ...requirement,
        questions: requirement.questions.map((question) => question.id === questionId ? { ...question, ...tagged } : question),
      } : requirement),
    }));
  }

  function addEvidence(requirementId: string, item: EvidenceItem) {
    touch((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) => requirement.id === requirementId
        ? { ...requirement, evidence: [...requirement.evidence, item] }
        : requirement),
    }));
  }

  function updateEvidence(requirementId: string, item: EvidenceItem) {
    touch((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) => requirement.id === requirementId
        ? { ...requirement, evidence: requirement.evidence.map((evidence) => evidence.id === item.id ? item : evidence) }
        : requirement),
    }));
  }

  function removeEvidence(requirementId: string, evidenceId: string) {
    touch((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) => requirement.id === requirementId
        ? { ...requirement, evidence: requirement.evidence.filter((evidence) => evidence.id !== evidenceId) }
        : requirement),
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

  function updateMasterRequirement(requirement: MasterRequirement) {
    touch((current) => ({
      ...current,
      masterRequirements: current.masterRequirements.map((record) => record.id === requirement.id ? requirement : record),
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
      id: `OS ${5 + index}.1.${index + 1}`,
      title: `Imported requirement ${index + 1} from ${fileName}`,
      section: sectionPool[index % sectionPool.length],
      version: "v1",
      status: "Draft",
      siteIds,
      importBatchId: batchId,
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

  const value: AppStateValue = {
    ...state,
    ...derived,
    updateQuestion,
    addEvidence,
    updateEvidence,
    removeEvidence,
    saveSiteContacts,
    updateOwner,
    addMasterRequirement,
    updateMasterRequirement,
    submitImportBatch,
    publishImportBatch,
    addSiteUser,
    updateSiteUser,
    removeSiteUser,
    addSite,
    updateSite,
    importSites,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used within AppStateProvider");
  return value;
}

export { actionComplete, requirementRoute };
