import { useApplicationData } from "../../../app/providers/ApplicationDataProvider";

/** View-ready assessment state and mutations. Transport and persistence stay behind repositories. */
export function useAssessment() {
  const {
    requirements,
    updateQuestion,
    addEvidence,
    updateEvidence,
    removeEvidence,
  } = useApplicationData();
  return { requirements, updateQuestion, addEvidence, updateEvidence, removeEvidence };
}
