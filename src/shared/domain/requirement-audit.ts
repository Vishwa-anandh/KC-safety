import type { MasterQuestion, MasterRequirement, RequirementAuditChange } from "../types";

function siteScope(siteIds: string[]) {
  return siteIds.length ? [...siteIds].sort().join(", ") : "All sites";
}

function unmatched(source: string[], comparison: string[]) {
  const remaining = [...comparison];
  return source.filter((item) => {
    const match = remaining.indexOf(item);
    if (match < 0) return true;
    remaining.splice(match, 1);
    return false;
  });
}

function questionEvidenceChanges(before: MasterQuestion, after: MasterQuestion): RequirementAuditChange[] {
  const questionLabel = `Question ${after.number || before.number}`;
  const removed = unmatched(before.expectedEvidence, after.expectedEvidence);
  const added = unmatched(after.expectedEvidence, before.expectedEvidence);
  const changes: RequirementAuditChange[] = [];

  if ((before.evidenceRequired ?? before.expectedEvidence.length > 0) !== (after.evidenceRequired ?? after.expectedEvidence.length > 0)) {
    changes.push({
      kind: "updated",
      target: "evidence",
      label: `${questionLabel} evidence requirement`,
      before: (before.evidenceRequired ?? before.expectedEvidence.length > 0) ? "Required" : "Not required",
      after: (after.evidenceRequired ?? after.expectedEvidence.length > 0) ? "Required" : "Not required",
      questionId: after.id,
    });
  }
  removed.forEach((evidence) => changes.push({ kind: "deleted", target: "evidence", label: `${questionLabel} expected evidence`, before: evidence, questionId: after.id }));
  added.forEach((evidence) => changes.push({ kind: "added", target: "evidence", label: `${questionLabel} expected evidence`, after: evidence, questionId: after.id }));
  return changes;
}

function fullQuestionChanges(question: MasterQuestion, kind: "added" | "deleted"): RequirementAuditChange[] {
  const valueKey = kind === "added" ? "after" : "before";
  const changes: RequirementAuditChange[] = [{
    kind,
    target: "question",
    label: `Question ${question.number} ${kind}`,
    [valueKey]: question.text,
    questionId: question.id,
  }];
  question.expectedEvidence.forEach((evidence) => changes.push({
    kind,
    target: "evidence",
    label: `Question ${question.number} expected evidence ${kind}`,
    [valueKey]: evidence,
    questionId: question.id,
  }));
  return changes;
}

export function createdRequirementAuditChanges(requirement: MasterRequirement): RequirementAuditChange[] {
  return [
    { kind: "added", target: "requirement", label: "Requirement created", after: `${requirement.id} · ${requirement.title}` },
    { kind: "added", target: "requirement", label: "Section", after: requirement.section },
    { kind: "added", target: "status", label: "Publishing state", after: requirement.status },
    { kind: "added", target: "scope", label: "Site scope", after: siteScope(requirement.siteIds) },
    ...requirement.questions.flatMap((question) => fullQuestionChanges(question, "added")),
  ];
}

export function deletedRequirementAuditChanges(requirement: MasterRequirement): RequirementAuditChange[] {
  return [
    { kind: "deleted", target: "requirement", label: "Requirement deleted", before: `${requirement.id} · ${requirement.title}` },
    ...requirement.questions.flatMap((question) => fullQuestionChanges(question, "deleted")),
  ];
}

export function updatedRequirementAuditChanges(before: MasterRequirement, after: MasterRequirement): RequirementAuditChange[] {
  const changes: RequirementAuditChange[] = [];
  if (before.title !== after.title) changes.push({ kind: "updated", target: "requirement", label: "Requirement title", before: before.title, after: after.title });
  if (before.section !== after.section) changes.push({ kind: "updated", target: "requirement", label: "Section", before: before.section, after: after.section });
  if (before.status !== after.status) changes.push({ kind: "updated", target: "status", label: "Publishing state", before: before.status, after: after.status });
  if (siteScope(before.siteIds) !== siteScope(after.siteIds)) changes.push({ kind: "updated", target: "scope", label: "Site scope", before: siteScope(before.siteIds), after: siteScope(after.siteIds) });

  const beforeQuestions = new Map(before.questions.map((question) => [question.id, question]));
  const afterQuestions = new Map(after.questions.map((question) => [question.id, question]));
  before.questions.filter((question) => !afterQuestions.has(question.id)).forEach((question) => changes.push(...fullQuestionChanges(question, "deleted")));
  after.questions.filter((question) => !beforeQuestions.has(question.id)).forEach((question) => changes.push(...fullQuestionChanges(question, "added")));
  after.questions.forEach((question) => {
    const previous = beforeQuestions.get(question.id);
    if (!previous) return;
    if (previous.number !== question.number) changes.push({ kind: "updated", target: "question", label: `${question.text} order`, before: `Question ${previous.number}`, after: `Question ${question.number}`, questionId: question.id });
    if (previous.text !== question.text) changes.push({ kind: "updated", target: "question", label: `Question ${question.number} text`, before: previous.text, after: question.text, questionId: question.id });
    changes.push(...questionEvidenceChanges(previous, question));
  });
  return changes;
}
