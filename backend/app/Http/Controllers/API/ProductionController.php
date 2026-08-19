<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Production\AdjustRawMaterialRequest;
use App\Http\Requests\Production\CompleteProductionBatchRequest;
use App\Http\Resources\ProductionBatchResource;
use App\Http\Resources\RawMaterialResource;
use App\Models\ProductionBatch;
use App\Models\RawMaterial;
use App\Services\ProductionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionController extends Controller
{
    use ValidatesBusinessOwnership;

    public function overview(Request $request): JsonResponse
    {
        $businessId = $request->user()->current_business_id;
        $today = today()->toDateString();

        $summary = ProductionBatch::query()
            ->where('business_id', $businessId)
            ->whereDate('production_date', $today)
            ->selectRaw("
                COALESCE(SUM(total_output_quantity), 0) as units_produced_today,
                COALESCE(SUM(electricity_cost), 0) as electricity_cost_today,
                COALESCE(SUM(packaging_cost_total), 0) as packaging_cost_today,
                COALESCE(SUM(generator_fuel_cost), 0) as generator_fuel_today,
                COALESCE(SUM(net_margin), 0) as profit_estimate_today,
                COALESCE(SUM(downtime_minutes), 0) as downtime_today
            ")
            ->first();

        $unitsSoldToday = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.business_id', $businessId)
            ->whereDate('orders.created_at', today())
            ->sum('order_items.quantity');

        $packagingSpend = DB::table('production_input_purchases')
            ->join('raw_materials', 'raw_materials.id', '=', 'production_input_purchases.raw_material_id')
            ->where('production_input_purchases.business_id', $businessId)
            ->where('raw_materials.material_category', 'packaging')
            ->selectRaw('production_input_purchases.supplier_name as supplier_name, COALESCE(SUM(production_input_purchases.total_cost), 0) as total_spend')
            ->groupBy('production_input_purchases.supplier_name')
            ->orderByDesc('total_spend')
            ->limit(5)
            ->get();

        $supplierSpend = DB::table('production_input_purchases')
            ->where('business_id', $businessId)
            ->selectRaw('production_input_purchases.supplier_name as supplier_name, COALESCE(SUM(production_input_purchases.total_cost), 0) as total_spend, COALESCE(SUM(production_input_purchases.balance_due), 0) as outstanding_balance')
            ->groupBy('production_input_purchases.supplier_name')
            ->orderByDesc('total_spend')
            ->limit(5)
            ->get();

        $costPerBagTrend = ProductionBatch::query()
            ->where('business_id', $businessId)
            ->orderByDesc('production_date')
            ->limit(6)
            ->get(['production_date', 'cost_per_bag', 'net_margin', 'total_batch_cost', 'estimated_revenue']);

        $lowStockMaterials = RawMaterial::query()
            ->where('business_id', $businessId)
            ->where(function ($query) {
                $query->whereColumn('quantity', '<=', 'reorder_level')
                    ->orWhere(function ($inner) {
                        $inner->whereNotNull('low_stock_threshold')
                            ->whereColumn('quantity', '<=', 'low_stock_threshold');
                    });
            })
            ->orderBy('quantity')
            ->limit(6)
            ->get();

        return response()->json([
            'summary' => [
                'units_produced_today' => (float) ($summary?->units_produced_today ?? 0),
                'units_sold_today' => (float) $unitsSoldToday,
                'electricity_cost_today' => (float) ($summary?->electricity_cost_today ?? 0),
                'packaging_cost_today' => (float) ($summary?->packaging_cost_today ?? 0),
                'generator_fuel_today' => (float) ($summary?->generator_fuel_today ?? 0),
                'profit_estimate_today' => (float) ($summary?->profit_estimate_today ?? 0),
                'downtime_today' => (int) ($summary?->downtime_today ?? 0),
            ],
            'reports' => [
                'packaging_spend' => $packagingSpend,
                'supplier_spend' => $supplierSpend,
                'cost_per_bag_trend' => $costPerBagTrend,
                'profitability_trend' => $costPerBagTrend,
            ],
            'low_stock_materials' => $lowStockMaterials,
        ]);
    }

    public function index(Request $request)
    {
        return ProductionBatch::query()
            ->where('business_id', $request->user()->current_business_id)
            ->with(['materials.rawMaterial', 'outputs.product', 'energyLogs', 'wastageLogs'])
            ->orderByDesc('created_at')
            ->paginate(20);
    }

    public function store(Request $request, ProductionService $productionService): JsonResponse
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'production_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'materials' => 'required|array',
            'materials.*.raw_material_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('raw_materials', $businessId),
            ],
            'materials.*.quantity_used' => 'required|numeric|min:0',
            'materials.*.cost_per_unit' => 'nullable|numeric|min:0',
            'outputs' => 'required|array',
            'outputs.*.product_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'outputs.*.quantity_produced' => 'required|numeric|min:0',
            'outputs.*.damaged_quantity' => 'nullable|numeric|min:0',
            'outputs.*.selling_price' => 'nullable|numeric|min:0',
            'machine_runtime_hours' => 'nullable|numeric|min:0',
            'downtime_minutes' => 'nullable|integer|min:0',
            'public_power_hours' => 'nullable|numeric|min:0',
            'electricity_cost' => 'nullable|numeric|min:0',
            'generator_runtime_hours' => 'nullable|numeric|min:0',
            'generator_fuel_cost' => 'nullable|numeric|min:0',
            'solar_backup_cost' => 'nullable|numeric|min:0',
            'labour_cost' => 'nullable|numeric|min:0',
            'loading_cost' => 'nullable|numeric|min:0',
            'maintenance_allocation' => 'nullable|numeric|min:0',
            'sachets_per_bag' => 'nullable|numeric|min:1',
            'leakage_losses' => 'nullable|numeric|min:0',
            'torn_sacks' => 'nullable|numeric|min:0',
            'damaged_nylon' => 'nullable|numeric|min:0',
        ]);

        $batch = $productionService->createBatch(
            $validated,
            $businessId,
            $request->user()->id,
        );

        return response()->json(['message' => 'Production batch created', 'batch' => $batch], 201);
    }

    public function show(Request $request, $batch)
    {
        $batch = ProductionBatch::query()
            ->with(['materials.rawMaterial', 'outputs.product', 'energyLogs', 'wastageLogs'])
            ->findOrFail($batch);
        $this->authorize('view', $batch);

        return new ProductionBatchResource($batch);
    }

    public function start(Request $request, $batch, ProductionService $productionService): JsonResponse
    {
        $batch = ProductionBatch::query()
            ->findOrFail($batch);
        $this->authorize('update', $batch);

        return response()->json([
            'message' => 'Production started',
            'batch' => (new ProductionBatchResource($productionService->startBatch($batch)))->resolve(),
        ]);
    }

    public function complete(CompleteProductionBatchRequest $request, $batch, ProductionService $productionService): JsonResponse
    {
        $businessId = $request->user()->current_business_id;

        $batch = ProductionBatch::query()
            ->findOrFail($batch);
        $this->authorize('update', $batch);
        $validated = $request->validated();

        return response()->json([
            'message' => 'Production completed',
            'batch' => (new ProductionBatchResource($productionService->completeBatch(
                $batch,
                $validated,
                $businessId,
            )))->resolve(),
        ]);
    }

    public function rawMaterials(Request $request)
    {
        return RawMaterial::query()
            ->where('business_id', $request->user()->current_business_id)
            ->orderBy('name')
            ->paginate(50);
    }

    public function storeRawMaterial(Request $request, ProductionService $productionService): JsonResponse
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'warehouse_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('warehouses', $businessId),
            ],
            'name' => 'required|string',
            'sku' => 'nullable|string',
            'unit' => 'nullable|string',
            'material_category' => 'nullable|string',
            'quantity' => 'nullable|numeric',
            'cost_per_unit' => 'nullable|numeric',
            'reorder_level' => 'nullable|integer',
            'description' => 'nullable|string',
            'supplier_name' => 'nullable|string',
            'supplier_phone' => 'nullable|string',
            'supplier_balance' => 'nullable|numeric|min:0',
            'last_purchase_cost' => 'nullable|numeric|min:0',
            'low_stock_threshold' => 'nullable|numeric|min:0',
        ]);

        $material = $productionService->createRawMaterial($validated, $businessId);

        return response()->json(['message' => 'Raw material created', 'material' => $material], 201);
    }

    public function adjustRawMaterial(AdjustRawMaterialRequest $request, $material, ProductionService $productionService): JsonResponse
    {
        $validated = $request->validated();

        $material = RawMaterial::query()
            ->findOrFail($material);
        $this->authorize('update', $material);

        $material = $productionService->adjustRawMaterial($material, $validated);

        return response()->json([
            'message' => 'Quantity adjusted',
            'new_quantity' => $material->quantity,
            'material' => (new RawMaterialResource($material))->resolve(),
        ]);
    }

    public function storePurchase(Request $request, ProductionService $productionService): JsonResponse
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'raw_material_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('raw_materials', $businessId),
            ],
            'supplier_name' => 'required|string',
            'supplier_phone' => 'nullable|string',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'required|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'purchased_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        return response()->json([
            'message' => 'Purchase logged',
            'purchase' => $productionService->recordPurchase($validated, $businessId),
        ], 201);
    }

    public function storeEnergyLog(Request $request, ProductionService $productionService): JsonResponse
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'production_batch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('production_batches', $businessId),
            ],
            'energy_source' => 'required|string',
            'runtime_hours' => 'nullable|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'fuel_litres' => 'nullable|numeric|min:0',
            'outage_minutes' => 'nullable|integer|min:0',
            'notes' => 'nullable|string',
            'logged_at' => 'nullable|date',
        ]);

        return response()->json([
            'message' => 'Energy log recorded',
            'log' => $productionService->recordEnergyLog($validated, $businessId),
        ], 201);
    }

    public function storeWastageLog(Request $request, ProductionService $productionService): JsonResponse
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'production_batch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('production_batches', $businessId),
            ],
            'raw_material_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('raw_materials', $businessId),
            ],
            'loss_type' => 'required|string',
            'quantity' => 'nullable|numeric|min:0',
            'estimated_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'logged_at' => 'nullable|date',
        ]);

        return response()->json([
            'message' => 'Wastage log recorded',
            'log' => $productionService->recordWastageLog($validated, $businessId),
        ], 201);
    }
}
