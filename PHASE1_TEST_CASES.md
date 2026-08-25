# EHS&S Phase 1 end-to-end test cases

## Purpose

These cases validate the complete Phase 1 experience for an assigned single-site user, enterprise dashboard viewer, and administrator. Multi-site selection is intentionally excluded.

## Test data and roles

- Assigned site: Northstar Manufacturing (`KC-NSM-042`)
- Site user: Rachel Morgan
- Enterprise viewer: read-only access to authorized sites
- Administrator: access to imports and master requirements
- Supported responses: No, Partial, Yes
- No and Partial responses require an action description and an owner

## Application shell and access

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| AS-01 | Assigned user entry | Open `/overview` | Overview opens directly for Northstar Manufacturing; no site-selection screen appears. |
| AS-02 | Current site context | Visit Overview, Site information, Owners, Assessment, and Actions | The persistent shell continues to show the assigned site. |
| AS-03 | Collapse navigation | Collapse and expand the desktop navigation | Labels animate out and in, icons remain usable, and the control remains visible. |
| AS-04 | Mobile and tablet navigation | Use widths below 1024 px | Bottom navigation is available; page content remains readable with no horizontal page overflow. |
| AS-05 | No assignment | Open `/no-assignment` | No site data is shown; Contact support and Sign out are usable. |
| AS-06 | Unauthorized deep link | Open `/unauthorized` | No protected content is shown; Return to overview and Get help are usable. |
| AS-07 | Expired session | Open `/session-expired` | The screen explains saved versus unconfirmed work; Sign in again is usable. |
| AS-08 | System theme | Switch the operating system between light and dark | The application follows the system theme without a manual override. |

## Site information and owners

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| SI-01 | Edit and save contacts | Change a contact name and valid email; save | Success feedback appears and the values persist after reload. |
| SI-02 | Invalid contact email | Enter an invalid email; save | The field is highlighted and the record is not saved. |
| SI-03 | Required contact | Clear a required contact; save | A required-field message appears and the record is not saved. |
| SI-04 | Unsaved state | Change any contact without saving | Unsaved changes is shown and closing/reloading the tab triggers the browser warning. |
| OW-01 | Search owners | Search by program or person | Only matching owner cards remain. |
| OW-02 | Filter owner category | Select Operating System or Performance Standard | Only records in the selected category remain. |
| OW-03 | Edit owners | Edit Primary and Backup Owner names and valid emails; save | Success feedback appears and the owner card persists after reload. |
| OW-04 | Invalid owner record | Clear a name or use an invalid email | Inline validation blocks saving. |

## Assessment and evidence

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| AT-01 | Open next incomplete | From Assessment sections, choose Open next incomplete | The first requirement with incomplete answer/action data opens. |
| AT-02 | Section card navigation | Open each Operating System or Performance Standard card | The representative requirement for that section opens. |
| AT-03 | Response mapping | Select No, Partial, and Yes | Badges map to Initial, Emerging, and Performing. |
| AT-04 | Lowest-level roll-up | Give questions different responses | Requirement performance equals the lowest answered level. |
| AT-05 | Required No action | Select No, clear description or owner, then choose Next requirement | Navigation is blocked, missing fields are highlighted, and answers remain saved. |
| AT-06 | Required Partial action | Select Partial, complete description and owner, then choose Next requirement | Changes save and navigation proceeds. |
| AT-07 | Yes retains action | Change a gap with an existing action to Yes | The existing action remains visible as retained information. |
| AT-08 | Previous and next | Use Previous requirement and Next requirement | The expected adjacent requirement opens; first/last controls are disabled at the boundaries. |
| AT-09 | Requirement search | Search in the assessment navigator | Matching requirement titles, IDs, and sections remain. |
| AT-10 | Next incomplete | Choose Next incomplete in the navigator | The next incomplete requirement opens if the current requirement passes validation. |
| EV-01 | Add file evidence | Add evidence, choose a local file, enter a title, save | The file record appears and persists after reload. |
| EV-02 | Add secure link | Add evidence as link with title and full URL | The link record appears and Open secure link is available. |
| EV-03 | Invalid evidence | Submit without title/file or with an invalid URL | Inline validation blocks adding the record. |
| EV-04 | View evidence | Select an evidence title or View icon | Evidence details open; secure links can open in a new tab. |
| EV-05 | Edit evidence | Edit title, link, or replacement file | Updated evidence appears and persists. |
| EV-06 | Delete evidence | Delete an item and confirm | The item is removed and the evidence count updates. |

