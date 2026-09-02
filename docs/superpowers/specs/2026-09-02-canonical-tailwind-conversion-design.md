# Canonical Tailwind Conversion — Design & Mapping Reference

Date: 2026-09-02
Status: approved (design + sequencing), in implementation

## Goal

Convert every component from arbitrary-value bracket utilities to canonical
Tailwind classes. The target is the style the user supplied:

```jsx
<p className="text-sm font-semibold text-kc-blue-700 dark:text-kc-blue-300">Administration</p>
<h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-slate-100">
  Master data import
</h1>
<p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
  Validate an approved KC workbook before applying requirements and hierarchy changes.
</p>
```

Rules read from that example, and binding for every file:

1. Built-in palettes (`slate`) for neutrals; a named `kc-blue-*` scale for brand.
2. Explicit `dark:` variant on every colour utility.
3. On-scale values only — no `[...]` arbitrary syntax.
4. Classes sit on the element they style, not on an ancestor via `[&_child]`.
5. Mobile-first `min-width` prefixes (`sm:`, `md:`, `lg:`).

## Decisions

**Dark mode inverts.** Today components carry no dark-mode classes: theme
variables swap under `[data-theme="dark"]`. That swapping is removed, or `dark:`
would double-invert. Dark mode becomes `dark:` variants in components.
`@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))`
already exists and is kept, so the existing ThemeProvider attribute still drives it.

**The accent switcher survives.** `kc-blue-*` is defined in `@theme` as variables
that vary with `[data-accent]` only — never with theme. Dark mode selects a
different *step* of that scale (`text-kc-blue-700 dark:text-kc-blue-300`), so
Signature blue vs KC brand blue keeps working.

**`dynamic-tailwind-recipes.ts` is deleted.** Its runtime lookup exists to attach
utilities for state modifiers. Canonical Tailwind puts those in the component as
conditional class strings. `cx()` reduces to a class-name joiner.

**Semantic marker classes are kept** (`.metric-card`, `.action-editor`). They carry
no styling; they are query hooks used by tests and the screenshot harness.

## Colour map

`--neutral-*` is exactly Tailwind's `slate` scale, so it maps 1:1.

| Token | Light | Dark |
|---|---|---|
| `--neutral-0` | `white` | `slate-950` |
| `--neutral-25` / `--neutral-50` | `slate-50` | `slate-900` |
| `--neutral-100` | `slate-100` | `slate-800` |
| `--neutral-200` (borders) | `slate-200` | `slate-700` |
| `--neutral-300` | `slate-300` | `slate-600` |
| `--neutral-400` | `slate-400` | `slate-500` |
| `--neutral-500` (muted text) | `slate-500` | `slate-400` |
| `--neutral-600` | `slate-600` | `slate-400` |
| `--neutral-700` | `slate-700` | `slate-300` |
| `--neutral-800` | `slate-800` | `slate-200` |
| `--neutral-900` (body text) | `slate-900` | `slate-100` |

Brand — `kc-blue-*` keeps the existing light ramp as its static values; dark mode
steps down the scale:

| Use | Light | Dark |
|---|---|---|
| Eyebrow / link text | `text-kc-blue-700` | `dark:text-kc-blue-300` |
| Strong brand text | `text-kc-blue-800` | `dark:text-kc-blue-200` |
| Tint surface | `bg-kc-blue-50` | `dark:bg-kc-blue-950` |
| Tint border | `border-kc-blue-200` | `dark:border-kc-blue-800` |
| Solid button | `bg-kc-blue-600` | `dark:bg-kc-blue-600` |

Status colours map to built-ins:

| Token | Light | Dark |
|---|---|---|
| success / surface / border | `emerald-700` / `emerald-50` / `emerald-200` | `emerald-300` / `emerald-950` / `emerald-800` |
| warning | `amber-700` / `amber-50` / `amber-200` | `amber-300` / `amber-950` / `amber-800` |
| danger | `red-700` / `red-50` / `red-200` | `red-300` / `red-950` / `red-800` |
| provisional | `violet-700` / `violet-50` | `violet-300` / `violet-950` |

## Type scale map

Snapping enlarges small text (0.68rem → 0.75rem, about +10%), which is the
intended consistency trade-off. Density increases slightly across dense screens.

| Current | Canonical |
|---|---|
| 0.58–0.72rem | `text-xs` |
| 0.74–0.86rem | `text-sm` |
| 0.88–1.0rem | `text-base` |
| 1.02–1.15rem | `text-lg` |
| 1.2–1.35rem | `text-xl` |
| 1.35–1.6rem | `text-2xl` |
| 1.75–2.15rem | `text-3xl` |
| `clamp(1.45rem, 2.6vw, 1.9rem)` | `text-2xl sm:text-3xl` |
| `clamp(1.75rem, 2.7vw, 2.15rem)` | `text-2xl sm:text-3xl` |

Weights: ≤450 → `font-normal`; 500–550 → `font-medium`; 600–650 → `font-semibold`;
680–750 → `font-bold`; >750 → `font-extrabold`.

## Spacing map

Nearest Tailwind step (1 unit = 4px).

| Current | Canonical | | Current | Canonical |
|---|---|---|---|---|
| 0.1–0.2rem | `0.5` | | 0.7–0.8rem | `3` |
| 0.25–0.35rem | `1` | | 0.85–0.9rem | `3.5` |
| 0.4rem | `1.5` | | 1–1.1rem | `4` |
| 0.45–0.55rem | `2` | | 1.2–1.25rem | `5` |
| 0.6–0.65rem | `2.5` | | 1.5rem | `6` |

