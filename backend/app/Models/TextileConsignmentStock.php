<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TextileConsignmentStock extends Model
{
    protected $fillable = [
        'business_id',
        'product_id',
        'variant_id',
        'partner_name',
        'quantity_sent',
        'quantity_returned',
        'quantity_sold',
        'settlement_due',
        'status',
        'sent_date',
        'due_back_date',
    ];

    protected $casts = [
        'quantity_sent' => 'decimal:3',
        'quantity_returned' => 'decimal:3',
        'quantity_sold' => 'decimal:3',
        'settlement_due' => 'decimal:2',
        'sent_date' => 'date',
        'due_back_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(TextileColorVariant::class, 'variant_id');
    }
}
