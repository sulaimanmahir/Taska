<?php

namespace App\Observers;

use App\Models\Business;
use App\Models\BusinessStreak;
use App\Models\Expense;
use App\Models\Order;
use App\Services\GamificationService;
use Illuminate\Support\Facades\Log;

/**
 * Hooks gamification checks onto real business events (a sale recorded, an
 * expense logged) without touching OrderController/ExpenseController or the
 * Order/Expense models themselves - registered centrally in
 * AppServiceProvider::boot() instead. Every method is wrapped so a bug in
 * gamification logic can never break the actual sale/expense being saved;
 * it's a side effect of real business activity, never a gate on it.
 */
class GamificationObserver
{
    public function orderCreated(Order $order): void
    {
        $this->safely(function () use ($order) {
            $business = Business::find($order->business_id);

            if (!$business) {
                return;
            }

            $this->recordStreak($business, 'daily_sales_logged');
            app(GamificationService::class)->checkAndUnlock($business);
        });
    }

    public function expenseCreated(Expense $expense): void
    {
        $this->safely(function () use ($expense) {
            $business = Business::find($expense->business_id);

            if (!$business) {
                return;
            }

            $this->recordStreak($business, 'daily_expense_logged');
            app(GamificationService::class)->checkAndUnlock($business);
        });
    }

    private function recordStreak(Business $business, string $streakType): void
    {
        $streak = BusinessStreak::firstOrCreate([
            'business_id' => $business->id,
            'streak_type' => $streakType,
        ]);

        $streak->recordActivity();
    }

    private function safely(callable $callback): void
    {
        try {
            $callback();
        } catch (\Throwable $exception) {
            Log::warning('Gamification hook failed without affecting the triggering action.', [
                'exception' => $exception->getMessage(),
            ]);
        }
    }
}
