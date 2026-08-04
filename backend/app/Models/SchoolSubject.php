<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolSubject extends Model
{
    protected $fillable = ['business_id', 'name', 'department', 'subject_teacher_id'];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subject_teacher_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(StudentResult::class);
    }
}
