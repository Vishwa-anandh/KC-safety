# Master Requirement Questions & Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an administrator add, edit, and delete assessment questions (with per-question required evidence) from the Master Requirements admin screen, with changes reflected live in the site contributor's actual self-assessment.

**Architecture:** `MasterRequirement` gains an editable `questions` list. Saving a requirement in the admin dialog reconciles that list into the matching live `Requirement.questions` (matched by `masterRequirement.id === requirement.number`) inside the single shared in-memory store (`ApplicationDataProvider`) — updating text/evidence on kept questions, appending new ones as unanswered, and removing deleted ones (along with any response already recorded against them). Each live question then displays its own "Evidence required" list wherever it's rendered.

**Tech Stack:** React 19 + TypeScript (strict), Vite, plain CSS (custom properties, no framework). No test runner exists in this repo (no vitest/jest, no `test` script) — verification for every task is `npm run typecheck` / `npm run lint` (fast feedback) plus a manual smoke check in the running dev server (`npm run dev`), matching how every other change in this codebase has been verified. `npm run verify` (lint + typecheck + check:architecture + build) is the final gate.

**Spec:** [docs/superpowers/specs/2026-08-24-master-requirement-questions-design.md](../specs/2026-08-24-master-requirement-questions-design.md)

## Global Constraints

- No delete-confirmation step on removing a question in the admin editor (matches the low-friction pattern already used for evidence items in `RequirementWorkspace.tsx`) — nothing commits until the dialog's own "Save changes" button is pressed.
- Deleting a question is a hard delete: it removes the question, and any response/action already recorded against it, from the live requirement.
- The question editor only appears when editing an **existing** requirement (`item` is defined in `RequirementDialog`) — "Add requirement" (brand-new records) is unaffected.
- `MasterQuestion.expectedEvidence` is required (`string[]`); `AssessmentQuestion.expectedEvidence` is **optional** (`string[] | undefined`) — see Task 1 rationale. Every read site must treat a missing value as empty, never assume it's present.
- Reuse existing CSS custom properties (`var(--neutral-*)`, `var(--kc-*)`, `var(--surface-*)`, `var(--danger*)`) for all new styles — they're already theme-aware (light/dark) in this codebase; never hardcode a color.

---

## File Structure

- `src/shared/types.ts` — add `MasterQuestion`; extend `MasterRequirement` and `AssessmentQuestion`.
- `src/demo/fixtures/assessment.ts` — seed `questions` on the 5 existing `masterRequirements` records; seed `expectedEvidence` on their matching live questions.
- `src/app/providers/ApplicationDataProvider.tsx` — the one shared store. `submitImportBatch`'s mock-created records get `questions: []` (Task 1, keeps the build green). `updateMasterRequirement` gains the reconciliation logic (Task 2).
- `src/features/admin/pages/AdminScreens.tsx` — new `QuestionsEditor` sub-component; wired into `RequirementDialog`.
- `src/features/assessment/pages/RequirementWorkspace.tsx` — renders per-question evidence list in the site contributor's editable question card.
- `src/features/dashboard/pages/DashboardScreens.tsx` — renders the same list in the read-only section-detail question card (admin/enterprise-viewer drill-down).
- `src/styles.css` — `.question-evidence*` (evidence display, shared by Tasks 3 & 4) and `.question-editor-*` (admin editor, Task 2).

---

### Task 1: Data model and seed fixtures

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/demo/fixtures/assessment.ts`
- Modify: `src/app/providers/ApplicationDataProvider.tsx` (one-line fix only — see below)
- Modify: `src/features/admin/pages/AdminScreens.tsx` (one-line fix only — see below)

**Interfaces:**
- Produces: `MasterQuestion { id: string; number: string; text: string; expectedEvidence: string[] }`, `MasterRequirement.questions: MasterQuestion[]`, `AssessmentQuestion.expectedEvidence?: string[]`. Every later task reads/writes these exact names.

This task only changes types and seed data — no new behavior yet. It exists so the codebase compiles cleanly under the new shape before Task 2 adds the logic that uses it.

**Why `expectedEvidence` is optional on `AssessmentQuestion` but required on `MasterQuestion`:** `src/demo/fixtures/performance-standards.ts` (an unused-but-still-typechecked fixture file — nothing in `src` imports it, but `tsconfig.app.json` includes all of `src`) contains 475 `AssessmentQuestion`-shaped object literals. Making the field required there would force editing all 475 for zero behavioral benefit. `MasterQuestion` has no such legacy data — it's a brand-new type — so it can safely be required.

- [ ] **Step 1: Add `MasterQuestion` and extend `MasterRequirement`**

In `src/shared/types.ts`, replace:

```ts
export interface MasterRequirement {
  id: string;
  title: string;
  section: string;
  version: string;
  status: "Published" | "Draft";
  siteIds: string[];
  importBatchId?: string;
}
```

with:

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
  questions: MasterQuestion[];
}
```

- [ ] **Step 2: Add `expectedEvidence` to `AssessmentQuestion`**

In `src/shared/types.ts`, replace:

