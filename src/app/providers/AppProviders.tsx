import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, PasskeyFirstLoginPrompt } from "../../features/auth";
import { GuidedSetupProvider } from "../../features/onboarding";
import { ThemeProvider } from "../../features/settings";
import { ApplicationDataProvider } from "./ApplicationDataProvider";
import { DataSourceProvider, DeveloperDataSourceSwitch } from "./DataSourceProvider";

/** Startup composition only. Provider order intentionally preserves the existing runtime behavior. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DataSourceProvider>
        <ApplicationDataProvider>
          <BrowserRouter>
            <AuthProvider>
              <GuidedSetupProvider>
                <PasskeyFirstLoginPrompt />
                {children}
              </GuidedSetupProvider>
            </AuthProvider>
          </BrowserRouter>
        </ApplicationDataProvider>
        <DeveloperDataSourceSwitch />
      </DataSourceProvider>
    </ThemeProvider>
  );
}
