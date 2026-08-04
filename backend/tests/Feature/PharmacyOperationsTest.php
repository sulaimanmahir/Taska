<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductBatch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class PharmacyOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_pharmacy_can_manage_substitutions_controlled_drugs_and_refills(): void
    {
        $tenant = $this->createTenantContext('pharmacy', 'pharmacy-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $generic = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Paracetamol Generic',
            'selling_price' => 600,
            'track_expiry' => true,
            'allow_substitution' => true,
            'refill_cycle_days' => 30,
        ]);

        $brand = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Emzor Paracetamol',
            'selling_price' => 900,
            'track_expiry' => true,
            'generic_product_id' => $generic->id,
            'medicine_type' => 'brand',
            'allow_substitution' => true,
        ]);

        $controlled = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Codeine Syrup',
            'selling_price' => 2500,
            'track_expiry' => true,
            'is_prescription_required' => true,
            'is_controlled_drug' => true,
            'pharmacy_category' => 'controlled',
            'refill_cycle_days' => 14,
        ]);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Amina Bello',
            'phone' => '08037778888',
        ]);

        $brandBatchId = $this->postJson('/api/batches', [
            'product_id' => $brand->id,
            'batch_number' => 'EMZ-001',
            'expiry_date' => now()->addDays(10)->toDateString(),
            'quantity' => 40,
            'cost_per_unit' => 400,
            'near_expiry_discount_percent' => 10,
            'discounted_price' => 800,
        ])->assertCreated()->json('batch.id');

        $controlledBatchId = $this->postJson('/api/batches', [
            'product_id' => $controlled->id,
            'batch_number' => 'COD-002',
            'expiry_date' => now()->addMonths(4)->toDateString(),
            'quantity' => 25,
            'cost_per_unit' => 1200,
        ])->assertCreated()->json('batch.id');

        $this->postJson('/api/pharmacy/substitutions', [
            'product_id' => $brand->id,
            'substitute_product_id' => $generic->id,
            'reason' => 'Use generic when brand is unavailable.',
        ])->assertCreated()
            ->assertJsonPath('substitute.name', 'Paracetamol Generic');

        $this->postJson("/api/batches/{$brandBatchId}/discount", [
            'near_expiry_discount_percent' => 15,
            'discounted_price' => 750,
        ])->assertOk()
            ->assertJsonPath('near_expiry_discount_percent', '15.00');

        $this->postJson('/api/pharmacy/dispense', [
            'customer_id' => $customer->id,
            'product_id' => $controlled->id,
            'product_batch_id' => $controlledBatchId,
            'quantity' => 2,
            'unit_price' => 2500,
            'prescription_reference' => 'RX-2026-44',
            'create_refill_reminder' => true,
            'notes' => 'Controlled sale logged.',
        ])->assertCreated()
            ->assertJsonPath('customer.name', 'Amina Bello')
            ->assertJsonPath('total_amount', '5000.00');

        $this->getJson('/api/pharmacy/controlled-logs')
            ->assertOk()
            ->assertJsonPath('0.product.name', 'Codeine Syrup');

        $this->getJson('/api/pharmacy/refill-reminders')
            ->assertOk()
            ->assertJsonPath('0.customer.name', 'Amina Bello');

        $this->getJson('/api/pharmacy/purchase-history')
            ->assertOk()
            ->assertJsonPath('0.prescription_reference', 'RX-2026-44');

        $this->getJson('/api/pharmacy/overview')
            ->assertOk()
            ->assertJsonPath('summary.near_expiry_batches', 1)
            ->assertJsonPath('summary.discounted_batches', 1)
            ->assertJsonPath('summary.controlled_logs', 1)
            ->assertJsonPath('summary.refill_pending', 1);
    }

    public function test_pharmacy_endpoints_reject_foreign_relations_and_mismatched_batches(): void
    {
        $tenant = $this->createTenantContext('pharmacy', 'pharmacy-scope@example.com');
        $otherTenant = $this->createTenantContext('pharmacy', 'pharmacy-other@example.com');

        Sanctum::actingAs($tenant['user']);

        $localProduct = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Antibiotic',
            'selling_price' => 1800,
            'track_expiry' => true,
        ]);

        $localOtherProduct = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Cough Syrup',
            'selling_price' => 2200,
            'track_expiry' => true,
        ]);

        $localOtherBatch = ProductBatch::create([
            'business_id' => $tenant['business']->id,
            'product_id' => $localOtherProduct->id,
            'batch_number' => 'LOCAL-OTHER-001',
            'expiry_date' => now()->addMonths(3)->toDateString(),
            'quantity' => 10,
            'remaining_quantity' => 10,
            'cost_per_unit' => 1000,
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Drug',
            'selling_price' => 2600,
            'track_expiry' => true,
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Patient',
            'phone' => '08039991111',
        ]);

        $foreignBatch = ProductBatch::create([
            'business_id' => $otherTenant['business']->id,
            'product_id' => $foreignProduct->id,
            'batch_number' => 'FOREIGN-001',
            'expiry_date' => now()->addMonths(4)->toDateString(),
            'quantity' => 20,
            'remaining_quantity' => 20,
            'cost_per_unit' => 1200,
        ]);

        $this->postJson('/api/batches', [
            'product_id' => $foreignProduct->id,
            'batch_number' => 'BAD-BATCH-001',
            'expiry_date' => now()->addMonths(2)->toDateString(),
            'quantity' => 12,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id']);

        $this->postJson('/api/pharmacy/substitutions', [
            'product_id' => $foreignProduct->id,
            'substitute_product_id' => $foreignProduct->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id', 'substitute_product_id']);

        $this->postJson('/api/pharmacy/dispense', [
            'customer_id' => $foreignCustomer->id,
            'product_id' => $foreignProduct->id,
            'product_batch_id' => $foreignBatch->id,
            'substituted_from_product_id' => $foreignProduct->id,
            'quantity' => 1,
            'unit_price' => 2600,
        ])->assertStatus(422)
            ->assertJsonValidationErrors([
                'customer_id',
                'product_id',
                'product_batch_id',
                'substituted_from_product_id',
            ]);

        $this->postJson('/api/pharmacy/dispense', [
            'product_id' => $localProduct->id,
            'product_batch_id' => $localOtherBatch->id,
            'quantity' => 1,
            'unit_price' => 1800,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_batch_id']);
    }
}