```ts
export interface AssessmentQuestion {
  id: string;
  number: string;
  text: string;
  response: ResponseValue;
  period: AssessmentPeriod;
  action?: ActionItem;
}
```

with:

```ts
export interface AssessmentQuestion {
  id: string;
  number: string;
  text: string;
  response: ResponseValue;
  period: AssessmentPeriod;
  action?: ActionItem;
  expectedEvidence?: string[];
}
```

- [ ] **Step 3: Run typecheck to see every place that now needs updating**

Run: `npm run typecheck`
Expected: FAIL — errors on `src/demo/fixtures/assessment.ts` (masterRequirements literals missing `questions`), `src/app/providers/ApplicationDataProvider.tsx` (`submitImportBatch`'s `createdRows` literal missing `questions`), and `src/features/admin/pages/AdminScreens.tsx` (`RequirementDialog`'s default draft literal missing `questions`).

- [ ] **Step 4: Seed `questions` on the 5 existing `masterRequirements` records**

In `src/demo/fixtures/assessment.ts`, replace:

```ts
export const masterRequirements: MasterRequirement[] = [
  { id: "OS 1.2.1", title: "Leadership commitment and accountability", section: "Leadership & Engagement", version: "v4", status: "Published", siteIds: [] },
  { id: "OS 2.1.3", title: "Risks, opportunities, and planning controls", section: "Planning", version: "v4", status: "Published", siteIds: [] },
  { id: "OS 4.3.2", title: "Management of operational change", section: "Operation", version: "v3", status: "Published", siteIds: [] },
  { id: "PS 7.2.1", title: "Machine safeguarding verification", section: "Machine Safety", version: "v2", status: "Draft", siteIds: [] },
  { id: "OH 3.1.4", title: "Occupational exposure assessment", section: "Occupational Health", version: "v2", status: "Published", siteIds: [] },
];
```

with:

```ts
export const masterRequirements: MasterRequirement[] = [
  {
    id: "OS 1.2.1", title: "Leadership commitment and accountability", section: "Leadership & Engagement", version: "v4", status: "Published", siteIds: [],
    questions: [
      { id: "q-1", number: "1", text: "Are site leadership EHS&S responsibilities documented and communicated to the people who hold them?", expectedEvidence: ["Current leadership accountability matrix.", "Communication records to newly appointed leaders."] },
      { id: "q-2", number: "2", text: "Are EHS&S objectives and results reviewed as part of the site's normal business operating rhythm?", expectedEvidence: ["Recent business operating review agenda.", "EHS&S objectives tracking sheet."] },
      { id: "q-3", number: "3", text: "Do leadership reviews consistently record decisions, action owners, and follow-up completion?", expectedEvidence: ["Leadership review meeting minutes.", "Action log with owners and due dates."] },
    ],
  },
  {
    id: "OS 2.1.3", title: "Risks, opportunities, and planning controls", section: "Planning", version: "v4", status: "Published", siteIds: [],
    questions: [
      { id: "planning-q-1", number: "1", text: "Is the site risk and opportunity register current and approved?", expectedEvidence: ["Current risk and opportunity register.", "Approval sign-off record."] },
      { id: "planning-q-2", number: "2", text: "Are measurable EHS&S objectives connected to the highest-priority risks?", expectedEvidence: ["Approved EHS&S objectives.", "Risk-to-objective traceability record."] },
    ],
  },
  {
    id: "OS 4.3.2", title: "Management of operational change", section: "Operation", version: "v3", status: "Published", siteIds: [],
    questions: [
      { id: "operation-q-1", number: "1", text: "Are operational changes reviewed for EHS&S risk before implementation?", expectedEvidence: ["Change request form.", "Pre-implementation risk review record."] },
      { id: "operation-q-2", number: "2", text: "Are temporary changes tracked through closure or permanent approval?", expectedEvidence: ["Temporary change tracking log.", "Closure or permanent approval record."] },
    ],
  },
  {
    id: "PS 7.2.1", title: "Machine safeguarding verification", section: "Machine Safety", version: "v2", status: "Draft", siteIds: [],
    questions: [
      { id: "machine-q-1", number: "1", text: "Are safeguarding assessments current for machines in scope?", expectedEvidence: ["Machine safeguarding assessment.", "Machine inventory list."] },
      { id: "machine-q-2", number: "2", text: "Are safeguard inspections recorded at the required frequency?", expectedEvidence: ["Guard inspection log.", "Inspection frequency schedule."] },
    ],
  },
  {
    id: "OH 3.1.4", title: "Occupational exposure assessment", section: "Occupational Health", version: "v2", status: "Published", siteIds: [],
    questions: [
      { id: "occupational-q-1", number: "1", text: "Is the occupational exposure inventory current?", expectedEvidence: ["Current exposure inventory.", "Similar exposure group list."] },
      { id: "occupational-q-2", number: "2", text: "Are exposure assessments current for all priority similar exposure groups?", expectedEvidence: ["Sampling reports.", "Exposure assessment schedule."] },
    ],
  },
];
```

- [ ] **Step 5: Seed matching `expectedEvidence` on the live questions**

Still in `src/demo/fixtures/assessment.ts`. These are the same questions as Step 4, now on the `Requirement` side (`initialRequirement` and the `requirements` array) — same wording, same evidence.

