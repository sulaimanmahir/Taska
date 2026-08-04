<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function view(User $user, Invoice $invoice): bool
    {
        return (int) $user->current_business_id === (int) $invoice->business_id;
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return (int) $user->current_business_id === (int) $invoice->business_id;
    }
}
