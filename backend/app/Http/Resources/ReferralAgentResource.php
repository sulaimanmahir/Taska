<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReferralAgentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'referral_code' => $this->referral_code,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'status' => $this->status,
            'tier' => $this->tier,
            'agent_type' => $this->agent_type,
            'commission_rate' => $this->commission_rate,
            'recurring_rate' => $this->recurring_rate,
            'bank_name' => $this->bank_name,
            'account_number' => $this->account_number ? '****' . substr($this->account_number, -4) : null,
            'account_name' => $this->account_name,
            'bank_code' => $this->bank_code,
            'payment_method' => $this->payment_method,
            'total_earnings' => $this->total_earnings,
            'pending_payout' => $this->pending_payout,
            'total_paid' => $this->total_paid,
            'notes' => $this->notes,
            'onboarded_at' => $this->onboarded_at?->toJSON(),
            'approved_at' => $this->approved_at?->toJSON(),
            'stats' => $this->when(isset($this->stats), $this->stats),
            'documents' => $this->whenLoaded('documents', fn () => $this->documents->map(fn ($document) => [
                'id' => $document->id,
                'type' => $document->type,
                'is_verified' => $document->is_verified,
                'verified_at' => $document->verified_at?->toJSON(),
            ])->values()),
            'onboarding' => $this->whenLoaded('onboardingSteps', fn () => $this->onboardingSteps->map(fn ($step) => [
                'id' => $step->id,
                'step' => $step->step,
                'name' => $step->step_name,
                'is_completed' => $step->is_completed,
                'completed_at' => $step->completed_at?->toJSON(),
            ])->values()),
            'commissions' => $this->whenLoaded('commissions', fn () => $this->commissions->map(fn ($commission) => [
                'id' => $commission->id,
                'type' => $commission->type,
                'status' => $commission->status,
                'amount' => $commission->amount,
                'currency' => $commission->currency,
                'created_at' => $commission->created_at?->toJSON(),
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
