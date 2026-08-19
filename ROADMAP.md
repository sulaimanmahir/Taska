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
- Tenant-hardening sweep (2026-08-19): audited every controller that binds a route model or reads a foreign key from the request body for a missing business-ownership check. Found the real gap was the platform-admin privilege escalation (see below), not the verticals — those were already correctly scoped, just via 19 near-identical private `businessOwnedRule()`/`activeBusinessUserRule()` copy-pasted across Beauty/Hotel/School/Pharmacy/etc. controllers. Centralized into `App\Concerns\ValidatesBusinessOwnership`, a pure refactor (no behavior change, full suite still 303/303).
- **Email-based invite acceptance is live (2026-08-19)**, replacing owner-set initial passwords. Adding a brand-new team member (`BusinessTeamService::addMember()`) now creates the user with an unusable random placeholder password, attaches them to `business_user` with `status: 'invited'` (a new pivot state - `joined_at` is left null until real acceptance) plus a hashed, 7-day-expiring `invitation_token`, and emails them a link via a new `TeamInviteMail` markdown mailable (`resources/views/emails/team-invite.blade.php`). `GET /api/team-invites/{token}` (public, display-only) and `POST /api/team-invites/accept` (public, sets the real password, flips the membership to active, and returns a real Sanctum session in the same shape as `/auth/login` so the frontend logs them straight in) implement the accept side; `POST /auth/team/{member}/resend-invite` lets the owner resend a fresh token. Attaching an *existing* Taska user to a business is unchanged - they already have working credentials, so they're added active immediately, no email involved. Settings > Users & Roles shows an "Invited" badge and a "Resend invite" action instead of the old initial-password field; a new `/accept-invite` page handles the acceptance form. Verified with new backend feature tests (invite issuance, accept, single-use token, resend, login blocked until accepted) and frontend store/component tests, plus a live Playwright walkthrough that sent a real invite through the log mail driver, extracted the link, and completed the whole flow through the actual UI into a logged-in session. Mail delivery itself still needs a real transactional `MAIL_MAILER` in production (currently `log`, matching the rest of this codebase's mail config) - the invite mechanism is fully real and tested independent of that.
- **Branch-level approval rules are live (2026-08-19)** for three actions: expenses above a configurable amount, manual inventory adjustments, and order discounts above a configurable amount. Each threshold on `Business` (`expense_approval_threshold`, `discount_approval_threshold`, `require_inventory_adjustment_approval`) is opt-in and null/false by default, so an unconfigured business sees no behavior change. Over the threshold, `ExpenseController::store`/`InventoryController::adjust`/`OrderController::store` create an `ApprovalRequest` (storing the exact validated payload) and return `202 { approval_pending: true }` instead of performing the action - for orders this means checkout is genuinely blocked (no stock decrement, no order row) until approved. `ApprovalService::approve()` replays the deferred action through the same service the below-threshold path already uses (`ExpenseService`, `InventoryAdjustmentService`, `OrderService::createOrder`) so business logic is never duplicated; declining leaves everything untouched. Approve/decline is `role:admin`-gated (any active admin/owner of the requester's own business, not branch-scoped - per-branch thresholds are a possible future refinement, noted in the Branches tab). Settings > Approvals exposes the threshold config and the pending queue. Verified with 9 new backend feature tests and frontend helper tests, plus a live Playwright walkthrough that queued a real expense, watched it blocked in the UI, approved it from Settings, and confirmed the expense record only existed in the database after approval. Found and fixed a real latent bug along the way: `OrderService::createOrder()` read `$data['customer_id']` without a null-coalesce, throwing whenever a caller omitted the key entirely instead of passing an explicit null.
- **Fixed 2026-08-19: platform-admin privilege escalation.** The `role:admin` middleware alias was reused for two unrelated things — the tenant-scoped `/auth/team` routes (correctly checking "is this user an admin of their *own* business") and the platform-wide `/api/admin/*` routes (stats, cross-tenant user/business lists, suspend/activate user, suspend business). Every self-registered business owner gets the flat `users.role` column value `admin` by default (`BusinessProvisioningService`), so in practice *any* tenant owner could pass `role:admin` and reach the platform admin routes — confirmed exploitable end to end for `suspend`/`activate`/`suspend-business` (arbitrary cross-tenant account/business suspension by ID). Fixed by adding a distinct `users.is_platform_admin` boolean (not mass-assignable, granted only via `php artisan taska:grant-platform-admin {email}` / revoked via the `-revoke` counterpart) and a new `EnsurePlatformAdmin` middleware (`platform.admin` alias) gating only the `/api/admin/*` group; `/auth/team` is untouched and still uses the tenant-scoped check. The frontend `Admin.jsx` page gate was fixed to match (`user.is_platform_admin`, not `user.role === 'admin'`). Verified with 4 new feature tests (ordinary owner forbidden, platform admin allowed and can actually suspend/activate, team routes unaffected, grant/revoke CLI). Separately noted but out of scope here: most other `AdminController` methods (`stats`, `users`, `transactions`, `supportTickets`, `referrals`, `resolveTicket`) reference models/tables that don't exist anywhere in this codebase (`App\Models\Transaction`, `Subscription`, `SupportTicket`, `Referral`, a `plans` table, a `partner_payouts` table) and a `Business::owner()` relation that was never defined — this is pre-existing dead code from an earlier iteration of the platform admin dashboard, not something this fix introduced or attempted to rebuild.
- In-app alert center is live (2026-08-19): the header bell is a real dropdown backed by the existing AI Insights engine (`GET /api/ai/insights?unread_only=1`), with mark-as-read wired to the existing endpoint.
- Push notifications are built (2026-08-19): subscription storage, a `taska:send-critical-alerts` scheduled command, and a Settings > Profile toggle. Backend fully verified via feature tests. Frontend verified as far as this environment allows - confirmed correct up to the point where Chromium needs outbound network access to Google's real push service (not available in this sandbox); production needs its own VAPID key pair (a dev-only pair is documented in `.env.example`) and a live device to confirm actual delivery.
- Access-change audit history is live (2026-08-19): `access_audit_logs` tracks who changed team member roles/branches/status and who created/updated branches, viewable on Settings > Activity.

### Workflow Depth

- A general purchase-order, receive, and supplier-payment workflow exists end to end (`Supplier`/`Purchase`/`PurchaseItem`/`PurchasePayment` models, `PurchaseController`/`SupplierController`, `Purchases.jsx`), including stock updates into inventory on receipt.
  - Production input purchases exist.
  - Pharmacy purchase history exists.
- Warehouse-to-branch admin UX is live (2026-08-19): Settings > Warehouses lets an owner create warehouses and assign/reassign each one to a branch, using the pre-existing `WarehouseController`/`BusinessWarehouseService` (which already had default-warehouse invariants; it just had no frontend).
- **Branch-aware warehouse routing is live (2026-08-19).** `OrderController::getDefaultWarehouse()` used to always resolve the single business-wide default warehouse regardless of which branch made the sale. `OrderService` now resolves a warehouse per line item: a branch with one assigned warehouse uses it; a branch with several picks whichever currently holds more of the specific product/variant being sold (so a sale doesn't fail against an empty warehouse while a sibling has stock); a branch with none assigned falls back to the business-wide default exactly like before, so businesses that haven't assigned branch warehouses see no change. `ConstructionMaterialsService` (which resolves its own explicit `warehouse_id`) is unaffected. Returns restock wherever the original sale actually drew from (via the `InventoryMovement` row it created), not a freshly re-resolved warehouse. Verified with 4 new feature tests; full existing order/retail/wholesale suite unaffected since every existing tenant has no branch warehouse assignment yet. No frontend change needed - transparent to the order-creation payload.
- Tenant-scoping hardening (the `BelongsToBusiness` trait) is now applied to every originally-flagged model — see Platform Hardening above.

### Intelligence and Offline Maturity

- AI insights are live and substantially more mature than this line previously suggested (confirmed 2026-08-19 by reading `AiService::generateInsights()` directly): 34 wired-in checks already run on every call, covering demand/stockout/reorder forecasting, branch-vs-branch performance comparison, fraud/risk pressure (mobile agent, fuel shrinkage, credit default), and vertical-specific forecasts across pharmacy, delivery, production, hotel, school, agro, livestock, construction, and restaurant. Every insight already carries an explainable `recommendation` field. Nothing further queued here for now — this line was stale, not a real gap.
- Offline conflict handling is live (2026-08-19): a new `POST /api/offline/replay` endpoint wires up `OfflineSyncService`'s pre-existing (previously dead) conflict-strategy logic — `resolveConflict()`/`determineConflictStrategy()` — instead of duplicating it. Each queued action replays through the real internal routing/middleware/controller stack (same auth, validation, and tenant scoping as a live request), so no endpoint-specific logic had to be reimplemented. For resource types whose strategy isn't `last_write_wins` (`inventory`/`stock_transfer`/`stock_count` → `review_queue`, `finance`/`cashbook`/`settlement` → `manual_review`), a client-supplied `base_updated_at` snapshot is compared against the record's current `updated_at` before the write is applied; a real change wins is returned as a structured conflict instead of silently overwriting. `frontend/src/stores/offlineStore.js`'s `syncPendingActions` now batches the whole queue through this endpoint in one request instead of replaying one-by-one against each action's own endpoint, and `SyncIndicator.jsx` renders each conflict with "Discard my change" / "Keep my change anyway" (forced retry) actions. Verified with 4 new backend feature tests (last-write-wins passthrough, conflict detection, forced override, per-action failure isolation within a batch) and 4 new frontend store tests, plus a live Playwright walkthrough that reproduced a real cross-device conflict and resolved it through the actual UI button. Scoped intentionally: only the offline-replay path changed, no normal live endpoint was touched; none of today's actual queued resourceTypes (`delivery`, `fleet`, `logistics`, `general`) map to a conflict-sensitive strategy yet, so in practice this is forward-looking scaffolding for the day a conflict-sensitive module (e.g. inventory) queues real offline writes.

## Next Priorities

1. Tenant hardening sweep — done, see Platform Hardening above (audit found and fixed the platform-admin escalation, and centralized 19 controllers' duplicated ownership-check helpers into `ValidatesBusinessOwnership`).

2. Purchases and payables — done, see Workflow Depth above (`Supplier`/`Purchase`/`PurchaseItem`/`PurchasePayment`, `PurchaseController`/`SupplierController`, stock updates on receipt). This line was stale, not a real gap.

3. Notifications
   - In-app alert center — done (header bell, backed by AI Insights).
   - Push notifications — built, see Platform Hardening above for what's verified vs. what needs a production VAPID pair and a real device.

4. Admin and access polish
   - Email-based invite acceptance instead of owner-set initial passwords — done (2026-08-19), see Platform Hardening above.
   - Access change history and audit visibility — done.
   - Branch-level approval rules for sensitive finance and inventory actions — done (2026-08-19), see Platform Hardening above.

5. Branch and warehouse routing — done, see Workflow Depth above
   - Strengthen location setup flows — done (Settings > Warehouses).
   - Automatic branch-aware order routing — done (2026-08-19).

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
