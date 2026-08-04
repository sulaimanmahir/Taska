<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DeliveryOrder extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'pickup_branch_id',
        'dropoff_branch_id',
        'sender_contact_id',
        'recipient_contact_id',
        'assigned_rider_id',
        'vehicle_id',
        'tracking_code',
        'delivery_otp_code',
        'status',
        'parcel_category',
        'parcel_description',
        'pricing_model',
        'distance_km',
        'base_fee',
        'distance_fee',
        'urgent_fee',
        'total_fee',
        'cod_amount',
        'amount_remitted',
        'is_urgent',
        'pickup_address',
        'dropoff_address',
        'failed_delivery_reason',
        'rescheduled_for',
        'picked_up_at',
        'delivered_at',
        'delivery_otp_verified_at',
        'delayed_at',
        'delay_penalty_amount',
        'cod_fraud_flagged',
        'proof_of_pickup_url',
        'proof_of_delivery_url',
        'created_offline',
        'device_id',
        'local_timestamp',
        'synced_at',
    ];

    protected $casts = [
        'distance_km' => 'decimal:2',
        'base_fee' => 'decimal:2',
        'distance_fee' => 'decimal:2',
        'urgent_fee' => 'decimal:2',
        'total_fee' => 'decimal:2',
        'cod_amount' => 'decimal:2',
        'amount_remitted' => 'decimal:2',
        'is_urgent' => 'boolean',
        'created_offline' => 'boolean',
        'rescheduled_for' => 'datetime',
        'picked_up_at' => 'datetime',
        'delivered_at' => 'datetime',
        'delivery_otp_verified_at' => 'datetime',
        'delayed_at' => 'datetime',
        'delay_penalty_amount' => 'decimal:2',
        'cod_fraud_flagged' => 'boolean',
        'local_timestamp' => 'datetime',
        'synced_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(DeliveryContact::class, 'sender_contact_id');
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(DeliveryContact::class, 'recipient_contact_id');
    }

    public function assignedRider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_rider_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(DeliveryVehicle::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(DeliveryStatusEvent::class);
    }

    public function settlement(): HasOne
    {
        return $this->hasOne(DeliverySettlement::class, 'delivery_order_id');
    }

    public function manifests(): BelongsToMany
    {
        return $this->belongsToMany(DeliveryManifest::class, 'delivery_manifest_items', 'delivery_order_id', 'manifest_id')
            ->withTimestamps();
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(DeliveryDispute::class, 'delivery_order_id');
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(DeliveryComplaint::class, 'delivery_order_id');
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(DeliveryWalletTransaction::class, 'delivery_order_id');
    }
}
