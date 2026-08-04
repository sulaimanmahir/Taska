<?php

namespace Tests\Feature;

use App\Models\CommodityLot;
use App\Models\CommodityTradeTicket;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class CommodityOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_commodity_business_can_manage_lots_prices_trades_settlements_and_dashboard(): void
    {
        $tenant = $this->createTenantContext('commodity', 'commodity-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $product = Product::create([
            'business_id' => $tenant['business']->id,
            'name' => 'White Beans',
            'selling_price' => 2200,
            'cost_price' => 1800,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $supplier = Supplier::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Kano Grain Aggregators',
            'phone' => '08031234567',
            'is_active' => true,
        ]);

        $customer = Customer::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'name' => 'Mile 12 Bulk Buyer',
            'phone' => '08039876543',
            'customer_type' => 'wholesaler',
            'credit_limit' => 300000,
            'is_active' => true,
        ]);

        $lotId = $this->postJson('/api/commodity/lots', [
            'warehouse_id' => $tenant['warehouse']->id,
            'product_id' => $product->id,
            'commodity_name' => 'White Beans',
            'commodity_group' => 'Grains',
            'origin_region' => 'Kano',
            'quality_grade' => 'A',
            'moisture_percent' => 11.4,
            'bag_count' => 120,
            'weight_kg' => 6000,
            'cost_per_kg' => 1800,
            'selling_price_per_kg' => 2200,
            'shrinkage_allowance_percent' => 1.5,
        ])->assertCreated()->json('id');

        $this->postJson('/api/commodity/price-board', [
            'product_id' => $product->id,
            'commodity_name' => 'White Beans',
            'market_name' => 'Mile 12',
            'buying_price_per_kg' => 1825,
            'selling_price_per_kg' => 2250,
            'effective_date' => now()->toDateString(),
            'reason' => 'Weekend supply squeeze',
        ])->assertCreated();

        $buyTradeId = $this->postJson('/api/commodity/trades', [
            'supplier_id' => $supplier->id,
            'ticket_type' => 'buy',
            'commodity_name' => 'White Beans',
            'quality_grade' => 'A',
            'bag_count' => 20,
            'weight_kg' => 1000,
            'unit_price' => 1800,
            'paid_amount' => 600000,
            'trade_date' => now()->toDateString(),
            'channel' => 'yard',
            'notes' => 'Advance purchase from supplier',
        ])->assertCreated()
            ->assertJsonPath('ticket_type', 'buy')
            ->json('id');

        $sellTradeId = $this->postJson('/api/commodity/trades', [
            'commodity_lot_id' => $lotId,
            'customer_id' => $customer->id,
            'ticket_type' => 'sell',
            'commodity_name' => 'White Beans',
            'quality_grade' => 'A',
            'bag_count' => 12,
            'weight_kg' => 600,
            'unit_price' => 2250,
            'paid_amount' => 500000,
            'shrinkage_loss_kg' => 8,
            'trade_date' => now()->toDateString(),
            'settlement_due_on' => now()->addDays(3)->toDateString(),
            'channel' => 'bulk_market',
        ])->assertCreated()
            ->assertJsonPath('ticket_type', 'sell')
            ->json('id');

        $this->postJson("/api/commodity/trades/{$sellTradeId}/settlements", [
            'party_type' => 'customer',
            'amount' => 850000,
            'payment_method' => 'transfer',
            'settled_on' => now()->toDateString(),
            'reference' => 'TRF-00045',
        ])->assertCreated();

        $this->patchJson("/api/commodity/trades/{$buyTradeId}", [
            'status' => 'closed',
            'payment_status' => 'partial',
            'paid_amount' => 600000,
            'notes' => 'Balance pending after weighing confirmation',
        ])->assertOk();

        $this->getJson('/api/commodity/overview')
            ->assertOk()
            ->assertJsonPath('summary.lots_open', 1)
            ->assertJsonPath('summary.price_updates_today', 1)
            ->assertJsonPath('summary.buy_volume_today', 1000)
            ->assertJsonPath('summary.sell_volume_today', 600);

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('business_type', 'commodity')
            ->assertJsonPath('commodity.lots_open', 1)
            ->assertJsonPath('commodity.price_updates_today', 1);
    }

    public function test_commodity_endpoints_reject_foreign_tenant_relations_and_trades(): void
    {
        $tenant = $this->createTenantContext('commodity', 'commodity-scope@example.com');
        $otherTenant = $this->createTenantContext('commodity', 'commodity-other@example.com');

        $foreignProduct = Product::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Sesame',
            'selling_price' => 3100,
            'cost_price' => 2500,
            'track_inventory' => 'yes',
            'is_active' => true,
        ]);

        $foreignSupplier = Supplier::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Supplier',
            'phone' => '08030001112',
            'is_active' => true,
        ]);

        $foreignCustomer = Customer::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Foreign Buyer',
            'phone' => '08030001113',
            'customer_type' => 'wholesaler',
            'is_active' => true,
        ]);

        $foreignLot = CommodityLot::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'warehouse_id' => $otherTenant['warehouse']->id,
            'product_id' => $foreignProduct->id,
            'commodity_name' => 'Foreign Sesame',
            'weight_kg' => 1200,
            'cost_per_kg' => 2500,
            'selling_price_per_kg' => 3100,
            'status' => 'open',
        ]);

        $foreignTrade = CommodityTradeTicket::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'commodity_lot_id' => $foreignLot->id,
            'customer_id' => $foreignCustomer->id,
            'supplier_id' => null,
            'ticket_type' => 'sell',
            'ticket_number' => 'CS-FOREIGN-001',
            'commodity_name' => 'Foreign Sesame',
            'weight_kg' => 100,
            'unit_price' => 3200,
            'total_amount' => 320000,
            'paid_amount' => 0,
            'payment_status' => 'unpaid',
            'status' => 'open',
            'trade_date' => now()->toDateString(),
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/commodity/lots', [
            'warehouse_id' => $otherTenant['warehouse']->id,
            'product_id' => $foreignProduct->id,
            'commodity_name' => 'Invalid Lot',
            'weight_kg' => 500,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['warehouse_id', 'product_id']);

        $this->postJson('/api/commodity/price-board', [
            'product_id' => $foreignProduct->id,
            'commodity_name' => 'Invalid Price',
            'effective_date' => now()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['product_id']);

        $this->postJson('/api/commodity/trades', [
            'commodity_lot_id' => $foreignLot->id,
            'customer_id' => $foreignCustomer->id,
            'supplier_id' => $foreignSupplier->id,
            'ticket_type' => 'sell',
            'commodity_name' => 'Invalid Trade',
            'weight_kg' => 50,
            'unit_price' => 3000,
            'trade_date' => now()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['commodity_lot_id', 'customer_id', 'supplier_id']);

        $this->patchJson("/api/commodity/trades/{$foreignTrade->id}", [
            'status' => 'closed',
        ])->assertStatus(403);

        $this->postJson("/api/commodity/trades/{$foreignTrade->id}/settlements", [
            'party_type' => 'customer',
            'amount' => 50000,
            'settled_on' => now()->toDateString(),
        ])->assertStatus(403);
    }
}
