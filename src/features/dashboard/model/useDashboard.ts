import { useApplicationData } from "../../../app/providers/ApplicationDataProvider";

/** Enterprise dashboard projections derived by the application data provider. */
export function useDashboard() {
  const {
    dashboardSiteRows,
    sectionSummaries,
    requirements,
    sections,
    siteContacts,
    siteUsers,
  } = useApplicationData();
  return { dashboardSiteRows, sectionSummaries, requirements, sections, siteContacts, siteUsers };
}
