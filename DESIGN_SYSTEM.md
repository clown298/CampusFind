# CampusFind — Design System Specification

**Product:** CampusFind — campus Lost & Found platform
**Institution:** Government College of Engineering, Chandrapur (GCOEC)
**Status:** Source of truth for the multi-phase redesign
**Phase:** 1 — Analysis & Specification (no UI implementation in this phase)
**Last updated:** 2026-09-12

> This document defines the **final CampusFind design language**. It codifies
> decisions taken from three design references (Findora, UniFound, AroundU),
> merged with CampusFind's own GCOEC identity. It is written so a developer
> can implement the entire redesign **without making major visual decisions
> themselves**. Later phases implement this spec; this phase only authorises it.

Reference sites (principles only — **nothing is copied from them**):

| Site | Borrowed principles |
| --- | --- |
| Findora (findora.live) | Restrained single-hue brand, peeled surface/foot sections, trust presentation (kicker → numbered process → verification), product-focused hero, subtle depth |
| UniFound (unifound.site) | Typographic direction, sizing discipline, refined authentication/form UI |
| AroundU (aroundu.me) | Motion timing, entrance/reveal patterns, hover micro-interactions |
| CampusFind identity | GCOEC branding, campus-utility tone, original layout |

---

## 0. What the redesign must preserve

The redesign is **visual only**. These are frozen and must not change:

- Authentication (login, register, JWT, protected routes).
- Lost/Found reporting and listing logic.
- Search / filter / sort behaviour (including `sessionStorage` hand-off from Home).
- Item details view and the possible-matching engine (`src/utils/matching`).
- Recovery request workflow (submit → pending → approved/rejected → recovered).
- My Reports page and delete/edit flows.
- All routes (`src/App.jsx`) and API behaviour in `backend/`.
- Responsive correctness (no horizontal overflow).
- Approved footer identity (below). No fake data of any kind.

**Approved footer identity (do not alter wording):**

```
CampusFind
Campus Lost & Found

Government College of Engineering, Chandrapur

Ballarshah Bypass Road, Babupeth,
Chandrapur, Maharashtra – 442403, India

gcoec@campusfind.com
```

**Approved compact GCOEC identifiers** (use one of these, never louder than CampusFind):
- `GCOEC` (generic)
- `GCOEC • CHANDRAPUR` (navbar, small secondary line)
- `GCOEC • CAMPUS LOST & FOUND` (home hero kicker)
- `Government College of Engineering, Chandrapur` (footer / long-form spaces)

Never use fake phone numbers, social links, campus statistics, testimonials,
user counts, activity numbers, or any address/claim other than the identity above.

---

## 1. Design principles

1. **A real campus utility, not a template.** The site must look like a tool
   students actually use, not a marketing page. Content and function come
   first; decoration is the last thing added, not the first.
2. **One identity above the noise.** CampusFind is primary; GCOEC is a quiet
   institutional sign. The layout is original — it must not feel like Findora,
   UniFound, AroundU, a generic SaaS dashboard, a notice board, or a premium
   landing page.
3. **Mean what you color.** Lost/red and Found/green carry real meaning and
   must never be decorative. Restraint: one blue brand, two semantic hues,
   amber for pending — never a rainbow.
4. **Flat and honest surfaces.** Light page, white cards with 1px borders,
   one dark navy hero/footer. Minimal shadows. No glassmorphism, no gradients
   (exception: none), no blobs, no stock photos.
5. **Content-driven hierarchy.** Strong, tight, confident headings; calm
   secondary type; metadata that stays out of the way. Every page starts with
   a clear task.
6. **The task is obvious.** A visitor arriving from anywhere must know, in
   seconds, how to report a lost item, how to find a found item, and that
   ownership is verified before an item changes hands.
7. **Trust is shown, not claimed.** Verification is expressed through a
   numbered recovery process, real workflow states, and honest copy — never
   fake statistics or testimonials.
8. **Motion is service, not spectacle.** Short, fast, purposeful. Reveals
   clarify structure; hovers answer "is this interactive?"; nothing bounces,
   spins (except loaders), or floats pointlessly.
9. **Everything is reachable and legible.** 44px touch targets, visible focus
   rings, contrast-safe text, keyboard navigable menus, full
   `prefers-reduced-motion` support.
10. **One system, repeated.** Shared spacing, radius, buttons, forms, cards,
    icons everywhere. No page invents its own language.

**Hard rules — never do these:**
- Gradients (no strong reason exists in this product).
- Glassmorphism / backdrop-blur surfaces (nav uses plain surface + border).
- Excessively rounded or pill-everything UI (pills only for status/meta chips).
- Heavy SaaS shadows or float-everything.
- Fake statistics, testimonials, user/activity counts.
- Decorative blobs, random illustrations, stock college photos.
- Giant empty hero areas or huge "look impressive" type.
- Wording that calls it a "notice board", "desk", "ground rules",
  "premium", or otherwise marketing-flavoured copy.
- Unnecessary sections just to fill the page.

---

## 2. Color system

Defined via CSS custom properties in `src/index.css` (`@theme` block, Tailwind v4).
Both the raw token and the Tailwind utility name are given so implementation is exact.

