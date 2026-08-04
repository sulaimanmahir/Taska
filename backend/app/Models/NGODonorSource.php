<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NGODonorSource extends Model
{
    protected $table = 'ngo_donor_sources';

    protected $fillable = [
        'business_id',
        'name',
        'contact_person',
        'phone',
        'compliance_reference',
    ];
}
