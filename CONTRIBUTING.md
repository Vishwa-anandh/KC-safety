# Contributing to KC Safety

## Setup

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run dev -- --host 127.0.0.1
```

The local application is available at `http://127.0.0.1:4173/`.

## Required checks

Before handing off a change, run:

```powershell
npm.cmd run verify
```

Review [`rule.md`](rule.md), [`docs/architecture.md`](docs/architecture.md), and relevant ADRs before adding a new feature, route, state store, API adapter, integration, or persistence mechanism.

## Feature workflow

1. Add the page, model hook, components, schema, and types under the owning `src/features/<feature>` folder.
2. Expose only required public symbols from the feature `index.ts`.
3. Add or update repository contracts before implementing REST adapters.
4. Register paths and access metadata in the route manifest.
5. Add denied-role, failure, empty, and success verification.
6. Keep product changes separate from architectural moves so UI parity can be reviewed clearly.

Do not import demo fixtures, call `fetch`, read runtime environment variables, or access REST DTOs from pages/components.
