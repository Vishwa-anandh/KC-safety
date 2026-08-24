/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DataSourceKind } from "../../data-access/contracts";
import { dataSourceSwitchEnabled, readDataSource, writeDataSource } from "../config/environment";

interface DataSourceContextValue {
  source: DataSourceKind;
  switchEnabled: boolean;
  setSource: (source: DataSourceKind) => void;
}

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [source, setSourceState] = useState<DataSourceKind>(readDataSource);
  const value = useMemo<DataSourceContextValue>(() => ({
    source,
    switchEnabled: dataSourceSwitchEnabled,
    setSource(nextSource) {
      if (nextSource === source) return;
      writeDataSource(nextSource);
      // Recreate all providers so no authentication or in-memory domain state crosses sources.
      setSourceState(nextSource);
      window.location.reload();
    },
  }), [source]);
  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>;
}

export function useDataSource() {
  const value = useContext(DataSourceContext);
  if (!value) throw new Error("useDataSource must be used within DataSourceProvider");
  return value;
}

/** Deliberately excluded from production bundles by the environment guard. */
export function DeveloperDataSourceSwitch() {
  const { source, switchEnabled, setSource } = useDataSource();
  if (!switchEnabled) return null;
  return <label style={{ position: "fixed", right: 12, bottom: 12, zIndex: 9999, display: "flex", gap: 6, alignItems: "center", padding: "7px 9px", borderRadius: 8, background: "#172033", color: "#fff", fontSize: 12, boxShadow: "0 4px 16px rgb(0 0 0 / 0.22)" }}>
    Developer data
    <select aria-label="Developer data source" value={source} onChange={(event) => setSource(event.target.value as DataSourceKind)} style={{ borderRadius: 4, border: 0, padding: "3px 5px" }}>
      <option value="demo">Demo</option>
      <option value="api">API</option>
    </select>
  </label>;
}
