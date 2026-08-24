import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const workspace = path.resolve(process.argv[2] || "D:/KC safety");
const sourceRoot = path.resolve(process.argv[3] || "C:/Users/vishw/Downloads/pappa.ai");
const docs = path.join(workspace, "docs", "pappa-ai-architecture");
const failures = [];
const checks = [];

const record = (name, ok, details = {}) => {
  checks.push({ name, ok, ...details });
  if (!ok) failures.push(name);
};

function parseCsv(content) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < content.length; index++) {
    const char = content[index];
    if (quoted) {
      if (char === '"' && content[index + 1] === '"') {
        value += '"';
        index++;
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value.replace(/\r$/, ""));
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else value += char;
  }
  return rows;
}

function csvObjects(file) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const headers = rows.shift() ?? [];
  return rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

const required = [
  "pappa-ai-architecture-audit.md", "frontend-audit.md", "backend-audit.md", "bridge-audit.md",
  "architecture-diagrams.md", "file-inventory.csv", "route-inventory.csv", "route-api-map.csv",
  "state-query-matrix.csv", "permission-matrix.csv", "backend-endpoint-inventory.csv",
  "integration-matrix.csv", "evidence-matrix.csv", "dependency-graph.json",
  "dependency-graph-aggregated.json", "dependency-graph.html", "coverage-manifest.json",
  "graphify/frontend/graph.json", "graphify/frontend/GRAPH_REPORT.md",
  "graphify/backend/graph.json", "graphify/backend/graph.html", "graphify/backend/GRAPH_REPORT.md",
  "graphify/bridge/graph.json", "graphify/bridge/graph.html", "graphify/bridge/GRAPH_REPORT.md",
];
for (const relative of required) record(`required:${relative}`, fs.existsSync(path.join(docs, relative)));
record("required:rule.md", fs.existsSync(path.join(workspace, "rule.md")));

const manifest = JSON.parse(fs.readFileSync(path.join(docs, "coverage-manifest.json"), "utf8"));
record("inventory-count", manifest.totals.inventoriedFiles === 1486, { actual: manifest.totals.inventoriedFiles });
record("dependency-edge-count", manifest.totals.dependencyEdges === 8955, { actual: manifest.totals.dependencyEdges });
record("unresolved-import-count", manifest.totals.unresolvedImports === 0, { actual: manifest.totals.unresolvedImports });
record("runtime-endpoint-count", manifest.totals.runtimeRegisteredEndpoints === 523, { actual: manifest.totals.runtimeRegisteredEndpoints });

const liveHashes = [];
let missingSourceFiles = 0;
let changedSourceFiles = 0;
for (const item of manifest.fileHashes) {
  const file = path.join(sourceRoot, item.path);
  if (!fs.existsSync(file)) {
    missingSourceFiles++;
    continue;
  }
  const actual = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  if (actual !== item.sha256) changedSourceFiles++;
  liveHashes.push(`${item.path}:${actual}`);
}
const liveDigest = crypto.createHash("sha256").update(liveHashes.sort().join("\n")).digest("hex");
record("source-files-present", missingSourceFiles === 0, { missingSourceFiles });
record("source-file-hashes-unchanged", changedSourceFiles === 0, { changedSourceFiles });
record("source-manifest-digest", liveDigest === manifest.manifestSha256, { expected: manifest.manifestSha256, actual: liveDigest });

const dependency = JSON.parse(fs.readFileSync(path.join(docs, "dependency-graph.json"), "utf8"));
const dependencyNodeIds = new Set(dependency.nodes.map((node) => node.id));
const danglingDependencies = dependency.edges.filter((edge) => !dependencyNodeIds.has(edge.source) || (edge.resolution !== "unresolved" && !dependencyNodeIds.has(edge.target)));
record("dependency-graph-node-count", dependency.nodes.length === 1567, { actual: dependency.nodes.length });
record("dependency-graph-edge-count", dependency.edges.length === 8955, { actual: dependency.edges.length });
record("dependency-graph-dangling-edges", danglingDependencies.length === 0, { actual: danglingDependencies.length });

const routeRows = csvObjects(path.join(docs, "route-inventory.csv"));
const routePathField = Object.keys(routeRows[0] ?? {}).find((key) => /final.*path|normalized.*route|^path$/i.test(key));
const uniqueRouteCount = routePathField ? new Set(routeRows.map((row) => row[routePathField])).size : 0;
record("route-row-count", routeRows.length === 97, { actual: routeRows.length });
record("route-unique-count", uniqueRouteCount === 97, { actual: uniqueRouteCount, field: routePathField });

const endpointRows = csvObjects(path.join(docs, "backend-endpoint-inventory.csv"));
const endpointCounts = endpointRows.reduce((counts, row) => {
  const key = `${row.layer}:${row.registrationStatus}`;
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}, {});
record("endpoint-source-row-count", endpointRows.length === 533, { actual: endpointRows.length });
record("backend-runtime-handler-count", endpointCounts["Backend:registered-runtime"] === 517, { actual: endpointCounts["Backend:registered-runtime"] });
record("backend-unregistered-handler-count", endpointCounts["Backend:unregistered-source-controller"] === 10, { actual: endpointCounts["Backend:unregistered-source-controller"] });
record("bridge-runtime-handler-count", endpointCounts["Bridge:registered-runtime"] === 6, { actual: endpointCounts["Bridge:registered-runtime"] });

const apiRows = csvObjects(path.join(docs, "route-api-map.csv"));
const apiStatus = Object.groupBy(apiRows, (row) => row.mappingStatus);
record("frontend-api-call-count", apiRows.length === 209, { actual: apiRows.length });
record("frontend-api-exact-map-count", (apiStatus["mapped-exact-shape"] ?? []).length === 162, { actual: (apiStatus["mapped-exact-shape"] ?? []).length });

const stateRows = csvObjects(path.join(docs, "state-query-matrix.csv"));
record("state-query-occurrence-count", stateRows.length === 1258, { actual: stateRows.length });
const permissionRows = csvObjects(path.join(docs, "permission-matrix.csv"));
record("permission-page-code-count", permissionRows.length === 41, { actual: permissionRows.length });

for (const stage of ["frontend", "backend", "bridge"]) {
  for (const name of ["graph.json", ".graphify_analysis.json", ".graphify_ast.json", ".graphify_detect.json", ".graphify_extract.json"]) {
    const file = path.join(docs, "graphify", stage, name);
    try {
      JSON.parse(fs.readFileSync(file, "utf8"));
      record(`graphify-json:${stage}/${name}`, true);
    } catch (error) {
      record(`graphify-json:${stage}/${name}`, false, { error: error.message });
    }
  }
}

for (const markdownName of ["pappa-ai-architecture-audit.md", "frontend-audit.md", "backend-audit.md", "bridge-audit.md", "architecture-diagrams.md"]) {
  const file = path.join(docs, markdownName);
  const content = fs.readFileSync(file, "utf8");
  const missing = [];
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (!target || /^(?:https?:|mailto:)/i.test(target)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) missing.push(target);
  }
  record(`markdown-local-links:${markdownName}`, missing.length === 0, { missing });
}

const report = {
  generatedAtUtc: new Date().toISOString(),
  passed: failures.length === 0,
  failures,
  checks,
  sourceManifestSha256: liveDigest,
};
fs.writeFileSync(path.join(docs, "validation-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ passed: report.passed, checks: checks.length, failures, sourceManifestSha256: liveDigest }, null, 2));
if (failures.length) process.exitCode = 1;
