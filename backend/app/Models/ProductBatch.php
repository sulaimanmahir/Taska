<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductBatch extends Model
{
    protected $table = 'product_batches';

    protected $fillable = [
        'business_id',
        'product_id',
        'batch_number',
        'manufacture_date',
        'expiry_date',
        'quantity',
        'remaining_quantity',
        'cost_per_unit',
        'near_expiry_discount_percent',
        'discounted_price',
        'supplier',
        'notes',
    ];

    protected $casts = [
        'manufacture_date' => 'date',
        'expiry_date' => 'date',
        'quantity' => 'decimal:2',
        'remaining_quantity' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
        'near_expiry_discount_percent' => 'decimal:2',
        'discounted_price' => 'decimal:2',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(BatchMovement::class);
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function isExpiringSoon(int $days = 30): bool
    {
        if (!$this->expiry_date) {
            return false;
        }

        return $this->expiry_date->diffInDays(now()) <= $days;
    }

    public function daysToExpiry(): ?int
    {
        if (!$this->expiry_date) {
            return null;
        }

        return $this->expiry_date->diffInDays(now());
    }
}
