import { useEffect, useLayoutEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./Auth";
import AppShell from "./components/AppShell";
import { roleProfiles, type UserRole } from "./GuidedSetup";
import { NoAssignmentScreen, SessionExpiredScreen, UnauthorizedScreen } from "./screens/AccessStates";
import { AdminImportHistoryScreen, AdminImportsScreen, AdminRequirementsScreen } from "./screens/AdminScreens";
import { DashboardScreen, SiteDrilldownScreen } from "./screens/DashboardScreens";
import RequirementWorkspace from "./screens/RequirementWorkspace";
import LoginScreen from "./screens/LoginScreen";
import {
  AccountSettings,
  AppearanceSettings,
  GuidanceSettings,
  NotificationsSettings,
  SecuritySettings,
  SettingsLayout,
  SupportSettings,
} from "./screens/SettingsScreen";
import {
  ActionsScreen,
  AssessmentHomeScreen,
  OverviewScreen,
  OwnersScreen,
  SiteInformationScreen,
} from "./screens/SiteScreens";

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function AuthenticatedLanding() {
  const { user } = useAuth();
  return user ? <Navigate to={roleProfiles[user.role].home} replace /> : <LoginScreen />;
}

function RequireRole({ allowed }: { allowed: UserRole[] }) {
  const { user } = useAuth();
  return user && allowed.includes(user.role) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
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
        <Route path="login" element={<AuthenticatedLanding />} />
        <Route element={<RequireAuth />}>
          <Route element={<ShellLayout />}>
            <Route index element={<AuthenticatedLanding />} />
            <Route element={<RequireRole allowed={["site-contributor"]} />}>
              <Route path="overview" element={<OverviewScreen />} />
              <Route path="site-information" element={<SiteInformationScreen />} />
              <Route path="owners" element={<OwnersScreen />} />
              <Route path="assessment" element={<AssessmentHomeScreen />} />
              <Route path="assessment/:sectionId/:requirementId" element={<RequirementWorkspace />} />
              <Route path="actions" element={<ActionsScreen />} />
            </Route>
            <Route element={<RequireRole allowed={["enterprise-viewer", "administrator"]} />}>
              <Route path="dashboard" element={<DashboardScreen />} />
              <Route path="sites/:siteId" element={<SiteDrilldownScreen />} />
            </Route>
            <Route element={<RequireRole allowed={["administrator"]} />}>
              <Route path="admin/imports" element={<AdminImportsScreen />} />
              <Route path="admin/imports/history" element={<AdminImportHistoryScreen />} />
              <Route path="admin/requirements" element={<AdminRequirementsScreen />} />
            </Route>
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="account" replace />} />
              <Route path="account" element={<AccountSettings />} />
              <Route path="appearance" element={<AppearanceSettings />} />
              <Route path="notifications" element={<NotificationsSettings />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="guidance" element={<GuidanceSettings />} />
              <Route path="support" element={<SupportSettings />} />
            </Route>
          </Route>
        </Route>
        <Route path="no-assignment" element={<NoAssignmentScreen />} />
        <Route path="unauthorized" element={<UnauthorizedScreen />} />
        <Route path="session-expired" element={<SessionExpiredScreen />} />
        <Route path="*" element={<AuthenticatedLanding />} />
      </Routes>
    </>
  );
}