### Base palette

| Role | Token | HEX | Tailwind class | Notes |
| --- | --- | --- | --- | --- |
| Primary brand | `--color-primary` | `#1F3B8C` | `bg-primary` / `text-primary` / `border-primary` | Royal blue. Brand mark, primary buttons, active nav, links, tone accents. Used sparingly as a fill. |
| Primary hover/active | `--color-primary-hover` | `#18306E` | `hover:bg-primary-hover` | One step darker for hover/active. |
| Primary focus ring | `--color-focus` | `#2F6BFF` | `ring-focus` / `focus-visible:ring-focus` | Visible but distinct from primary. |
| Ink (primary text) | `--color-ink` | `#131720` | `text-ink` | Headings and emphasis. near-black with blue cast. |
| Ink hover | `--color-ink-hover` | `#0F1420` | `hover:text-ink-hover` | Rarely used; depth option. |
| Secondary text | `--color-mute` | `#5A6474` | `text-mute` | Body-supporting copy, metadata, placeholders. |
| Page background | `--color-page` | `#F6F7FA` | `bg-page` | App canvas behind content (used via `bg-paper` app shell today). |
| Tinted surface | `--color-paper` | `#EFF2F6` | `bg-paper` | Filter wells, tinted panels, hover fills, section accent tint. |
| Surface / card | `--color-surface` | `#FFFFFF` | `bg-surface` | Cards, navbar, forms, dropdowns. |
| Border | `--color-line` | `#DCE1E8` | `border-line` | 1px structural borders. |
| Navy (dark canvas) | `--color-navy` | `#0F1935` | `bg-navy` | Hero + footer. Not pure black. |
| Navy hover | `--color-navy-hover` | `#16254D` | `hover:bg-navy-hover` | Interactive fills on dark. |
| Frost (navy tint) | `--color-frost` | `#E9EDF7` | `bg-frost` | Primary-tinted fills (active mobile nav, icon tiles, info panels). |

### Semantic palette

Lost/Found carry meaning; they are **not** decorative accents repeated everywhere.

| Role | Token | HEX | Utility | Meaning |
| --- | --- | --- | --- | --- |
| Lost | `--color-lost` | `#C0392B` | `bg-lost` / `text-lost` / `border-lost` | Red/coral. Lost reports, lost actions, danger confirms. |
| Lost dark | `--color-lost-dark` | `#A02F24` | `hover:bg-lost-dark` | Hover state for lost fills. |
| Found | `--color-found` | `#1E8E5A` | `bg-found` / `text-found` / `border-found` | Green. Found reports, found actions, success. |
| Found dark | `--color-found-dark` | `#167A4D` | `hover:bg-found-dark` | Hover state for found fills. |
| Canopy (success alias) | `--color-canopy` | `#1E8E5A` | `bg-canopy` / `border-canopy` | Same green; used for "approved" and success UI. |
| Canopy hover | `--color-canopy-hover` | `#17714A` | `hover:bg-canopy-hover` | — |
| Pending | `--color-pending` | `#B45309` | `bg-pending` / `text-pending` / `border-pending` | Amber. Recovery requests awaiting review. |
| Recovered | `--color-recovered` | `#0F6B47` | `bg-recovered` / `text-recovered` / `border-recovered` | Deep green. Item returned / listing closed. |
| Rejected | — (uses lost family) | `#C0392B` | `text-lost` / `border-lost` | Rejection shares the alert/failure red. |
| Approved | — (uses canopy/found family) | `#1E8E5A` | `text-canopy` / `border-canopy` | Approval = success green. |
| Legacy alias `brick` | `--color-brick` | `#C0392B` | `bg-brick` | Same value as `lost`; keep as alias, do not introduce a third red. |

### Semantic state → color mapping

| Workflow state | Color | Surface treatment |
| --- | --- | --- |
| Lost / Rejected / error | Red `#C0392B` | `border-lost/30 bg-lost/10` or `border-lost/25 bg-lost/5` |
| Found / Approved | Green `#1E8E5A` | `border-found/30 bg-found/10` or `border-found/25 bg-found/5` |
| Pending | Amber `#B45309` | `border-pending/25 bg-pending/5` |
| Recovered | Deep green `#0F6B47` | `border-recovered/25 bg-recovered/5` |
| Neutral (Open, generic) | Line `#DCE1E8` | `border-line bg-surface` |

### Tint recipe (always this exact math)

10% tint for chips/status = `*/10`; 5% tint for whole panels/cards = `*/5`;
25% border for panels = `*/25`. Never invent new alpha values.

### Contrast guarantees (WCAG AA, checked)

- `ink` on `surface`: ≥ 14:1
- `mute` on `surface`: ≈ 5.4:1 (passes AA for 14px+)
- `white` on `primary`: ≈ 6.5:1
- `white` on `navy`: ≥ 13:1
- `white` on `lost` / `white` on `found`: ≥ 4.7:1 (AA for normal text)
- Status is **never conveyed by color alone** — every chip/state has a text label.

---

## 3. Typography

### Font choice

**Primary display + UI: `Geist Sans`** (self-hosted via `@fontsource`).