Replace (inside `initialRequirement`, defined before the `requirements` array):

```ts
  questions: [
    {
      id: "q-1",
      number: "1",
      text: "Are site leadership EHS&S responsibilities documented and communicated to the people who hold them?",
      response: "partial",
      period: currentAssessmentPeriod,
      action: {
        description: "Refresh the leadership accountability matrix and brief all newly appointed operations leaders.",
        owner: "Maya Patel",
      },
    },
    {
      id: "q-2",
      number: "2",
      text: "Are EHS&S objectives and results reviewed as part of the site's normal business operating rhythm?",
      response: "yes",
      period: currentAssessmentPeriod,
    },
    {
      id: "q-3",
      number: "3",
      text: "Do leadership reviews consistently record decisions, action owners, and follow-up completion?",
      response: "no",
      period: currentAssessmentPeriod,
      action: {
        description: "Introduce a standard action log for monthly leadership reviews and review overdue items at each meeting.",
        owner: "Daniel Brooks",
      },
    },
  ],
```

with:

```ts
  questions: [
    {
      id: "q-1",
      number: "1",
      text: "Are site leadership EHS&S responsibilities documented and communicated to the people who hold them?",
      response: "partial",
      period: currentAssessmentPeriod,
      expectedEvidence: ["Current leadership accountability matrix.", "Communication records to newly appointed leaders."],
      action: {
        description: "Refresh the leadership accountability matrix and brief all newly appointed operations leaders.",
        owner: "Maya Patel",
      },
    },
    {
      id: "q-2",
      number: "2",
      text: "Are EHS&S objectives and results reviewed as part of the site's normal business operating rhythm?",
      response: "yes",
      period: currentAssessmentPeriod,
      expectedEvidence: ["Recent business operating review agenda.", "EHS&S objectives tracking sheet."],
    },
    {
      id: "q-3",
      number: "3",
      text: "Do leadership reviews consistently record decisions, action owners, and follow-up completion?",
      response: "no",
      period: currentAssessmentPeriod,
      expectedEvidence: ["Leadership review meeting minutes.", "Action log with owners and due dates."],
      action: {
        description: "Introduce a standard action log for monthly leadership reviews and review overdue items at each meeting.",
        owner: "Daniel Brooks",
      },
    },
  ],
```

Replace (inside the `requirements` array, `planning-risks-opportunities`):

```ts
    questions: [
      { id: "planning-q-1", number: "1", text: "Is the site risk and opportunity register current and approved?", response: "partial", period: currentAssessmentPeriod, action: { description: "Complete the quarterly risk review and publish the approved register.", owner: "" } },
      { id: "planning-q-2", number: "2", text: "Are measurable EHS&S objectives connected to the highest-priority risks?", response: "yes", period: currentAssessmentPeriod },
    ],
```

with:

```ts
    questions: [
      { id: "planning-q-1", number: "1", text: "Is the site risk and opportunity register current and approved?", response: "partial", period: currentAssessmentPeriod, expectedEvidence: ["Current risk and opportunity register.", "Approval sign-off record."], action: { description: "Complete the quarterly risk review and publish the approved register.", owner: "" } },
      { id: "planning-q-2", number: "2", text: "Are measurable EHS&S objectives connected to the highest-priority risks?", response: "yes", period: currentAssessmentPeriod, expectedEvidence: ["Approved EHS&S objectives.", "Risk-to-objective traceability record."] },
    ],
```

Replace (`operation-change`):

```ts
    questions: [
      { id: "operation-q-1", number: "1", text: "Are operational changes reviewed for EHS&S risk before implementation?", response: "no", period: currentAssessmentPeriod, action: { description: "", owner: "" } },
      { id: "operation-q-2", number: "2", text: "Are temporary changes tracked through closure or permanent approval?", response: null, period: currentAssessmentPeriod },
    ],
```

with:

```ts
    questions: [
      { id: "operation-q-1", number: "1", text: "Are operational changes reviewed for EHS&S risk before implementation?", response: "no", period: currentAssessmentPeriod, expectedEvidence: ["Change request form.", "Pre-implementation risk review record."], action: { description: "", owner: "" } },
      { id: "operation-q-2", number: "2", text: "Are temporary changes tracked through closure or permanent approval?", response: null, period: currentAssessmentPeriod, expectedEvidence: ["Temporary change tracking log.", "Closure or permanent approval record."] },
    ],
```

Replace (`machine-safeguarding`):

```ts
    questions: [
      { id: "machine-q-1", number: "1", text: "Are safeguarding assessments current for machines in scope?", response: "no", period: currentAssessmentPeriod, action: { description: "Complete overdue safeguarding assessments for Line 4.", owner: "Elena Garcia" } },
      { id: "machine-q-2", number: "2", text: "Are safeguard inspections recorded at the required frequency?", response: "yes", period: currentAssessmentPeriod },
    ],
```

with:

