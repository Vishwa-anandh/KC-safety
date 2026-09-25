import type { ActionItem, Performance, Requirement, ResponseValue, SectionSummary } from "../types";

export function actionComplete(response: ResponseValue, action?: ActionItem) {
  void action;
  return Boolean(response);
}

export type SectionKind = SectionSummary["kind"];

/** The two governance frameworks every section belongs to (SectionSummary.kind) — shown as a
 *  badge anywhere a section, requirement, or action needs to say which one it's under. */
export function frameworkLabel(kind: SectionKind) {
  return kind === "operating-system" ? "Operating System" : "Performance Standard";
}

/** A requirement is a "gap" once it has a No or Partial response — the one predicate every
 *  gap-count/actions-list/chart in the app should share, rather than each re-deriving it. */
export function isGap(response: ResponseValue) {
  return response === "no" || response === "partial";
}

/** Every gap gets an auto-created action (see ApplicationDataProvider's updateQuestion), but its
 *  `status` field itself stays optional — this is the one place that default lives. */
export function actionStatus(action?: ActionItem) {
  return action?.status ?? "Open";
}

export function isActionOpen(action?: ActionItem) {
  return actionStatus(action) !== "Complete";
}

export function isActionMissingOwner(action?: ActionItem) {
  return !action?.owner?.trim();
}

export function isActionMissingDescription(action?: ActionItem) {
  return !action?.description?.trim();
}

export const assessmentPeriods = ["2026 Q1", "2026 Q2", "2026 Q3"] as const;
export type AssessmentPeriodValue = (typeof assessmentPeriods)[number];
export const currentAssessmentPeriod: AssessmentPeriodValue = "2026 Q3";

export function performanceForResponse(response: ResponseValue): Performance {
  if (response === "no") return "initial";
  if (response === "partial") return "emerging";
  if (response === "yes") return "performing";
  return "not-assessed";
}

export function rollupPerformance(responses: ResponseValue[]): Performance {
  if (responses.some((response) => response === "no")) return "initial";
  if (responses.some((response) => response === "partial")) return "emerging";
  if (responses.length > 0 && responses.every((response) => response === "yes")) return "performing";
  return "not-assessed";
}

export function performanceLabel(performance: Performance) {
  return {
    initial: "Initial",
    emerging: "Emerging",
    performing: "Performing",
    "not-assessed": "Not assessed",
  }[performance];
}

export function responseLabel(response: ResponseValue) {
  if (!response) return "Not answered";
  return { no: "No", partial: "Partial", yes: "Yes" }[response];
}

/** The one rollup formula (per-section stats, overall completion/performance/gaps) shared by
 *  every site's assessment — pulled out so a specific site's requirements and the currently
 *  selected site's requirements are always scored the same way, not two copies of this math. */
export function computeSiteStats(sections: SectionSummary[], requirements: Requirement[]) {
  const sectionSummaries = sections.map((section) => {
    const questions = requirements.filter((requirement) => requirement.sectionId === section.id);
    if (!questions.length) return section;
    const completed = questions.filter((question) => actionComplete(question.response, question.action)).length;
    return {
      ...section,
      completion: Math.round((completed / questions.length) * 100),
      performance: rollupPerformance(questions.map((question) => question.response)),
      questions: questions.length,
      gaps: questions.filter((question) => isGap(question.response)).length,
    };
  });
  const completed = requirements.filter((question) => actionComplete(question.response, question.action)).length;
  const overallCompletion = requirements.length ? Math.round((completed / requirements.length) * 100) : 0;
  const overallPerformance = rollupPerformance(requirements.map((question) => question.response));
  const gapCount = requirements.filter((question) => isGap(question.response)).length;
  const missingActionCount = requirements.filter((question) => isGap(question.response) && (isActionMissingOwner(question.action) || isActionMissingDescription(question.action))).length;
  return { sectionSummaries, overallCompletion, overallPerformance, gapCount, missingActionCount };
}