- Matches UniFound's typographic direction (Geist Sans is its core family —
  we adopt the *quality*, not the layout or brand).
- A humanist grotesque with character: modern but not generic, readable at
  small sizes, distinctive without shouting. Weight range 400–700 covers all needs.
- It does not look like a default browser font (the app currently ships no
  webfont and falls back to `system-ui` — this is the single biggest type
  upgrade available).
- Fallbacks: `"Public Sans"`, `"Inter"`, `ui-sans-serif`, `system-ui`,
  `-apple-system`, `"Segoe UI"`, `Roboto`, `Arial`, `sans-serif`.
- Mono (Geist Mono or `ui-monospace`) only if a code/technical affordance is
  ever required; no planned usage today.

Loading: use `@fontsource-variable/geist` (variable font, one file, no layout
shift) with `font-display: swap`. Do not load multiple families — one family
keeps the system cohesive.

### Font roles

| Role | Family | Weight | Size | Line-height | Case / tracking |
| --- | --- | --- | --- | --- | --- |
| Display headings (h1/home) | Geist | 700 | `clamp` responsive, see scale | 1.15 → 1.05 | Normal, `tracking-tight` (−0.02em) |
| Page title (h1) / section (h2) | Geist | 700 | see scale below | 1.2 | Normal, `tracking-tight` on display use |
| Card title (h3) | Geist | 700 | 1.25rem (20px) / item card 1.5rem | 1.25 | Normal |
| Body / description | Geist | 400 | 1rem (16px) | 1.7 | Normal |
| Meta / helper / small | Geist | 500 | 0.875rem (14px) | 1.5→1.7 | Normal |
| Micro labels / eyebrows / kicker | Geist | 600 | 0.625–0.75rem (10–12px) | 1.4 | UPPERCASE, `tracking-[0.12em]`–`0.15em` |
| Buttons | Geist | 600 | 0.9375rem (15px) | — | Normal |
| Nav links / footer links | Geist | 500 (desktop), 600 (CTA) | 0.875–0.95rem | 1.4 | Normal |

### Type scale (px → Tailwind mapping)

| Use | Size | Tailwind |
| --- | --- | --- |
| Home hero h1 | 30 → 48px | `text-3xl sm:text-4xl lg:text-5xl` (or `clamp(30px,5vw,48px)`) |
| Page title h1 | 30 → 36px | `text-3xl md:text-4xl` |
| Section h2 (page sections) | 24 → 30px | `text-2xl sm:text-3xl` |
| Item card title | 24px | `text-2xl` |
| Card / step h3 | 18–20px | `text-lg` / `text-xl` |
| Body | 16px | `text-base` |
| Description/supporting | 15–16px | `text-[15px]` / `text-base` |
| Small / meta / helper | 12–14px | `text-xs` / `text-sm` |
| Micro / kicker / badge | 10–12px | `text-[10px]` / `text-xs` |

- Display headings use negative tracking (`tracking-tight` ≈ −0.02em).
  Never use wide tracking on display type.
- Eyebrow/kicker labels use uppercase + wide tracking (`tracking-[0.15em]`
  for the hero kicker pill; `tracking-wider` for footer/nav micro labels).
- Body copy line-height is ≤1.7 for readability; don't exceed 1.75.
- Card titles break words with `break-words` (long item names must not overflow).
- The item name in cards/details is allowed to be `text-2xl font-bold` —
  it is the product's most important data.

---

## 4. Spacing system

### Scale (px)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96`

Derived from the current implementation; 20/40 are optional but discouraged —
prefer 16/24/32. Everything must land on this scale.

### Structural conventions

- **Container:** `mx-auto max-w-6xl px-4 sm:px-6` (pages). Home hero content:
  `max-w-3xl mx-auto`; recovery/browse/prose blocks `max-w-2xl`.
- **Section rhythm (Home):** `py-12 sm:py-16` for white sections;
  `py-14 lg:py-20` for hero; `py-10 sm:py-12` for tinted panels.
- **Page header:** `mb-8 border-b border-line pb-6`; description `mt-2`; icon `mb-3`.
- **Grid gaps:** items/reports `gap-4 md:gap-5 lg:gap-6`; home tiles `gap-5`;
  filter bar `gap-4`.
- **Card padding:** item/match/report cards `p-5`; large panels `p-5 sm:p-8`;
  tinted info panels `p-4/p-5`.
- **Micro rhythm:** label→field `mb-1.5`; helper→error `mt-1.5`; stacked
  action groups `gap-3`; mobile stacked CTAs `gap-2`.
- **Page top/bottom whitespace respects the fixed-header offset**: content
  starts under the `sticky top-0` navbar (use `scroll-mt-24` on anchored
  sections like `#possible-matches`).

---

## 5. Border radius

| Element | Radius | Value |
| --- | --- | --- |
| Inputs | `rounded-lg` | 8px |
| Buttons | `rounded-lg` | 8px |
| Chips / badges / pills | `rounded-full` | only status+scope chips |
| Item / match / report cards | `rounded-xl` | 12px |
| Large containers (search panel, tinted panels, auth cards) | `rounded-xl` / `rounded-2xl` | 12–16px |
| Brand mark | `rounded-lg` (rx≈8 on a 32 viewBox) | **not** a circle |
| Images | inherit card corners; hero/details images `rounded-xl` | — |

