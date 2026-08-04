<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KitchenTicket extends Model
{
    protected $fillable = [
        'business_id',
        'restaurant_ticket_id',
        'status',
        'priority',
        'station',
        'fired_at',
        'ready_at',
        'served_at',
        'notes',
    ];

    protected $casts = [
        'fired_at' => 'datetime',
        'ready_at' => 'datetime',
        'served_at' => 'datetime',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(RestaurantTicket::class, 'restaurant_ticket_id');
    }
}
