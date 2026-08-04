<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionBatch extends Model
{
    protected $table = 'production_batches';

    protected $fillable = [
        'business_id',
        'batch_number',
        'production_date',
        'status',
        'total_input_quantity',
        'total_output_quantity',
        'damaged_quantity',
        'wastage_quantity',
        'notes',
        'power_source_mix',
        'machine_runtime_hours',
        'downtime_minutes',
        'public_power_hours',
        'electricity_cost',
        'generator_runtime_hours',
        'generator_fuel_cost',
        'solar_backup_cost',
        'labour_cost',
        'treatment_chemical_cost',
        'loading_cost',
        'maintenance_allocation',
        'packaging_cost_total',
        'total_batch_cost',
        'estimated_revenue',
        'gross_margin',
        'net_margin',
        'cost_per_bag',
        'cost_per_sachet',
        'leakage_losses',
        'torn_sacks',
        'damaged_nylon',
        'created_by',
    ];

    protected $casts = [
        'production_date' => 'date',
        'power_source_mix' => 'array',
        'total_input_quantity' => 'decimal:2',
        'total_output_quantity' => 'decimal:2',
        'damaged_quantity' => 'decimal:2',
        'wastage_quantity' => 'decimal:2',
        'machine_runtime_hours' => 'decimal:2',
        'public_power_hours' => 'decimal:2',
        'electricity_cost' => 'decimal:2',
        'generator_runtime_hours' => 'decimal:2',
        'generator_fuel_cost' => 'decimal:2',
        'solar_backup_cost' => 'decimal:2',
        'labour_cost' => 'decimal:2',
        'treatment_chemical_cost' => 'decimal:2',
        'loading_cost' => 'decimal:2',
        'maintenance_allocation' => 'decimal:2',
        'packaging_cost_total' => 'decimal:2',
        'total_batch_cost' => 'decimal:2',
        'estimated_revenue' => 'decimal:2',
        'gross_margin' => 'decimal:2',
        'net_margin' => 'decimal:2',
        'cost_per_bag' => 'decimal:4',
        'cost_per_sachet' => 'decimal:4',
        'leakage_losses' => 'decimal:2',
        'torn_sacks' => 'decimal:2',
        'damaged_nylon' => 'decimal:2',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function materials(): HasMany
    {
        return $this->hasMany(ProductionMaterial::class);
    }

    public function outputs(): HasMany
    {
        return $this->hasMany(ProductionOutput::class);
    }

    public function energyLogs(): HasMany
    {
        return $this->hasMany(ProductionEnergyLog::class, 'production_batch_id');
    }

    public function wastageLogs(): HasMany
    {
        return $this->hasMany(ProductionWastageLog::class, 'production_batch_id');
    }

    public static function generateBatchNumber(): string
    {
        $date = date('Ymd');
        $random = str()->random(4);

        return "BATCH-{$date}-{$random}";
    }
}
