<?php

namespace App\Policies;

use App\Models\MobileAgentFloatRequest;
use App\Models\User;

class MobileAgentFloatRequestPolicy
{
    public function view(User $user, MobileAgentFloatRequest $floatRequest): bool
    {
        return (int) $user->current_business_id === (int) $floatRequest->business_id;
    }

    public function update(User $user, MobileAgentFloatRequest $floatRequest): bool
    {
        return (int) $user->current_business_id === (int) $floatRequest->business_id;
    }
}
