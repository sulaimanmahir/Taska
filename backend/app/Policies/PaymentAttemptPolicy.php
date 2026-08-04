<?php

namespace App\Policies;

use App\Models\PaymentAttempt;
use App\Models\User;

class PaymentAttemptPolicy
{
    public function view(User $user, PaymentAttempt $attempt): bool
    {
        return (int) $user->current_business_id === (int) $attempt->invoice->business_id;
    }

    public function update(User $user, PaymentAttempt $attempt): bool
    {
        return (int) $user->current_business_id === (int) $attempt->invoice->business_id;
    }
}
