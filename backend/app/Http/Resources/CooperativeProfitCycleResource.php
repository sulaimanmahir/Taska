<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CooperativeProfitCycleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cooperative_id' => $this->cooperative_id,
            'business_id' => $this->business_id,
            'label' => $this->label,
            'cycle_start' => $this->cycle_start?->toDateString(),
            'cycle_end' => $this->cycle_end?->toDateString(),
            'total_profit' => $this->total_profit,
            'distributable_profit' => $this->distributable_profit,
            'reserve_allocation' => $this->reserve_allocation,
            'charity_allocation' => $this->charity_allocation,
            'status' => $this->status,
            'distributed_at' => $this->distributed_at?->toJSON(),
            'distribution_snapshot' => $this->distribution_snapshot,
            'notes' => $this->notes,
            'distributions' => $this->whenLoaded('distributions', fn () => $this->distributions->map(fn ($distribution) => [
                'id' => $distribution->id,
                'member_id' => $distribution->member_id,
                'shares_at_record' => $distribution->shares_at_record,
                'ownership_percent' => $distribution->ownership_percent,
                'amount' => $distribution->amount,
                'status' => $distribution->status,
                'withdrawn_at' => $distribution->withdrawn_at?->toJSON(),
                'member' => $distribution->relationLoaded('member') ? [
                    'id' => $distribution->member?->id,
                    'member_number' => $distribution->member?->member_number,
                    'customer' => $distribution->member?->relationLoaded('customer') ? [
                        'id' => $distribution->member?->customer?->id,
                        'name' => $distribution->member?->customer?->name,
                    ] : null,
                ] : null,
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
