<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertyManagement\RecordPropertyRentPaymentRequest;
use App\Http\Requests\PropertyManagement\StorePropertyLeaseRequest;
use App\Http\Requests\PropertyManagement\StorePropertyMaintenanceRequestRequest;
use App\Http\Requests\PropertyManagement\StorePropertyUnitRequest;
use App\Http\Resources\PropertyLeaseResource;
use App\Http\Resources\PropertyMaintenanceRequestResource;
use App\Http\Resources\PropertyUnitResource;
use App\Models\PropertyLease;
use App\Models\PropertyMaintenanceRequest;
use App\Models\PropertyRentLedgerEntry;
use App\Models\PropertyUnit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PropertyManagementController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $businessId = $request->user()->current_business_id;

        $unitCounts = PropertyUnit::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COUNT(*) as total_units,
                COALESCE(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0) as occupied_units,
                COALESCE(SUM(CASE WHEN status = 'vacant' THEN 1 ELSE 0 END), 0) as vacant_units
            ")
            ->first();

        $totalOutstandingBalance = (float) PropertyLease::query()
            ->where('business_id', $businessId)
            ->where('status', 'active')
            ->sum('balance');

        $rentCollectedThisMonth = (float) PropertyRentLedgerEntry::query()
            ->where('business_id', $businessId)
            ->where('type', PropertyRentLedgerEntry::TYPE_PAYMENT)
            ->whereBetween('transaction_date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->sum('amount');

        $openMaintenanceRequests = PropertyMaintenanceRequest::query()
            ->where('business_id', $businessId)
            ->whereIn('status', ['open', 'in_progress'])
            ->count();

        return response()->json([
            'summary' => [
                'total_units' => (int) ($unitCounts?->total_units ?? 0),
                'occupied_units' => (int) ($unitCounts?->occupied_units ?? 0),
                'vacant_units' => (int) ($unitCounts?->vacant_units ?? 0),
                'total_outstanding_balance' => $totalOutstandingBalance,
                'rent_collected_this_month' => $rentCollectedThisMonth,
                'open_maintenance_requests' => $openMaintenanceRequests,
            ],
        ]);
    }

    public function units(Request $request): JsonResponse
    {
        $units = PropertyUnit::query()
            ->where('business_id', $request->user()->current_business_id)
            ->orderBy('property_name')
            ->get();

        return response()->json(PropertyUnitResource::collection($units)->resolve());
    }

    public function storeUnit(StorePropertyUnitRequest $request): JsonResponse
    {
        $unit = PropertyUnit::create([
            ...$request->validated(),
            'business_id' => $request->user()->current_business_id,
            'unit_code' => PropertyUnit::generateUnitCode(),
            'status' => PropertyUnit::STATUS_VACANT,
        ]);

        return response()->json((new PropertyUnitResource($unit))->resolve(), 201);
    }

    public function leases(Request $request): JsonResponse
    {
        $leases = PropertyLease::query()
            ->with(['propertyUnit', 'customer'])
            ->where('business_id', $request->user()->current_business_id)
            ->orderByDesc('id')
            ->get();

        return response()->json(PropertyLeaseResource::collection($leases)->resolve());
    }

    public function storeLease(StorePropertyLeaseRequest $request): JsonResponse
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $lease = DB::transaction(function () use ($validated, $businessId) {
            $frequencyDays = $validated['payment_frequency_days'] ?? 365;
            $startDate = $validated['start_date'];

            $lease = PropertyLease::create([
                ...$validated,
                'business_id' => $businessId,
                'payment_frequency_days' => $frequencyDays,
                'balance' => 0,
                'next_due_date' => $startDate,
                'status' => PropertyLease::STATUS_ACTIVE,
            ]);

            // The first rent charge is due immediately at lease start, so the
            // ledger (and the lease's cached balance) reflects reality from
            // day one rather than showing a clean "0" balance for a lease
            // that already owes its first payment.
            $chargeAmount = $lease->totalDueAmount();

            PropertyRentLedgerEntry::create([
                'business_id' => $businessId,
                'property_lease_id' => $lease->id,
                'customer_id' => $lease->customer_id,
                'type' => PropertyRentLedgerEntry::TYPE_CHARGE,
                'amount' => $chargeAmount,
                'balance_before' => 0,
                'balance_after' => $chargeAmount,
                'transaction_date' => $startDate,
                'notes' => 'Initial charge at lease start',
            ]);

            $lease->update(['balance' => $chargeAmount]);

            PropertyUnit::where('id', $lease->property_unit_id)->update(['status' => PropertyUnit::STATUS_OCCUPIED]);

            return $lease;
        });

        return response()->json((new PropertyLeaseResource($lease->load(['propertyUnit', 'customer'])))->resolve(), 201);
    }

    public function recordPayment(RecordPropertyRentPaymentRequest $request, int $leaseId): JsonResponse
    {
        $businessId = $request->user()->current_business_id;
        $lease = PropertyLease::where('business_id', $businessId)->findOrFail($leaseId);
        $validated = $request->validated();

        $entry = DB::transaction(function () use ($lease, $validated, $businessId) {
            $balanceBefore = (float) $lease->balance;
            $balanceAfter = $balanceBefore - (float) $validated['amount'];

            $entry = PropertyRentLedgerEntry::create([
                'business_id' => $businessId,
                'property_lease_id' => $lease->id,
                'customer_id' => $lease->customer_id,
                'type' => PropertyRentLedgerEntry::TYPE_PAYMENT,
                'amount' => $validated['amount'],
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'transaction_date' => $validated['transaction_date'] ?? now()->toDateString(),
                'reference' => $validated['reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_by' => request()->user()->id,
            ]);

            $lease->update(['balance' => $balanceAfter]);

            return $entry;
        });

        return response()->json([
            'lease' => (new PropertyLeaseResource($lease->fresh()))->resolve(),
            'entry' => [
                'id' => $entry->id,
                'amount' => $entry->amount,
                'balance_after' => $entry->balance_after,
                'transaction_date' => $entry->transaction_date->toDateString(),
            ],
        ], 201);
    }

    public function maintenanceRequests(Request $request): JsonResponse
    {
        $requests = PropertyMaintenanceRequest::query()
            ->with('propertyUnit')
            ->where('business_id', $request->user()->current_business_id)
            ->orderByDesc('id')
            ->get();

        return response()->json(PropertyMaintenanceRequestResource::collection($requests)->resolve());
    }

    public function storeMaintenanceRequest(StorePropertyMaintenanceRequestRequest $request): JsonResponse
    {
        $maintenanceRequest = PropertyMaintenanceRequest::create([
            ...$request->validated(),
            'business_id' => $request->user()->current_business_id,
            'reported_by' => $request->user()->id,
            'priority' => $request->validated()['priority'] ?? 'normal',
            'status' => 'open',
        ]);

        return response()->json((new PropertyMaintenanceRequestResource($maintenanceRequest))->resolve(), 201);
    }
}