## Actions and dashboard

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| AC-01 | Assessment-to-actions synchronization | Create or edit a No/Partial action in Assessment; open Actions | The action and owner match the assessment record. |
| AC-02 | Repair missing action | Edit a Needs information row; complete description and owner | Row changes to Complete and the assessment requirement is updated. |
| AC-03 | Filter actions | Filter by state and response; search by owner/text | Only matching rows remain; empty-state feedback appears when none match. |
| AC-04 | Open exact requirement | Select the row arrow | The originating requirement opens. |
| DB-01 | Dashboard live roll-up | Change Northstar assessment responses; open Dashboard | Northstar completion, performance, gaps, and updated date reflect saved data. |
| DB-02 | Dashboard filters | Combine region, segment, completion, performance, site search, and assessment area | Site rows and active-filter chips reflect the selected view. |
| DB-03 | Clear dashboard filters | Choose Reset or Clear all | All filter values return to defaults and all authorized sites appear. |
| DB-04 | Dashboard empty state | Apply filters that yield no result | A clear empty state and Clear filters action appear. |
| DB-05 | Export dashboard | Filter sites, then export | A CSV containing only the filtered site view downloads and opens in Excel. |
| DB-06 | Assigned-site drill-down | Open Northstar, then open a section | Live section results appear and the exact editable requirement opens. |
| DB-07 | Other-site drill-down | Open another site and select View | A read-only section preview appears; no edit control is exposed. |
| DB-08 | Assessment-first drill-down | Open any site as an administrator and use All, Needs attention, and Complete | Assessment health and priority review appear first; section filters update the assessment-area list; users and contacts remain available in the collapsed secondary section. |

## Administration

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| IM-01 | Select valid workbook | Choose or drop an `.xlsx` file under 25 MB | Filename and size appear; Continue becomes enabled. |
| IM-02 | Reject invalid workbook | Select a non-`.xlsx` file or a file over 25 MB | A clear error appears and Continue remains disabled. |
| IM-03 | Import walkthrough | Continue through Inspect, Map, and Validate | Step state updates; inspected counts, mapping, warnings, and blocking errors are visible. |
| IM-04 | Validation report | Choose Download validation report | A CSV report downloads. |
| IM-05 | Confirm guard | Reach Confirm without selecting the acknowledgement | Confirm import remains disabled. |
| IM-06 | Complete import | Select acknowledgement and confirm | Result counts and a unique audit reference appear; the record persists in Import history. |
| IM-07 | Import history | Open Import history before and after an import | Empty state appears initially; completed records show filename, user, time, counts, and ID. |
| MR-01 | Search and filter master records | Search by ID/title; filter section and state | Only matching records remain. |
| MR-02 | Add master requirement | Add a unique ID, title, section, state, questions, and expected evidence | The record appears and persists. |
| MR-03 | Prevent duplicate ID | Add a record using an existing ID | Addition is blocked and a warning appears. |
| MR-04 | Edit master requirement | Change title, section, state, question text, or expected evidence | Updated values persist. |
| MR-05 | Publish or move to draft | Open More actions and change state | The publishing badge updates. |
| MR-06 | Duplicate requirement | Choose Duplicate | A uniquely identified draft copy appears. |
| MR-07 | Requirement audit details | Open Administration > Audit log, then add, edit, and remove questions or expected-evidence items | A connected timeline includes representative added, edited, removed, deleted, imported, and published demo events plus every newly saved operation, with requirement ID, actor, time, and before/after values. |
| MR-08 | Requirement audit export | Filter the audit log by requirement/change area and choose Export audit log | A CSV containing the visible detailed changes downloads. |

## Cross-cutting quality checks

