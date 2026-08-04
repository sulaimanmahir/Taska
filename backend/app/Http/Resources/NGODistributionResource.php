<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NGODistributionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'partner_request_id' => $this->partner_request_id,
            'donor_source_id' => $this->donor_source_id,
            'distribution_reference' => $this->distribution_reference,
            'beneficiary_name' => $this->beneficiary_name,
            'destination_location' => $this->destination_location,
            'status' => $this->status,
            'distributed_on' => $this->distributed_on?->toDateString(),
            'created_by' => $this->created_by,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'product' => $item->relationLoaded('product') ? [
                    'id' => $item->product?->id,
                    'name' => $item->product?->name,
                    'sku' => $item->product?->sku,
                ] : null,
            ])->values()),
            'signatures' => $this->whenLoaded('signatures', fn () => $this->signatures->map(fn ($signature) => [
                'id' => $signature->id,
                'beneficiary_name' => $signature->beneficiary_name,
                'signed_by' => $signature->signed_by,
                'signature_reference' => $signature->signature_reference,
                'signed_at' => $signature->signed_at?->toJSON(),
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
