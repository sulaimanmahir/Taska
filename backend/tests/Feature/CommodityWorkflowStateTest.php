<?php

namespace Tests\Feature;

use App\Models\CommodityTradeTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class CommodityWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_commodity_business_can_update_trade_state_and_record_settlement(): void
    {
        $tenant = $this->createTenantContext('commodity_business', 'commodity-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $trade = CommodityTradeTicket::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'ticket_type' => 'sell',
            'ticket_number' => 'CS-00001',
            'commodity_name' => 'Maize',
            'quality_grade' => 'A',
            'bag_count' => 40,
            'weight_kg' => 4000,
            'unit_price' => 520,
            'total_amount' => 2080000,
            'paid_amount' => 500000,
            'shrinkage_loss_kg' => 0,
            'payment_status' => 'partial',
            'status' => 'open',
            'trade_date' => now()->toDateString(),
            'channel' => 'market-floor',
        ]);

        $this->patchJson("/api/commodity/trades/{$trade->id}", [
            'status' => 'closed',
            'notes' => 'Weights confirmed and ticket closed',
        ])->assertOk()
            ->assertJsonPath('data.status', 'closed')
            ->assertJsonPath('data.notes', 'Weights confirmed and ticket closed');

        $this->postJson("/api/commodity/trades/{$trade->id}/settlements", [
            'party_type' => 'customer',
            'amount' => 1580000,
            'payment_method' => 'transfer',
            'settled_on' => now()->toDateString(),
            'reference' => 'NIP-12345',
        ])->assertCreated()
            ->assertJsonPath('data.amount', 1580000)
            ->assertJsonPath('data.payment_method', 'transfer')
            ->assertJsonPath('data.trade_ticket.paid_amount', 2080000)
            ->assertJsonPath('data.trade_ticket.payment_status', 'paid');
    }

    public function test_commodity_trade_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('commodity_business', 'commodity-primary@example.com');
        $otherTenant = $this->createTenantContext('commodity_business', 'commodity-secondary@example.com');

        $trade = CommodityTradeTicket::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'ticket_type' => 'buy',
            'ticket_number' => 'CB-00001',
            'commodity_name' => 'Soya Beans',
            'bag_count' => 20,
            'weight_kg' => 2000,
            'unit_price' => 610,
            'total_amount' => 1220000,
            'paid_amount' => 0,
            'payment_status' => 'unpaid',
            'status' => 'open',
            'trade_date' => now()->toDateString(),
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->patchJson("/api/commodity/trades/{$trade->id}", [
            'status' => 'cancelled',
        ])->assertForbidden();

        $this->postJson("/api/commodity/trades/{$trade->id}/settlements", [
            'party_type' => 'supplier',
            'amount' => 100000,
            'settled_on' => now()->toDateString(),
        ])->assertForbidden();
    }
}
