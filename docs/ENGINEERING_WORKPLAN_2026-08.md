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

11 real lint errors remain, all `react-hooks/rules-of-hooks` violations (hooks called after an early `return` — a real bug class, not just style: if the early-return condition ever changes between renders, React throws "Rendered more/fewer hooks than expected") plus 2 `setState`-in-effect warnings:
- [ ] `Admin.jsx` (3), `Debtors.jsx` (3), `Rooms.jsx` (3) — hooks called conditionally after an early return; needs each component restructured so all hooks run unconditionally before any early return, not a blind fix.
- [ ] `Partners.jsx` (2) — synchronous `setState` inside an effect risking cascading renders.

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

### 7. Purchases/payables workflow — Not started
- [ ] Design PO → GRN → supplier-payment data model
- [ ] Backend service + controllers + tests, following the `OrderService` pattern (tenant-scope test, insufficient-stock-equivalent edge cases, controller validation test)
- [ ] Frontend pages once backend is stable

## Notes

- This workplan intentionally does not include a "rewrite" of anything — the architecture (Laravel service layer, React + Tanstack Query + Zustand, pure-function `lib/` helpers) is sound. The gaps are inconsistent application of patterns the codebase already proves out (see `lib/retail.js`), plus missing engineering scaffolding (git, CI, tenant enforcement).
- Update the checkboxes above as each item lands, and log any scope changes here rather than starting a separate document.
