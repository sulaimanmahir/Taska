<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentMethodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'type' => $this->type,
            'provider' => $this->provider,
            'last_four' => $this->last_four,
            'brand' => $this->brand,
            'is_default' => $this->is_default,
            'is_verified' => $this->is_verified,
            'expiry_month' => $this->expiry_month,
            'expiry_year' => $this->expiry_year,
            'bank_name' => $this->bank_name,
            'account_number' => $this->account_number ? '****' . substr($this->account_number, -4) : null,
            'account_name' => $this->account_name,
            'bank_code' => $this->bank_code,
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
