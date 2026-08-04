<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LabTestCatalog extends Model
{
    protected $table = 'lab_test_catalog';

    protected $fillable = [
        'business_id',
        'name',
        'sample_type',
        'reference_range',
        'price',
        'turnaround_hours',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function requests(): HasMany
    {
        return $this->hasMany(LabRequest::class, 'test_id');
    }
}
