<?php

namespace App\Policies;

use App\Models\RestaurantTicket;
use App\Models\User;

class RestaurantTicketPolicy
{
    public function view(User $user, RestaurantTicket $ticket): bool
    {
        return (int) $user->current_business_id === (int) $ticket->business_id;
    }

    public function update(User $user, RestaurantTicket $ticket): bool
    {
        return (int) $user->current_business_id === (int) $ticket->business_id;
    }
}