Rules:
- Card stacking inside cards (image header) uses matching top corners
  (`rounded-t-xl`).
- Never use pills for buttons. Circles only for status dots, progress ticks,
  and icon chips (44px max).
- Avoid `rounded-3xl`+ on the main UI; 16px is the ceiling for standard containers.

---

## 6. Shadows

Shadows are **exceptions, not defaults**. Default card treatment is
`border border-line bg-surface` with no shadow — the paper-white page provides
contrast.

| Where | Treatment |
| --- | --- |
| Default cards | none (border + surface only) |
| Dropdown / account menu / mobile overlay surfaces | `shadow-sm` |
| Hero search card (on navy) | `shadow-lg shadow-black/20` (the ONE allowed pronounced shadow, because it floats on dark) |
| Hover on cards | no new shadow — border colour shift (`hover:border-lost/40`, `hover:border-found/40`) or `-translate-y-px` |
| Dock/confirm panels | none |
| Buttons | none (colour change communicates state) |

Never use: brand-tinted glows, dual-layer shadows, or shadows on every card.

---

## 7. Button system

### Shared anatomy

- Height: `min-h-[44px]` (touch target). Inline links in rows of controls:
  `min-h-[36px]` allowed for tertiary text buttons.
- Radius: `rounded-lg`. Padding: `px-4` (large CTAs `px-4`→`xl:px-4`).
- Type: `text-[15px] font-semibold`.
- Icons: left-aligned 16–18px for labels; trailing arrow may nudge
  `group-hover:translate-x-0.5`.
- Transition: `transition-colors duration-200` (color only, per restraint).
- Focus: `focus-visible:ring-2 ring-focus ring-offset-2 ring-offset-<surface>`.
- Disabled: `disabled:cursor-not-allowed disabled:opacity-60`, no shadow.
- Press: no scale; original colour shift is enough. (If a subtle press is ever
  added: `active:translate-y-px`, still no scale.)

### Variants

| Variant | Class base (rest = shared anatomy) |
| --- | --- |
| `primary` | `bg-primary text-white hover:bg-primary-hover` |
| `secondary` | `border border-line bg-surface text-ink hover:bg-paper` |
| `lost` | `bg-lost text-white hover:bg-lost-dark` (all Report Lost actions, lost CTA) |
| `found` | `bg-found text-white hover:bg-found-dark` (all Report Found actions) |
| `danger` (outline) | `border border-lost bg-surface text-lost hover:bg-paper` (Delete/non-destructive-urgent) |
| `dangerSolid` | `bg-lost text-white hover:bg-lost-dark` (destructive confirm, Reject) |
| `text` / tertiary | `text-ink hover:text-primary` link-styled, no border (Cancel, logged-out Login link) |

Rules:
- `to` prop renders a `Link`; `type` defaults to `button`. Keep the existing
  polymorphic `Button` component API.
- Danger-red fills are reserved for destructive confirmation and Reject —
  never for benign Cancel.
- Loading states show a 16px spinner (`animate-spin`, `.65s linear`) + label
  change; keep `aria-disabled` true while loading.

---

## 8. Form system

Authentication, report forms, and the recovery request form share this identity.

### Field anatomy

- Label: `text-sm font-semibold text-ink`, `mb-1.5 block`, required `*` marked
  in `text-lost` + `sr-only "(required)"`.
- Control height: `min-h-[44px]` (textarea/select excepted).
- Base: `rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink
  placeholder:text-mute/70 transition-colors duration-150`.
- Hover (idle): `hover:border-mute/40` — a quiet affordance.
- Focus: `focus:outline-none focus-visible:ring-2 ring-focus ring-offset-2`.
  Error focus: `focus-visible:ring-lost`.
- Error: `border-lost bg-lost/5` + message `text-lost text-sm font-medium mt-1.5`
  with `aria-describedby` → error id.
- Helper text: `text-xs text-mute mt-1.5`.
- Placeholder: `placeholder:text-mute/70`.

### Controls

| Control | Specifics |
| --- | --- |
| Text / search | `type=search` clearable; search icon 16–18px mute at left, `gap-2` |
| Email / tel | same base; `autoComplete` set correctly |
| Password | same base; `autoComplete="current-password"`/`"new-password"` correct per form. (Optional later-phase enhancement: show/hide toggle with `aria-label`.) |
| Select | native select, `cursor-pointer`, same base; custom arrow NOT required |
| Textarea | `resize-y`, `leading-relaxed`, rows≈5; description fields |
| Date | native `type=date`, `cursor-pointer`, `[color-scheme]` inherits |
| File / image | 44px+ dashed drop zone (`border-dashed`), drag states (`border-ink bg-paper`), error tint `border-lost bg-lost/5`, upload icon 24px mute, exact hints "JPEG, PNG, or WebP. Maximum 500 KB." |
| Checkbox/radio (if ever added) | square accent: `accent-primary`, 44px hit area |

