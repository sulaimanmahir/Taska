<?php

namespace Tests\Feature;

use App\Models\HotelBooking;
use App\Models\HotelRoom;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class HotelWorkflowStateTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_hotel_business_can_update_room_and_progress_booking_through_checkin_checkout(): void
    {
        $tenant = $this->createTenantContext('hotel', 'hotel-workflow@example.com');

        Sanctum::actingAs($tenant['user']);

        $room = HotelRoom::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'room_number' => '101',
            'category' => 'Deluxe',
            'status' => 'available',
            'cleaning_status' => 'clean',
            'base_rate' => 25000,
            'extra_guest_charge' => 3000,
            'late_checkout_charge' => 5000,
            'early_checkin_charge' => 4000,
        ]);

        $booking = HotelBooking::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'room_id' => $room->id,
            'reservation_code' => 'HTL-001',
            'guest_name' => 'Aisha Garba',
            'status' => 'reserved',
            'check_in_date' => now()->toDateString(),
            'check_out_date' => now()->addDay()->toDateString(),
            'adults' => 2,
            'extra_guests' => 0,
            'payment_method' => 'cash',
            'room_rate' => 25000,
            'total_amount' => 25000,
            'amount_paid' => 10000,
        ]);

        $this->patchJson("/api/hotel/rooms/{$room->id}", [
            'status' => 'blocked',
            'cleaning_status' => 'dirty',
            'blocked_reason' => 'Temporary plumbing repair',
        ])->assertOk()
            ->assertJsonPath('status', 'blocked')
            ->assertJsonPath('blocked_reason', 'Temporary plumbing repair');

        $room->update([
            'status' => 'reserved',
            'cleaning_status' => 'clean',
        ]);

        $this->postJson("/api/hotel/bookings/{$booking->id}/check-in")
            ->assertOk()
            ->assertJsonPath('status', 'checked_in')
            ->assertJsonPath('room.status', 'occupied')
            ->assertJsonPath('room.cleaning_status', 'dirty');

        $this->postJson("/api/hotel/bookings/{$booking->id}/check-out", [
            'late_checkout_charge_total' => 5000,
            'amount_paid' => 30000,
        ])->assertOk()
            ->assertJsonPath('status', 'checked_out')
            ->assertJsonPath('late_checkout_charge_total', '5000.00')
            ->assertJsonPath('room.status', 'cleaning')
            ->assertJsonPath('room.cleaning_status', 'dirty');
    }

    public function test_hotel_room_and_booking_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('hotel', 'hotel-owner@example.com');
        $otherTenant = $this->createTenantContext('hotel', 'hotel-guest@example.com');

        $room = HotelRoom::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'room_number' => '202',
            'category' => 'Suite',
            'status' => 'available',
            'cleaning_status' => 'clean',
        ]);

        $booking = HotelBooking::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'room_id' => $room->id,
            'reservation_code' => 'HTL-002',
            'guest_name' => 'Guest Owner',
            'status' => 'reserved',
            'check_in_date' => now()->toDateString(),
            'check_out_date' => now()->addDay()->toDateString(),
            'room_rate' => 15000,
            'total_amount' => 15000,
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->patchJson("/api/hotel/rooms/{$room->id}", [
            'status' => 'out_of_service',
        ])->assertForbidden();

        $this->postJson("/api/hotel/bookings/{$booking->id}/check-in")
            ->assertForbidden();
    }
}
