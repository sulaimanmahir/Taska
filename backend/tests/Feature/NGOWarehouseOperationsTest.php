<?php

namespace Tests\Feature;

use App\Models\InventoryBatch;
use App\Models\NGODistribution;
use App\Models\NGODonorSource;
use App\Models\NGOPartnerRequest;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class NGOWarehouseOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_warehouse_can_track_sources_requests_distributions_and_signatures(): void
    {
        $tenant = $this->createTenantContext('ngo_warehouse', 'ngo-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Relief Rice Bag',
            'selling_price' => 0,
            'cost_price' => 0,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        InventoryBatch::create([
            'business_id' => $tenant['business']->id,
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'quantity' => 50,
            'expiry_date' => now()->addDays(10)->toDateString(),
        ]);

        $donorId = $this->postJson('/api/warehouse/donors', [
            'name' => 'UN Support Fund',
            'contact_person' => 'Mary James',
            'compliance_reference' => 'UN-REF-2026',
        ])->assertCreated()->json('id');

        $partnerRequestId = $this->postJson('/api/warehouse/partner-requests', [
            'partner_name' => 'North Relief Cluster',
            'request_notes' => 'Urgent dry-season support kit',
            'needed_by' => now()->addDays(5)->toDateString(),
        ])->assertCreated()->json('id');

        $distributionResponse = $this->postJson('/api/warehouse/distributions', [
            'partner_request_id' => $partnerRequestId,
            'donor_source_id' => $donorId,
            'beneficiary_name' => 'Amina Yusuf',
            'destination_location' => 'Kano Camp',
            'driver_name' => 'Usman Driver',
            'vehicle_reference' => 'ABJ-203NG',
            'items' => [[
                'product_id' => $product->id,
                'quantity' => 12,
            ]],
        ])->assertCreated()
            ->assertJsonPath('data.items.0.quantity', '12.000');

        $distributionId = $distributionResponse->json('data.id');

        $this->postJson("/api/warehouse/distributions/{$distributionId}/signatures", [
            'beneficiary_name' => 'Amina Yusuf',
            'signed_by' => 'Camp Lead',
            'signature_reference' => 'SIG-001',
        ])->assertCreated();

        $this->getJson('/api/warehouse/overview')
            ->assertOk()
            ->assertJsonPath('summary.donor_sources', 1)
            ->assertJsonPath('summary.partner_requests_pending', 0)
            ->assertJsonPath('summary.distributions_today', 1)
            ->assertJsonPath('summary.expiry_alerts', 1);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'warehouse')
            ->assertJsonPath('warehouse.donor_sources', 1)
            ->assertJsonPath('warehouse.distributions_today', 1)
            ->assertJsonPath('ngo_warehouse.donor_sources', 1);
    }

    public function test_warehouse_endpoints_reject_foreign_tenant_distribution_relations_and_signatures(): void
    {
        $tenant = $this->createTenantContext('ngo_warehouse', 'ngo-scope@example.com');
        $otherTenant = $this->createTenantContext('ngo_warehouse', 'ngo-other@example.com');

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Relief Kit',
            'selling_price' => 0,
            'cost_price' => 0,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $foreignDonor = NGODonorSource::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Donor',
        ]);

        $foreignRequest = NGOPartnerRequest::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'partner_name' => 'Foreign Cluster',
            'request_reference' => 'REQ-FOREIGN-001',
            'status' => 'pending',
        ]);

        $foreignDistribution = NGODistribution::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'partner_request_id' => $foreignRequest->id,
            'donor_source_id' => $foreignDonor->id,
            'distribution_reference' => 'DST-FOREIGN-001',
            'beneficiary_name' => 'Foreign Beneficiary',
            'status' => 'dispatched',
            'distributed_on' => today()->toDateString(),
            'created_by' => $otherTenant['user']->id,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/warehouse/distributions', [
            'partner_request_id' => $foreignRequest->id,
            'donor_source_id' => $foreignDonor->id,
            'beneficiary_name' => 'Invalid Distribution',
            'items' => [[
                'product_id' => $foreignProduct->id,
                'quantity' => 5,
            ]],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['partner_request_id', 'donor_source_id', 'items.0.product_id']);

        $this->postJson("/api/warehouse/distributions/{$foreignDistribution->id}/signatures", [
            'beneficiary_name' => 'Foreign Beneficiary',
            'signed_by' => 'Invalid Signatory',
        ])->assertStatus(403);
    }
}
