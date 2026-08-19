<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Hotel\CheckOutHotelBookingRequest;
use App\Http\Requests\Hotel\UpdateHotelRoomRequest;
use App\Http\Resources\HotelBookingResource;
use App\Http\Resources\HotelRoomResource;
use App\Models\HotelBooking;
use App\Models\HotelHousekeepingLog;
use App\Models\HotelMaintenanceRequest;
use App\Models\HotelRoom;
use App\Models\HotelRoomInspectionLog;
use App\Models\HotelStaffShiftLog;
use App\Services\HotelService;
use Illuminate\Http\Request;

class HotelController extends Controller
{
    use ValidatesBusinessOwnership;

    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $roomSummary = HotelRoom::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COUNT(*) as total_rooms,
                COALESCE(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0) as occupied_rooms,
                COALESCE(SUM(CASE WHEN status IN ('blocked', 'out_of_service') THEN 1 ELSE 0 END), 0) as blocked_rooms,
                COALESCE(SUM(CASE WHEN cleaning_status IN ('dirty', 'in_progress') THEN 1 ELSE 0 END), 0) as cleaning_attention
            ")
            ->first();

        $bookingSummary = HotelBooking::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(actual_check_in_at) = date('now') THEN 1 ELSE 0 END), 0) as checkins_today,
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN total_amount ELSE 0 END), 0) as revenue_today,
                COALESCE(SUM(CASE WHEN is_repeat_guest = 1 THEN 1 ELSE 0 END), 0) as repeat_guests
            ")
            ->first();

        $paymentMethodReport = HotelBooking::query()
            ->where('business_id', $businessId)
            ->whereNotNull('payment_method')
            ->selectRaw('payment_method, COUNT(*) as booking_count, COALESCE(SUM(amount_paid), 0) as amount_paid')
            ->groupBy('payment_method')
            ->orderByDesc('amount_paid')
            ->get();

        $occupancyTrends = HotelBooking::query()
            ->where('business_id', $businessId)
            ->whereNotNull('actual_check_in_at')
            ->selectRaw("date(actual_check_in_at) as date_label, COUNT(*) as checkins")
            ->groupBy('date_label')
            ->orderByDesc('date_label')
            ->limit(7)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'summary' => [
                'total_rooms' => (int) ($roomSummary?->total_rooms ?? 0),
                'occupied_rooms' => (int) ($roomSummary?->occupied_rooms ?? 0),
                'blocked_rooms' => (int) ($roomSummary?->blocked_rooms ?? 0),
                'cleaning_attention' => (int) ($roomSummary?->cleaning_attention ?? 0),
                'checkins_today' => (int) ($bookingSummary?->checkins_today ?? 0),
                'revenue_today' => (float) ($bookingSummary?->revenue_today ?? 0),
                'repeat_guests' => (int) ($bookingSummary?->repeat_guests ?? 0),
                'occupancy_rate' => (int) (($roomSummary?->total_rooms ?? 0) > 0 ? round((($roomSummary?->occupied_rooms ?? 0) / $roomSummary->total_rooms) * 100) : 0),
            ],
            'payment_method_report' => $paymentMethodReport,
            'occupancy_trends' => $occupancyTrends,
            'maintenance_open' => HotelMaintenanceRequest::where('business_id', $businessId)->where('status', '!=', 'resolved')->count(),
            'shifts_active' => HotelStaffShiftLog::where('business_id', $businessId)->whereNull('ended_at')->count(),
        ]);
    }

    public function rooms(Request $request)
    {
        return response()->json(
            HotelRoom::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with(['housekeepingLogs', 'maintenanceRequests', 'inspections'])
                ->orderBy('room_number')
                ->get()
        );
    }

    public function storeRoom(Request $request, HotelService $hotelService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'room_number' => 'required|string|max:50',
            'category' => 'required|string|max:100',
            'floor' => 'nullable|string|max:50',
            'status' => 'nullable|in:available,reserved,occupied,cleaning,blocked,out_of_service',
            'cleaning_status' => 'nullable|in:clean,dirty,in_progress,inspected',
            'base_rate' => 'nullable|numeric|min:0',
            'extra_guest_charge' => 'nullable|numeric|min:0',
            'late_checkout_charge' => 'nullable|numeric|min:0',
            'early_checkin_charge' => 'nullable|numeric|min:0',
            'blocked_reason' => 'nullable|string',
        ]);

        return response()->json(
            $hotelService->createRoom($validated, $businessId),
            201
        );
    }

    public function updateRoom(UpdateHotelRoomRequest $request, HotelRoom $room, HotelService $hotelService)
    {
        $this->authorize('update', $room);
        $validated = $request->validated();

        return response()->json(
            (new HotelRoomResource($hotelService->updateRoom($room, $validated)))->resolve()
        );
    }

    public function bookings(Request $request)
    {
        return response()->json(
            HotelBooking::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with('room')
                ->latest()
                ->get()
        );
    }

    public function storeBooking(Request $request, HotelService $hotelService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'room_id' => ['required', $this->businessOwnedRule('hotel_rooms', $businessId)],
            'guest_name' => 'required|string|max:255',
            'guest_phone' => 'nullable|string|max:50',
            'guest_email' => 'nullable|email',
            'check_in_date' => 'required|date',
            'check_out_date' => 'required|date|after_or_equal:check_in_date',
            'adults' => 'nullable|integer|min:1',
            'extra_guests' => 'nullable|integer|min:0',
            'payment_method' => 'nullable|string|max:50',
            'amount_paid' => 'nullable|numeric|min:0',
            'apply_early_checkin_charge' => 'nullable|boolean',
            'apply_late_checkout_charge' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $hotelService->createBooking($validated, $businessId),
            201
        );
    }

    public function checkIn(Request $request, HotelBooking $booking, HotelService $hotelService)
    {
        $this->authorize('update', $booking);

        return response()->json(
            (new HotelBookingResource($hotelService->checkIn($booking)))->resolve()
        );
    }

    public function checkOut(CheckOutHotelBookingRequest $request, HotelBooking $booking, HotelService $hotelService)
    {
        $this->authorize('update', $booking);
        $validated = $request->validated();

        return response()->json(
            (new HotelBookingResource($hotelService->checkOut($booking, $validated)))->resolve()
        );
    }

    public function reservationCalendar(Request $request)
    {
        return response()->json(
            HotelBooking::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with('room')
                ->get()
                ->map(fn (HotelBooking $booking) => [
                    'id' => $booking->id,
                    'reservation_code' => $booking->reservation_code,
                    'guest_name' => $booking->guest_name,
                    'status' => $booking->status,
                    'room_number' => $booking->room?->room_number,
                    'check_in_date' => $booking->check_in_date,
                    'check_out_date' => $booking->check_out_date,
                ])
        );
    }

    public function housekeeping(Request $request, HotelService $hotelService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'room_id' => ['required', $this->businessOwnedRule('hotel_rooms', $businessId)],
            'assigned_to' => ['nullable', $this->activeBusinessUserRule($businessId)],
            'status' => 'required|in:pending,in_progress,cleaned,inspected',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $hotelService->logHousekeeping($validated, $businessId),
            201
        );
    }

    public function maintenance(Request $request, HotelService $hotelService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'room_id' => ['required', $this->businessOwnedRule('hotel_rooms', $businessId)],
            'title' => 'required|string|max:255',
            'details' => 'nullable|string',
            'priority' => 'nullable|in:low,medium,high',
            'status' => 'nullable|in:open,in_progress,resolved',
        ]);

        $validated['reported_by'] = $request->user()->id;

        return response()->json(
            $hotelService->createMaintenanceRequest($validated, $businessId),
            201
        );
    }

    public function inspection(Request $request, HotelService $hotelService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'room_id' => ['required', $this->businessOwnedRule('hotel_rooms', $businessId)],
            'status' => 'required|in:pass,fail',
            'notes' => 'nullable|string',
        ]);

        $validated['inspected_by'] = $request->user()->id;

        return response()->json(
            $hotelService->createInspection($validated, $businessId),
            201
        );
    }

    public function shifts(Request $request, HotelService $hotelService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => ['nullable', $this->businessOwnedRule('branches', $businessId)],
            'staff_id' => ['nullable', $this->activeBusinessUserRule($businessId)],
            'staff_name' => 'required|string|max:255',
            'shift_role' => 'required|string|max:100',
            'started_at' => 'required|date',
            'ended_at' => 'nullable|date|after_or_equal:started_at',
            'notes' => 'nullable|string',
        ]);

        return response()->json(
            $hotelService->createShift($validated, $businessId),
            201
        );
    }
}