Fixed sizes: 27px → `7`, 29px → `7`, 31px → `8`, 34px → `8`, 36px → `9`,
38px → `10`, 40px → `10`, 42px → `10`, 46px → `12`, 48px → `12`, 52px → `13`.

Radii: 6px → `rounded-md`, 10px → `rounded-lg`, 14px → `rounded-xl`,
18px → `rounded-2xl`, 24px → `rounded-3xl`, 999px → `rounded-full`.

The legacy `--radius-*` tokens are deleted: those names sit in Tailwind's own theme namespace, so
defining them in `:root` silently repointed `rounded-lg` at 14px. `--shadow-1/2/3` do not collide
(Tailwind uses `--shadow-sm/md/lg`) and are kept as the custom shadow ramp, still theme-swapped.
No component may emit `var(--radius-*)` after conversion.

## Breakpoint map

The existing six ad-hoc max-width breakpoints collapse onto Tailwind's defaults,
except the two structural ones, which keep exact values as named breakpoints so
layout behaviour is preserved.

| Current | Canonical | Note |
|---|---|---|
| `max-[620px]:` | base, reset at `sm:` (640px) | 20px boundary shift |
| `max-[720px]:` / `max-[740px]:` | base, reset at `md:` (768px) | main mobile breakpoint |
| `max-[900px]:` | base, reset at `lg:` (1024px) | 124px shift; verify tablet |
| `max-[1100px]:` | base, reset at `shell:` (1100px) | exact — sidebar/table structural |
| `max-[1500px]:` | base, reset at `wide:` (1500px) | exact — guidance column structural |

`shell` (68.75rem) already exists in `@theme`; `wide` (93.75rem) is added.

Inversion is not mechanical: `max-[740px]:[grid-template-columns:1fr]` with a
3-column base becomes `grid-cols-1 md:grid-cols-3`. Each rule is re-expressed,
not translated.

## Canonical component recipes

These patterns are duplicated inline across many files. Every occurrence must convert to the
same classes, or screens drift apart. Use these verbatim.

**Button** — base, then one variant:

```
inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-transparent
text-sm font-semibold whitespace-nowrap transition-colors
disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none
dark:disabled:bg-slate-800 dark:disabled:text-slate-500

primary    bg-kc-blue-600 text-white hover:not-disabled:bg-kc-blue-700 active:not-disabled:bg-kc-blue-800
secondary  border-slate-300 bg-white text-slate-800 hover:not-disabled:bg-slate-50
           dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:not-disabled:bg-slate-700
tertiary   bg-transparent text-kc-blue-700 hover:not-disabled:bg-kc-blue-50 hover:not-disabled:text-kc-blue-900
           dark:text-kc-blue-300 dark:hover:not-disabled:bg-kc-blue-950
danger     bg-red-700 text-white hover:not-disabled:bg-red-800

size: compact  min-h-8 px-3 text-sm  |  default  min-h-10 px-4 py-2.5  |  large  min-h-12 px-5 py-3
```

**Tinted pill / badge** (status, response, publish):

```
inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-bold
success  border-emerald-200 bg-emerald-50 text-emerald-700  dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300
warning  border-amber-200   bg-amber-50   text-amber-700    dark:border-amber-800   dark:bg-amber-950   dark:text-amber-300
danger   border-red-200     bg-red-50     text-red-700      dark:border-red-800     dark:bg-red-950     dark:text-red-300
neutral  border-slate-300   bg-slate-50   text-slate-600    dark:border-slate-600   dark:bg-slate-800   dark:text-slate-300
brand    border-kc-blue-200 bg-kc-blue-50 text-kc-blue-800  dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200
```

**Card / panel:**

```
rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900
```

**Text input / textarea / select trigger:**

```
w-full min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900
outline-none transition-colors
focus:border-kc-blue-600 focus:ring-3 focus:ring-kc-blue-100
dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-kc-blue-900
```

**Page header block** (matches the supplied example):

```
eyebrow  text-sm font-semibold text-kc-blue-700 dark:text-kc-blue-300
title    mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-slate-100
lede     mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400
```

**Avatar** — must stay square, so always set both dimensions:
`inline-grid place-items-center rounded-full border border-kc-blue-200 bg-kc-blue-50 text-xs font-bold text-kc-blue-800 dark:border-kc-blue-800 dark:bg-kc-blue-950 dark:text-kc-blue-200`
with `size-10` (38px), `size-9` (36px), `size-7` (27px), `size-13` (52px).

## Risk

The previous migration introduced about ten silent visual regressions found only
by screenshotting every screen. This conversion is larger and additionally
rewrites dark mode and responsive behaviour, so expect the same class of bug.
Highest-risk failures, in order:

1. A missing `dark:` on a colour — unreadable text in dark mode.
2. An inverted breakpoint — layout correct on desktop, broken on mobile (or vice versa).
3. A dissolved descendant selector missing a child — that child loses all styling.

## Verification

Per the approved sequencing, verification runs once at the end:

- `npm run verify` (lint, typecheck, architecture, build).
- Screenshot sweep: all three roles across every static route, at 1440/834/390px,
  in both light and dark, compared against baselines captured before conversion.
- Computed-style assertions for the classes of bug found previously: border
  colours, avatar squareness, control heights in stacked filter bars.
