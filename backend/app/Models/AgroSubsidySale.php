<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgroSubsidySale extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'customer_id',
        'product_id',
        'programme_name',
        'agency_name',
        'region_name',
        'quantity',
        'unit_price',
        'subsidy_amount',
        'amount_due',
        'amount_received',
        'sale_date',
        'status',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'subsidy_amount' => 'decimal:2',
        'amount_due' => 'decimal:2',
        'amount_received' => 'decimal:2',
        'sale_date' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
