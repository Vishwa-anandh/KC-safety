# ADR-0001: Defer a server-state engine until live API integration

Status: accepted  
Date: 2026-08-21

## Context

The current application is a behavior-rich review build whose business state is loaded synchronously from a removable demo repository. There is no available Backend or authoritative OpenAPI contract. Introducing RTK Query or TanStack Query only to wrap local fixtures would create a second state model without improving correctness.

## Decision

Keep the repository-backed `ApplicationDataProvider` for the current demo behavior. When live resource endpoints are implemented, select exactly one server-state engine:

- RTK Query if the team standardizes the wider client on Redux Toolkit; or
- TanStack Query if server state remains independent of a Redux store.

The selection requires a follow-up ADR and a complete resource migration. The application must never operate both caches for the same API boundary.

## Consequences

- Existing output and browser persistence remain unchanged.
- Screens already depend on feature hooks, so the future cache engine can replace provider internals without screen rewrites.
- API loading/error states will be implemented with the selected engine when the Backend contract exists.

## Verification

- Architecture checks prevent direct transport access from pages.
- Demo/API repositories implement common contracts.
- Production API mode never silently falls back to demo fixtures.
