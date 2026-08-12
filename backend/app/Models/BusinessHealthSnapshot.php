<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessHealthSnapshot extends Model
{
    use BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'snapshot_date',
        'health_score',
        'revenue_trend_score',
        'expense_control_score',
        'stock_health_score',
        'receivables_health_score',
        'signals',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'health_score' => 'integer',
        'revenue_trend_score' => 'integer',
        'expense_control_score' => 'integer',
        'stock_health_score' => 'integer',
        'receivables_health_score' => 'integer',
        'signals' => 'array',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
