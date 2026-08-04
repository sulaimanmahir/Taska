<?php

namespace App\Policies;

use App\Models\ReferralPayout;
use App\Models\User;

class ReferralPayoutPolicy
{
    public function view(User $user, ReferralPayout $payout): bool
    {
        return (int) $user->current_business_id === (int) $payout->agent->business_id;
    }

    public function update(User $user, ReferralPayout $payout): bool
    {
        return (int) $user->current_business_id === (int) $payout->agent->business_id;
    }
}
