<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
        protected $fillable = [
        'business_id',
        'supplier_id',
        'warehouse_id',
        'created_by',
        'purchase_number',
        'status',
        'subtotal',
        'discount',
        'total',
        'paid',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'total' => 'decimal:2',
        'paid' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PurchasePayment::class);
    }

    public function isFullyReceived(): bool
    {
        return $this->status === 'received';
    }

    public function outstandingBalance(): float
    {
        return max((float) $this->total - (float) $this->paid, 0);
    }

    public static function generatePurchaseNumber(int $businessId): string
    {
        $prefix = 'PO';
        $date = date('Ymd');
        $random = str()->random(4);
        return "{$prefix}-{$date}-{$random}";
    }
}
