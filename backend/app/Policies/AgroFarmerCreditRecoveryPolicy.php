<?php

namespace App\Policies;

use App\Models\AgroFarmerCreditRecovery;
use App\Models\User;

class AgroFarmerCreditRecoveryPolicy
{
    public function view(User $user, AgroFarmerCreditRecovery $recovery): bool
    {
        return (int) $user->current_business_id === (int) $recovery->business_id;
    }

    public function update(User $user, AgroFarmerCreditRecovery $recovery): bool
    {
        return (int) $user->current_business_id === (int) $recovery->business_id;
    }
}
