<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function view(User $user, Product $product): bool
    {
        return (int) $user->current_business_id === (int) $product->business_id;
    }

    public function update(User $user, Product $product): bool
    {
        return (int) $user->current_business_id === (int) $product->business_id;
    }
}
