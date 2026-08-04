# TASKA Roadmap

Last updated: 2026-05-27

## Snapshot

TASKA is no longer at the "project setup" stage. The platform now has live multi-business foundations, authenticated workspace switching, admin settings, billing, offline queueing, explainable AI insight surfaces, and a broad set of industry modules across commerce, healthcare, hospitality, logistics, agriculture, services, and light manufacturing.

This roadmap now reflects actual build status instead of a zero-based plan. Some areas are complete, some are operational but still need hardening, and a smaller set of platform workflows still needs first-class implementation.

## Status Legend

- `Complete`: live in backend and frontend and part of current product flow
- `Active`: partially live or implemented but still needs hardening/depth before being called complete
- `Next`: planned after active gaps

## Current State

### Complete: Platform Foundations

- Laravel backend, React/Vite frontend, Tailwind CSS, Sanctum auth, and PostgreSQL-ready schema
- Multi-business onboarding, workspace switching, and current-business persistence
- Business profile settings
- Profile settings
- Users & Roles management in settings
- Branch management in settings
- Subscription billing and plan surfaces
- PWA manifest, runtime caching, and business-scoped offline action queue
- Explainable AI insight cards and industry-aware dashboard summaries

### Complete: Core Commerce and Operations

- Branches
- Warehouses
- Products and categories
- Inventory and stock movements
- POS / sales
- Customers and customer groups
- Suppliers
- Expenses and expense categories
- Trust Fund
- Reports including profit/loss

### Complete: Industry and Vertical Surfaces

- Restaurant
- Clinic / health facility
- Laboratory / diagnostics
- Hotel
- Delivery company / courier
- Logistics
- Pharmacy
- Pure Water Factory
- Pure Water Retail
- Agro dealer
- Farm / agribusiness
- Livestock
- Fuel / energy
- Textile / fashion
- Commodity trading
- NGO warehouse
- Mobile agent / POS business
- School / training centre
- Building materials
- Beauty / salon / barbing
- Service business
- General SME
- Wholesale / distributor
- Cooperative / Adashe
- Billing, partner, and admin dashboards

## Active Gaps

### Platform Hardening

- Password reset / account recovery flow is not implemented yet.
- Tenant isolation is enforced mainly through business-context scoping in services and controllers; a more unified policy/global-scope pattern is still pending.
- Notification center and push notifications are not live yet.
- Access-change audit history for workspace team and branch administration is still ahead.

### Workflow Depth

- Purchases are only partial today.
  - Production input purchases exist.
  - Pharmacy purchase history exists.
  - A general purchase-order, GRN, and supplier-payables workflow is not yet a first-class end-to-end module.
- Warehouse CRUD exists, but branch-to-warehouse setup and routing still need a stronger admin UX.
- Some older module controllers still need the same tenant-scoping hardening already applied to reports, settings, team access, and branches.

### Intelligence and Offline Maturity

- AI insights are live, but deeper forecasting, anomaly detection, and branch-vs-branch comparison layers are still in progress.
- Offline queueing exists, but richer conflict handling and module-specific replay/reconciliation rules still need work.

## Next Priorities

1. Tenant hardening sweep
   - Audit branch, warehouse, and business ownership checks across controllers and validators.
   - Centralize enforcement where possible into shared services and policies.

2. Purchases and payables
   - Add purchase orders, goods received notes, supplier balances, and payment workflows.

3. Notifications
   - Add in-app alert center first.
   - Add push notifications after the in-app model is stable.

4. Admin and access polish
   - Email-based invite acceptance instead of owner-set initial passwords.
   - Access change history and audit visibility.
   - Branch-level approval rules for sensitive finance and inventory actions.

5. Branch and warehouse routing
   - Strengthen location setup flows.
   - Improve module-aware branch/warehouse defaults for inventory-heavy workflows.

6. Intelligence expansion
   - Demand forecasting
   - Anomaly detection
   - Branch comparisons
   - Explainable next-best-action recommendations

## Delivery Phases

### Phase 1: Complete

- Foundations, auth, onboarding, core tenant context
- Core sales, inventory, CRM, expenses, trust fund, reports
- Settings, billing, offline shell, and first AI insight layer

### Phase 2: Active

- Tenant hardening
- Purchases and payables
- Notification system
- Admin auditability and approval controls

### Phase 3: Next

- Deeper AI forecasting and branch intelligence
- Offline conflict resolution maturity
- Cross-module polish and workflow depth parity

## Notes

- Module breadth is already wide; current execution priority should favor hardening, workflow depth, and operational polish over adding more top-level modules.
- Do not treat every existing module page as equally mature. Some are already solid operational surfaces, while others still need deeper write flows, approvals, reporting parity, or stronger tenant enforcement.
- A detailed execution workplan for the current milestone cycle is maintained in [docs/WORKPLAN_2026-08.md](docs/WORKPLAN_2026-08.md).
