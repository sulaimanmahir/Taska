<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ProductWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_it_creates_updates_and_shows_products_with_structured_payloads(): void
    {
        $tenant = $this->createTenantContext('retail', 'product-workflow@example.com');
        Sanctum::actingAs($tenant['user']);

        $categoryResponse = $this->postJson('/api/product-categories', [
            'name' => 'Packaged Foods',
        ])->assertCreated();

        $categoryId = $categoryResponse->json('id');

        $categoryResponse
            ->assertJsonPath('name', 'Packaged Foods')
            ->assertJsonPath('slug', 'packaged-foods');

        $productResponse = $this->postJson('/api/products', [
            'name' => 'Premium Spaghetti',
            'sku' => 'SPAG-001',
            'category_id' => $categoryId,
            'cost_price' => 700,
            'selling_price' => 950,
            'track_inventory' => 'yes',
            'product_type' => 'good',
        ])->assertCreated();

        $productId = $productResponse->json('id');

        $productResponse
            ->assertJsonPath('name', 'Premium Spaghetti')
            ->assertJsonPath('category.name', 'Packaged Foods')
            ->assertJsonPath('selling_price', '950.00');

        $this->patchJson("/api/products/{$productId}", [
            'selling_price' => 990,
            'is_active' => true,
        ])
            ->assertOk()
            ->assertJsonPath('selling_price', '990.00')
            ->assertJsonPath('is_active', true);

        $this->getJson("/api/products/{$productId}")
            ->assertOk()
            ->assertJsonPath('name', 'Premium Spaghetti')
            ->assertJsonPath('category.name', 'Packaged Foods');

        $this->patchJson("/api/product-categories/{$categoryId}", [
            'name' => 'Packaged Grocery',
            'is_active' => true,
        ])
            ->assertOk()
            ->assertJsonPath('name', 'Packaged Grocery')
            ->assertJsonPath('slug', 'packaged-grocery')
            ->assertJsonPath('is_active', true);
    }

    public function test_it_returns_stock_summary_in_product_listing(): void
    {
        $tenant = $this->createTenantContext('retail', 'product-listing@example.com');
        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Stocked Soda',
            'sku' => 'SODA-001',
            'selling_price' => 150,
            'cost_price' => 100,
            'track_inventory' => true,
            'low_stock_alert' => 5,
            'is_active' => true,
        ]);

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonPath('data.0.id', $product->id)
            ->assertJsonPath('data.0.available_quantity', 0)
            ->assertJsonPath('data.0.stock_status', 'out_of_stock');
    }

    public function test_a_non_inventory_tracked_product_reports_unlimited_stock_not_out_of_stock(): void
    {
        $tenant = $this->createTenantContext('retail', 'product-no-track@example.com');
        Sanctum::actingAs($tenant['user']);

        $service = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Consulting Service',
            'selling_price' => 15000,
            'track_inventory' => 'no',
            'is_active' => true,
        ]);

        // A service has no inventory_items row at all - the resource must
        // not report it as "out of stock" (available_quantity: 0), which
        // would block it from being added to a cart in the frontend.
        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonPath('data.0.id', $service->id)
            ->assertJsonPath('data.0.available_quantity', null)
            ->assertJsonPath('data.0.stock_status', 'in_stock');
    }

    public function test_it_rejects_foreign_tenant_product_category_links_and_actions(): void
    {
        $tenant = $this->createTenantContext('retail', 'product-scope@example.com');
        $otherTenant = $this->createTenantContext('retail', 'product-scope-other@example.com');

        $foreignCategory = ProductCategory::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Category',
            'slug' => 'foreign-category',
            'is_active' => true,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Product',
            'selling_price' => 1200,
            'category_id' => $foreignCategory->id,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/products', [
            'name' => 'Invalid Product',
            'category_id' => $foreignCategory->id,
            'selling_price' => 900,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);

        $this->patchJson("/api/products/{$foreignProduct->id}", [
            'name' => 'Hijacked Product',
        ])->assertStatus(403);

        $this->patchJson("/api/product-categories/{$foreignCategory->id}", [
            'name' => 'Hijacked Category',
        ])->assertStatus(403);
    }
}
