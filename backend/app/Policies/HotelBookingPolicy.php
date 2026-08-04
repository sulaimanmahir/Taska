<?php

namespace App\Policies;

use App\Models\HotelBooking;
use App\Models\User;

class HotelBookingPolicy
{
    public function view(User $user, HotelBooking $booking): bool
    {
        return (int) $user->current_business_id === (int) $booking->business_id;
    }

    public function update(User $user, HotelBooking $booking): bool
    {
        return (int) $user->current_business_id === (int) $booking->business_id;
    }
}
