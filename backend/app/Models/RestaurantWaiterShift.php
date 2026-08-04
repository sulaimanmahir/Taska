<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RestaurantWaiterShift extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'staff_id',
        'staff_name',
        'shift_code',
        'status',
        'orders_handled',
        'cash_variance',
        'started_at',
        'ended_at',
        'notes',
    ];

    protected $casts = [
        'cash_variance' => 'decimal:2',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function tickets(): HasMany
    {
        return $this->hasMany(RestaurantTicket::class, 'waiter_shift_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }
}
