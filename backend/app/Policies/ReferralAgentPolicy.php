<?php

namespace App\Policies;

use App\Models\ReferralAgent;
use App\Models\User;

class ReferralAgentPolicy
{
    public function view(User $user, ReferralAgent $agent): bool
    {
        return (int) $user->current_business_id === (int) $agent->business_id;
    }

    public function update(User $user, ReferralAgent $agent): bool
    {
        return (int) $user->current_business_id === (int) $agent->business_id;
    }
}
