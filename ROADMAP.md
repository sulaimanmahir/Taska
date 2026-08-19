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
- In-app alert center is live (2026-08-19): the header bell is a real dropdown backed by the existing AI Insights engine (`GET /api/ai/insights?unread_only=1`), with mark-as-read wired to the existing endpoint.
- Push notifications are built (2026-08-19): subscription storage, a `taska:send-critical-alerts` scheduled command, and a Settings > Profile toggle. Backend fully verified via feature tests. Frontend verified as far as this environment allows - confirmed correct up to the point where Chromium needs outbound network access to Google's real push service (not available in this sandbox); production needs its own VAPID key pair (a dev-only pair is documented in `.env.example`) and a live device to confirm actual delivery.
- Access-change audit history is live (2026-08-19): `access_audit_logs` tracks who changed team member roles/branches/status and who created/updated branches, viewable on Settings > Activity.

### Workflow Depth

- A general purchase-order, receive, and supplier-payment workflow exists end to end (`Supplier`/`Purchase`/`PurchaseItem`/`PurchasePayment` models, `PurchaseController`/`SupplierController`, `Purchases.jsx`), including stock updates into inventory on receipt.
  - Production input purchases exist.
  - Pharmacy purchase history exists.
- Warehouse-to-branch admin UX is live (2026-08-19): Settings > Warehouses lets an owner create warehouses and assign/reassign each one to a branch, using the pre-existing `WarehouseController`/`BusinessWarehouseService` (which already had default-warehouse invariants; it just had no frontend). Still open: `OrderController::getDefaultWarehouse()` always resolves the single business-wide default warehouse regardless of branch context - automatic branch-aware routing is a bigger, riskier change (touches every sale in the app) deliberately left as a product decision, not built here.
- Tenant-scoping hardening (the `BelongsToBusiness` trait) is now applied to every originally-flagged model — see Platform Hardening above.

### Intelligence and Offline Maturity

- AI insights are live and substantially more mature than this line previously suggested (confirmed 2026-08-19 by reading `AiService::generateInsights()` directly): 34 wired-in checks already run on every call, covering demand/stockout/reorder forecasting, branch-vs-branch performance comparison, fraud/risk pressure (mobile agent, fuel shrinkage, credit default), and vertical-specific forecasts across pharmacy, delivery, production, hotel, school, agro, livestock, construction, and restaurant. Every insight already carries an explainable `recommendation` field. Nothing further queued here for now — this line was stale, not a real gap.
- Offline conflict handling is live (2026-08-19): a new `POST /api/offline/replay` endpoint wires up `OfflineSyncService`'s pre-existing (previously dead) conflict-strategy logic — `resolveConflict()`/`determineConflictStrategy()` — instead of duplicating it. Each queued action replays through the real internal routing/middleware/controller stack (same auth, validation, and tenant scoping as a live request), so no endpoint-specific logic had to be reimplemented. For resource types whose strategy isn't `last_write_wins` (`inventory`/`stock_transfer`/`stock_count` → `review_queue`, `finance`/`cashbook`/`settlement` → `manual_review`), a client-supplied `base_updated_at` snapshot is compared against the record's current `updated_at` before the write is applied; a real change wins is returned as a structured conflict instead of silently overwriting. `frontend/src/stores/offlineStore.js`'s `syncPendingActions` now batches the whole queue through this endpoint in one request instead of replaying one-by-one against each action's own endpoint, and `SyncIndicator.jsx` renders each conflict with "Discard my change" / "Keep my change anyway" (forced retry) actions. Verified with 4 new backend feature tests (last-write-wins passthrough, conflict detection, forced override, per-action failure isolation within a batch) and 4 new frontend store tests, plus a live Playwright walkthrough that reproduced a real cross-device conflict and resolved it through the actual UI button. Scoped intentionally: only the offline-replay path changed, no normal live endpoint was touched; none of today's actual queued resourceTypes (`delivery`, `fleet`, `logistics`, `general`) map to a conflict-sensitive strategy yet, so in practice this is forward-looking scaffolding for the day a conflict-sensitive module (e.g. inventory) queues real offline writes.

## Next Priorities

1. Tenant hardening sweep
   - Audit branch, warehouse, and business ownership checks across controllers and validators.
   - Centralize enforcement where possible into shared services and policies.

2. Purchases and payables
   - Add purchase orders, goods received notes, supplier balances, and payment workflows.

3. Notifications
   - In-app alert center — done (header bell, backed by AI Insights).
   - Push notifications — built, see Platform Hardening above for what's verified vs. what needs a production VAPID pair and a real device.

4. Admin and access polish
   - Email-based invite acceptance instead of owner-set initial passwords.
   - Access change history and audit visibility — done.
   - Branch-level approval rules for sensitive finance and inventory actions.

5. Branch and warehouse routing
   - Strengthen location setup flows — done (Settings > Warehouses).
   - Improve module-aware branch/warehouse defaults for inventory-heavy workflows — still open, see Workflow Depth above (automatic branch-aware order routing).

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
- Offline conflict resolution maturity — done, see Intelligence and Offline Maturity above
- Cross-module polish and workflow depth parity

## Notes

- Module breadth is already wide; current execution priority should favor hardening, workflow depth, and operational polish over adding more top-level modules.
- Do not treat every existing module page as equally mature. Some are already solid operational surfaces, while others still need deeper write flows, approvals, reporting parity, or stronger tenant enforcement.
- A detailed execution workplan for the current milestone cycle is maintained in [docs/WORKPLAN_2026-08.md](docs/WORKPLAN_2026-08.md).
