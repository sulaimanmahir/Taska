<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolFeePayment extends Model
{
    protected $fillable = ['business_id', 'student_id', 'school_fee_structure_id', 'amount_paid', 'payment_method', 'receipt_number', 'paid_at'];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(StudentRecord::class, 'student_id');
    }

    public function structure(): BelongsTo
    {
        return $this->belongsTo(SchoolFeeStructure::class, 'school_fee_structure_id');
    }
}
