<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Restaurant\CloseRestaurantTicketRequest;
use App\Http\Requests\Restaurant\UpdateKitchenTicketStatusRequest;
use App\Http\Resources\RestaurantTicketResource;
use App\Models\FoodWasteLog;
use App\Models\KitchenTicket;
use App\Models\RecipeCard;
use App\Models\RestaurantTable;
use App\Models\RestaurantTicket;
use App\Models\RestaurantWaiterShift;
use App\Models\TableReservation;
use App\Services\RestaurantService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RestaurantController extends Controller
{
    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $ticketSummary = RestaurantTicket::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN total ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') AND order_channel = 'takeaway' THEN 1 ELSE 0 END), 0) as takeaway_today,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') AND order_channel = 'delivery' THEN 1 ELSE 0 END), 0) as delivery_today,
                COALESCE(SUM(CASE WHEN service_status IN ('open', 'preparing', 'ready', 'served') THEN 1 ELSE 0 END), 0) as open_tickets,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN gross_margin ELSE 0 END), 0) as gross_margin_today
            ")
            ->first();

        return response()->json([
            'summary' => [
                'active_tables' => RestaurantTable::where('business_id', $businessId)->whereIn('status', ['occupied', 'reserved'])->count(),
                'open_tickets' => (int) ($ticketSummary?->open_tickets ?? 0),
                'takeaway_today' => (int) ($ticketSummary?->takeaway_today ?? 0),
                'delivery_today' => (int) ($ticketSummary?->delivery_today ?? 0),
                'revenue_today' => (float) ($ticketSummary?->revenue_today ?? 0),
                'gross_margin_today' => (float) ($ticketSummary?->gross_margin_today ?? 0),
                'waste_cost_today' => (float) FoodWasteLog::where('business_id', $businessId)->whereDate('logged_at', today())->sum('cost_impact'),
                'pending_kitchen_tickets' => KitchenTicket::where('business_id', $businessId)->whereIn('status', ['queued', 'preparing'])->count(),
                'open_waiter_shifts' => RestaurantWaiterShift::where('business_id', $businessId)->where('status', 'open')->count(),
                'upcoming_reservations' => TableReservation::where('business_id', $businessId)->where('reservation_for', '>=', now())->count(),
            ],
        ]);
    }

    public function tables(Request $request)
    {
        return response()->json(
            RestaurantTable::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with('reservations')
                ->orderBy('name')
                ->get()
        );
    }

    public function storeTable(Request $request, RestaurantService $restaurantService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'name' => 'required|string|max:100',
            'zone' => 'nullable|string|max:100',
            'seats' => 'nullable|integer|min:1',
            'status' => 'nullable|in:available,occupied,reserved,out_of_service',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $restaurantService->createTable($validated, $businessId),
            201
        );
    }

    public function shifts(Request $request)
    {
        return response()->json(
            RestaurantWaiterShift::query()
                ->where('business_id', $request->user()->current_business_id)
                ->latest('started_at')
                ->get()
        );
    }

    public function storeShift(Request $request, RestaurantService $restaurantService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'staff_id' => [
                'nullable',
                'integer',
                $this->activeBusinessUserRule($businessId),
            ],
            'staff_name' => 'required|string|max:255',
            'started_at' => 'required|date',
            'ended_at' => 'nullable|date|after_or_equal:started_at',
            'cash_variance' => 'nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $restaurantService->createShift($validated, $businessId),
            201
        );
    }

    public function recipes(Request $request)
    {
        return response()->json(
            RecipeCard::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with(['product', 'ingredients.ingredientProduct'])
                ->latest()
                ->get()
        );
    }

    public function storeRecipe(Request $request, RestaurantService $restaurantService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'yield_quantity' => 'nullable|numeric|min:0.001',
            'prep_station' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'ingredients' => 'nullable|array|min:1',
            'ingredients.*.ingredient_product_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'ingredients.*.quantity' => 'required|numeric|min:0.001',
            'ingredients.*.unit_cost' => 'required|numeric|min:0',
            'ingredients.*.notes' => 'nullable|string',
        ]);

        return response()->json(
            $restaurantService->createRecipe($validated, $businessId),
            201
        );
    }

    public function reservations(Request $request)
    {
        return response()->json(
            TableReservation::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with('table')
                ->orderBy('reservation_for')
                ->get()
        );
    }

    public function storeReservation(Request $request, RestaurantService $restaurantService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'table_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('restaurant_tables', $businessId),
            ],
            'guest_name' => 'required|string|max:255',
            'guest_phone' => 'nullable|string|max:50',
            'reservation_for' => 'required|date',
            'party_size' => 'nullable|integer|min:1',
            'status' => 'nullable|in:reserved,seated,completed,cancelled,no_show',
            'occasion' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $restaurantService->createReservation($validated, $businessId),
            201
        );
    }

    public function tickets(Request $request)
    {
        return response()->json(
            RestaurantTicket::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with(['items.product', 'table', 'waiterShift', 'kitchenTicket'])
                ->latest()
                ->get()
        );
    }

    public function storeTicket(Request $request, RestaurantService $restaurantService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'table_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('restaurant_tables', $businessId),
            ],
            'customer_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('customers', $businessId),
            ],
            'waiter_shift_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('restaurant_waiter_shifts', $businessId),
            ],
            'guest_name' => 'nullable|string|max:255',
            'delivery_address' => 'nullable|string',
            'order_channel' => 'nullable|in:dine_in,takeaway,delivery',
            'split_count' => 'nullable|integer|min:1',
            'service_charge' => 'nullable|numeric|min:0',
            'delivery_fee' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'priority' => 'nullable|in:normal,urgent',
            'station' => 'nullable|string|max:100',
            'kitchen_notes' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.course_name' => 'nullable|string|max:100',
            'items.*.notes' => 'nullable|string',
        ]);

        return response()->json(
            $restaurantService->createTicket($validated, $businessId),
            201
        );
    }

    public function kitchenBoard(Request $request)
    {
        return response()->json(
            KitchenTicket::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with(['ticket.items.product', 'ticket.table', 'ticket.waiterShift'])
                ->latest()
                ->get()
        );
    }

    public function updateKitchenStatus(UpdateKitchenTicketStatusRequest $request, RestaurantTicket $ticket, RestaurantService $restaurantService)
    {
        $this->authorize('update', $ticket);

        return new RestaurantTicketResource(
            $restaurantService->updateKitchenStatus($ticket, $request->validated())
        );
    }

    public function closeTicket(CloseRestaurantTicketRequest $request, RestaurantTicket $ticket, RestaurantService $restaurantService)
    {
        $this->authorize('update', $ticket);

        return new RestaurantTicketResource(
            $restaurantService->closeTicket($ticket, $request->validated())
        );
    }

    public function wasteLogs(Request $request)
    {
        return response()->json(
            FoodWasteLog::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with(['product', 'recipeCard.product'])
                ->latest('logged_at')
                ->get()
        );
    }

    public function storeWasteLog(Request $request, RestaurantService $restaurantService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'product_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'recipe_card_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('recipe_cards', $businessId),
            ],
            'quantity' => 'required|numeric|min:0.001',
            'cost_impact' => 'required|numeric|min:0',
            'waste_type' => 'nullable|in:kitchen_loss,plate_return,spoiled_stock,burnt_food,delivery_return',
            'logged_at' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $restaurantService->logWaste($validated, $businessId),
            201
        );
    }

    private function businessOwnedRule(string $table, int $businessId)
    {
        return Rule::exists($table, 'id')->where(fn ($query) => $query->where('business_id', $businessId));
    }

    private function activeBusinessUserRule(int $businessId)
    {
        return Rule::exists('users', 'id')->where(function ($query) use ($businessId) {
            $query->whereExists(function ($subQuery) use ($businessId) {
                $subQuery->selectRaw('1')
                    ->from('business_user')
                    ->whereColumn('business_user.user_id', 'users.id')
                    ->where('business_user.business_id', $businessId)
                    ->where('business_user.status', 'active');
            });
        });
    }
}
