<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Delivery\ConfirmDeliveryOtpRequest;
use App\Http\Requests\Delivery\MarkDeliveryRequest;
use App\Http\Requests\Delivery\MarkFailedDeliveryRequest;
use App\Http\Requests\Delivery\MarkPickupRequest;
use App\Http\Requests\Delivery\RecordRemittanceRequest;
use App\Http\Requests\Delivery\SettleDeliveryOrderRequest;
use App\Http\Requests\Delivery\StoreDeliveryOrderRequest;
use App\Http\Resources\DeliveryOrderResource;
use App\Http\Resources\DeliverySettlementResource;
use App\Models\DeliveryOrder;
use App\Models\DeliverySettlement;
use App\Models\DeliveryWalletTransaction;
use App\Services\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeliveryController extends Controller
{
    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $statusSummary = DeliveryOrder::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'pending_pickup' THEN 1 ELSE 0 END), 0) as pickups_pending,
                COALESCE(SUM(CASE WHEN status IN ('picked_up', 'in_transit') THEN 1 ELSE 0 END), 0) as in_transit,
                COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) as delivered_total,
                COALESCE(SUM(CASE WHEN status IN ('failed', 'rescheduled') THEN 1 ELSE 0 END), 0) as exceptions_total,
                COALESCE(SUM(total_fee), 0) as gross_delivery_revenue,
                COALESCE(SUM(cod_amount - amount_remitted), 0) as pending_remittance,
                COALESCE(SUM(CASE WHEN cod_fraud_flagged = 1 THEN 1 ELSE 0 END), 0) as fraud_alerts,
                COALESCE(SUM(CASE WHEN status != 'delivered' AND created_at <= datetime('now', '-1 day') THEN 1 ELSE 0 END), 0) as ageing_parcels
            ")
            ->first();

        $settlementSummary = DeliverySettlement::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status != 'paid' THEN net_rider_payout ELSE 0 END), 0) as rider_payouts_pending,
                COALESCE(SUM(CASE WHEN status != 'paid' THEN net_owner_payout ELSE 0 END), 0) as investor_payouts_pending,
                COALESCE(SUM(company_retained_earnings), 0) as company_retained
            ")
            ->first();

        $riderScorecards = DeliveryOrder::query()
            ->where('delivery_orders.business_id', $businessId)
            ->leftJoin('users', 'users.id', '=', 'delivery_orders.assigned_rider_id')
            ->groupBy('delivery_orders.assigned_rider_id', 'users.name')
            ->selectRaw("
                delivery_orders.assigned_rider_id,
                COALESCE(users.name, 'Unassigned') as rider_name,
                COUNT(*) as total_jobs,
                SUM(CASE WHEN delivery_orders.status = 'delivered' THEN 1 ELSE 0 END) as delivered_jobs,
                SUM(CASE WHEN delivery_orders.status IN ('failed', 'rescheduled') THEN 1 ELSE 0 END) as failed_jobs,
                SUM(delivery_orders.cod_amount - delivery_orders.amount_remitted) as remittance_due
            ")
            ->orderByDesc('delivered_jobs')
            ->limit(5)
            ->get();

        $investorPayouts = DeliverySettlement::query()
            ->where('delivery_settlements.business_id', $businessId)
            ->leftJoin('delivery_vehicles', 'delivery_vehicles.id', '=', 'delivery_settlements.vehicle_id')
            ->groupBy('delivery_vehicles.owner_name')
            ->selectRaw("
                COALESCE(delivery_vehicles.owner_name, 'Unknown owner') as owner_name,
                SUM(delivery_settlements.net_owner_payout) as payout_due,
                SUM(delivery_settlements.total_delivery_fee) as routed_revenue
            ")
            ->orderByDesc('payout_due')
            ->limit(5)
            ->get();

        $routeEfficiency = DB::table('delivery_manifests')
            ->leftJoin('delivery_manifest_items', 'delivery_manifest_items.manifest_id', '=', 'delivery_manifests.id')
            ->leftJoin('delivery_orders', 'delivery_orders.id', '=', 'delivery_manifest_items.delivery_order_id')
            ->where('delivery_manifests.business_id', $businessId)
            ->selectRaw("
                COUNT(DISTINCT delivery_manifests.id) as manifest_count,
                COUNT(delivery_orders.id) as assigned_jobs,
                COALESCE(SUM(CASE WHEN delivery_orders.status = 'delivered' THEN 1 ELSE 0 END), 0) as delivered_jobs
            ")
            ->first();

        $walletBalances = DeliveryWalletTransaction::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                rider_id,
                COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0) as wallet_balance
            ")
            ->groupBy('rider_id')
            ->get();

        return response()->json([
            'summary' => [
                'pickups_pending' => (int) ($statusSummary?->pickups_pending ?? 0),
                'in_transit' => (int) ($statusSummary?->in_transit ?? 0),
                'delivered_total' => (int) ($statusSummary?->delivered_total ?? 0),
                'exceptions_total' => (int) ($statusSummary?->exceptions_total ?? 0),
                'gross_delivery_revenue' => (float) ($statusSummary?->gross_delivery_revenue ?? 0),
                'pending_remittance' => (float) ($statusSummary?->pending_remittance ?? 0),
                'fraud_alerts' => (int) ($statusSummary?->fraud_alerts ?? 0),
                'ageing_parcels' => (int) ($statusSummary?->ageing_parcels ?? 0),
                'rider_payouts_pending' => (float) ($settlementSummary?->rider_payouts_pending ?? 0),
                'investor_payouts_pending' => (float) ($settlementSummary?->investor_payouts_pending ?? 0),
                'company_retained' => (float) ($settlementSummary?->company_retained ?? 0),
            ],
            'rider_scorecards' => $riderScorecards,
            'investor_payouts' => $investorPayouts,
            'wallet_balances' => $walletBalances,
            'route_efficiency' => [
                'manifest_count' => (int) ($routeEfficiency?->manifest_count ?? 0),
                'assigned_jobs' => (int) ($routeEfficiency?->assigned_jobs ?? 0),
                'delivered_jobs' => (int) ($routeEfficiency?->delivered_jobs ?? 0),
            ],
        ]);
    }

    public function index(Request $request)
    {
        $orders = DeliveryOrder::query()
            ->where('business_id', $request->user()->current_business_id)
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')))
            ->with(['sender', 'recipient', 'assignedRider', 'vehicle', 'events', 'settlement', 'complaints'])
            ->latest()
            ->paginate((int) $request->integer('per_page', 20));

        return response()->json($orders);
    }

    public function store(StoreDeliveryOrderRequest $request, DeliveryService $deliveryService)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $order = $deliveryService->createOrder($validated, $businessId, $request->user()->id);

        return response()->json((new DeliveryOrderResource($order))->resolve(), 201);
    }

    public function show(Request $request, DeliveryOrder $delivery)
    {
        $this->authorize('view', $delivery);

        return response()->json(
            (new DeliveryOrderResource(
                $delivery->load(['sender', 'recipient', 'assignedRider', 'vehicle', 'events', 'settlement', 'complaints'])
            ))->resolve()
        );
    }

    public function markPickup(MarkPickupRequest $request, DeliveryOrder $delivery, DeliveryService $deliveryService)
    {
        $this->authorize('update', $delivery);
        $validated = $request->validated();

        return response()->json(
            (new DeliveryOrderResource($deliveryService->markPickedUp($delivery, $validated, $request->user()->id)))->resolve()
        );
    }

    public function markDelivery(MarkDeliveryRequest $request, DeliveryOrder $delivery, DeliveryService $deliveryService)
    {
        $this->authorize('update', $delivery);
        $validated = $request->validated();

        return response()->json(
            (new DeliveryOrderResource($deliveryService->markDelivered($delivery, $validated, $request->user()->id)))->resolve()
        );
    }

    public function markFailed(MarkFailedDeliveryRequest $request, DeliveryOrder $delivery, DeliveryService $deliveryService)
    {
        $this->authorize('update', $delivery);
        $validated = $request->validated();

        return response()->json(
            (new DeliveryOrderResource($deliveryService->markFailed($delivery, $validated, $request->user()->id)))->resolve()
        );
    }

    public function settle(SettleDeliveryOrderRequest $request, DeliveryOrder $delivery, DeliveryService $deliveryService)
    {
        $this->authorize('update', $delivery);
        $validated = $request->validated();

        return response()->json(
            (new DeliverySettlementResource(
                $deliveryService->createSettlement($delivery, $validated)->load(['order', 'vehicle', 'rider'])
            ))->resolve()
        );
    }

    public function recordRemittance(RecordRemittanceRequest $request, DeliveryOrder $delivery, DeliveryService $deliveryService)
    {
        $this->authorize('update', $delivery);
        $validated = $request->validated();

        return response()->json(
            (new DeliveryOrderResource($deliveryService->recordRemittance($delivery, $validated, $request->user()->id)))->resolve()
        );
    }

    public function markSettlementPaid(Request $request, DeliveryOrder $delivery, DeliveryService $deliveryService)
    {
        $this->authorize('update', $delivery);

        return response()->json(
            (new DeliverySettlementResource(
                $deliveryService->markSettlementPaid($delivery, $request->user()->id)->load(['order', 'vehicle', 'rider'])
            ))->resolve()
        );
    }

    public function confirmOtp(ConfirmDeliveryOtpRequest $request, DeliveryOrder $delivery, DeliveryService $deliveryService)
    {
        $this->authorize('update', $delivery);
        $validated = $request->validated();

        return response()->json(
            (new DeliveryOrderResource(
                $deliveryService->confirmDeliveryOtp($delivery, $validated['otp_code'], $request->user()->id)
            ))->resolve()
        );
    }

    public function trackByCode(string $trackingCode)
    {
        $delivery = DeliveryOrder::query()
            ->where('tracking_code', $trackingCode)
            ->with(['sender', 'recipient', 'events'])
            ->firstOrFail();

        return response()->json([
            'tracking_code' => $delivery->tracking_code,
            'status' => $delivery->status,
            'parcel_category' => $delivery->parcel_category,
            'pickup_address' => $delivery->pickup_address,
            'dropoff_address' => $delivery->dropoff_address,
            'sender_name' => $delivery->sender?->name,
            'recipient_name' => $delivery->recipient?->name,
            'delivered_at' => $delivery->delivered_at,
            'otp_verified_at' => $delivery->delivery_otp_verified_at,
            'events' => $delivery->events->map(fn ($event) => [
                'status' => $event->status,
                'notes' => $event->notes,
                'recorded_at' => $event->created_at,
            ]),
        ]);
    }
}
