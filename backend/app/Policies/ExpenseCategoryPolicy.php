<?php

namespace App\Policies;

use App\Models\ExpenseCategory;
use App\Models\User;

class ExpenseCategoryPolicy
{
    public function view(User $user, ExpenseCategory $category): bool
    {
        return (int) $user->current_business_id === (int) $category->business_id;
    }

    public function update(User $user, ExpenseCategory $category): bool
    {
        return (int) $user->current_business_id === (int) $category->business_id;
    }
}