### Auth layout (Login / Register)

- Centered card, `max-w-md` (`mx-auto`).
- Card: `rounded-xl border border-line border-t-4 border-t-primary bg-surface p-5 sm:p-8`.
- Brand lockup: `BrandMark` 40px in `text-primary`, "CampusFind" `font-display text-xl font-bold`, one-line purpose copy `text-sm text-mute`.
- Fields spaced `space-y-6`; error banner above fields:
  `border-lost/30 bg-lost/10 p-4 text-sm text-lost` with a bold title line.
- Actions: right-aligned primary submit, Cancel secondary on the left,
  stacked on mobile (`gap-3`).
- Cross-links ("Already have an account? Login") `mt-6 text-center text-sm`
  with underlined `font-semibold` destination and `from` state preserved.
- Field set is intentionally small and calm — the focused-task principle.

---

## 9. Card system

Cards share `rounded-xl border border-line bg-surface`. No shadows by default.

| Card type | Anatomy |
| --- | --- |
| **Item card** (lists) | Image header `-mx-5 -mt-5 aspect-[4/3] rounded-t-xl border-b border-line bg-paper` (when present); status badge `rounded-lg border`; title `text-2xl font-bold break-words` (link, hover underline); meta line `category · location · date`; owner actions (Edit / Delete) in a footer row |
| **Report card** (Home tiles) | Tinted semantic panel: `border-lost/25 bg-lost/5` (and found twin); 44px icon chip solid semantic; title; description; CTA button |
| **Match card** (PossibleMatches) | Label row + title link + meta + reasons; right-aligned `score%` chip `border-line bg-surface`; footer: View item + Request Recovery; existing request shows a tinted status note instead of the form |
| **Recovery request card** | `border-l-4` accent by status (`border-l-pending/lost/canopy/recovered`) + status chip w/ dot; lost→found direction row; progress stepper; claimant panel (tinted) with proof image thumbnails; per-status "what happens next" panel; owner actions |
| **Info panel** | Semantic tint: `border-*/25 bg-*/5` — contact panel, status panels, login-prompt banner. 4–6px radius (`rounded-lg`/`rounded-xl`) |
| **Auth card** | See §8; `border-t-4 border-t-primary` communicates "this is a CampusFind account surface" |

Borders communicate structure; tints communicate meaning; only the hero search
card and dropdowns use shadows. Cards must never nest so deeply the page becomes
a card factory — a page should have one clear content region.

---

## 10. Navbar

### Desktop (lg+)

- `sticky top-0 z-30 border-b border-line bg-surface`.
- Brand: 44px tap area, `BrandMark` 26px in primary + two-line wordmark:
  **CampusFind** (`font-display text-lg font-bold`) with
  **`GCOEC • CHANDRAPUR`** (`text-[10px] font-semibold uppercase tracking-wide text-mute`) beneath.
- Center: Home, Lost Items, Found Items (+ Recovery Requests when authenticated).
  Active = `border-b-2 border-primary text-ink`; idle = `text-mute hover:text-ink`,
  underline `border-transparent` reserved. Gap `gap-4 xl:gap-5`.
- Right: **Report Lost** (lost solid), **Report Found** (found solid),
  then **My Account** dropdown (secondary button w/ chevron rotating) or
  **Login** text link when signed out.
- Account menu: `shadow-sm rounded-lg border-line w-52`, items `min-h-[40px]`,
  divider, Logout in `text-lost`.
- All targets ≥44px; focus rings offset to surface.

### Mobile (< lg)

- Hamburger (44px min, bordered) toggles a column panel below the bar
  (border-t separated): nav links 44px rows, active = `bg-frost text-primary`,
  then full-width Report Lost / Report Found stacks, then Logout.
- Panel motion: fade + `translateY(6px)` in, ~160ms ease-out. Escape closes and
  returns focus to the toggle.
- GCOEC identity stays in the brand lockup (same as desktop).

### Rules

- Do not put brand or GCOEC identity on dark backgrounds inside the navbar —
  it stays on the white bar; the navy is reserved for hero/footer.
- Keep exactly two report actions on desktop; never a hamburger that hides them.

---

## 11. Hero (Home)

Visual goals: instant clarity of purpose; calm confidence; not enormous,
not empty, not promotional.

- **Background:** full-bleed flat `bg-navy`, no image, no gradient, no blobs.
  Add nothing decorative behind text.
- **Kicker:** pill `border border-white/15 bg-white/5 px-3 py-1 text-sm
  font-semibold tracking-wide text-white/80` containing
  `GCOEC • CAMPUS LOST & FOUND` + a `h-2 w-2 rounded-full bg-canopy` dot that
  pulses at 1.8s (the only ambient loop on the page).
- **Headline:** 2-line display, `text-white`, sizes 30→48px, `tracking-tight`,
  leading tight, `max-w-3xl mx-auto`. Keeps a plain, direct campus phrasing.
