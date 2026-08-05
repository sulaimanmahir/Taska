# TASKA Engineering Workplan — Foundations & Hardening

Created: 2026-08-04

## Why this exists

This workplan captures a senior-level system assessment of TASKA's frontend and backend as of 2026-08-04, and tracks the fixes through to completion. It sits alongside the feature-focused [WORKPLAN_2026-08.md](WORKPLAN_2026-08.md) — that one tracks the sales/checkout milestone cycle; this one tracks foundational engineering debt (version control, tenant safety, test coverage, code structure) that the feature work depends on.

## Priority order and rationale

Ordered by blast radius and how much everything else depends on it, not by effort.

1. **Version control** — the project had no `.git` repository at all. No history, no diffs, no revert path, no code review, no CI possible. Blocks everything else below.
2. **CI pipeline** — once git exists, get both test suites running on every push so regressions are caught automatically instead of relying on manual runs.
3. **Tenant-scoping enforcement** — currently done by convention (`where('business_id', ...)` hand-written in 44+ controllers, zero Eloquent global scopes). One missed line is a cross-tenant data leak. Already flagged in [ROADMAP.md](../ROADMAP.md) as an active gap.
4. **Password reset / account recovery** — *correction*: this was flagged as missing based on `ROADMAP.md`'s own "Active Gaps" section, without checking the actual code first — the same mistake as item 6 below, now made twice. It is fully implemented: backend uses Laravel's standard `Password` broker (`AuthController::forgotPassword`/`resetPassword`, `password_reset_tokens` migration present, both flows covered in `tests/Feature/AuthFlowTest.php`); frontend has `ForgotPassword.jsx` and `ResetPassword.jsx`, routed in `App.jsx`, linked from `Login.jsx`, and covered by `tests/forgotPasswordPage.test.js` / `tests/resetPasswordPage.test.js` (6 passing tests). Nothing to build here — `ROADMAP.md` should be corrected instead.
5. **Oversized page components** — several frontend pages are 40–66KB single files mixing data-fetching, business logic, and rendering (`TaskaCooperative.jsx`, `Adashe.jsx`, `TrustFund.jsx`, `Partners.jsx`, `Deliveries.jsx`). Hard to review, hard to test, high regression risk per change.
6. **Frontend test coverage gaps** — *correction after fuller review*: the initial assessment only checked `frontend/src` and missed `frontend/tests/`, which holds 129 test files and 502 passing tests (`npm test`), covering most page-level and lib-level logic already. Coverage is not thin overall. The real, narrower gap is a specific set of untested `lib/` modules — mostly the finance-adjacent helpers (`financeFormatters`, `financeActionRouting`, `financeFieldBuilders`, `financeLensItems`, `financeRecommendationPresenter`) and dashboard summary builders (`dashboardFinanceSummaries`, `dashboardAiSummaries`, `dashboardOwnerFocus*`, `dashboardVertical*`). Config/wiring files (`api.js`, `config.js`, `queryClient.js`) legitimately don't need tests and are excluded from this gap.
7. **Purchases/payables workflow** — real product gap (no PO → GRN → supplier-payment flow), not just polish; matters more than new vertical modules at this point.

## Critical finding: 3 live production crashes, found by actually running the app (2026-08-05)

While starting the item-5 (oversized components) refactor, the plan was to screenshot `TaskaCooperative.jsx` and `Adashe.jsx` before/after as a safety net, since their only existing tests (`cooperativePage.test.js`, `adashePage.test.js`) turned out to be regex checks against the raw file text, not real rendered-component tests. Installing Playwright and actually logging into a live instance surfaced three real, unrelated crash bugs that no test in the suite had caught, because nothing in the suite renders these pages:

