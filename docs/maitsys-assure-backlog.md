# Maitsys Assure Product Backlog

This document organizes the Maitsys Assure product backlog using the hierarchy:

> **Epic → Feature → User Story → Task**

It is suitable for product planning, sprint refinement, engineering handoff, and migration into Jira, Azure DevOps, Linear, or a similar work-management tool.

## How to use this document

| Level | Purpose | ID format | Suggested work-item type |
| --- | --- | --- | --- |
| Epic | A large business outcome spanning multiple releases | `EPIC-01` | Epic |
| Feature | A user-facing capability within an epic | `FEAT-01.01` | Feature |
| User story | A testable piece of user value | `US-01.01.01` | Story |
| Task | A specific design, frontend, API, backend, data, or test activity | `TASK-01.01.01.01` | Task/Sub-task |

### Status notation

- `[x]` — implemented in the current demo application.
- `[ ]` — remaining production, backend, integration, or enhancement work.
- **Demo** — works through the demo repository and browser persistence.
- **API-ready** — frontend boundary exists, but a live backend contract still needs implementation or confirmation.
- **Backlog** — planned work that is not yet implemented.

### Definition of ready for a user story

A story is ready for development when:

- Its user, business value, and expected behavior are clear.
- Acceptance criteria cover success, empty, loading, error, and permission states where applicable.
- UX designs or existing reference screens are identified.
- API and data dependencies are documented.
- Tenant and role scope are defined.
- Test data and validation expectations are available.

### Definition of done for a user story

A story is complete when:

- Acceptance criteria pass for every permitted role and affected route.
- Frontend, API, backend, persistence, authorization, and audit behavior are connected where required.
- No demo fixture is imported directly by a screen or feature component.
- Responsive behavior and keyboard interaction are verified.
- Unit, integration, contract, and relevant end-to-end tests pass.
- Errors, loading states, and empty states are useful to the user.
- Documentation and API contracts are updated.

---

## EPIC-01 — Identity, authentication, and access control

**Outcome:** Every user enters Maitsys Assure securely and can access only the routes, data, sites, and actions permitted by their role and tenant.

### FEAT-01.01 — Sign-in and session management

#### US-01.01.01 — Sign in with credentials

**Story:** As a registered user, I want to sign in with my credentials so that I can access my authorized workspace.

**Acceptance criteria:**

- Valid credentials create a user session and redirect to the correct role landing page.
- Invalid credentials display a clear error without revealing account-sensitive information.
- A restored session retains the correct identity, role, tenant, and assigned-site scope.
- Signing out clears authentication state and protected business data.

##### Tasks

- [x] `TASK-01.01.01.01` Provide demo accounts for supported roles. **Demo**
- [x] `TASK-01.01.01.02` Protect authenticated routes and redirect unauthenticated users. **Demo**
- [ ] `TASK-01.01.01.03` Implement REST login, refresh, session, and logout endpoints. **API-ready**
- [ ] `TASK-01.01.01.04` Store production credentials or tokens using the approved secure-session strategy. **Backlog**
- [ ] `TASK-01.01.01.05` Add authentication contract and end-to-end tests. **Backlog**

#### US-01.01.02 — Sign in with a passkey

**Story:** As a registered user, I want to use a passkey so that I can sign in without relying only on a password.

**Acceptance criteria:**

- Passkey registration and authentication use server-generated WebAuthn challenges.
- Failed, cancelled, expired, and unsupported ceremonies return understandable messages.
- The resulting session follows the same role and tenant rules as credential sign-in.

##### Tasks

- [x] `TASK-01.01.02.01` Provide the browser-facing passkey experience in the authentication feature. **Demo**
- [ ] `TASK-01.01.02.02` Implement WebAuthn registration options and verification endpoints. **Backlog**
- [ ] `TASK-01.01.02.03` Implement WebAuthn authentication options and verification endpoints. **Backlog**
- [ ] `TASK-01.01.02.04` Add browser compatibility and ceremony failure tests. **Backlog**

### FEAT-01.02 — Role- and tenant-based authorization

#### US-01.02.01 — Restrict pages and operations by role

**Story:** As an organization administrator, I want permissions enforced consistently so that users cannot view or change unauthorized information.

**Acceptance criteria:**

- Public routes remain accessible without a session.
- Site users, enterprise viewers, and administrators see only authorized navigation and routes.
- Direct URL access is checked independently of menu visibility.
- Backend authorization rejects unauthorized requests even if the frontend is bypassed.
- Every tenant-scoped query and mutation derives scope from the authenticated session, not from a trusted client parameter alone.

