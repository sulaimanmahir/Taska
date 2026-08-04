<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        return (int) $user->current_business_id === (int) $order->business_id;
    }

    public function update(User $user, Order $order): bool
    {
        return (int) $user->current_business_id === (int) $order->business_id;
    }
}
