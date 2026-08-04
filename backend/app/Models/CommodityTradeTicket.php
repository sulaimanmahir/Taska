<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommodityTradeTicket extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'commodity_lot_id',
        'customer_id',
        'supplier_id',
        'ticket_type',
        'ticket_number',
        'commodity_name',
        'quality_grade',
        'bag_count',
        'weight_kg',
        'unit_price',
        'total_amount',
        'paid_amount',
        'shrinkage_loss_kg',
        'payment_status',
        'status',
        'trade_date',
        'settlement_due_on',
        'channel',
        'notes',
    ];

    protected $casts = [
        'trade_date' => 'date',
        'settlement_due_on' => 'date',
    ];

    public function lot(): BelongsTo
    {
        return $this->belongsTo(CommodityLot::class, 'commodity_lot_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(CommoditySettlement::class);
    }
}
