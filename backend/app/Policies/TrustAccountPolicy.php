<?php

namespace App\Policies;

use App\Models\TrustAccount;
use App\Models\User;

class TrustAccountPolicy
{
    public function view(User $user, TrustAccount $trustAccount): bool
    {
        return (int) $user->current_business_id === (int) $trustAccount->business_id;
    }

    public function update(User $user, TrustAccount $trustAccount): bool
    {
        return (int) $user->current_business_id === (int) $trustAccount->business_id;
    }
}
