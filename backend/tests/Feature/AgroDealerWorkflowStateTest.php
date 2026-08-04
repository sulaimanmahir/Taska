<?php

namespace Tests\Feature;

use App\Models\AgroFarmerCreditRecovery;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class AgroDealerWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_agro_business_can_record_subsidy_sales_and_update_recoveries(): void
    {
        $tenant = $this->createTenantContext('agro_dealer', 'agro-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Mallam Adamu',
            'phone' => '08068888888',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Improved Maize Seed',
            'sku' => 'SEED-MZ-01',
            'product_type' => 'good',
            'cost_price' => 8000,
            'selling_price' => 10000,
            'track_inventory' => true,
            'is_active' => true,
        ]);

        $recovery = AgroFarmerCreditRecovery::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'recovery_reference' => 'AGR-REC-001',
            'region_name' => 'Katsina South',
            'credit_amount' => 50000,
            'recovered_amount' => 10000,
            'outstanding_amount' => 40000,
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'open',
        ]);

        $this->postJson('/api/agro/subsidy-sales', [
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'product_id' => $product->id,
            'programme_name' => 'State Input Support',
            'agency_name' => 'ADP',
            'region_name' => 'Katsina South',
            'season_name' => 'Wet Season',
            'input_category' => 'seed',
            'quantity' => 12,
            'unit_price' => 10000,
            'amount_received' => 30000,
            'sale_date' => now()->toDateString(),
        ])->assertCreated()
            ->assertJsonPath('data.amount_due', '120000.00')
            ->assertJsonPath('data.amount_received', '30000.00')
            ->assertJsonPath('data.status', 'pending');

        $this->patchJson("/api/agro/recoveries/{$recovery->id}", [
            'recovered_amount' => 50000,
            'last_contacted_at' => now()->toDateString(),
            'notes' => 'Recovered after cooperative payout',
        ])->assertOk()
            ->assertJsonPath('data.recovered_amount', '50000.00')
            ->assertJsonPath('data.outstanding_amount', '0.00')
            ->assertJsonPath('data.status', 'recovered')
            ->assertJsonPath('data.customer.name', 'Mallam Adamu');
    }

    public function test_agro_recovery_updates_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('agro_dealer', 'agro-primary@example.com');
        $otherTenant = $this->createTenantContext('agro_dealer', 'agro-secondary@example.com');

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Bello Farmer',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $recovery = AgroFarmerCreditRecovery::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'recovery_reference' => 'AGR-REC-002',
            'credit_amount' => 25000,
            'recovered_amount' => 0,
            'outstanding_amount' => 25000,
            'status' => 'open',
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->patchJson("/api/agro/recoveries/{$recovery->id}", [
            'recovered_amount' => 5000,
        ])->assertForbidden();
    }
}