- **`Adashe.jsx` and `TrustFund.jsx` crashed on every load**: `ReferenceError: Cannot access '<var>' before initialization`. Both pages called `useQuery(...)` referencing `accountsPage`/`activeView`/`deferredSearchTerm` *before* the `useLedgerControls()` hook that declares them was called later in the same component. Not a circular dependency in practice — `useLedgerControls`'s state (page/search/view/sort) never actually depended on the query's response, only its returned `pagination` object did. Fixed by exporting a standalone `computeLedgerPagination()` from `useLedgerControls.js`, moving the hook call above the query in both pages, and computing `pagination` separately once the query response is available.
- **The main `Dashboard.jsx` (the first screen after login) crashed for any business without existing cooperative/adashe/trust-fund data** — i.e. most businesses, since these are optional add-on modules: `TypeError: Cannot read properties of null (reading 'pending_approvals')`. Root cause: `getCooperativeDashboardState(summary = {})`-style default parameters don't apply to an explicit `null` (only `undefined`), and the dashboard-stats API returns `null` (not an absent key) for modules a business hasn't used yet. Fixed all 6 vulnerable functions in `dashboardFinanceSummaries.js` by normalizing with `summary = summary || {}` in the function body instead of relying on the default-parameter syntax.
- Verified all three fixes against a live backend + frontend (registered a real test business via the API, logged in through the actual UI with Playwright, screenshotted before/after) rather than trusting the test suite alone, since the regex-based page tests would not have caught any of this.

**Why this matters beyond the fix itself:** the two `useLedgerControls` ordering bugs and the six default-parameter bugs are both single root causes that happened to be duplicated by copy-paste across files (`Adashe.jsx`/`TrustFund.jsx`; 6 functions in one file) — the kind of thing worth grepping for the same pattern elsewhere before considering a "page" fixed. Also a concrete argument for item 6 above: page-level rendering tests (even a minimal "renders without throwing" smoke test per page) would have caught all three of these automatically, and are cheap relative to the severity of what they'd catch.

Known follow-up, not fixed in this pass: fixing `TrustFund.jsx`'s `useLedgerControls` ordering bug exposed 3 pre-existing `react-hooks/refs` lint errors that were previously invisible to lint (the TDZ crash appears to have short-circuited the linter's deeper static analysis of the file). These are about ref-derived closures being passed as arguments into external builder functions (`buildTrustFundFocusActions` etc. in `lib/financeActionRouting.js`) rather than being constructed as local literals the way `Adashe.jsx` already does it correctly - not a runtime bug (the closures are only invoked on click, never during render), but fixing it properly means restructuring the shared builder-function pattern across however many pages use `financeActionRouting.js`, which is a separate, larger change than this pass.

## Status

### 1. Version control — Done
- [x] `git init` in project root
- [x] Confirm `.env` and other secrets stay untracked (`.gitignore` already covers `.env*`)
- [x] Initial commit of current working tree
- [x] Add remote `origin` → `https://github.com/sulaimanmahir/Taska.git`
- [x] Push initial commit to `main`

