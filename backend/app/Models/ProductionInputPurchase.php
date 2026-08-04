<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionInputPurchase extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'raw_material_id',
        'supplier_name',
        'quantity',
        'unit_cost',
        'total_cost',
        'amount_paid',
        'balance_due',
        'purchased_at',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'purchased_at' => 'datetime',
    ];

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class, 'raw_material_id');
    }
}
