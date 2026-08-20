<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\DeliveryContact;
use App\Models\DeliveryOrder;
use App\Models\TrustAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

/**
 * Sibling fixes to StockTransferValidationTest: these three write paths
 * clamped an over-limit payment/remittance to a bound with max(...)/min(...)
 * instead of rejecting it, silently losing the excess and misstating the
 * ledger instead of surfacing the data-entry mistake.
 */
class OverpaymentValidationTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_agro_dealer_credit_recovery_rejects_recovering_more_than_the_credit_amount(): void
    {
        $tenant = $this->createTenantContext('agro_dealer', 'overpay-agro@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Farmer Bello',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $this->postJson('/api/agro/recoveries', [
            'customer_id' => $customer->id,
            'credit_amount' => 20000,
            'recovered_amount' => 35000,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['recovered_amount']);

        $this->assertDatabaseCount('agro_farmer_credit_recoveries', 0);
    }

    public function test_agro_dealer_credit_recovery_update_rejects_recovering_more_than_the_credit_amount(): void
    {
        $tenant = $this->createTenantContext('agro_dealer', 'overpay-agro-update@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Farmer Sani',
            'customer_type' => 'individual',
            'is_active' => true,
        ]);

        $recoveryId = $this->postJson('/api/agro/recoveries', [
            'customer_id' => $customer->id,
            'credit_amount' => 20000,
            'recovered_amount' => 5000,
        ])->assertCreated()->json('id');

        $this->patchJson("/api/agro/recoveries/{$recoveryId}", [
            'recovered_amount' => 25000,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['recovered_amount']);

        $this->assertDatabaseHas('agro_farmer_credit_recoveries', [
            'id' => $recoveryId,
            'recovered_amount' => 5000,
        ]);
    }

    public function test_trust_fund_repayment_rejects_repaying_more_than_the_outstanding_balance(): void
    {
        $tenant = $this->createTenantContext('general', 'overpay-trustfund@example.com');
        Sanctum::actingAs($tenant['user']);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Trust Customer',
            'customer_type' => 'individual',
            'credit_limit' => 0,
            'balance' => 0,
            'is_active' => true,
        ]);

        $account = TrustAccount::create([
            'business_id' => $tenant['business']->id,
            'customer_id' => $customer->id,
            'account_type' => 'credit',
            'limit' => 60000,
            'balance' => 10000,
            'total_repaid' => 0,
            'status' => 'active',
        ]);

        $this->postJson("/api/trust-accounts/{$account->id}/repay", [
            'amount' => 25000,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);

        $this->assertDatabaseHas('trust_accounts', [
            'id' => $account->id,
            'balance' => 10000,
            'total_repaid' => 0,
        ]);
        $this->assertDatabaseCount('trust_transactions', 0);
    }

    public function test_delivery_remittance_rejects_amount_greater_than_the_cod_amount(): void
    {
        $tenant = $this->createTenantContext('delivery_company', 'overpay-delivery@example.com');
        Sanctum::actingAs($tenant['user']);

        $sender = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Sender Co',
            'phone' => '08030000001',
            'address' => 'Market Road',
        ]);
        $recipient = DeliveryContact::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Recipient Co',
            'phone' => '08030000002',
            'address' => 'Hospital Road',
        ]);

        $order = DeliveryOrder::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'sender_contact_id' => $sender->id,
            'recipient_contact_id' => $recipient->id,
            'assigned_rider_id' => $tenant['user']->id,
            'tracking_code' => 'TSK-OVERPAY-001',
            'delivery_otp_code' => '123456',
            'status' => 'delivered',
            'parcel_category' => 'documents',
            'pricing_model' => 'flat',
            'base_fee' => 2500,
            'distance_fee' => 0,
            'urgent_fee' => 0,
            'total_fee' => 2500,
            'cod_amount' => 8000,
            'amount_remitted' => 0,
            'is_urgent' => false,
            'pickup_address' => 'Market Road',
            'dropoff_address' => 'Hospital Road',
        ]);

        $this->postJson("/api/deliveries/{$order->id}/remittance", [
            'amount_remitted' => 12000,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['amount_remitted']);

        $this->assertDatabaseHas('delivery_orders', [
            'id' => $order->id,
            'amount_remitted' => 0,
        ]);
    }
}