| ID | Scenario | Expected result |
|---|---|---|
| QA-01 | Keyboard-only use | Every link, control, dialog, filter, and response is reachable with a visible focus state. |
| QA-02 | Custom tooltip | Icon-only controls show a styled tooltip on hover/focus and retain an accessible name. |
| QA-03 | Custom scrollbar | Supported browsers use the product scrollbar in light and dark themes. |
| QA-04 | Responsive stress | At 360 px, 768 px, 1024 px, 1440 px, and 1920 px, content uses available width without unreadable scaling. |
| QA-05 | Content casing | User-facing copy uses natural sentence/title casing; no content is forced to all caps. |
| QA-06 | Persistence | Reload after each saved edit | Assessment, evidence, contacts, owners, import history, and master records remain. |
| QA-07 | Reduced motion | Enable reduced-motion at OS/browser level | Navigation and dialog transitions reduce to near-instant behavior. |

## Role-aware guided setup

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| GS-01 | First Site contributor entry | Open the application with no prior setup record | Welcome identifies Maya Patel, Site contributor, and Northstar Manufacturing; Start guided setup and Skip setup are available. |
| GS-02 | Preview another role | Select Enterprise viewer or Administrator in the welcome dialog | Identity, scope, step count, navigation, and journey copy update for the selected role. |
| GS-03 | Highlight a real control | Start any role journey | The page dims and the actual target receives a visible blue spotlight connected to the coach mark. |
| GS-04 | Automatic page navigation | Choose Next when the next step belongs to another page | The correct route opens, scrolls the target into view, and updates the step title and progress. |
| GS-05 | Back navigation | Move forward and select Back | The previous step and its route/target are restored; Back is disabled on step 1. |
| GS-06 | Skip setup | Select Skip setup during the journey | The overlay closes and a dismissible Continue setup reminder preserves the current role and step. |
| GS-07 | Continue setup | Select Continue in the reminder | The role journey resumes from the saved progress. |
| GS-08 | Complete setup | Finish the final step | A role-specific completion dialog appears and automatic setup is disabled for that role. |
| GS-09 | Replay setup | Open Profile or Help and select Replay/Start tour | The chosen role journey restarts from step 1 even when previously completed. |
| GS-10 | Role-aware desktop navigation | Switch among Site user, Enterprise viewer, and Administrator | Only destinations relevant to the selected role appear in the side navigation. |
| GS-11 | Role-aware compact navigation | Repeat role switching below 1024 px | Bottom tabs and More navigation expose the selected role’s destinations. |
| GS-12 | Mobile coach mark | Run a tour at 390 × 844 | The coach mark appears above the bottom tab bar, target remains highlighted, and no horizontal overflow occurs. |
| GS-13 | Keyboard flow | Navigate welcome, coach marks, Help, and completion using keyboard only | Focus remains in the active setup surface; visible focus, Back/Next, and Escape behavior work correctly. |
| GS-14 | System theme | Run guided setup in system light and dark modes | Welcome, spotlight, coach marks, reminders, and Help follow the system theme with readable contrast. |

## Authentication and settings

