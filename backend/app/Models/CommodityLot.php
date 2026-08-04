<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommodityLot extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'warehouse_id',
        'product_id',
        'commodity_name',
        'commodity_group',
        'origin_region',
        'quality_grade',
        'moisture_percent',
        'bag_count',
        'weight_kg',
        'cost_per_kg',
        'selling_price_per_kg',
        'shrinkage_allowance_percent',
        'status',
        'notes',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function tradeTickets(): HasMany
    {
        return $this->hasMany(CommodityTradeTicket::class);
    }
}
