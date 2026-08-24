import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const sourceRoot = path.resolve(process.argv[2] || "C:/Users/vishw/Downloads/pappa.ai");
const outputRoot = path.resolve(process.argv[3] || "D:/KC safety/docs/pappa-ai-architecture");

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".vite",
  "logs",
  "test-results",
  "playwright-report",
  "graphify-out",
]);
const isSensitiveName = (name) => name.startsWith(".env") && !name.endsWith(".example");
const textExtensions = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".txt", ".sql",
  ".html", ".css", ".scss", ".yml", ".yaml", ".toml", ".xml", ".svg", ".sh", ".ps1",
]);
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const toPosix = (value) => value.replaceAll("\\", "/");
const rel = (value) => toPosix(path.relative(sourceRoot, value));
const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const writeCsv = (file, headers, rows) => {
  const content = [headers.map(csv).join(","), ...rows.map((row) => headers.map((key) => csv(row[key])).join(","))].join("\n") + "\n";
  fs.writeFileSync(path.join(outputRoot, file), content, "utf8");
};
const lineNumberAt = (text, index) => text.slice(0, index).split("\n").length;
const lineTextAt = (text, index) => text.split(/\r?\n/)[lineNumberAt(text, index) - 1]?.trim() ?? "";

function walk(directory, files = [], excluded = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        excluded.push({ path: rel(absolute), reason: "generated, dependency, cache, log, or report directory" });
      } else {
        walk(absolute, files, excluded);
      }
      continue;
    }
    if (!entry.isFile()) continue;
    if (isSensitiveName(entry.name)) {
      excluded.push({ path: rel(absolute), reason: "sensitive environment file; name recorded but contents not read" });
      continue;
    }
    files.push(absolute);
  }
  return { files, excluded };
}

function classify(relativePath) {
  const parts = relativePath.split("/");
  const layer = ["frontend", "Backend", "Bridge", "scratch"].includes(parts[0]) ? parts[0] : "workspace";
  const ext = path.extname(relativePath).toLowerCase();
  let kind = "asset";
  if (/\.spec\.|\.test\.|e2e|playwright/i.test(relativePath)) kind = "test";
  else if (/migration/i.test(relativePath) || ext === ".sql") kind = "migration";
  else if (/template/i.test(relativePath)) kind = "template";
  else if (/docs?\//i.test(relativePath) || ext === ".md" || ext === ".txt") kind = "documentation";
  else if (/scripts?\//i.test(relativePath) || [".sh", ".ps1"].includes(ext)) kind = "script";
  else if (codeExtensions.has(ext)) kind = "source";
  else if ([".json", ".yml", ".yaml", ".toml"].includes(ext) || /config|lock|\.env\.example/i.test(relativePath)) kind = "configuration";
  const rootOffset = layer === "workspace" ? 0 : 1;
  let feature = parts[rootOffset] === "src" ? parts[rootOffset + 1] ?? "root" : parts[rootOffset] ?? "root";
  if (layer === "frontend" && parts[1] === "src") {
    if (parts[2] === "modules") feature = [parts[3], parts[4]].filter(Boolean).join("/");
    else if (parts[2] === "shared" || parts[2] === "app") feature = [parts[2], parts[3]].filter(Boolean).join("/");
    else feature = parts[2] ?? "root";
  }
  return { layer, kind, feature, extension: ext || "(none)" };
}

function readText(file) {
  const ext = path.extname(file).toLowerCase();
  const name = path.basename(file);
  if (!textExtensions.has(ext) && !["Dockerfile", ".editorconfig", ".gitignore"].includes(name)) return null;
  const stat = fs.statSync(file);
  if (stat.size > 5_000_000) return null;
  return fs.readFileSync(file, "utf8");
}

function maskComments(text) {
  const preserveLines = (value) => value.replace(/[^\r\n]/g, " ");
  return text
    .replace(/\/\*[\s\S]*?\*\//g, preserveLines)
    .replace(/^[ \t]*\/\/.*$/gm, preserveLines);
}

function matchingBrace(text, openingIndex) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = openingIndex; index < text.length; index++) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth++;
    if (char === "}" && --depth === 0) return index;
  }
  return text.length - 1;
}

