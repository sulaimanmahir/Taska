<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommoditySettlement extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'commodity_trade_ticket_id',
        'party_type',
        'amount',
        'payment_method',
        'settled_on',
        'reference',
        'notes',
    ];

    protected $casts = [
        'settled_on' => 'date',
    ];

    public function tradeTicket(): BelongsTo
    {
        return $this->belongsTo(CommodityTradeTicket::class, 'commodity_trade_ticket_id');
    }
}
