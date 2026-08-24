# Master Requirement questions & per-question evidence — design

Status: Approved for implementation planning
Date: 2026-08-24

## Problem

The **Master Requirements** admin module (`/admin/requirements`) only manages
governed catalog metadata for a requirement: ID, title, section, version,
status, and site scoping. It has no way to define, edit, or remove the
individual **assessment questions** a site contributor actually answers.

Those live questions come from an entirely separate, disconnected dataset
(`Requirement.questions`, sourced from demo fixtures) with no link back to
what an administrator edits. There is also no way to record what evidence is
expected to support an individual question — only one flat "expected
evidence" list per requirement exists today, shown read-only in the
assessment sidebar.

## Goal

From the Master Requirements admin screen, for any existing requirement, an
administrator must be able to:

1. **Add** a new assessment question.
2. **Edit** an existing question's text and its required evidence.
3. **Delete** an existing question.

Master Requirements becomes the source of truth for question definitions:
these changes must propagate into what a site contributor actually sees and
answers in their live self-assessment (not just the admin's own catalog
view). Each question's required evidence is shown to the assessing user
directly under that question — this is a new, question-level list distinct
from the requirement-level "Expected evidence" panel, which is unchanged.

## Current data flow (context)

Both the admin catalog and the live assessment content are held in one
in-memory store, `ApplicationDataProvider` (`src/app/providers/ApplicationDataProvider.tsx`),
seeded from demo fixtures (`src/demo/fixtures/assessment.ts`) and persisted to
`localStorage`:

- `state.masterRequirements: MasterRequirement[]` — edited today via
  `AdminRequirementsScreen` / `RequirementDialog` in
  `src/features/admin/pages/AdminScreens.tsx`. Exposed via `useAdministration()`.
- `state.requirements: Requirement[]` — the live, answerable content.
  Exposed via `useSites()` (site contributor) and `useDashboard()` (enterprise
  viewer / admin read-only drill-downs). Rendered and answered in
  `src/features/assessment/pages/RequirementWorkspace.tsx`, and shown
  read-only in `src/features/dashboard/pages/DashboardScreens.tsx`.

These two collections are joined only loosely today, by value:
`masterRequirement.id === requirement.number` (for example, both are
`"OS 2.1.3"`). Nothing currently keeps them in sync — this spec adds that
sync, one-directional (master → live), scoped to question add/edit/delete.

Not every `Requirement` has a matching `MasterRequirement` in the current
seed data, and not every `MasterRequirement` has a matching `Requirement`
(e.g. one freshly created via "Add requirement", which today only writes
catalog metadata with no section/hierarchy content). This spec only handles
the case where a match exists — see **Out of scope**.

## Data model changes

`src/shared/types.ts`:

```ts
export interface MasterQuestion {
  id: string;
  number: string;
  text: string;
  expectedEvidence: string[];
}

export interface MasterRequirement {
  id: string;
  title: string;
  section: string;
  version: string;
  status: "Published" | "Draft";
  siteIds: string[];
  importBatchId?: string;
  questions: MasterQuestion[]; // NEW
}

export interface AssessmentQuestion {
  id: string;
  number: string;
  text: string;
  response: ResponseValue;
  period: AssessmentPeriod;
  action?: ActionItem;
  expectedEvidence?: string[]; // NEW — optional, see rationale below
}
```

