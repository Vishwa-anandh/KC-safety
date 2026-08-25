import { useApplicationData } from "../../../app/providers/ApplicationDataProvider";
import { useAuth } from "../../auth";

/** Administration state and commands exposed without leaking repository details to pages. */
export function useAdministration() {
  const { user } = useAuth();
  const {
    importHistory,
    requirementAuditLog,
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
    addMasterRequirement: addMasterRequirementToState,
    updateMasterRequirement: updateMasterRequirementInState,
    removeMasterRequirement: removeMasterRequirementFromState,
    addSiteUser,
    updateSiteUser,
    removeSiteUser,
    notify,
  } = useApplicationData();
  const auditActor = user ? { id: user.id, name: user.name, email: user.email, role: user.role } : undefined;
  return {
    importHistory,
    requirementAuditLog,
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
    publishImportBatch: (batchId: string) => publishImportBatch(batchId, auditActor),
    submitImportBatch: (fileName: string, siteIds: string[]) => submitImportBatch(fileName, siteIds, auditActor),
    addMasterRequirement: (requirement: Parameters<typeof addMasterRequirementToState>[0]) => addMasterRequirementToState(requirement, auditActor),
    updateMasterRequirement: (requirement: Parameters<typeof updateMasterRequirementInState>[0]) => updateMasterRequirementInState(requirement, auditActor),
    removeMasterRequirement: (requirementId: string) => removeMasterRequirementFromState(requirementId, auditActor),
    addSiteUser,
    updateSiteUser,
    removeSiteUser,
    notify,
  };
}
