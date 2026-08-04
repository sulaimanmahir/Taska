<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pharmacy\ApplyBatchDiscountRequest;
use App\Http\Requests\Pharmacy\DispensePharmacyProductRequest;
use App\Http\Requests\Pharmacy\UseProductBatchRequest;
use App\Http\Resources\PharmacyDispenseResource;
use App\Http\Resources\ProductBatchResource;
use App\Models\BatchMovement;
use App\Models\ControlledDrugLog;
use App\Models\MedicineSubstitutionRule;
use App\Models\PharmacyDispense;
use App\Models\ProductBatch;
use App\Models\RefillReminder;
use App\Services\PharmacyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PharmacyController extends Controller
{
    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;
        $warningDays = 30;

        $summary = ProductBatch::where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN expiry_date <= date('now', '+30 day') AND expiry_date >= date('now') THEN 1 ELSE 0 END), 0) as near_expiry_batches,
                COALESCE(SUM(CASE WHEN remaining_quantity > 0 AND discounted_price > 0 THEN 1 ELSE 0 END), 0) as discounted_batches,
                COALESCE(SUM(CASE WHEN expiry_date < date('now') AND remaining_quantity > 0 THEN remaining_quantity ELSE 0 END), 0) as expired_units
            ")
            ->first();

        $controlledLogs = ControlledDrugLog::where('business_id', $businessId)->count();
        $refillPending = RefillReminder::where('business_id', $businessId)->where('status', 'pending')->count();
        $purchaseHistory = PharmacyDispense::where('business_id', $businessId)
            ->with(['customer', 'product', 'substitutedFrom'])
            ->latest('dispensed_at')
            ->limit(8)
            ->get();

        $nearExpiry = ProductBatch::with('product')
            ->where('business_id', $businessId)
            ->where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<=', now()->addDays($warningDays))
            ->whereDate('expiry_date', '>=', now())
            ->orderBy('expiry_date')
            ->limit(8)
            ->get();

        return response()->json([
            'summary' => [
                'near_expiry_batches' => (int) ($summary?->near_expiry_batches ?? 0),
                'discounted_batches' => (int) ($summary?->discounted_batches ?? 0),
                'expired_units' => (float) ($summary?->expired_units ?? 0),
                'controlled_logs' => $controlledLogs,
                'refill_pending' => $refillPending,
            ],
            'near_expiry' => $nearExpiry,
            'purchase_history' => $purchaseHistory,
        ]);
    }

    public function index(Request $request)
    {
        $query = ProductBatch::with('product')->where('business_id', $request->user()->current_business_id);

        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has_stock) {
            $query->where('remaining_quantity', '>', 0);
        }

        return $query->orderBy('expiry_date', 'asc')->paginate(20);
    }

    public function store(Request $request, PharmacyService $pharmacyService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'batch_number' => 'required|string',
            'expiry_date' => 'required|date',
            'quantity' => 'required|numeric|min:0',
            'cost_per_unit' => 'nullable|numeric',
            'near_expiry_discount_percent' => 'nullable|numeric|min:0|max:100',
            'discounted_price' => 'nullable|numeric|min:0',
            'supplier' => 'nullable|string',
            'manufacture_date' => 'nullable|date',
        ]);

        $batch = $pharmacyService->createBatch($validated, $businessId);

        return response()->json(['message' => 'Batch created', 'batch' => $batch], 201);
    }

    public function show(Request $request, $batch)
    {
        $batch = ProductBatch::with('product', 'movements')->findOrFail($batch);
        $this->authorize('view', $batch);

        return new ProductBatchResource($batch);
    }

    public function expiring(Request $request)
    {
        $days = $request->days ?? 30;

        return ProductBatch::with('product')
            ->where('business_id', $request->user()->current_business_id)
            ->where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<=', now()->addDays($days))
            ->whereDate('expiry_date', '>=', now())
            ->orderBy('expiry_date', 'asc')
            ->paginate(20);
    }

    public function expired(Request $request)
    {
        return ProductBatch::with('product')
            ->where('business_id', $request->user()->current_business_id)
            ->where('remaining_quantity', '>', 0)
            ->whereDate('expiry_date', '<', now())
            ->orderBy('expiry_date', 'asc')
            ->paginate(20);
    }

    public function useBatch(UseProductBatchRequest $request, $batch, PharmacyService $pharmacyService)
    {
        $batch = ProductBatch::findOrFail($batch);
        $this->authorize('update', $batch);
        $validated = $request->validated();

        $batch = $pharmacyService->useBatch(
            $batch,
            $validated,
            $request->user()->current_business_id,
            $request->user()->id,
        );

        return response()->json([
            'message' => 'Batch updated',
            'remaining_quantity' => $batch->remaining_quantity,
            'batch' => (new ProductBatchResource($batch))->resolve(),
        ]);
    }

    public function substitutions(Request $request)
    {
        return response()->json(
            MedicineSubstitutionRule::where('business_id', $request->user()->current_business_id)
                ->with(['product', 'substitute'])
                ->latest()
                ->get()
        );
    }

    public function storeSubstitution(Request $request, PharmacyService $pharmacyService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'substitute_product_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'reason' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json(
            $pharmacyService->createSubstitutionRule($validated, $businessId),
            201
        );
    }

    public function controlledLogs(Request $request)
    {
        return response()->json(
            ControlledDrugLog::where('business_id', $request->user()->current_business_id)
                ->with(['product', 'batch', 'customer'])
                ->latest()
                ->get()
        );
    }

    public function reminders(Request $request)
    {
        return response()->json(
            RefillReminder::where('business_id', $request->user()->current_business_id)
                ->with(['customer', 'product', 'dispense'])
                ->latest('due_on')
                ->get()
        );
    }

    public function purchaseHistory(Request $request)
    {
        return response()->json(
            PharmacyDispense::where('business_id', $request->user()->current_business_id)
                ->with(['customer', 'product', 'batch', 'substitutedFrom'])
                ->latest('dispensed_at')
                ->get()
        );
    }

    public function dispense(DispensePharmacyProductRequest $request, PharmacyService $pharmacyService)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        return response()->json(
            (new PharmacyDispenseResource(
                $pharmacyService->dispense($validated, $businessId, $request->user()->id)
            ))->resolve(),
            201
        );
    }

    public function applyDiscount(ApplyBatchDiscountRequest $request, $batch, PharmacyService $pharmacyService)
    {
        $validated = $request->validated();

        $batch = ProductBatch::findOrFail($batch);
        $this->authorize('update', $batch);

        return response()->json(
            (new ProductBatchResource(
                $pharmacyService->applyNearExpiryDiscount($batch, (float) $validated['near_expiry_discount_percent'], (float) $validated['discounted_price'])
            ))->resolve()
        );
    }

    private function businessOwnedRule(string $table, int $businessId)
    {
        return Rule::exists($table, 'id')->where(fn ($query) => $query->where('business_id', $businessId));
    }
}
