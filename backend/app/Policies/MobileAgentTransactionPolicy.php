<?php

namespace App\Policies;

use App\Models\MobileAgentTransaction;
use App\Models\User;

class MobileAgentTransactionPolicy
{
    public function view(User $user, MobileAgentTransaction $transaction): bool
    {
        return (int) $user->current_business_id === (int) $transaction->business_id;
    }

    public function update(User $user, MobileAgentTransaction $transaction): bool
    {
        return (int) $user->current_business_id === (int) $transaction->business_id;
    }
}
