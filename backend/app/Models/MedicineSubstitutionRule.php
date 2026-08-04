<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicineSubstitutionRule extends Model
{
    protected $fillable = ['business_id', 'product_id', 'substitute_product_id', 'reason', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function substitute(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'substitute_product_id');
    }
}
