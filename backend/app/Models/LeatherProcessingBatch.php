<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeatherProcessingBatch extends Model
{
    use BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'batch_number',
        'processing_date',
        'status',
        'hide_type',
        'input_hide_count',
        'input_weight_kg',
        'output_sqft',
        'reject_count',
        'tanning_chemical_cost',
        'labour_cost',
        'other_cost',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'processing_date' => 'date',
        'input_hide_count' => 'integer',
        'input_weight_kg' => 'decimal:2',
        'output_sqft' => 'decimal:2',
        'reject_count' => 'integer',
        'tanning_chemical_cost' => 'decimal:2',
        'labour_cost' => 'decimal:2',
        'other_cost' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function totalCost(): float
    {
        return (float) $this->tanning_chemical_cost + (float) $this->labour_cost + (float) $this->other_cost;
    }

    public function rejectRatePercent(): float
    {
        $input = (int) $this->input_hide_count;

        return $input > 0 ? round(((int) $this->reject_count / $input) * 100, 1) : 0.0;
    }

    public static function generateBatchNumber(): string
    {
        $date = date('Ymd');
        $random = str()->random(4);

        return "LPB-{$date}-{$random}";
    }
}
