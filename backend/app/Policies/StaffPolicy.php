<?php

namespace App\Policies;

use App\Models\Staff;
use App\Models\User;

class StaffPolicy
{
    public function view(User $user, Staff $staff): bool
    {
        return (int) $user->current_business_id === (int) $staff->business_id;
    }

    public function update(User $user, Staff $staff): bool
    {
        return (int) $user->current_business_id === (int) $staff->business_id;
    }
}