##### Tasks

- [x] `TASK-01.02.01.01` Apply frontend public/private route guards and role-aware navigation. **Demo**
- [x] `TASK-01.02.01.02` Restrict demo data to the active role and assigned site where applicable. **Demo**
- [ ] `TASK-01.02.01.03` Define the backend permission matrix for each endpoint and operation. **Backlog**
- [ ] `TASK-01.02.01.04` Enforce tenant and site scope in repository queries and service methods. **Backlog**
- [ ] `TASK-01.02.01.05` Add negative authorization and cross-tenant isolation tests. **Backlog**

---

## EPIC-02 — Site and organization management

**Outcome:** Administrators can maintain the organization structure, while site users see accurate site information and responsible contacts.

### FEAT-02.01 — Site directory and details

#### US-02.01.01 — View assigned site information

**Story:** As a site user, I want to view my site's identity, contacts, and program ownership so that I know who is responsible for the assessment program.

**Acceptance criteria:**

- The current site's name, code, region, contacts, and owners are displayed consistently.
- A site user cannot access another site's editable data through route manipulation.
- Empty contact or owner lists have a clear empty state.

##### Tasks

- [x] `TASK-02.01.01.01` Display site information from the active data repository. **Demo**
- [x] `TASK-02.01.01.02` Display contacts and program owners. **Demo**
- [ ] `TASK-02.01.01.03` Connect site, contact, and owner REST repositories. **API-ready**
- [ ] `TASK-02.01.01.04` Add tenant/site authorization tests. **Backlog**

### FEAT-02.02 — Administrative site management

#### US-02.02.01 — Create and maintain sites

**Story:** As an administrator, I want to create and update sites so that Maitsys Assure reflects the enterprise structure.

**Acceptance criteria:**

- Required fields and unique site identifiers are validated.
- Changes are reflected in site selection, requirement assignment, dashboards, and exports.
- Deactivation preserves historical assessment records.
- Destructive changes require confirmation and are audited.

##### Tasks

- [x] `TASK-02.02.01.01` Provide administrative site-management screens. **Demo**
- [ ] `TASK-02.02.01.02` Implement site create, update, deactivate, and restore endpoints. **API-ready**
- [ ] `TASK-02.02.01.03` Add uniqueness and referential-integrity validation. **Backlog**
- [ ] `TASK-02.02.01.04` Add audit events for site changes. **Backlog**

#### US-02.02.02 — Manage users and site assignments

**Story:** As an administrator, I want to manage users, roles, and site assignments so that access remains accurate as responsibilities change.

**Acceptance criteria:**

- A user can be assigned an approved role and permitted site scope.
- Role or site changes take effect without exposing stale unauthorized data.
- Deactivated users cannot create new sessions.
- Historical entries retain the original actor identity.

##### Tasks

- [x] `TASK-02.02.02.01` Provide the demo user-management experience. **Demo**
- [ ] `TASK-02.02.02.02` Implement user invitation, role, assignment, and deactivation endpoints. **API-ready**
- [ ] `TASK-02.02.02.03` Revalidate sessions after material permission changes. **Backlog**
- [ ] `TASK-02.02.02.04` Add permission-change audit tests. **Backlog**

---

## EPIC-03 — Requirement governance and administration

**Outcome:** Administrators can govern versioned requirements, questions, evidence expectations, and site applicability without changing assessment code.

### FEAT-03.01 — Master requirement lifecycle

#### US-03.01.01 — Create and edit a requirement

**Story:** As an administrator, I want to create and edit a requirement so that the assessment reflects the governed standard.

**Acceptance criteria:**

- The administrator can maintain the requirement ID, section, text, guidance, version, status, and applicable sites.
- Existing demo data appears in the edit form and selected sites remain visible.
- Leaving site selection empty applies the requirement to all sites.
- Saving updates the master list, site assessment availability, and dashboard calculations consistently.

##### Tasks

- [x] `TASK-03.01.01.01` Build the requirement create/edit page. **Demo**
- [x] `TASK-03.01.01.02` Populate edit forms from repository data, including selected sites. **Demo**
- [x] `TASK-03.01.01.03` Keep requirement list, navigation, and assessment views synchronized. **Demo**
- [ ] `TASK-03.01.01.04` Implement versioned requirement create/update REST endpoints. **API-ready**
- [ ] `TASK-03.01.01.05` Add optimistic-concurrency or revision-conflict handling. **Backlog**

