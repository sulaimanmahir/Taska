<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\ConstructionCreditAccount;
use App\Models\ConstructionDelivery;
use App\Models\ConstructionQuotation;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\UnitOfMeasure;
use App\Models\Warehouse;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ConstructionOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_user_can_create_building_materials_business(): void
    {
        $user = User::factory()->create();
        $existing = Business::create([
            'name' => 'Taska Retail',
            'slug' => 'taska-retail',
            'email' => 'retail@example.com',
            'business_type' => 'retail',
            'modules' => config('business_types.types.retail.modules'),
        ]);
        $role = Role::create([
            'business_id' => $existing->id,
            'name' => 'Business Owner',
            'slug' => 'admin',
            'description' => 'Full access',
            'is_default' => true,
        ]);
        DB::table('business_user')->insert([
            'business_id' => $existing->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'status' => 'active',
            'joined_at' => now(),
        ]);
        DB::table('role_user')->insert([
            'role_id' => $role->id,
            'user_id' => $user->id,
            'business_id' => $existing->id,
            'assigned_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/auth/businesses', [
            'business_name' => 'Mainland Building Depot',
            'business_email' => 'materials@example.com',
            'business_type' => 'construction',
            'business_category' => 'commerce',
            'business_location' => 'Lagos',
            'primary_branch_name' => 'Depot HQ',
            'contact_phone' => '08030001111',
        ])->assertCreated()
            ->assertJsonPath('business.business_type', 'construction');
    }

    public function test_building_materials_business_can_run_core_operational_flow(): void
    {
        $tenant = $this->createTenantContext('construction', 'materials-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $overview = $this->getJson('/api/building-materials/overview')
            ->assertOk()
            ->assertJsonCount(21, 'categories')
            ->json();

        $cementCategoryId = collect($overview['categories'])->firstWhere('slug', 'cement-binding-materials')['id'];

        $materialId = $this->postJson('/api/building-materials/items', [
            'name' => 'Dangote Cement 50kg',
            'sku' => 'CEM-001',
            'category_id' => $cementCategoryId,
            'subcategory' => 'Cement',
            'brand' => 'Dangote',
            'unit_type' => 'bag',
            'cost_price' => 7200,
            'selling_price' => 8200,
            'wholesale_price' => 7900,
            'contractor_price' => 7600,
            'quantity' => 250,
            'reorder_level' => 50,
            'warehouse_id' => $tenant['warehouse']->id,
            'stock_location_type' => 'warehouse',
        ])->assertCreated()->json('id');

        $customerId = $this->postJson('/api/building-materials/customers', [
            'name' => 'Prime Site Contractors',
            'phone' => '08035550001',
            'customer_role' => 'contractor',
            'pricing_tier' => 'contractor',
            'site_location' => 'Lekki Phase 1',
            'project_name' => 'Admiralty Duplex Site',
            'credit_limit' => 1500000,
            'guarantor_notes' => 'Backed by retained job payment.',
        ])->assertCreated()->json('id');

        $quotationId = $this->postJson('/api/building-materials/quotations', [
            'customer_id' => $customerId,
            'pricing_tier' => 'contractor',
            'delivery_fee' => 30000,
            'items' => [[
                'product_id' => $materialId,
                'unit_type' => 'bag',
                'quantity' => 100,
            ]],
        ])->assertCreated()
            ->assertJsonPath('items.0.unit_price', '7600.00')
            ->json('id');

        $orderId = $this->postJson("/api/building-materials/quotations/{$quotationId}/convert", [
            'paid' => 200000,
            'payment_method' => 'credit',
            'due_date' => now()->addDays(10)->toDateString(),
        ])->assertOk()
            ->json('id');

        $deliveryId = $this->postJson('/api/building-materials/deliveries', [
            'quotation_id' => $quotationId,
            'order_id' => $orderId,
            'customer_id' => $customerId,
            'driver_name' => 'Kunle Dispatch',
            'loader_name' => 'Bala Loader',
            'vehicle_reference' => 'KJA-204XZ',
            'delivery_address' => 'Admiralty Way, Lekki',
        ])->assertCreated()->json('id');

        $this->patchJson("/api/building-materials/deliveries/{$deliveryId}", [
            'status' => 'delivered',
            'confirmed_by' => 'Site Foreman Uche',
        ])->assertOk()
            ->assertJsonPath('status', 'delivered');

        $creditAccountId = collect($this->getJson('/api/building-materials/overview')->json('credits'))->first()['id'];

        $this->postJson("/api/building-materials/credit-accounts/{$creditAccountId}/payments", [
            'amount' => 150000,
            'payment_method' => 'transfer',
        ])->assertCreated();

        $this->postJson('/api/building-materials/price-changes', [
            'product_id' => $materialId,
            'price_type' => 'contractor',
            'new_price' => 7800,
            'reason' => 'Supplier increase',
        ])->assertCreated()
            ->assertJsonPath('previous_price', '7600.00');

        $yardId = Warehouse::where('business_id', $tenant['business']->id)->where('slug', 'open-yard')->value('id');
        $footUnitId = UnitOfMeasure::where('business_id', $tenant['business']->id)->where('abbreviation', 'ft')->value('id');

        $this->postJson('/api/building-materials/transfers', [
            'product_id' => $materialId,
            'source_warehouse_id' => $tenant['warehouse']->id,
            'destination_warehouse_id' => $yardId,
            'unit_of_measure_id' => $footUnitId,
            'quantity' => 10,
            'notes' => 'Move sample stock to yard display',
        ])->assertCreated()
            ->assertJsonPath('converted_quantity', '3.048');

        $this->getJson('/api/building-materials/overview')
            ->assertOk()
            ->assertJsonPath('summary.today_sales', 790000)
            ->assertJsonPath('summary.pending_deliveries', 0)
            ->assertJsonPath('summary.quotations_pending', 0);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'construction')
            ->assertJsonPath('construction.today_sales', 790000)
            ->assertJsonPath('construction.pending_deliveries', 0);
    }

    public function test_building_materials_endpoints_reject_foreign_tenant_relations_and_resources(): void
    {
        $tenant = $this->createTenantContext('construction', 'materials-scope@example.com');
        $otherTenant = $this->createTenantContext('construction', 'materials-other@example.com');

        ProductCategory::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Category',
            'slug' => 'foreign-category',
            'is_active' => true,
        ]);

        $foreignCategoryId = ProductCategory::where('business_id', $otherTenant['business']->id)
            ->where('slug', 'foreign-category')
            ->value('id');

        $foreignSupplier = Supplier::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Supplier',
            'phone' => '08030003331',
            'is_active' => true,
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Contractor',
            'phone' => '08030003332',
            'customer_type' => 'wholesaler',
            'is_active' => true,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'category_id' => $foreignCategoryId,
            'name' => 'Foreign Cement',
            'selling_price' => 9000,
            'cost_price' => 8000,
            'track_inventory' => 'yes',
            'product_type' => 'good',
            'is_active' => true,
        ]);

        $foreignQuotation = ConstructionQuotation::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'quotation_number' => 'QTN-FOREIGN-001',
            'status' => 'sent',
            'subtotal' => 100000,
            'total' => 100000,
            'created_by' => $otherTenant['user']->id,
        ]);

        $foreignOrder = Order::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'created_by' => $otherTenant['user']->id,
            'order_number' => 'ORD-FOREIGN-001',
            'order_type' => 'sale',
            'status' => 'completed',
            'subtotal' => 100000,
            'discount' => 0,
            'tax' => 0,
            'total' => 100000,
            'paid' => 0,
            'change' => 0,
            'payment_method' => 'credit',
        ]);

        $foreignDelivery = ConstructionDelivery::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'order_id' => $foreignOrder->id,
            'quotation_id' => $foreignQuotation->id,
            'customer_id' => $foreignCustomer->id,
            'status' => 'pending_dispatch',
            'created_by' => $otherTenant['user']->id,
        ]);

        $foreignCreditAccount = ConstructionCreditAccount::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'order_id' => $foreignOrder->id,
            'due_date' => now()->addDays(7)->toDateString(),
            'total_amount' => 100000,
            'paid_amount' => 0,
            'outstanding_amount' => 100000,
            'debt_age_bucket' => 'current',
            'status' => 'open',
        ]);

        $foreignUnit = UnitOfMeasure::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Bundle',
            'abbreviation' => 'fbdl',
            'conversion_factor' => 1,
            'is_base' => true,
        ]);

        $localQuotation = ConstructionQuotation::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'quotation_number' => 'QTN-LOCAL-001',
            'status' => 'sent',
            'subtotal' => 50000,
            'total' => 50000,
            'created_by' => $tenant['user']->id,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/building-materials/items', [
            'name' => 'Invalid Item',
            'category_id' => $foreignCategoryId,
            'unit_type' => 'bag',
            'selling_price' => 1000,
            'supplier_id' => $foreignSupplier->id,
            'warehouse_id' => $otherTenant['warehouse']->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['category_id', 'supplier_id', 'warehouse_id']);

        $this->postJson('/api/building-materials/quotations', [
            'customer_id' => $foreignCustomer->id,
            'items' => [[
                'product_id' => $foreignProduct->id,
                'quantity' => 5,
            ]],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'items.0.product_id']);

        $this->postJson("/api/building-materials/quotations/{$localQuotation->id}/convert", [
            'warehouse_id' => $otherTenant['warehouse']->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['warehouse_id']);

        $this->postJson('/api/building-materials/deliveries', [
            'order_id' => $foreignOrder->id,
            'quotation_id' => $foreignQuotation->id,
            'customer_id' => $foreignCustomer->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['order_id', 'quotation_id', 'customer_id']);

        $this->postJson('/api/building-materials/price-changes', [
            'product_id' => $foreignProduct->id,
            'price_type' => 'selling',
            'new_price' => 9500,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id']);

        $this->postJson('/api/building-materials/transfers', [
            'product_id' => $foreignProduct->id,
            'source_warehouse_id' => $otherTenant['warehouse']->id,
            'destination_warehouse_id' => $tenant['warehouse']->id,
            'unit_of_measure_id' => $foreignUnit->id,
            'quantity' => 2,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id', 'source_warehouse_id', 'unit_of_measure_id']);

        $this->postJson("/api/building-materials/quotations/{$foreignQuotation->id}/convert")
            ->assertStatus(403);

        $this->patchJson("/api/building-materials/deliveries/{$foreignDelivery->id}", [
            'status' => 'delivered',
        ])->assertStatus(403);

        $this->postJson("/api/building-materials/credit-accounts/{$foreignCreditAccount->id}/payments", [
            'amount' => 1000,
        ])->assertStatus(403);
    }
}
