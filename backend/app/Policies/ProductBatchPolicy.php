<?php

namespace App\Policies;

use App\Models\ProductBatch;
use App\Models\User;

class ProductBatchPolicy
{
    public function view(User $user, ProductBatch $batch): bool
    {
        return (int) $user->current_business_id === (int) $batch->business_id;
    }

    public function update(User $user, ProductBatch $batch): bool
    {
        return (int) $user->current_business_id === (int) $batch->business_id;
    }
}
