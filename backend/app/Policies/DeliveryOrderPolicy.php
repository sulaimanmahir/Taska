<?php

namespace App\Policies;

use App\Models\DeliveryOrder;
use App\Models\User;

class DeliveryOrderPolicy
{
    public function view(User $user, DeliveryOrder $deliveryOrder): bool
    {
        return (int) $user->current_business_id === (int) $deliveryOrder->business_id;
    }

    public function update(User $user, DeliveryOrder $deliveryOrder): bool
    {
        return (int) $user->current_business_id === (int) $deliveryOrder->business_id;
    }
}
