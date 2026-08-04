<?php

namespace App\Services;

use App\Models\HotelBooking;
use App\Models\HotelHousekeepingLog;
use App\Models\HotelMaintenanceRequest;
use App\Models\HotelRoom;
use App\Models\HotelRoomInspectionLog;
use App\Models\HotelStaffShiftLog;
use Illuminate\Support\Facades\DB;

class HotelService
{
    public function createRoom(array $payload, int $businessId): HotelRoom
    {
        return HotelRoom::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function updateRoom(HotelRoom $room, array $payload): HotelRoom
    {
        $room->update($payload);

        return $room->fresh();
    }

    public function createBooking(array $payload, int $businessId): HotelBooking
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $room = HotelRoom::query()
                ->where('business_id', $businessId)
                ->findOrFail($payload['room_id']);

            $isRepeatGuest = HotelBooking::query()
                ->where('business_id', $businessId)
                ->where('guest_phone', $payload['guest_phone'] ?? null)
                ->exists();

            $extraGuestChargeTotal = max((int) ($payload['extra_guests'] ?? 0), 0) * (float) $room->extra_guest_charge;
            $earlyCheckinChargeTotal = !empty($payload['apply_early_checkin_charge']) ? (float) $room->early_checkin_charge : 0;
            $lateCheckoutChargeTotal = !empty($payload['apply_late_checkout_charge']) ? (float) $room->late_checkout_charge : 0;
            $roomRate = (float) ($payload['room_rate'] ?? $room->base_rate);
            $totalAmount = $roomRate + $extraGuestChargeTotal + $earlyCheckinChargeTotal + $lateCheckoutChargeTotal;

            $booking = HotelBooking::create([
                'business_id' => $businessId,
                'branch_id' => $payload['branch_id'] ?? null,
                'room_id' => $room->id,
                'reservation_code' => $this->generateReservationCode($businessId),
                'guest_name' => $payload['guest_name'],
                'guest_phone' => $payload['guest_phone'] ?? null,
                'guest_email' => $payload['guest_email'] ?? null,
                'status' => 'reserved',
                'check_in_date' => $payload['check_in_date'],
                'check_out_date' => $payload['check_out_date'],
                'adults' => $payload['adults'] ?? 1,
                'extra_guests' => $payload['extra_guests'] ?? 0,
                'is_repeat_guest' => $isRepeatGuest,
                'payment_method' => $payload['payment_method'] ?? 'cash',
                'room_rate' => $roomRate,
                'extra_guest_charge_total' => $extraGuestChargeTotal,
                'late_checkout_charge_total' => $lateCheckoutChargeTotal,
                'early_checkin_charge_total' => $earlyCheckinChargeTotal,
                'total_amount' => $totalAmount,
                'amount_paid' => $payload['amount_paid'] ?? 0,
                'notes' => $payload['notes'] ?? null,
            ]);

            $room->update([
                'status' => 'reserved',
            ]);

            return $booking->load('room');
        });
    }

    public function checkIn(HotelBooking $booking): HotelBooking
    {
        return DB::transaction(function () use ($booking) {
            $booking->update([
                'status' => 'checked_in',
                'actual_check_in_at' => now(),
            ]);

            $booking->room()->update([
                'status' => 'occupied',
                'cleaning_status' => 'dirty',
            ]);

            return $booking->fresh('room');
        });
    }

    public function checkOut(HotelBooking $booking, array $payload = []): HotelBooking
    {
        return DB::transaction(function () use ($booking, $payload) {
            $booking->update([
                'status' => 'checked_out',
                'actual_check_out_at' => now(),
                'late_checkout_charge_total' => $payload['late_checkout_charge_total'] ?? $booking->late_checkout_charge_total,
                'amount_paid' => $payload['amount_paid'] ?? $booking->amount_paid,
            ]);

            $booking->room()->update([
                'status' => 'cleaning',
                'cleaning_status' => 'dirty',
            ]);

            HotelHousekeepingLog::create([
                'business_id' => $booking->business_id,
                'room_id' => $booking->room_id,
                'status' => 'pending',
                'notes' => 'Room requires turnaround cleaning after checkout.',
                'logged_at' => now(),
            ]);

            return $booking->fresh('room');
        });
    }

    public function logHousekeeping(array $payload, int $businessId): HotelHousekeepingLog
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $log = HotelHousekeepingLog::create([
                ...$payload,
                'business_id' => $businessId,
                'logged_at' => $payload['logged_at'] ?? now(),
            ]);

            $statusMap = [
                'pending' => ['status' => 'cleaning', 'cleaning_status' => 'dirty'],
                'in_progress' => ['status' => 'cleaning', 'cleaning_status' => 'in_progress'],
                'cleaned' => ['status' => 'available', 'cleaning_status' => 'clean'],
                'inspected' => ['status' => 'available', 'cleaning_status' => 'inspected'],
            ];

            $log->room()->update($statusMap[$log->status] ?? ['status' => 'cleaning']);

            return $log->load('room');
        });
    }

    public function createMaintenanceRequest(array $payload, int $businessId): HotelMaintenanceRequest
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $request = HotelMaintenanceRequest::create([
                ...$payload,
                'business_id' => $businessId,
                'status' => $payload['status'] ?? 'open',
            ]);

            $request->room()->update([
                'status' => ($payload['status'] ?? 'open') === 'resolved' ? 'available' : 'out_of_service',
            ]);

            return $request->load('room');
        });
    }

    public function createInspection(array $payload, int $businessId): HotelRoomInspectionLog
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $inspection = HotelRoomInspectionLog::create([
                ...$payload,
                'business_id' => $businessId,
                'inspected_at' => $payload['inspected_at'] ?? now(),
            ]);

            $inspection->room()->update([
                'cleaning_status' => $inspection->status === 'pass' ? 'inspected' : 'dirty',
                'status' => $inspection->status === 'pass' ? 'available' : 'cleaning',
            ]);

            return $inspection->load('room');
        });
    }

    public function createShift(array $payload, int $businessId): HotelStaffShiftLog
    {
        return HotelStaffShiftLog::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    private function generateReservationCode(int $businessId): string
    {
        return 'HTL-' . $businessId . '-' . strtoupper(str()->random(6));
    }
}
