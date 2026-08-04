<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WholesaleRouteRun extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'sales_rep_id',
        'route_name',
        'status',
        'route_date',
        'vehicle_reference',
        'target_amount',
        'actual_amount',
        'notes',
    ];

    protected $casts = [
        'route_date' => 'date',
        'target_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
    ];

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(WholesaleSalesRep::class, 'sales_rep_id');
    }

    public function stops(): HasMany
    {
        return $this->hasMany(WholesaleRouteStop::class, 'route_run_id');
    }
}
