# ADR-0002: Keep demo data behind a removable repository boundary

Status: accepted  
Date: 2026-08-21

## Context

The review build needs seeded accounts, requirements, sites, contacts, users, imports, and notifications. Developers also need one obvious location that can be disconnected when a Backend is available.

## Decision

All fixtures and demo persistence remain under `src/demo`. Features access them only through contracts and source-selection factories in `src/data-access/repositories`.

Demo remains the default until a live API is implemented. The Demo/API selector is development-only and requires `VITE_ENABLE_DATA_SOURCE_SWITCH=true`.

## Consequences

- Removing demo mode is a composition/build decision, not a screen rewrite.
- Demo and API sessions cannot mix because changing sources reloads provider composition.
- API mode reports that the Backend is disconnected and never falls back to seeded content.

## Verification

`npm run check:architecture` rejects direct demo imports from feature or app UI code.
