# Remove Header, Fold Into Sidebar/Mobile Strip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the persistent `top-bar` header from `AppShell` at every screen size, moving site context, Help, and the profile menu into the desktop sidebar's footer and into a new slim mobile/tablet strip.

**Architecture:** All work is contained to `src/components/AppShell.tsx` and `src/styles.css`. A new `ProfileMenu` subcomponent is extracted (behavior-preserving) so it can be rendered in two places without duplicating ~50 lines of JSX. A new CSS custom property, `--content-offset`, decouples "height of the sidebar's own brand row" (`--topbar`, unchanged) from "space the main-content column must reserve above its sticky panels because a bar sits there" (`--content-offset`, which becomes `0` on desktop once the header is gone, and stays equal to the mobile strip's height on ≤1100px widths).

**Tech Stack:** React 19 + TypeScript, plain CSS custom properties (no CSS-in-JS, no Tailwind), Vite. No new dependencies.

## Global Constraints

- Do not change routing, roles/permissions, or any screen other than `AppShell` and its CSS.
- Reuse existing collapse/tooltip patterns (the ones nav items already use) for new collapsed-state elements — do not invent new interaction patterns.
- Icon-only controls must keep a custom `role="tooltip"` panel with `aria-describedby` (no native `title` attributes) — this app's design system forbids native browser tooltips (`design.md` §33, "Do not use native browser `title` bubbles for product controls").
- `npx tsc -b` and `npx eslint .` must stay clean after every task.
- The project is now a git repository on branch `main` (initialized after this plan was written; `origin` is `https://github.com/Vishwa-anandh/KC-safety.git`) — commit normally per task as the subagent-driven-development process expects.
- This project has no automated test suite (no `test` script or test framework in `package.json`) — verification is `npx tsc -b`, `npx eslint .`, and the manual browser checks each task specifies. Do not add a test framework as part of this plan; it's out of scope.

---

## File Structure

- **Modify:** `src/components/AppShell.tsx` — remove `<header className="top-bar">`; add site-context + footer to `<aside className="desktop-sidebar">`; add new `<div className="mobile-shell-strip">`; extract `ProfileMenu` as a small subcomponent in the same file (colocated — it's tightly bound to `AppShell`'s auth/theme/guided-setup hooks and isn't reused elsewhere).
- **Modify:** `src/styles.css` — new `--content-offset` variable and its consumers; new `.sidebar-context`, `.sidebar-footer`, `.mobile-shell-strip*`, `.profile-menu--up`, `.profile-button--compact` rules; remove `.top-bar*` and `.mobile-menu` rules; simplify the `.app-shell` grid to a single row.

No other files change.

---

### Task 1: Introduce `--content-offset` and repoint sticky-offset consumers

**Files:**
- Modify: `src/styles.css:110-113` (root variables), `:2316`, `:2321-2327`, `:3639-3659` (inside the `@media (max-width: 1500px)` block), `:3670-3673` and `:3788-3791` (inside the `@media (max-width: 1100px)` block), `:5462-5466`, `:5551`, `:5714-5723`, `:5729-5737`.

**Interfaces:**
- Produces: CSS variable `--content-offset`, consumed by later tasks' desktop-vs-mobile logic. For now it's a pure refactor — `--content-offset` is defined equal to `var(--topbar)` everywhere, so nothing visually changes yet.

- [ ] **Step 1: Add the variable, defaulting to the current `--topbar` value**

In `src/styles.css`, inside the base `:root { ... }` block, right after the existing `--topbar: 72px;` line, add:

```css
  --topbar: 72px;
  --content-offset: var(--topbar);
```

Inside the existing `@media (max-width: 1100px) { :root { --topbar: 66px; } }` block, add the same line so the mobile tier keeps matching:

```css
@media (max-width: 1100px) {
  :root {
    --topbar: 66px;
    --content-offset: var(--topbar);
  }
```

- [ ] **Step 2: Swap every "space reserved above sticky main-content panels" consumer from `--topbar` to `--content-offset`**

Change these exact rules (values are unchanged — only the variable name changes):

`.requirement-layout` (around line 2316):
```css
.requirement-layout {
  display: grid;
  width: min(1600px, 100%);
  min-width: 0;
  min-height: calc(100vh - var(--content-offset));
  margin: 0 auto;
  grid-template-columns: 270px minmax(540px, 1fr) 320px;
}
```

`.requirement-layout__navigator, .requirement-layout__guidance` (around line 2321):
```css
.requirement-layout__navigator,
.requirement-layout__guidance {
  position: sticky;
  top: var(--content-offset);
  height: calc(100vh - var(--content-offset));
  align-self: start;
}
```

Inside `@media (max-width: 1500px)`, the `.requirement-mobile-toolbar` rule (around line 3639-3650):
```css
  .requirement-mobile-toolbar {
    position: sticky;
    z-index: 8;
    top: var(--content-offset);
    display: flex;
    justify-content: flex-end;
    gap: 0.55rem;
    border-bottom: 1px solid var(--neutral-200);
    background: var(--surface-mobile-bar);
    padding: 0.55rem 1rem;
    backdrop-filter: blur(15px);
  }
```

And, still inside that same `@media (max-width: 1500px)` block, `.requirement-layout__navigator` (around line 3656-3659):
```css
  .requirement-layout__navigator {
    top: calc(var(--content-offset) + 55px);
    height: calc(100vh - var(--content-offset) - 55px);
  }
```

Inside `@media (max-width: 1100px)`, the second `.requirement-mobile-toolbar` override (around line 3788-3791):
```css
  .requirement-mobile-toolbar {
    top: var(--content-offset);
    justify-content: space-between;
  }
```

`.settings-index` and `.settings-section` base rules (around line 5462-5466 and 5551):
```css
.settings-index {
  position: sticky;
  top: calc(var(--content-offset) + 1rem);
  display: grid;
  max-height: calc(100vh - var(--content-offset) - 2rem);
  gap: 0.7rem;
  overflow: hidden auto;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  background: var(--surface-panel);
  box-shadow: var(--shadow-1);
  padding: 0.7rem;
}
```
```css
.settings-section { scroll-margin-top: calc(var(--content-offset) + 1rem); }
```

Inside `@media (max-width: 900px)` (around line 5716 and 5723):
```css
  .settings-index { z-index: 15; top: calc(var(--content-offset) + 0.5rem); display: grid; max-height: none; overflow: visible; border-radius: 16px; }
```
```css
  .settings-section { scroll-margin-top: calc(var(--content-offset) + 145px); }
```

Inside `@media (max-width: 620px)` (around line 5733 and 5737):
```css
  .settings-index { top: calc(var(--content-offset) + 0.35rem); border-radius: 14px; padding: 0.55rem; }
```
```css
  .settings-section { scroll-margin-top: calc(var(--content-offset) + 130px); }
```

Do **not** change `.brand-lockup` (`height: var(--topbar)`) or `.collapse-control` (`top: calc(var(--topbar) - 16px)`) — those size the sidebar's own brand row and are unaffected by this refactor.

- [ ] **Step 3: Verify nothing changed**

Run:
```bash
npx tsc -b && npx eslint .
```
Expected: both clean (this is a pure CSS variable rename with identical resolved values).

Start the dev server and diff a couple of screenshots against the current build to confirm pixel parity:
```bash
npm run dev -- --port 5183 --strictPort &
```
Load `/assessment/leadership/leadership-accountability` (as the Site user demo account) and `/settings` (as any account) at 1440px and at 390px, and confirm the assessment navigator/guidance columns and the settings sticky index sit exactly where they did before.

---

### Task 2: Extract a reusable `ProfileMenu` subcomponent (behavior-preserving)

**Files:**
- Modify: `src/components/AppShell.tsx` (replace the inline profile-menu JSX/state currently inside `AppShell` with a call to a new `ProfileMenu` component defined in the same file).

**Interfaces:**
- Produces: `function ProfileMenu({ compact = false, menuPlacement = "down" }: { compact?: boolean; menuPlacement?: "down" | "up" }): JSX.Element` — a fully self-contained component (calls `useAuth()`, `useGuidedSetup()`, `useTheme()`, `useNavigate()` itself; takes no data props). Later tasks render additional instances of it.
- Consumes: existing `useAuth`, `useGuidedSetup`, `useTheme`, `roleProfiles`, `cx`, and the icon imports already present in `AppShell.tsx` (`ChevronDown`, `Settings`, `LogOut`, `PlayCircle`).

- [ ] **Step 1: Add the `ProfileMenu` component above `export default function AppShell`**

```tsx
function ProfileMenu({ compact = false, menuPlacement = "down" }: { compact?: boolean; menuPlacement?: "down" | "up" }) {
  const { role, profile, changeRole, startTour } = useGuidedSetup();
  const { user, demoEnabled, signOut } = useAuth();
  const { preference, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="profile-menu-wrap" ref={wrapRef}>
      <button
        className={cx("profile-button", compact && "profile-button--compact")}
        aria-label="Open profile menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="avatar">{profile.initials}</span>
        <span className="profile-button__copy">
          <strong>{profile.name}</strong>
          <small>{profile.label}</small>
        </span>
        <ChevronDown className={cx("profile-button__chevron", open && "profile-button__chevron--open")} size={16} />
      </button>

      {open && (
        <div id={menuId} className={cx("profile-menu", menuPlacement === "up" && "profile-menu--up")} role="dialog" aria-label="Profile and appearance">
          <div className="profile-menu__identity">
            <span className="avatar">{profile.initials}</span>
            <div>
              <strong>{profile.name}</strong>
              <span>{profile.label}</span>
            </div>
          </div>
          <div className="profile-menu__section">
            <div className="profile-menu__section-heading">
              <span>Appearance</span>
              <small>{preference === "system" ? `${resolvedTheme} from system` : `${preference} selected`}</small>
            </div>
            <ThemeSelector compact />
          </div>
          {demoEnabled && (
            <div className="profile-menu__section profile-role-section">
              <div className="profile-menu__section-heading"><span>Preview role</span><small>Local demonstration</small></div>
              <div className="profile-role-options">
                {(Object.values(roleProfiles) as Array<(typeof roleProfiles)[UserRole]>).map((option) => {
                  const Icon = option.icon;
                  return (
                    <button key={option.id} className={cx(role === option.id && "profile-role-option--selected")} onClick={() => { changeRole(option.id); setOpen(false); }} aria-pressed={role === option.id}>
                      <Icon size={16} />
                      <span>{option.shortLabel}</span>
                      {role === option.id && <span className="profile-role-check">Current</span>}
                    </button>
                  );
                })}
              </div>
              <button className="profile-setup-action" onClick={() => { startTour(role, true); setOpen(false); }}>
                <PlayCircle size={17} />
                <span>Replay guided setup</span>
              </button>
            </div>
          )}
          <div className="profile-menu__section profile-menu__session">
            <Link to="/settings" onClick={() => setOpen(false)}><Settings size={17} /><span>Open settings</span></Link>
            <button type="button" onClick={() => { signOut(); setOpen(false); navigate("/login", { replace: true }); }}>
              <LogOut size={17} />
              <span>Sign out {user?.name ? `as ${user.name}` : ""}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace the inline profile-menu block inside `AppShell`'s `top-bar` with `<ProfileMenu />`**

In `AppShell`, delete the `profileOpen`/`setProfileOpen`/`profileMenuId`/`profileMenuRef` state and the `useEffect` that closes it on outside click/Escape (this logic now lives inside `ProfileMenu`). Replace the whole `<div className="profile-menu-wrap" ref={profileMenuRef}>...</div>` block (the one currently inside `<div className="top-bar__actions">`) with:

```tsx
<ProfileMenu />
```

`changeRole` and `startTour` were only used inside that block, and `ProfileMenu` now calls `useGuidedSetup()` itself to get its own copies — so change `AppShell`'s own destructure from:
```tsx
const { role, profile, changeRole, startTour, openHelp } = useGuidedSetup();
```
to:
```tsx
const { role, profile, openHelp } = useGuidedSetup();
```
(`role`, `profile`, and `openHelp` are still used elsewhere in `AppShell` — nav filtering, scope icon/text, and the Help button — so keep those three.) Skipping this rename leaves `changeRole`/`startTour` unused in `AppShell`, which `eslint`'s unused-vars rule will flag.

- [ ] **Step 3: Verify identical behavior**

```bash
npx tsc -b && npx eslint .
```
Expected: clean.

Manually click the profile button in the top-right (unchanged location, since this task only extracts the component — it doesn't move it yet): confirm it opens/closes, closes on outside click and Escape, theme selector still switches theme, role-preview buttons still switch role (demo mode), "Open settings" navigates, "Sign out" signs out and redirects to `/login`.

---

### Task 3: Desktop sidebar — add site context and a footer (Help, profile, collapse)

**Files:**
- Modify: `src/components/AppShell.tsx` (add site-context block and footer inside `<aside className="desktop-sidebar">`; keep the existing header untouched for now — this task is additive).
- Modify: `src/styles.css` (new `.sidebar-context`, `.sidebar-footer`, `.profile-menu--up`, `.profile-button--compact` rules; collapsed-mode handling).

**Interfaces:**
- Consumes: `ProfileMenu` from Task 2.
- Produces: `.sidebar-context`, `.sidebar-footer` CSS classes used again in later tasks' cleanup pass.

- [ ] **Step 1: Add the site-context block to the sidebar, right after the brand lockup**

In `AppShell.tsx`, inside `<aside className="desktop-sidebar">`, immediately after the closing `</div>` of `.brand-lockup` and before `<SideNav ... />`, add:

```tsx
<div className={cx("site-context", "sidebar-context")} aria-label={role === "site-contributor" ? "Current assigned site" : "Current authorized scope"}>
  <ScopeIcon size={17} />
  <div>
    <span>{role === "site-contributor" ? "Assigned site" : "Authorized scope"}</span>
    <strong>{role === "site-contributor" ? assignedSite.name : profile.scope}</strong>
  </div>
  {role === "site-contributor" && <span className="site-context__code">{assignedSite.code}</span>}
  <span className="nav-item__tooltip">{role === "site-contributor" ? `${assignedSite.name} · ${assignedSite.code}` : profile.scope}</span>
</div>
```

(`ScopeIcon` is already computed earlier in `AppShell` as `const ScopeIcon = role === "site-contributor" ? Building2 : role === "enterprise-viewer" ? BarChart3 : ShieldCheck;` — no change needed there.)

- [ ] **Step 2: Add the footer (Help, profile, collapse) at the bottom of the sidebar**

Still inside `<aside className="desktop-sidebar">`, move the existing `<button className="collapse-control">...</button>` so it is nested inside a new wrapping `<div className="sidebar-footer">`, placed after `<SideNav ... />` (it should now be the last children of `.desktop-sidebar`, in this order: brand lockup → site context → `SideNav` → `sidebar-footer`):

```tsx
<div className="sidebar-footer">
  <div className="sidebar-footer__row">
    <IconButton
      label="Help and guided setup"
      onClick={openHelp}
      tooltipPlacement="right"
      data-tour="help"
    >
      <CircleHelp size={20} />
    </IconButton>
    <ProfileMenu menuPlacement="up" />
  </div>
  <button
    className="collapse-control"
    onClick={() => setCollapsed((value) => !value)}
    aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
    aria-describedby={collapseTooltipId}
    aria-expanded={!collapsed}
  >
    <span className="collapse-control__icons" aria-hidden="true">
      <PanelLeftClose className="collapse-control__icon collapse-control__icon--close" size={19} />
      <PanelLeftOpen className="collapse-control__icon collapse-control__icon--open" size={19} />
    </span>
    <span id={collapseTooltipId} className="app-tooltip app-tooltip--right" role="tooltip">
      {collapsed ? "Expand navigation" : "Collapse navigation"}
    </span>
  </button>
</div>
```

This duplicates the Help icon button (the original one still lives in `top-bar__actions` for now — that's expected and temporary; Task 5 removes the original).

- [ ] **Step 3: Add the CSS**

Append to `src/styles.css` (near the existing `.collapse-control*` rules, since they're related):

```css
.sidebar-context {
  margin: 0.85rem 1.15rem 0.35rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--nav-border);
  border-radius: var(--radius-md);
  background: rgb(255 255 255 / 0.04);
  color: var(--nav-text);
  transition: padding var(--motion-sidebar), margin var(--motion-sidebar);
}

.sidebar-context > svg {
  color: var(--nav-accent);
}

.sidebar-context span {
  color: var(--nav-text-muted);
}

.sidebar-context strong {
  color: var(--nav-text-strong);
}

.sidebar-context .site-context__code {
  border-left-color: var(--nav-divider);
  color: var(--nav-text);
}

.app-shell--collapsed .desktop-sidebar .sidebar-context {
  position: relative;
  display: grid;
  place-items: center;
  margin-inline: 0.65rem;
  padding: 0.55rem;
}

.app-shell--collapsed .desktop-sidebar .sidebar-context > div,
.app-shell--collapsed .desktop-sidebar .sidebar-context > .site-context__code {
  display: none;
}

.app-shell--collapsed .desktop-sidebar .sidebar-context:hover .nav-item__tooltip,
.app-shell--collapsed .desktop-sidebar .sidebar-context:focus-within .nav-item__tooltip {
  opacity: 1;
  transform: translate(0, -50%);
  visibility: visible;
  transition-delay: 180ms, 180ms, 0ms;
}

.sidebar-footer {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
  padding: 0.85rem 1.15rem;
  border-top: 1px solid var(--nav-divider);
  transition: padding var(--motion-sidebar);
}

.sidebar-footer__row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.4rem;
}

