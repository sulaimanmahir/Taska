<?php

namespace Tests\Unit;

use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\RawMaterial;
use App\Services\PharmacyService;
use App\Services\ProductionService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ProductionPharmacyServiceIsolationTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_production_service_rejects_output_products_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('pure_water_factory', 'production-service-local@example.com');
        $foreignTenant = $this->createTenantContext('pure_water_factory', 'production-service-foreign@example.com');

        $localMaterial = RawMaterial::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'name' => 'Local Nylon Roll',
            'material_category' => 'packaging',
            'quantity' => 10,
            'cost_per_unit' => 5000,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Output Product',
            'selling_price' => 220,
        ]);

        try {
            app(ProductionService::class)->createBatch([
                'materials' => [[
                    'raw_material_id' => $localMaterial->id,
                    'quantity_used' => 1,
                ]],
                'outputs' => [[
                    'product_id' => $foreignProduct->id,
                    'quantity_produced' => 50,
                ]],
            ], $tenant['business']->id, $tenant['user']->id);

            $this->fail('Expected production service to reject a foreign output product.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('production_batches', 0);
        }
    }

    public function test_production_service_rejects_raw_materials_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('pure_water_factory', 'production-purchase-local@example.com');
        $foreignTenant = $this->createTenantContext('pure_water_factory', 'production-purchase-foreign@example.com');

        $foreignMaterial = RawMaterial::create([
            'business_id' => $foreignTenant['business']->id,
            'warehouse_id' => $foreignTenant['warehouse']->id,
            'name' => 'Foreign Chemical',
            'material_category' => 'chemical',
            'quantity' => 5,
            'cost_per_unit' => 12000,
        ]);

        try {
            app(ProductionService::class)->recordPurchase([
                'raw_material_id' => $foreignMaterial->id,
                'supplier_name' => 'Foreign Supplier',
                'quantity' => 2,
                'unit_cost' => 10000,
            ], $tenant['business']->id);

            $this->fail('Expected production service to reject a foreign raw material.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('production_input_purchases', 0);
        }
    }

    public function test_pharmacy_service_rejects_batch_creation_for_products_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('pharmacy', 'pharmacy-service-local@example.com');
        $foreignTenant = $this->createTenantContext('pharmacy', 'pharmacy-service-foreign@example.com');

        $foreignProduct = Product::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Drug',
            'selling_price' => 2500,
            'track_expiry' => true,
        ]);

        try {
            app(PharmacyService::class)->createBatch([
                'product_id' => $foreignProduct->id,
                'batch_number' => 'FOREIGN-BATCH-001',
                'expiry_date' => now()->addMonth()->toDateString(),
                'quantity' => 12,
            ], $tenant['business']->id);

            $this->fail('Expected pharmacy service to reject a foreign product batch.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('product_batches', 0);
        }
    }

    public function test_pharmacy_service_rejects_batches_that_do_not_match_the_selected_product(): void
    {
        $tenant = $this->createTenantContext('pharmacy', 'pharmacy-dispense-local@example.com');

        $selectedProduct = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Selected Product',
            'selling_price' => 1800,
            'track_expiry' => true,
        ]);

        $otherProduct = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Other Product',
            'selling_price' => 2200,
            'track_expiry' => true,
        ]);

        $otherBatch = ProductBatch::create([
            'business_id' => $tenant['business']->id,
            'product_id' => $otherProduct->id,
            'batch_number' => 'OTHER-BATCH-001',
            'expiry_date' => now()->addMonths(3)->toDateString(),
            'quantity' => 10,
            'remaining_quantity' => 10,
            'cost_per_unit' => 1000,
        ]);

        try {
            app(PharmacyService::class)->dispense([
                'product_id' => $selectedProduct->id,
                'product_batch_id' => $otherBatch->id,
                'quantity' => 1,
                'unit_price' => 1800,
            ], $tenant['business']->id, $tenant['user']->id);

            $this->fail('Expected pharmacy service to reject a mismatched product batch.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('pharmacy_dispenses', 0);
        }
    }
}
