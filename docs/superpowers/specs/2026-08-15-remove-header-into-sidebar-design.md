# Remove top header, fold its contents into the sidebar/mobile strip

**Status:** Approved
**Date:** 2026-08-15

## Problem

Every authenticated screen renders inside `AppShell` (`src/components/AppShell.tsx`), which currently has both a persistent `desktop-sidebar` (≥1101px) and a `top-bar` header that spans the full width above the page content at every screen size. The header holds three things: the site-context indicator (assigned site or authorized scope), a Help icon button, and the profile menu (avatar, name, role, dropdown with appearance/role-preview/settings/sign-out).

The ask: remove the header entirely, at every screen size, and give its contents a new home.

## Scope

Applies to all screen sizes. Two distinct layouts change:

- **Desktop (≥1101px)** — persistent sidebar is visible; header content moves into it.
- **Mobile/tablet (≤1100px)** — no persistent sidebar (replaced by the bottom tab bar + "More" drawer); header content moves into a new slim persistent strip instead of disappearing.

## Design

### Desktop sidebar (`.desktop-sidebar`)

Top to bottom:

1. **Brand lockup** — unchanged.
2. **Site context** *(new, moved from header)* — compact, non-interactive strip directly under the brand lockup: "Assigned site" / "Northstar Manufacturing · KC-NSM-042" for a site contributor, or "Authorized scope" / the role's scope string for enterprise-viewer/administrator. Matches the existing `top-bar` site-context copy, just relocated.
3. **Nav groups (`SideNav`)** — unchanged, scrollable middle section.
4. **Footer (new, pinned to bottom)** — a row containing the Help icon button and the profile menu trigger (existing dropdown: appearance, role preview when demo-enabled, settings link, sign out).

**Deviation (accepted during implementation):** the collapse-control toggle was originally specified as sitting *beneath* the footer row. On review of the built result, it was restored to its original floating position on the sidebar's right edge (absolutely positioned against the brand row) — its familiar location, and it reads better than a third stacked element in the footer. The footer therefore contains only the Help button and profile trigger.

**Collapsed sidebar mode:** the site-context block collapses to just its scope icon with a tooltip, matching how nav item labels already collapse. The profile trigger collapses to avatar-only. The Help icon is unaffected (already icon-only).

### Mobile/tablet strip (≤1100px)

Replaces today's `top-bar` at these widths with a single slim row:

- **Left:** compact site badge — icon + code only (e.g., building icon + "KC-NSM-042"), not the full site name text.
- **Right:** small Help icon button, followed by the profile avatar button (opens the same dropdown menu as desktop).
- No hamburger/menu-open control — the bottom tab bar's "More" button already opens the nav drawer; this strip is not a navigation trigger.

### Out of scope

- The mobile nav drawer (`mobile-sidebar`) itself is unchanged — it keeps just brand + nav groups.
- The profile dropdown menu's own contents/behavior are unchanged, only its trigger's location moves.
- No changes to routing, roles, or any screen other than `AppShell`.

## Implementation notes

- All changes are contained to `src/components/AppShell.tsx` and the corresponding rules in `src/styles.css` (`.top-bar`, `.desktop-sidebar`, and the `@media (max-width: 1100px)` block).
- Existing collapse/tooltip patterns (used by nav items today) should be reused for the new collapsed-state site-context and profile elements, rather than inventing new patterns.

## Verification

- Re-run the manual theme/visual sweep already used earlier in this session (headless Edge via `playwright-core`, screenshots across light/dark) against: desktop dashboard, desktop assessment workspace (collapsed and expanded sidebar), and mobile viewport (390×844) for the new strip + "More" drawer.
- Confirm `tsc -b` and `eslint .` stay clean.
- Confirm no regressions to QA-01 (keyboard reachability) and QA-02 (custom tooltip on icon-only controls) for the relocated Help/profile/site-context elements, since those are explicit test-case requirements in `PHASE1_TEST_CASES.md`.
