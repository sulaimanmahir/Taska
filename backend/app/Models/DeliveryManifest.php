<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DeliveryManifest extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'vehicle_id',
        'rider_id',
        'created_by',
        'manifest_code',
        'title',
        'status',
        'dispatched_at',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'dispatched_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(DeliveryVehicle::class);
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(DeliveryOrder::class, 'delivery_manifest_items', 'manifest_id', 'delivery_order_id')
            ->withTimestamps();
    }
}
