import type { MasterRequirement, RequirementAuditChange } from "../types";

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

function evidenceChanges(before: MasterRequirement, after: MasterRequirement): RequirementAuditChange[] {
  const removed = unmatched(before.expectedEvidence, after.expectedEvidence);
  const added = unmatched(after.expectedEvidence, before.expectedEvidence);
  const changes: RequirementAuditChange[] = [];

  if ((before.evidenceRequired ?? before.expectedEvidence.length > 0) !== (after.evidenceRequired ?? after.expectedEvidence.length > 0)) {
    changes.push({
      kind: "updated",
      target: "evidence",
      label: "Evidence requirement",
      before: (before.evidenceRequired ?? before.expectedEvidence.length > 0) ? "Required" : "Not required",
      after: (after.evidenceRequired ?? after.expectedEvidence.length > 0) ? "Required" : "Not required",
      questionId: after.id,
    });
  }
  removed.forEach((evidence) => changes.push({ kind: "deleted", target: "evidence", label: "Expected evidence", before: evidence, questionId: after.id }));
  added.forEach((evidence) => changes.push({ kind: "added", target: "evidence", label: "Expected evidence", after: evidence, questionId: after.id }));
  return changes;
}

function guidanceChanges(before: MasterRequirement, after: MasterRequirement): RequirementAuditChange[] {
  const beforeGuidance = before.guidance ?? [];
  const afterGuidance = after.guidance ?? [];
  const removed = unmatched(beforeGuidance, afterGuidance);
  const added = unmatched(afterGuidance, beforeGuidance);
  const changes: RequirementAuditChange[] = [];
  removed.forEach((step) => changes.push({ kind: "deleted", target: "question", label: "How to meet requirement", before: step, questionId: after.id }));
  added.forEach((step) => changes.push({ kind: "added", target: "question", label: "How to meet requirement", after: step, questionId: after.id }));
  return changes;
}

export function createdRequirementAuditChanges(requirement: MasterRequirement): RequirementAuditChange[] {
  return [
    { kind: "added", target: "requirement", label: "Requirement created", after: `${requirement.id} · ${requirement.title}` },
    { kind: "added", target: "requirement", label: "Section", after: requirement.section },
    { kind: "added", target: "status", label: "Publishing state", after: requirement.status },
    { kind: "added", target: "scope", label: "Site scope", after: siteScope(requirement.siteIds) },
    { kind: "added", target: "question", label: "Question", after: requirement.text, questionId: requirement.id },
    ...(requirement.guidance ?? []).map((step) => ({ kind: "added" as const, target: "question" as const, label: "How to meet requirement", after: step, questionId: requirement.id })),
    ...requirement.expectedEvidence.map((evidence) => ({ kind: "added" as const, target: "evidence" as const, label: "Expected evidence", after: evidence, questionId: requirement.id })),
  ];
}

export function deletedRequirementAuditChanges(requirement: MasterRequirement): RequirementAuditChange[] {
  return [
    { kind: "deleted", target: "requirement", label: "Requirement deleted", before: `${requirement.id} · ${requirement.title}` },
    { kind: "deleted", target: "question", label: "Question", before: requirement.text, questionId: requirement.id },
  ];
}

export function updatedRequirementAuditChanges(before: MasterRequirement, after: MasterRequirement): RequirementAuditChange[] {
  const changes: RequirementAuditChange[] = [];
  if (before.title !== after.title) changes.push({ kind: "updated", target: "requirement", label: "Requirement title", before: before.title, after: after.title });
  if (before.section !== after.section) changes.push({ kind: "updated", target: "requirement", label: "Section", before: before.section, after: after.section });
  if (before.status !== after.status) changes.push({ kind: "updated", target: "status", label: "Publishing state", before: before.status, after: after.status });
  if (siteScope(before.siteIds) !== siteScope(after.siteIds)) changes.push({ kind: "updated", target: "scope", label: "Site scope", before: siteScope(before.siteIds), after: siteScope(after.siteIds) });
  if (before.text !== after.text) changes.push({ kind: "updated", target: "question", label: "Question text", before: before.text, after: after.text, questionId: after.id });
  changes.push(...guidanceChanges(before, after));
  changes.push(...evidenceChanges(before, after));
  return changes;
}
