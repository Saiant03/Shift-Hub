# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Anyone who works in shifts, in any industry (no single sector). They use their own phone, often tired, between or after shifts. Three recurring moments: entering the schedule when they receive it (usually a month at a time), checking how much they will be paid (especially before payday), and a quick daily check of the next shift / this week.

## Product Purpose
Shift Hub turns a shift schedule into an estimated net pay for the month. The user assigns shift templates to calendar days; the app computes base pay pro-rata plus night, weekend, holiday and overtime premiums under the chosen country's rules, plus non-shift earnings (bonuses, 13th salary). Success: the estimate matches the real payslip closely (user-confirmed for RO) and a month of shifts takes seconds to enter.

## Positioning
A calendar app does not know what a shift is worth; a spreadsheet does not know the country's premium and holiday rules. Shift Hub does both, on the phone, with no account: data stays on the device.

## Operating Context
Mobile first: runs in an Expo WebView (iPhone is the acceptance device), also as a PWA. Six languages (en, ro, es, de, fr, it, pt fallback en), 34 country presets drive currency, holidays and premiums. Light and dark themes. Backups are manual (share sheet / file).

## Capabilities and Constraints
- Screens: HUB (net pay, composition, history, next shift), Calendar (month grid, assign/paint shifts, repeat weeks), Shifts (templates editor), Settings, onboarding.
- Pay engine is net-based and labelled "estimated"; its rules must not change during visual work.
- Vanilla HTML/CSS/JS, no build step, no dependencies. CSP allows only self and data: (fonts self-hosted, no external requests).
- Performance on low-end phones: no backdrop-filter on large or animated layers, no per-frame global pointer work, composite-only animation.
- Redesign 2026-11 is cosmetic plus journey improvements, developed on branch `Work`.

## Brand Commitments
- Name: Shift Hub.
- App icon (2026-11-18, user's pick): cream calendar page with black header, ring stubs, hard offset black shadow, an orange half sun on a black horizon bar, on solid #F0600F.
- User preferences: Apple-grade fluidity and motion (moderate, purposeful); the current Settings structure (iOS grouped list) is liked and stays; other screens must not look generic.

## Evidence on Hand
No testimonials, user counts or benchmarks exist; do not invent them. The only accuracy evidence is the owner's own payslip comparison (RO).

## Product Principles
1. The number is the product: net pay must be legible at a glance and always labelled as an estimate.
2. Entering a month of shifts must be fast and forgiving.
3. Private by default: no account, no network, data on the phone.
4. Feel native on the phone: instant tabs, gestures that track the finger, haptics.

## Accessibility & Inclusion
Touch targets at least 44px, reduced-motion respected, VoiceOver labels on controls, text contrast AA.
