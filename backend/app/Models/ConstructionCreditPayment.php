<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConstructionCreditPayment extends Model
{
    protected $fillable = [
        'credit_account_id',
        'business_id',
        'amount',
        'payment_date',
        'payment_method',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(ConstructionCreditAccount::class, 'credit_account_id');
    }
}
