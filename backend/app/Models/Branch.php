<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
        protected $fillable = [
        'business_id',
        'name',
        'slug',
        'phone',
        'address',
        'city',
        'state',
        'is_primary',
        'is_active',
        'expense_approval_threshold',
        'discount_approval_threshold',
        'require_inventory_adjustment_approval',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
        'expense_approval_threshold' => 'decimal:2',
        'discount_approval_threshold' => 'decimal:2',
        'require_inventory_adjustment_approval' => 'boolean',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class);
    }
}
