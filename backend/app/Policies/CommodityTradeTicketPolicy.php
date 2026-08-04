<?php

namespace App\Policies;

use App\Models\CommodityTradeTicket;
use App\Models\User;

class CommodityTradeTicketPolicy
{
    public function view(User $user, CommodityTradeTicket $trade): bool
    {
        return (int) $user->current_business_id === (int) $trade->business_id;
    }

    public function update(User $user, CommodityTradeTicket $trade): bool
    {
        return (int) $user->current_business_id === (int) $trade->business_id;
    }
}
