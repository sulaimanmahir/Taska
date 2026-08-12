<?php

namespace App\Providers;

use App\Models\Expense;
use App\Models\Order;
use App\Observers\GamificationObserver;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token): string {
            $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');

            return $frontendUrl.'/reset-password?token='.$token.'&email='.urlencode($notifiable->getEmailForPasswordReset());
        });

        // Registered here rather than as a model $observers array so Order.php
        // and Expense.php - both already touched by many verticals - don't
        // need any change at all for gamification to hook onto them.
        Order::created([GamificationObserver::class, 'orderCreated']);
        Expense::created([GamificationObserver::class, 'expenseCreated']);
    }
}