.sidebar-footer__row .profile-menu-wrap {
  min-width: 0;
  flex: 1;
}

.sidebar-footer__row .profile-button {
  width: 100%;
  color: var(--nav-text);
}

.sidebar-footer__row .profile-button:hover {
  background: var(--nav-hover);
}

.sidebar-footer__row .profile-button__copy strong {
  color: var(--nav-text-strong);
}

.sidebar-footer__row .profile-button__copy small {
  color: var(--nav-text-muted);
}

.sidebar-footer .collapse-control {
  position: static;
  align-self: flex-start;
  box-shadow: none;
}

.profile-menu--up {
  top: auto;
  right: auto;
  bottom: calc(100% + 0.65rem);
  left: 0;
  animation-name: profile-menu-in-up;
}

@keyframes profile-menu-in-up {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
}

.profile-button--compact .profile-button__copy,
.profile-button--compact .profile-button__chevron {
  display: none;
}

.profile-button--compact {
  min-height: auto;
  padding: 0;
  gap: 0;
}

.app-shell--collapsed .desktop-sidebar .sidebar-footer__row {
  flex-direction: column;
}

.app-shell--collapsed .desktop-sidebar .profile-button__copy,
.app-shell--collapsed .desktop-sidebar .profile-button__chevron {
  display: none;
}

