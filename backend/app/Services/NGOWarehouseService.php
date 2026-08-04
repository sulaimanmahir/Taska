<?php

namespace App\Services;

use App\Models\InventoryBatch;
use App\Models\InventoryItem;
use App\Models\InventoryMovement;
use App\Models\NGODistribution;
use App\Models\NGODistributionItem;
use App\Models\NGODistributionSignature;
use App\Models\NGODonorSource;
use App\Models\NGOPartnerRequest;
use App\Models\NGOWaybill;
use Illuminate\Support\Facades\DB;

class NGOWarehouseService
{
    public function overview(int $businessId): array
    {
        return [
            'summary' => [
                'donor_sources' => NGODonorSource::where('business_id', $businessId)->count(),
                'partner_requests_pending' => NGOPartnerRequest::where('business_id', $businessId)->where('status', 'pending')->count(),
                'distributions_today' => NGODistribution::where('business_id', $businessId)->whereDate('distributed_on', today())->count(),
                'signatures_pending' => NGODistribution::where('business_id', $businessId)->doesntHave('signatures')->count(),
                'expiry_alerts' => InventoryBatch::where('business_id', $businessId)->whereDate('expiry_date', '<=', now()->addDays(30))->count(),
                'stock_accountability_gap' => InventoryMovement::where('business_id', $businessId)->whereNull('reference_type')->count(),
            ],
            'donors' => NGODonorSource::where('business_id', $businessId)->latest()->get(),
            'partner_requests' => NGOPartnerRequest::where('business_id', $businessId)->latest()->get(),
            'distributions' => NGODistribution::with(['items.product', 'signatures'])->where('business_id', $businessId)->latest()->get(),
            'inventory' => InventoryItem::with('product', 'warehouse')->where('business_id', $businessId)->latest()->get(),
        ];
    }

    public function createDonor(array $payload, int $businessId): NGODonorSource
    {
        return NGODonorSource::create([
            'business_id' => $businessId,
            'name' => $payload['name'],
            'contact_person' => $payload['contact_person'] ?? null,
            'phone' => $payload['phone'] ?? null,
            'compliance_reference' => $payload['compliance_reference'] ?? null,
        ]);
    }

    public function createPartnerRequest(array $payload, int $businessId, ?int $branchId): NGOPartnerRequest
    {
        return NGOPartnerRequest::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'partner_name' => $payload['partner_name'],
            'request_reference' => 'REQ-' . now()->format('Ymd') . '-' . str()->upper(str()->random(4)),
            'status' => $payload['status'] ?? 'pending',
            'request_notes' => $payload['request_notes'] ?? null,
            'needed_by' => $payload['needed_by'] ?? null,
        ]);
    }

    public function createDistribution(array $payload, int $businessId, ?int $branchId, int $userId): NGODistribution
    {
        return DB::transaction(function () use ($payload, $businessId, $branchId, $userId) {
            $distribution = NGODistribution::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'partner_request_id' => $payload['partner_request_id'] ?? null,
                'donor_source_id' => $payload['donor_source_id'] ?? null,
                'distribution_reference' => 'DST-' . now()->format('Ymd') . '-' . str()->upper(str()->random(4)),
                'beneficiary_name' => $payload['beneficiary_name'],
                'destination_location' => $payload['destination_location'] ?? null,
                'status' => $payload['status'] ?? 'dispatched',
                'distributed_on' => $payload['distributed_on'] ?? today()->toDateString(),
                'created_by' => $userId,
            ]);

            foreach ($payload['items'] as $item) {
                NGODistributionItem::create([
                    'distribution_id' => $distribution->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            NGOWaybill::create([
                'distribution_id' => $distribution->id,
                'waybill_number' => 'WAY-' . now()->format('Ymd') . '-' . str()->upper(str()->random(4)),
                'driver_name' => $payload['driver_name'] ?? null,
                'vehicle_reference' => $payload['vehicle_reference'] ?? null,
                'status' => 'generated',
            ]);

            if ($payload['partner_request_id'] ?? null) {
                NGOPartnerRequest::where('id', $payload['partner_request_id'])->update(['status' => 'fulfilled']);
            }

            return $distribution->load(['items.product', 'signatures']);
        });
    }

    public function captureSignature(NGODistribution $distribution, array $payload): NGODistributionSignature
    {
        return NGODistributionSignature::create([
            'distribution_id' => $distribution->id,
            'beneficiary_name' => $payload['beneficiary_name'],
            'signed_by' => $payload['signed_by'],
            'signature_reference' => $payload['signature_reference'] ?? null,
            'signed_at' => now(),
        ])->fresh('distribution');
    }
}