| ID | Scenario | Steps | Expected result |
|---|---|---|---|
| AU-01 | Protected-route redirect | Clear the session and open `/assessment` directly | Login opens and remembers `/assessment` as the intended destination. |
| AU-02 | Site contributor demo login | Select Maya Patel | Overview opens with Northstar as the fixed site; only Site workspace and Settings destinations are available. |
| AU-03 | Enterprise viewer demo login | Select Noah Williams | Enterprise dashboard opens; site drill-down is read-only and Administration destinations are hidden. |
| AU-04 | Administrator demo login | Select Rachel Morgan | Enterprise dashboard opens with Imports, Master requirements, and Settings available. |
| AU-05 | Password demo login | Enter a listed demo email and `Welcome123!` | The matching account signs in and opens its role home. |
| AU-06 | Invalid password | Enter a demo email with an incorrect password | Sign-in stays on Login and a plain-language error appears without clearing the form. |
| AU-07 | Unauthorized deep link | Sign in as Site contributor and open `/admin/imports` | The unauthorized state opens and no import data is rendered. |
| AU-08 | Preserved authorized destination | While signed out open `/assessment`, then sign in as Maya Patel | The requested Assessment route opens after sign-in. |
| AU-09 | Sign out | Use Sign out from Profile or Settings | The session is cleared, Login opens, and protected routes redirect to Login. |
| AU-10 | Session expiry | Open `/session-expired` while signed in, then choose Sign in again | The session is cleared and Login opens. |
| AU-11 | Demo removal flag | Build with `VITE_ENABLE_DEMO_AUTH=false` | Demo cards and role switching are absent; the production login composition remains. |
| TH-01 | Pre-login system theme | Leave preference on System and change OS appearance | Login follows the operating-system theme immediately. |
| TH-02 | Theme override persistence | Choose Light or Dark on Login, reload, sign in, and open Settings | The override persists across reload and authentication; Settings shows the same selected choice. |
| TH-03 | Return to system theme | Select System in Settings | The saved override is removed and the current OS appearance is applied. |
| PK-01 | Passkey capability | Open Settings in a supported secure browser | Passkeys shows Available; unsupported/insecure contexts show Unavailable and disable Add a passkey. |
| PK-02 | Add passkey | Enter a device name, select Add a passkey, and complete the device prompt | The credential appears with its name and creation date; private key material remains device-managed. |
| PK-03 | Cancel passkey prompt | Start registration and cancel the device prompt | A clear non-destructive error appears and no credential record is added. |
| PK-04 | Rename passkey | Select Rename, enter a non-empty name, and save | The new display name appears and persists. |
| PK-05 | Remove passkey | Select Remove, review the custom confirmation, and confirm | The credential disappears and cannot be selected by the application. |
| PK-06 | No passkey control on Login | Open Login with and without application passkey records | No passkey setup, sign-in, hint, or enrollment control appears on Login. |
| PK-07 | First successful login offer | In a browser with no prior offer record, sign in with password or a demo account | The role home opens behind a custom modal asking whether to add a passkey for the authenticated account. |
| PK-08 | Defer first-login passkey | Choose Not now in the first-login modal | The modal closes, guided setup may begin, and the passkey offer does not automatically appear on the next sign-in. |
| PK-09 | Add from first-login modal | Choose Add a passkey and complete the native device prompt | A success state confirms registration for This device before Continue to workspace closes the modal. |
| PK-10 | Cancel device ceremony | Choose Add a passkey and cancel the native prompt | The custom modal remains open with a clear non-destructive error; Not now remains available. |
| ST-01 | Settings on compact layout | Open Settings at 768 px and 390 px | Cards recompose without horizontal overflow; Settings remains reachable through More in the bottom tab bar. |
| ST-02 | Replay assigned setup | Select Replay my guided setup | The current authenticated role's journey begins at step 1. |
| ST-03 | Desktop settings navigation | Open Settings at 1440 px and select each index item | The sticky index remains visible, the selected section scrolls into view, and the active state updates. |
| ST-04 | Compact settings navigation | Open Settings at 768 px and 390 px | Search remains usable; section items become a horizontal bar; no content or bottom tabs overlap. |
| ST-05 | Settings search | Search for theme, passkey, alert, and setup | Only relevant sections remain and each result stays fully functional. |
| ST-06 | Settings search empty state | Search for an unrelated term | No settings found appears with a Clear search action that restores all sections. |
| ST-07 | Motion preference | Select System, Reduced, and Standard | The selected preference persists; Reduced minimizes application motion and Standard overrides an OS reduced-motion preference. |
| ST-08 | Notification toggles | Change each notification switch and reload | Accessible switch state and summary frequency persist; Preferences saved feedback appears after each change. |
| ST-09 | Disabled summary frequency | Turn Work summary off | Summary frequency becomes disabled without changing its stored value. |
| ST-10 | Current session | Review Security | Current browser/platform, secure-connection state, and Active now are visible without exposing sensitive session data. |
| ST-11 | Sign-out confirmation | Select Sign out in Security | A custom confirmation explains the impact; Stay signed in closes it and Sign out returns to Login. |
| ST-12 | Guided progress | Open Guided setup before, during, and after a tour | Status, completed step count, progress bar, and Continue/Replay label match saved progress. |
| ST-13 | Reset guided setup | Select Reset setup progress and confirm | Only active-role guided progress is cleared; the welcome journey restarts and assessment data remains unchanged. |
| ST-14 | Role capability summary | Review Account as each demo user | The identity, scope, and three capability descriptions match the authenticated role. |
