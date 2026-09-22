import { useApplicationData } from "../../../app/providers/ApplicationDataProvider";
import type { Requirement, ResponseValue } from "../../../shared/types";

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
    assignedSite,
    sections,
    siteContacts,
    siteUsers,
  } = useApplicationData();
  function requirementsForSite(siteId: string) {
    if (siteId === "northstar") return requirements;
    const site = dashboardSiteRows.find((item) => item.id === siteId);
    const contributor = siteUsers.find((user) => user.siteId === siteId && user.role === "site-contributor" && user.status === "Active");
    return demoHistoryForSite(siteId, requirements, site?.name ?? "this site", contributor?.name ?? "Site contributor");
  }
  return { dashboardSiteRows, sectionSummaries, requirements, requirementsForSite, assignedSite, sections, siteContacts, siteUsers };
}
