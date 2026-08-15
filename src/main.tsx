import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AppStateProvider } from "./AppState";
import { AuthProvider } from "./Auth";
import { GuidedSetupProvider } from "./GuidedSetup";
import PasskeyFirstLoginPrompt from "./PasskeyFirstLoginPrompt";
import { ThemeProvider } from "./Theme";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppStateProvider>
        <BrowserRouter>
          <AuthProvider>
            <GuidedSetupProvider>
              <PasskeyFirstLoginPrompt />
              <App />
            </GuidedSetupProvider>
          </AuthProvider>
        </BrowserRouter>
      </AppStateProvider>
    </ThemeProvider>
  </StrictMode>,
);
