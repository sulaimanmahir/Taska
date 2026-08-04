<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Product extends Model
{
        protected $table = 'products';
    
    protected $fillable = [
        'business_id',
        'category_id',
        'name',
        'sku',
        'description',
        'image_url',
        'barcode',
        'product_type',
        'track_inventory',
        'cost_price',
        'selling_price',
        'min_price',
        'max_price',
        'low_stock_alert',
        'track_expiry',
        'is_prescription_required',
        'pharmacy_category',
        'default_expiry_months',
        'generic_product_id',
        'medicine_type',
        'is_controlled_drug',
        'allow_substitution',
        'refill_cycle_days',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'track_expiry' => 'boolean',
        'is_prescription_required' => 'boolean',
        'is_controlled_drug' => 'boolean',
        'allow_substitution' => 'boolean',
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'min_price' => 'decimal:2',
        'max_price' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function inventoryItems(): HasMany
    {
        return $this->hasMany(InventoryItem::class);
    }

    public function genericProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'generic_product_id');
    }
}
