<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryStatusEvent extends Model
{
    protected $fillable = [
        'business_id',
        'delivery_order_id',
        'created_by',
        'status',
        'notes',
        'proof_url',
        'latitude',
        'longitude',
        'recorded_offline',
        'device_id',
        'local_timestamp',
        'synced_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'recorded_offline' => 'boolean',
        'local_timestamp' => 'datetime',
        'synced_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrder::class, 'delivery_order_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
