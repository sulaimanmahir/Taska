<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodWasteLog extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'product_id',
        'recipe_card_id',
        'quantity',
        'cost_impact',
        'waste_type',
        'logged_at',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'cost_impact' => 'decimal:2',
        'logged_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function recipeCard(): BelongsTo
    {
        return $this->belongsTo(RecipeCard::class);
    }
}
