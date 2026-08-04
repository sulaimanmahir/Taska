<?php

namespace App\Policies;

use App\Models\RawMaterial;
use App\Models\User;

class RawMaterialPolicy
{
    public function update(User $user, RawMaterial $rawMaterial): bool
    {
        return (int) $user->current_business_id === (int) $rawMaterial->business_id;
    }
}
