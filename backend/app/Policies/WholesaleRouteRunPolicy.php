<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WholesaleRouteRun;

class WholesaleRouteRunPolicy
{
    public function view(User $user, WholesaleRouteRun $routeRun): bool
    {
        return (int) $user->current_business_id === (int) $routeRun->business_id;
    }

    public function update(User $user, WholesaleRouteRun $routeRun): bool
    {
        return (int) $user->current_business_id === (int) $routeRun->business_id;
    }
}