```ts
    questions: [
      { id: "machine-q-1", number: "1", text: "Are safeguarding assessments current for machines in scope?", response: "no", period: currentAssessmentPeriod, expectedEvidence: ["Machine safeguarding assessment.", "Machine inventory list."], action: { description: "Complete overdue safeguarding assessments for Line 4.", owner: "Elena Garcia" } },
      { id: "machine-q-2", number: "2", text: "Are safeguard inspections recorded at the required frequency?", response: "yes", period: currentAssessmentPeriod, expectedEvidence: ["Guard inspection log.", "Inspection frequency schedule."] },
    ],
```

Replace (`occupational-exposure`):

```ts
    questions: [
      { id: "occupational-q-1", number: "1", text: "Is the occupational exposure inventory current?", response: "yes", period: currentAssessmentPeriod },
      { id: "occupational-q-2", number: "2", text: "Are exposure assessments current for all priority similar exposure groups?", response: null, period: currentAssessmentPeriod },
    ],
```

with:

```ts
    questions: [
      { id: "occupational-q-1", number: "1", text: "Is the occupational exposure inventory current?", response: "yes", period: currentAssessmentPeriod, expectedEvidence: ["Current exposure inventory.", "Similar exposure group list."] },
      { id: "occupational-q-2", number: "2", text: "Are exposure assessments current for all priority similar exposure groups?", response: null, period: currentAssessmentPeriod, expectedEvidence: ["Sampling reports.", "Exposure assessment schedule."] },
    ],
```

- [ ] **Step 6: Fix `submitImportBatch`'s mock-created records**

In `src/app/providers/ApplicationDataProvider.tsx`, replace:

```ts
    const createdRows: MasterRequirement[] = Array.from({ length: 4 }, (_, index) => ({
      id: `OS ${5 + index}.1.${index + 1}`,
      title: `Imported requirement ${index + 1} from ${fileName}`,
      section: sectionPool[index % sectionPool.length],
      version: "v1",
      status: "Draft",
      siteIds,
      importBatchId: batchId,
    }));
```

with:

```ts
    const createdRows: MasterRequirement[] = Array.from({ length: 4 }, (_, index) => ({
      id: `OS ${5 + index}.1.${index + 1}`,
      title: `Imported requirement ${index + 1} from ${fileName}`,
      section: sectionPool[index % sectionPool.length],
      version: "v1",
      status: "Draft",
      siteIds,
      importBatchId: batchId,
      questions: [],
    }));
```

- [ ] **Step 7: Fix `RequirementDialog`'s default draft state**

In `src/features/admin/pages/AdminScreens.tsx`, replace:

```ts
  const [draft, setDraft] = useState<MasterRequirement>(item ?? { id: "", title: "", section: sections[0] ?? "", version: "v1", status: "Draft", siteIds: [] });
```

with:

```ts
  const [draft, setDraft] = useState<MasterRequirement>(item ?? { id: "", title: "", section: sections[0] ?? "", version: "v1", status: "Draft", siteIds: [], questions: [] });
```

- [ ] **Step 8: Run typecheck and lint to confirm the build is green**

Run: `npm run typecheck`
Expected: PASS, no errors.

Run: `npm run lint`
Expected: PASS, no errors.

- [ ] **Step 9: Commit**

```bash
git add src/shared/types.ts src/demo/fixtures/assessment.ts src/app/providers/ApplicationDataProvider.tsx src/features/admin/pages/AdminScreens.tsx
git commit -m "feat: add MasterQuestion type and seed question/evidence fixture data"
```

---

### Task 2: Admin question editor + live-sync reconciliation

**Files:**
- Modify: `src/features/admin/pages/AdminScreens.tsx`
- Modify: `src/app/providers/ApplicationDataProvider.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `MasterQuestion`, `MasterRequirement.questions` (Task 1).
- Produces: `QuestionsEditor` component (local to `AdminScreens.tsx`, not exported — no other file needs it). The reconciliation behavior inside `updateMasterRequirement` is the contract every later task's manual verification relies on: saving a requirement with edited `questions` updates `state.requirements` for the matching live requirement (`requirement.number === masterRequirement.id`).

- [ ] **Step 1: Add the reconciliation logic to `updateMasterRequirement`**

In `src/app/providers/ApplicationDataProvider.tsx`, add `AssessmentQuestion` to the type import list — replace:

```ts
import type {
  ActionItem,
  AppNotification,
  AssessmentPeriod,
  DashboardSite,
  EvidenceItem,
  MasterRequirement,
  OwnerRecord,
  ResponseValue,
  SectionSummary,
  SiteContacts,
  SiteUser,
  SiteUserRole,
} from "../../shared/types";
```

with:

```ts
import type {
  ActionItem,
  AppNotification,
  AssessmentPeriod,
  AssessmentQuestion,
  DashboardSite,
  EvidenceItem,
  MasterRequirement,
  OwnerRecord,
  ResponseValue,
  SectionSummary,
  SiteContacts,
  SiteUser,
  SiteUserRole,
} from "../../shared/types";
```

Then replace:

```ts
  function updateMasterRequirement(requirement: MasterRequirement) {
    touch((current) => ({
      ...current,
      masterRequirements: current.masterRequirements.map((record) => record.id === requirement.id ? requirement : record),
    }));
  }
