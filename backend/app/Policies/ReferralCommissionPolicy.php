<?php

namespace App\Policies;

use App\Models\ReferralCommission;
use App\Models\User;

class ReferralCommissionPolicy
{
    public function view(User $user, ReferralCommission $commission): bool
    {
        return (int) $user->current_business_id === (int) $commission->agent->business_id;
    }

    public function update(User $user, ReferralCommission $commission): bool
    {
        return (int) $user->current_business_id === (int) $commission->agent->business_id;
    }
}