const { files, excluded } = walk(sourceRoot);
const fileByRelative = new Map(files.map((file) => [rel(file), file]));
const inventory = [];
const fileTexts = new Map();

for (const file of files) {
  const relativePath = rel(file);
  const stat = fs.statSync(file);
  const buffer = fs.readFileSync(file);
  const meta = classify(relativePath);
  const text = readText(file);
  if (text !== null) fileTexts.set(relativePath, text);
  inventory.push({
    path: relativePath,
    layer: meta.layer,
    feature: meta.feature,
    kind: meta.kind,
    extension: meta.extension,
    bytes: stat.size,
    sha256: sha256(buffer),
    lastModifiedUtc: stat.mtime.toISOString(),
    analysisStatus: text === null ? "inventoried-binary" : "inventoried-text",
  });
}

function resolveImport(fromRelative, specifier) {
  if (!specifier) return { target: "", status: "unresolved" };
  if (!specifier.startsWith(".") && !specifier.startsWith("@/") && !specifier.startsWith("/") && !/^(database|common|config|auth|rbac)\//.test(specifier)) {
    const packageName = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
    return { target: `npm:${packageName}`, status: "external" };
  }
  const fromAbsolute = path.join(sourceRoot, fromRelative);
  const layer = fromRelative.split("/")[0];
  let base;
  if (specifier.startsWith("@/")) base = path.join(sourceRoot, "frontend", "src", specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(fromAbsolute), specifier);
  else if (specifier.startsWith("/")) base = path.join(sourceRoot, specifier);
  else base = path.join(sourceRoot, layer, specifier);
  const candidates = [
    base,
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"].map((ext) => `${base}${ext}`),
    ...[".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"].map((ext) => path.join(base, `index${ext}`)),
  ];
  const found = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return found ? { target: rel(found), status: "resolved" } : { target: specifier, status: "unresolved" };
}