```

with:

```ts
  // Master Requirements is the source of truth for question definitions: saving a requirement
  // here also reconciles its questions into the matching live `Requirement` (joined by
  // `requirement.number === masterRequirement.id`) — updating kept questions' text/evidence in
  // place (response/action/period are the contributor's own data and are never touched), adding
  // new ones as unanswered, and hard-deleting ones removed from the master list.
  function updateMasterRequirement(requirement: MasterRequirement) {
    touch((current) => ({
      ...current,
      masterRequirements: current.masterRequirements.map((record) => record.id === requirement.id ? requirement : record),
      requirements: current.requirements.map((liveRequirement) => {
        if (liveRequirement.number !== requirement.id) return liveRequirement;
        const keptQuestions = liveRequirement.questions
          .filter((question) => requirement.questions.some((masterQuestion) => masterQuestion.id === question.id))
          .map((question) => {
            const masterQuestion = requirement.questions.find((item) => item.id === question.id)!;
            return { ...question, number: masterQuestion.number, text: masterQuestion.text, expectedEvidence: masterQuestion.expectedEvidence };
          });
        const addedQuestions: AssessmentQuestion[] = requirement.questions
          .filter((masterQuestion) => !liveRequirement.questions.some((question) => question.id === masterQuestion.id))
          .map((masterQuestion) => ({
            id: masterQuestion.id,
            number: masterQuestion.number,
            text: masterQuestion.text,
            expectedEvidence: masterQuestion.expectedEvidence,
            response: null,
            period: currentAssessmentPeriod,
          }));
        return { ...liveRequirement, questions: [...keptQuestions, ...addedQuestions] };
      }),
    }));
  }
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (`currentAssessmentPeriod` is already imported at the top of this file from `../../shared/domain/assessment`).

- [ ] **Step 3: Add the `QuestionsEditor` component**

In `src/features/admin/pages/AdminScreens.tsx`, add `MasterQuestion` to the type import — replace:

```ts
import type { DashboardSite, MasterRequirement, SiteUser, SiteUserRole } from "../../../shared/types";
```

with:

```ts
import type { DashboardSite, MasterQuestion, MasterRequirement, SiteUser, SiteUserRole } from "../../../shared/types";
```

Then, directly above `function RequirementDialog(`, add:

```tsx
function QuestionsEditor({ questions, onChange, requirementId, submitted }: { questions: MasterQuestion[]; onChange: (questions: MasterQuestion[]) => void; requirementId: string; submitted: boolean }) {
  function updateQuestion(id: string, patch: Partial<MasterQuestion>) {
    onChange(questions.map((question) => question.id === id ? { ...question, ...patch } : question));
  }
  function removeQuestion(id: string) {
    onChange(questions.filter((question) => question.id !== id));
  }
  function addQuestion() {
    const id = `${requirementId}-q-${Date.now().toString(36)}`;
    onChange([...questions, { id, number: String(questions.length + 1), text: "", expectedEvidence: [] }]);
  }
  return (
    <div className="question-editor-list">
      {!questions.length && <p className="question-editor-empty">No assessment questions yet. Add the first one below.</p>}
      {questions.map((question, index) => {
        const invalid = submitted && !question.text.trim();
        return (
          <div className={cx("question-editor-row", invalid && "question-editor-row--invalid")} key={question.id}>
            <div className="question-editor-row__header">
              <span className="question-number">{index + 1}</span>
              <IconButton label={`Delete question ${index + 1}`} onClick={() => removeQuestion(question.id)}><Trash2 size={17} /></IconButton>
            </div>
            <label className="field">
              <span>Question text <b>Required</b></span>
              <textarea rows={2} value={question.text} onChange={(event) => updateQuestion(question.id, { text: event.target.value })} placeholder="For example, Is the site risk register current and approved?" />
              {invalid && <small className="field-error">Enter the question text.</small>}
            </label>
            <label className="field">
              <span>Evidence required <small>One item per line</small></span>
              <textarea rows={2} value={question.expectedEvidence.join("\n")} onChange={(event) => updateQuestion(question.id, { expectedEvidence: event.target.value.split("\n") })} placeholder="For example, Current risk register" />
            </label>
          </div>
        );
      })}
      <Button variant="secondary" icon={<Plus size={17} />} onClick={addQuestion}>Add question</Button>
    </div>
  );
}
```

- [ ] **Step 4: Wire `QuestionsEditor` into `RequirementDialog`**

In the same file, replace the whole `RequirementDialog` function:

