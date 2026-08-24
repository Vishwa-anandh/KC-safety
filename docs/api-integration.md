# API integration guide

## Runtime configuration

The app renders the existing demo by default. To expose the development-only source switch, start Vite with:

```env
VITE_ENABLE_DATA_SOURCE_SWITCH=true
VITE_API_BASE_URL=https://api.example.com
```

The selector is compiled out of production behavior because it requires both `import.meta.env.DEV` and `VITE_ENABLE_DATA_SOURCE_SWITCH=true`. Its selection is stored only in `ehss-developer-data-source-v1`; changing it reloads the app so demo and API state never mix.

## Where to integrate

Screens and reusable components must never call `fetch` or import `src/demo`. Add live calls only in `src/data-access/rest/repositories.ts`, use `RestClient` for transport, and map backend DTOs to the domain models in `src/shared/types.ts` before returning them to feature hooks.

The current state-provider bridge uses `AppDataRepository` so the existing demo output and local persistence remain intact while domain-by-domain live loading is added. Replace the API repository's empty snapshot in `src/data-access/repositories/application.ts` with asynchronous feature queries as each endpoint becomes available; do not add API calls to components.

## Required REST resources

| Area | Method and path | Required behavior |
| --- | --- | --- |
| Session | `POST /auth/session`, `DELETE /auth/session` | Password login returns `{ accessToken, user }`; `user` maps to `AuthUser`. |
| WebAuthn | `POST /auth/passkeys/registration/options`, `POST /auth/passkeys/registration/verify`, `POST /auth/passkeys/authentication/options`, `POST /auth/passkeys/authentication/verify` | Server owns challenge creation and credential verification. |
| Assessment | `GET /sites/:siteId/assessment`, `PATCH /requirements/:requirementId/questions/:questionId` | Return and update the `Requirement` model, including response, period, and corrective action. |
| Evidence | `POST /requirements/:requirementId/evidence`, `PATCH /requirements/:requirementId/evidence/:evidenceId`, `DELETE /requirements/:requirementId/evidence/:evidenceId` | Multipart uploads use `FormData`; metadata maps to `EvidenceItem`. |
| Sites | `GET /sites`, `GET /sites/:siteId`, `PUT /sites/:siteId/contacts`, `GET /sites/:siteId/owners` | Provide dashboard/site records and contact/owner management. |
| Administration | `GET /sites/:siteId/users`, `POST /sites/:siteId/users`, `PUT /sites/:siteId/users/:userId`, `DELETE /sites/:siteId/users/:userId`, `POST /imports/requirements`, `POST /imports/:batchId/publish` | Manage scoped site users; import accepts multipart workbook data and returns `ImportHistoryRecord`. |
| Notifications | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` | Scope results to the current authenticated user and persist read status server-side. |
| Preferences | `GET /preferences`, `PUT /preferences` | Optional future synchronization for browser-only preferences; theme and guided setup are currently local by design. |

## Contract rules

- Send JSON except file uploads; use bearer authentication from the session token.
- Return `204 No Content` for successful empty mutations, or a JSON body matching the current domain type.
- Use stable IDs, ISO 8601 timestamps, and the exact role/status enum values currently declared in `src/shared/types.ts`.
- Return error payloads as `{ message: string, code?: string, fieldErrors?: Record<string, string> }` and an `x-request-id` response header. `RestClient` surfaces message, code, status, body, and request ID in `ApiError`.
- Keep API DTOs isolated in the REST adapters. If backend naming differs, translate it there rather than changing UI domain types.

## Demo removal

All removable sample content is rooted at `src/demo`: fixtures hold static content and demo repositories preserve the existing browser-storage behavior. Once live repositories cover every resource, remove the `src/demo` tree and the developer source switch; feature screens and route contracts remain unchanged.
