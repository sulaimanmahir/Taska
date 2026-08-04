<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Orders\ReturnOrderRequest;
use App\Http\Requests\Orders\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::where('business_id', $request->user()->current_business_id)
            ->with(['customer', 'createdBy']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->orderByDesc('created_at')->paginate(20);

        return response()->json($orders);
    }

    public function store(StoreOrderRequest $request, OrderService $orderService)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        $validated['business_id'] = $businessId;
        $validated['branch_id'] = $request->user()->current_branch_id;
        $validated['warehouse_id'] = $this->getDefaultWarehouse($businessId);

        try {
            $order = $orderService->createOrder($validated, $request->user()->id);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => $exception->errors(),
            ], 422);
        }

        return response()->json(
            (new OrderResource($order->load('items.product', 'customer', 'createdBy')))->resolve(),
            201
        );
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);

        return response()->json(
            (new OrderResource($order->load('items.product', 'customer', 'createdBy')))->resolve()
        );
    }

    public function returnOrder(ReturnOrderRequest $request, Order $order, OrderService $orderService)
    {
        $this->authorize('update', $order);

        $returnOrder = $orderService->createReturn(
            $order->id,
            $request->user()->current_business_id,
            $request->user()->id
        );

        return response()->json(
            (new OrderResource($returnOrder->load('items.product', 'customer', 'createdBy')))->resolve(),
            201
        );
    }

    public function todaySales(Request $request)
    {
        $businessId = $request->user()->current_business_id;
        
        $sales = Order::where('business_id', $businessId)
            ->whereDate('created_at', today())
            ->where('order_type', 'sale')
            ->where('status', 'completed')
            ->selectRaw('COUNT(*) as orders, SUM(total) as revenue, SUM(paid) as collected')
            ->first();

        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.business_id', $businessId)
            ->whereDate('orders.created_at', today())
            ->where('orders.order_type', 'sale')
            ->groupBy('products.id')
            ->selectRaw('products.name, SUM(order_items.quantity) as qty, SUM(order_items.total) as revenue')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        return response()->json([
            'orders' => $sales->orders ?? 0,
            'revenue' => $sales->revenue ?? 0,
            'collected' => $sales->collected ?? 0,
            'top_products' => $topProducts,
        ]);
    }

    private function getDefaultWarehouse(int $businessId): int
    {
        $warehouse = \App\Models\Warehouse::where('business_id', $businessId)
            ->where('is_default', true)
            ->first();
        
        if (!$warehouse) {
            $warehouse = \App\Models\Warehouse::where('business_id', $businessId)->first();
        }
        
        return $warehouse?->id ?? 1;
    }
}
