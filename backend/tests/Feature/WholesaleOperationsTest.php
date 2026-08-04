<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use App\Models\WholesaleRouteRun;
use App\Models\WholesaleSalesRep;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class WholesaleOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_wholesale_business_can_run_reps_bulk_orders_routes_and_transfers(): void
    {
        $tenant = $this->createTenantContext('wholesale', 'wholesale-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $secondaryWarehouse = Warehouse::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Route Van Depot',
            'slug' => 'route-van-depot',
            'is_default' => false,
            'is_active' => true,
        ]);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Cityline Traders',
            'phone' => '08031112222',
            'customer_type' => 'wholesaler',
            'credit_limit' => 500000,
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Carton of Malt Drink',
            'selling_price' => 8500,
            'cost_price' => 7000,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        InventoryItem::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 100,
        ]);

        $salesRepId = $this->postJson('/api/wholesale/sales-reps', [
            'name' => 'Aisha Bello',
            'territory' => 'North Market Belt',
            'target_amount' => 1200000,
        ])->assertCreated()->json('id');

        $this->postJson('/api/wholesale/price-tiers', [
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'tier_name' => 'Carton Dealer Rate',
            'minimum_quantity' => 5,
            'unit_price' => 7900,
        ])->assertCreated();

        $routeRunId = $this->postJson('/api/wholesale/route-runs', [
            'sales_rep_id' => $salesRepId,
            'route_name' => 'Sabon Gari Tuesday Run',
            'route_date' => now()->toDateString(),
            'target_amount' => 150000,
            'stops' => [[
                'customer_id' => $customer->id,
                'stop_name' => 'Sabon Gari Main Stop',
                'expected_amount' => 39500,
            ]],
        ])->assertCreated()->json('id');

        $this->postJson('/api/wholesale/orders', [
            'customer_id' => $customer->id,
            'route_run_id' => $routeRunId,
            'stop_name' => 'Sabon Gari Main Stop',
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 5,
            ]],
            'paid' => 20000,
            'payment_method' => 'credit',
        ])->assertCreated()
            ->assertJsonPath('items.0.unit_price', '7900.00');

        $this->postJson('/api/wholesale/transfers', [
            'from_warehouse_id' => $tenant['warehouse']->id,
            'to_warehouse_id' => $secondaryWarehouse->id,
            'product_id' => $product->id,
            'quantity' => 12,
        ])->assertCreated();

        $this->patchJson("/api/wholesale/route-runs/{$routeRunId}", [
            'status' => 'completed',
            'actual_amount' => 39500,
        ])->assertOk();

        $this->getJson('/api/wholesale/overview')
            ->assertOk()
            ->assertJsonPath('summary.route_runs_today', 1)
            ->assertJsonPath('summary.active_reps', 1)
            ->assertJsonPath('summary.stock_transfers_today', 1);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'wholesale')
            ->assertJsonPath('wholesale.route_runs_today', 1)
            ->assertJsonPath('wholesale.active_reps', 1);
    }

    public function test_wholesale_endpoints_reject_foreign_tenant_relations(): void
    {
        $tenant = $this->createTenantContext('wholesale', 'wholesale-scope@example.com');
        $otherTenant = $this->createTenantContext('wholesale', 'wholesale-other@example.com');

        Sanctum::actingAs($tenant['user']);

        $localProduct = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Carton',
            'selling_price' => 8000,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Wholesale Customer',
            'phone' => '08030009992',
            'customer_type' => 'wholesaler',
            'is_active' => true,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Bulk Product',
            'selling_price' => 5000,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $foreignVariant = ProductVariant::create([
            'product_id' => $foreignProduct->id,
            'name' => 'Foreign Bulk Variant',
            'selling_price' => 5000,
        ]);

        $foreignSalesRep = WholesaleSalesRep::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Rep',
            'status' => 'active',
        ]);

        $foreignRouteRun = WholesaleRouteRun::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'sales_rep_id' => $foreignSalesRep->id,
            'route_name' => 'Foreign Route',
            'status' => 'planned',
            'route_date' => now()->toDateString(),
        ]);

        $foreignWarehouse = Warehouse::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Wholesale Warehouse',
            'slug' => 'foreign-wholesale-warehouse',
            'is_default' => false,
            'is_active' => true,
        ]);

        $this->postJson('/api/wholesale/price-tiers', [
            'customer_id' => $foreignCustomer->id,
            'product_id' => $foreignProduct->id,
            'tier_name' => 'Foreign Tier',
            'minimum_quantity' => 3,
            'unit_price' => 4800,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'product_id']);

        $this->postJson('/api/wholesale/route-runs', [
            'sales_rep_id' => $foreignSalesRep->id,
            'route_name' => 'Foreign Scoped Route',
            'route_date' => now()->toDateString(),
            'stops' => [[
                'customer_id' => $foreignCustomer->id,
                'stop_name' => 'Foreign Stop',
            ]],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['sales_rep_id', 'stops.0.customer_id']);

        $this->postJson('/api/wholesale/orders', [
            'customer_id' => $foreignCustomer->id,
            'warehouse_id' => $foreignWarehouse->id,
            'route_run_id' => $foreignRouteRun->id,
            'stop_name' => 'Foreign Route Stop',
            'items' => [
                [
                    'product_id' => $localProduct->id,
                    'variant_id' => $foreignVariant->id,
                    'quantity' => 2,
                ],
                [
                    'product_id' => $foreignProduct->id,
                    'quantity' => 1,
                ],
            ],
            'paid' => 0,
            'payment_method' => 'credit',
        ])->assertStatus(422)
            ->assertJsonValidationErrors([
                'customer_id',
                'warehouse_id',
                'route_run_id',
                'items.0.variant_id',
                'items.1.product_id',
            ]);

        $this->postJson('/api/wholesale/transfers', [
            'from_warehouse_id' => $foreignWarehouse->id,
            'to_warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $foreignProduct->id,
            'variant_id' => $foreignVariant->id,
            'quantity' => 4,
        ])->assertStatus(422)
            ->assertJsonValidationErrors([
                'from_warehouse_id',
                'product_id',
                'variant_id',
            ]);
    }
}