#### US-03.01.02 — Publish or retire a requirement

**Story:** As an administrator, I want to control requirement status so that site users assess only approved content.

**Acceptance criteria:**

- Draft content is not unintentionally included in active site assessments.
- Publishing records the version, actor, and timestamp.
- Retiring a requirement preserves its historical responses, evidence references, and actions.

##### Tasks

- [x] `TASK-03.01.02.01` Provide draft and published status controls in demo mode. **Demo**
- [ ] `TASK-03.01.02.02` Implement publish, retire, and version-history endpoints. **API-ready**
- [ ] `TASK-03.01.02.03` Add publish validation and immutable publication audit records. **Backlog**

#### US-03.01.03 — Delete a requirement safely

**Story:** As an administrator, I want to delete an eligible requirement from the table menu so that obsolete draft content can be removed safely.

**Acceptance criteria:**

- Delete is available from the requirement table's three-dot menu.
- The user must confirm the exact requirement before deletion.
- Requirements with governed historical records are retired or blocked from hard deletion according to policy.
- Cancelling confirmation makes no change.

##### Tasks

- [x] `TASK-03.01.03.01` Add the table-menu delete option and confirmation dialog. **Demo**
- [x] `TASK-03.01.03.02` Remove the deleted demo requirement from relevant lists and routes. **Demo**
- [ ] `TASK-03.01.03.03` Define backend hard-delete versus retention policy. **Backlog**
- [ ] `TASK-03.01.03.04` Implement protected delete/retire endpoint and audit event. **API-ready**

### FEAT-03.02 — Assessment question authoring

#### US-03.02.01 — Add and edit requirement questions

**Story:** As an administrator, I want to manage the questions within a requirement so that users assess the intended controls.

**Acceptance criteria:**

- Questions can be added, ordered, edited, and removed.
- Each question has its own evidence-required setting and evidence-guidance text.
- Question configuration is visible when the requirement is reopened.
- Existing response history remains associated with the correct immutable question identity.

##### Tasks

- [x] `TASK-03.02.01.01` Provide question authoring and ordering controls. **Demo**
- [x] `TASK-03.02.01.02` Store per-question evidence requirements and guidance. **Demo**
- [ ] `TASK-03.02.01.03` Implement question CRUD and ordering endpoints. **API-ready**
- [ ] `TASK-03.02.01.04` Define question revision behavior when responses already exist. **Backlog**
- [ ] `TASK-03.02.01.05` Add question identity and history-preservation tests. **Backlog**

### FEAT-03.03 — Bulk requirement import

#### US-03.03.01 — Import governed requirement data

**Story:** As an administrator, I want to preview and import requirement data so that large standards can be configured efficiently.

**Acceptance criteria:**

- The import validates required columns, identifiers, versions, sections, and question definitions.
- Validation errors identify the row, field, and reason.
- The administrator can preview changes before publishing them.
- A failed import does not partially mutate governed content.

##### Tasks

- [x] `TASK-03.03.01.01` Provide the demo import and review workflow. **Demo**
- [ ] `TASK-03.03.01.02` Define the production import schema and downloadable template. **Backlog**
- [ ] `TASK-03.03.01.03` Implement server-side validation and transactional import. **API-ready**
- [ ] `TASK-03.03.01.04` Add import result and publication audit records. **Backlog**

---

## EPIC-04 — Site self-assessment

**Outcome:** Site users can complete governed assessments question by question while preserving flexible responses, evidence, and action tracking.

### FEAT-04.01 — Requirement navigation and progress

#### US-04.01.01 — Navigate assigned requirements

**Story:** As a site user, I want to search and navigate my assigned requirements so that I can complete the assessment efficiently.

**Acceptance criteria:**

- The left navigation shows requirements assigned to the active site.
- Selecting a requirement updates the active item, breadcrumb, content, questions, and progress state.
- Search works at supported responsive widths without overlapping its icon or controls.
- Previous, next, and next-incomplete navigation remain synchronized with the selected requirement.

##### Tasks

- [x] `TASK-04.01.01.01` Implement requirement search and active-item navigation. **Demo**
- [x] `TASK-04.01.01.02` Implement previous, next, and next-incomplete controls. **Demo**
- [x] `TASK-04.01.01.03` Provide responsive desktop and narrow-layout behavior. **Demo**
- [ ] `TASK-04.01.01.04` Add route-navigation and responsive end-to-end tests. **Backlog**