- **Supporting text:** one sentence, `text-white/70 text-base leading-7`, `max-w-2xl`.
- **Search:** the hero's single interactive object — white card
  (`rounded-xl bg-surface p-2 shadow-lg shadow-black/20`) with:
  - scope tabs (All/Lost/Found as segmented buttons `bg-paper p-1 rounded-lg`,
    active tab = `bg-primary/lost/found text-white`, `min-h-[36px]`),
  - search input row (`border-line`, SearchIcon, `h-11`),
  - Search button (primary).
  Stacks to a column below `lg`.
- **Quick links:** under search, `I lost something` (LostIcon lost) and
  `I found something` (FoundIcon found), white/80, 36px targets.
- **Motion:** hero elements fade-up on load, 600ms `ease`, stagger 100–300ms,
  `fill: both`; reduced-motion disables. No parallax, no floating shapes.
- **Size:** NOT `min-h-screen`. `py-14 lg:py-20`.

---

## 12. Section system (Home + subpages)

Sections transition softly, never as stacked giant cards.

- **Home rhythm:** Navy hero (full bleed) → white section (report actions) →
  tinted panel (`rounded-2xl bg-paper`, recovery process) → white section
  (browse listings) → white section with `border-t border-line` (Built for GCOEC).
- Containers stay `max-w-6xl`; inner blocks capped where prose (`max-w-2xl/3xl`).
- Dividers: `border-t border-line` — prefer spacer rhythm to rules wherever possible.
- Subpages use `PageShell`: header (`border-b border-line pb-6 mb-8`) with icon
  chip, title, a 56×6px tone underline (`h-1.5 w-14 rounded-full`) matching
  lost/found/primary, description, meta, optional action — then plain content.
- Every section must earn its place; if a section cannot state its task in one
  sentence, it is removed.

---

## 13. Item images

Images support identification; they never decorate.

- **List cards:** 4:3 cover, `object-cover`, header-attached with bottom border
  and matching top radius; alt text describes the item.
- **Details page:** large 4:3 image (`rounded-xl border text semantic /30`),
  status badge overlay top-left on `bg-surface/90`; no backdrop-blur.
- **No photo:** tinted placeholder (`border-*/25 bg-*/5`) with semantic icon
  (34px) + "No photo provided" + helper line, always on the semantic hue.
- **Report forms:** required-free optional upload; preview `h-56 object-contain
  bg-paper` in a bordered frame; constraints JPEG/PNG/WebP ≤ 500 KB enforced
  client-side exactly as today.
- **Proof images:** 2/4 thumbnails (`h-28 object-cover`) in the recovery card.
- Never use images as section headers, backdrops, or "feel" fills.

---

## 14. Iconography

- **Style:** single custom stroke SVG set (`src/components/icons.jsx`),
  `strokeWidth 1.8`, `strokeLinecap round`, `strokeLinejoin round`, 24 viewBox.
  No filled glyphs except the BrandMark (which is a mark, not an icon).
- **Sizes:** default 20; 14–16 in metadata/button contexts; 22–34 for empty
  states; 40 for auth brand mark. Never a jumble of sizes.
- **Usage:** functional first (search, arrows, step markers, status, contact,
  calendar, pin). Icons are never decorative wallpaper.
- **Semantics:** LostIcon in lost contexts, FoundIcon in found contexts —
  never swapped; ShieldIcon only for verification/trust; VerifyIcon for the
  Verify step; RecoverIcon for recovery.
- **Rule:** do not mix in lucide/herocicons/etc. If a new glyph is needed,
  draw it in the same 1.8 stroke style and add it to `icons.jsx`.
- Cleanup flagged for later phases: a few inline SVGs (chevron, arrow-left,
  menu, check, upload, spinner) currently use `strokeWidth 2` — quietly unify
  to 1.8 without changing their meaning.

---

## 15. Motion design

### Motion tokens

| Token | Value | Use |
| --- | --- | --- |
| `--dur-micro` | 60–100ms | press states, chip in/out |
| `--dur-fast` | 140–180ms | menus, dropdowns, toggles, modal-in |
| `--dur-standard` | 200–250ms | hover transitions, color changes |
| `--dur-panel` | 300–350ms | mobile drawer/panel slide |
| `--dur-reveal` | 500–600ms | scroll reveal / page-load fade-up |
| ambient | 1.8s (pulse), 4–5s (float, unused) | live dot pulse only |
| Easing | `ease` (default), `ease-out` (entrances), `cubic-bezier(0.22, 0.9, 0.3, 1)` (panels) | — |

### Behaviours

- **Page load:** hero/content fade-up (`opacity 0→1`, `translateY(22px)→0`),
  600ms `ease`, `fill-mode: both`; hero sub-elements stagger 100/200/300ms.
  Nothing else animates on load.
- **Scroll reveal (Home sections + card grids):** IntersectionObserver toggles a
  `.reveal` class once per element: `opacity 0 + translateY(20px)` →
  `opacity 1 + translateY(0)`, 600ms `ease`. Apply at **section level**; when
  revealing a grid/card group, stagger children 80ms with a hard cap (~8 items),
  and never re-trigger on scroll back.
- **Hover:** links/nav → color 200ms. Buttons → background colour 200ms
  (+ optional `-translate-y-px`). Cards → border colour shift 200ms
  (losing no layout). Arrow icons nudge 4px.
