<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommodityTradeTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'commodity_lot_id' => $this->commodity_lot_id,
            'customer_id' => $this->customer_id,
            'supplier_id' => $this->supplier_id,
            'ticket_type' => $this->ticket_type,
            'ticket_number' => $this->ticket_number,
            'commodity_name' => $this->commodity_name,
            'quality_grade' => $this->quality_grade,
            'bag_count' => $this->bag_count,
            'weight_kg' => $this->weight_kg,
            'unit_price' => $this->unit_price,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'shrinkage_loss_kg' => $this->shrinkage_loss_kg,
            'payment_status' => $this->payment_status,
            'status' => $this->status,
            'trade_date' => $this->trade_date?->toDateString(),
            'settlement_due_on' => $this->settlement_due_on?->toDateString(),
            'channel' => $this->channel,
            'notes' => $this->notes,
            'lot' => $this->whenLoaded('lot', fn () => [
                'id' => $this->lot?->id,
                'commodity_name' => $this->lot?->commodity_name,
                'weight_kg' => $this->lot?->weight_kg,
                'bag_count' => $this->lot?->bag_count,
                'status' => $this->lot?->status,
            ]),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'balance' => $this->customer?->balance,
            ]),
            'supplier' => $this->whenLoaded('supplier', fn () => [
                'id' => $this->supplier?->id,
                'name' => $this->supplier?->name,
                'balance' => $this->supplier?->balance,
            ]),
            'settlements' => $this->whenLoaded('settlements', fn () => $this->settlements->map(fn ($settlement) => [
                'id' => $settlement->id,
                'party_type' => $settlement->party_type,
                'amount' => $settlement->amount,
                'payment_method' => $settlement->payment_method,
                'settled_on' => $settlement->settled_on?->toDateString(),
                'reference' => $settlement->reference,
                'notes' => $settlement->notes,
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
