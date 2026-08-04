<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PureWaterRetailPackageMovement extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'warehouse_id',
        'product_id',
        'customer_id',
        'movement_type',
        'package_type',
        'quantity',
        'units_per_package',
        'unit_equivalent_quantity',
        'sales_channel',
        'reference_order_id',
        'recorded_by',
        'notes',
        'recorded_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'units_per_package' => 'decimal:3',
        'unit_equivalent_quantity' => 'decimal:3',
        'recorded_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}
