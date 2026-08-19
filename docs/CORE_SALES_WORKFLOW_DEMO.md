# Core Sales Workflow — Demo Walkthrough

This is the script for showing Taska's core sales-to-inventory loop: log in,
sell something at the counter, watch stock move in real time, and see it
land in reports. It uses the seeded retail demo account so it works on any
freshly-migrated environment with no manual setup.

Tracked in [WORKPLAN_2026-08.md](WORKPLAN_2026-08.md) Milestone 3 as the
last open item ("document the happy path for demo and onboarding use").

## Before you start

```bash
cd backend && php artisan migrate:fresh --seed
```

Seeding is idempotent (`updateOrCreate` throughout `DatabaseSeeder`), so
re-running it is always safe if the demo data gets messy mid-walkthrough.

**Login:** `retail@taska.local` / `password123`

This account is pre-loaded with a branch, a warehouse, 5 customers, 4
suppliers, 6 products with real stock levels, 6 sample orders, and a run of
expenses — you're not demoing an empty shell.

## 1. The counter (POS)

Go to **POS**. The product grid shows every active product with its live
stock state:

- **Core Product A** seeds at 8 units against a low-stock alert of 10, so
  it already shows a **Low stock** badge — a ready-made example without
  needing to sell anything down first.
- Every other seeded product shows **In stock** with its real quantity.

Click a product to add it to the cart, adjust quantity with the +/-
controls. Try pushing a quantity past what's shown as available — the cart
blocks it client-side with a specific message instead of silently letting
the sale through and failing later at checkout.

Pick a **loyalty customer** (optional — leave it on "No loyalty customer"
for a walk-in sale), choose a payment method, enter the amount collected,
and hit **Complete Sale**.

**What actually happened**, in order, inside `OrderService::createOrder()`:

1. Stock availability is checked per line item before anything is written.
2. The order and its line items are created.
3. Inventory is deducted per item, and an `InventoryMovement` row is
   written recording exactly what changed and why (useful for the next
   step).
4. If a customer was attached and they didn't pay the full total, their
   `balance` goes up by the difference — that's the credit sale path.

Go back to the product grid: the quantity you just sold is already gone
from the count, no refresh needed.

## 2. Where the stock actually came from

If a branch has a warehouse assigned to it (**Settings → Warehouses**),
sales route through that warehouse automatically instead of a single
business-wide default — and if a branch has more than one warehouse
assigned, Taska picks whichever currently holds more of the specific item
being sold, so a sale doesn't fail against an empty warehouse while a
sibling has stock. The seeded retail demo has one warehouse, so this is
invisible day-to-day, but it's the reason multi-location businesses don't
need to pick a warehouse manually at checkout.

## 3. Returns

From the **Recent Sales and Refunds** panel on POS, find the sale you just
made and issue a return. The refund order is created with a negative
total, and the stock goes back to **the exact warehouse it originally left
from** — looked up from that sale's own `InventoryMovement` row, not
re-guessed. Watch the product grid quantity climb back up.

## 4. Selling something that isn't stock

Not everything sold through Taska is a countable item — a consulting fee,
a delivery charge, a service line. Create a product in **Products** with
**Track inventory: No**. It never gets a warehouse-level quantity, but it
still sells normally through POS (shown as unlimited "In stock", not
blocked) and skips the stock/warehouse bookkeeping entirely, both on sale
and on return.

## 5. Approval rules (optional detour)

**Settings → Approvals** lets an owner require sign-off before a sale with
too large a discount actually completes, before a manual inventory
adjustment applies, or before a large expense posts. Nothing is configured
by default on the demo account — set a discount threshold below what you're
about to give, then try completing a discounted sale to show the "pending
review" state, and approve it from the same settings tab to show the sale
finish.

## 6. Where it all shows up

- **Inventory** — the same quantity changes from the sale/return, plus the
  full movement history (`InventoryMovement` rows) for an audit trail.
- **Customers** — the customer's balance if you ran a credit sale.
- **Reports** — profit/loss and sales totals reflecting the new order.
- **Expenses** — separately seeded, useful for showing the business isn't
  only tracking revenue.

## What this demonstrates, in one sentence

A sale is never just "add a row to a table" — it's a stock check, a
branch-aware warehouse pick, an inventory deduction with a paper trail, and
(if credit) a customer balance update, all inside one transaction that
either fully happens or fully doesn't.

## Backend test coverage backing this walkthrough

If asked "how do you know this actually works," these are the automated
tests exercising the exact paths above (all under `backend/tests/Feature/`):

- `OrderWorkflowStateTest` — end-to-end sale + return with inventory and
  customer-balance effects; insufficient-stock rejection.
- `OrderInventoryEdgeCaseTest` — atomic multi-item rejection (one bad item
  fails the whole cart, nothing partially deducts), exact-quantity
  boundary sales, non-inventory-tracked products, never-stocked products.
- `BranchAwareOrderRoutingTest` — single/multiple warehouse-per-branch
  routing, fallback to the business default, returns restocking their
  origin warehouse.
- `ApprovalWorkflowTest` — expense/discount/inventory-adjustment approval
  gating, approve/decline, cross-business isolation.
- `RetailOperationsTest` / `RetailWorkflowTest` — the same flow through the
  dedicated Retail vertical surface (shift open/close, loyalty, refunds).
