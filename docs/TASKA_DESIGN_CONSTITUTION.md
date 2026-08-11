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

## Implementation notes for whoever picks this up

- This is a **platform-wide** design direction, not a single-page task. Do not attempt it as one big rewrite — the existing session's pattern of small, verified, incremental changes (proven across the `BelongsToBusiness` tenant-scoping sweep, the render-smoke test sweep, and the 3 new business-type verticals) is the right execution model here too.
- Before touching anything: locate Makaranta's actual production design tokens (colour hex values, spacing scale, radius scale, font stack) — this doc references them by *name* ("Result Seekers Purple," "Makaranta orange") but the exact values need to be pulled from wherever Makaranta's codebase/design system actually defines them, not re-guessed.
- Cross-check against what already exists in Taska's frontend (`frontend/src/config/businessTypes.js`, `navigationPresets.js`, existing Tailwind config/theme) before assuming a token layer needs to be built from scratch — some of §57–60's "design system components" ask may already be partially satisfied.
- Get the missing tail of the animation/gamification master prompt from the user before treating this as complete guidance for that specific piece — see the note at the top of this document.