const graphNodes = inventory.map((item) => ({ id: item.path, label: path.basename(item.path), type: "file", ...classify(item.path) }));
const graphEdges = [];
const externalNodes = new Set();
const unresolvedImports = [];
const importPattern = /(?:import|export)\s+(?:[^"'`]*?\s+from\s+)?["'`]([^"'`]+)["'`]|require\(\s*["'`]([^"'`]+)["'`]\s*\)|import\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

for (const [relativePath, text] of fileTexts) {
  if (!codeExtensions.has(path.extname(relativePath).toLowerCase())) continue;
  for (const match of text.matchAll(importPattern)) {
    if (lineTextAt(text, match.index).startsWith("//")) continue;
    const specifier = match[1] || match[2] || match[3];
    const resolved = resolveImport(relativePath, specifier);
    if (resolved.status === "external") externalNodes.add(resolved.target);
    if (resolved.status === "unresolved") unresolvedImports.push({ source: relativePath, specifier, line: lineNumberAt(text, match.index) });
    graphEdges.push({
      source: relativePath,
      target: resolved.target,
      relation: "imports",
      confidence: resolved.status === "resolved" || resolved.status === "external" ? "EXTRACTED" : "AMBIGUOUS",
      confidenceScore: resolved.status === "unresolved" ? 0.35 : 1,
      sourceLocation: `${relativePath}:${lineNumberAt(text, match.index)}`,
      resolution: resolved.status,
    });
  }
}
for (const id of externalNodes) graphNodes.push({ id, label: id.slice(4), type: "external-package", layer: "external", feature: "npm", kind: "dependency" });

function parseApiPathConstants() {
  const constants = new Map();
  for (const [relativePath, text] of fileTexts) {
    if (!relativePath.endsWith("apiPaths.ts")) continue;
    const objectPattern = /export\s+const\s+(\w+)\s*=\s*\{/g;
    for (const objectMatch of text.matchAll(objectPattern)) {
      const objectName = objectMatch[1];
      let depth = 1;
      let cursor = objectMatch.index + objectMatch[0].length;
      while (cursor < text.length && depth > 0) {
        if (text[cursor] === "{") depth++;
        if (text[cursor] === "}") depth--;
        cursor++;
      }
      const body = text.slice(objectMatch.index + objectMatch[0].length, cursor - 1);
      const memberPattern = /(\w+)\s*:\s*(?:\([^)]*\)\s*=>\s*)?["'`]([^"'`]+)["'`]/g;
      for (const member of body.matchAll(memberPattern)) constants.set(`${objectName}.${member[1]}`, member[2]);
    }
  }
  return constants;
}

const apiPathConstants = parseApiPathConstants();
const localStringConstants = new Map();
for (const [relativePath, text] of fileTexts) {
  const pattern = /(?:export\s+)?const\s+(\w+)\s*=\s*["'`]([^"'`]+)["'`]/g;
  for (const match of text.matchAll(pattern)) localStringConstants.set(`${relativePath}:${match[1]}`, match[2]);
}

function normalizeEndpoint(raw) {
  if (!raw) return "";
  let value = raw.trim();
  value = value.replace(/^(["'`])|(["'`])$/g, "");
  value = value.replace(/\$\{[^}]+\}/g, ":param");
  value = value.split("?")[0];
  if (!value.startsWith("/")) value = `/${value}`;
  return value.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function endpointFromExpression(relativePath, expression) {
  const raw = expression.trim();
  if (/^["'`]/.test(raw)) return normalizeEndpoint(raw);
  const member = raw.match(/([A-Za-z_]\w*\.[A-Za-z_]\w*)/);
  if (member && apiPathConstants.has(member[1])) return normalizeEndpoint(apiPathConstants.get(member[1]));
  const identifier = raw.match(/^([A-Za-z_]\w*)/);
  if (identifier && localStringConstants.has(`${relativePath}:${identifier[1]}`)) return normalizeEndpoint(localStringConstants.get(`${relativePath}:${identifier[1]}`));
  return "";
}

const serviceClasses = new Map();
for (const [relativePath, text] of fileTexts) {
  if (!relativePath.endsWith(".service.ts")) continue;
  const serviceClass = maskComments(text).match(/export\s+class\s+(\w+Service)\b/)?.[1];
  if (!serviceClass) continue;
  serviceClasses.set(serviceClass, {
    file: relativePath,
    entities: [...new Set([...text.matchAll(/@InjectRepository\(\s*(\w+)\s*\)/g)].map((match) => match[1]))],
  });
}

const moduleSources = [...fileTexts.entries()]
  .filter(([relativePath]) => relativePath.endsWith(".module.ts"))
  .map(([relativePath, text]) => ({ relativePath, code: maskComments(text) }));

function controllerRegistration(controllerClass) {
  const registeredBy = moduleSources
    .filter(({ code }) => {
      const controllersBlock = code.match(/controllers\s*:\s*\[([\s\S]*?)\]/)?.[1] ?? "";
      return new RegExp(`\\b${controllerClass}\\b`).test(controllersBlock);
    })
    .map(({ relativePath }) => relativePath);
  return {
    registrationStatus: registeredBy.length ? "registered-runtime" : "unregistered-source-controller",
    registeredBy: registeredBy.join(" | "),
  };
}

function parseControllers(layer) {
  const endpoints = [];
  for (const [relativePath, text] of fileTexts) {
    if (!relativePath.startsWith(`${layer}/`) || !relativePath.endsWith(".controller.ts")) continue;
    const code = maskComments(text);
    const prefix = code.match(/@Controller\(\s*["'`]([^"'`]*)["'`]\s*\)/)?.[1] ?? "";
    const controllerClass = code.match(/@Controller\([\s\S]{0,300}?export\s+class\s+(\w+)/)?.[1] ?? path.basename(relativePath, ".controller.ts");
    const registration = controllerRegistration(controllerClass);
    const injections = new Map([...code.matchAll(/(?:private|protected|public)\s+(?:readonly\s+)?(\w+)\s*:\s*(\w+Service)\b/g)].map((match) => [match[1], match[2]]));
    const decoratorPattern = /@(Get|Post|Put|Patch|Delete|All)\(\s*(?:["'`]([^"'`]*)["'`])?\s*\)/g;
    for (const match of code.matchAll(decoratorPattern)) {
      const afterStart = match.index + match[0].length;
      const after = code.slice(afterStart, afterStart + 5000);
      const handlerMatch = after.match(/^[ \t]{2}(?:(?:public|private|protected)\s+)?(?:async\s+)?(\w+)\s*\(/m);
      const handler = handlerMatch?.[1] ?? "unknown";
      const handlerStart = handlerMatch ? afterStart + handlerMatch.index : afterStart;
      const fallbackServices = [...new Set(injections.values())];
      const serviceFiles = [...new Set(fallbackServices.map((serviceClass) => serviceClasses.get(serviceClass)?.file).filter(Boolean))];
      const entities = [...new Set(fallbackServices.flatMap((serviceClass) => serviceClasses.get(serviceClass)?.entities ?? []))];
      const previousMethodClose = code.lastIndexOf("\n  }", match.index);
      const permissionsBlock = code.slice(Math.max(0, previousMethodClose + 4), handlerStart);
      const permissions = [...permissionsBlock.matchAll(/@Permissions\(([^)]*)\)/g)].flatMap((m) => [...m[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((x) => x[1]));
      endpoints.push({
        layer,
        file: relativePath,
        controllerClass,
        ...registration,
        line: lineNumberAt(text, match.index),
        method: match[1].toUpperCase(),
        path: normalizeEndpoint(`${prefix}/${match[2] ?? ""}`),
        handler,
        service: fallbackServices.join(" | "),
        serviceFile: serviceFiles.join(" | "),
        entities: [...new Set(entities)].join(" | "),
        permissions: [...new Set(permissions)].join(" | "),
      });
    }
  }
  return endpoints;
}

const backendEndpoints = parseControllers("Backend");
const bridgeEndpoints = parseControllers("Bridge");
const allEndpoints = [...backendEndpoints, ...bridgeEndpoints];
const samePathShape = (left, right) => {
  const a = left.split("/").filter(Boolean);
  const b = right.split("/").filter(Boolean);
  if (a.length !== b.length) return false;
  return a.every((segment, index) => segment.startsWith(":") || b[index].startsWith(":") || segment === b[index]);
};

const apiRows = [];
const axiosPattern = /\bhttps\.(get|post|put|patch|delete)\s*(?:<[^;()]*?>)?\s*\(\s*([^,\n\r]+)/g;
for (const [relativePath, text] of fileTexts) {
  if (!relativePath.startsWith("frontend/src/") || !codeExtensions.has(path.extname(relativePath).toLowerCase())) continue;
  for (const match of text.matchAll(axiosPattern)) {
    const method = match[1].toUpperCase();
    const expression = match[2].trim();
    const normalized = endpointFromExpression(relativePath, expression);
    const candidates = normalized ? backendEndpoints.filter((endpoint) => (endpoint.method === method || endpoint.method === "ALL") && samePathShape(normalized, endpoint.path)) : [];
    const selected = candidates.length === 1 ? candidates[0] : null;
    apiRows.push({
      frontendFile: relativePath,
      line: lineNumberAt(text, match.index),
      httpMethod: method,
      endpointExpression: expression,
      normalizedEndpoint: normalized,
      backendController: selected?.file ?? "",
      backendRegistrationStatus: selected?.registrationStatus ?? "",
      backendHandler: selected?.handler ?? "",
      backendService: selected?.service ?? "",
      entities: selected?.entities ?? "",
      mappingStatus: selected ? "mapped-exact-shape" : candidates.length > 1 ? "ambiguous-multiple" : normalized ? "unresolved-endpoint" : "unresolved-expression",
    });
  }
}

const stateRows = [];
const statePatterns = [
  ["redux-selector", /\buseSelector\s*\(/g],
  ["redux-dispatch-hook", /\buseDispatch\s*\(/g],
  ["redux-direct-store-read", /\bstore\.getState\s*\(/g],
  ["tanstack-query", /\buseQuery\s*(?:<[^>]*>)?\s*\(/g],
  ["tanstack-infinite-query", /\buseInfiniteQuery\s*(?:<[^>]*>)?\s*\(/g],
  ["tanstack-mutation", /\buseMutation\s*(?:<[^;]*?>)?\s*\(/g],
  ["query-key", /\bqueryKey\s*:/g],
  ["query-invalidation", /\binvalidateQueries\s*\(/g],
  ["query-cache-clear", /\b(?:clear|removeQueries|resetQueries)\s*\(/g],
  ["local-storage", /\blocalStorage\./g],
  ["session-storage", /\bsessionStorage\./g],
];
for (const [relativePath, text] of fileTexts) {
  if (!relativePath.startsWith("frontend/src/") || !codeExtensions.has(path.extname(relativePath).toLowerCase())) continue;
  for (const [kind, pattern] of statePatterns) {
    for (const match of text.matchAll(pattern)) {
      const context = text.slice(Math.max(0, match.index - 250), Math.min(text.length, match.index + 500));
      const scopes = ["institutionId", "branchId", "roleId", "userId"].filter((scope) => context.includes(scope));
      stateRows.push({ file: relativePath, line: lineNumberAt(text, match.index), kind, details: lineTextAt(text, match.index), nearbyScopeIdentifiers: scopes.join(" | ") });
    }
  }
}

const permissionSources = new Map();
const addPermission = (pageCode, sourceKind, file, line, features = []) => {
  if (!pageCode) return;
  const current = permissionSources.get(pageCode) ?? { pageCode, menu: [], route: [], component: [], backend: [], backendFeatures: new Set() };
  current[sourceKind].push(`${file}:${line}`);
  for (const feature of features) current.backendFeatures.add(feature);
  permissionSources.set(pageCode, current);
};
for (const [relativePath, text] of fileTexts) {
  const code = maskComments(text);
  if (relativePath.startsWith("frontend/src/")) {
    for (const match of code.matchAll(/pageCode\s*:\s*["'`]([A-Z0-9_]+)["'`]/g)) addPermission(match[1], "menu", relativePath, lineNumberAt(text, match.index));
    for (const match of code.matchAll(/<PermissionRoute[\s\S]{0,240}?pageCode=["'`]([A-Z0-9_]+)["'`][\s\S]{0,180}?>/g)) addPermission(match[1], "route", relativePath, lineNumberAt(text, match.index));
    for (const match of code.matchAll(/\bcan\(\s*["'`]([A-Z0-9_]+)["'`]\s*,\s*["'`]([A-Z0-9_]+)["'`]/g)) addPermission(match[2], "component", relativePath, lineNumberAt(text, match.index));
  }
  if (relativePath.startsWith("Backend/") && relativePath.endsWith(".ts")) {
    for (const match of code.matchAll(/@Permissions\(([^)]*)\)/g)) {
      for (const code of [...match[1].matchAll(/["'`]([A-Z0-9_]+):([A-Z0-9_]+)["'`]/g)]) addPermission(code[1], "backend", relativePath, lineNumberAt(text, match.index), [code[2]]);
    }
  }
}
const permissionRows = [...permissionSources.values()].sort((a, b) => a.pageCode.localeCompare(b.pageCode)).map((row) => ({
  pageCode: row.pageCode,
  menuCount: row.menu.length,
  routeGuardCount: row.route.length,
  componentCheckCount: row.component.length,
  backendDecoratorCount: row.backend.length,
  backendFeatures: [...row.backendFeatures].sort().join(" | "),
  menuSources: row.menu.join(" | "),
  routeSources: row.route.join(" | "),
  componentSources: row.component.join(" | "),
  backendSources: row.backend.join(" | "),
  alignment: row.backend.length === 0 ? "missing-backend-decorator-evidence" : row.route.length === 0 && row.menu.length > 0 ? "menu-without-route-guard" : row.menu.length === 0 && row.route.length > 0 ? "guarded-route-without-menu-code" : "evidence-present-review-features",
}));

const aggregateNodes = new Map();
const aggregateEdges = new Map();
const groupFor = (id) => {
  if (id.startsWith("npm:")) return id;
  const parts = id.split("/");
  if (parts[0] === "frontend") return parts[2] === "modules" ? `frontend:${parts[3] ?? "modules"}` : `frontend:${parts[2] ?? "root"}`;
  if (parts[0] === "Backend" || parts[0] === "Bridge") return `${parts[0]}:${parts[1] ?? "root"}`;
  return `${parts[0]}:${parts[1] ?? "root"}`;
};
for (const node of graphNodes) {
  const group = groupFor(node.id);
  const entry = aggregateNodes.get(group) ?? { id: group, label: group, count: 0, layer: group.split(":")[0] };
  entry.count++;
  aggregateNodes.set(group, entry);
}
for (const edge of graphEdges.filter((edge) => edge.resolution !== "unresolved")) {
  const source = groupFor(edge.source);
  const target = groupFor(edge.target);
  if (source === target) continue;
  const key = `${source}=>${target}`;
  const entry = aggregateEdges.get(key) ?? { source, target, count: 0 };
  entry.count++;
  aggregateEdges.set(key, entry);
}

fs.mkdirSync(outputRoot, { recursive: true });
writeCsv("file-inventory.csv", ["path", "layer", "feature", "kind", "extension", "bytes", "sha256", "lastModifiedUtc", "analysisStatus"], inventory);
writeCsv("route-api-map.csv", ["frontendFile", "line", "httpMethod", "endpointExpression", "normalizedEndpoint", "backendController", "backendRegistrationStatus", "backendHandler", "backendService", "entities", "mappingStatus"], apiRows);
writeCsv("state-query-matrix.csv", ["file", "line", "kind", "details", "nearbyScopeIdentifiers"], stateRows);
writeCsv("permission-matrix.csv", ["pageCode", "menuCount", "routeGuardCount", "componentCheckCount", "backendDecoratorCount", "backendFeatures", "menuSources", "routeSources", "componentSources", "backendSources", "alignment"], permissionRows);
writeCsv("backend-endpoint-inventory.csv", ["layer", "file", "controllerClass", "registrationStatus", "registeredBy", "line", "method", "path", "handler", "service", "serviceFile", "entities", "permissions"], allEndpoints);

fs.writeFileSync(path.join(outputRoot, "dependency-graph.json"), JSON.stringify({ nodes: graphNodes, edges: graphEdges }, null, 2), "utf8");
fs.writeFileSync(path.join(outputRoot, "dependency-graph-aggregated.json"), JSON.stringify({ nodes: [...aggregateNodes.values()], edges: [...aggregateEdges.values()] }, null, 2), "utf8");

const layerCounts = Object.groupBy(inventory, (item) => item.layer);
const kindCounts = Object.groupBy(inventory, (item) => item.kind);
const manifestDigest = sha256(Buffer.from(inventory.map((item) => `${item.path}:${item.sha256}`).sort().join("\n")));
const coverage = {
  generatedAtUtc: new Date().toISOString(),
  sourceRoot,
  outputRoot,
  policy: {
    included: "All first-party files outside dependency, build, cache, log, and generated-report directories; sensitive .env contents are never read.",
    ignoredDirectories: [...ignoredDirectories].sort(),
  },
  totals: {
    inventoriedFiles: inventory.length,
    textFilesRead: fileTexts.size,
    binaryFilesInventoried: inventory.filter((item) => item.analysisStatus === "inventoried-binary").length,
    excludedDirectoriesOrSensitiveFiles: excluded.length,
    dependencyNodes: graphNodes.length,
    dependencyEdges: graphEdges.length,
    unresolvedImports: unresolvedImports.length,
    frontendApiCalls: apiRows.length,
    mappedFrontendApiCalls: apiRows.filter((row) => row.mappingStatus === "mapped-exact-shape").length,
    backendAndBridgeEndpoints: allEndpoints.length,
    runtimeRegisteredEndpoints: allEndpoints.filter((endpoint) => endpoint.registrationStatus === "registered-runtime").length,
    stateAndQueryOccurrences: stateRows.length,
    permissionPageCodes: permissionRows.length,
  },
  countsByLayer: Object.fromEntries(Object.entries(layerCounts).map(([key, value]) => [key, value.length])),
  countsByKind: Object.fromEntries(Object.entries(kindCounts).map(([key, value]) => [key, value.length])),
  manifestSha256: manifestDigest,
  excluded,
  unresolvedImports,
  fileHashes: inventory.map(({ path: filePath, sha256: hash }) => ({ path: filePath, sha256: hash })),
};
fs.writeFileSync(path.join(outputRoot, "coverage-manifest.json"), JSON.stringify(coverage, null, 2), "utf8");

const htmlData = JSON.stringify({ nodes: [...aggregateNodes.values()], edges: [...aggregateEdges.values()] }).replaceAll("<", "\\u003c");
const graphHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pappa.ai dependency graph</title><style>
body{margin:0;font:14px system-ui;background:#0b1020;color:#e5e7eb}header{padding:16px 20px;border-bottom:1px solid #26304b;display:flex;gap:16px;align-items:center}input{width:320px;padding:9px 12px;border-radius:8px;border:1px solid #394668;background:#121a31;color:#fff}#stats{color:#9ca3af}svg{width:100vw;height:calc(100vh - 70px)}line{stroke:#334155;stroke-opacity:.45}circle{stroke:#fff;stroke-width:.5}.label{font-size:10px;fill:#cbd5e1;pointer-events:none}.dim{opacity:.08}.hit circle{stroke:#fbbf24;stroke-width:3}.hit .label{fill:#fbbf24;font-weight:700}
</style></head><body><header><strong>Pappa.ai aggregated dependency graph</strong><input id="search" placeholder="Filter module or package"><span id="stats"></span></header><svg id="graph"></svg><script>
const data=${htmlData};const svg=document.querySelector('#graph'),ns='http://www.w3.org/2000/svg';const w=innerWidth,h=innerHeight-70,cx=w/2,cy=h/2,r=Math.max(220,Math.min(w,h)*.38);const nodes=data.nodes.sort((a,b)=>a.id.localeCompare(b.id));const pos=new Map(nodes.map((n,i)=>[n.id,{x:cx+r*Math.cos(i/nodes.length*Math.PI*2),y:cy+r*Math.sin(i/nodes.length*Math.PI*2)}]));
for(const e of data.edges){const a=pos.get(e.source),b=pos.get(e.target);if(!a||!b)continue;const l=document.createElementNS(ns,'line');l.setAttribute('x1',a.x);l.setAttribute('y1',a.y);l.setAttribute('x2',b.x);l.setAttribute('y2',b.y);l.setAttribute('stroke-width',Math.min(5,Math.max(.4,Math.log2(e.count+1))));l.dataset.nodes=e.source+' '+e.target;svg.append(l)}
const colors={frontend:'#60a5fa',Backend:'#34d399',Bridge:'#f59e0b',workspace:'#a78bfa',scratch:'#f87171',npm:'#64748b',external:'#64748b'};for(const n of nodes){const p=pos.get(n.id),g=document.createElementNS(ns,'g');g.dataset.id=n.id;const c=document.createElementNS(ns,'circle');c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r',Math.min(18,5+Math.sqrt(n.count)));c.setAttribute('fill',colors[n.layer]||'#94a3b8');const t=document.createElementNS(ns,'text');t.setAttribute('x',p.x+10);t.setAttribute('y',p.y+4);t.setAttribute('class','label');t.textContent=n.id+' ('+n.count+')';g.append(c,t);svg.append(g)}
document.querySelector('#stats').textContent=nodes.length+' groups · '+data.edges.length+' cross-group edges';document.querySelector('#search').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('g[data-id]').forEach(g=>{const hit=!q||g.dataset.id.toLowerCase().includes(q);g.classList.toggle('dim',!!q&&!hit);g.classList.toggle('hit',!!q&&hit)});document.querySelectorAll('line').forEach(l=>l.classList.toggle('dim',!!q&&!l.dataset.nodes.toLowerCase().includes(q)))})
</script></body></html>`;
fs.writeFileSync(path.join(outputRoot, "dependency-graph.html"), graphHtml, "utf8");

console.log(JSON.stringify(coverage.totals, null, 2));
console.log(`manifestSha256=${manifestDigest}`);
