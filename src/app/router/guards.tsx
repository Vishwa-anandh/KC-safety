import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApplicationData } from "../providers/ApplicationDataProvider";
import { useAuth } from "../../features/auth";
import { roleProfiles } from "../../features/onboarding";
import type { UserRole } from "../../shared/types";
import { appPaths } from "./route-manifest";

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return isAuthenticated ? <Outlet /> : <Navigate to={appPaths.login} replace state={{ from: location }} />;
}

export function RequireRole({ allowed }: { allowed: readonly UserRole[] }) {
  const { user } = useAuth();
  return user && allowed.includes(user.role)
    ? <Outlet />
    : <Navigate to={user ? roleProfiles[user.role].home : appPaths.login} replace />;
}

/** Site information and Program owners are only for the site-contributor's home site — viewing
 *  a different site (via the sidebar switcher) drops them to "Site user" for that site and these
 *  two routes redirect away, not just hide from the sidebar. */
export function RequireHomeSite() {
  const { currentSiteId, homeSiteId } = useApplicationData();
  return currentSiteId === homeSiteId ? <Outlet /> : <Navigate to={appPaths.overview} replace />;
}
