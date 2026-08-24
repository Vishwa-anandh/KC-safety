import { useApplicationData } from "../../../app/providers/ApplicationDataProvider";

/** Site-facing state and mutations for contributor workflows. */
export function useSites() {
  const {
    assignedSite,
    requirements,
    sectionSummaries,
    overallCompletion,
    overallPerformance,
    gapCount,
    missingActionCount,
    lastUpdated,
    siteContacts,
    ownerRecords,
    saveSiteContacts,
    updateOwner,
    updateQuestion,
    notify,
  } = useApplicationData();
  return {
    assignedSite,
    requirements,
    sectionSummaries,
    overallCompletion,
    overallPerformance,
    gapCount,
    missingActionCount,
    lastUpdated,
    siteContacts,
    ownerRecords,
    saveSiteContacts,
    updateOwner,
    updateQuestion,
    notify,
  };
}
