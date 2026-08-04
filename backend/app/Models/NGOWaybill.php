<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NGOWaybill extends Model
{
    protected $table = 'ngo_waybills';

    protected $fillable = [
        'distribution_id',
        'waybill_number',
        'driver_name',
        'vehicle_reference',
        'status',
    ];
}
