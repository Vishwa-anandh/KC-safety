import type { UserRole } from "../../shared/types";

export type RouteAccess =
  | { kind: "public" }
  | { kind: "authenticated" }
  | { kind: "role"; roles: readonly UserRole[] };

export interface AppRouteDefinition {
  id: string;
  path: string;
  access: RouteAccess;
  navigation: boolean;
}

export const appPaths = {
  root: "/",
  login: "/login",
  overview: "/overview",
  siteInformation: "/site-information",
  owners: "/owners",
  assessment: "/assessment",
  assessmentRequirement: "/assessment/:sectionId/:requirementId",
  actions: "/actions",
  dashboard: "/dashboard",
  siteDetail: "/sites/:siteId",
  siteSection: "/sites/:siteId/sections/:sectionId",
  adminSites: "/admin/sites",
  adminSiteDetail: "/admin/sites/:siteId",
  adminImports: "/admin/imports",
  adminImportHistory: "/admin/imports/history",
  adminImportPreview: "/admin/imports/:batchId/preview",
  adminRequirements: "/admin/requirements",
  adminRequirementNew: "/admin/requirements/new",
  adminRequirementDetail: "/admin/requirements/:requirementId",
  settings: "/settings",
  settingsAccount: "/settings/account",
  settingsAppearance: "/settings/appearance",
  settingsNotifications: "/settings/notifications",
  settingsSecurity: "/settings/security",
  settingsGuidance: "/settings/guidance",
  settingsSupport: "/settings/support",
  noAssignment: "/no-assignment",
  sessionExpired: "/session-expired",
  catchAll: "*",
} as const;

export const settingsSegments = {
  account: "account",
  appearance: "appearance",
  notifications: "notifications",
  security: "security",
  guidance: "guidance",
  support: "support",
} as const;

const contributor = ["site-contributor"] as const;
const enterprise = ["enterprise-viewer", "administrator"] as const;
const administrator = ["administrator"] as const;

export const routeManifest: readonly AppRouteDefinition[] = [
  { id: "root", path: appPaths.root, access: { kind: "authenticated" }, navigation: false },
  { id: "login", path: appPaths.login, access: { kind: "public" }, navigation: false },
  { id: "overview", path: appPaths.overview, access: { kind: "role", roles: contributor }, navigation: true },
  { id: "site-information", path: appPaths.siteInformation, access: { kind: "role", roles: contributor }, navigation: true },
  { id: "owners", path: appPaths.owners, access: { kind: "role", roles: contributor }, navigation: true },
  { id: "assessment", path: appPaths.assessment, access: { kind: "role", roles: contributor }, navigation: true },
  { id: "assessment-requirement", path: appPaths.assessmentRequirement, access: { kind: "role", roles: contributor }, navigation: false },
  { id: "actions", path: appPaths.actions, access: { kind: "role", roles: contributor }, navigation: true },
  { id: "dashboard", path: appPaths.dashboard, access: { kind: "role", roles: enterprise }, navigation: true },
  { id: "site-detail", path: appPaths.siteDetail, access: { kind: "role", roles: enterprise }, navigation: false },
  { id: "site-section", path: appPaths.siteSection, access: { kind: "role", roles: enterprise }, navigation: false },
  { id: "admin-sites", path: appPaths.adminSites, access: { kind: "role", roles: administrator }, navigation: true },
  { id: "admin-site-detail", path: appPaths.adminSiteDetail, access: { kind: "role", roles: administrator }, navigation: false },
  { id: "admin-imports", path: appPaths.adminImports, access: { kind: "role", roles: administrator }, navigation: true },
  { id: "admin-import-history", path: appPaths.adminImportHistory, access: { kind: "role", roles: administrator }, navigation: false },
  { id: "admin-import-preview", path: appPaths.adminImportPreview, access: { kind: "role", roles: administrator }, navigation: false },
  { id: "admin-requirements", path: appPaths.adminRequirements, access: { kind: "role", roles: administrator }, navigation: true },
  { id: "admin-requirement-new", path: appPaths.adminRequirementNew, access: { kind: "role", roles: administrator }, navigation: false },
  { id: "admin-requirement-detail", path: appPaths.adminRequirementDetail, access: { kind: "role", roles: administrator }, navigation: false },
  { id: "settings", path: appPaths.settings, access: { kind: "authenticated" }, navigation: true },
  { id: "settings-account", path: appPaths.settingsAccount, access: { kind: "authenticated" }, navigation: false },
  { id: "settings-appearance", path: appPaths.settingsAppearance, access: { kind: "authenticated" }, navigation: false },
  { id: "settings-notifications", path: appPaths.settingsNotifications, access: { kind: "authenticated" }, navigation: false },
  { id: "settings-security", path: appPaths.settingsSecurity, access: { kind: "authenticated" }, navigation: false },
  { id: "settings-guidance", path: appPaths.settingsGuidance, access: { kind: "authenticated" }, navigation: false },
  { id: "settings-support", path: appPaths.settingsSupport, access: { kind: "authenticated" }, navigation: false },
  { id: "no-assignment", path: appPaths.noAssignment, access: { kind: "public" }, navigation: false },
  { id: "session-expired", path: appPaths.sessionExpired, access: { kind: "public" }, navigation: false },
  { id: "catch-all", path: appPaths.catchAll, access: { kind: "public" }, navigation: false },
] as const;

export function pathFor(id: AppRouteDefinition["id"]) {
  const route = routeManifest.find((item) => item.id === id);
  if (!route) throw new Error(`Unknown route id: ${id}`);
  return route.path;
}