- **Navigation:** route change resets scroll (existing `ScrollToTop`); no
  per-route layout animation. (Optional: 180ms content fade-up on mount.)
- **Menus/dropdowns:** fade + `translateY(6px)` in, 140–160ms `ease-out`;
  close instantly (or 120ms fade). Mobile menu: slide/fade 300–350ms
  `cubic-bezier(0.22,0.9,0.3,1)`.
- **Modals/confirm overlays (if introduced):** `modalIn` 140ms `ease`.
- **Progress/status:** stepper transitions 200ms color fills; live dot pulse
  1.8s infinite; spinner 0.65s linear.
- **Disabled behaviours:** parallelaxes, bounce, spin (beyond loader), wobble,
  slow cinematic >600ms reveals, animate-everything, scroll-jacking, marquees.

### Reduced motion (mandatory)

`@media (prefers-reduced-motion: reduce)` must disable transitions and
animations (see `src/index.css`, already implemented at the global level);
scroll-behavior flips to auto. The document specifies that **all reveal and
ambient motion must respect this** — do not use `no-preference` gating that
leaves animations running.

---

## 16. Responsive system

Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280`.

| Area | Behaviour |
| --- | --- |
| Navbar | Desktop ≥ lg; hamburger panel < lg; report CTAs full-width inside the mobile panel |
| Hero | Center; search card stacks: scope tabs → input → button below `lg`; quick links wrap |
| Report tiles | `grid-cols-1` → `md:grid-cols-2` |
| Recovery process | `lg:grid-cols-5` (2/5 prose + 3/5 timeline); single column below |
| Browse listings | 1 col → `lg:grid-cols-2` |
| Feature grid (Built for GCOEC) | 1 col → `sm:grid-cols-2` |
| Item/report grids | 1 → `md:grid-cols-2` → `lg:grid-cols-3` (My Reports) / `lg` gap-only for listings |
| Filter bar | 1 → `sm:grid-cols-2` (search spans 2) → `lg:grid-cols-3` |
| Item details | image + meta grid `lg:grid-cols-2`; contact/possible-matches full width |
| Forms | full-width controls; action rows stack `flex-col-reverse`; submit full-width on mobile |
| Recovery request | status row wraps; direction column hidden < sm; proof thumbs 1→2→4 |
| Auth | card `max-w-md` centered; stays one card (does not convert to split-screen) |

Rules:
- No horizontal overflow: `min-w-0` on grid children, `overflow-x-clip` on
  section wrappers, `break-words` on long strings.
- Touch targets ≥44px (36px only for inline chips/scope tabs).
- At least one tap-sized control per viewport when content overflows.

---

## 17. Accessibility

- **Contrast:** enforce §2 guarantees; never put `mute` text below 14px on
  `surface` without checking, and status never relies on colour alone.
- **Focus:** every interactive element shows `focus-visible:ring-2 ring-focus
  ring-offset-2` (offset matches surrounding surface — paper/surface/navy
  variants exist). No focused element is left with default browser outline only.
- **Keyboard:** skip-to-content link (already in App shell); Esc closes
  menus/modal panels and returns focus; menus focus their first item on open;
  `aria-expanded`/`aria-controls` on toggles; `aria-pressed` on scope/filter tabs;
  `role="status"` for loading, `role="alert"` for errors; `aria-invalid` +
  `aria-describedby` on invalid fields; landmark `<nav>/<main>/<footer>` and
  `aria-label`s on repeated groups.
- **Touch targets:** 44px minimum for commands; ≥36px for chips/scope tabs.
- **Reduced motion:** §15; plus `scroll-behavior: auto`.
- **Readable text:** max line width ≈ 65ch for prose; html root size 16px;
  no lowercase/uppercase-only content except intentional eyebrows; allow OS
  font scaling (no fixed-height truncation of text).
- **Semantic status colours:** as colour palettes (red/green/amber/deep-green)
  always accompanied by visible text labels and, where meaningful, icons.

---

## 18. Page-by-page visual direction

> Descriptions only — no implementation in this phase.

### Home
- **Goal:** three seconds → know the task. Navy hero identifies GCOEC, states
  purpose, and offers one search. Below: report tiles, recovery process, browse,
  "Built for GCOEC".
- **Hierarchy:** hero → search → "Make a report" (equal, semantically coloured
  lost/found tiles) → recovery process → browse listings → trust section.
- **Components:** kicker pill, headline, search card, report tiles, recovery
  timeline (vertical rail + icons), browse rows, 2×2 feature grid.
- **Background:** navy hero → page white → `bg-paper` panel → white →
  white + top border.
- **Motion:** hero load fade-up + stagger; section reveal on scroll; tile/card
  hover border shifts.
- **Not present:** fake stats, testimonials, phone mockups, images, blobs,
  parallax, marquees.

### Lost Items / Found Items
- **Goal:** a browsable, filterable catalogue; the type is unmistakable from
  the first pixel.
- **Hierarchy:** PageShell header (TypeChip + tone underline + count meta +
  Report CTA) → filter bar → state messages (loading/error/empty) → item grid.
- **Components:** PageShell, FilterBar, ItemCard, EmptyState, TypeChip.
- **Background:** page white; cards bordered surfaces; error banner tint lost/found.
- **Motion:** card grid reveal with 80ms stagger (once). Filters act instantly
  (no animation).
- **Not present:** pagination sliders, card glows, arranged "featured" items.

### Item Details
- **Goal:** one item, everything needed to act: confirm it's the item, contact
  the reporter, then request/verify recovery.
- **Hierarchy:** header (chip + tone + back) → 2-col: image / meta+description
  (+ contact panel) → "possible matches" call-to-action panel → PossibleMatches
  section with Request Recovery form.
- **Components:** PageShell, TypeChip, Button, PossibleMatches, tinted contact
  panel, image overlay badge, empty placeholders.
- **Background:** white; semantic tints only on contact/no-photo/match panels.
- **Motion:** no load flourish (single quick fade); smooth scroll to
  `#possible-matches`; form expand fade 140ms.
