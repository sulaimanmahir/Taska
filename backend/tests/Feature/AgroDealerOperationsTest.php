<?php

namespace Tests\Feature;

use App\Models\AgroFarmerCreditRecovery;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class AgroDealerOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_agro_dealer_can_track_forecasts_subsidy_sales_recoveries_and_advisories(): void
    {
        $tenant = $this->createTenantContext('agro_dealer', 'agro-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Farmer Musa',
            'phone' => '08020001111',
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'NPK Fertilizer',
            'selling_price' => 18500,
            'cost_price' => 14000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $this->postJson('/api/agro/forecasts', [
            'branch_id' => $tenant['branch']->id,
            'product_id' => $product->id,
            'season_name' => 'Wet Season 2026',
            'region_name' => 'Kaduna North',
            'forecast_quantity' => 450,
            'reserved_quantity' => 120,
            'confidence_score' => 82,
        ])->assertCreated();

        $recoveryId = $this->postJson('/api/agro/recoveries', [
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'region_name' => 'Kaduna North',
            'credit_amount' => 600000,
            'recovered_amount' => 200000,
            'due_date' => now()->addDays(21)->toDateString(),
        ])->assertCreated()
            ->assertJsonPath('outstanding_amount', '400000.00')
            ->json('id');

        $this->postJson('/api/agro/subsidy-sales', [
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'programme_name' => 'State Input Support',
            'agency_name' => 'Kaduna ADP',
            'region_name' => 'Kaduna North',
            'season_name' => 'Wet Season 2026',
            'input_category' => 'fertilizer',
            'quantity' => 30,
            'unit_price' => 18500,
            'amount_received' => 250000,
            'sale_date' => now()->toDateString(),
        ])->assertCreated()
            ->assertJsonPath('amount_due', '555000.00')
            ->assertJsonPath('status', 'pending');

        $this->postJson('/api/agro/advisories', [
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'region_name' => 'Kaduna North',
            'advisory_type' => 'fertilizer_application',
            'crop_or_input' => 'Maize',
            'recommendation' => 'Apply first dose within 10 days after germination and avoid heavy rain window.',
            'advised_on' => now()->toDateString(),
        ])->assertCreated();

        $this->patchJson("/api/agro/recoveries/{$recoveryId}", [
            'recovered_amount' => 600000,
        ])->assertOk()
            ->assertJsonPath('status', 'recovered')
            ->assertJsonPath('outstanding_amount', '0.00');

        $this->getJson('/api/agro/overview')
            ->assertOk()
            ->assertJsonPath('summary.forecast_quantity', 450)
            ->assertJsonPath('summary.programme_sales_total', 555000)
            ->assertJsonPath('summary.subsidy_receivable', 305000)
            ->assertJsonPath('summary.outstanding_credit', 0)
            ->assertJsonPath('summary.advisories_pending', 1);
    }

    public function test_agro_dealer_endpoints_reject_foreign_tenant_relations(): void
    {
        $tenant = $this->createTenantContext('agro_dealer', 'agro-scope@example.com');
        $otherTenant = $this->createTenantContext('agro_dealer', 'agro-other@example.com');

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Farmer',
            'phone' => '08030001121',
        ]);

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Urea',
            'selling_price' => 20000,
            'cost_price' => 15000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $foreignRecovery = AgroFarmerCreditRecovery::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'recovery_reference' => 'AGR-REC-FOREIGN-001',
            'credit_amount' => 300000,
            'recovered_amount' => 50000,
            'outstanding_amount' => 250000,
            'status' => 'open',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/agro/forecasts', [
            'branch_id' => $otherTenant['branch']->id,
            'product_id' => $foreignProduct->id,
            'season_name' => 'Invalid Forecast',
            'region_name' => 'Foreign Region',
            'forecast_quantity' => 100,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'product_id']);

        $this->postJson('/api/agro/subsidy-sales', [
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'product_id' => $foreignProduct->id,
            'programme_name' => 'Invalid Subsidy',
            'quantity' => 10,
            'unit_price' => 20000,
            'sale_date' => now()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'customer_id', 'product_id']);

        $this->postJson('/api/agro/recoveries', [
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'credit_amount' => 400000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'customer_id']);

        $this->postJson('/api/agro/advisories', [
            'branch_id' => $otherTenant['branch']->id,
            'customer_id' => $foreignCustomer->id,
            'advisory_type' => 'planting_support',
            'recommendation' => 'Invalid advisory',
            'advised_on' => now()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'customer_id']);

        $this->postJson('/api/agro/trends', [
            'branch_id' => $otherTenant['branch']->id,
            'region_name' => 'Foreign Region',
            'sales_amount' => 100000,
            'quantity_sold' => 10,
            'trend_date' => now()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);

        $this->patchJson("/api/agro/recoveries/{$foreignRecovery->id}", [
            'recovered_amount' => 300000,
        ])->assertStatus(403);
    }
}
