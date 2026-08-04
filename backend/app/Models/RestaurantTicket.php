<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RestaurantTicket extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'table_id',
        'customer_id',
        'waiter_shift_id',
        'ticket_number',
        'order_channel',
        'service_status',
        'payment_status',
        'guest_name',
        'delivery_address',
        'split_count',
        'subtotal',
        'service_charge',
        'delivery_fee',
        'total',
        'amount_paid',
        'recipe_cost_total',
        'gross_margin',
        'waste_cost_total',
        'opened_at',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'split_count' => 'integer',
        'subtotal' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'recipe_cost_total' => 'decimal:2',
        'gross_margin' => 'decimal:2',
        'waste_cost_total' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(RestaurantTicketItem::class);
    }

    public function kitchenTicket(): HasOne
    {
        return $this->hasOne(KitchenTicket::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function waiterShift(): BelongsTo
    {
        return $this->belongsTo(RestaurantWaiterShift::class, 'waiter_shift_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