```tsx
function RequirementDialog({ item, sections, siteOptions, onClose, onSave }: { item?: MasterRequirement; sections: string[]; siteOptions: ReturnType<typeof buildSiteOptions>; onClose: () => void; onSave: (item: MasterRequirement) => void }) {
  const [draft, setDraft] = useState<MasterRequirement>(item ?? { id: "", title: "", section: sections[0] ?? "", version: "v1", status: "Draft", siteIds: [], questions: [] });
  const [submitted, setSubmitted] = useState(false);
  const valid = Boolean(draft.id.trim() && draft.title.trim() && draft.section.trim() && /^v\d+$/i.test(draft.version.trim()));
  const update = (key: keyof MasterRequirement, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const sectionOptions = sections.map((value) => ({ value, label: value }));
  return <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Close requirement editor" onClick={onClose} /><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="master-dialog-title">
    <div className="dialog__header"><div><p className="eyebrow">Governed content</p><h2 id="master-dialog-title">{item ? `Edit ${item.id}` : "Add requirement"}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <div className="dialog-form form-grid">
      <label className={cx("field", submitted && !draft.id.trim() && "field--invalid")}><span>Requirement ID <b>Required</b></span><input value={draft.id} disabled={Boolean(item)} onChange={(event) => update("id", event.target.value)} placeholder="For example, OS 2.4.1" />{submitted && !draft.id.trim() && <small className="field-error">Enter a unique requirement ID.</small>}</label>
      <label className={cx("field", submitted && !/^v\d+$/i.test(draft.version.trim()) && "field--invalid")}><span>Version <b>Required</b></span><input value={draft.version} onChange={(event) => update("version", event.target.value)} placeholder="v1" />{submitted && !/^v\d+$/i.test(draft.version.trim()) && <small className="field-error">Use a version such as v1 or v12.</small>}</label>
      <label className={cx("field", "field--wide", submitted && !draft.title.trim() && "field--invalid")}><span>Requirement title <b>Required</b></span><textarea rows={3} value={draft.title} onChange={(event) => update("title", event.target.value)} />{submitted && !draft.title.trim() && <small className="field-error">Enter the requirement title.</small>}</label>
      <label className={cx("field", submitted && !draft.section.trim() && "field--invalid")}>
        <span>Section <b>Required</b></span>
        <Select label="Section" value={draft.section} onChange={(value) => update("section", value)} options={sectionOptions} />
        {submitted && !draft.section.trim() && <small className="field-error">Choose the governed section.</small>}
      </label>
      <label className="field">
        <span>Status</span>
        <Select label="Status" value={draft.status} onChange={(value) => update("status", value)} options={[{ value: "Draft", label: "Draft" }, { value: "Published", label: "Published" }]} />
      </label>
      <label className="field field--wide">
        <span>Sites <small>Leave empty to apply to all sites</small></span>
        <CheckboxList label="Sites" searchable options={siteOptions} selected={draft.siteIds} onChange={(values) => setDraft((current) => ({ ...current, siteIds: values }))} />
      </label>
    </div>
    <div className="dialog__footer"><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Check size={17} />} onClick={() => { setSubmitted(true); if (valid) onSave({ ...draft, id: draft.id.trim(), title: draft.title.trim(), section: draft.section.trim(), version: draft.version.trim() }); }}>{item ? "Save changes" : "Add requirement"}</Button></div>
  </section></div>;
}
```

with:

```tsx
function RequirementDialog({ item, sections, siteOptions, onClose, onSave }: { item?: MasterRequirement; sections: string[]; siteOptions: ReturnType<typeof buildSiteOptions>; onClose: () => void; onSave: (item: MasterRequirement) => void }) {
  const [draft, setDraft] = useState<MasterRequirement>(item ?? { id: "", title: "", section: sections[0] ?? "", version: "v1", status: "Draft", siteIds: [], questions: [] });
  const [submitted, setSubmitted] = useState(false);
  const valid = Boolean(draft.id.trim() && draft.title.trim() && draft.section.trim() && /^v\d+$/i.test(draft.version.trim()) && draft.questions.every((question) => question.text.trim()));
  const update = (key: keyof MasterRequirement, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const sectionOptions = sections.map((value) => ({ value, label: value }));
  return <div className="dialog-layer"><button className="dialog-backdrop" aria-label="Close requirement editor" onClick={onClose} /><section className="dialog dialog--wide" role="dialog" aria-modal="true" aria-labelledby="master-dialog-title">
    <div className="dialog__header"><div><p className="eyebrow">Governed content</p><h2 id="master-dialog-title">{item ? `Edit ${item.id}` : "Add requirement"}</h2></div><IconButton label="Close dialog" onClick={onClose}><X size={20} /></IconButton></div>
    <div className="dialog-form form-grid">
      <label className={cx("field", submitted && !draft.id.trim() && "field--invalid")}><span>Requirement ID <b>Required</b></span><input value={draft.id} disabled={Boolean(item)} onChange={(event) => update("id", event.target.value)} placeholder="For example, OS 2.4.1" />{submitted && !draft.id.trim() && <small className="field-error">Enter a unique requirement ID.</small>}</label>
      <label className={cx("field", submitted && !/^v\d+$/i.test(draft.version.trim()) && "field--invalid")}><span>Version <b>Required</b></span><input value={draft.version} onChange={(event) => update("version", event.target.value)} placeholder="v1" />{submitted && !/^v\d+$/i.test(draft.version.trim()) && <small className="field-error">Use a version such as v1 or v12.</small>}</label>
      <label className={cx("field", "field--wide", submitted && !draft.title.trim() && "field--invalid")}><span>Requirement title <b>Required</b></span><textarea rows={3} value={draft.title} onChange={(event) => update("title", event.target.value)} />{submitted && !draft.title.trim() && <small className="field-error">Enter the requirement title.</small>}</label>
      <label className={cx("field", submitted && !draft.section.trim() && "field--invalid")}>
        <span>Section <b>Required</b></span>
        <Select label="Section" value={draft.section} onChange={(value) => update("section", value)} options={sectionOptions} />
        {submitted && !draft.section.trim() && <small className="field-error">Choose the governed section.</small>}
      </label>
      <label className="field">
        <span>Status</span>
        <Select label="Status" value={draft.status} onChange={(value) => update("status", value)} options={[{ value: "Draft", label: "Draft" }, { value: "Published", label: "Published" }]} />
      </label>
      <label className="field field--wide">
        <span>Sites <small>Leave empty to apply to all sites</small></span>
        <CheckboxList label="Sites" searchable options={siteOptions} selected={draft.siteIds} onChange={(values) => setDraft((current) => ({ ...current, siteIds: values }))} />
      </label>
      {item && (
        <div className="field field--wide">
          <span>Assessment questions</span>
          <QuestionsEditor questions={draft.questions} onChange={(questions) => setDraft((current) => ({ ...current, questions }))} requirementId={draft.id} submitted={submitted} />
        </div>
      )}
    </div>
    <div className="dialog__footer"><Button variant="tertiary" onClick={onClose}>Cancel</Button><Button variant="primary" icon={<Check size={17} />} onClick={() => {
      setSubmitted(true);
      if (!valid) return;
      onSave({
        ...draft,
        id: draft.id.trim(),
        title: draft.title.trim(),
        section: draft.section.trim(),
        version: draft.version.trim(),
        questions: draft.questions.map((question) => ({ ...question, text: question.text.trim(), expectedEvidence: question.expectedEvidence.map((line) => line.trim()).filter(Boolean) })),
      });
    }}>{item ? "Save changes" : "Add requirement"}</Button></div>
  </section></div>;
}
```

