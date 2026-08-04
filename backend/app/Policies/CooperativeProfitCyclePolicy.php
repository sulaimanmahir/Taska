<?php

namespace App\Policies;

use App\Models\CooperativeProfitCycle;
use App\Models\User;

class CooperativeProfitCyclePolicy
{
    public function view(User $user, CooperativeProfitCycle $profitCycle): bool
    {
        return (int) $user->current_business_id === (int) $profitCycle->business_id;
    }

    public function update(User $user, CooperativeProfitCycle $profitCycle): bool
    {
        return (int) $user->current_business_id === (int) $profitCycle->business_id;
    }
}
