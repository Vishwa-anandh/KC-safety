import type { ActionItem, Performance, ResponseValue, SectionSummary } from "../types";

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
