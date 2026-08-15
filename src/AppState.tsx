/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  dashboardSites,
  initialSiteContacts,
  masterRequirements as seedMasterRequirements,
  ownerRecords as seedOwnerRecords,
  requirements as seedRequirements,
  rollupPerformance,
  sections as seedSections,
} from "./data";
import type {
  ActionItem,
  DashboardSite,
  EvidenceItem,
  MasterRequirement,
  OwnerRecord,
  Requirement,
  ResponseValue,
  SectionSummary,
  SiteContacts,
} from "./types";

const STORAGE_KEY = "ehss-phase-one-state-v1";

export interface ImportHistoryRecord {
  id: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  created: number;
  updated: number;
  unchanged: number;
  status: "Completed";
}

interface PersistedState {
  requirements: Requirement[];
  siteContacts: SiteContacts;
  ownerRecords: OwnerRecord[];
  masterRequirements: MasterRequirement[];
  importHistory: ImportHistoryRecord[];
  lastUpdated: string;
}

interface AppStateValue extends PersistedState {
  sectionSummaries: SectionSummary[];
  dashboardSiteRows: DashboardSite[];
  overallCompletion: number;
  overallPerformance: ReturnType<typeof rollupPerformance>;
  gapCount: number;
  missingActionCount: number;
  updateQuestion: (requirementId: string, questionId: string, update: { response?: ResponseValue; action?: ActionItem }) => void;
  addEvidence: (requirementId: string, item: EvidenceItem) => void;
  updateEvidence: (requirementId: string, item: EvidenceItem) => void;
  removeEvidence: (requirementId: string, evidenceId: string) => void;
  saveSiteContacts: (contacts: SiteContacts) => void;
  updateOwner: (owner: OwnerRecord) => void;
  addMasterRequirement: (requirement: MasterRequirement) => void;
  updateMasterRequirement: (requirement: MasterRequirement) => void;
  recordImport: (fileName: string) => ImportHistoryRecord;
}

function freshState(): PersistedState {
  return {
    requirements: structuredClone(seedRequirements),
    siteContacts: structuredClone(initialSiteContacts),
    ownerRecords: structuredClone(seedOwnerRecords),
    masterRequirements: structuredClone(seedMasterRequirements),
    importHistory: [],
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
      requirements: parsed.requirements?.length ? parsed.requirements : structuredClone(seedRequirements),
      ownerRecords: parsed.ownerRecords?.length ? parsed.ownerRecords : structuredClone(seedOwnerRecords),
      masterRequirements: parsed.masterRequirements?.length ? parsed.masterRequirements : structuredClone(seedMasterRequirements),
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
    const dashboardSiteRows = dashboardSites.map((site) => site.id === "northstar" ? {
      ...site,
      completion: overallCompletion,
      performance: overallPerformance,
      gaps: gapCount,
      updated: new Date(state.lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    } : site);
    return { sectionSummaries, overallCompletion, overallPerformance, gapCount, missingActionCount, dashboardSiteRows };
  }, [state.lastUpdated, state.requirements]);

  function touch(update: (current: PersistedState) => PersistedState) {
    setState((current) => ({ ...update(current), lastUpdated: new Date().toISOString() }));
  }

  function updateQuestion(requirementId: string, questionId: string, update: { response?: ResponseValue; action?: ActionItem }) {
    touch((current) => ({
      ...current,
      requirements: current.requirements.map((requirement) => requirement.id === requirementId ? {
        ...requirement,
        questions: requirement.questions.map((question) => question.id === questionId ? { ...question, ...update } : question),
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

  function recordImport(fileName: string) {
    const record: ImportHistoryRecord = {
      id: `IMP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      fileName,
      importedAt: new Date().toISOString(),
      importedBy: "Rachel Morgan",
      created: 18,
      updated: 46,
      unchanged: 688,
      status: "Completed",
    };
    touch((current) => ({ ...current, importHistory: [record, ...current.importHistory] }));
    return record;
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
    recordImport,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used within AppStateProvider");
  return value;
}

export { actionComplete, requirementRoute };