- [ ] **Step 5: Add CSS for the question editor**

In `src/styles.css`, find:

```css
.field input:focus,
.field textarea:focus {
  border-color: var(--kc-600);
  box-shadow: 0 0 0 3px var(--kc-100);
}
```

and add immediately after it:

```css

.question-editor-list {
  display: grid;
  gap: 0.85rem;
}

.question-editor-row {
  display: grid;
  gap: 0.65rem;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  background: var(--surface-panel);
  padding: 0.9rem;
}

.question-editor-row--invalid {
  border-color: var(--danger-border);
  box-shadow: 0 0 0 3px var(--danger-surface);
}

.question-editor-row__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.question-editor-empty {
  border: 1px dashed var(--neutral-300);
  border-radius: var(--radius-lg);
  padding: 1rem;
  color: var(--neutral-500);
  font-size: 0.78rem;
  text-align: center;
}
```

- [ ] **Step 6: Run typecheck and lint**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run lint`
Expected: PASS

- [ ] **Step 7: Manual smoke test**

Run: `npm run dev`, then in the browser:

1. Sign in as Administrator, go to `/admin/requirements`.
2. Open **OS 2.1.3** ("Risks, opportunities, and planning controls") for edit. Confirm two existing questions appear under "Assessment questions", each with its question text and evidence lines pre-filled.
3. Edit the first question's text to add the word "currently" and click **Save changes**. Reopen the same requirement — confirm the edited text persisted.
4. Click **Add question**, type a new question's text (leave evidence blank), save.
5. As the site contributor (switch role via the demo role picker, or sign in as that role), go to `/assessment`, open the "Risks, opportunities, and planning controls" requirement. Confirm: the edited question's text shows the update, and the new question appears, unanswered.
6. Back in the admin editor, delete that newly added question and save. Reload the site contributor's assessment page for that requirement — confirm the question is gone.
7. Try saving with a question's text cleared entirely — confirm the row shows a "Enter the question text." error and the dialog does not close.

- [ ] **Step 8: Commit**

```bash
git add src/features/admin/pages/AdminScreens.tsx src/app/providers/ApplicationDataProvider.tsx src/styles.css
git commit -m "feat: add/edit/delete assessment questions from Master Requirements"
```

---

### Task 3: Show "Evidence required" per question in the site contributor's assessment

**Files:**
- Modify: `src/features/assessment/pages/RequirementWorkspace.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `AssessmentQuestion.expectedEvidence` (Task 1), reconciliation from Task 2 (this is what actually populates it with live data end to end).

- [ ] **Step 1: Render the evidence list in the question card**

In `src/features/assessment/pages/RequirementWorkspace.tsx`, replace:

```tsx
                <article className="question-card" key={question.id} id={`question-${question.id}`}>
                  <div className="question-card__header"><span className="question-number">{question.number}</span><div><p>Question {question.number}</p><h3>{question.text}</h3></div><PerformanceBadge performance={performanceForResponse(question.response)} compact /></div>
                  <ResponseSelector questionId={question.id} value={question.response} onChange={(response) => changeQuestion(question.id, { response })} />
                  <ActionEditor action={question.action} response={question.response} onChange={(action) => changeQuestion(question.id, { action })} />
                </article>
```

