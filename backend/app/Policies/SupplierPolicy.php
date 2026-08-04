<?php

namespace App\Policies;

use App\Models\Supplier;
use App\Models\User;

class SupplierPolicy
{
    public function view(User $user, Supplier $supplier): bool
    {
        return (int) $user->current_business_id === (int) $supplier->business_id;
    }

    public function update(User $user, Supplier $supplier): bool
    {
        return (int) $user->current_business_id === (int) $supplier->business_id;
    }

    public function delete(User $user, Supplier $supplier): bool
    {
        return (int) $user->current_business_id === (int) $supplier->business_id;
    }
}
