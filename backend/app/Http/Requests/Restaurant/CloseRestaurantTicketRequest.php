<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class CloseRestaurantTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'waste_cost_total' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
