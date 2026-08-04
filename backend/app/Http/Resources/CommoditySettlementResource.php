<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommoditySettlementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'commodity_trade_ticket_id' => $this->commodity_trade_ticket_id,
            'party_type' => $this->party_type,
            'amount' => $this->amount,
            'payment_method' => $this->payment_method,
            'settled_on' => $this->settled_on?->toDateString(),
            'reference' => $this->reference,
            'notes' => $this->notes,
            'trade_ticket' => $this->whenLoaded('tradeTicket', fn () => [
                'id' => $this->tradeTicket?->id,
                'ticket_number' => $this->tradeTicket?->ticket_number,
                'ticket_type' => $this->tradeTicket?->ticket_type,
                'commodity_name' => $this->tradeTicket?->commodity_name,
                'total_amount' => $this->tradeTicket?->total_amount,
                'paid_amount' => $this->tradeTicket?->paid_amount,
                'payment_status' => $this->tradeTicket?->payment_status,
                'status' => $this->tradeTicket?->status,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
