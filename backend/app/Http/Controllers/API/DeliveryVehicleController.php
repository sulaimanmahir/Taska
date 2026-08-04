<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Delivery\StoreDeliveryVehicleRequest;
use App\Http\Resources\DeliveryVehicleResource;
use App\Models\DeliveryVehicle;
use Illuminate\Http\Request;

class DeliveryVehicleController extends Controller
{
    public function index(Request $request)
    {
        $vehicles = DeliveryVehicle::query()
            ->where('business_id', $request->user()->current_business_id)
            ->with(['assignedRider', 'branch'])
            ->withCount('orders')
            ->latest()
            ->get();

        return response()->json(DeliveryVehicleResource::collection($vehicles));
    }

    public function store(StoreDeliveryVehicleRequest $request)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $validated['business_id'] = $businessId;

        $vehicle = DeliveryVehicle::create($validated);

        return response()->json(
            (new DeliveryVehicleResource($vehicle->load(['assignedRider', 'branch'])))->resolve(),
            201
        );
    }
}
