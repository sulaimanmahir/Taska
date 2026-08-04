<?php

namespace Tests\Feature;

use App\Models\NGODistribution;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class NGOWarehouseWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_warehouse_business_can_create_distribution_and_capture_signature(): void
    {
        $tenant = $this->createTenantContext('ngo_warehouse', 'ngo-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Relief Rice',
            'sku' => 'NGO-RICE-1',
            'product_type' => 'good',
            'cost_price' => 20000,
            'selling_price' => 0,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $distributionResponse = $this->postJson('/api/warehouse/distributions', [
            'beneficiary_name' => 'Community Cluster A',
            'destination_location' => 'Ward 5',
            'driver_name' => 'Sule Driver',
            'vehicle_reference' => 'TRK-NGO-12',
            'status' => 'dispatched',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 15,
                ],
            ],
        ])->assertCreated()
            ->assertJsonPath('data.beneficiary_name', 'Community Cluster A')
            ->assertJsonPath('data.status', 'dispatched')
            ->assertJsonPath('data.items.0.product.name', 'Relief Rice');

        $distributionId = $distributionResponse->json('data.id');

        $this->postJson("/api/warehouse/distributions/{$distributionId}/signatures", [
            'beneficiary_name' => 'Community Cluster A',
            'signed_by' => 'Village Head Musa',
            'signature_reference' => 'sig-ngo-001',
        ])->assertCreated()
            ->assertJsonPath('data.signed_by', 'Village Head Musa')
            ->assertJsonPath('data.distribution.beneficiary_name', 'Community Cluster A');
    }

    public function test_warehouse_distribution_signature_is_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('ngo_warehouse', 'ngo-primary@example.com');
        $otherTenant = $this->createTenantContext('ngo_warehouse', 'ngo-secondary@example.com');

        $distribution = NGODistribution::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'distribution_reference' => 'DST-001',
            'beneficiary_name' => 'Camp B',
            'status' => 'delivered',
            'distributed_on' => now()->toDateString(),
            'created_by' => $tenant['user']->id,
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->postJson("/api/warehouse/distributions/{$distribution->id}/signatures", [
            'beneficiary_name' => 'Camp B',
            'signed_by' => 'Unauthorized User',
        ])->assertForbidden();
    }
}
