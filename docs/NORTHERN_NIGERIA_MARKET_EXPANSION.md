# Northern Nigeria market expansion — new business types

Status: **research + design phase, not implemented. Needs sign-off on priority order before any build starts.**
Created: 2026-08-06.

## Why this exists

Taska already supports 27 business types (`backend/config/business_types.php`), several of which already fit Northern Nigeria's economy well: `agro_dealer`, `farm`, `livestock`, `commodity`, `textile`, and the informal-savings-shaped `Cooperative`/`Adashe`/`Trust Fund` modules. Rather than expanding types speculatively, this doc grounds the next additions in actual market research on what's structurally *missing*, not just "more types." One candidate below (`property_management`) is nationwide rather than Northern-specific — included because it's an unusually strong architectural fit with what's already built, not because of regional demand data.

## Research findings (sourced, not assumed)

- **National baseline**: retail/trade is 44% of Nigeria's informal economy, services (hairdressing, tailoring, repairs) 33%, agriculture only ~6% nationally (Moniepoint 2025 Informal Economy Report) — but agriculture is proportionally far larger and structurally different in the North specifically.
- **Dawanau International Grain Market (Kano)** is one of the largest grain distribution centres in Africa. Taska's `agro_dealer` (trading) and `commodity` (trading/settlement) types don't model **grain milling/processing** (raw grain in, processed flour/rice out) as a distinct workflow.
- **Wudil Livestock Market** is being developed by the Federal Government into what's described as "West Africa's model livestock trading hub." Taska's existing `livestock` type is animal-husbandry-shaped (pens, breeding, milk, medication, disease logs — see `config/business_types.php`'s `livestock` entry) — i.e. a **livestock farm**, not a **livestock market/trading business** (buy/sell at scale, weight-based pricing, market-day cycles). Different operational model.
- **Leather** — Kano's historic, still-active global leather export trade (tanneries + leather goods manufacturing, concentrated in industrial estates like Challawa/Sharada/Bompai). Nothing in the current 27 types covers this.
- **Artisanal solid minerals mining** (gold in Zamfara, gemstones in Kaduna/Plateau/Bauchi) is real and growing, and a stated 2025–2029 state investment priority — but **not recommended**: heavily informal, entangled with security/legality issues in places like Zamfara, and only ~4.4% of national GDP. Wrong risk profile for a formal SME SaaS product.
- **Digital-payment adoption context**: only 1 in 4 informal Nigerian businesses earn even 10% of revenue digitally. This favors Taska's existing offline-queue support (`stores/offlineStore.js`, used throughout `Deliveries.jsx` and elsewhere) as a real differentiator for this market, not a gap to close.

## Recommended new business types, in priority order

