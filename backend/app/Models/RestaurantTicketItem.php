<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantTicketItem extends Model
{
    protected $fillable = [
        'business_id',
        'restaurant_ticket_id',
        'product_id',
        'course_name',
        'quantity',
        'unit_price',
        'recipe_cost',
        'service_status',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_price' => 'decimal:2',
        'recipe_cost' => 'decimal:2',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(RestaurantTicket::class, 'restaurant_ticket_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
