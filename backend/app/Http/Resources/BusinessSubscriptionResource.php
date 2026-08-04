<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BusinessSubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'status' => $this->status,
            'plan' => $this->whenLoaded('plan', fn () => [
                'id' => $this->plan->id,
                'name' => $this->plan->name,
                'slug' => $this->plan->slug,
            ]),
            'billing_cycle' => $this->billing_cycle,
            'starts_at' => $this->starts_at?->toDateString(),
            'ends_at' => $this->ends_at?->toDateString(),
            'cancelled_at' => $this->cancelled_at?->toDateString(),
            'days_remaining' => method_exists($this->resource, 'daysRemaining') ? $this->daysRemaining() : null,
            'is_auto_renew' => $this->is_auto_renew,
            'amount_paid' => $this->amount_paid,
            'currency' => $this->currency,
            'usage' => $this->whenLoaded('usage', fn () => $this->usage->map(fn ($usage) => [
                'feature_key' => $usage->feature_key,
                'current' => $usage->current_usage,
                'limit' => $usage->limit_value,
                'remaining' => method_exists($usage, 'remaining') ? $usage->remaining() : null,
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
