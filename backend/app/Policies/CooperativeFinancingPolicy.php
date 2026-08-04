<?php

namespace App\Policies;

use App\Models\CooperativeFinancing;
use App\Models\User;

class CooperativeFinancingPolicy
{
    public function view(User $user, CooperativeFinancing $financing): bool
    {
        return (int) $user->current_business_id === (int) $financing->business_id;
    }

    public function update(User $user, CooperativeFinancing $financing): bool
    {
        return (int) $user->current_business_id === (int) $financing->business_id;
    }
}
