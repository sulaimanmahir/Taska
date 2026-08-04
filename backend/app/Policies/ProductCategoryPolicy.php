<?php

namespace App\Policies;

use App\Models\ProductCategory;
use App\Models\User;

class ProductCategoryPolicy
{
    public function view(User $user, ProductCategory $category): bool
    {
        return (int) $user->current_business_id === (int) $category->business_id;
    }

    public function update(User $user, ProductCategory $category): bool
    {
        return (int) $user->current_business_id === (int) $category->business_id;
    }
}
