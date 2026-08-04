<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TrustAccount extends Model
{
    protected $fillable = [
        'business_id',
        'customer_id',
        'account_type',
        'cycle_name',
        'limit',
        'installment_amount',
        'contribution_frequency_days',
        'balance',
        'total_repaid',
        'last_payment_date',
        'next_due_date',
        'status',
    ];

    protected $casts = [
        'limit' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'contribution_frequency_days' => 'integer',
        'balance' => 'decimal:2',
        'total_repaid' => 'decimal:2',
        'last_payment_date' => 'date',
        'next_due_date' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(TrustTransaction::class);
    }

    public function canDraw(float $amount): bool
    {
        return $this->status === 'active'
            && ($this->balance + $amount) <= $this->limit;
    }

    public function availableCredit(): float
    {
        return $this->limit - $this->balance;
    }
}
