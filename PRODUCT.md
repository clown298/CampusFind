# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

GCOEC (Government College of Engineering, Chandrapur) students. They arrive in one of two situations: they have lost a personal item on campus, or they found one and want to return it. Their job is to report the item, find a possible match, and complete a recovery. A single campus staff member acts as the moderation admin.

## Product Purpose

Reunite students with their lost belongings on campus. Success is measured in documented recoveries: a lost report and a found report connected through the platform, with the hand-back tracked to completion — not in page views or signups.

## Positioning

A verified, campus-only, permanent record. Every account is a GCOEC student, every report is a searchable photo-backed record that stays findable until resolved, and every hand-back passes through an admin-overseen workflow. An ephemeral WhatsApp group or paper notice board cannot truthfully copy the combination of campus verification, permanent searchable archive, and tracked recovery.

## Operating Context

- Used on and around campus, primarily on mobile browsers.
- Reports are photo-backed and carry the reporter's contact details, which are intentionally public on the report.
- A matching engine proactively pairs lost and found reports by category, item, location, and date.
- Recovery requests move through explicit stages: pending → approved / rejected → recovered. Both the item owner and the finder participate; the admin oversees all of them and keeps full history.
- The admin can view, approve, reject, mark recovered, and manage any Lost or Found report; students can only edit or delete their own.
- The web app is a single codebase (React SPA frontend, Express + PostgreSQL backend) with the frontend hosted on Vercel.

## Capabilities and Constraints

Confirmed capabilities: register and log in; report a lost or found item with up to four photos; browse, search, filter, and sort lost and found listings; view possible matches on every report; submit and track recovery requests; edit or delete own reports; admin moderation with full history.

Confirmed constraints and product facts:

- Authentication is email and password only. Social sign-in and email-OTP password recovery were deliberately removed and must not return without an explicit product decision.
- Exactly one admin account, identified by a fixed campus email. Every other account is a student; admin status is derived only from that email.
- Item photos: JPEG/PNG/WebP, up to 5 MB each (compressed automatically in the browser), four maximum per report; recovery-proof photos capped at 2 MB each.
- No fake, demo, or seeded data of any kind may appear in the interface.
- The item contact field is required and public on the report.

## Brand Commitments

- The product serves and presents as GCOEC (Government College of Engineering, Chandrapur) — campus identity is binding.
- The approved footer identity wording is locked and must not be altered.
- Voice: campus utility — direct, trustworthy, no marketing inflation.

## Evidence on Hand

- `DESIGN_SYSTEM.md` — the authorized design-language specification for the ongoing redesign (visual decisions live there and in code, not in this record).
- No real item photography, testimonials, press coverage, or official logo asset exists in the repository. Future work must not fabricate any of these.

## Product Principles

1. Trust over reach — campus-verified accounts only; the product never opens itself to anonymous or off-campus use.
2. Permanence over ephemerality — every report is a durable, searchable record until it is resolved.
3. Evidence over claims — real accounts, real photos, real campus locations; nothing fabricated.
4. Documented recovery — hand-backs flow through the tracked workflow with oversight, not through untracked side channels.
5. Deliberately simple identity — email and password auth, one staff admin; complexity is spent on matching and recovery, not on auth surface.
