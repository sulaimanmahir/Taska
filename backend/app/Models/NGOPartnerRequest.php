<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NGOPartnerRequest extends Model
{
    protected $table = 'ngo_partner_requests';

    protected $fillable = [
        'business_id',
        'branch_id',
        'partner_name',
        'request_reference',
        'status',
        'request_notes',
        'needed_by',
    ];

    protected $casts = [
        'needed_by' => 'date',
    ];
}
