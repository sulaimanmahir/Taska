<?php

namespace App\Policies;

use App\Models\LabRequest;
use App\Models\User;

class LabRequestPolicy
{
    public function view(User $user, LabRequest $labRequest): bool
    {
        return (int) $user->current_business_id === (int) $labRequest->business_id;
    }

    public function update(User $user, LabRequest $labRequest): bool
    {
        return (int) $user->current_business_id === (int) $labRequest->business_id;
    }
}
