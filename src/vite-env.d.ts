/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_DATA_SOURCE_SWITCH?: "true" | "false";
  readonly VITE_ENABLE_DEMO_AUTH?: "true" | "false";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
