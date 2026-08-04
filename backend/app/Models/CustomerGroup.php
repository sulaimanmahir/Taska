<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerGroup extends Model
{
    protected $fillable = [
        'business_id',
        'name',
        'slug',
        'discount_percent',
        'description',
    ];

    protected $casts = [
        'discount_percent' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }
}
