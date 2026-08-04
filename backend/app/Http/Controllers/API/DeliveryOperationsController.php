<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Delivery\StoreDeliveryComplaintRequest;
use App\Http\Requests\Delivery\StoreDeliveryDisputeRequest;
use App\Http\Requests\Delivery\StoreDeliveryManifestRequest;
use App\Http\Resources\DeliveryComplaintResource;
use App\Http\Resources\DeliveryDisputeResource;
use App\Http\Resources\DeliveryManifestResource;
use App\Models\DeliveryDispute;
use App\Models\DeliveryManifest;
use App\Models\DeliveryOrder;
use App\Models\DeliveryStatusEvent;
use App\Models\DeliveryComplaint;
use App\Models\DeliveryWalletTransaction;
use App\Services\DeliveryService;
use Illuminate\Http\Request;

class DeliveryOperationsController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $manifests = DeliveryManifest::query()
            ->where('business_id', $businessId)
            ->with(['vehicle', 'rider', 'orders'])
            ->latest()
            ->limit(5)
            ->get();

        $disputes = DeliveryDispute::query()
            ->where('business_id', $businessId)
            ->with(['order', 'creator'])
            ->latest()
            ->limit(5)
            ->get();

        $complaints = DeliveryComplaint::query()
            ->where('business_id', $businessId)
            ->with(['order', 'creator'])
            ->latest()
            ->limit(5)
            ->get();

        $remittanceHistory = DeliveryStatusEvent::query()
            ->where('business_id', $businessId)
            ->where('status', 'remittance_recorded')
            ->with(['order', 'user'])
            ->latest()
            ->limit(10)
            ->get();

        $walletActivity = DeliveryWalletTransaction::query()
            ->where('business_id', $businessId)
            ->with(['order', 'rider'])
            ->latest()
            ->limit(10)
            ->get();

        $manifestCandidates = DeliveryOrder::query()
            ->where('business_id', $businessId)
            ->whereIn('status', ['pending_pickup', 'picked_up', 'in_transit', 'rescheduled'])
            ->with(['sender', 'recipient'])
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'manifests' => $manifests,
            'disputes' => $disputes,
            'complaints' => $complaints,
            'remittance_history' => $remittanceHistory,
            'wallet_activity' => $walletActivity,
            'manifest_candidates' => $manifestCandidates,
        ]);
    }

    public function storeManifest(StoreDeliveryManifestRequest $request, DeliveryService $deliveryService)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $manifest = $deliveryService->createManifest(
            $validated,
            $businessId,
            $request->user()->id
        );

        return response()->json(
            (new DeliveryManifestResource($manifest))->resolve(),
            201
        );
    }

    public function storeDispute(StoreDeliveryDisputeRequest $request, DeliveryOrder $delivery, DeliveryService $deliveryService)
    {
        $this->authorize('update', $delivery);
        $validated = $request->validated();

        $dispute = $deliveryService->createDispute($delivery, $validated, $request->user()->id);

        return response()->json(
            (new DeliveryDisputeResource($dispute))->resolve(),
            201
        );
    }

    public function storeComplaint(StoreDeliveryComplaintRequest $request, DeliveryOrder $delivery, DeliveryService $deliveryService)
    {
        $this->authorize('update', $delivery);
        $validated = $request->validated();

        $complaint = $deliveryService->createComplaint($delivery, $validated, $request->user()->id);

        return response()->json(
            (new DeliveryComplaintResource($complaint))->resolve(),
            201
        );
    }
}
