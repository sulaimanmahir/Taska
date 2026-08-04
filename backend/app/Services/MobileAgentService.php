<?php

namespace App\Services;

use App\Models\MobileAgentCommissionTier;
use App\Models\MobileAgentFloatRequest;
use App\Models\MobileAgentFraudAlert;
use App\Models\MobileAgentReversalLog;
use App\Models\MobileAgentShortageLog;
use App\Models\MobileAgentTransaction;
use Illuminate\Support\Facades\DB;

class MobileAgentService
{
    public function createCommissionTier(array $payload, int $businessId): MobileAgentCommissionTier
    {
        return MobileAgentCommissionTier::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createFloatRequest(array $payload, int $businessId): MobileAgentFloatRequest
    {
        return MobileAgentFloatRequest::create([
            ...$payload,
            'business_id' => $businessId,
            'requested_at' => $payload['requested_at'] ?? now(),
            'status' => $payload['status'] ?? 'pending',
        ]);
    }

    public function approveFloatRequest(MobileAgentFloatRequest $floatRequest, array $payload = []): MobileAgentFloatRequest
    {
        $floatRequest->update([
            'approved_amount' => $payload['approved_amount'] ?? $floatRequest->requested_amount,
            'approved_at' => now(),
            'status' => 'approved',
        ]);

        return $floatRequest->fresh();
    }

    public function createTransaction(array $payload, int $businessId): MobileAgentTransaction
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $processedAt = $payload['processed_at'] ?? now();
            $tier = null;

            if (!empty($payload['commission_tier_id'])) {
                $tier = MobileAgentCommissionTier::where('business_id', $businessId)->findOrFail($payload['commission_tier_id']);
            } else {
                $tier = MobileAgentCommissionTier::query()
                    ->where('business_id', $businessId)
                    ->where('service_type', $payload['service_type'])
                    ->where('is_active', true)
                    ->where('minimum_volume', '<=', $payload['transaction_amount'])
                    ->where(function ($query) use ($payload) {
                        $query->whereNull('maximum_volume')
                            ->orWhere('maximum_volume', '>=', $payload['transaction_amount']);
                    })
                    ->orderByDesc('minimum_volume')
                    ->first();
            }

            $lastBalance = MobileAgentTransaction::query()
                ->where('business_id', $businessId)
                ->where('agent_name', $payload['agent_name'])
                ->latest('processed_at')
                ->value('closing_float_balance') ?? 0;

            $commissionAmount = $payload['commission_amount']
                ?? (((float) $payload['transaction_amount'] * (float) ($tier?->commission_rate ?? 0)) / 100) + (float) ($tier?->flat_bonus ?? 0);

            $floatDelta = (float) ($payload['float_delta'] ?? 0);
            $closingFloatBalance = (float) $lastBalance + $floatDelta;

            $transaction = MobileAgentTransaction::create([
                ...$payload,
                'business_id' => $businessId,
                'commission_tier_id' => $tier?->id,
                'transaction_reference' => $payload['transaction_reference'] ?? $this->generateTransactionReference($businessId),
                'commission_amount' => $commissionAmount,
                'closing_float_balance' => $closingFloatBalance,
                'status' => $payload['status'] ?? 'completed',
                'processed_at' => $processedAt,
            ]);

            if ($closingFloatBalance < 0 || (float) $payload['transaction_amount'] >= 100000 || !empty($payload['flag_fraud'])) {
                MobileAgentFraudAlert::create([
                    'business_id' => $businessId,
                    'mobile_agent_transaction_id' => $transaction->id,
                    'staff_id' => $payload['staff_id'] ?? null,
                    'agent_name' => $payload['agent_name'],
                    'alert_type' => $closingFloatBalance < 0 ? 'negative_float' : 'high_value_transaction',
                    'severity' => $closingFloatBalance < 0 ? 'high' : 'medium',
                    'details' => $closingFloatBalance < 0
                        ? 'Transaction pushed float balance below zero.'
                        : 'Transaction crossed the high-value review threshold.',
                    'flagged_at' => $processedAt,
                ]);
            }

            return $transaction->load('commissionTier');
        });
    }

    public function createReversal(array $payload, int $businessId): MobileAgentReversalLog
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $transaction = MobileAgentTransaction::where('business_id', $businessId)->findOrFail($payload['mobile_agent_transaction_id']);

            $transaction->update([
                'is_reversal_requested' => true,
                'status' => 'reversal_pending',
            ]);

            $reversal = MobileAgentReversalLog::create([
                ...$payload,
                'business_id' => $businessId,
                'requested_at' => $payload['requested_at'] ?? now(),
                'status' => $payload['status'] ?? 'pending',
                'amount' => $payload['amount'] ?? $transaction->transaction_amount,
            ]);

            return $reversal->load('transaction');
        });
    }

    public function createShortage(array $payload, int $businessId): MobileAgentShortageLog
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $shortage = MobileAgentShortageLog::create([
                ...$payload,
                'business_id' => $businessId,
                'logged_at' => $payload['logged_at'] ?? now(),
                'status' => $payload['status'] ?? 'open',
            ]);

            if ((float) $shortage->shortage_amount >= 5000) {
                MobileAgentFraudAlert::create([
                    'business_id' => $businessId,
                    'staff_id' => $payload['staff_id'] ?? null,
                    'agent_name' => $shortage->agent_name,
                    'alert_type' => 'cash_shortage',
                    'severity' => 'high',
                    'details' => 'Shortage crossed the review threshold.',
                    'flagged_at' => $shortage->logged_at,
                ]);
            }

            return $shortage;
        });
    }

    private function generateTransactionReference(int $businessId): string
    {
        return 'AGT-' . $businessId . '-' . strtoupper(str()->random(8));
    }
}
