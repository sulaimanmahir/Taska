<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
            'inventory_item_id' => [
                'required',
                'integer',
                Rule::exists('inventory_items', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'quantity' => ['required', 'numeric', 'min:0'],
            'type' => 'required|in:add,remove,set',
            'reason' => 'required|string',
        ];
    }
}
