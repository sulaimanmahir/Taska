<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SMECashEntry extends Model
{
    protected $table = 'sme_cash_entries';

    protected $fillable = [
        'business_id',
        'branch_id',
        'customer_id',
        'recorded_by',
        'entry_type',
        'source',
        'amount',
        'payment_method',
        'reference',
        'entry_date',
        'notes',
    ];

    protected $casts = [
        'entry_date' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