### 2. CI pipeline — Mostly done
- [x] Add `.github/workflows/ci.yml`
  - Frontend job: `npm ci`, `npm run lint`, `npm test` (Node's built-in test runner via `node --test`)
  - Backend job: `composer install`, run PHPUnit (`tests/Unit`, `tests/Feature`) against in-memory SQLite (matches `phpunit.xml`, no external DB service needed)
- [x] Frontend job passes locally (502 tests)
- [x] Backend job: all 3 originally-discovered pre-existing failures are now fixed — full suite passes (242 passing / 0 failing)

**Found while wiring this up:** running the backend suite for the first time (it had never run in CI) surfaced 11 pre-existing failing tests, unrelated to any of the assessment items. Root cause for 8 of them: **19 controllers returned a bare `JsonResource` instance**, which Laravel auto-wraps in `{"data": ...}` — but the "Operations" test files for those modules asserted flat JSON (matching the convention already used in `OrderController`, which explicitly calls `->resolve()`). Separately, 9 "WorkflowState" test files for the *same* modules asserted the opposite (`data.`-prefixed), because they were written against the actual (wrapped) behavior rather than the intended convention. Fixed by:
- Standardizing on the `OrderController` convention (`->resolve()` / unwrapped JSON) across all 33 bare-resource-return call sites in: AgroDealerController, BeautyController, ConstructionMaterialsController, FuelController, MobileAgentController, PureWaterRetailController, RestaurantController, ServiceBusinessController, TextileController.
- Updating the 9 `*WorkflowStateTest.php` files that had encoded the old (wrapped) behavior to match.
- Result: backend suite went from 229 passing / 11 failing to 237 passing / 3 failing.

**All 3 remaining failures are now fixed, each a genuinely distinct bug:**
- [x] `FarmOperationsTest`: same resource-wrapping bug as above, just not caught in the first pass — `FarmController`'s 3 create endpoints (`storePlantingCycle`, `storeInputLog`, `storeHarvestLog`) still used bare `Resource->response()`. Fixed the same way, and stripped the matching `data.` prefixes from `FarmWorkflowStateTest.php`.
- [x] `ConstructionOperationsTest`: real bug, not wrapping. `ConstructionMaterialsService::ensureSetup()` unconditionally seeded a second "Main Warehouse" with `is_default => true` on every call, even when the business already had a default warehouse from onboarding (as `CreatesTenantContext` provisions in tests, and normal business onboarding provisions in production). Two `is_default = true` warehouses made `defaultWarehouseId()`'s query pick an arbitrary one — often the newly-seeded, empty one — so the quotation→order conversion checked stock in the wrong warehouse. Fixed by only marking the seeded warehouse default when the business doesn't already have one.
- [x] `MobileAgentOperationsTest` (foreign-tenant reversal 403-vs-422) — fixed as part of item 3 below.

Backend suite: **242 passing / 0 failing.**

**Also found while wiring this up (frontend side):** `npm run lint` had never been run in CI either. Fixed the ESLint config gap (`frontend/tests/**` used Node globals like `process` but the flat config only declared browser globals) and cleaned up 6 trivial pre-existing unused-var errors. One of those unused imports (`validateInventoryAdjustmentPayload` in `Inventory.jsx`) turned out to be genuinely unfinished wiring — the validator existed, the error-display JSX existed, but nothing called the validator or ever set the error state — so that's now wired into the adjustment form's submit handler instead of just deleted.

All real lint errors are now fixed (frontend lint: 0 errors, 115 pre-existing `exhaustive-deps` warnings remain - style only, not bugs):
- [x] `Admin.jsx`, `Debtors.jsx`, `Transfers.jsx` — each had hooks declared after an early `return`, which breaks React's hook-order guarantee if the early-return condition ever changes between renders. Moved all hooks above the early returns. `Admin.jsx` also had its role-gate `navigate()` call moved into a `useEffect` (it was a side effect running directly in the render body) and gained `enabled: isAdmin` on its query. (`Rooms.jsx` turned out already fine once line numbers shifted from the earlier unused-import cleanup.)
- [x] `Partners.jsx` — two effects called `setState` synchronously to seed default form state once async data loaded. Replaced both with React's recommended "adjust state during render" pattern (conditional, self-limiting `setState` calls directly in the render body) instead of an effect.

### 3. Tenant-scoping enforcement — In progress
- [x] Add a `BelongsToBusiness` trait (`app/Concerns/BelongsToBusiness.php`) + Eloquent global scope applied to tenant-owned models, auto-filtering by `auth('sanctum')->user()->current_business_id`. No-ops outside an authenticated request (console/seeders/unit tests), so it never masks a missing filter in code that manages `business_id` explicitly.
- [x] Applied to the 4 highest-risk models first: `Order`, `Product`, `InventoryItem`, `Customer`.
- [x] Regression test proving the scope blocks cross-tenant reads with **no manual filter at all** (`tests/Unit/BelongsToBusinessScopeTest.php`) — also proves the no-op-outside-auth behavior.
- [x] Fixed the `MobileAgentOperationsTest`/`MobileAgentWorkflowStateTest` 403-vs-422 conflict this surfaced: `StoreMobileAgentReversalRequest` validated `mobile_agent_transaction_id` with an unscoped `Rule::exists`, unlike its sibling fields (`branch_id`, `staff_id`, `commission_tier_id`) in the same request, which already scope by `business_id`. Scoped it to match, and updated the one WorkflowStateTest assertion that had been written against the old (403) behavior to expect 422 — consistent with the rest of that same endpoint's validated fields.

**Important design decision made here:** naively applying the global scope broke 5 currently-passing tests (`TenantIsolationTest`, `RetailWorkflowTest`, `ProductWorkflowStateTest`, `CustomerWorkflowStateTest`, `OrderWorkflowStateTest`) that deliberately assert **403** for cross-tenant access to a single record via route-model-binding + Policy (e.g. `PATCH /products/{product}`). The scope would've silently turned those into **404** (record scoped out before the Policy ever runs), changing a tested API contract without anyone deciding to. Rather than pick a side on 403-vs-404 unilaterally, the trait overrides `resolveRouteBinding()` to resolve route-bound models *without* the scope, preserving the existing Policy-driven 403 behavior exactly as tested. The scope still applies to every other query — list/index endpoints, relation loads, ad-hoc lookups — which is where the actual documented gap lives (a controller that forgets `where('business_id', ...)` on a query that isn't a single-record route-bound lookup). Full suite after this change: still 240 passing / 2 failing (both pre-existing, unrelated — see item 2 above), zero regressions.