### 1. Grain milling / processing (`grain_milling`)
- **Group**: `manufacturing` (alongside `pure_water_factory`)
- **Why first**: cleanest, best-evidenced gap; reuses the production-batch tracking pattern already built for `pure_water_factory` (`ProductionBatch` model, referenced in `DashboardController`'s `production` summary block) rather than needing a new data shape from scratch.
- **Core workflow**: raw grain intake (purchase from farmers/aggregators) → milling/processing batches (yield, waste, byproduct tracking) → output inventory (flour/processed grain) → sales. Needs supplier-side integration with the already-built `Purchase`/`Supplier` models for raw-grain intake.
- **Rough scope**: 1 new migration set (`grain_batches`, maybe `grain_intake_records`), 1-2 models, 1 controller, 1 Resource, dashboard summary block, 1 frontend Ops page, 1 nav preset entry, demo seeder data.

### 2. Livestock trading / market (`livestock_market`)
- **Group**: `commerce` (distinct from `livestock`'s `agriculture` group — this is a market/trading business, not a husbandry operation)
- **Why second**: concrete, current government investment (Wudil), and structurally distinct enough from the existing `livestock` type that forcing it into that type would misrepresent the workflow.
- **Core workflow**: animal intake (purchase from herders/farmers, weight-based pricing) → holding pen inventory → market-day sales (weight-based or negotiated pricing) → settlement. Different KPIs from `livestock` farm type: no breeding/milk/medication, but adds market-day cycles and weight-based pricing negotiation.
- **Rough scope**: similar shape to `commodity` type (which already has weight-based trade tickets, `CommodityTradeTicket`, `weight_kg` fields) — closest existing template to adapt from, likely faster to build than grain milling.

### 3. Leather / hides & skins (`leather_trading`)
- **Group**: `manufacturing` (spans tannery/processing and trading, mirroring how `pure_water_factory` spans production)
- **Why third**: smaller, more geographically concentrated (Kano specifically) than the first two, but a real and well-documented cluster.
- **Core workflow**: hide/skin intake → tanning/processing batches → finished leather goods inventory → sales (including export-oriented bulk sales). Likely the least-differentiated of the three from existing patterns — could plausibly reuse `pure_water_factory`'s production-batch shape closely.

### 4. Property management / rent collection (`property_management`)
- **Group**: `services`
- **Not Northern-specific** (real estate is nationwide — Nigeria's real estate market was valued at ~$29.2B in 2024, growing toward ~$40B by 2030 per NextMSC), but flagged here because it's an unusually strong *architectural* fit, not because of regional demand data: it reuses more of Taska's existing building blocks than almost any other candidate.
- **Why it fits so well**: a landlord/agency managing multiple units collecting recurring rent + service charges is structurally near-identical to the `TrustAccount`/`TrustTransaction` running-balance ledger already built for Adashe/Trust Fund (`Customer` → tenant, due dates, balance, payment history), and maintenance requests already have a working template in `HotelMaintenanceRequest`. Lowest-risk, fastest build of any candidate in this doc.
- **Core workflow**: property/unit registry (non-fungible, one row per unit rather than stock quantity) → tenant assignment + lease terms → recurring rent/service-charge ledger (reuse `TrustAccount`/`TrustTransaction` shape) → maintenance request tracking (reuse `HotelMaintenanceRequest` shape).
- **Deliberately scoped to management/rent collection only** — see below for why the other two real-estate flavors are excluded for now.

### Real estate flavors explicitly excluded from `property_management`
Nigerian real estate SMEs split into three distinct flavors; only the one above is recommended right now:
- **Agency/brokerage** (sells/lets listings on commission) — a genuinely new "deal pipeline" shape (listing moves available → under offer → let/sold → commission paid) with no strong existing Taska template to build from (closest analog is `Purchase`'s status lifecycle, but for deals, not goods). Possible phase two, not now.
- **Developer/land sales** (off-plan units sold in installments over months/years) — excluded for the same category of reason as artisanal mining below: real legal complexity around land titling and informal allocation in Nigeria (title disputes, informal land-allocation disputes in some markets), plus a genuinely different "one-off non-fungible unit" data model rather than restockable inventory. Wrong risk profile to build for right now.

### Explicitly not recommended right now
- **Artisanal solid minerals mining** — see research findings above. Revisit only if Taska's risk posture changes or the sector formalizes further.
- **Real estate developer/land sales** — see immediately above.

## What each addition actually requires (based on the existing 27-type pattern)

1. New entry in `config/business_types.php` (`name`, `group`, `modules` array) — see `livestock`'s entry as a template.
2. Domain-specific migrations + Eloquent models (following the `BelongsToBusiness` trait convention where the model has its own `business_id`).
3. Controller + Form Requests + API Resource(s), following the flat-JSON (`->resolve()`) convention standardized earlier this session — **not** the default `JsonResource` wrapping.
4. New summary block added to `DashboardController::__invoke()` (the pattern every other vertical follows — see e.g. the `livestock`/`farm`/`commodity` blocks).
5. Tenant-isolation test (mirrors `PurchaseFlowTest`'s "records are hidden from other businesses" pattern) and a workflow-state test.
6. Frontend Ops page (e.g. `GrainMillingOps.jsx`) + navigation preset entry in `navigationPresets.js` + demo account/seeder data for onboarding.
7. Render-smoke test addition to `tests-render/pages.render.test.jsx`'s page array, per the harness built earlier this session.

Each of these is roughly the same shape and size as the existing verticals already in the codebase (e.g. `PureWaterRetailController`, `CommodityLot`/`CommodityTradeTicket`) — this is additive work following an established pattern, not new architecture.

## Open questions before starting implementation

- Which of the four (if any) should be built first — grain milling is the strongest Northern-demand case, livestock market may be fastest to build given its similarity to `commodity`, and `property_management` is arguably the lowest-risk/fastest build of all four given how much it reuses (`TrustAccount`/`TrustTransaction`, `HotelMaintenanceRequest`) despite not being Northern-specific.
- Do any of these need real on-the-ground validation (a pilot business, a demo with an actual Kano trader, or a property manager for `property_management`) before investing engineering time, or is the research sufficient to proceed?
- Should `livestock_market` and `livestock` (farm) share any data model (e.g. can a business run both, per the multi-module composition idea in [MULTI_MODULE_ARCHITECTURE.md](MULTI_MODULE_ARCHITECTURE.md)), since a cattle rearer and a cattle trader are adjacent, not identical, businesses?
