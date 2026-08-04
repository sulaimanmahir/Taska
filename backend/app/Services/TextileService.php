<?php

namespace App\Services;

use App\Models\TailoringJob;
use App\Models\TextileColorVariant;
use App\Models\TextileConsignmentStock;
use App\Models\TextileCustomerMeasurement;
use App\Models\TextileInvoice;
use App\Models\TextileStyleOrder;
use Illuminate\Support\Facades\DB;

class TextileService
{
    public function createMeasurement(array $payload, int $businessId): TextileCustomerMeasurement
    {
        return TextileCustomerMeasurement::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createVariant(array $payload, int $businessId): TextileColorVariant
    {
        return TextileColorVariant::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createStyleOrder(array $payload, int $businessId): TextileStyleOrder
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $variant = null;
            if (!empty($payload['variant_id'])) {
                $variant = TextileColorVariant::where('business_id', $businessId)->findOrFail($payload['variant_id']);
            }

            $fabricCharge = (float) ($payload['fabric_charge'] ?? ((float) ($variant?->retail_price ?? 0) * (float) ($payload['fabric_quantity'] ?? 0)));
            $labourCharge = (float) ($payload['labour_charge'] ?? 0);
            $totalAmount = $fabricCharge + $labourCharge;

            $order = TextileStyleOrder::create([
                ...$payload,
                'business_id' => $businessId,
                'order_number' => $this->generateOrderNumber($businessId),
                'status' => $payload['status'] ?? 'intake',
                'fabric_charge' => $fabricCharge,
                'total_amount' => $totalAmount,
                'amount_paid' => $payload['amount_paid'] ?? 0,
            ]);

            TailoringJob::create([
                'business_id' => $businessId,
                'style_order_id' => $order->id,
                'assigned_tailor' => $payload['assigned_tailor'] ?? null,
                'stage' => $payload['tailoring_stage'] ?? 'cutting',
                'priority' => $payload['priority'] ?? 'normal',
                'started_at' => $payload['started_at'] ?? now(),
                'notes' => $payload['job_notes'] ?? null,
            ]);

            if ($variant) {
                $variant->decrement('available_quantity', (float) ($payload['fabric_quantity'] ?? 0));
            }

            return $order->load(['customer', 'measurement', 'variant.product', 'tailoringJob']);
        });
    }

    public function updateTailoringJob(TailoringJob $job, array $payload): TailoringJob
    {
        $job->update($payload);

        if (($payload['stage'] ?? null) === 'completed') {
            $job->update(['completed_at' => $payload['completed_at'] ?? now()]);
            $job->styleOrder()->update(['status' => 'ready']);
        }

        return $job->fresh(['styleOrder.customer']);
    }

    public function createConsignment(array $payload, int $businessId): TextileConsignmentStock
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $variant = null;
            if (!empty($payload['variant_id'])) {
                $variant = TextileColorVariant::where('business_id', $businessId)->findOrFail($payload['variant_id']);
                $variant->increment('consignment_quantity', (float) $payload['quantity_sent']);
                $variant->decrement('available_quantity', (float) $payload['quantity_sent']);
            }

            return TextileConsignmentStock::create([
                ...$payload,
                'business_id' => $businessId,
                'status' => $payload['status'] ?? 'open',
            ]);
        });
    }

    public function createInvoice(array $payload, int $businessId): TextileInvoice
    {
        $subtotal = (float) ($payload['quantity'] ?? 0) * (float) ($payload['rate'] ?? 0);

        return TextileInvoice::create([
            ...$payload,
            'business_id' => $businessId,
            'invoice_number' => $this->generateInvoiceNumber($businessId),
            'subtotal' => $subtotal,
            'total_amount' => $payload['total_amount'] ?? $subtotal,
            'status' => ($payload['amount_paid'] ?? 0) >= ($payload['total_amount'] ?? $subtotal) ? 'paid' : 'open',
        ]);
    }

    private function generateOrderNumber(int $businessId): string
    {
        return 'TXT-' . $businessId . '-' . strtoupper(str()->random(6));
    }

    private function generateInvoiceNumber(int $businessId): string
    {
        return 'INV-TXT-' . $businessId . '-' . strtoupper(str()->random(5));
    }
}
