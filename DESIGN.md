---
name: CampusFind
description: Cinematic dark editorial design for GCOEC's campus lost & found — deep obsidian, dark slate surfaces, copper terracotta, crimson, and emerald pine on border-defined planes.
colors:
  ink: "#f3f4f6"
  ink-hover: "#ffffff"
  surface: "#13161f"
  paper: "#0c0d10"
  frost: "#1a1e2a"
  line: "#252a38"
  primary: "#d96b43"
  primary-hover: "#ea7d55"
  primary-light: "#f09a78"
  focus: "#d96b43"
  lost: "#e05345"
  lost-dark: "#f06456"
  lost-tint: "#221213"
  found: "#34a867"
  found-dark: "#3fba74"
  found-tint: "#0f2117"
  pending: "#e59324"
  recovered: "#10b981"
  mute: "#9ca3af"
  selection: "rgba(217, 107, 67, 0.4)"
  scrollbar: "#252a38"
  scrollbar-hover: "#394054"
typography:
  display:
    fontFamily: "Newsreader, Lora, Georgia, Times New Roman, serif"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Newsreader, Lora, Georgia, Times New Roman, serif"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.015em"
  section:
    fontFamily: "Newsreader, Lora, Georgia, Times New Roman, serif"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist Variable, Public Sans, Inter, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
    fontSize: "1rem"
  sm:
    fontFamily: "Geist Variable, Public Sans, Inter, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
    fontSize: "0.875rem"
  xs:
    fontFamily: "Geist Variable, Public Sans, Inter, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 500
    fontSize: "0.75rem"
  card:
    fontFamily: "Geist Variable, Public Sans, Inter, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.005em"
rounded:
  card: "0.75rem"
  control: "0.5rem"
  pill: "9999px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-lost:
    backgroundColor: "{colors.lost}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-found:
    backgroundColor: "{colors.found}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  badge-lost:
    textColor: "{colors.lost}"
    rounded: "9999px"
  badge-found:
    textColor: "{colors.found}"
    rounded: "9999px"
---

# Design System: CampusFind (Cinematic Dark Editorial)

## Overview

**Creative North Star: "The Modern Campus Ledger — Cinematic & Editorial"**

CampusFind redesigns the traditional college lost-and-found experience into a high-craft, cinematic dark editorial platform for Government College of Engineering, Chandrapur (GCOEC). The visual identity merges the gravitas and typographic elegance of a historic institution with the precision, tactile contrast, and clarity of modern cinematic web design.

Deep obsidian canvas (`#0c0d10`) provides an immersive, calm foundation. Elevated surfaces (`#13161f`) and 1px hairline borders (`#252a38`) separate cards and containers with high geometric discipline. High-contrast ivory text (`#f3f4f6`) guarantees readability and exceeds WCAG AA/AAA accessibility standards. Warm copper terracotta (`#d96b43`) serves as the signature institutional brand accent, paired strictly with semantic Crimson (`#e05345`) for lost items and Emerald Pine (`#34a867`) for found items.

**Key Characteristics:**
- Deep obsidian base (`#0c0d10`) with dark slate elevated card surfaces (`#13161f`) and crisp hairline borders (`#252a38`).
- Editorial serif display typography (Newsreader) paired with high-precision technical sans (Geist Variable).
- Tactile, accessible interactive components: 44px minimum touch targets, visible focus rings, subtle card hover translation (`translateY(-2px)`), and photo-first item displays.
- Strict semantic color pairing: Crimson Ember for Lost, Emerald Pine for Found, Honey Amber for Pending Admin Review, Jade Forest for Recovered.
- Zero AI-generated clichés: no excessive gradients, no decorative glassmorphism, no side-tab thick borders, no fake testimonials or mock statistics.

## Colors & Themes

### Base Canvas & Surfaces
- **Canvas Base (`paper`):** `#0c0d10` — deep obsidian background.
- **Surface Layer (`surface`):** `#13161f` — card, form, and modal elevated surfaces.
- **Sub-Surface Inset (`frost`):** `#1a1e2a` — nested containers, table rows, and secondary badges.
- **Hairline Border (`line`):** `#252a38` — precise 1px dividing borders.

### Typography & Readability
- **Primary Ink (`ink`):** `#f3f4f6` — crisp ivory text (14:1+ contrast ratio).
- **Secondary Slate (`mute`):** `#9ca3af` — readable muted text (6:1+ contrast ratio).
- **Interactive Hover (`ink-hover`):** `#ffffff`.

### Semantic Accents
- **Primary Brand:** `#d96b43` (hover `#ea7d55`) — warm copper terracotta.
- **Lost Semantic:** `#e05345` (hover `#f06456`, tint `#221213`).
- **Found Semantic:** `#34a867` (hover `#3fba74`, tint `#0f2117`).
- **Pending Review:** `#e59324` — warm amber for requests under admin moderation.
- **Recovered:** `#10b981` — jade forest for resolved reports.

## Typography

- **Display & Titles:** `Newsreader` (optical sizing 6..72, serifs with editorial distinction).
- **UI & Body Copy:** `Geist Variable` / `Inter` (neutral, crisp sans-serif).
- **Type Scale:** Display (3.75rem / 4rem+), Title 1 (2.25rem / 2.5rem), Section (1.75rem / 2rem), Card (1.125rem), Body (1rem / 16px), Small (0.875rem / 14px), Caption/Badge (0.75rem / 12px).

## Components

### Buttons
- Minimum height 44px for touch accessibility.
- Variants: `primary` (copper brand), `secondary` (surface outline), `lost` (crimson), `found` (emerald), `danger` (lost tint).
- Active press state: `active:translate-y-px`, smooth transitions.

### Cards & Images
- 12px rounded radius (`rounded-card`), 1px hairline border, dark slate surface.
- Photo-first ItemCard with 4:3 aspect ratio, subtle hover lift, and clear SVG fallback for items without uploaded photos.
- Row and grid display modes on listing pages.

### Navigation & Header
- Sticky top navigation with subtle border-b, BrandMark icon, GCOEC label, accessible menu popovers, and mobile collapsible drawer.
