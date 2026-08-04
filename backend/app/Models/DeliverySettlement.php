<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliverySettlement extends Model
{
    protected $fillable = [
        'business_id',
        'delivery_order_id',
        'vehicle_id',
        'rider_id',
        'total_delivery_fee',
        'rider_share',
        'owner_share',
        'company_share',
        'fuel_deduction',
        'maintenance_deduction',
        'net_rider_payout',
        'net_owner_payout',
        'company_retained_earnings',
        'status',
        'settled_at',
    ];

    protected $casts = [
        'total_delivery_fee' => 'decimal:2',
        'rider_share' => 'decimal:2',
        'owner_share' => 'decimal:2',
        'company_share' => 'decimal:2',
        'fuel_deduction' => 'decimal:2',
        'maintenance_deduction' => 'decimal:2',
        'net_rider_payout' => 'decimal:2',
        'net_owner_payout' => 'decimal:2',
        'company_retained_earnings' => 'decimal:2',
        'settled_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(DeliveryOrder::class, 'delivery_order_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(DeliveryVehicle::class);
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }
}
