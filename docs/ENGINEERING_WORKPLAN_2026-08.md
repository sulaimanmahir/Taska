# TASKA Engineering Workplan — Foundations & Hardening

Created: 2026-08-04

## Why this exists

This workplan captures a senior-level system assessment of TASKA's frontend and backend as of 2026-08-04, and tracks the fixes through to completion. It sits alongside the feature-focused [WORKPLAN_2026-08.md](WORKPLAN_2026-08.md) — that one tracks the sales/checkout milestone cycle; this one tracks foundational engineering debt (version control, tenant safety, test coverage, code structure) that the feature work depends on.

## Priority order and rationale

Ordered by blast radius and how much everything else depends on it, not by effort.

1. **Version control** — the project had no `.git` repository at all. No history, no diffs, no revert path, no code review, no CI possible. Blocks everything else below.
2. **CI pipeline** — once git exists, get both test suites running on every push so regressions are caught automatically instead of relying on manual runs.
3. **Tenant-scoping enforcement** — currently done by convention (`where('business_id', ...)` hand-written in 44+ controllers, zero Eloquent global scopes). One missed line is a cross-tenant data leak. Already flagged in [ROADMAP.md](../ROADMAP.md) as an active gap.
4. **Password reset / account recovery** — missing entirely; blocks real (non-demo) usage.
5. **Oversized page components** — several frontend pages are 40–66KB single files mixing data-fetching, business logic, and rendering (`TaskaCooperative.jsx`, `Adashe.jsx`, `TrustFund.jsx`, `Partners.jsx`, `Deliveries.jsx`). Hard to review, hard to test, high regression risk per change.
6. **Frontend test coverage gaps** — *correction after fuller review*: the initial assessment only checked `frontend/src` and missed `frontend/tests/`, which holds 129 test files and 502 passing tests (`npm test`), covering most page-level and lib-level logic already. Coverage is not thin overall. The real, narrower gap is a specific set of untested `lib/` modules — mostly the finance-adjacent helpers (`financeFormatters`, `financeActionRouting`, `financeFieldBuilders`, `financeLensItems`, `financeRecommendationPresenter`) and dashboard summary builders (`dashboardFinanceSummaries`, `dashboardAiSummaries`, `dashboardOwnerFocus*`, `dashboardVertical*`). Config/wiring files (`api.js`, `config.js`, `queryClient.js`) legitimately don't need tests and are excluded from this gap.
7. **Purchases/payables workflow** — real product gap (no PO → GRN → supplier-payment flow), not just polish; matters more than new vertical modules at this point.

## Status

### 1. Version control — In progress
- [ ] `git init` in project root
- [ ] Confirm `.env` and other secrets stay untracked (`.gitignore` already covers `.env*`)
- [ ] Initial commit of current working tree
- [ ] Add remote `origin` → `https://github.com/sulaimanmahir/Taska.git`
- [ ] Push initial commit to `main`

### 2. CI pipeline — Not started
- [ ] Add `.github/workflows/ci.yml`
  - Frontend job: `npm ci`, `npm run lint`, `npm test` (Node's built-in test runner via `node --test`)
  - Backend job: `composer install`, run PHPUnit (`tests/Unit`, `tests/Feature`) against a throwaway SQLite/Postgres DB
- [ ] Confirm both jobs pass on the initial push

### 3. Tenant-scoping enforcement — Not started
- [ ] Add a `BelongsToBusiness` trait + Eloquent global scope applied to tenant-owned models, auto-filtering by `auth()->user()->current_business_id`
- [ ] Migrate high-risk controllers first (finance, inventory, orders) to rely on the scope instead of manual `where('business_id', ...)`
- [ ] Add a regression test that proves the scope blocks cross-tenant reads even when a controller "forgets" to filter manually
- [ ] Sweep remaining controllers incrementally (not a single big-bang PR — too risky without CI history yet)

### 4. Password reset flow — Not started
- [ ] Backend: forgot-password request + signed reset-token email + reset endpoint (Laravel's built-in `Illuminate\Auth\Passwords` broker)
- [ ] Frontend: "Forgot password" entry point, request form, reset form
- [ ] Tests: token expiry, invalid token, successful reset invalidates old sessions

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