### FEAT-04.02 — Question response capture

#### US-04.02.01 — Answer or clear an assessment question

**Story:** As a site user, I want to select No, Partial, or Yes—or clear my selection—so that the response accurately represents the current state.

**Acceptance criteria:**

- No, Partial, and Yes map consistently to their defined performance levels.
- A response can be cleared because answering a question is not mandatory at selection time.
- Saving a changed response adds a history event without overwriting earlier history.
- Requirement and section performance use the documented lowest-question-level rule.
- Completion calculations distinguish unanswered questions from answered questions.

##### Tasks

- [x] `TASK-04.02.01.01` Implement selectable and clearable question responses. **Demo**
- [x] `TASK-04.02.01.02` Recalculate completion, gaps, and performance through shared selectors. **Demo**
- [x] `TASK-04.02.01.03` Persist response changes in the demo repository. **Demo**
- [ ] `TASK-04.02.01.04` Implement response create/update/clear endpoints. **API-ready**
- [ ] `TASK-04.02.01.05` Add calculation and concurrent-edit tests. **Backlog**

#### US-04.02.02 — Add optional supporting details

**Story:** As a site user, I want to add a brief explanation for any answer so that reviewers understand how the site meets—or does not meet—the requirement.

**Acceptance criteria:**

- Supporting details are optional for No, Partial, and Yes.
- Text is stored per question and included in response history.
- Clearing or changing an answer does not silently destroy earlier historical text.

##### Tasks

- [x] `TASK-04.02.02.01` Provide optional per-question supporting details. **Demo**
- [ ] `TASK-04.02.02.02` Add supporting-detail fields to response API contracts and persistence. **API-ready**
- [ ] `TASK-04.02.02.03` Add validation, history, and export tests. **Backlog**

### FEAT-04.03 — Per-question evidence

#### US-04.03.01 — View evidence expectations

**Story:** As a site user, I want to see the evidence expected for each question so that I can provide the correct supporting material.

**Acceptance criteria:**

- Evidence guidance appears only for the question configured by the administrator.
- The guidance remains visible for No, Partial, and Yes when evidence is required.
- Evidence requirements are not rendered as a single requirement-level attachment area.

##### Tasks

- [x] `TASK-04.03.01.01` Render administrator-configured guidance per question. **Demo**
- [x] `TASK-04.03.01.02` Keep evidence expectations visible after a Yes response. **Demo**
- [ ] `TASK-04.03.01.03` Connect evidence configuration to live requirement DTO mapping. **API-ready**

#### US-04.03.02 — Attach evidence to a question

**Story:** As a site user, I want to attach a file or link to an individual question so that evidence remains connected to the response it supports.

**Acceptance criteria:**

- Evidence is associated with a site, requirement, question, response context, uploader, and timestamp.
- A user can add, edit, view/download, and delete evidence when permitted.
- File type, size, malware-scanning, and retention rules are enforced in production.
- Evidence metadata is retained in question history and administrator exports.

##### Tasks

- [x] `TASK-04.03.02.01` Implement per-question demo evidence records and controls. **Demo**
- [ ] `TASK-04.03.02.02` Implement upload initiation, storage, metadata, download, and deletion endpoints. **API-ready**
- [ ] `TASK-04.03.02.03` Integrate approved object storage and malware scanning. **Backlog**
- [ ] `TASK-04.03.02.04` Add file authorization, retention, and audit tests. **Backlog**

---

## EPIC-05 — Corrective action management

**Outcome:** Gap responses automatically enter a governed action workflow, while users may optionally track actions for any response.

### FEAT-05.01 — Automatic corrective-action creation

#### US-05.01.01 — Create an action for No or Partial

**Story:** As a site user, I want a No or Partial response to automatically create a corresponding corrective action so that gaps are not tracked in a separate spreadsheet.

**Acceptance criteria:**

- Saving No or Partial creates or activates one corresponding action for that question response.
- The assessment can be saved without requiring the action description or owner immediately.
- The generated action appears in Actions Summary and the question's history.
- Repeated saves do not create accidental duplicate active actions.
- Changing the answer retains the action record and history according to the defined lifecycle policy.

##### Tasks