`MasterQuestion` and `AssessmentQuestion` share the same shape for
`id`/`number`/`text`/`expectedEvidence` by design — the sync logic below
copies these fields directly between them. `MasterQuestion.expectedEvidence`
is required (it's a brand-new type with no legacy data). On
`AssessmentQuestion` it must be **optional**: `src/demo/fixtures/performance-standards.ts`
is included in the TypeScript build (`tsconfig.app.json` includes all of
`src`) even though nothing in `src` imports it, and it contains 475
`AssessmentQuestion`-shaped literals. A required field would force editing
all 475 for no behavioral benefit. Every read site must treat a missing
value as empty, never assume it's present.

**Fixture updates:** `src/demo/fixtures/assessment.ts` needs every seeded
`masterRequirements` entry to gain a `questions` array whose `id`s match its
paired `Requirement.questions[].id` (e.g. `"planning-q-1"`,
`"planning-q-2"`) 1:1, each carrying a plausible `expectedEvidence` list. The
corresponding seeded `AssessmentQuestion` for each of those needs a matching
`expectedEvidence` array added, so the demo data is internally consistent
from first load rather than only after an admin's first edit. Questions with
no paired `MasterRequirement` in the current seed data are left without the
field (it's optional — see above).

## Sync (reconciliation) logic

Lives in `ApplicationDataProvider.updateMasterRequirement`
(`src/app/providers/ApplicationDataProvider.tsx`), which currently only
replaces the record in `masterRequirements`. Extend it to also reconcile
`state.requirements`:

```
find liveRequirement where liveRequirement.number === updated.id
if not found: no-op on `requirements` (see Out of scope)

for each masterQuestion in updated.questions:
  existing = liveRequirement.questions.find(q => q.id === masterQuestion.id)
  if existing: replace existing.text and existing.expectedEvidence in place
               (leave response / action / period untouched)
  else:        append a new AssessmentQuestion —
               { id, number, text, expectedEvidence,
                 response: null, period: currentAssessmentPeriod }

liveRequirement.questions = liveRequirement.questions.filter(q =>
  updated.questions.some(mq => mq.id === q.id))   // deletions
```

This is a hard delete: removing a question from the master list removes it
— and any response/corrective-action already recorded against it — from the
live requirement too. This was called out and accepted during design
(master is the single source of truth for what questions exist).

`addMasterRequirement` (new-requirement creation) is unaffected — new
requirements are created with `questions: []` and no reconciliation runs
(there is no live `Requirement` to reconcile into; see **Out of scope**).

## Admin UI — `RequirementDialog` (`src/features/admin/pages/AdminScreens.tsx`)

Add an **"Assessment questions"** section to the dialog, rendered only when
editing an existing requirement (`item` is defined — not the "Add
requirement" / `item === undefined` path):

- One row per question: a textarea for question text, a textarea for
  expected evidence (one item per line, split/joined on save), and an
  icon-button to delete the row.
- An **"Add question"** button appends a blank row. New question `number` is
  the next sequential integer as a string (`String(questions.length + 1)`
  at add-time is sufficient — this is a display ordinal, not a stable key);
  `id` is generated as `` `${draft.id}-q-${Date.now().toString(36)}` `` to
  guarantee uniqueness without a counter.
- Validation on save: every question must have non-empty text (mirrors the
  existing `submitted`/`field--invalid` pattern used elsewhere in this
  dialog). Empty `expectedEvidence` is valid — not all questions need it.
- Deleting a row removes it from the draft immediately (no separate confirm
  step — this mirrors the low-friction pattern already used for evidence
  items in `RequirementWorkspace.tsx`'s `EvidencePanel`, and the change is
  not committed until the dialog's own "Save changes" is pressed).

No changes to the "Add requirement" flow's fields.

## Assessment-side display

A new **"Evidence required"** list renders under the question text —
rendered only when `question.expectedEvidence` is non-empty (it's optional,
so a missing value counts as none) — in:

- `src/features/assessment/pages/RequirementWorkspace.tsx` — the
  contributor's editable question card.
- `src/features/dashboard/pages/DashboardScreens.tsx` — the read-only
  section-detail question card (admin / enterprise-viewer drill-down).

The existing per-requirement "Expected evidence" list in `GuidancePanel`
(`RequirementWorkspace.tsx`) is unchanged — this is an additional,
question-level layer, not a replacement.

## Out of scope

- Creating a brand-new requirement's questions at creation time. "Add
  requirement" continues to only capture catalog metadata; an admin adds its
  questions afterward by re-opening it for edit — at which point a matching
  live `Requirement` is assumed to already exist. Wiring a brand-new
  requirement into live site content (section/hierarchy scaffolding) is a
  separate, larger feature.
- Reordering questions.
- Soft-delete / archive of removed questions (a hard delete was accepted;
  revisit if losing recorded answers on delete turns out to be a problem in
  practice).
- Any change to the requirement-level `expectedEvidence` field or its
  `GuidancePanel` display.

## Testing

- Unit-level: the reconciliation function in `ApplicationDataProvider` —
  add, edit (in place, preserving response/action), and delete cases,
  including the case where no matching live `Requirement` exists (no-op).
- Manual/E2E smoke: edit a published requirement in Master Requirements —
  add a question, confirm it appears unanswered in the site contributor's
  assessment with its evidence list; edit an existing question's text and
  evidence, confirm the site contributor's copy updates while its recorded
  response is untouched; delete a question, confirm it disappears from the
  live assessment.
