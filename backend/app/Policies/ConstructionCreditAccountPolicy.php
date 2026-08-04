<?php

namespace App\Policies;

use App\Models\ConstructionCreditAccount;
use App\Models\User;

class ConstructionCreditAccountPolicy
{
    public function view(User $user, ConstructionCreditAccount $account): bool
    {
        return (int) $user->current_business_id === (int) $account->business_id;
    }

    public function update(User $user, ConstructionCreditAccount $account): bool
    {
        return (int) $user->current_business_id === (int) $account->business_id;
    }
}
