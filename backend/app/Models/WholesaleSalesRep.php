<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WholesaleSalesRep extends Model
{
    protected $fillable = [
        'business_id',
        'branch_id',
        'name',
        'phone',
        'status',
        'territory',
        'target_amount',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
    ];

    public function routeRuns(): HasMany
    {
        return $this->hasMany(WholesaleRouteRun::class, 'sales_rep_id');
    }
}
