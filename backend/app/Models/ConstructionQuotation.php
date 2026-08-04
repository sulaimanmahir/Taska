<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConstructionQuotation extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'customer_id',
        'quotation_number',
        'status',
        'valid_until',
        'delivery_fee',
        'discount_amount',
        'subtotal',
        'total',
        'notes',
        'converted_order_id',
        'created_by',
    ];

    protected $casts = [
        'valid_until' => 'date',
        'delivery_fee' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function convertedOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'converted_order_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ConstructionQuotationItem::class, 'quotation_id');
    }
}
