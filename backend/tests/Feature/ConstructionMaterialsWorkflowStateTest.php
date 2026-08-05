<?php

namespace Tests\Feature;

use App\Models\ConstructionCreditAccount;
use App\Models\ConstructionDelivery;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class ConstructionMaterialsWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_construction_business_can_progress_delivery_and_record_credit_payment(): void
    {
        $tenant = $this->createTenantContext('building_materials', 'construction-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Prime Build Ltd',
            'phone' => '08030000000',
            'credit_limit' => 500000,
            'balance' => 40000,
            'customer_type' => 'wholesaler',
            'is_active' => true,
        ]);

        $delivery = ConstructionDelivery::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'delivery_mode' => 'truck_dispatch',
            'destination_type' => 'site',
            'driver_name' => 'Bala Driver',
            'vehicle_reference' => 'TRK-204',
            'status' => 'in_transit',
            'delivery_address' => 'Plot 9, Ring Road Site',
            'created_by' => $tenant['user']->id,
        ]);

        $account = ConstructionCreditAccount::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'due_date' => now()->addDays(7)->toDateString(),
            'total_amount' => 60000,
            'paid_amount' => 20000,
            'outstanding_amount' => 40000,
            'installment_notes' => 'Weekly project drawdown',
            'debt_age_bucket' => 'current',
            'status' => 'partial',
        ]);

        $this->patchJson("/api/building-materials/deliveries/{$delivery->id}", [
            'status' => 'delivered',
            'confirmed_by' => 'Engr. Musa',
        ])->assertOk()
            ->assertJsonPath('status', 'delivered')
            ->assertJsonPath('confirmed_by', 'Engr. Musa');

        $this->postJson("/api/building-materials/credit-accounts/{$account->id}/payments", [
            'amount' => 15000,
            'payment_method' => 'transfer',
            'notes' => 'Part settlement after site handover',
        ])->assertCreated()
            ->assertJsonPath('amount', '15000.00')
            ->assertJsonPath('payment_method', 'transfer')
            ->assertJsonPath('account.paid_amount', '35000.00')
            ->assertJsonPath('account.outstanding_amount', '25000.00')
            ->assertJsonPath('account.customer.balance', '25000.00');
    }

    public function test_construction_delivery_and_credit_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('building_materials', 'primary-construction@example.com');
        $otherTenant = $this->createTenantContext('building_materials', 'secondary-construction@example.com');

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Prime Build Ltd',
            'balance' => 10000,
            'customer_type' => 'wholesaler',
            'is_active' => true,
        ]);

        $delivery = ConstructionDelivery::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'status' => 'pending_dispatch',
            'created_by' => $tenant['user']->id,
        ]);

        $account = ConstructionCreditAccount::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'customer_id' => $customer->id,
            'due_date' => now()->addDays(5)->toDateString(),
            'total_amount' => 10000,
            'paid_amount' => 0,
            'outstanding_amount' => 10000,
            'debt_age_bucket' => 'current',
            'status' => 'open',
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->patchJson("/api/building-materials/deliveries/{$delivery->id}", [
            'status' => 'cancelled',
        ])->assertForbidden();

        $this->postJson("/api/building-materials/credit-accounts/{$account->id}/payments", [
            'amount' => 2000,
        ])->assertForbidden();
    }
}
