<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LivestockMarketTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'transaction_number' => $this->transaction_number,
            'transaction_type' => $this->transaction_type,
            'animal_type' => $this->animal_type,
            'head_count' => $this->head_count,
            'total_weight_kg' => $this->total_weight_kg,
            'unit_price_per_kg' => $this->unit_price_per_kg,
            'total_amount' => $this->total_amount,
            'counterparty_name' => $this->counterparty_name,
            'counterparty_phone' => $this->counterparty_phone,
            'market_date' => $this->market_date?->toDateString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
