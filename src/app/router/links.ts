import type { Requirement } from "../../shared/types";
import { appPaths, settingsSegments } from "./route-manifest";

export function requirementRoute(requirement: Requirement) {
  return `${appPaths.assessment}/${requirement.sectionId}/${requirement.id}`;
}

export function siteRoute(siteId: string) {
  return appPaths.siteDetail.replace(":siteId", siteId);
}

export function siteSectionRoute(siteId: string, sectionId: string) {
  return appPaths.siteSection.replace(":siteId", siteId).replace(":sectionId", sectionId);
}

export function settingsRoute(section: keyof typeof settingsSegments) {
  return `${appPaths.settings}/${settingsSegments[section]}`;
}
