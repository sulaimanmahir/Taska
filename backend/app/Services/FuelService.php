<?php

namespace App\Services;

use App\Models\FuelNozzleReading;
use App\Models\FuelPriceChangeLog;
use App\Models\FuelPump;
use App\Models\FuelShiftLog;
use App\Models\FuelTank;
use App\Models\FuelTankDip;
use App\Models\FuelVarianceAlert;
use Illuminate\Support\Facades\DB;

class FuelService
{
    public function createTank(array $payload, int $businessId): FuelTank
    {
        return FuelTank::create([
            ...$payload,
            'business_id' => $businessId,
            'status' => $payload['status'] ?? 'active',
        ]);
    }

    public function createPump(array $payload, int $businessId): FuelPump
    {
        return FuelPump::create([
            ...$payload,
            'business_id' => $businessId,
            'status' => $payload['status'] ?? 'active',
        ]);
    }

    public function createNozzleReading(array $payload, int $businessId): FuelNozzleReading
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $pump = FuelPump::where('business_id', $businessId)->with('tank')->findOrFail($payload['fuel_pump_id']);

            $openingReading = (float) ($payload['opening_reading'] ?? $pump->meter_reading_current);
            $closingReading = (float) $payload['closing_reading'];
            $litresSold = max($closingReading - $openingReading, 0);
            $unitPrice = (float) ($payload['unit_price'] ?? $pump->tank?->price_per_litre ?? 0);
            $expectedSalesAmount = round($litresSold * $unitPrice, 2);
            $recordedSalesAmount = (float) ($payload['recorded_sales_amount'] ?? $expectedSalesAmount);
            $cashReported = (float) ($payload['cash_reported'] ?? $recordedSalesAmount);
            $varianceAmount = round($cashReported - $expectedSalesAmount, 2);

            $reading = FuelNozzleReading::create([
                ...$payload,
                'business_id' => $businessId,
                'opening_reading' => $openingReading,
                'litres_sold' => $litresSold,
                'unit_price' => $unitPrice,
                'expected_sales_amount' => $expectedSalesAmount,
                'recorded_sales_amount' => $recordedSalesAmount,
                'cash_reported' => $cashReported,
                'variance_amount' => $varianceAmount,
                'status' => abs($varianceAmount) > 1000 ? 'variance_flagged' : 'balanced',
            ]);

            $pump->update([
                'meter_reading_current' => $closingReading,
                'attendant_name' => $payload['attendant_name'] ?? $pump->attendant_name,
            ]);

            if ($pump->tank) {
                $pump->tank->decrement('current_stock_litres', $litresSold);
            }

            if (abs($varianceAmount) > 1000) {
                $this->createAlert([
                    'business_id' => $businessId,
                    'branch_id' => $payload['branch_id'] ?? $pump->branch_id,
                    'fuel_pump_id' => $pump->id,
                    'fuel_tank_id' => $pump->fuel_tank_id,
                    'alert_type' => 'nozzle_variance',
                    'severity' => abs($varianceAmount) >= 5000 ? 'high' : 'medium',
                    'metric_value' => abs($varianceAmount),
                    'threshold_value' => 1000,
                    'details' => 'Nozzle reading created a cash variance above the allowed threshold.',
                ]);
            }

            return $reading->load('pump.tank');
        });
    }

    public function createTankDip(array $payload, int $businessId): FuelTankDip
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $tank = FuelTank::where('business_id', $businessId)->findOrFail($payload['fuel_tank_id']);

            $openingStock = (float) ($payload['opening_stock_litres'] ?? $tank->current_stock_litres);
            $deliveriesReceived = (float) ($payload['deliveries_received_litres'] ?? 0);
            $closingStock = (float) $payload['closing_stock_litres'];
            $expectedStock = round($openingStock + $deliveriesReceived, 2);
            $varianceLitres = round($closingStock - $expectedStock, 2);
            $varianceValue = round($varianceLitres * (float) $tank->price_per_litre, 2);

            $dip = FuelTankDip::create([
                ...$payload,
                'business_id' => $businessId,
                'opening_stock_litres' => $openingStock,
                'deliveries_received_litres' => $deliveriesReceived,
                'expected_stock_litres' => $expectedStock,
                'variance_litres' => $varianceLitres,
                'variance_value' => $varianceValue,
            ]);

            $tank->update([
                'current_stock_litres' => $closingStock,
                'last_dip_variance' => $varianceLitres,
            ]);

            if (abs($varianceLitres) > 25) {
                $this->createAlert([
                    'business_id' => $businessId,
                    'branch_id' => $payload['branch_id'] ?? $tank->branch_id,
                    'fuel_tank_id' => $tank->id,
                    'alert_type' => 'wet_stock_variance',
                    'severity' => abs($varianceLitres) >= 75 ? 'high' : 'medium',
                    'metric_value' => abs($varianceLitres),
                    'threshold_value' => 25,
                    'details' => 'Tank dip shows a wet stock variance that requires review.',
                ]);
            }

            return $dip->load('tank');
        });
    }

    public function createShiftLog(array $payload, int $businessId): FuelShiftLog
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $cashExpected = (float) ($payload['cash_expected'] ?? 0);
            $cashReported = (float) ($payload['cash_reported'] ?? 0);
            $recoveryAmount = (float) ($payload['recovery_amount'] ?? 0);
            $shortageAmount = round(max($cashExpected - $cashReported - $recoveryAmount, 0), 2);

            $shift = FuelShiftLog::create([
                ...$payload,
                'business_id' => $businessId,
                'opened_at' => $payload['opened_at'] ?? now(),
                'closed_at' => $payload['closed_at'] ?? null,
                'cash_expected' => $cashExpected,
                'cash_reported' => $cashReported,
                'recovery_amount' => $recoveryAmount,
                'shortage_amount' => $shortageAmount,
                'status' => $payload['status'] ?? ($payload['closed_at'] ? 'closed' : 'open'),
            ]);

            if ($shortageAmount > 0) {
                $this->createAlert([
                    'business_id' => $businessId,
                    'branch_id' => $payload['branch_id'] ?? null,
                    'fuel_shift_log_id' => $shift->id,
                    'alert_type' => 'shift_shortage',
                    'severity' => $shortageAmount >= 5000 ? 'high' : 'medium',
                    'metric_value' => $shortageAmount,
                    'threshold_value' => 1,
                    'details' => 'Attendant shift closed with a recoverable shortage.',
                ]);
            }

            return $shift;
        });
    }

    public function createPriceChange(array $payload, int $businessId): FuelPriceChangeLog
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $oldPrice = (float) ($payload['old_price'] ?? FuelTank::where('business_id', $businessId)
                ->where('fuel_type', $payload['fuel_type'])
                ->value('price_per_litre') ?? 0);

            $log = FuelPriceChangeLog::create([
                ...$payload,
                'business_id' => $businessId,
                'old_price' => $oldPrice,
                'effective_at' => $payload['effective_at'] ?? now(),
            ]);

            FuelTank::where('business_id', $businessId)
                ->where('fuel_type', $payload['fuel_type'])
                ->update(['price_per_litre' => $payload['new_price']]);

            return $log;
        });
    }

    private function createAlert(array $payload): FuelVarianceAlert
    {
        return FuelVarianceAlert::create([
            ...$payload,
            'detected_at' => now(),
            'is_resolved' => false,
        ]);
    }
}
