<?php

namespace App\Policies;

use App\Models\TailoringJob;
use App\Models\User;

class TailoringJobPolicy
{
    public function view(User $user, TailoringJob $job): bool
    {
        return (int) $user->current_business_id === (int) $job->business_id;
    }

    public function update(User $user, TailoringJob $job): bool
    {
        return (int) $user->current_business_id === (int) $job->business_id;
    }
}