- [ ] Migrate remaining high-risk models (finance: `Expense`, `Supplier`, `Debtors`/receivables; inventory: `InventoryMovement`, `Warehouse`) onto the trait
- [ ] Sweep remaining models incrementally (not a single big-bang PR — safer to verify each in isolation against the full suite, as happened here)

### 4. Password reset flow — Already done (verified 2026-08-05)
- [x] Backend: forgot-password request + reset-token flow via Laravel's `Password` broker, `password_reset_tokens` table present
- [x] Frontend: "Forgot password" entry point (linked from `Login.jsx`), request form, reset form, both routed
- [x] Tests: request-link flow and reset-with-valid-token flow covered (`AuthFlowTest.php`); frontend wiring covered (`forgotPasswordPage.test.js`, `resetPasswordPage.test.js`)
- [ ] `ROADMAP.md` still lists this under "Active Gaps > Platform Hardening" — should be corrected there too, since it's stale

### 5. Oversized page components — Not started
- [ ] Start with the two largest: `TaskaCooperative.jsx` (66KB), `Adashe.jsx` (61KB)
- [ ] Extract data-fetching + mutations into a dedicated hook (mirrors the `lib/retail.js` + `POS.jsx` split already proven in this codebase)
- [ ] Extract pure presentation into smaller components
- [ ] No behavior changes in this pass — structural only, verified by existing tests + manual smoke check

### 6. Frontend test coverage gaps — Not started
- [ ] Add unit tests for the finance-adjacent `lib/` helpers listed above (`financeFormatters`, `financeActionRouting`, `financeFieldBuilders`, `financeLensItems`, `financeRecommendationPresenter`)
- [ ] Add unit tests for dashboard summary builders (`dashboardFinanceSummaries`, `dashboardAiSummaries`, `dashboardOwnerFocus*`, `dashboardVertical*`)
- [ ] Re-run the gap check (`for f in src/lib/*.js; do ...` matching against both `tests/` and `src/`) periodically rather than assuming coverage from file count alone

### 8. "Renders without crashing" smoke tests — Not started