- [x] `TASK-05.01.01.01` Create demo actions from No and Partial responses. **Demo**
- [x] `TASK-05.01.01.02` Remove mandatory description and owner validation from assessment response saving. **Demo**
- [x] `TASK-05.01.01.03` Show the same action in Self-assessment and Actions Summary. **Demo**
- [ ] `TASK-05.01.01.04` Implement idempotent backend action creation from a response transaction. **API-ready**
- [ ] `TASK-05.01.01.05` Define lifecycle rules for response changes, reopening, and closure. **Backlog**

### FEAT-05.02 — Optional action for any answer

#### US-05.02.01 — Add or maintain an action for No, Partial, or Yes

**Story:** As a site user, I want to add and maintain a corrective or improvement action for any answer so that useful follow-up work is not limited to gaps.

**Acceptance criteria:**

- An action may be added for No, Partial, or Yes.
- Description, owner, status, and follow-up can be updated independently of changing the response.
- A Yes response does not display the action as mandatory.
- Existing actions are not silently deleted when the response changes.

##### Tasks

- [x] `TASK-05.02.01.01` Provide optional action editing for every response level. **Demo**
- [x] `TASK-05.02.01.02` Use the shared styled controls for owner and status fields. **Demo**
- [ ] `TASK-05.02.01.03` Implement action create/update/close endpoints. **API-ready**
- [ ] `TASK-05.02.01.04` Add action ownership, state-transition, and authorization rules. **Backlog**

### FEAT-05.03 — Actions Summary

#### US-05.03.01 — Track assigned and site actions

**Story:** As a site user, I want a central Actions Summary so that I can track descriptions, owners, statuses, and follow-up without using a separate tracker.

**Acceptance criteria:**

- Actions Summary shows the same canonical actions created from assessment questions.
- Filters and summary counts respond to status, ownership, site, requirement, and response level as designed.
- Updating an action is reflected in the originating question and its history.
- Users cannot modify actions outside their authorized site scope.

##### Tasks

- [x] `TASK-05.03.01.01` Provide action summary cards, filters, and editing flow. **Demo**
- [x] `TASK-05.03.01.02` Synchronize assessment and summary action changes. **Demo**
- [ ] `TASK-05.03.01.03` Connect Actions Summary queries and mutations to the live repository. **API-ready**
- [ ] `TASK-05.03.01.04` Add query invalidation and multi-user synchronization tests. **Backlog**

---

## EPIC-06 — Enterprise oversight, response history, and auditability

**Outcome:** Authorized enterprise and administrative users can understand current performance and review how every question changed over time.

### FEAT-06.01 — Enterprise dashboard

#### US-06.01.01 — Review enterprise and site performance

**Story:** As an enterprise viewer or administrator, I want to review completion, performance, questions, and gaps across sites so that I can identify risk and progress.

**Acceptance criteria:**

- Enterprise metrics use the same shared domain selectors as site views.
- Filters and drilldowns preserve authorized tenant and site scope.
- A user can navigate from enterprise summary to site and section detail.
- Empty, loading, and failed states clearly describe what happened.

##### Tasks

- [x] `TASK-06.01.01.01` Provide enterprise summary metrics and site drilldowns. **Demo**
- [x] `TASK-06.01.01.02` Reuse completion, performance, and gap selectors. **Demo**
- [ ] `TASK-06.01.01.03` Implement aggregate and drilldown endpoints with server-enforced scope. **API-ready**
- [ ] `TASK-06.01.01.04` Add aggregate reconciliation and performance tests. **Backlog**

### FEAT-06.02 — Per-question response timeline

#### US-06.02.01 — Review the history of a question

**Story:** As an enterprise viewer or administrator, I want to see every saved state of each site's question so that I can understand what changed, when, and by whom.

**Acceptance criteria:**

- The timeline is available from Enterprise Dashboard → Site → Section → question detail.
- Every entry includes response, supporting details, action snapshot, evidence snapshot, actor, and timestamp when available.
- Entries are ordered deterministically and earlier records are not overwritten by later edits.
- Current state and historical state are visually distinguishable.
- The administrator requirement editor remains focused on master content and does not duplicate site response records.

##### Tasks

- [x] `TASK-06.02.01.01` Display the per-question history timeline in enterprise site detail. **Demo**
- [x] `TASK-06.02.01.02` Capture response, action, and evidence changes as demo history events. **Demo**
- [x] `TASK-06.02.01.03` Remove site recorded-response data from the master requirement editor. **Demo**
- [ ] `TASK-06.02.01.04` Implement append-only response-history persistence and endpoints. **API-ready**
- [ ] `TASK-06.02.01.05` Add database constraints and tests preventing historical mutation. **Backlog**

