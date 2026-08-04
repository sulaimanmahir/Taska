<?php

namespace App\Services;

use App\Models\CommodityLot;
use App\Models\CommodityPriceBoard;
use App\Models\CommoditySettlement;
use App\Models\CommodityTradeTicket;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class CommodityService
{
    public function overview(int $businessId): array
    {
        $today = today()->toDateString();

        $summary = [
            'lots_open' => CommodityLot::where('business_id', $businessId)->where('status', 'open')->count(),
            'stock_weight_kg' => (float) CommodityLot::where('business_id', $businessId)->where('status', 'open')->sum('weight_kg'),
            'buy_volume_today' => (float) CommodityTradeTicket::where('business_id', $businessId)->where('ticket_type', 'buy')->whereDate('trade_date', $today)->sum('weight_kg'),
            'sell_volume_today' => (float) CommodityTradeTicket::where('business_id', $businessId)->where('ticket_type', 'sell')->whereDate('trade_date', $today)->sum('weight_kg'),
            'revenue_today' => (float) CommodityTradeTicket::where('business_id', $businessId)->where('ticket_type', 'sell')->whereDate('trade_date', $today)->sum('total_amount'),
            'supplier_payables' => (float) CommodityTradeTicket::where('business_id', $businessId)->where('ticket_type', 'buy')->sum(DB::raw('total_amount - paid_amount')),
            'customer_receivables' => (float) CommodityTradeTicket::where('business_id', $businessId)->where('ticket_type', 'sell')->sum(DB::raw('total_amount - paid_amount')),
            'shrinkage_today_kg' => (float) CommodityTradeTicket::where('business_id', $businessId)->whereDate('trade_date', $today)->sum('shrinkage_loss_kg'),
            'price_updates_today' => CommodityPriceBoard::where('business_id', $businessId)->whereDate('effective_date', $today)->count(),
            'volatile_lots' => CommodityLot::where('business_id', $businessId)->where('moisture_percent', '>', 12)->count(),
            'gross_margin_today' => (float) CommodityTradeTicket::where('business_id', $businessId)
                ->where('ticket_type', 'sell')
                ->whereDate('trade_date', $today)
                ->get()
                ->sum(fn (CommodityTradeTicket $trade) => $trade->total_amount - (($trade->lot?->cost_per_kg ?? 0) * $trade->weight_kg)),
        ];

        return [
            'summary' => $summary,
            'lots' => CommodityLot::with(['warehouse', 'product'])->where('business_id', $businessId)->latest()->get(),
            'price_board' => CommodityPriceBoard::with('product')->where('business_id', $businessId)->latest('effective_date')->get(),
            'trades' => CommodityTradeTicket::with(['lot', 'customer', 'supplier', 'settlements'])->where('business_id', $businessId)->latest('trade_date')->latest()->get(),
            'settlements' => CommoditySettlement::with('tradeTicket')->where('business_id', $businessId)->latest('settled_on')->get(),
            'products' => Product::where('business_id', $businessId)->where('is_active', true)->get(),
            'suppliers' => Supplier::where('business_id', $businessId)->get(),
            'customers' => \App\Models\Customer::where('business_id', $businessId)->get(),
            'warehouses' => Warehouse::where('business_id', $businessId)->where('is_active', true)->get(),
        ];
    }

    public function storeLot(array $payload, int $businessId, ?int $branchId): CommodityLot
    {
        return CommodityLot::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'warehouse_id' => $payload['warehouse_id'] ?? null,
            'product_id' => $payload['product_id'] ?? null,
            'commodity_name' => $payload['commodity_name'],
            'commodity_group' => $payload['commodity_group'] ?? null,
            'origin_region' => $payload['origin_region'] ?? null,
            'quality_grade' => $payload['quality_grade'] ?? null,
            'moisture_percent' => $payload['moisture_percent'] ?? 0,
            'bag_count' => $payload['bag_count'] ?? 0,
            'weight_kg' => $payload['weight_kg'] ?? 0,
            'cost_per_kg' => $payload['cost_per_kg'] ?? 0,
            'selling_price_per_kg' => $payload['selling_price_per_kg'] ?? 0,
            'shrinkage_allowance_percent' => $payload['shrinkage_allowance_percent'] ?? 0,
            'status' => $payload['status'] ?? 'open',
            'notes' => $payload['notes'] ?? null,
        ]);
    }

    public function storePriceBoard(array $payload, int $businessId, ?int $branchId): CommodityPriceBoard
    {
        return CommodityPriceBoard::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'product_id' => $payload['product_id'] ?? null,
            'commodity_name' => $payload['commodity_name'],
            'market_name' => $payload['market_name'] ?? null,
            'buying_price_per_kg' => $payload['buying_price_per_kg'] ?? 0,
            'selling_price_per_kg' => $payload['selling_price_per_kg'] ?? 0,
            'effective_date' => $payload['effective_date'],
            'reason' => $payload['reason'] ?? null,
        ]);
    }

    public function storeTrade(array $payload, int $businessId, ?int $branchId): CommodityTradeTicket
    {
        return DB::transaction(function () use ($payload, $businessId, $branchId) {
            $lot = ! empty($payload['commodity_lot_id'])
                ? $this->resolveLot($businessId, $payload['commodity_lot_id'])
                : null;

            $ticket = CommodityTradeTicket::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'commodity_lot_id' => $lot?->id,
                'customer_id' => $payload['customer_id'] ?? null,
                'supplier_id' => $payload['supplier_id'] ?? null,
                'ticket_type' => $payload['ticket_type'],
                'ticket_number' => $this->nextTicketNumber($payload['ticket_type']),
                'commodity_name' => $payload['commodity_name'],
                'quality_grade' => $payload['quality_grade'] ?? null,
                'bag_count' => $payload['bag_count'] ?? 0,
                'weight_kg' => $payload['weight_kg'],
                'unit_price' => $payload['unit_price'],
                'total_amount' => $payload['total_amount'] ?? ($payload['weight_kg'] * $payload['unit_price']),
                'paid_amount' => $payload['paid_amount'] ?? 0,
                'shrinkage_loss_kg' => $payload['shrinkage_loss_kg'] ?? 0,
                'payment_status' => ($payload['paid_amount'] ?? 0) >= ($payload['total_amount'] ?? ($payload['weight_kg'] * $payload['unit_price']))
                    ? 'paid'
                    : (($payload['paid_amount'] ?? 0) > 0 ? 'partial' : 'unpaid'),
                'status' => $payload['status'] ?? 'open',
                'trade_date' => $payload['trade_date'],
                'settlement_due_on' => $payload['settlement_due_on'] ?? null,
                'channel' => $payload['channel'] ?? null,
                'notes' => $payload['notes'] ?? null,
            ]);

            if ($lot && $payload['ticket_type'] === 'sell') {
                $lot->decrement('weight_kg', $payload['weight_kg']);
                $lot->decrement('bag_count', $payload['bag_count'] ?? 0);

                if ($lot->fresh()->weight_kg <= 0) {
                    $lot->update(['status' => 'closed']);
                }
            }

            return $ticket->load(['lot', 'customer', 'supplier', 'settlements']);
        });
    }

    public function updateTradeStatus(CommodityTradeTicket $trade, array $payload): CommodityTradeTicket
    {
        $trade->update([
            'status' => $payload['status'] ?? $trade->status,
            'paid_amount' => $payload['paid_amount'] ?? $trade->paid_amount,
            'payment_status' => $payload['payment_status'] ?? $trade->payment_status,
            'notes' => $payload['notes'] ?? $trade->notes,
        ]);

        return $trade->fresh(['lot', 'customer', 'supplier', 'settlements']);
    }

    public function storeSettlement(CommodityTradeTicket $trade, array $payload, int $businessId, ?int $branchId): CommoditySettlement
    {
        return DB::transaction(function () use ($trade, $payload, $businessId, $branchId) {
            $settlement = CommoditySettlement::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'commodity_trade_ticket_id' => $trade->id,
                'party_type' => $payload['party_type'],
                'amount' => $payload['amount'],
                'payment_method' => $payload['payment_method'] ?? 'cash',
                'settled_on' => $payload['settled_on'],
                'reference' => $payload['reference'] ?? null,
                'notes' => $payload['notes'] ?? null,
            ]);

            $trade->paid_amount = (float) $trade->paid_amount + (float) $payload['amount'];
            $trade->payment_status = $trade->paid_amount >= $trade->total_amount
                ? 'paid'
                : ($trade->paid_amount > 0 ? 'partial' : 'unpaid');
            $trade->save();

            return $settlement->fresh('tradeTicket');
        });
    }

    private function nextTicketNumber(string $type): string
    {
        $prefix = strtoupper($type === 'buy' ? 'CB' : 'CS');
        $count = CommodityTradeTicket::count() + 1;

        return sprintf('%s-%05d', $prefix, $count);
    }

    private function resolveLot(int $businessId, int $lotId): CommodityLot
    {
        return CommodityLot::where('business_id', $businessId)->findOrFail($lotId);
    }
}
