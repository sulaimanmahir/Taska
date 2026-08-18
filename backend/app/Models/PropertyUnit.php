<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PropertyUnit extends Model
{
    use BelongsToBusiness;

    public const STATUS_VACANT = 'vacant';
    public const STATUS_OCCUPIED = 'occupied';
    public const STATUS_MAINTENANCE = 'maintenance';

    protected $fillable = [
        'business_id',
        'unit_code',
        'property_name',
        'unit_type',
        'address',
        'bedrooms',
        'rent_amount',
        'service_charge_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'bedrooms' => 'integer',
        'rent_amount' => 'decimal:2',
        'service_charge_amount' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function leases(): HasMany
    {
        return $this->hasMany(PropertyLease::class);
    }

    public function maintenanceRequests(): HasMany
    {
        return $this->hasMany(PropertyMaintenanceRequest::class);
    }

    public function activeLease(): ?PropertyLease
    {
        return $this->leases()->where('status', 'active')->first();
    }

    public static function generateUnitCode(): string
    {
        return 'UNIT-' . date('Ymd') . '-' . str()->random(4);
    }
}
