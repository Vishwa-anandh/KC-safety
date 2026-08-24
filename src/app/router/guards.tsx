import { Navigate, Outlet, useLocation } from "react-router-dom";
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
