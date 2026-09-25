import { useApplicationData } from "../../../app/providers/ApplicationDataProvider";
import { computeSiteStats } from "../../../shared/domain/assessment";
import type { Requirement, ResponseValue, SectionSummary } from "../../../shared/types";

const responsePatterns: ResponseValue[][] = [
  ["yes", "partial", "yes"],
  ["partial", "yes", "no"],
  ["yes", "yes", "partial"],
  ["no", "partial", "yes"],
];

function demoHistoryForSite(siteId: string, source: Requirement[], siteName: string, siteUserName: string) {
  if (siteId === "harbor-point") return source.map((requirement) => ({ ...requirement, evidence: [], response: null, action: undefined, history: [] }));
  const patternOffset = siteId.split("").reduce((total, character) => total + character.charCodeAt(0), 0) % responsePatterns.length;
  return source.map((requirement, requirementIndex) => {
    const siteEvidence = requirement.evidence.map((item) => ({ ...item, uploadedBy: siteUserName }));
    const response = responsePatterns[(patternOffset + requirementIndex) % responsePatterns.length][requirementIndex % 3];
    const isGap = response === "no" || response === "partial";
    const firstResponse: ResponseValue = response === "yes" ? "partial" : response === "partial" ? "no" : "partial";
    const makeAction = (value: ResponseValue, status: "Open" | "In progress", updatedAt: string) => value === "no" || value === "partial" ? {
      description: value === "no" ? `Close the identified gap for ${siteName}.` : `Complete the remaining controls for ${siteName}.`,
      owner: siteUserName,
      status,
      followUp: "Review progress in the next operating review.",
      createdAt: "2026-08-05T09:00:00.000Z",
      createdBy: siteUserName,
      updatedAt,
      updatedBy: siteUserName,
    } : undefined;
    const firstAction = makeAction(firstResponse, "Open", "2026-08-05T09:00:00.000Z");
    const currentAction = isGap ? makeAction(response, response === "no" ? "Open" : "In progress", "2026-08-18T14:30:00.000Z") : undefined;
    const history = [{
      id: `${siteId}-${requirement.id}-history-1`, event: "Response recorded" as const, recordedAt: "2026-08-05T09:00:00.000Z", recordedBy: siteUserName, response: firstResponse, action: firstAction, evidence: siteEvidence,
    }, ...(firstAction ? [{
      id: `${siteId}-${requirement.id}-history-2`, event: "Action updated" as const, recordedAt: "2026-08-12T09:00:00.000Z", recordedBy: siteUserName, response: firstResponse, action: { ...firstAction, status: "In progress" as const, updatedAt: "2026-08-12T09:00:00.000Z" }, evidence: siteEvidence,
    }] : []), {
      id: `${siteId}-${requirement.id}-history-3`, event: "Response changed" as const, recordedAt: "2026-08-18T14:30:00.000Z", recordedBy: siteUserName, response, action: currentAction, evidence: siteEvidence,
    }];
    return {
      ...requirement,
      evidence: siteEvidence,
      response,
      respondedAt: response ? "2026-08-18T14:30:00.000Z" : undefined,
      respondedBy: response ? siteUserName : undefined,
      action: currentAction,
      history,
    };
  });
}

/** Enterprise dashboard projections derived by the application data provider. */
export function useDashboard() {
  const {
    dashboardSiteRows,
    sectionSummaries,
    requirements,
    requirementsBySite,
    siteContactsBySite,
    homeSiteId,
    assignedSite,
    sections,
    siteContacts,
    siteUsers,
  } = useApplicationData();
  // Every site with a real, seeded slice (currently Northstar/Riverbend/Cedar Grove) shows its
  // own genuine assessment; every other site is read-only display sugar fabricated from
  // Northstar's questions, since no real per-question data exists for it.
  function hasRealDataForSite(siteId: string) {
    return siteId in requirementsBySite;
  }
  function requirementsForSite(siteId: string) {
    if (requirementsBySite[siteId]) return requirementsBySite[siteId];
    const site = dashboardSiteRows.find((item) => item.id === siteId);
    const contributor = siteUsers.find((user) => user.siteId === siteId && user.role === "site-contributor" && user.status === "Active");
    return demoHistoryForSite(siteId, requirements, site?.name ?? "this site", contributor?.name ?? "Site contributor");
  }
  function sectionSummariesForSite(siteId: string): SectionSummary[] {
    return requirementsBySite[siteId] ? computeSiteStats(sections, requirementsBySite[siteId]).sectionSummaries : sections;
  }
  return { dashboardSiteRows, sectionSummaries, requirements, requirementsForSite, sectionSummariesForSite, hasRealDataForSite, siteContactsBySite, homeSiteId, assignedSite, sections, siteContacts, siteUsers };
}
