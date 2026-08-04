<?php

namespace App\Policies;

use App\Models\HotelRoom;
use App\Models\User;

class HotelRoomPolicy
{
    public function view(User $user, HotelRoom $room): bool
    {
        return (int) $user->current_business_id === (int) $room->business_id;
    }

    public function update(User $user, HotelRoom $room): bool
    {
        return (int) $user->current_business_id === (int) $room->business_id;
    }
}
