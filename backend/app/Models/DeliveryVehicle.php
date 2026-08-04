<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryVehicle extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'assigned_user_id',
        'vehicle_type',
        'ownership_model',
        'plate_number',
        'owner_name',
        'owner_details',
        'purchase_value',
        'fuel_responsibility',
        'maintenance_responsibility',
        'is_active',
    ];

    protected $casts = [
        'owner_details' => 'array',
        'purchase_value' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function assignedRider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(DeliveryOrder::class, 'vehicle_id');
    }
}
