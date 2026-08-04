<?php

namespace App\Policies;

use App\Models\ServiceJob;
use App\Models\User;

class ServiceJobPolicy
{
    public function view(User $user, ServiceJob $job): bool
    {
        return (int) $user->current_business_id === (int) $job->business_id;
    }

    public function update(User $user, ServiceJob $job): bool
    {
        return (int) $user->current_business_id === (int) $job->business_id;
    }
}
