<?php

namespace App\Http\Requests\Purchases;

use App\Models\Purchase;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReceivePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        /** @var Purchase $purchase */
        $purchase = $this->route('purchase');

        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id' => [
                'required',
                'integer',
                Rule::exists('purchase_items', 'id')->where(
                    fn ($query) => $query->where('purchase_id', $purchase->id)
                ),
            ],
            'items.*.quantity_received' => ['required', 'numeric', 'min:0.001'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
