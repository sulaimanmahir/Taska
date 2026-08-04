<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgroFarmerCreditRecovery extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'customer_id',
        'recovery_reference',
        'region_name',
        'credit_amount',
        'recovered_amount',
        'outstanding_amount',
        'due_date',
        'last_contacted_at',
        'status',
        'notes',
    ];

    protected $casts = [
        'credit_amount' => 'decimal:2',
        'recovered_amount' => 'decimal:2',
        'outstanding_amount' => 'decimal:2',
        'due_date' => 'date',
        'last_contacted_at' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
