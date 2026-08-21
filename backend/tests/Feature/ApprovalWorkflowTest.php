<?php

namespace Tests\Feature;

use App\Models\ApprovalRequest;
use App\Models\ExpenseCategory;
use App\Models\InventoryItem;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ApprovalWorkflowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_expense_below_threshold_posts_immediately_and_above_it_is_queued(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-expense@example.com');
        $tenant['business']->update(['expense_approval_threshold' => 50000]);
        Sanctum::actingAs($tenant['user']);

        $category = ExpenseCategory::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Utilities',
            'slug' => 'utilities',
        ]);

        $below = $this->postJson('/api/expenses', [
            'expense_category_id' => $category->id,
            'description' => 'Diesel top-up',
            'amount' => 20000,
            'payment_method' => 'cash',
            'expense_date' => now()->toDateString(),
        ]);
        $below->assertCreated();
        $this->assertDatabaseCount('expenses', 1);
        $this->assertDatabaseCount('approval_requests', 0);

        $above = $this->postJson('/api/expenses', [
            'expense_category_id' => $category->id,
            'description' => 'Generator overhaul',
            'amount' => 75000,
            'payment_method' => 'transfer',
            'expense_date' => now()->toDateString(),
        ]);
        $above->assertStatus(202)->assertJsonPath('approval_pending', true);

        $this->assertDatabaseCount('expenses', 1);
        $this->assertDatabaseHas('approval_requests', [
            'business_id' => $tenant['business']->id,
            'action_type' => ApprovalRequest::TYPE_EXPENSE,
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_approve_a_queued_expense_which_then_actually_posts_it(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-expense-approve@example.com');
        $tenant['business']->update(['expense_approval_threshold' => 10000]);
        Sanctum::actingAs($tenant['user']);

        $category = ExpenseCategory::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Repairs',
            'slug' => 'repairs',
        ]);

        $this->postJson('/api/expenses', [
            'expense_category_id' => $category->id,
            'description' => 'Roof repair',
            'amount' => 50000,
            'payment_method' => 'cash',
            'expense_date' => now()->toDateString(),
        ])->assertStatus(202);

        $approval = ApprovalRequest::first();
        $this->assertNotNull($approval);

        $this->postJson("/api/approvals/{$approval->id}/approve")
            ->assertOk()
            ->assertJsonPath('approval.status', 'approved');

        $this->assertDatabaseHas('expenses', [
            'business_id' => $tenant['business']->id,
            'description' => 'Roof repair',
            'amount' => '50000.00',
        ]);
        $this->assertDatabaseHas('approval_requests', ['id' => $approval->id, 'status' => 'approved']);

        // Approving twice is rejected, not double-posted.
        $this->postJson("/api/approvals/{$approval->id}/approve")->assertStatus(422);
        $this->assertDatabaseCount('expenses', 1);
    }

    public function test_admin_can_decline_a_queued_expense_and_it_never_posts(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-expense-decline@example.com');
        $tenant['business']->update(['expense_approval_threshold' => 10000]);
        Sanctum::actingAs($tenant['user']);

        $category = ExpenseCategory::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Misc',
            'slug' => 'misc',
        ]);

        $this->postJson('/api/expenses', [
            'expense_category_id' => $category->id,
            'description' => 'Suspicious claim',
            'amount' => 90000,
            'payment_method' => 'cash',
            'expense_date' => now()->toDateString(),
        ])->assertStatus(202);

        $approval = ApprovalRequest::first();

        $this->postJson("/api/approvals/{$approval->id}/decline", ['reason' => 'Not a business expense'])
            ->assertOk()
            ->assertJsonPath('approval.status', 'declined');

        $this->assertDatabaseCount('expenses', 0);
        $this->assertDatabaseHas('approval_requests', [
            'id' => $approval->id,
            'status' => 'declined',
            'decline_reason' => 'Not a business expense',
        ]);
    }

    public function test_inventory_adjustment_is_queued_only_when_the_business_requires_it(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-inventory@example.com');
        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Counted Item',
            'selling_price' => 500,
            'track_inventory' => true,
        ]);

        $item = InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        $this->postJson('/api/inventory/adjust', [
            'inventory_item_id' => $item->id,
            'quantity' => 5,
            'type' => 'add',
            'reason' => 'Stock count correction',
        ])->assertOk();

        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 15]);
        $this->assertDatabaseCount('approval_requests', 0);

        $tenant['business']->update(['require_inventory_adjustment_approval' => true]);
        // Sanctum::actingAs() reuses the same in-memory user instance across
        // requests within a test, so its cached currentBusiness relation
        // needs a forced refresh to see the update above (a testing-only
        // quirk - a real request always resolves the user fresh).
        Sanctum::actingAs($tenant['user']->fresh());

        $queued = $this->postJson('/api/inventory/adjust', [
            'inventory_item_id' => $item->id,
            'quantity' => 3,
            'type' => 'remove',
            'reason' => 'Damaged stock',
        ]);
        $queued->assertStatus(202)->assertJsonPath('approval_pending', true);

        // Quantity unchanged until approved.
        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 15]);

        $approval = ApprovalRequest::where('action_type', ApprovalRequest::TYPE_INVENTORY_ADJUSTMENT)->firstOrFail();

        $this->postJson("/api/approvals/{$approval->id}/approve")->assertOk();

        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 12]);
    }

    public function test_order_discount_above_threshold_blocks_checkout_until_approved(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-discount@example.com');
        $tenant['business']->update(['discount_approval_threshold' => 1000]);
        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Discountable Item',
            'selling_price' => 10000,
            'track_inventory' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        $payload = [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => 10000,
                'total' => 8000,
            ]],
            'subtotal' => 10000,
            'discount' => 2000,
            'total' => 8000,
            'paid' => 8000,
            'payment_method' => 'cash',
        ];

        $response = $this->postJson('/api/orders', $payload);
        $response->assertStatus(202)->assertJsonPath('approval_pending', true);

        // Stock untouched and no order created - checkout genuinely blocked.
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('inventory_items', [
            'business_id' => $tenant['business']->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        $approval = ApprovalRequest::where('action_type', ApprovalRequest::TYPE_ORDER_DISCOUNT)->firstOrFail();

        $this->postJson("/api/approvals/{$approval->id}/approve")->assertOk();

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseHas('inventory_items', [
            'business_id' => $tenant['business']->id,
            'product_id' => $product->id,
            'quantity' => 9,
        ]);
    }

    public function test_a_non_admin_cannot_view_or_decide_approvals(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-nonadmin@example.com');

        $staffRole = \App\Models\Role::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Manager',
            'slug' => 'manager',
            'is_default' => false,
        ]);
        $staff = \App\Models\User::factory()->create(['email' => 'staff@example.com', 'role' => 'manager']);

        app(\App\Services\BusinessProvisioningService::class)->attachUserToBusiness(
            $staff, $tenant['business'], $staffRole, $tenant['branch'],
        );
        $staff->forceFill(['current_business_id' => $tenant['business']->id, 'current_branch_id' => $tenant['branch']->id])->save();

        Sanctum::actingAs($staff->fresh());

        $this->getJson('/api/approvals')->assertForbidden();
    }

    public function test_approvals_are_scoped_to_the_deciding_admins_business(): void
    {
        $tenantA = $this->createTenantContext('retail', 'approval-scope-a@example.com');
        $tenantB = $this->createTenantContext('retail', 'approval-scope-b@example.com');
        $tenantA['business']->update(['expense_approval_threshold' => 0]);

        Sanctum::actingAs($tenantA['user']);
        $category = ExpenseCategory::create([
            'business_id' => $tenantA['business']->id,
            'name' => 'Utilities',
            'slug' => 'utilities-a',
        ]);
        $this->postJson('/api/expenses', [
            'expense_category_id' => $category->id,
            'description' => 'Any expense',
            'amount' => 500,
            'payment_method' => 'cash',
            'expense_date' => now()->toDateString(),
        ])->assertStatus(202);

        $approval = ApprovalRequest::firstOrFail();

        Sanctum::actingAs($tenantB['user']);
        $this->postJson("/api/approvals/{$approval->id}/approve")->assertStatus(404);
    }

    public function test_admin_can_read_and_update_approval_settings(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-settings@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->getJson('/api/approvals/settings')
            ->assertOk()
            ->assertJson([
                'expense_approval_threshold' => null,
                'discount_approval_threshold' => null,
                'require_inventory_adjustment_approval' => false,
            ]);

        $this->patchJson('/api/approvals/settings', [
            'expense_approval_threshold' => 100000,
            'discount_approval_threshold' => 5000,
            'require_inventory_adjustment_approval' => true,
        ])->assertOk();

        $this->assertDatabaseHas('businesses', [
            'id' => $tenant['business']->id,
            'expense_approval_threshold' => 100000,
            'discount_approval_threshold' => 5000,
            'require_inventory_adjustment_approval' => true,
        ]);
    }

    public function test_admin_can_read_and_update_a_branchs_approval_setting_overrides(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-branch-settings@example.com');
        Sanctum::actingAs($tenant['user']);

        $this->getJson("/api/approvals/branches/{$tenant['branch']->id}/settings")
            ->assertOk()
            ->assertJson([
                'expense_approval_threshold' => null,
                'discount_approval_threshold' => null,
                'require_inventory_adjustment_approval' => null,
            ]);

        $this->patchJson("/api/approvals/branches/{$tenant['branch']->id}/settings", [
            'expense_approval_threshold' => 20000,
            'require_inventory_adjustment_approval' => true,
        ])->assertOk();

        $this->assertDatabaseHas('branches', [
            'id' => $tenant['branch']->id,
            'expense_approval_threshold' => 20000,
            'discount_approval_threshold' => null,
            'require_inventory_adjustment_approval' => true,
        ]);
    }

    public function test_a_branch_override_is_used_instead_of_the_business_wide_threshold(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-branch-override@example.com');
        $tenant['business']->update(['expense_approval_threshold' => 50000]);
        $tenant['branch']->update(['expense_approval_threshold' => 5000]);
        Sanctum::actingAs($tenant['user']);

        $category = ExpenseCategory::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Utilities',
            'slug' => 'utilities',
        ]);

        // Below the business-wide threshold (50000) but above this branch's
        // override (5000) - the override must win.
        $this->postJson('/api/expenses', [
            'expense_category_id' => $category->id,
            'description' => 'Branch-level expense',
            'amount' => 10000,
            'payment_method' => 'cash',
            'expense_date' => now()->toDateString(),
        ])->assertStatus(202)->assertJsonPath('approval_pending', true);
    }

    public function test_a_null_branch_override_inherits_the_business_wide_setting(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-branch-inherit@example.com');
        $tenant['business']->update(['require_inventory_adjustment_approval' => true]);
        Sanctum::actingAs($tenant['user']->fresh());

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Inherited Item',
            'selling_price' => 500,
            'track_inventory' => true,
        ]);

        $item = InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        // The branch has no override set (null), so it inherits the
        // business-wide requirement of true.
        $this->postJson('/api/inventory/adjust', [
            'inventory_item_id' => $item->id,
            'quantity' => 5,
            'type' => 'add',
            'reason' => 'Stock count correction',
        ])->assertStatus(202)->assertJsonPath('approval_pending', true);

        // Once the branch explicitly opts out (false), it no longer
        // inherits the business's true.
        $tenant['branch']->update(['require_inventory_adjustment_approval' => false]);

        $this->postJson('/api/inventory/adjust', [
            'inventory_item_id' => $item->id,
            'quantity' => 3,
            'type' => 'add',
            'reason' => 'Restock',
        ])->assertOk();

        $this->assertDatabaseHas('inventory_items', ['id' => $item->id, 'quantity' => 13]);
    }

    public function test_different_branches_can_have_different_effective_discount_thresholds(): void
    {
        $tenant = $this->createTenantContext('retail', 'approval-branch-multi@example.com');
        $tenant['business']->update(['discount_approval_threshold' => 1000]);

        $secondBranch = \App\Models\Branch::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Second Branch',
            'slug' => 'second-branch',
            'discount_approval_threshold' => 9000,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Discountable Item',
            'selling_price' => 10000,
            'track_inventory' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 10,
        ]);

        $payload = [
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => 10000,
                'total' => 8000,
            ]],
            'subtotal' => 10000,
            'discount' => 2000,
            'total' => 8000,
            'paid' => 8000,
            'payment_method' => 'cash',
        ];

        // First branch inherits the business's 1000 threshold - a 2000
        // discount is queued.
        Sanctum::actingAs($tenant['user']);
        $this->postJson('/api/orders', $payload)
            ->assertStatus(202)->assertJsonPath('approval_pending', true);

        // Second branch overrides to 9000 - the same 2000 discount goes
        // straight through.
        $tenant['user']->forceFill(['current_branch_id' => $secondBranch->id])->save();
        Sanctum::actingAs($tenant['user']->fresh());
        $this->postJson('/api/orders', $payload)->assertCreated();
    }
}