### FEAT-06.03 — Audit log

#### US-06.03.01 — Audit governed and operational changes

**Story:** As an authorized administrator, I want an audit record of sensitive changes so that the organization can demonstrate accountability.

**Acceptance criteria:**

- Authentication, permissions, requirements, publications, responses, evidence, actions, imports, and exports create appropriate audit events.
- Audit entries identify tenant, entity, action, actor, timestamp, and correlation/request ID.
- Audit data is read-only to ordinary application users and follows retention policy.

##### Tasks

- [ ] `TASK-06.03.01.01` Define the audit-event schema and event catalogue. **Backlog**
- [ ] `TASK-06.03.01.02` Implement server-side audit capture for commands and security events. **Backlog**
- [ ] `TASK-06.03.01.03` Build an authorized audit search/export view if required. **Backlog**
- [ ] `TASK-06.03.01.04` Add tamper-resistance, retention, and access tests. **Backlog**

---

## EPIC-07 — Reporting, exports, and notifications

**Outcome:** Users can share governed results and receive relevant updates without losing evidence traceability or violating access scope.

### FEAT-07.01 — Enterprise export

#### US-07.01.01 — Export assessment data with evidence

**Story:** As an administrator, I want enterprise exports to include question responses, actions, history, and evidence references so that the exported report is operationally complete.

**Acceptance criteria:**

- Exported rows identify tenant, site, section, requirement, question, response, details, action, and timestamps.
- Evidence metadata and authorized download references are included.
- If evidence files are packaged, filenames remain unique and a manifest links each file to its question.
- Export content follows the current user's scope and does not expose another tenant's data.
- Large exports run asynchronously and communicate progress or failure.

##### Tasks

- [x] `TASK-07.01.01.01` Include evidence metadata in the demo enterprise spreadsheet export. **Demo**
- [ ] `TASK-07.01.01.02` Define the production workbook and optional evidence-package format. **Backlog**
- [ ] `TASK-07.01.01.03` Implement asynchronous server-side export generation. **API-ready**
- [ ] `TASK-07.01.01.04` Generate time-limited authorized evidence links or a secured archive. **Backlog**
- [ ] `TASK-07.01.01.05` Add export-scope, file-integrity, and large-volume tests. **Backlog**

### FEAT-07.02 — Notifications

#### US-07.02.01 — Receive relevant application notifications

**Story:** As a user, I want notifications about relevant assignments and changes so that I know when action is required.

**Acceptance criteria:**

- Notifications are scoped to the authenticated user and tenant.
- Users can view unread state and mark notifications as read.
- Notification links open only authorized destinations.
- Delivery preferences can be changed without affecting required security messages.

##### Tasks

- [x] `TASK-07.02.01.01` Provide seeded notifications and read state in demo mode. **Demo**
- [ ] `TASK-07.02.01.02` Implement notification list, read, and preference endpoints. **API-ready**
- [ ] `TASK-07.02.01.03` Implement event-to-notification rules and delivery workers. **Backlog**
- [ ] `TASK-07.02.01.04` Add authorization and deep-link tests. **Backlog**

---

## EPIC-08 — User experience and accessibility

**Outcome:** Maitsys Assure remains clear, responsive, accessible, and visually consistent across supported devices and roles.

### FEAT-08.01 — Responsive application layout

#### US-08.01.01 — Use assessments and administration at supported widths

**Story:** As a user, I want pages to adapt to my screen size so that navigation, forms, tables, and actions remain usable.

**Acceptance criteria:**

- Assessment navigation and content remain usable without unintended horizontal clipping.
- Forms and search fields preserve labels, icons, focus rings, and touch targets.
- Tables use an intentional responsive strategy such as prioritized columns or controlled scrolling.
- Sticky controls do not obscure content or keyboard focus.

##### Tasks

- [x] `TASK-08.01.01.01` Refine assessment, requirement-edit, table, and search layouts. **Demo**
- [ ] `TASK-08.01.01.02` Define and test the supported viewport matrix. **Backlog**
- [ ] `TASK-08.01.01.03` Add visual-regression coverage for key routes. **Backlog**

### FEAT-08.02 — Design-system consistency

#### US-08.02.01 — Use consistent typography and form controls

**Story:** As a user, I want consistent typography, spacing, and controls so that the application feels predictable and trustworthy.

**Acceptance criteria:**

