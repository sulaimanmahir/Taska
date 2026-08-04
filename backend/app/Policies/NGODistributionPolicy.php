<?php

namespace App\Policies;

use App\Models\NGODistribution;
use App\Models\User;

class NGODistributionPolicy
{
    public function view(User $user, NGODistribution $distribution): bool
    {
        return (int) $user->current_business_id === (int) $distribution->business_id;
    }

    public function update(User $user, NGODistribution $distribution): bool
    {
        return (int) $user->current_business_id === (int) $distribution->business_id;
    }
}
