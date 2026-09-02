import fs from "node:fs";
import path from "node:path";

const repositoryRoot = path.resolve(process.cwd());
const sourceRoot = path.join(repositoryRoot, "src");
const violations = [];

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else if (entry.isFile()) output.push(absolute);
  }
  return output;
}

const sourceFiles = walk(sourceRoot);
const codeFiles = sourceFiles.filter((file) => /\.(?:ts|tsx)$/.test(file));
const cssFiles = sourceFiles.filter((file) => file.endsWith(".css"));
const relative = (file) => path.relative(repositoryRoot, file).replaceAll("\\", "/");

const allowedCssFiles = new Set(["src/tailwind.css", "src/tailwind.base.css"]);
for (const file of cssFiles) {
  const name = relative(file);
  if (!allowedCssFiles.has(name)) violations.push(`${name}: component styling must use Tailwind utilities; only the Tailwind entry and global design-system base are allowed`);
}

const tailwindEntry = fs.readFileSync(path.join(sourceRoot, "tailwind.css"), "utf8");
if (/tailwindcss\/preflight|@import\s+["']tailwindcss["']/.test(tailwindEntry)) {
  violations.push("src/tailwind.css: Tailwind Preflight must stay disabled because the application owns its typography and control baseline");
}

const globalBase = fs.readFileSync(path.join(sourceRoot, "tailwind.base.css"), "utf8");
if (/(?:^|\n)\s*\.[A-Za-z_-][^{]*\{/m.test(globalBase)) {
  violations.push("src/tailwind.base.css: component class selectors are not allowed; move component styling into Tailwind utilities");
}
if (!/@font-face[\s\S]*google-sans-flex-latin\.woff2/.test(globalBase)) {
  violations.push("src/tailwind.base.css: the locally bundled Google Sans Flex face is missing");
}
if (!/:focus-visible\s*\{[\s\S]*?outline:/.test(globalBase)) {
  violations.push("src/tailwind.base.css: the global keyboard focus outline is missing");
}
if (!/@media\s*\(prefers-reduced-motion:\s*reduce\)/.test(globalBase)) {
  violations.push("src/tailwind.base.css: reduced-motion handling is missing");
}

const allowedRootFiles = new Set(["src/main.tsx", "src/vite-env.d.ts"]);
for (const file of codeFiles) {
  const name = relative(file);
  const content = fs.readFileSync(file, "utf8");
  const atSourceRoot = path.dirname(name) === "src";
  if (atSourceRoot && !allowedRootFiles.has(name)) violations.push(`${name}: application code must belong to app, features, shared, data-access, or demo`);
  if (/\bfetch\s*\(/.test(content) && !name.startsWith("src/data-access/rest/")) violations.push(`${name}: direct fetch is only allowed in src/data-access/rest`);
  if (/import\.meta\.env\b/.test(content) && name !== "src/app/config/environment.ts") violations.push(`${name}: runtime environment access must go through app/config/environment`);
  if (/from\s+["'][^"']*demo\//.test(content) && !name.startsWith("src/demo/") && !name.startsWith("src/data-access/repositories/")) {
    violations.push(`${name}: demo packages may only be selected by data-access repository composition`);
  }
  if (name.includes("/pages/") && /from\s+["'][^"']*data-access\/rest/.test(content)) violations.push(`${name}: pages must not import REST transport details`);
  if (/from\s+["'][^"']*(?:\/(?:AppState|Auth|GuidedSetup|Theme)(?:["']|\/)|components\/UI|screens\/)/.test(content)) {
    violations.push(`${name}: imports a retired compatibility/root boundary`);
  }
}

for (const retiredDirectory of ["src/screens", "src/components"]) {
  const absolute = path.join(repositoryRoot, retiredDirectory);
  if (fs.existsSync(absolute) && walk(absolute, []).length) violations.push(`${retiredDirectory}: retired directory still contains files`);
}

const featureRoot = path.join(sourceRoot, "features");
for (const entry of fs.readdirSync(featureRoot, { withFileTypes: true })) {
  if (entry.isDirectory() && !fs.existsSync(path.join(featureRoot, entry.name, "index.ts"))) violations.push(`src/features/${entry.name}: missing public index.ts`);
}

const routeSource = fs.readFileSync(path.join(sourceRoot, "app", "router", "route-manifest.ts"), "utf8");
const routeRegistrationSource = fs.readFileSync(path.join(sourceRoot, "app", "router", "AppRoutes.tsx"), "utf8");
const routePaths = [...routeSource.matchAll(/path:\s*appPaths\.(\w+)/g)].map((match) => match[1]);
const duplicateRouteKeys = routePaths.filter((key, index) => routePaths.indexOf(key) !== index);
if (duplicateRouteKeys.length) violations.push(`src/app/router/route-manifest.ts: duplicate route entries ${[...new Set(duplicateRouteKeys)].join(", ")}`);
if (/<Route\s+path=["']/.test(routeRegistrationSource)) violations.push("src/app/router/AppRoutes.tsx: route paths must come from route-manifest.ts");

if (violations.length) {
  console.error("Architecture check failed:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Architecture check passed (${codeFiles.length} TypeScript files, ${routePaths.length} registered route definitions).`);
}
