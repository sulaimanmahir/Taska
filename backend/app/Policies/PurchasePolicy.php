<?php

namespace App\Policies;

use App\Models\Purchase;
use App\Models\User;

class PurchasePolicy
{
    public function create(User $user): bool
    {
        return ! empty($user->current_business_id);
    }

    public function view(User $user, Purchase $purchase): bool
    {
        return (int) $user->current_business_id === (int) $purchase->business_id;
    }

    public function update(User $user, Purchase $purchase): bool
    {
        return (int) $user->current_business_id === (int) $purchase->business_id;
    }
}
