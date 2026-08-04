<?php

namespace App\Http\Requests\Pharmacy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DispensePharmacyProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;
        $selectedProductId = (int) $this->input('product_id');

        return [
            'customer_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('customers', $businessId),
            ],
            'product_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'product_batch_id' => [
                'required',
                'integer',
                Rule::exists('product_batches', 'id')->where(function ($query) use ($businessId, $selectedProductId) {
                    $query->where('business_id', $businessId)
                        ->where('product_id', $selectedProductId);
                }),
            ],
            'substituted_from_product_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('products', $businessId),
            ],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'prescription_reference' => ['nullable', 'string'],
            'create_refill_reminder' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
            'dispensed_at' => ['nullable', 'date'],
        ];
    }

    private function businessOwnedRule(string $table, int $businessId)
    {
        return Rule::exists($table, 'id')->where(
            fn ($query) => $query->where('business_id', $businessId)
        );
    }
}
