<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TextileStyleOrder extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'customer_id',
        'measurement_id',
        'variant_id',
        'order_number',
        'style_name',
        'garment_type',
        'status',
        'fabric_quantity',
        'fabric_unit',
        'labour_charge',
        'fabric_charge',
        'total_amount',
        'amount_paid',
        'due_date',
        'design_notes',
    ];

    protected $casts = [
        'fabric_quantity' => 'decimal:3',
        'labour_charge' => 'decimal:2',
        'fabric_charge' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function measurement(): BelongsTo
    {
        return $this->belongsTo(TextileCustomerMeasurement::class, 'measurement_id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(TextileColorVariant::class, 'variant_id');
    }

    public function tailoringJob(): HasOne
    {
        return $this->hasOne(TailoringJob::class, 'style_order_id');
    }
}
