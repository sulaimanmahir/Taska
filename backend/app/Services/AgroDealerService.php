<?php

namespace App\Services;

use App\Models\AgroAdvisoryRecord;
use App\Models\AgroFarmerCreditRecovery;
use App\Models\AgroRegionalSalesTrend;
use App\Models\AgroSeasonalForecast;
use App\Models\AgroSubsidySale;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AgroDealerService
{
    public function createForecast(array $payload, int $businessId): AgroSeasonalForecast
    {
        return AgroSeasonalForecast::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createSubsidySale(array $payload, int $businessId): AgroSubsidySale
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $amountDue = (float) ($payload['amount_due'] ?? ((float) $payload['quantity'] * (float) $payload['unit_price']));
            $amountReceived = (float) ($payload['amount_received'] ?? 0);

            $sale = AgroSubsidySale::create([
                ...$payload,
                'business_id' => $businessId,
                'amount_due' => $amountDue,
                'amount_received' => $amountReceived,
                'status' => $amountReceived >= $amountDue ? 'settled' : 'pending',
            ]);

            AgroRegionalSalesTrend::create([
                'business_id' => $businessId,
                'branch_id' => $payload['branch_id'] ?? null,
                'region_name' => $payload['region_name'] ?? 'Unassigned',
                'season_name' => $payload['season_name'] ?? null,
                'input_category' => $payload['input_category'] ?? null,
                'sales_amount' => $amountDue,
                'quantity_sold' => $payload['quantity'],
                'trend_date' => $payload['sale_date'],
            ]);

            return $sale->load(['customer', 'product']);
        });
    }

    public function createCreditRecovery(array $payload, int $businessId): AgroFarmerCreditRecovery
    {
        $creditAmount = (float) $payload['credit_amount'];
        $recoveredAmount = (float) ($payload['recovered_amount'] ?? 0);

        if ($recoveredAmount > $creditAmount) {
            throw ValidationException::withMessages([
                'recovered_amount' => ['Recovered amount cannot exceed the credit amount.'],
            ]);
        }

        $outstandingAmount = max($creditAmount - $recoveredAmount, 0);

        return AgroFarmerCreditRecovery::create([
            ...$payload,
            'business_id' => $businessId,
            'recovery_reference' => $payload['recovery_reference'] ?? $this->generateRecoveryReference($businessId),
            'outstanding_amount' => $outstandingAmount,
            'status' => $outstandingAmount <= 0 ? 'recovered' : ($payload['status'] ?? 'open'),
        ]);
    }

    public function updateRecovery(AgroFarmerCreditRecovery $recovery, array $payload): AgroFarmerCreditRecovery
    {
        $recoveredAmount = (float) ($payload['recovered_amount'] ?? $recovery->recovered_amount);
        $creditAmount = (float) ($payload['credit_amount'] ?? $recovery->credit_amount);

        if ($recoveredAmount > $creditAmount) {
            throw ValidationException::withMessages([
                'recovered_amount' => ['Recovered amount cannot exceed the credit amount.'],
            ]);
        }

        $outstandingAmount = max($creditAmount - $recoveredAmount, 0);

        $recovery->update([
            ...$payload,
            'recovered_amount' => $recoveredAmount,
            'outstanding_amount' => $outstandingAmount,
            'status' => $outstandingAmount <= 0 ? 'recovered' : ($payload['status'] ?? $recovery->status),
        ]);

        return $recovery->fresh('customer');
    }

    public function createAdvisory(array $payload, int $businessId): AgroAdvisoryRecord
    {
        return AgroAdvisoryRecord::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createRegionalTrend(array $payload, int $businessId): AgroRegionalSalesTrend
    {
        return AgroRegionalSalesTrend::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    private function generateRecoveryReference(int $businessId): string
    {
        return 'AGR-REC-' . $businessId . '-' . strtoupper(str()->random(6));
    }
}
