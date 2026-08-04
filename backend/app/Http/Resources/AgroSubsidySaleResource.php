<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgroSubsidySaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'customer_id' => $this->customer_id,
            'product_id' => $this->product_id,
            'programme_name' => $this->programme_name,
            'agency_name' => $this->agency_name,
            'region_name' => $this->region_name,
            'season_name' => $this->season_name,
            'input_category' => $this->input_category,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'subsidy_amount' => $this->subsidy_amount,
            'amount_due' => $this->amount_due,
            'amount_received' => $this->amount_received,
            'sale_date' => $this->sale_date?->toDateString(),
            'status' => $this->status,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
                'phone' => $this->customer?->phone,
            ]),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->id,
                'name' => $this->product?->name,
                'sku' => $this->product?->sku,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
