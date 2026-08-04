<?php

namespace Tests\Feature;

use App\Models\HotelBooking;
use App\Models\HotelRoom;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class HotelOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_hotel_can_manage_room_booking_checkout_and_housekeeping(): void
    {
        $tenant = $this->createTenantContext('hotel', 'hotel-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $roomId = $this->postJson('/api/hotel/rooms', [
            'branch_id' => $tenant['branch']->id,
            'room_number' => '201',
            'category' => 'Executive',
            'floor' => '2',
            'base_rate' => 65000,
            'extra_guest_charge' => 5000,
            'late_checkout_charge' => 8000,
            'early_checkin_charge' => 7000,
        ])->assertCreated()
            ->assertJsonPath('room_number', '201')
            ->json('id');

        $bookingId = $this->postJson('/api/hotel/bookings', [
            'branch_id' => $tenant['branch']->id,
            'room_id' => $roomId,
            'guest_name' => 'Adaora Eze',
            'guest_phone' => '08031234567',
            'check_in_date' => now()->toDateString(),
            'check_out_date' => now()->addDay()->toDateString(),
            'adults' => 2,
            'extra_guests' => 1,
            'payment_method' => 'transfer',
            'amount_paid' => 70000,
            'apply_early_checkin_charge' => true,
        ])->assertCreated()
            ->assertJsonPath('status', 'reserved')
            ->assertJsonPath('is_repeat_guest', false)
            ->json('id');

        $this->postJson("/api/hotel/bookings/{$bookingId}/check-in")
            ->assertOk()
            ->assertJsonPath('status', 'checked_in')
            ->assertJsonPath('room.status', 'occupied');

        $this->postJson("/api/hotel/bookings/{$bookingId}/check-out", [
            'late_checkout_charge_total' => 8000,
            'amount_paid' => 78000,
        ])->assertOk()
            ->assertJsonPath('status', 'checked_out')
            ->assertJsonPath('room.status', 'cleaning');

        $this->postJson('/api/hotel/housekeeping', [
            'room_id' => $roomId,
            'status' => 'cleaned',
            'notes' => 'Room cleaned and restocked.',
        ])->assertCreated()
            ->assertJsonPath('status', 'cleaned')
            ->assertJsonPath('room.cleaning_status', 'clean');

        $this->postJson('/api/hotel/maintenance-requests', [
            'room_id' => $roomId,
            'title' => 'AC not cooling',
            'priority' => 'high',
            'details' => 'Guest reported poor cooling overnight.',
        ])->assertCreated()
            ->assertJsonPath('status', 'open')
            ->assertJsonPath('room.status', 'out_of_service');

        $this->postJson('/api/hotel/inspections', [
            'room_id' => $roomId,
            'status' => 'pass',
            'notes' => 'Room approved after cleaning review.',
        ])->assertCreated()
            ->assertJsonPath('status', 'pass');

        $this->getJson('/api/hotel/overview')
            ->assertOk()
            ->assertJsonPath('summary.total_rooms', 1)
            ->assertJsonPath('summary.checkins_today', 1)
            ->assertJsonPath('payment_method_report.0.payment_method', 'transfer');
    }

    public function test_hotel_endpoints_reject_foreign_tenant_relations_and_staff(): void
    {
        $tenant = $this->createTenantContext('hotel', 'hotel-scope@example.com');
        $otherTenant = $this->createTenantContext('hotel', 'hotel-other@example.com');

        $foreignStaff = User::factory()->create([
            'email' => 'foreign-hotel-staff@example.com',
            'role' => 'staff',
        ]);
        $this->attachActiveMember($foreignStaff, $otherTenant['business']->id);

        $foreignRoom = HotelRoom::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'room_number' => '901',
            'category' => 'Presidential',
            'status' => 'available',
            'cleaning_status' => 'clean',
            'base_rate' => 125000,
        ]);

        $foreignBooking = HotelBooking::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'room_id' => $foreignRoom->id,
            'reservation_code' => 'HTL-FOREIGN-001',
            'guest_name' => 'Foreign Guest',
            'status' => 'reserved',
            'check_in_date' => now()->toDateString(),
            'check_out_date' => now()->addDay()->toDateString(),
            'adults' => 1,
            'total_amount' => 125000,
            'amount_paid' => 0,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/hotel/rooms', [
            'branch_id' => $otherTenant['branch']->id,
            'room_number' => 'Invalid Room',
            'category' => 'Executive',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);

        $this->postJson('/api/hotel/bookings', [
            'branch_id' => $otherTenant['branch']->id,
            'room_id' => $foreignRoom->id,
            'guest_name' => 'Invalid Booking',
            'check_in_date' => now()->toDateString(),
            'check_out_date' => now()->addDay()->toDateString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'room_id']);

        $this->postJson('/api/hotel/housekeeping', [
            'room_id' => $foreignRoom->id,
            'assigned_to' => $foreignStaff->id,
            'status' => 'in_progress',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['room_id', 'assigned_to']);

        $this->postJson('/api/hotel/maintenance-requests', [
            'room_id' => $foreignRoom->id,
            'title' => 'Invalid Maintenance',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['room_id']);

        $this->postJson('/api/hotel/inspections', [
            'room_id' => $foreignRoom->id,
            'status' => 'pass',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['room_id']);

        $this->postJson('/api/hotel/shifts', [
            'branch_id' => $otherTenant['branch']->id,
            'staff_id' => $foreignStaff->id,
            'staff_name' => 'Invalid Staff',
            'shift_role' => 'front_desk',
            'started_at' => now()->toDateTimeString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'staff_id']);

        $this->postJson("/api/hotel/bookings/{$foreignBooking->id}/check-in")
            ->assertStatus(403);
    }

    private function attachActiveMember(User $user, int $businessId): void
    {
        DB::table('business_user')->insert([
            'business_id' => $businessId,
            'user_id' => $user->id,
            'role_id' => null,
            'branch_id' => null,
            'status' => 'active',
            'joined_at' => now(),
            'created_by' => null,
        ]);
    }
}
