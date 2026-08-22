# TASKA Milestone Board — 2026-08

## Milestone 1 — Core workflow hardening
Status: Complete

### Tasks
- [x] Add stock validation before sale order creation
- [x] Add regression tests for insufficient inventory
- [x] Surface stock availability in the POS product list
- [x] Block out-of-stock product additions at the UI layer

### Next actions
- [x] Add per-item stock validation inside the cart before sale submission
- [x] Show a cart-level warning when requested quantity exceeds available stock
- [x] Improve error feedback for failed sales

## Milestone 2 — Inventory-aware checkout experience
Status: Complete

### Tasks
- [x] Validate cart quantities against available stock before submitting
- [x] Display remaining stock in the cart for each line item
- [x] Prevent quantity increases beyond available stock

## Milestone 3 — Workflow reliability and testing
Status: Complete

### Tasks
- [x] Add frontend tests for POS checkout behavior
- [x] Add backend tests for failed sale submissions and inventory edge cases
- [x] Document the core sales workflow for demo use

## Milestone 4 — Product readiness and polish
Status: Complete

### Tasks
- [x] Standardize validation and error handling across core modules — 8 unguarded stock/money mutations fixed across 7 services, see ROADMAP.md
- [x] Tighten stock, payment, and reporting consistency — same fixes as above
- [x] Prepare a release checklist for the sales-to-inventory workflow — [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