.app-shell--collapsed .desktop-sidebar .profile-button {
  justify-content: center;
  padding: 0.25rem;
}
```

- [ ] **Step 4: Verify**

```bash
npx tsc -b && npx eslint .
```
Expected: clean.

Start the dev server, sign in as each demo role, and at a desktop width (1440px):
- Confirm the sidebar now shows the assigned-site/authorized-scope block under the logo, and a footer with a Help icon + profile button + collapse toggle at the bottom.
- Collapse the sidebar (the toggle button) and confirm the site-context block shrinks to just its icon with a tooltip on hover, and the profile button shrinks to avatar-only.
- Open the sidebar's new profile menu (bottom-left, opens **upward**) and confirm it behaves like the still-present top-right one from Task 2 (theme switch, role preview, settings link, sign out).
- The original header (site context, Help, profile) is still visible at the top — that duplication is expected here and is resolved in Task 5.

---

### Task 4: Mobile/tablet — add the slim strip, retire the header at ≤1100px

**Files:**
- Modify: `src/components/AppShell.tsx` (add `<div className="mobile-shell-strip">`).
- Modify: `src/styles.css` (new `.mobile-shell-strip*` rules; hide `.top-bar` only inside the existing `@media (max-width: 1100px)` block).

**Interfaces:**
- Consumes: `ProfileMenu` (Task 2), `.sidebar-context`'s sibling site-badge concept (new, compact variant specific to this strip).

- [ ] **Step 1: Add the strip markup**

In `AppShell.tsx`, add this immediately before the existing `<header className="top-bar">` element (same nesting level, both are direct children of the outer `.app-shell` div, alongside `.desktop-sidebar` and `.mobile-nav-layer`):

```tsx
<div className="mobile-shell-strip">
  <div className="mobile-shell-strip__badge" aria-label={role === "site-contributor" ? "Current assigned site" : "Current authorized scope"}>
    <ScopeIcon size={16} />
    <span>{role === "site-contributor" ? assignedSite.code : profile.scope}</span>
  </div>
  <div className="mobile-shell-strip__actions">
    <IconButton label="Help and guided setup" onClick={openHelp} tooltipPlacement="bottom" data-tour="help">
      <CircleHelp size={18} />
    </IconButton>
    <ProfileMenu compact />
  </div>