**Why this jumped the queue (2026-08-05):** all 129 existing `frontend/tests/*.test.js` "page" tests turned out to be regex checks against raw file text (`fs.readFileSync` + `assert.match`), not real rendered-component tests — confirmed by finding 3 live crash bugs (see item 3's design-decision note and the crash-fix commit) that every one of those 129 tests missed, because none of them actually render a component. This is the single highest-leverage remaining gap: cheap to add, and it directly closes the hole that let three production-crashing bugs sit undetected.

- [ ] Add Vitest (Vite's own test runner - reuses the project's existing Vite transform pipeline for JSX/CSS/aliases, unlike trying to force plain `node --test` to handle `.jsx` files) + jsdom as dev dependencies
- [ ] Build one shared test harness: mock `lib/api.js`, wrap in `QueryClientProvider` + `MemoryRouter` + a fake authenticated `authStore` state
- [ ] Add a "renders without throwing" test per page component, prioritizing the pages already proven risky (`Dashboard.jsx`, `Adashe.jsx`, `TrustFund.jsx`, `TaskaCooperative.jsx`, `Partners.jsx`, `Deliveries.jsx`) before sweeping the rest
- [ ] Wire the new Vitest run into `.github/workflows/ci.yml` alongside the existing `npm test` (Node test runner) step - keep both, since the 129 regex tests aren't worthless, just insufficient alone
- [ ] Note for later: this in-process smoke test still won't catch bugs that only manifest against a real backend response shape (mocked data can hide backend/frontend contract drift) - the Playwright-based live smoke test used to find and verify today's 3 crash fixes is worth turning into a standing (probably manual-trigger, not every-PR) check, but that's future scope beyond this item.

### 9. Multi-business / multi-module architecture — Design phase, not started

Prompted by two related product questions during this session:
- A single tenant should be able to compose multiple verticals under one business (e.g. a hospital running clinic + pharmacy + lab together) with shared customer/patient records and unified financials/staff - but each of those verticals must also be purchasable and usable completely standalone (a clinic-only customer shouldn't be forced into a bundle).
- A user with multiple **unrelated** businesses (already supported today - `authStore.js` tracks a `businesses[]` array with `switchBusiness()`, and the UI has a current-business switcher) has no aggregate view - the dashboard only ever shows `current_business_id`'s data, one context at a time. Needs a portfolio-style view: separate cards per business plus rolled-up totals for financials/staff/etc.

**Recommended direction (not yet built, needs sign-off before implementation):**
- Turn `business_type` + its implied `modules` array into an independently selectable **set of modules per business**, instead of one type implying one fixed module bundle. Since `Customer`, `Product`, `Order`, `InventoryItem` etc. are already scoped by `business_id` (not by vertical), enabling multiple vertical modules on one `business_id` gets shared records "for free" - no sync/replication layer needed, unlike a design based on separate linked `Business` records.
- Add a portfolio/aggregate dashboard: an endpoint that loops over the user's `businesses[]` and returns each one's stats plus rolled-up totals, and a new top-level page to display it. Doesn't require changing the tenant-isolation model, since each business's data stays cleanly separated by `business_id` underneath.
- Billing would need to key off the enabled module set (per-module or tiered pricing) rather than a fixed plan tied to one vertical - out of scope to design in detail here, flagging so it isn't forgotten.

- [ ] Confirm this direction with product/stakeholder sign-off before any schema changes (this changes the core tenant/module model - higher blast radius than anything else in this workplan)
- [ ] Design the `modules` schema change (join table vs. JSON column on `businesses`) and migration path for existing single-type businesses
- [ ] Design the portfolio-dashboard API shape and page
- [ ] Scope billing implications separately once the module model is settled

### 7. Purchases/payables workflow — Not started
- [ ] Design PO → GRN → supplier-payment data model
- [ ] Backend service + controllers + tests, following the `OrderService` pattern (tenant-scope test, insufficient-stock-equivalent edge cases, controller validation test)
- [ ] Frontend pages once backend is stable

## Notes

- This workplan intentionally does not include a "rewrite" of anything — the architecture (Laravel service layer, React + Tanstack Query + Zustand, pure-function `lib/` helpers) is sound. The gaps are inconsistent application of patterns the codebase already proves out (see `lib/retail.js`), plus missing engineering scaffolding (git, CI, tenant enforcement).
- Update the checkboxes above as each item lands, and log any scope changes here rather than starting a separate document.
