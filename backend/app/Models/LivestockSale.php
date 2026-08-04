<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivestockSale extends Model
{
    protected $fillable = [
        'business_id',
        'animal_group_id',
        'sale_type',
        'quantity',
        'revenue',
        'sold_on',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'revenue' => 'float',
        'sold_on' => 'date',
    ];

    public function group(): BelongsTo
    {
        return $this->belongsTo(LivestockAnimalGroup::class, 'animal_group_id');
    }
}