</div>
```

(`data-tour="help"` matches the original header's Help button and the sidebar footer's copy from Task 3 — `firstVisibleTarget` in `GuidedSetup.tsx` already picks whichever matching element is actually visible, so having the same `data-tour` value on both the sidebar and strip versions is correct, not a conflict.)

- [ ] **Step 2: Add the CSS — hidden on desktop, shown and sticky at ≤1100px**

```css
.mobile-shell-strip {
  display: none;
}

@media (max-width: 1100px) {
  .mobile-shell-strip {
    position: sticky;
    z-index: 15;
    top: 0;
    display: flex;
    height: var(--topbar);
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0 1rem;
    border-bottom: 1px solid var(--border-translucent);
    background: var(--surface-topbar);
    box-shadow: 0 1px 8px rgb(15 23 42 / 0.03);
    backdrop-filter: blur(18px) saturate(140%);
  }

  .mobile-shell-strip__badge {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.45rem;
    overflow: hidden;
    color: var(--neutral-700);
    font-size: 0.78rem;
    font-weight: 650;
    white-space: nowrap;
  }

  .mobile-shell-strip__badge > svg {
    flex: 0 0 auto;
    color: var(--kc-700);
  }

  .mobile-shell-strip__actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.35rem;
  }

  .mobile-shell-strip__actions .icon-button > .app-tooltip--bottom {
    right: 0;
    left: auto;
    transform: translate(0, -4px);
  }

  .mobile-shell-strip__actions .icon-button > .app-tooltip--bottom::after {
    right: 14px;
    left: auto;
  }

  .mobile-shell-strip__actions .icon-button:hover > .app-tooltip--bottom,
  .mobile-shell-strip__actions .icon-button:focus-visible > .app-tooltip--bottom {
    transform: translate(0, 0);
  }
}
```

- [ ] **Step 3: Hide the old header only at ≤1100px (it's fully replaced there now)**

Inside the existing `@media (max-width: 1100px) { ... }` block (the one already handling `.desktop-sidebar { display: none; }`), change the existing:

```css
  .top-bar {
    grid-column: auto;
    padding: 0 1rem;
  }