- Google Sans and configured fallbacks are applied consistently according to the approved design.
- Native browser controls do not appear where a styled shared component is expected.
- Text size, weight, line height, and letter spacing are defined through shared tokens.
- Focus, hover, disabled, validation, and selected states meet accessibility requirements.

##### Tasks

- [x] `TASK-08.02.01.01` Apply shared typography and layout tokens to existing screens. **Demo**
- [x] `TASK-08.02.01.02` Replace inconsistent action controls with shared styled fields. **Demo**
- [ ] `TASK-08.02.01.03` Complete keyboard and screen-reader audit. **Backlog**
- [ ] `TASK-08.02.01.04` Add automated accessibility checks to continuous integration. **Backlog**

### FEAT-08.03 — Personal preferences

#### US-08.03.01 — Configure presentation preferences

**Story:** As a user, I want to configure supported presentation preferences so that the application fits my working style.

**Acceptance criteria:**

- Theme, navigation, motion, and other presentation preferences remain separate from assessment business data.
- Preferences persist locally in demo mode.
- A future live preference repository can synchronize supported settings without changing UI components.

##### Tasks

- [x] `TASK-08.03.01.01` Persist browser-only presentation preferences. **Demo**
- [ ] `TASK-08.03.01.02` Confirm which preferences require account-level synchronization. **Backlog**
- [ ] `TASK-08.03.01.03` Implement preference endpoints for approved synchronized settings. **API-ready**

---

## EPIC-09 — API, backend, and production platform

**Outcome:** The current demo experience can be connected to a secure, scalable backend without rewriting screens or changing established UI flows.

### FEAT-09.01 — Replaceable data-source architecture

#### US-09.01.01 — Run the same features against demo or live repositories

**Story:** As a developer, I want features to depend on repository interfaces so that demo data can be removed or disabled without rewriting the UI.

**Acceptance criteria:**

- The dependency flow is `UI → feature hook → repository interface → demo or REST adapter → data source`.
- Screens do not directly call `fetch`, browser storage, or fixture files.
- Switching data sources reinitializes providers so states cannot mix.
- The data-source selector is development-only and excluded from production UI.

##### Tasks

- [x] `TASK-09.01.01.01` Centralize demo fixtures and demo repositories. **Demo**
- [x] `TASK-09.01.01.02` Define repository interfaces and REST-ready adapters. **API-ready**
- [x] `TASK-09.01.01.03` Add development-only source selection and isolation. **Demo**
- [ ] `TASK-09.01.01.04` Implement every live adapter against the approved backend contract. **Backlog**
- [ ] `TASK-09.01.01.05` Add architecture-boundary tests preventing direct fixture or transport imports. **Backlog**

### FEAT-09.02 — Backend domain and persistence

#### US-09.02.01 — Persist Maitsys Assure domain data

**Story:** As a product owner, I want governed and operational data stored transactionally so that it is durable, auditable, and safe for multi-user use.

**Acceptance criteria:**

- The model covers tenants, users, roles, sites, requirements, versions, questions, assignments, responses, evidence, actions, history, notifications, preferences, imports, and audit events.
- Relationships use stable identifiers rather than display text.
- Tenant isolation and historical retention are enforced at the data-access layer.
- Database migrations are versioned, reversible where practical, and tested.

##### Tasks

- [ ] `TASK-09.02.01.01` Select the backend runtime, database, object storage, queue, and deployment target. **Backlog**
- [ ] `TASK-09.02.01.02` Create the domain model and entity-relationship diagram. **Backlog**
- [ ] `TASK-09.02.01.03` Implement repositories, services, controllers, validation, and authorization. **Backlog**
- [ ] `TASK-09.02.01.04` Create migrations and seed only approved non-production reference data. **Backlog**
- [ ] `TASK-09.02.01.05` Add integration tests for transactions, scope, retention, and concurrency. **Backlog**

### FEAT-09.03 — API contract and client synchronization

#### US-09.03.01 — Provide a versioned REST API

**Story:** As a frontend developer, I want a stable typed API contract so that features can integrate without depending on backend implementation details.

**Acceptance criteria:**

- Resource-oriented endpoints and errors follow a documented versioned contract.
- DTO-to-domain mapping remains inside REST adapters.
- Queries define cache keys by tenant, site, requirement, question, filters, and pagination as applicable.
- Mutations invalidate or update every affected view without causing cross-tenant cache leakage.
- Uploads and long-running exports use explicit lifecycle endpoints.

##### Tasks

