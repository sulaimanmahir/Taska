# TASKA Roadmap

Last updated: 2026-08-05

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

- Tenant isolation is enforced mainly through business-context scoping in services and controllers; a unified global-scope pattern now exists (`app/Concerns/BelongsToBusiness.php`) and is applied to every model originally flagged as high-risk (`Order`, `Product`, `InventoryItem`, `Customer`, `Supplier`, `Purchase`, `PurchasePayment`, `Expense`, `InventoryMovement`, `Warehouse`). Line-item-only models (`OrderItem`, `PurchaseItem`) are intentionally excluded since they have no `business_id` of their own and are scoped through their parent relation instead. Apply the same trait+test pattern to any new high-risk model added later.
- In-app alert center is live (2026-08-19): the header bell is a real dropdown backed by the existing AI Insights engine (`GET /api/ai/insights?unread_only=1`), with mark-as-read wired to the existing endpoint. Push notifications (device-level, outside the app) are still not live.
- Access-change audit history is live (2026-08-19): `access_audit_logs` tracks who changed team member roles/branches/status and who created/updated branches, viewable on Settings > Activity.

### Workflow Depth

- A general purchase-order, receive, and supplier-payment workflow exists end to end (`Supplier`/`Purchase`/`PurchaseItem`/`PurchasePayment` models, `PurchaseController`/`SupplierController`, `Purchases.jsx`), including stock updates into inventory on receipt.
  - Production input purchases exist.
  - Pharmacy purchase history exists.
- Warehouse CRUD exists, but branch-to-warehouse setup and routing still need a stronger admin UX.
- Tenant-scoping hardening (the `BelongsToBusiness` trait) is now applied to every originally-flagged model — see Platform Hardening above.

### Intelligence and Offline Maturity

- AI insights are live and substantially more mature than this line previously suggested (confirmed 2026-08-19 by reading `AiService::generateInsights()` directly): 34 wired-in checks already run on every call, covering demand/stockout/reorder forecasting, branch-vs-branch performance comparison, fraud/risk pressure (mobile agent, fuel shrinkage, credit default), and vertical-specific forecasts across pharmacy, delivery, production, hotel, school, agro, livestock, construction, and restaurant. Every insight already carries an explainable `recommendation` field. Nothing further queued here for now — this line was stale, not a real gap.
- Offline queueing exists, but richer conflict handling and module-specific replay/reconciliation rules still need work.

## Next Priorities

1. Tenant hardening sweep
   - Audit branch, warehouse, and business ownership checks across controllers and validators.
   - Centralize enforcement where possible into shared services and policies.

2. Purchases and payables
   - Add purchase orders, goods received notes, supplier balances, and payment workflows.

3. Notifications
   - In-app alert center — done (header bell, backed by AI Insights).
   - Add push notifications after the in-app model is stable.

4. Admin and access polish
   - Email-based invite acceptance instead of owner-set initial passwords.
   - Access change history and audit visibility — done.
   - Branch-level approval rules for sensitive finance and inventory actions.

5. Branch and warehouse routing
   - Strengthen location setup flows.
   - Improve module-aware branch/warehouse defaults for inventory-heavy workflows.

6. Intelligence expansion — done, see Intelligence and Offline Maturity above
   - Demand forecasting — done (stockout/reorder/pharmacy demand checks)
   - Anomaly detection — done (fraud pressure, shrinkage, credit default, margin erosion checks)
   - Branch comparisons — done (`checkBranchPerformance`)
   - Explainable next-best-action recommendations — done (every insight carries a `recommendation` field)

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
