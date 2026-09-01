import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppRoutes from "./app/router/AppRoutes";
import { AppProviders } from "./app/providers/AppProviders";
import { AppErrorBoundary } from "./app/errors/AppErrorBoundary";
import "./tailwind.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </AppErrorBoundary>
  </StrictMode>,
);
