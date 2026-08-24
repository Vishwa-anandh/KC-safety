import { useEffect, useLayoutEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth, NoAssignmentScreen, SessionExpiredScreen, LoginScreen } from "../../features/auth";
import AppShell from "../layouts/AppShell";
import { roleProfiles } from "../../features/onboarding";
import { AdminImportBatchPreviewScreen, AdminImportHistoryScreen, AdminImportsScreen, AdminRequirementDetailScreen, AdminRequirementsScreen, AdminSiteDetailScreen, AdminSitesScreen } from "../../features/admin";
import { DashboardScreen, SiteDrilldownScreen, SiteSectionDetailScreen } from "../../features/dashboard";
import { RequirementWorkspace } from "../../features/assessment";
import {
  AccountSettings,
  AppearanceSettings,
  GuidanceSettings,
  NotificationsSettings,
  SecuritySettings,
  SettingsLayout,
  SupportSettings,
} from "../../features/settings";
import {
  ActionsScreen,
  AssessmentHomeScreen,
  OverviewScreen,
  OwnersScreen,
  SiteInformationScreen,
} from "../../features/sites";
import { RequireAuth, RequireRole } from "./guards";
import { appPaths, settingsSegments } from "./route-manifest";

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function AuthenticatedLanding() {
  const { user } = useAuth();
  return user ? <Navigate to={roleProfiles[user.role].home} replace /> : <LoginScreen />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path={appPaths.login} element={<AuthenticatedLanding />} />
        <Route element={<RequireAuth />}>
          <Route element={<ShellLayout />}>
            <Route index element={<AuthenticatedLanding />} />
            <Route element={<RequireRole allowed={["site-contributor"]} />}>
              <Route path={appPaths.overview} element={<OverviewScreen />} />
              <Route path={appPaths.siteInformation} element={<SiteInformationScreen />} />
              <Route path={appPaths.owners} element={<OwnersScreen />} />
              <Route path={appPaths.assessment} element={<AssessmentHomeScreen />} />
              <Route path={appPaths.assessmentRequirement} element={<RequirementWorkspace />} />
              <Route path={appPaths.actions} element={<ActionsScreen />} />
            </Route>
            <Route element={<RequireRole allowed={["enterprise-viewer", "administrator"]} />}>
              <Route path={appPaths.dashboard} element={<DashboardScreen />} />
              <Route path={appPaths.siteDetail} element={<SiteDrilldownScreen />} />
              <Route path={appPaths.siteSection} element={<SiteSectionDetailScreen />} />
            </Route>
            <Route element={<RequireRole allowed={["administrator"]} />}>
              <Route path={appPaths.adminSites} element={<AdminSitesScreen />} />
              <Route path={appPaths.adminSiteDetail} element={<AdminSiteDetailScreen />} />
              <Route path={appPaths.adminImports} element={<AdminImportsScreen />} />
              <Route path={appPaths.adminImportHistory} element={<AdminImportHistoryScreen />} />
              <Route path={appPaths.adminImportPreview} element={<AdminImportBatchPreviewScreen />} />
              <Route path={appPaths.adminRequirements} element={<AdminRequirementsScreen />} />
              <Route path={appPaths.adminRequirementNew} element={<AdminRequirementDetailScreen />} />
              <Route path={appPaths.adminRequirementDetail} element={<AdminRequirementDetailScreen />} />
            </Route>
            <Route path={appPaths.settings} element={<SettingsLayout />}>
              <Route index element={<Navigate to={settingsSegments.account} replace />} />
              <Route path={settingsSegments.account} element={<AccountSettings />} />
              <Route path={settingsSegments.appearance} element={<AppearanceSettings />} />
              <Route path={settingsSegments.notifications} element={<NotificationsSettings />} />
              <Route path={settingsSegments.security} element={<SecuritySettings />} />
              <Route path={settingsSegments.guidance} element={<GuidanceSettings />} />
              <Route path={settingsSegments.support} element={<SupportSettings />} />
            </Route>
          </Route>
        </Route>
        <Route path={appPaths.noAssignment} element={<NoAssignmentScreen />} />
        <Route path={appPaths.sessionExpired} element={<SessionExpiredScreen />} />
        <Route path={appPaths.catchAll} element={<AuthenticatedLanding />} />
      </Routes>
    </>
  );
}
