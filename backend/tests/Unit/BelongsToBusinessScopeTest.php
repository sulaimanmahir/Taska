<?php

namespace Tests\Unit;

use App\Models\Customer;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class BelongsToBusinessScopeTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_business_scope_hides_other_tenants_records_even_without_a_manual_filter(): void
    {
        $tenant = $this->createTenantContext('retail', 'scope-owner@example.com');
        $foreignTenant = $this->createTenantContext('retail', 'scope-foreign@example.com');

        Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Product',
            'selling_price' => 500,
        ]);

        Product::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Product',
            'selling_price' => 500,
        ]);

        Customer::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Customer',
            'customer_type' => 'individual',
        ]);

        Sanctum::actingAs($tenant['user']);

        // Deliberately unscoped queries - no ->where('business_id', ...) - to prove
        // the global scope, not controller code, is what keeps the other tenant out.
        $visibleProducts = Product::all();
        $visibleCustomers = Customer::all();

        $this->assertCount(1, $visibleProducts);
        $this->assertSame('Local Product', $visibleProducts->first()->name);
        $this->assertCount(0, $visibleCustomers);
    }

    public function test_business_scope_no_ops_outside_an_authenticated_request(): void
    {
        $tenant = $this->createTenantContext('retail', 'scope-console@example.com');

        Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Console Created Product',
            'selling_price' => 500,
        ]);

        // No Sanctum::actingAs() here - simulates a console command / seeder / unit
        // test running outside an HTTP request, which must still see all records.
        $this->assertCount(1, Product::all());
    }

    public function test_business_scope_hides_other_tenants_expenses_movements_and_warehouses(): void
    {
        $tenant = $this->createTenantContext('retail', 'scope-owner-2@example.com');
        $foreignTenant = $this->createTenantContext('retail', 'scope-foreign-2@example.com');

        $localCategory = ExpenseCategory::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Category',
            'slug' => 'local-category',
        ]);
        $foreignCategory = ExpenseCategory::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Category',
            'slug' => 'foreign-category',
        ]);

        Expense::create([
            'business_id' => $tenant['business']->id,
            'expense_category_id' => $localCategory->id,
            'description' => 'Local expense',
            'amount' => 100,
            'expense_date' => today(),
        ]);
        Expense::create([
            'business_id' => $foreignTenant['business']->id,
            'expense_category_id' => $foreignCategory->id,
            'description' => 'Foreign expense',
            'amount' => 100,
            'expense_date' => today(),
        ]);

        Warehouse::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Warehouse',
            'slug' => 'foreign-warehouse',
            'is_default' => true,
            'is_active' => true,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Movement Product',
            'selling_price' => 500,
        ]);

        InventoryMovement::create([
            'business_id' => $foreignTenant['business']->id,
            'warehouse_id' => $foreignTenant['warehouse']->id,
            'product_id' => $foreignProduct->id,
            'movement_type' => 'adjustment',
            'quantity' => 5,
            'previous_quantity' => 0,
            'new_quantity' => 5,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->assertCount(1, Expense::all());
        $this->assertSame('Local expense', Expense::first()->description);
        $this->assertCount(1, Warehouse::all());
        $this->assertSame($tenant['warehouse']->id, Warehouse::first()->id);
        $this->assertCount(0, InventoryMovement::all());
    }
}
