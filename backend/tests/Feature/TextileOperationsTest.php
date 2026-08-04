<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\TailoringJob;
use App\Models\TextileColorVariant;
use App\Models\TextileCustomerMeasurement;
use App\Models\TextileStyleOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class TextileOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_textile_business_can_run_measurements_jobs_consignment_and_yard_invoicing(): void
    {
        $tenant = $this->createTenantContext('textile', 'textile-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Hajiya Safiya',
            'phone' => '08031112222',
        ]);

        $fabric = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Ankara Supreme',
            'selling_price' => 4500,
            'cost_price' => 2800,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $measurementId = $this->postJson('/api/textile/measurements', [
            'customer_id' => $customer->id,
            'measurement_profile' => 'Kaftan Set',
            'chest' => 42,
            'waist' => 38,
            'length' => 60,
        ])->assertCreated()->json('id');

        $variantId = $this->postJson('/api/textile/variants', [
            'product_id' => $fabric->id,
            'color_name' => 'Royal Blue',
            'shade_code' => 'RB-03',
            'unit_type' => 'yard',
            'available_quantity' => 24,
            'retail_price' => 5200,
            'wholesale_price' => 4700,
        ])->assertCreated()->json('id');

        $orderId = $this->postJson('/api/textile/style-orders', [
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'measurement_id' => $measurementId,
            'variant_id' => $variantId,
            'style_name' => 'Senator Kaftan',
            'garment_type' => 'Menswear',
            'fabric_quantity' => 4,
            'fabric_unit' => 'yard',
            'labour_charge' => 12000,
            'due_date' => now()->addDays(5)->toDateString(),
            'assigned_tailor' => 'Malam Yusuf',
        ])->assertCreated()
            ->assertJsonPath('total_amount', '32800.00')
            ->json('id');

        $jobId = $this->getJson('/api/textile/jobs')
            ->assertOk()
            ->json('0.id');

        $this->patchJson("/api/textile/jobs/{$jobId}", [
            'stage' => 'completed',
            'notes' => 'Ready for collection.',
        ])->assertOk()
            ->assertJsonPath('stage', 'completed')
            ->assertJsonPath('style_order.status', 'ready');

        $this->postJson('/api/textile/consignments', [
            'product_id' => $fabric->id,
            'variant_id' => $variantId,
            'partner_name' => 'Kwari Stall B12',
            'quantity_sent' => 3,
            'settlement_due' => 14100,
            'sent_date' => now()->toDateString(),
        ])->assertCreated()
            ->assertJsonPath('status', 'open');

        $this->postJson('/api/textile/invoices', [
            'customer_id' => $customer->id,
            'style_order_id' => $orderId,
            'unit_type' => 'yard',
            'quantity' => 4,
            'rate' => 5200,
            'total_amount' => 20800,
            'amount_paid' => 10000,
        ])->assertCreated()
            ->assertJsonPath('status', 'open')
            ->assertJsonPath('subtotal', '20800.00');

        $this->getJson('/api/textile/overview')
            ->assertOk()
            ->assertJsonPath('summary.active_jobs', 0)
            ->assertJsonPath('summary.consignment_open', 1)
            ->assertJsonPath('summary.measurements_saved', 1)
            ->assertJsonPath('summary.color_variants', 1);
    }

    public function test_textile_endpoints_reject_foreign_tenant_relations_and_jobs(): void
    {
        $tenant = $this->createTenantContext('textile', 'textile-scope@example.com');
        $otherTenant = $this->createTenantContext('textile', 'textile-other@example.com');

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Customer',
            'phone' => '08030004441',
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Fabric',
            'selling_price' => 5000,
            'cost_price' => 3000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $foreignMeasurement = TextileCustomerMeasurement::create([
            'business_id' => $otherTenant['business']->id,
            'customer_id' => $foreignCustomer->id,
            'measurement_profile' => 'Foreign Profile',
            'chest' => 40,
        ]);

        $foreignVariant = TextileColorVariant::create([
            'business_id' => $otherTenant['business']->id,
            'product_id' => $foreignProduct->id,
            'color_name' => 'Foreign Red',
            'unit_type' => 'yard',
            'available_quantity' => 10,
            'retail_price' => 6000,
        ]);

        $foreignStyleOrder = TextileStyleOrder::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'measurement_id' => $foreignMeasurement->id,
            'variant_id' => $foreignVariant->id,
            'order_number' => 'TXT-FOREIGN-001',
            'style_name' => 'Foreign Order',
            'status' => 'intake',
            'fabric_quantity' => 3,
            'fabric_charge' => 18000,
            'labour_charge' => 5000,
            'total_amount' => 23000,
            'amount_paid' => 0,
        ]);

        $foreignJob = TailoringJob::create([
            'business_id' => $otherTenant['business']->id,
            'style_order_id' => $foreignStyleOrder->id,
            'stage' => 'cutting',
            'priority' => 'normal',
            'started_at' => now(),
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/textile/measurements', [
            'customer_id' => $foreignCustomer->id,
            'measurement_profile' => 'Invalid Profile',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id']);

        $this->postJson('/api/textile/variants', [
            'product_id' => $foreignProduct->id,
            'color_name' => 'Invalid Variant',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id']);

        $this->postJson('/api/textile/style-orders', [
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'measurement_id' => $foreignMeasurement->id,
            'variant_id' => $foreignVariant->id,
            'style_name' => 'Invalid Order',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'customer_id', 'measurement_id', 'variant_id']);

        $this->postJson('/api/textile/consignments', [
            'product_id' => $foreignProduct->id,
            'variant_id' => $foreignVariant->id,
            'partner_name' => 'Invalid Consignment',
            'quantity_sent' => 1,
            'sent_date' => now()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id', 'variant_id']);

        $this->postJson('/api/textile/invoices', [
            'customer_id' => $foreignCustomer->id,
            'style_order_id' => $foreignStyleOrder->id,
            'quantity' => 2,
            'rate' => 5000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['customer_id', 'style_order_id']);

        $this->patchJson("/api/textile/jobs/{$foreignJob->id}", [
            'stage' => 'completed',
        ])->assertStatus(403);
    }
}
