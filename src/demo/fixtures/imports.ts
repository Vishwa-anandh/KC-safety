import type { MasterQuestion } from "../../shared/types";

const importedQuestionTemplates: Array<Array<Pick<MasterQuestion, "text" | "expectedEvidence">>> = [
  [
    { text: "Are responsibilities and accountabilities for this requirement defined and communicated?", expectedEvidence: ["Approved responsibility matrix.", "Communication or briefing records."] },
    { text: "Does leadership review implementation and follow up on identified gaps?", expectedEvidence: ["Leadership review minutes.", "Action log with owners and due dates."] },
  ],
  [
    { text: "Has this requirement been translated into documented site plans and controls?", expectedEvidence: ["Approved site plan or procedure.", "Risk register or control register entry."] },
    { text: "Are owners, due dates, and review measures assigned for the planned controls?", expectedEvidence: ["Implementation tracker.", "Periodic effectiveness review record."] },
  ],
  [
    { text: "Are competent people and sufficient resources available to meet this requirement?", expectedEvidence: ["Training or competency matrix.", "Resource or staffing plan."] },
    { text: "Are the relevant documents available, controlled, and current?", expectedEvidence: ["Current controlled procedure.", "Document revision and approval record."] },
  ],
  [
    { text: "Are operational controls for this requirement implemented and routinely verified?", expectedEvidence: ["Operational procedure or work instruction.", "Completed inspection or verification record."] },
    { text: "Are deviations documented, corrected, and tracked through closure?", expectedEvidence: ["Deviation or incident record.", "Corrective-action log with closure evidence."] },
  ],
];

export function demoImportedQuestionsFor(requirementId: string, templateIndex: number): MasterQuestion[] {
  const idPrefix = requirementId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return importedQuestionTemplates[templateIndex].map((question, questionIndex) => ({
    id: `${idPrefix}-q-${questionIndex + 1}`,
    number: String(questionIndex + 1),
    text: question.text,
    expectedEvidence: [...question.expectedEvidence],
    evidenceRequired: true,
  }));
}
