<?php

namespace App\Policies;

use App\Models\CustomerGroup;
use App\Models\User;

class CustomerGroupPolicy
{
    public function view(User $user, CustomerGroup $group): bool
    {
        return (int) $user->current_business_id === (int) $group->business_id;
    }

    public function update(User $user, CustomerGroup $group): bool
    {
        return (int) $user->current_business_id === (int) $group->business_id;
    }

    public function delete(User $user, CustomerGroup $group): bool
    {
        return (int) $user->current_business_id === (int) $group->business_id;
    }
}
