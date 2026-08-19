<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Farm\StoreFarmHarvestLogRequest;
use App\Http\Requests\Farm\StoreFarmInputLogRequest;
use App\Http\Requests\Farm\StoreFarmPlantingCycleRequest;
use App\Http\Resources\FarmHarvestLogResource;
use App\Http\Resources\FarmInputLogResource;
use App\Http\Resources\FarmPlantingCycleResource;
use App\Services\FarmService;
use Illuminate\Http\Request;

class FarmController extends Controller
{
    use ValidatesBusinessOwnership;

    public function __construct(
        private FarmService $service,
    ) {
    }

    public function overview(Request $request)
    {
        return response()->json($this->service->overview($request->user()->current_business_id));
    }

    public function storePlot(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'size_hectares' => 'nullable|numeric|min:0',
            'soil_type' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,fallow,inactive',
        ]);

        return response()->json(
            $this->service->createPlot($validated, $request->user()->current_business_id, $request->user()->current_branch_id),
            201
        );
    }

    public function storePlantingCycle(StoreFarmPlantingCycleRequest $request)
    {
        return response()->json((new FarmPlantingCycleResource(
            $this->service->createPlantingCycle($request->validated(), $request->user()->current_business_id)
        ))->resolve(), 201);
    }

    public function storeInputLog(StoreFarmInputLogRequest $request)
    {
        return response()->json((new FarmInputLogResource(
            $this->service->createInputLog($request->validated(), $request->user()->current_business_id)
        ))->resolve(), 201);
    }

    public function storeHarvestLog(StoreFarmHarvestLogRequest $request)
    {
        return response()->json((new FarmHarvestLogResource(
            $this->service->createHarvestLog($request->validated(), $request->user()->current_business_id)
        ))->resolve(), 201);
    }
}
