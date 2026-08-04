<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CooperativeFinancingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cooperative_id' => $this->cooperative_id,
            'business_id' => $this->business_id,
            'member_id' => $this->member_id,
            'override_by_user_id' => $this->override_by_user_id,
            'financing_type' => $this->financing_type,
            'status' => $this->status,
            'amount_requested' => $this->amount_requested,
            'amount_disbursed' => $this->amount_disbursed,
            'capital_amount' => $this->capital_amount,
            'cooperative_capital' => $this->cooperative_capital,
            'member_capital' => $this->member_capital,
            'profit_share_cooperative' => $this->profit_share_cooperative,
            'profit_share_member' => $this->profit_share_member,
            'profit_share_ratio' => $this->profit_share_ratio,
            'business_description' => $this->business_description,
            'duration_months' => $this->duration_months,
            'repayment_due_date' => $this->repayment_due_date?->toDateString(),
            'late_penalty_amount' => $this->late_penalty_amount,
            'late_penalty_destination' => $this->late_penalty_destination,
            'admin_override_reason' => $this->admin_override_reason,
            'submitted_at' => $this->submitted_at?->toJSON(),
            'approved_at' => $this->approved_at?->toJSON(),
            'disbursed_at' => $this->disbursed_at?->toJSON(),
            'closed_at' => $this->closed_at?->toJSON(),
            'guarantee_snapshot' => $this->guarantee_snapshot,
            'metadata' => $this->metadata,
            'member' => $this->whenLoaded('member', fn () => [
                'id' => $this->member?->id,
                'member_number' => $this->member?->member_number,
                'role' => $this->member?->role,
                'status' => $this->member?->status,
                'shares_locked' => $this->member?->shares_locked,
                'customer' => $this->member?->relationLoaded('customer') ? [
                    'id' => $this->member?->customer?->id,
                    'name' => $this->member?->customer?->name,
                    'phone' => $this->member?->customer?->phone,
                ] : null,
            ]),
            'guarantors' => $this->whenLoaded('guarantors', fn () => $this->guarantors->map(fn ($guarantor) => [
                'id' => $guarantor->id,
                'guarantor_member_id' => $guarantor->guarantor_member_id,
                'status' => $guarantor->status,
                'shares_committed' => $guarantor->shares_committed,
                'liability_share_percent' => $guarantor->liability_share_percent,
                'approved_at' => $guarantor->approved_at?->toJSON(),
                'member' => $guarantor->relationLoaded('member') ? [
                    'id' => $guarantor->member?->id,
                    'member_number' => $guarantor->member?->member_number,
                    'customer' => $guarantor->member?->relationLoaded('customer') ? [
                        'id' => $guarantor->member?->customer?->id,
                        'name' => $guarantor->member?->customer?->name,
                    ] : null,
                ] : null,
            ])->values()),
            'reports' => $this->whenLoaded('reports', fn () => $this->reports->map(fn ($report) => [
                'id' => $report->id,
                'reporting_period_start' => $report->reporting_period_start?->toDateString(),
                'reporting_period_end' => $report->reporting_period_end?->toDateString(),
                'revenue' => $report->revenue,
                'direct_cost' => $report->direct_cost,
                'net_profit' => $report->net_profit,
                'cooperative_share_amount' => $report->cooperative_share_amount,
                'member_share_amount' => $report->member_share_amount,
                'status' => $report->status,
                'report_notes' => $report->report_notes,
                'submitted_at' => $report->submitted_at?->toJSON(),
            ])->values()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
