<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductBatch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PharmacyWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_pharmacy_business_can_use_batches_dispense_and_apply_near_expiry_discount(): void
    {
        $tenant = $this->createTenantContext('pharmacy', 'pharmacy-workflow@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Musa Ibrahim',
            'phone' => '08030009999',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Amoxicillin 500mg',
            'selling_price' => 1500,
            'cost_price' => 900,
            'track_inventory' => 'yes',
            'is_active' => true,
            'is_controlled_drug' => false,
            'allow_substitution' => true,
            'refill_cycle_days' => 14,
        ]);

        $batch = ProductBatch::create([
            'business_id' => $tenant['business']->id,
            'product_id' => $product->id,
            'batch_number' => 'BATCH-PHARM-001',
            'expiry_date' => now()->addDays(20)->toDateString(),
            'quantity' => 50,
            'remaining_quantity' => 50,
            'cost_per_unit' => 900,
            'supplier' => 'Trusted Pharma',
        ]);

        $this->postJson("/api/batches/{$batch->id}/use", [
            'quantity' => 5,
            'reference_type' => 'manual_adjustment',
            'reference_id' => 10,
            'notes' => 'Sample pack usage',
        ])->assertOk()
            ->assertJsonPath('remaining_quantity', '45.00')
            ->assertJsonPath('batch.batch_number', 'BATCH-PHARM-001');

        $this->postJson('/api/pharmacy/dispense', [
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'product_batch_id' => $batch->id,
            'quantity' => 3,
            'unit_price' => 1500,
            'prescription_reference' => 'RX-1001',
            'create_refill_reminder' => true,
            'notes' => 'Standard dosage',
        ])->assertCreated()
            ->assertJsonPath('product.name', 'Amoxicillin 500mg')
            ->assertJsonPath('batch.batch_number', 'BATCH-PHARM-001')
            ->assertJsonPath('refill_due', true);

        $this->postJson("/api/batches/{$batch->id}/discount", [
            'near_expiry_discount_percent' => 15,
            'discounted_price' => 1200,
        ])->assertOk()
            ->assertJsonPath('near_expiry_discount_percent', '15.00')
            ->assertJsonPath('discounted_price', '1200.00');
    }

    public function test_pharmacy_stock_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('pharmacy', 'pharmacy-owner@example.com');
        $otherTenant = $this->createTenantContext('pharmacy', 'pharmacy-guest@example.com');

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Paracetamol',
            'selling_price' => 500,
            'cost_price' => 250,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $batch = ProductBatch::create([
            'business_id' => $tenant['business']->id,
            'product_id' => $product->id,
            'batch_number' => 'BATCH-PHARM-002',
            'expiry_date' => now()->addDays(45)->toDateString(),
            'quantity' => 25,
            'remaining_quantity' => 25,
            'cost_per_unit' => 250,
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->postJson("/api/batches/{$batch->id}/use", [
            'quantity' => 2,
        ])->assertForbidden();

        $this->postJson("/api/batches/{$batch->id}/discount", [
            'near_expiry_discount_percent' => 10,
            'discounted_price' => 450,
        ])->assertForbidden();
    }
}
