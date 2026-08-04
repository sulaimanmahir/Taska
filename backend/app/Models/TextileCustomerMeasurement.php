<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TextileCustomerMeasurement extends Model
{
    protected $fillable = [
        'business_id',
        'customer_id',
        'measurement_profile',
        'chest',
        'waist',
        'hip',
        'shoulder',
        'sleeve',
        'length',
        'notes',
    ];

    protected $casts = [
        'chest' => 'decimal:2',
        'waist' => 'decimal:2',
        'hip' => 'decimal:2',
        'shoulder' => 'decimal:2',
        'sleeve' => 'decimal:2',
        'length' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
