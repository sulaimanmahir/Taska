<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefillReminder extends Model
{
    protected $fillable = ['business_id', 'customer_id', 'product_id', 'pharmacy_dispense_id', 'due_on', 'status', 'notes'];

    protected $casts = ['due_on' => 'date'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function dispense(): BelongsTo
    {
        return $this->belongsTo(PharmacyDispense::class, 'pharmacy_dispense_id');
    }
}
