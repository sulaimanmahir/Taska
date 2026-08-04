<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SMEDailyTarget extends Model
{
    protected $table = 'sme_daily_targets';

    protected $fillable = [
        'business_id',
        'branch_id',
        'target_date',
        'sales_target',
        'collection_target',
        'expense_limit',
        'actual_sales',
        'actual_collections',
        'actual_expenses',
        'status',
        'notes',
    ];

    protected $casts = [
        'target_date' => 'date',
    ];
}
