<?php

namespace App\Policies;

use App\Models\LogisticsTripSheet;
use App\Models\User;

class LogisticsTripSheetPolicy
{
    public function view(User $user, LogisticsTripSheet $tripSheet): bool
    {
        return (int) $user->current_business_id === (int) $tripSheet->business_id;
    }

    public function update(User $user, LogisticsTripSheet $tripSheet): bool
    {
        return (int) $user->current_business_id === (int) $tripSheet->business_id;
    }
}
