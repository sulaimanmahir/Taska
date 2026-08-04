<?php

namespace App\Policies;

use App\Models\RetailCashierShift;
use App\Models\User;

class RetailCashierShiftPolicy
{
    public function update(User $user, RetailCashierShift $shift): bool
    {
        return (int) $user->current_business_id === (int) $shift->business_id;
    }
}
