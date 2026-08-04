<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConstructionDelivery extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'order_id',
        'quotation_id',
        'customer_id',
        'delivery_mode',
        'destination_type',
        'driver_name',
        'loader_name',
        'vehicle_reference',
        'status',
        'failure_reason',
        'delivery_address',
        'delivered_at',
        'confirmed_by',
        'created_by',
    ];

    protected $casts = [
        'delivered_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(ConstructionQuotation::class, 'quotation_id');
    }
}
