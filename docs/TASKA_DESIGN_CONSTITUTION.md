# Taska Design Constitution v2.0 + Animation & Gamification Direction

Status: **design authority, prioritized for implementation. Not yet applied to the codebase.**
Added: 2026-08-11, by explicit user request ("save wat you are doing in the workplan, add the following and prioritize it").

> Note on provenance: this document is the user's own design brief, pasted in full during the session and saved verbatim as the governing design reference for Taska. The one part that got cut off mid-paste was the tail of the "TASKA MASTER DESIGN, UX, ANIMATION & GAMIFICATION IMPLEMENTATION PROMPT" (it stops mid-sentence at "Taska mus…" — the character limit on the paste was hit). Everything before that point, including the full 73-section Design Constitution v2.0, is complete below. **Before starting implementation work against this doc, get the rest of that master prompt from the user** (either re-paste the remainder, or treat the constitution + the animation/gamification summary below as sufficient direction and proceed without it — that's a judgment call for whoever picks this up).

## Why this exists / how to use it

The user explicitly rejected an earlier "Result Seekers purple" version of this constitution and replaced it with this one: **Taska should inherit Makaranta's actual colour language (purple + orange + warm neutrals), not a separate Result Seekers corporate palette.** Taska and Makaranta are sibling products from the same design family — same visual DNA, different personality (Makaranta: warm/exploratory/inspiring; Taska: calm/operational/precise).

This doc is meant to become the **non-negotiable design authority** for all future Taska UI work — every new page, every business-type module, every dashboard, every component. When building or reviewing Taska frontend work going forward, check decisions against this constitution the same way code changes get checked against existing conventions.

The single sentence to keep at the top of mind:

> **"Don't show businesses software. Show them their business."**

---

## Animation & gamification — user's direction (not yet expanded into a full section)

The user confirmed animation and gamification both belong in Taska, but scoped very differently from Makaranta:

- Makaranta can gamify to encourage **learning** (a consumer/education product, can be emotionally expressive).
- Taska should gamify to encourage **better business behaviour, adoption, consistency, and achievement** — without making a serious business system feel childish. Motion in Taska should "explain, not entertain" (see §29 below) and gamification should tie to **real business performance**, not arbitrary points/badges disconnected from the business itself.

The user was about to paste a full "TASKA MASTER DESIGN, UX, ANIMATION & GAMIFICATION IMPLEMENTATION PROMPT" that frames Claude as the lead product designer/UX architect/design-systems engineer responsible for a **platform-wide** design transformation — explicitly *not* a redesign of a few pages, and explicitly requiring inspection of the existing Taska codebase first (preserve what works, don't duplicate existing modules/components/routes, don't delete working features just to do them differently). That prompt was cut off before it defined the animation/gamification implementation specifics in full. **This is the one piece to go back and get from the user before treating this doc as complete implementation guidance** — everything else below is intact.

---

## TASKA DESIGN CONSTITUTION v2.0 — full text as supplied by the user

