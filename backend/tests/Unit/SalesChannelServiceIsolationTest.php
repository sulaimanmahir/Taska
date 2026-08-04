<?php

namespace Tests\Unit;

use App\Models\Product;
use App\Services\PureWaterRetailService;
use App\Services\WholesaleService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class SalesChannelServiceIsolationTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_wholesale_service_rejects_products_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('wholesale', 'wholesale-service-local@example.com');
        $foreignTenant = $this->createTenantContext('wholesale', 'wholesale-service-foreign@example.com');

        $foreignProduct = Product::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Bulk Pack',
            'selling_price' => 5000,
            'track_inventory' => 'yes',
            'product_type' => 'good',
        ]);

        try {
            app(WholesaleService::class)->createWholesaleOrder([
                'warehouse_id' => $tenant['warehouse']->id,
                'items' => [[
                    'product_id' => $foreignProduct->id,
                    'quantity' => 2,
                ]],
                'paid' => 0,
                'payment_method' => 'credit',
            ], $tenant['business']->id, $tenant['branch']->id, $tenant['user']->id);

            $this->fail('Expected wholesale service to reject a foreign product.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('orders', 0);
        }
    }

    public function test_pure_water_retail_service_rejects_products_outside_the_business_scope(): void
    {
        $tenant = $this->createTenantContext('pure_water_retail', 'pwr-service-local@example.com');
        $foreignTenant = $this->createTenantContext('pure_water_retail', 'pwr-service-foreign@example.com');

        $foreignProduct = Product::create([
            'business_id' => $foreignTenant['business']->id,
            'name' => 'Foreign Water Bundle',
            'selling_price' => 320,
            'track_inventory' => 'yes',
            'product_type' => 'good',
        ]);

        try {
            app(PureWaterRetailService::class)->createSale([
                'warehouse_id' => $tenant['warehouse']->id,
                'items' => [[
                    'product_id' => $foreignProduct->id,
                    'quantity' => 4,
                    'package_type' => 'bag',
                ]],
                'paid' => 1280,
                'payment_method' => 'cash',
            ], $tenant['business']->id, $tenant['branch']->id, $tenant['user']->id);

            $this->fail('Expected pure water retail service to reject a foreign product.');
        } catch (ModelNotFoundException $exception) {
            $this->assertDatabaseCount('orders', 0);
        }
    }
}