- [ ] `TASK-09.03.01.01` Approve the OpenAPI contract for all repository interfaces. **Backlog**
- [ ] `TASK-09.03.01.02` Generate or implement typed request/response DTOs. **Backlog**
- [ ] `TASK-09.03.01.03` Implement authentication, retry, cancellation, and normalized API errors. **API-ready**
- [ ] `TASK-09.03.01.04` Define RTK Query tags, cache keys, mutations, and invalidation rules if RTK Query is adopted. **Backlog**
- [ ] `TASK-09.03.01.05` Add REST contract tests for method, URL, body, status, and mapping. **Backlog**

### FEAT-09.04 — Operational readiness

#### US-09.04.01 — Operate Maitsys Assure safely in production

**Story:** As an operations team, I want observable and recoverable services so that production issues can be detected and resolved quickly.

**Acceptance criteria:**

- Environments use validated configuration and managed secrets.
- Health, readiness, structured logs, metrics, traces, and alerts are available.
- Backups, restore tests, retention, and disaster-recovery objectives are documented.
- Deployment supports controlled migration and rollback.
- Security and dependency scanning run in continuous integration.

##### Tasks

- [ ] `TASK-09.04.01.01` Define development, test, staging, and production environments. **Backlog**
- [ ] `TASK-09.04.01.02` Implement continuous integration checks for lint, typecheck, test, build, and security. **Backlog**
- [ ] `TASK-09.04.01.03` Add logs, metrics, traces, dashboards, and alerts. **Backlog**
- [ ] `TASK-09.04.01.04` Define backup, restore, recovery-time, and recovery-point objectives. **Backlog**
- [ ] `TASK-09.04.01.05` Complete performance, penetration, accessibility, and disaster-recovery testing. **Backlog**

---

## Cross-cutting dependency map

| Capability | Depends on | Produces or affects |
| --- | --- | --- |
| Authentication | Identity provider, session API | Route access, tenant scope, actor identity |
| Requirement publishing | Master requirements, questions, site assignments | Site assessments, dashboards, exports |
| Question response | Published question, site assignment, user scope | Completion, performance, gaps, history |
| Evidence | Question response context, file storage | History, review detail, exports |
| Corrective action | Question and response | Actions Summary, history, gap follow-up |
| Enterprise dashboard | Sites, assignments, responses, selectors | Site drilldown, metrics, exports |
| Response timeline | Responses, action snapshots, evidence snapshots | Auditability and historical review |
| Export | Dashboard scope, responses, actions, evidence authorization | Workbook, manifest, secured evidence package |

## Suggested release sequence

### Release 1 — Backend foundation

- Authentication/session and tenant authorization.
- Site, user, requirement, and question persistence.
- OpenAPI contract and live repository integration.
- Core audit logging and automated deployment checks.

### Release 2 — Operational assessment

- Response persistence and per-question evidence upload.
- Automatic corrective-action creation and Actions Summary synchronization.
- Append-only per-question response history.
- Notifications and production preference synchronization where approved.

### Release 3 — Enterprise governance

- Enterprise aggregates and drilldowns.
- Production Excel export with evidence references or secured evidence package.
- Bulk import, publication workflow, audit search, and operational hardening.

## Story template

Copy this block when adding a new story:

```markdown
#### US-XX.XX.XX — Story title

**Story:** As a [role], I want [capability] so that [business value].

**Acceptance criteria:**

- Given [context], when [action], then [expected result].
- Permission and tenant-scope behavior is defined.
- Loading, empty, validation, and failure behavior is defined.
- Responsive and accessibility expectations are defined.

##### Tasks

- [ ] `TASK-XX.XX.XX.01` Product/design task.
- [ ] `TASK-XX.XX.XX.02` Frontend task.
- [ ] `TASK-XX.XX.XX.03` API/backend task.
- [ ] `TASK-XX.XX.XX.04` Data/migration task.
- [ ] `TASK-XX.XX.XX.05` Test/documentation task.
```

## Backlog maintenance rules

- Keep stories user-centered; do not use a technical component as the user story.
- Keep tasks small enough to complete and verify within a sprint.
- Add implementation details to tasks, not to the user-value statement.
- Never mark a story done only because the UI exists; confirm API, persistence, authorization, audit, and tests when those are in scope.
- Preserve stable story and task IDs even if titles change.
- Link defects and technical debt to the affected story and feature.
- Record demo completion separately from production completion.
- Review dependencies before scheduling stories across teams.
- Update acceptance criteria when product behavior changes; do not rely only on screenshots or verbal decisions.
