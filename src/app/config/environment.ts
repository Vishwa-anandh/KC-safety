import type { DataSourceKind } from "../../data-access/contracts";

const DATA_SOURCE_KEY = "ehss-developer-data-source-v1";

function optionalUrl(value: string | undefined, name: string) {
  const normalized = value?.trim().replace(/\/$/, "") ?? "";
  if (!normalized) return "";
  try {
    return new URL(normalized).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL.`);
  }
}

export const environment = Object.freeze({
  assetBaseUrl: import.meta.env.BASE_URL,
  apiBaseUrl: optionalUrl(import.meta.env.VITE_API_BASE_URL, "VITE_API_BASE_URL"),
  dataSourceSwitchEnabled: import.meta.env.DEV && import.meta.env.VITE_ENABLE_DATA_SOURCE_SWITCH === "true",
  demoAuthenticationEnabled: import.meta.env.VITE_ENABLE_DEMO_AUTH !== "false",
});

export const { apiBaseUrl, assetBaseUrl, dataSourceSwitchEnabled, demoAuthenticationEnabled } = environment;

export function readDataSource(): DataSourceKind {
  if (!dataSourceSwitchEnabled) return "demo";
  return window.localStorage.getItem(DATA_SOURCE_KEY) === "api" ? "api" : "demo";
}

export function writeDataSource(source: DataSourceKind) {
  window.localStorage.setItem(DATA_SOURCE_KEY, source);
}
