<?php

namespace App\Models;

use App\Concerns\BelongsToBusiness;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GrainMillingBatch extends Model
{
    use BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'batch_number',
        'milling_date',
        'status',
        'grain_type',
        'input_quantity_kg',
        'output_quantity_kg',
        'byproduct_quantity_kg',
        'wastage_quantity_kg',
        'labour_cost',
        'electricity_cost',
        'packaging_cost',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'milling_date' => 'date',
        'input_quantity_kg' => 'decimal:2',
        'output_quantity_kg' => 'decimal:2',
        'byproduct_quantity_kg' => 'decimal:2',
        'wastage_quantity_kg' => 'decimal:2',
        'labour_cost' => 'decimal:2',
        'electricity_cost' => 'decimal:2',
        'packaging_cost' => 'decimal:2',
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
        return (float) $this->labour_cost + (float) $this->electricity_cost + (float) $this->packaging_cost;
    }

    public function yieldPercent(): float
    {
        $input = (float) $this->input_quantity_kg;

        return $input > 0 ? round(((float) $this->output_quantity_kg / $input) * 100, 1) : 0.0;
    }

    public static function generateBatchNumber(): string
    {
        $date = date('Ymd');
        $random = str()->random(4);

        return "GMB-{$date}-{$random}";
    }
}
