<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConstructionCreditAccount extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'customer_id',
        'order_id',
        'due_date',
        'total_amount',
        'paid_amount',
        'outstanding_amount',
        'installment_notes',
        'debt_age_bucket',
        'status',
    ];

    protected $casts = [
        'due_date' => 'date',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'outstanding_amount' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ConstructionCreditPayment::class, 'credit_account_id');
    }
}
