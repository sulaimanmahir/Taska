<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LivestockMarketTransaction extends Model
{
    use BelongsToBusiness;

    public const TYPE_INTAKE = 'intake';
    public const TYPE_SALE = 'sale';

    protected $fillable = [
        'business_id',
        'transaction_number',
        'transaction_type',
        'animal_type',
        'head_count',
        'total_weight_kg',
        'unit_price_per_kg',
        'total_amount',
        'counterparty_name',
        'counterparty_phone',
        'market_date',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'market_date' => 'date',
        'head_count' => 'integer',
        'total_weight_kg' => 'decimal:2',
        'unit_price_per_kg' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generateTransactionNumber(string $type): string
    {
        $prefix = $type === self::TYPE_SALE ? 'LMS' : 'LMI';
        $date = date('Ymd');
        $random = str()->random(4);

        return "{$prefix}-{$date}-{$random}";
    }
}
