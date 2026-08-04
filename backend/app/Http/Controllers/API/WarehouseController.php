<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWarehouseRequest;
use App\Http\Requests\UpdateWarehouseRequest;
use App\Models\Warehouse;
use App\Services\BusinessWarehouseService;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function __construct(
        private BusinessWarehouseService $businessWarehouseService,
    ) {
    }

    public function index(Request $request)
    {
        return $this->businessWarehouseService->getWarehouses($request->user());
    }

    public function store(StoreWarehouseRequest $request)
    {
        return response()->json(
            $this->businessWarehouseService->createWarehouse($request->user(), $request->validated()),
            201
        );
    }

    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse)
    {
        return response()->json(
            $this->businessWarehouseService->updateWarehouse($request->user(), $warehouse, $request->validated())
        );
    }
}