```

to:

```css
  .top-bar {
    display: none;
  }
```

- [ ] **Step 4: Verify**

```bash
npx tsc -b && npx eslint .
```
Expected: clean.

At a mobile viewport (390×844) and a tablet viewport (768×1024), for each demo role:
- Confirm the old header is gone and the new strip shows: a compact site/scope badge on the left, and a Help icon + avatar button on the right.
- Tap the Help icon: opens the Help dialog. Tap the avatar: opens the profile menu (downward, since `menuPlacement` defaults to `"down"`), with working theme switch / role preview / settings / sign out.
- Confirm the bottom tab bar and the "More" drawer still work exactly as before (untouched by this task).
- At desktop width (1440px), confirm nothing changed from Task 3's state (strip stays hidden; header and new sidebar blocks both still visible — that remaining duplication is resolved next).

---

### Task 5: Remove the header everywhere, finalize desktop layout, clean up

**Files:**
- Modify: `src/components/AppShell.tsx` (delete the `<header className="top-bar">` element and its now-unused `mobile-menu` IconButton entirely).
- Modify: `src/styles.css` (delete `.top-bar`, `.top-bar__left`, `.top-bar__actions` and their tooltip-placement overrides, `.mobile-menu`; simplify `.app-shell` grid to a single row; flip the root `--content-offset` default to `0`).

**Interfaces:** none — this is the final cleanup task; nothing downstream depends on it.

- [ ] **Step 1: Delete the header JSX**

In `AppShell.tsx`, delete the entire `<header className="top-bar">...</header>` block (everything from `<header className="top-bar">` through its matching `</header>`, including the `mobile-menu` `IconButton`, the old `.site-context` div, the standalone Help `IconButton`, and the old `<div className="profile-menu-wrap">`/`<ProfileMenu />` instance it contained from Task 2/3).

That `IconButton` was the only place `Menu` (from `lucide-react`) was used in this file — remove `Menu` from the `lucide-react` import list at the top of `AppShell.tsx`, or `eslint` will flag it as an unused import. (`MoreHorizontal`, used by the bottom tab bar's "More" button, is unrelated and stays.)

- [ ] **Step 2: Delete the now-dead CSS**

Remove these rulesets from `src/styles.css` entirely:
- `.top-bar { ... }`
- `.top-bar__left, .top-bar__actions { ... }`
- `.top-bar__actions .icon-button > .app-tooltip--bottom { ... }`
- `.top-bar__actions .icon-button > .app-tooltip--bottom::after { ... }`
- `.top-bar__actions .icon-button:hover > .app-tooltip--bottom, .top-bar__actions .icon-button:focus-visible > .app-tooltip--bottom { ... }`
- `.mobile-menu { display: none; }` (both the base rule and the one inside `@media (max-width: 1100px)`)
- Inside `@media (max-width: 1100px)`: the `.top-bar { display: none; }` rule added in Task 4 (no longer needed — the element doesn't exist)
- Inside `@media (max-width: 740px)`: the block that reads
  ```css
  .top-bar {
    gap: 0.4rem;
    padding-inline: 0.65rem;
  }

  .site-context {
    gap: 0.45rem;
  }

  .site-context__code,
  .site-context > div > span,
  .top-bar__actions > .icon-button {
    display: none;
  }

  .site-context strong {
    max-width: 44vw;
  }

  .profile-button {
    padding: 0;
  }

  .avatar {
    width: 36px;
    height: 36px;
    flex-basis: 36px;
  }
  ```
  Remove it — the mobile strip built in Task 4 is already compact by design at every width ≤1100px, so this extra ≤740px narrowing (which targeted the old header) no longer applies to anything.
- Inside the big `@media (max-width: 1100px)` block (the same one already handling `.mobile-sidebar`, `.bottom-tab-bar`, etc. — see the rule matched at `src/styles.css:3766-3770` before Task 1-4 edits): remove
  ```css
  .profile-button__copy,
  .profile-button > svg:last-child,
  .top-bar__actions > .save-status {
    display: none;
  }
  ```
  This was the old width-based way of making the profile button compact; it's superseded by the explicit `.profile-button--compact` class used by `<ProfileMenu compact />` in the mobile strip.

- [ ] **Step 3: Simplify the `.app-shell` grid to one row**

Change:
```css
.app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns: var(--sidebar) minmax(0, 1fr);
  grid-template-rows: var(--topbar) minmax(0, 1fr);
  transition: grid-template-columns var(--motion-sidebar);
}
```
to:
```css
.app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns: var(--sidebar) minmax(0, 1fr);
  transition: grid-template-columns var(--motion-sidebar);
}
```

Change:
```css
.desktop-sidebar {
  position: sticky;
  z-index: 20;
  top: 0;
  display: flex;
  height: 100vh;
  grid-column: 1;
  grid-row: 1 / 3;
  ...
}
```
to `grid-row: 1;` (single row now).

Change:
```css
.main-content {
  min-width: 0;
  grid-column: 2;
  grid-row: 2;
}
```
to `grid-row: 1;`.

- [ ] **Step 4: Set the desktop default for `--content-offset` to `0`**

In the base `:root { ... }` block, change:
```css
  --content-offset: var(--topbar);
