import { currentAssessmentPeriod } from "./assessment";
import type { MasterRequirement, Requirement, SectionSummary } from "../types";

/** Turns a free-text Section value (e.g. "OSHPS 1: Fire & Explosion") into a stable id usable as
 *  both a live Requirement's `sectionId` and a `SectionSummary.id`. */
function sectionSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "section";
}

/**
 * Reconciles one master requirement (a requirement IS a single question — see the type-level
 * note in shared/types.ts) into the live, site-facing `requirements` list — this is the only
 * place master content actually reaches a site's assessment. Joined by `liveRequirement.id ===
 * master.id`. Response/action/period/history are the site's own data and are always carried over
 * from the existing record, never reset.
 *
 * Draft requirements are removed from (or never added to) the live list — "Draft" means
 * "invisible to sites" everywhere else in this app, so a requirement moved back to Draft after
 * being published disappears from the assessment again rather than lingering.
 */
export function syncLiveRequirement(requirements: Requirement[], master: MasterRequirement): Requirement[] {
  const existingIndex = requirements.findIndex((item) => item.id === master.id);
  if (master.status !== "Published") {
    return existingIndex === -1 ? requirements : requirements.filter((item) => item.id !== master.id);
  }
  const sectionId = sectionSlug(master.section);
  if (existingIndex === -1) {
    const created: Requirement = {
      id: master.id,
      requirementId: master.requirementId,
      number: master.number,
      title: master.title,
      sectionId,
      sectionName: master.section,
      subsection: master.subsection,
      requirementText: master.title,
      text: master.text,
      guidance: master.guidance ?? [],
      expectedEvidence: master.expectedEvidence,
      evidenceRequired: master.evidenceRequired ?? master.expectedEvidence.length > 0,
      response: null,
      period: currentAssessmentPeriod,
      evidence: [],
    };
    return [...requirements, created];
  }
  return requirements.map((item, index) => index !== existingIndex ? item : {
    ...item,
    requirementId: master.requirementId,
    number: master.number,
    title: master.title,
    sectionId,
    sectionName: master.section,
    subsection: master.subsection,
    requirementText: master.title,
    text: master.text,
    guidance: master.guidance ?? [],
    expectedEvidence: master.expectedEvidence,
    evidenceRequired: master.evidenceRequired ?? master.expectedEvidence.length > 0,
  });
}

export function syncLiveRequirements(requirements: Requirement[], masters: MasterRequirement[]): Requirement[] {
  return masters.reduce((current, master) => syncLiveRequirement(current, master), requirements);
}

/** Auto-creates a dashboard SectionSummary for any published master requirement whose section
 *  doesn't have one yet, so newly imported content (e.g. a new Performance Standard code) still
 *  rolls up somewhere instead of silently vanishing from every aggregate view. */
export function syncSections(sections: SectionSummary[], masters: MasterRequirement[]): SectionSummary[] {
  const known = new Set(sections.map((section) => section.id));
  const additions: SectionSummary[] = [];
  masters.filter((master) => master.status === "Published").forEach((master) => {
    const id = sectionSlug(master.section);
    if (known.has(id)) return;
    known.add(id);
    additions.push({
      id,
      shortName: master.section,
      name: master.section,
      description: "",
      completion: 0,
      performance: "not-assessed",
      questions: 0,
      gaps: 0,
      kind: /^(OSHPS|OHPS)\b/i.test(master.section) ? "performance-standard" : "operating-system",
    });
  });
  return additions.length ? [...sections, ...additions] : sections;
}