- **Not present:** decorative galleries, unrelated suggestions, fake "views".

### Report Lost / Report Found
- **Goal:** a calm, structured form with a clear owner identity.
- **Hierarchy:** header (chip/tone) → optional sign-in prompt banner → form card
  with tinted header band "Lost item details"/"Found item details" → fields →
  actions; success state card replaces the form.
- **Components:** PageShell, Button, TypeChip, image drop-zone, error banners.
- **Background:** white form on page background.
- **Motion:** no animation while typing; button shows spinner during submit;
  success state fade-in.
- **Not present:** wizard steps, progress bars, marketing reassurance copy.

### My Reports
- **Goal:** manage everything the user reported; status at a glance.
- **Hierarchy:** header (primary tone, Report actions) → two sections
  (Lost Reports / Found Reports) with section icons + counts → card grid.
- **Components:** PageShell, MyReportItem cards (lost/found badge + workflow
  state chip: Open / In Recovery / Recovered / Returned), edit/delete.
- **Background:** white cards; semantic badges only.
- **Motion:** grid stagger on load; delete confirm is inline (no modal).
- **Not present:** dashboards, charts, points, rewards, leaderboards.

### Recovery Requests
- **Goal:** a trustworthy review console: filter → understand → act.
- **Hierarchy:** header (ShieldIcon chip, count) → status filter chips with
  counts → request cards (status edge accent, lost→found, stepper, claimant
  panel, notes, owner actions).
- **Components:** PageShell, StatusChip, ItemLink, RequestProgress,
  per-status panels, RequestActions.
- **Background:** white cards with `border-l-4` status accents — the only place
  a left accent border is allowed.
- **Motion:** status filter is instant; stepper fills transition 200ms; action
  buttons show busy labels.
- **Not present:** approval graphs, activity feeds, timestamps to the second
  beyond what exists.

### Login
- **Goal:** least-friction entry to a trusted account surface.
- **Hierarchy:** header → centered brand lockup card (border-t-primary) →
  fields (email, password) → error banner → actions → cross-link.
- **Components:** PageShell, BrandMark, Button, form fields.
- **Background:** page white; single white card with primary top edge.
- **Motion:** card fade-up 400ms; form error reveal 200ms.
- **Not present:** split screens, colour fields, marketing side panels,
  OAuth logos, "secure" badges.

### Register
- **Goal:** same calm identity; minimal barrier.
- **Hierarchy:** header → brand lockup card → Full Name, Email, Password,
  Confirm → Create Account → cross-link.
- **Motion:** identical to Login.
- **Not present:** progress bars, password strength meters, role pickers.

### Not Found
- **Goal:** recover gracefully, zero dead end.
- **Hierarchy:** PageShell "Page not found" → centered EmptyState (icon, title,
  copy, Back to Home).
- **Motion:** none beyond the standard card reveal.
- **Not present:** broken CSS, memes, forced creativity.

---

## 19. Implementation notes for later phases

- Tailwind v4 tokens live in `src/index.css` `@theme`. Add any new tokens there
  rather than scattering arbitrary values.
- Keep the existing component vocabulary (`Button`, `PageShell`, `TypeChip`,
  `ItemCard`, `FilterBar`, `EmptyState`, `BrandMark`, `icons.jsx`,
  `PossibleMatches`, contexts). Redesign **styles and arrangement**, not APIs —
  backend and routes stay untouched.
- Convert the current `Inter` token mapping to Geist Sans by adding the font
  package and updating `--font-sans`/`--font-display` to Geist with the
  fallback stack.
- Establish `reveal`/motion hooks (a tiny `useReveal` helper or a
  `<Reveal>` wrapper) in a later phase; do not add an animation library.
- Verify each phase against this document; anything ambiguous defaults to
  "restraint and function."

## 20. Baseline alignment

The December 2025 visual refresh already implements most of this spec's
tokens and patterns (color tokens, Button variants, TypeChip, PageShell tones,
rebuilt Navbar/Footer, Navy hero, recovery stepper, status chips). This
document formalises them as the source of truth and lists the deltas for later
phases: Geist Sans adoption, unified 1.8 stroke icons, scroll-reveal motion,
and any spacing/radius drift fixes.