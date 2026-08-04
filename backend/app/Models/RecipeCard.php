<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecipeCard extends Model
{
    protected $fillable = [
        'business_id',
        'product_id',
        'yield_quantity',
        'prep_station',
        'estimated_cost',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'yield_quantity' => 'decimal:3',
        'estimated_cost' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function ingredients(): HasMany
    {
        return $this->hasMany(RecipeIngredient::class);
    }
}
