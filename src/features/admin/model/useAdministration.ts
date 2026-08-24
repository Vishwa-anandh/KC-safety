import { useApplicationData } from "../../../app/providers/ApplicationDataProvider";

/** Administration state and commands exposed without leaking repository details to pages. */
export function useAdministration() {
  const {
    importHistory,
    masterRequirements,
    requirements,
    assignedSite,
    siteUsers,
    sites,
    ownerRecords,
    siteContacts,
    addSite,
    updateSite,
    importSites,
    publishImportBatch,
    submitImportBatch,
    addMasterRequirement,
    updateMasterRequirement,
    removeMasterRequirement,
    addSiteUser,
    updateSiteUser,
    removeSiteUser,
    notify,
  } = useApplicationData();
  return {
    importHistory,
    masterRequirements,
    requirements,
    assignedSite,
    siteUsers,
    sites,
    ownerRecords,
    siteContacts,
    addSite,
    updateSite,
    importSites,
    publishImportBatch,
    submitImportBatch,
    addMasterRequirement,
    updateMasterRequirement,
    removeMasterRequirement,
    addSiteUser,
    updateSiteUser,
    removeSiteUser,
    notify,
  };
}
