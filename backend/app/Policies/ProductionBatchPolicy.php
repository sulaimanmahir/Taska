<?php

namespace App\Policies;

use App\Models\ProductionBatch;
use App\Models\User;

class ProductionBatchPolicy
{
    public function view(User $user, ProductionBatch $batch): bool
    {
        return (int) $user->current_business_id === (int) $batch->business_id;
    }

    public function update(User $user, ProductionBatch $batch): bool
    {
        return (int) $user->current_business_id === (int) $batch->business_id;
    }
}
