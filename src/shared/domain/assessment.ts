import type { ActionItem, Performance, ResponseValue } from "../types";

export function actionComplete(response: ResponseValue, action?: ActionItem) {
  void action;
  return Boolean(response);
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
