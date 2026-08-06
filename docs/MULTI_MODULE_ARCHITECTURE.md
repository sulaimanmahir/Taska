# Multi-module / multi-business architecture — design proposal

Status: **design phase, not implemented, needs sign-off before any schema change.**
Created: 2026-08-06, prompted by product questions raised during the 2026-08 engineering session (see [ENGINEERING_WORKPLAN_2026-08.md](ENGINEERING_WORKPLAN_2026-08.md) item 9).

## The two problems

1. **Composable verticals on one business.** A hospital running clinic + pharmacy + lab together needs shared patient/customer records and unified financials/staff — but each of those verticals must also work completely standalone for a customer who only wants one (a clinic-only customer shouldn't be forced into a bundle). Same shape of problem for a restaurant+hotel combo, or a school with an attached clinic/pharmacy.
2. **Portfolio view across unrelated businesses.** A user who owns multiple *unrelated* businesses (a shop and a separate restaurant, say) already has switching support today, but no aggregate view — the dashboard only ever shows one business at a time.

These are different problems with different-sized fixes. Problem 2 is small; problem 1 is a real architecture decision.

## What already exists (checked against the actual code, not assumed)

- `businesses.modules` is **already a `json` column** (`database/migrations/2026_04_19_000001_create_businesses_table.php`). It is populated once at signup from `config('business_types.types.{type}.modules')` (`BusinessProvisioningService::getDefaultModules()`) and is never edited afterward — no endpoint, no settings UI touches it post-creation.
- **`modules` is not what it sounds like for this purpose.** Looking at `config/business_types.php`, it's a list of fine-grained *feature toggles within one vertical* — e.g. retail gets `['dashboard', 'pos', 'inventory', ..., 'loyalty', 'refunds', 'barcode_labels']`, pharmacy gets `[..., 'prescriptions', 'expiry_tracking']`. It is **not** a mechanism for selecting multiple top-level verticals (clinic + pharmacy + lab) on one business. Repurposing it for that would overload a field that already means something else.
- **The frontend doesn't read `modules` at all.** `grep` across `frontend/src/config` and `frontend/src/stores` for `.modules` returns nothing. Navigation (`navigationPresets.js`), page routing, and per-page vertical branching (e.g. `POS.jsx` rendering `RestaurantPOS`/`BuildingMaterialsOps`/etc.) are all driven entirely by the single `business_type` string via `useBusinessType()`.
- **Multi-business switching already works.** `authStore.js` tracks a `businesses[]` array per user with `switchBusiness()`, and the UI has a current-business switcher. This is the foundation problem 2 builds on — it's additive, not a redesign.
- **Tenant isolation is per-`business_id`**, not per-vertical (`Customer`, `Product`, `Order`, `InventoryItem`, etc. are scoped by `business_id` only — see the `BelongsToBusiness` trait added earlier this session). This matters: it means giving one `business_id` multiple active verticals gets shared customer/product/financial records "for free," with no sync/replication layer needed, as long as the verticals' own operational tables don't collide. They don't — each vertical's domain tables are already separately namespaced (`health_*`, `pharmacy_*`, `hotel_*`, etc.), so multiple verticals coexisting on one `business_id` is mostly a routing/UI problem, not a data-collision problem.

## Proposed model

Two independent axes, not one:

1. **`business_types` (new, plural) — which top-level verticals are active on this business.** Replaces the single `business_type` string as the thing that drives navigation/routing, while `business_type` itself can stay as a "primary type" for onboarding defaults, labeling, and backward compatibility (existing single-vertical businesses need zero migration if the primary type just becomes the sole entry in a new list).
2. **`modules` (existing) — feature toggles within an active vertical.** Keeps its current meaning and mechanism; just needs the currently-missing "edit after signup" capability.

This keeps the fix narrow: it's an *additive* new field plus a routing change, not a redefinition of a column whose current meaning would otherwise need a data migration and a "what does old data mean now" reconciliation.

### Why not just make `business_type` an array?

Considered and rejected: too much existing code (`business_types.roles`, seed scripts, demo accounts, `getDefaultModules()`, every `if (type === 'x')` branch in ~68 frontend pages) assumes a single string. A new `business_types` array field that *defaults to* `[business_type]` for existing rows is additive and backward-compatible; changing the meaning of the existing column is not.

## Schema change (sketch, not final)

```php
// new migration
Schema::table('businesses', function (Blueprint $table) {
    $table->json('active_business_types')->nullable()->after('business_type');
});

// backfill: active_business_types = [business_type] for every existing row
```

Every current single-vertical business ends up with a one-element array identical to today's behavior — no observable change until a business is explicitly given a second vertical.

## Frontend routing change (the bigger piece)

Today: `navigationPresets[business_type]` returns one fixed nav tree; pages like `POS.jsx`/`Debtors.jsx`/`Transfers.jsx` branch with `if (type === 'x') return <XOps />`.

Needed: navigation becomes a **merge** of the nav sections for every active vertical (dedupe shared items like Dashboard/Expenses/Reports), and the per-page branching becomes "does this business have vertical X active" rather than "is business_type === X". This is a real but mechanical change — `useBusinessType()` already sits behind every one of these decisions, so it's the single choke point to change, not 68 separate page edits.

## Portfolio dashboard (problem 2 — the smaller piece)

- New endpoint that loops over the requesting user's `businesses[]` (already available via existing auth/business-switch machinery) and returns each one's dashboard stats plus rolled-up totals (revenue, staff count, etc.).
- New top-level page (not gated behind any business context) showing per-business cards + aggregate summary, with a link into each business's normal dashboard.
- No tenant-isolation changes needed — each business's data stays scoped by its own `business_id` exactly as today; this endpoint just fans out multiple already-scoped reads for the same authenticated user.

## Billing — flagged, not designed here

Current plan/feature-limit enforcement (`staff_limit` etc., seen in `tests/Feature/BillingWorkflowStateTest.php`) needs investigation before deciding whether multi-vertical businesses pay per-vertical, a flat multi-vertical tier, or something else. Deliberately out of scope for this document — needs its own pass once the module model above is settled, since pricing is a product decision, not an engineering one.

## Suggested sequencing

1. **Portfolio dashboard** (problem 2) — small, additive, no schema risk, ships value immediately using infrastructure that already exists.
2. **`active_business_types` migration + backfill** — additive, zero behavior change for existing businesses until acted on.
3. **`modules` edit endpoint + settings UI** — lets a business toggle feature flags within its active verticals; independently useful even before multi-vertical support ships.
4. **Frontend navigation/routing merge** — the real work; touches `useBusinessType()` and the nav-preset merge logic; every page's `if (type === 'x')` branch needs auditing against "is X in active_business_types" instead.
5. **Billing model** — separate product decision, own workplan item.

## Open questions for sign-off before starting implementation

- Does `active_business_types` need an admin-only gate (sales-assisted upgrade) or can an owner self-serve enable a second vertical?
- Should there be a hard cap on how many verticals one business can activate, or is it unbounded?
- For the primary/first vertical vs. added verticals — does anything (default warehouse, default branch, onboarding checklist) need to special-case "the original one"?
