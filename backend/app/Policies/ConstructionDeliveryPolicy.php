<?php

namespace App\Policies;

use App\Models\ConstructionDelivery;
use App\Models\User;

class ConstructionDeliveryPolicy
{
    public function view(User $user, ConstructionDelivery $delivery): bool
    {
        return (int) $user->current_business_id === (int) $delivery->business_id;
    }

    public function update(User $user, ConstructionDelivery $delivery): bool
    {
        return (int) $user->current_business_id === (int) $delivery->business_id;
    }
}
