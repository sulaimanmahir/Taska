# TASKA Workplan — 2026-08

## Objective
Harden the core sales-to-inventory workflow, improve operational reliability, and convert the current broad feature surface into a more demo-ready and maintainable product.

## Milestones

### Milestone 1 — Core workflow hardening
Status: In progress

Goals:
- protect sales from overselling
- surface stock information in the POS experience
- keep the sales flow consistent and reliable

Completed:
- added stock availability validation in the order service
- added regression tests covering insufficient inventory
- displayed stock information in the POS product list
- blocked out-of-stock additions at the UI layer

Next actions:
- add a clear cart-level stock warning when quantity exceeds available stock
- provide a friendly error state for failed sale submission

### Milestone 2 — Inventory-aware checkout experience
Status: Complete

Detailed task board: [MILESTONE_BOARD_2026-08.md](MILESTONE_BOARD_2026-08.md)

Goals:
- make the checkout experience reflect stock state end to end
- prevent invalid quantities before submission
- improve error feedback for the user

Completed:
- validated cart quantities against available stock before submitting a sale (POS and RetailOps)
- added per-item remaining-stock display inside the cart
- surfaced a specific message when quantity exceeds available stock

### Milestone 3 — Workflow reliability and testing
Status: In progress

Goals:
- build confidence around the most important business flow
- reduce regressions as the product grows

Planned work:
- add frontend tests for the POS checkout behavior — done
- add backend tests for inventory validation and sale creation failures — done (2026-08-19): `OrderInventoryEdgeCaseTest`/`BranchAwareOrderRoutingTest` cover atomic multi-item rejection, exact-quantity boundaries, never-stocked rejection, and non-inventory-tracked products. Found and fixed a real bug along the way - `track_inventory: 'no'` products (services, fees) were completely unsellable because both `OrderService` and `ProductResource` assumed every product has an inventory row; see ROADMAP.md Platform Hardening.
- document the happy path for demo and onboarding use

### Milestone 4 — Product readiness and polish
Status: Planned

Goals:
- move the platform from broad scaffolding to dependable demo readiness
- improve maintainability and operational clarity

Planned work:
- standardize validation/error handling across modules
- tighten business rules around stock, payments, and visibility
- prepare a concise release checklist for the core workflow