*(Version 2.0 — August 2026. Supersedes an earlier v1.0 draft that used a distinct "Result Seekers Purple #4214C4" palette — that draft is obsolete; this version's Makaranta-shared palette is the one to build against.)*

“Don’t show businesses software. Show them their business.”
This constitution is the permanent design authority for Taska.

Every existing page, new module, business workflow, dashboard, component, mobile screen and future feature must comply with it.

Taska must achieve the same level of beauty, simplicity, elegance and polish as Makaranta, while expressing that standard appropriately for business software.

### 1. THE TASKA DESIGN VISION
Taska is not an ERP dashboard. It is not an accounting package. It is not a collection of business modules. It is a Business Operating System.

Taska should make a complicated business feel surprisingly easy to operate. The experience should communicate: Calm. Clarity. Control. Intelligence. Confidence.

When users open Taska, they should immediately feel: "I understand what is happening in my business."

### 2. MAKARANTA IS THE QUALITY BENCHMARK
Makaranta and Taska serve different purposes. Taska must not copy Makaranta's screens, but Taska must match Makaranta's design craftsmanship.

| Makaranta | Taska |
|---|---|
| Learning | Business |
| Inspiring | Empowering |
| Warm | Calm |
| Exploratory | Operational |
| Content-rich | Data-rich |
| Engaging | Efficient |
| Aspirational | Confident |
| Human | Intelligent |
| Beautiful | Beautiful |
| Simple | Simple |
| Premium | Premium |

The standard of craftsmanship must be identical.

### 3. SHARED MAKARANTA COLOUR DNA
Taska shall use the same core colour family established for Makaranta — deliberately, so users subconsciously recognise Taska and Makaranta as the same product ecosystem. Makaranta can use colour more emotionally; Taska uses the same colours more strategically and conservatively.

Core visual hierarchy: Purple (primary brand/action colour), Orange (energy, highlight, secondary accent), White/warm near-white (dominant interface surfaces), Deep neutral (typography, high-contrast UI), Soft lavender/purple surfaces (selected states, subtle branded areas).

The exact production tokens already used by Makaranta should be imported into Taska rather than creating competing Taska-specific approximations.

### 4. COLOUR APPLICATION
Purple = Taska identity + primary action. Use for: primary buttons, active navigation, links, selected tabs, progress, focus states, important interactive elements, key chart series, important brand moments.

Orange = energy + emphasis. Use sparingly for: highlights, badges, milestones, special indicators, secondary visual accents, selected illustrations. Orange must not compete with purple primary actions.

### 5. NEUTRAL SPACE IS PART OF THE BRAND
Using Makaranta colours does not mean every screen should become purple and orange. Premium Taska screens should primarily consist of white/near-white/soft neutral surfaces and dark typography, then carefully placed Makaranta purple and occasionally Makaranta orange. The colour becomes more powerful because it is restrained.

### 6. SEMANTIC COLOURS REMAIN SEMANTIC
Brand colours must not destroy business meaning: Green = success/positive/paid/healthy. Amber = warning/attention/approaching threshold. Red = danger/overdue/failure/destructive. Blue = information. Purple = Taska/selected/primary interaction. Orange = accent/emphasis. Never make a failed transaction purple merely because purple is the brand colour.

### 7. TASKA MUST FEEL EXPENSIVE
Premium does not mean more gradients, shadows, animation, or cards. Premium means better hierarchy, typography, spacing, transitions, information architecture, empty states, micro-interactions, responsiveness, and fewer unnecessary elements.

### 8. TYPOGRAPHY
Modern, friendly, clean, highly legible, premium. Disciplined hierarchy: Display (exceptional business numbers, e.g. ₦4.28m), H1 (page titles), H2 (major sections), H3 (subsections), Body (normal content), Small/Caption (supporting metadata). Avoid excessive weights and unnecessary font-size variations.

### 9. NUMBERS ARE HERO CONTENT
Compare "TODAY'S SALES: NGN 1,284,500.00" with "Today's sales / ₦1.28m / ↑ 12.8% from yesterday" — the second is Taska. Precision stays available when required; dashboards optimize for comprehension.

### 10. SPACING
Spacious, uncluttered, inherited from Makaranta. Systematic scale: 4/8/12/16/24/32/48/64. Whitespace creates hierarchy; Taska must never resemble a spreadsheet unless the user is actually working with spreadsheet-like data.

### 11. ROUNDED GEOMETRY
Share Makaranta's friendly modern geometry, but business interfaces should be slightly more restrained. Consistent radii across cards, inputs, buttons, modals, dropdowns, panels, notifications. Avoid extreme pill shapes unless naturally required.

### 12. SHADOWS
Extremely subtle. Most hierarchy comes from surface/spacing/typography/borders, not shadows. Stronger elevation appropriate for dropdowns, modals, floating menus, popovers. Never produce the generic floating-card SaaS look.

### 13. THE CARD CONSTITUTION
Non-negotiable: **not everything deserves a card.** Before adding a card, consider typography, whitespace, sections, lists, tables, dividers, progressive disclosure. Avoid card soup.

### 14. DASHBOARD PHILOSOPHY
The dashboard is not "everything we know about your business" — it is "everything you need to know right now." Every dashboard must answer: What is happening? Is my business healthy? What requires attention? What should I do next?

### 15. THE TASKA DASHBOARD ANATOMY
Preferred structure: Greeting + business context → Primary business number → Supporting KPIs → Needs Your Attention → Business performance → Recent activity → Deeper insights. Do not start with twelve equally important cards.

### 16. TASKA'S SIGNATURE FEATURE — "Needs Your Attention"
Every dashboard should eventually include an intelligent "Needs Your Attention" section surfacing what matters (e.g. low-stock products, overdue balances, unusual expenses), each with a clear "Review →" action. This should become part of Taska's identity.

### 17. TASKA MUST INTERPRET DATA
Bad: "Low stock — 17". Better: "17 products are running low." Excellent: "17 products are running low. 5 are likely to run out within three days. Estimated restocking requirement: ₦284,000. Prepare purchase order →". This is the direction to pursue.

### 18. BUSINESS TYPE CHANGES THE EXPERIENCE
Taska must never become "one ERP + different module names." A pharmacy is not a supermarket; a hotel is not a restaurant; a clinic is not a distributor; a distributor is not a farm. Taska must understand the operational model.

### 19–21. Business-specific dashboard examples
- **Pharmacy**: Today's Sales, Prescriptions, Low Stock, Expiring Medicines, Supplier Balances, Needs Your Attention (e.g. "Amoxicillin — only 8 packs remaining", batch expiry warnings, supplier payment overdue).
- **Hotel**: Occupancy, Available Rooms, Arrivals, Departures, Revenue, Needs Your Attention (e.g. room awaiting cleaning, guests arriving soon, outstanding corporate invoices).
- **Restaurant**: Orders, Tables, Kitchen, Revenue, Average order, Ingredients, Delivery, Needs Your Attention (e.g. table waiting too long, ingredient about to run out, food cost above target).

Same Taska, same Makaranta visual DNA, different business intelligence per vertical.

### 22. ROLE CHANGES THE EXPERIENCE TOO
Formula: **Business Type × Role × Permission = Taska Experience**. Owner ≠ Manager ≠ Cashier ≠ Accountant ≠ Warehouse Officer ≠ Sales Rep. Don't just disable inaccessible buttons — remove irrelevant complexity entirely.

### 23. NAVIGATION
Desktop: clean, predictable, collapsible, context/role/business-aware sidebar. Most important operations first; administrative functions lower. Avoid enormous menus.

### 24. NAVIGATION SHOULD CHANGE BY BUSINESS
Example structures given for Pharmacy, Restaurant, Hotel — same design system, different mental models per vertical (this directly matches the existing `navigationPresets.js` per-business-type approach already in the codebase).

### 25. TOP BAR
Keep restrained: business/branch selector, global search, quick action, notifications, help, profile. Don't duplicate sidebar functionality.

### 26. GLOBAL SEARCH
Must become one of Taska's strongest capabilities — cross-module intelligent search (customer name, invoice number, product name, amount, room number, supplier name).

### 27. COMMAND PALETTE
Advanced users should eventually get Ctrl/⌘+K → "Create sale", "Add product", "Record expense", "Find customer", "Create purchase order", "Transfer stock", "Open report". Power without cluttering the visible UI.

### 28. FORMS
Never expose database architecture to users. Logical grouping, smart defaults, autofill, progressive disclosure, inline validation, searchable selections, conditional fields, autosave where appropriate. Show what's necessary when it's necessary.

### 29. TABLES
Deserve as much design attention as dashboards. Depending on context: search, sort, filter, saved views, bulk actions, pagination, column selection, export — but don't show all controls permanently. Keep the default calm.

### 30. MOBILE TABLES
Never shrink a wide desktop table until unreadable — transform it into compact cards with priority fields instead. Responsive means restructuring, not shrinking.

### 31. POS
Must be extraordinarily fast. Core journey: Find → Add → Pay → Receipt. Priorities: speed, reliability, touchability, barcode support, keyboard support, offline resilience. Beauty must never reduce transaction speed.

### 32. MOBILE-FIRST OPERATIONS
Desktop = sophisticated analysis. Mobile = action-first (today's sales figure, "Needs Attention · 3", then Sell/Expense/Stock/More quick actions). Must feel deliberately designed for mobile, not compressed desktop Taska.

### 33. OFFLINE DESIGN
Connectivity state must always be understandable: "You're offline — 14 transactions are safely stored on this device" → "Back online — Syncing 14 transactions..." → "✓ Everything is up to date." Users should never wonder if their money/records disappeared. (Note: Taska already has `stores/offlineStore.js` — this section is about surfacing that state clearly in the UI, not building new offline infra.)

### 34. FEEDBACK
Every significant action needs immediate, restrained feedback ("Sale completed", "Payment recorded", "Stock transferred", etc.).

### 35. EMPTY STATES
Never "No data available." Instead: explain what the section is for and give a clear first action (e.g. "No suppliers yet — add your suppliers to track purchases, deliveries and outstanding balances. [Add your first supplier]"). Empty states should teach Taska.

### 36. ERROR STATES
Never show raw technical errors (SQLSTATE, 500 Internal Server Error) to users. Taska says: "We couldn't save this transaction. Your information hasn't been lost. Please try again. [Try again]" Technical errors belong in logs only.

### 37. LOADING STATES
Avoid unnecessary full-screen loaders. Prefer skeletons, optimistic UI where safe, background processing, incremental loading, subtle progress indicators. Interface should remain stable while loading.

### 38. MICRO-INTERACTIONS
An area Taska should inherit Makaranta's polish in — buttons respond beautifully, menus open smoothly, tabs transition elegantly, success feels satisfying. Taska's motion personality: **smooth, subtle, confident** — never entertainment.

### 39. CHARTS
Exist to answer questions, never added just because a dashboard looks empty. Lead with the insight sentence ("Sales increased 18% this month"), then show the supporting chart as evidence.

### 40. AI SHOULD FEEL NATIVE
Don't scatter "✨ AI" everywhere. AI should quietly improve forecasting, stock recommendations, data entry, anomaly detection, reporting, categorisation, reconciliation, business insights, customer analysis. Users should think "Taska is smart," not "Taska has AI buttons."

### 41. TASKA ASSISTANT
Should eventually support natural questions against the business's own authorised data ("Why was my profit lower last month?", "Which products should I reorder?", "Who owes me money?"). Framed as a major potential competitive advantage.

### 42. ACCESSIBILITY
Adequate contrast, readable typography, visible focus states, keyboard navigation, touch-friendly controls, semantic markup, screen-reader compatibility where applicable. Never communicate status by colour alone.

### 43. THE THREE-SECOND RULE
Within ~3 seconds of opening an important screen, users should understand: Where am I? What's important? What can I do? If not, simplify.

### 44. ROUTINE TASK RULE
Frequent operations deserve the shortest workflows. Frequency determines accessibility/navigation depth.

### 45. BEGINNER + EXPERT DESIGN
Beginners: guidance, good defaults, explanations, simple workflows, progressive onboarding. Experts: keyboard shortcuts, bulk actions, saved views, advanced filters, automation, commands. Achieved via progressive complexity, not two separate products.

### 46. CONFIRMATION RULE
Don't ask "Are you sure?" for everything — reserve for consequential actions (delete, reverse payment, cancel transaction, remove staff, close financial period, large inventory adjustment). Friction should match risk.

### 47. TRUST IS UX
Users entrust Taska with money, inventory, customers, employees, business history. Where appropriate, surface who made a change, when, previous/current value, sync status, payment status. Auditability designed beautifully, not buried in logs.

### 48. NO DEAD ENDS
Every page should connect naturally to the next action (Customer → Create sale; Invoice → Receive payment; Low stock → Restock; Supplier → Create purchase; Expiring medicine → Review batch; Report → Export/share).

### 49. HUMAN LANGUAGE
Avoid unnecessary ERP jargon. Instead of only "Accounts Receivable Ageing," say "Money customers owe you — ₦1.24m outstanding," with the professional term available as secondary. Never make small business owners feel unqualified.

### 50. AFRICAN REALITY, GLOBAL QUALITY
Must understand cash, bank transfer, POS, credit sales, receipts, WhatsApp, barcode scanners, multiple branches, intermittent internet, offline operation, Naira, local taxation, informal customer records, supplier credit — without ever looking like "cheap local software." **Built around African business realities. Designed to world-class standards.**

### 51. DARK MODE
If implemented, must be intentionally designed (not a colour inversion) — purple/orange accents recalibrated for dark surfaces, deliberate tokens for charts/tables/forms/semantic colours/hover/elevation. *(Cross-reference: dark theme was explicitly removed from Taska earlier this session per the user's own instruction — "remove the dark theme, leave light theme only." If dark mode is ever reintroduced, this section is the standard to build it against.)*

### 52. RESPONSIVENESS IS NON-NEGOTIABLE
Every major interface tested across large desktop, laptop, tablet, small tablet, mobile. No horizontal overflow (unless genuinely required), no clipped modals, no unreachable actions, no tiny controls, no unreadable charts, no desktop-only workflows without deliberate justification.

### 53. TASKA MUST REMEMBER CONTEXT
E.g. if a user selects "Kano Branch" then navigates elsewhere, don't unnecessarily reset to "All Branches." Preserve context intelligently where safe — reduces repeated decisions.

### 54. NOTIFICATION DESIGN
Useful, not noisy. Prioritise Critical / Needs attention / Informational. Every notification should answer "Why should I care?" and preferably "What can I do?"

### 55–56. ONBOARDING
Inherit Makaranta's welcoming simplicity — not "Configure ERP" but "Let's set up your business. What type of business do you run?" then progressive steps (business type, name, location, branch, currency, opening stock if applicable, team, payment methods). Don't require complete configuration before the user can explore. Reach a meaningful experience as fast as possible; setup can continue progressively.

### 57. DESIGN SYSTEM COMPONENTS
Reusable primitives required across the whole app: buttons, inputs, selects, search, checkboxes, radios, switches, tabs, badges, tooltips, dropdowns, dialogs, drawers, tables, pagination, notifications, skeletons, empty states, charts, KPI displays, insight blocks, navigation, command palette. All modules consume the same design system — don't invent per-module styles.

### 58. ONE COMPONENT, ONE LANGUAGE
If a primary button exists, don't invent a second one for a new vertical. If a table filter pattern exists, new verticals shouldn't get a different one without a genuine workflow reason. Consistency → familiarity → speed.

### 59–60. SHARED DESIGN TOKENS
Recommends a shared Result Seekers Product Design Token layer (`brand-primary`, `brand-primary-hover`, `brand-accent`, `surface-primary`, `surface-secondary`, `text-primary`, `text-secondary`, `border-subtle`, `success`, `warning`, `danger`, `info`) consumed by both Makaranta and Taska, with Taska-specific tokens layered on top (`taska-insight-surface`, `taska-kpi-positive`, `taska-navigation-active`, `taska-attention-surface`, `taska-table-hover`) for Taska's own operational personality without breaking the shared family identity.

### 61. FEATURE ADDITION RULE
Before adding a new feature, determine: does this capability already exist? Where does it logically belong? Which existing component can be reused? Which business types/roles need it? What is the complete workflow? How does mobile handle it? Only then implement. *(This directly matches the "check before duplicating" instruction already in this session's working pattern.)*

### 62. NEVER DESIGN ONLY THE HAPPY PATH
Every workflow must consider: normal completion, empty state, loading, validation failure, network failure, permission restriction, offline state, duplicate action, cancellation, success, unexpected server error. A beautiful screenshot is not a finished feature.

### 63. DESIGN REVIEW AT EVERY BREAKPOINT
"Responsive completed" ≠ Tailwind classes added. Actually examine hierarchy at different widths — may require reordering, collapsing, hiding secondary info, changing table representation, moving actions, changing navigation.

### 64. NO GENERIC ADMIN TEMPLATE
Must never resemble generic Bootstrap Admin / ThemeForest ERP / basic Tailwind dashboard / generic Laravel admin / template SaaS dashboard. A screenshot should feel recognisably Taska before the logo is even visible.

### 65. WHAT TASKA MUST NEVER BECOME
Card soup; rainbow dashboards; excessive gradients; purple everywhere; orange everywhere; giant sidebars; tiny text; excessive borders; heavy shadows; 20 KPIs competing simultaneously; identical dashboards across businesses; identical interfaces across roles; forms exposing database architecture; desktop squeezed onto mobile; charts without meaning; technical errors; AI buttons everywhere; animation without purpose; features without complete workflows; inconsistent components; generic ERP aesthetics.

### 66. TASKA DESIGN APPROVAL GATES
Every feature must pass 8 gates:
1. **Business Reality** — does it accurately represent how that business operates?
2. **Workflow** — can the entire operation be completed naturally?
3. **Simplicity** — can anything unnecessary be removed/automated/progressively disclosed?
4. **Makaranta-Level Beauty** — same craftsmanship standard as Makaranta?
5. **Intelligence** — can Taska interpret/predict/recommend, not just record?
6. **Consistency** — uses Taska's established components/patterns?
7. **Responsive & Accessible** — genuinely works across relevant devices/users?
8. **Reliability** — loading, offline, failure, permissions, edge states all considered?

Failing any gate = the feature is unfinished.

### 67. DESIGN PRIORITY HIERARCHY
When objectives conflict, in order: 1. Correct business workflow → 2. User understanding → 3. Reliability → 4. Speed → 5. Accessibility → 6. Consistency → 7. Beauty → 8. Decorative effect. Beautiful software that cannot correctly run the business is failed software.

### 68. THE MAKARANTA QUALITY TEST
"If the same team that designed Makaranta designed this screen with equal care, would this be acceptable?" If no, redesign — meaning *give it the same care as Makaranta*, not *make it look like Makaranta*.

### 69–70. SMALL BUSINESS TEST & ENTERPRISE TEST
Could someone with limited ERP experience understand this without training? (If not, simplify.) Would a sophisticated multi-branch company consider this credible professional software? (If not, strengthen it.) Taska must pass both simultaneously.

### 71. TASKA'S DESIGN PERSONALITY
Makaranta: Beautiful · Warm · Inspiring · Simple · Premium. Taska: Beautiful · Calm · Intelligent · Precise · Simple · Premium. Shared: colour DNA, typography philosophy, spacing discipline, motion quality, component craftsmanship, attention to detail, premium standard. Each remains unmistakably suited to its own purpose.

### 72. THE TASKA NORTH STAR
When unsure what to do, ask in sequence: Can it be simpler? → Can it be clearer? → Can it be smarter? → Can it be more beautiful? → Does it still feel like Taska?

### 73. FINAL NON-NEGOTIABLE RULE
Taska should never require users to understand the software before they can understand their business. The software must disappear into the workflow: Open Taska → Understand the business → See what matters → Take action → Continue working.

---

## THE TASKA DESIGN COMMANDMENT

(To be placed directly into the project's permanent AI/developer instructions, per the user's own framing.)

> **TASKA MUST MATCH MAKARANTA'S DESIGN STANDARD, NOT COPY MAKARANTA'S UI.**
>
> Taska shall inherit Makaranta's established colour palette and overall visual DNA, including its primary purple, orange accent, neutral surfaces, typography philosophy, spacing discipline, refined geometry, premium motion and exceptional attention to detail.
>
> However, Taska must reinterpret this design language for professional business operations. It must be calmer, more data-oriented, more precise and more operational than Makaranta while remaining equally beautiful, elegant and simple.
>
> Never introduce a competing colour palette for Taska. Use the existing Makaranta design tokens as the source of truth.
>
> Never allow new modules or business types to deteriorate into generic ERP/admin-template interfaces.
>
> Every business type must have workflows, dashboards, navigation and intelligence appropriate to that business while remaining within one coherent Taska design system.
>
> Do not show businesses software. Show them their business.

---

---

## Implementation phases & closing commandments (pasted 2026-08-11, completes the master prompt)

The user supplied the rest of the master prompt that was cut off earlier. Phases 1–6 of that prompt were never received (the paste that got cut off jumped straight from framing into phase 7) — if they turn out to matter, ask the user; everything below is what was actually sent.

### PHASE 7 — Business-specific UX
Work through each supported business type individually. Do not assume one workflow fits all.

### PHASE 8 — Motion system
Standardise animation. Add meaningful micro-interactions. Respect reduced-motion preferences.

### PHASE 9 — Gamification foundation
Implement: business health; progress; levels; achievements; milestones; streaks where appropriate; recommendations; progress centre.

### PHASE 10 — Mobile
Review each core workflow deliberately for mobile.

### PHASE 11 — QA
Test: desktop; tablet; mobile; roles; business types; permissions; offline behaviour; loading; errors; edge cases.

### PHASE 12 — Polish
Only after functionality is stable, refine: spacing; motion; typography; chart presentation; empty states; tooltips; copy; micro-interactions.

### §72. Do not make large blind changes
Before major changes, inspect context. If a workflow appears unusual, investigate whether it supports a specific business rule. Do not assume unfamiliar code is wrong. **Preserve domain logic. Improve presentation around it.**

### §73. Development quality
Follow the existing architecture unless there is a strong technical reason to improve it. Maintain: modularity; testability; accessibility; type safety where applicable; validation; reusable components; clean service boundaries; secure permissions; database integrity. Do not introduce unnecessary dependencies.

### §74. Testing
Add or improve tests for critical workflows. At minimum cover: sales; payment; inventory changes; purchase; financial posting; authentication; permissions; offline/sync if available; business type configuration; gamification calculation where implemented. **UI redesign must not silently break business logic.**

### §75. Final north star
Can it be simpler? Can it be clearer? Can it be faster? Can it be smarter? Can it be more beautiful? Does it match Makaranta's quality? Does it still feel like Taska? Does it help the business operate better? If not, redesign it.

### §76. Final Taska experience
Open Taska → Understand the business → See what matters → See what needs attention → Take action → Receive feedback → Make progress → Improve the business → Continue working. The software itself should gradually disappear behind the workflow.

### §77. Final commandment
**TASKA MUST MATCH MAKARANTA'S DESIGN STANDARD WITHOUT BECOMING MAKARANTA.**

Use Makaranta's established colour system and premium visual DNA. Retain Taska's professional business personality. Keep the interface calm. Make business data understandable. Make routine operations exceptionally fast. Use animation to improve comprehension. Use gamification to encourage good business habits. Use AI to increase intelligence without clutter. Adapt Taska deeply to every business type. Adapt Taska to user role and permission.

Never sacrifice correct business workflow for visual beauty. Never sacrifice simplicity for feature visibility. Never sacrifice performance for animation. Never use childish gamification. Never allow new modules to deteriorate into generic ERP templates.

And above everything:

> **DON'T SHOW BUSINESSES SOFTWARE. SHOW THEM THEIR BUSINESS.**

### Required first action (per the user's prompt)
Before writing implementation code: audit the existing codebase (architecture, design system, colour/token usage, business types, workflows per business type, UI/UX inconsistencies, mobile/responsive issues, existing animation usage, existing/missing gamification, broken/incomplete workflows, duplicate components/logic), then propose implementation phases and the files/components to modify first, and the risks to protect against — **without stopping at the audit**. Proceed into implementation systematically afterward. Don't rebuild features that already exist. See the "2026-08-11 codebase audit" section below for the audit itself.

---

## 2026-08-11 codebase audit (required first action, per the master prompt)

Findings from a dedicated read-only audit pass, before any implementation began.

**1. Architecture**: 69 page components (`src/pages/`), 55 shared components (`src/components/`, flat, no subdirectories). Routing/lazy-loading centralized in `App.jsx`. Business-type config split across `config/businessTypes.js` (groups/colors/icons) and `config/navigationPresets.js` (per-type nav/dashboard). State pattern: per-domain custom hooks in `src/hooks/` (`use<Page>Desk.js`), no TanStack Query, two Zustand stores (`authStore.js`, `offlineStore.js`).

**2. Existing design system**: primitives exist (`Button.jsx`, `Card.jsx`, `ModalShell.jsx` + 8 helper files, `EmptyState.jsx`, `Toast.jsx`, `ConfirmDialog.jsx`, `StatsCard.jsx`, `OpsMetricCard.jsx`, `PageHero.jsx`, `PageShell.jsx`) but usage is inconsistent — only 5 pages import `ModalShell`, only 7 import `EmptyState` even though 43 pages hand-roll their own "no data yet" markup instead. **No shared Table, Badge, Tabs, or Skeleton component existed** before this session (Badge added below).

**3. Colour/token assessment**: `index.css` already has a solid token layer (~60 root variables: brand/status/bg/surface/border/text/shadow/spacing/typography). But **token bypass is widespread** — 88 files use arbitrary Tailwind colour utilities (`bg-purple-600`, `text-orange-500`, etc.) directly instead of the tokens, and 15 files have raw hex codes. This includes even the newest, most-consistent pages (`GrainMillingOps.jsx` uses `border-rose-200 bg-rose-50` instead of a token/status class). `App.css` (184 lines) was confirmed dead — zero imports anywhere — and has been deleted.

**4. Business types** (28 slugs, from `businessTypes.js`): commerce group (retail, supermarket, wholesale, commodity, pharmacy, textile, construction, fuel_business, pure_water_retail, livestock_market), manufacturing (pure_water_factory, grain_milling, leather_trading), services (restaurant, hotel, clinic, laboratory, service, school, beauty), agriculture (farm, livestock, agro_dealer), mobility (logistics, delivery_company, mobile_agent), other (warehouse, general, mixed; `ngo_warehouse` aliases to warehouse).

**5. Workflows by type**: most business types have a dedicated Ops page. Notable exceptions relying on generic pages: pharmacy (`Pharmacy.jsx`), hotel (`Rooms.jsx`), clinic (`Patients.jsx`), laboratory (`LabRequests.jsx`), school (`Classes.jsx`/`Students.jsx`), pure_water_factory (`Production.jsx`).

**6. UI/UX inconsistencies**: older pages (`Customers.jsx`) use raw Tailwind pill classes with no shared badge component; even the newest pages (`GrainMillingOps.jsx`, built this same session) are visually consistent with each other but still not token-driven — they hand-roll the same rose/amber alert-box and input styling independently rather than through a shared class. Consistency-by-copying, not consistency-by-system.

**7. Mobile/responsive**: only 1 page uses `overflow-x-auto` for table scrolling, only 2 implement a mobile-card fallback for tables (per §30 of the constitution, this is meant to be the default, not the exception). 14 files use fixed pixel widths.

**8. Animation**: the custom keyframe set (`fadeIn`, `riseIn`, `shimmer`, `floaty`, `sheen`, `gentlePulse`) plus a `prefers-reduced-motion` override already exist in `index.css` and are reasonably calm/restrained already (matches §38's "smooth, subtle, confident" standard) — but only used in ~10 page files. Most pages use bare Tailwind `animate-pulse` for skeletons and nothing else.

**9. Gamification**: confirmed greenfield — zero matches for achievement/streak/gamif/milestone anywhere in the frontend. Phase 9 has no existing scaffolding to preserve or conflict with.

**10. Broken/incomplete workflows**: no TODO/FIXME/stub markers found in `pages/`/`components/` — nothing obviously unfinished surfaced at this pass (would need per-page manual testing to find anything deeper, which is what Phase 11 QA is for).

**11. Duplicates**: `EmptyState.jsx` exists but is bypassed by 43 pages (a de facto duplicate inline pattern). `ModalShell` is a single implementation but unusually fragmented across 8+ helper files (`modalShellActions/Config/Controller/Dom/Focus/Hooks/Interactions/Runtime/Scroll/Sections/State/View.js`) — a simplification candidate, not a rebuild candidate.

### Risks to protect against (per §72–74)
- **88 files with token-bypassing colour classes** is the single biggest risk surface — touching all of them at once would be exactly the "large blind change" the constitution itself forbids. Must be migrated in small verified batches, page-by-page or component-by-component, the same way the 3 business-type verticals were built this session.
- The fragmented `ModalShell` (8+ files) and the underused `EmptyState`/lack-of-`Badge` situation are real duplication/inconsistency, but changing shared components touches every page that (in)directly depends on them — highest blast radius in the whole codebase. Any change here needs the full render-smoke suite (56 pages) plus a live spot-check before/after, not just unit tests.
- No gamification data model exists yet on the backend either — Phase 9 needs a schema/migration design pass (business health score inputs, achievement definitions, streak tracking) before any frontend "progress centre" UI is built, otherwise it'll be decorative rather than real, which §17 and §77 both explicitly warn against ("never use childish gamification" / data must be interpreted, not merely displayed).
- Business-logic preservation (§72, §74): none of the 28 verticals' actual workflows should change while restyling — this is a presentation-layer effort layered on top of working domain logic, verified via the existing test suites (backend PHPUnit, frontend `node --test`, Vitest render-smoke) after every batch, exactly as done for the grain_milling/livestock_market/leather_trading builds.

### Proposed phasing (maps the constitution's Phase 7-12 onto this codebase's actual shape)

- **Phase 0 (foundation, started 2026-08-11)**: dead-code removal (`App.css`, done), fill token gaps (added `--color-accent-orange` + `taska-*` semantic tokens since no orange/attention/gamification-adjacent tokens existed), add the missing `Badge` component wrapping the `.badge-*` classes that already existed in CSS but had no component wrapper. Foundation only — no page migrated yet.
- **Phase 7 (business-specific UX) — reviewed 2026-08-12, no rebuild needed**: went page-by-page through the 6 "no dedicated Ops page" types (pharmacy, hotel, clinic, laboratory, school, pure_water_factory) to check whether they're genuinely business-specific or just generic modules with renamed labels. Verdict: **genuinely business-specific in every case** — `Pharmacy.jsx` has batch/expiry/substitution/controlled-drug workflows with no equivalent anywhere else in the app; `Rooms.jsx` has housekeeping/maintenance/inspection tracking; `Patients.jsx`/`Consultations.jsx` have HMO/medical-history-aware patient records; `LabRequests.jsx` has a diagnostic test catalogue, sample collection, and specimen rejection flow; `Classes.jsx`/`Students.jsx` have academic sessions/terms/subjects/enrollment; `Production.jsx` (pure_water_factory) has batch-yield production tracking. None of these are the generic CRUD-with-different-labels pattern the constitution warns against. The only concrete gap found across all 6 was the same inline-empty-state pattern already being swept elsewhere — fixed in `LabRequests.jsx` and `Classes.jsx` (2 files that weren't in the original 37-page audit list). No further Phase 7 rebuild work is queued for these 6 types.
- **Phase 8 (motion)**: audit is favorable here — the existing keyframe set is already restrained and on-spec, so this is more "apply consistently" than "invent." Low risk, can run in parallel with Phase 7.
- **Phase 9 (gamification)**: needs a short design pass (backend schema: what counts as "business health," what triggers a milestone/streak) before UI work — flagged as a risk above, not started yet.
- **Phase 10 (mobile)**: the table-responsiveness gap (only 2/69 pages have a mobile fallback) is the concrete, measurable target here.
- **Phase 11 (QA)** and **Phase 12 (polish)**: sequenced last per the user's own phase ordering — don't polish before the underlying batches are functionally verified.

### Files/components to modify first
`src/index.css` (done — token gaps filled), `src/components/Badge.jsx` (done — new), `src/components/EmptyState.jsx` usage sweep (done 2026-08-11 — see below), raw-table mobile fallback (done 2026-08-12 — see below). `ModalShell` simplification investigated 2026-08-12 and closed as a false positive (see below) — no code change needed.

### ModalShell "fragmentation" — investigated 2026-08-12, no change needed
The original audit flagged ModalShell's ~14 files as "unusually fragmented for one component," but that was a file-count observation, not a verified problem. A dedicated read-only investigation (checking every exported symbol's usage, comparing files that looked similar, and counting actual consumers) found: each file owns one clear concern in a legitimate config → pure view-model → hook wiring → JSX pipeline (the same layering Radix UI/Headless UI use internally, just one file per layer instead of one 2000-line file); no dead code beyond a few internally-only-used `export` keywords not worth removing; no genuine duplicated logic between any two files; and only 7 external consumers (`ConfirmDialog.jsx`, `ModalActions.jsx`, `Onboarding.jsx`, `Customers.jsx`, `Expenses.jsx`, `Products.jsx`, `Suppliers.jsx`, `TrustFund.jsx`), all going through the two public entry points (`ModalShell.jsx`, `ModalShellContext.jsx`) — the internal split is already well-encapsulated regardless of file count. **Conclusion: leave it alone.** Refactoring a working, well-encapsulated, high-blast-radius system on a mistaken premise would be pure risk for no gain.

### Phase 10 mobile table gap — done (2026-08-12)
Step 1: every raw `<table>` missing a horizontal-scroll container got one (`overflow-x-auto`) — 7 pages (BillingSettings, Expenses, Products, Inventory, Customers, and Admin.jsx's 6 tables).
Step 2: 5 of those pages (Customers, Products, Inventory, Expenses, BillingSettings) got a proper mobile card-fallback view — `hidden md:block` on the table, a separate stacked-card list shown only below `md`, following `TrustFund.jsx`'s existing reference pattern. Each card reuses the same pre-built row data the table already computes.
`Admin.jsx` deliberately excluded from the card-fallback step — 6 different tables (users/businesses/plans/transactions/support/referrals) would need 6 bespoke card layouts, for a backoffice/superadmin tool nobody operates from a phone. The overflow-x-auto fix from step 1 is judged proportionate there; a full redesign wasn't, per §72's "use judgment" guidance.

### EmptyState sweep — done (2026-08-11)
All pages flagged by the original audit checked and migrated where applicable, across 9 verified batches (each: lint 0 errors, node suite 630 passing, render-smoke 56 passing, committed+pushed separately): Customers, Suppliers, Purchases, Pharmacy, Inventory, Products, Results, Deliveries, Expenses, Bookings, Attendance, Patients, Consultations, LogisticsOps, ServiceOps, BeautyOps, Rooms, MobileAgentOps, Production, WholesaleOps, BuildingMaterialsOps, Reports (fixed at the shared `ReportListCard` level, covering 4 panels in one change), BillingSettings, Portfolio, Partners (also consolidated a local duplicate `EmptyPanel` component into `EmptyState` instead of leaving a second copy - the exact "duplicate components" risk the audit flagged), POS.

Found already correct on inspection (no change needed): TrustFund, Adashe, TaskaCooperative, Dashboard, SMEOps, Transfers - all already used `EmptyState` properly, most because they were split into page+hook this same session with careful review.

Deliberately left as-is, with reasoning: `SelectBusiness.jsx` (bespoke onboarding CTA with a `Link`-based action, a shape `EmptyState`'s onClick-only action prop doesn't support, and already meets the design bar), `RetailOps.jsx`'s empty-cart line (transient POS micro-state, not a page-level empty list), `DemoGeneral.jsx` (static marketing copy, not a real empty state).

---

## Logo integration — done (2026-08-12)

The user supplied the official Taska logo (stylised ribbon T in a purple/blue gradient, "Taska" wordmark with an orange "ka", "By Result Seekers" italic subordinate endorsement) with a detailed 50-section integration brief. Full audit-then-implement pass:

**What was found**: `Logo.jsx` was already a well-built, centralized, variant/theme/size-aware component (`logoConfig.js` drives every preset) — exactly the "one component, one language" architecture the brief asked for. It just rendered the *wrong* mark: an old "orbit and nodes" placeholder icon, not the approved T. `public/favicon.svg` turned out to already contain a vector ribbon-T path close in spirit to the new mark (an earlier, abandoned attempt at the same identity) — reused directly rather than redrawn from scratch. `public/brand/*.png` and root `Taska logo*.png`/`Taska Logo_v2.png` were confirmed to be an old "network node" moodboard, unreferenced by any code.

**What shipped**: `Logo.jsx`'s `BrandIcon` now renders the ribbon-T path with a purple→blue gradient; `BrandWordmark` splits "Taska" into T (gradient) / as (theme-aware) / ka (orange gradient). Because every page already consumes `Logo.jsx` through the shared component, this one change propagates everywhere automatically — sidebar, top nav, login, auth, mobile — with no per-page edits needed. `favicon.svg` simplified (the old version had heavy blur/glow that wouldn't survive being shrunk to 16×16). `icon-192.svg` rebuilt as a real maskable app icon (rounded dark square, T centered in a safe area) and wired into the PWA manifest for both 192/512 slots. Fixed a broken `apple-touch-icon` reference (pointed at a `.png` that never existed) and a `theme_color` mismatch between `index.html` and the PWA manifest (leftover unrelated sky-blue). Verified live via a Playwright screenshot of the login page.

**Explicitly out of scope / not achievable in this environment**: true vector tracing of the supplied PNG artwork, and PNG raster fallback generation — no image-editing tooling (ImageMagick, Inkscape, rsvg-convert, sharp) was available. This is a faithful from-scratch SVG recreation of the mark's shape/colour treatment matching the brief's hierarchy and colour direction, not a pixel-perfect trace. Also not attempted: email-template branding, PDF/report/invoice logo placement, print/monochrome variant, Open Graph/social images, dark-mode-specific logo variant (moot — dark theme was removed from Taska earlier this session), command-palette/loading-screen T-mark animation. The old moodboard PNGs were deliberately left in place (confirmed unreferenced, but not deleted without being asked to).

## Implementation notes for whoever picks this up

- This is a **platform-wide** design direction, not a single-page task. Do not attempt it as one big rewrite — the existing session's pattern of small, verified, incremental changes (proven across the `BelongsToBusiness` tenant-scoping sweep, the render-smoke test sweep, and the 3 new business-type verticals) is the right execution model here too.
- Before touching anything: locate Makaranta's actual production design tokens (colour hex values, spacing scale, radius scale, font stack) — this doc references them by *name* ("Result Seekers Purple," "Makaranta orange") but the exact values need to be pulled from wherever Makaranta's codebase/design system actually defines them, not re-guessed.
- Cross-check against what already exists in Taska's frontend (`frontend/src/config/businessTypes.js`, `navigationPresets.js`, existing Tailwind config/theme) before assuming a token layer needs to be built from scratch — some of §57–60's "design system components" ask may already be partially satisfied.
- Get the missing tail of the animation/gamification master prompt from the user before treating this as complete guidance for that specific piece — see the note at the top of this document.
