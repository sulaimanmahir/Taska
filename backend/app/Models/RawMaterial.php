<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RawMaterial extends Model
{
    protected $table = 'raw_materials';

    protected $fillable = [
        'business_id',
        'warehouse_id',
        'name',
        'sku',
        'unit',
        'material_category',
        'quantity',
        'cost_per_unit',
        'reorder_level',
        'description',
        'supplier_name',
        'supplier_phone',
        'supplier_balance',
        'last_purchase_cost',
        'low_stock_threshold',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
        'supplier_balance' => 'decimal:2',
        'last_purchase_cost' => 'decimal:2',
        'low_stock_threshold' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(ProductionInputPurchase::class, 'raw_material_id');
    }

    public function wastageLogs(): HasMany
    {
        return $this->hasMany(ProductionWastageLog::class, 'raw_material_id');
    }
}
