<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TextileInvoice extends Model
{
    protected $fillable = [
        'business_id',
        'customer_id',
        'style_order_id',
        'invoice_number',
        'unit_type',
        'quantity',
        'rate',
        'subtotal',
        'total_amount',
        'amount_paid',
        'status',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'rate' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function styleOrder(): BelongsTo
    {
        return $this->belongsTo(TextileStyleOrder::class, 'style_order_id');
    }
}
