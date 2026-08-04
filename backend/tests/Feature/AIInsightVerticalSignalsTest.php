<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\DeliveryContact;
use App\Models\DeliveryOrder;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductionBatch;
use App\Models\TrustAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class AIInsightVerticalSignalsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_ai_engine_flags_delivery_backlog_and_repayment_risk(): void
    {
        $tenant = $this->createTenantContext('delivery_company', 'delivery-ai@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Credit Customer',
            'phone' => '08031110000',
            'customer_type' => 'individual',
            'credit_limit' => 50000,
            'balance' => 42000,
            'is_active' => true,
        ]);

        TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $customer->id,
            'account_type' => 'credit',
            'limit' => 50000,
            'balance' => 42000,
            'total_repaid' => 0,
            'last_payment_date' => now()->subDays(24),
            'status' => 'active',
        ]);

        $sender = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Sender One',
            'phone' => '08032220000',
            'address' => 'Yaba, Lagos',
        ]);

        $recipient = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Recipient One',
            'phone' => '08033330000',
            'address' => 'Lekki, Lagos',
        ]);

        $deliveryOrder = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => $sender->id,
            'recipient_contact_id' => $recipient->id,
            'tracking_code' => 'DLY-AI-001',
            'status' => 'in_transit',
            'parcel_category' => 'document',
            'pricing_model' => 'flat',
            'pickup_address' => 'Yaba',
            'dropoff_address' => 'Lekki',
            'base_fee' => 3500,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 3500,
            'cod_amount' => 2800,
            'amount_remitted' => 0,
        ]);

        $deliveryOrder->forceFill([
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ])->saveQuietly();

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('delivery_slowdown_forecast', $types);
        $this->assertContains('trust_repayment_risk', $types);
        $this->assertContains('credit_default_forecast', $types);
        $this->assertContains('delivery_cod_exposure_forecast', $types);
    }

    public function test_ai_engine_flags_production_margin_erosion(): void
    {
        $tenant = $this->createTenantContext('pure_water_factory', 'factory-ai@example.com');

        Sanctum::actingAs($tenant['user']);

        ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => 'PW-001',
            'production_date' => now()->subDays(3)->toDateString(),
            'status' => 'completed',
            'total_input_quantity' => 1000,
            'total_output_quantity' => 900,
            'total_batch_cost' => 220000,
            'estimated_revenue' => 260000,
            'net_margin' => 40000,
        ]);

        ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => 'PW-002',
            'production_date' => now()->subDays(2)->toDateString(),
            'status' => 'completed',
            'total_input_quantity' => 1000,
            'total_output_quantity' => 870,
            'total_batch_cost' => 235000,
            'estimated_revenue' => 255000,
            'net_margin' => 20000,
        ]);

        ProductionBatch::create([
            'business_id' => $tenant['business']->id,
            'batch_number' => 'PW-003',
            'production_date' => now()->subDay()->toDateString(),
            'status' => 'completed',
            'total_input_quantity' => 1000,
            'total_output_quantity' => 840,
            'total_batch_cost' => 245000,
            'estimated_revenue' => 248000,
            'net_margin' => 3000,
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('production_margin_erosion', $types);
    }

    public function test_ai_engine_flags_pharmacy_expiry_without_recent_demand(): void
    {
        $tenant = $this->createTenantContext('pharmacy', 'pharmacy-imbalance@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Vitamin C Syrup',
            'selling_price' => 2800,
            'cost_price' => 1800,
            'low_stock_alert' => 5,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        ProductBatch::create([
            'business_id' => $tenant['business']->id,
            'product_id' => $product->id,
            'batch_number' => 'VITC-001',
            'manufacture_date' => now()->subMonths(8),
            'expiry_date' => now()->addDays(21),
            'quantity' => 50,
            'remaining_quantity' => 50,
            'cost_per_unit' => 1800,
        ]);

        $types = collect($this->getJson('/api/ai/insights')->assertOk()->json())->pluck('type')->all();

        $this->assertContains('pharmacy_demand_expiry_imbalance', $types);
    }
}