with:

```tsx
                <article className="question-card" key={question.id} id={`question-${question.id}`}>
                  <div className="question-card__header"><span className="question-number">{question.number}</span><div><p>Question {question.number}</p><h3>{question.text}</h3></div><PerformanceBadge performance={performanceForResponse(question.response)} compact /></div>
                  {Boolean(question.expectedEvidence?.length) && (
                    <div className="question-evidence">
                      <span className="question-evidence__title"><Paperclip size={14} /> Evidence required</span>
                      <ul>{question.expectedEvidence!.map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                  )}
                  <ResponseSelector questionId={question.id} value={question.response} onChange={(response) => changeQuestion(question.id, { response })} />
                  <ActionEditor action={question.action} response={question.response} onChange={(action) => changeQuestion(question.id, { action })} />
                </article>
```

(`Paperclip` is already imported at the top of this file — it's used by `EvidencePanel` and `GuidancePanel`.)

- [ ] **Step 2: Add CSS for the evidence list**

In `src/styles.css`, find:

```css
.expected-evidence ul {
  gap: 0.55rem;
  margin-top: 0.7rem;
  font-size: 0.75rem;
}
```

and add immediately after it:

```css

.question-evidence {
  display: grid;
  gap: 0.5rem;
  margin: 0.85rem 0 0;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-md);
  background: var(--surface-elevated);
  padding: 0.75rem 0.9rem;
}

.question-evidence__title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--kc-700);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.question-evidence ul {
  display: grid;
  gap: 0.3rem;
  margin: 0;
  padding-left: 1.1rem;
  color: var(--neutral-600);
  font-size: 0.76rem;
  line-height: 1.5;
}
```

- [ ] **Step 3: Run typecheck and lint**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`. Sign in as the site contributor, go to `/assessment`, open "Risks, opportunities, and planning controls" (OS 2.1.3). Confirm each of its two questions shows an "Evidence required" box listing the two evidence lines seeded in Task 1, positioned between the question text and the response options. Open a requirement with no seeded evidence for a question (e.g. "Competence and awareness") and confirm no empty evidence box renders for that question.

- [ ] **Step 5: Commit**

```bash
git add src/features/assessment/pages/RequirementWorkspace.tsx src/styles.css
git commit -m "feat: show required evidence under each assessment question"
```

---

### Task 4: Show "Evidence required" per question in the read-only drill-down

**Files:**
- Modify: `src/features/dashboard/pages/DashboardScreens.tsx`

**Interfaces:**
- Consumes: `AssessmentQuestion.expectedEvidence` (Task 1), `.question-evidence*` CSS (Task 3 — no new CSS needed here).

- [ ] **Step 1: Import `Paperclip`**

In `src/features/dashboard/pages/DashboardScreens.tsx`, replace:

```ts
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilterX,

  MapPin,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
```

with:

```ts
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FilterX,

  MapPin,
  Paperclip,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
```

- [ ] **Step 2: Render the evidence list in the read-only question card**

In the same file, replace:

```tsx
              <article className="question-card" key={question.id}>
                <div className="question-card__header">
                  <span className="question-number">{question.number}</span>
                  <div><p>Question {question.number}</p><h3>{question.text}</h3></div>
                  <PerformanceBadge performance={performanceForResponse(question.response)} compact />
                </div>
                <div className="readonly-response">
                  <span>Response</span>
                  <span className={cx("response-chip", `response-chip--${question.response ?? "none"}`)}>{responseLabel(question.response)}</span>
                </div>
                {question.action?.description && (
```

with:

```tsx
              <article className="question-card" key={question.id}>
                <div className="question-card__header">
                  <span className="question-number">{question.number}</span>
                  <div><p>Question {question.number}</p><h3>{question.text}</h3></div>
                  <PerformanceBadge performance={performanceForResponse(question.response)} compact />
                </div>
                {Boolean(question.expectedEvidence?.length) && (
                  <div className="question-evidence">
                    <span className="question-evidence__title"><Paperclip size={14} /> Evidence required</span>
                    <ul>{question.expectedEvidence!.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                )}
                <div className="readonly-response">
                  <span>Response</span>
                  <span className={cx("response-chip", `response-chip--${question.response ?? "none"}`)}>{responseLabel(question.response)}</span>
                </div>
                {question.action?.description && (
```

- [ ] **Step 3: Run typecheck and lint**

Run: `npm run typecheck`
Expected: PASS

Run: `npm run lint`
Expected: PASS

- [ ] **Step 4: Manual smoke test**

Run: `npm run dev`. Sign in as Administrator or enterprise-viewer, go to `/dashboard`, drill into the Northstar site, open the "Planning" section's question detail for OS 2.1.3. Confirm the same "Evidence required" boxes appear in this read-only view, matching what the site contributor sees.

- [ ] **Step 5: Run the full verification suite**

Run: `npm run verify`
Expected: PASS (lint + typecheck + check:architecture + build all succeed).

- [ ] **Step 6: Commit**

```bash
git add src/features/dashboard/pages/DashboardScreens.tsx
git commit -m "feat: show required evidence per question in the read-only drill-down"
```
