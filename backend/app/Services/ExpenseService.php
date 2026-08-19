<?php

namespace App\Services;

use App\Models\Expense;

/**
 * Extracted from ExpenseController::store() so the same creation logic can
 * be reused by ApprovalService when a deferred (above-threshold) expense is
 * approved, without duplicating it.
 */
class ExpenseService
{
    public function createExpense(array $data): Expense
    {
        return Expense::create($data);
    }
}