```
to:
```css
  --content-offset: 0px;
```
Leave the `@media (max-width: 1100px) { :root { --content-offset: var(--topbar); } }` override from Task 1 exactly as-is — mobile/tablet still has the sticky strip from Task 4, so it still needs to reserve that space.

- [ ] **Step 5: Full verification sweep**

```bash
npx tsc -b && npx eslint .
```
Expected: both clean, zero errors.

Start the dev server:
```bash
npm run dev -- --port 5183 --strictPort &
```

At desktop width (1440px), for each of the three demo roles:
- Confirm there is no header row at all — the sidebar starts flush at the top of the viewport, and the main content area starts flush too (no dead blank strip where the old header used to be, no double space).
- Confirm the assessment workspace's sticky navigator/guidance columns and the settings sticky index still line up correctly against the viewport top (this is what Task 1's `--content-offset` refactor and this task's flip to `0` are protecting).
- Confirm the sidebar footer (Help + profile + collapse) still works, in both expanded and collapsed sidebar states.

At mobile (390×844) and tablet (768×1024) widths, for each role:
- Confirm the slim strip from Task 4 is the only thing at the top, the bottom tab bar and "More" drawer work, and nothing regressed from Task 4's checks.

Re-run the manual light/dark screenshot sweep used earlier in this project's session (headless Edge via `playwright-core`, `page.emulateMedia({ colorScheme })`) across: Login, Dashboard, Admin imports, Settings, Overview, Owners dialog, Assessment home, and the Requirement workspace — confirm the sidebar/strip render correctly in both themes with no unstyled or invisible elements.

Confirm keyboard reachability (QA-01) and tooltip behavior (QA-02) for the relocated controls: Tab to the sidebar's Help button and profile button (and, when collapsed, the site-context block) — each should show a visible focus ring and, where applicable, its custom tooltip.
