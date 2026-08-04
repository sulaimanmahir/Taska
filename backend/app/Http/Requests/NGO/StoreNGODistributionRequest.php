<?php

namespace App\Http\Requests\NGO;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNGODistributionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'partner_request_id' => ['nullable', Rule::exists('ngo_partner_requests', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'donor_source_id' => ['nullable', Rule::exists('ngo_donor_sources', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'beneficiary_name' => ['required', 'string', 'max:255'],
            'destination_location' => ['nullable', 'string', 'max:255'],
            'driver_name' => ['nullable', 'string', 'max:255'],
            'vehicle_reference' => ['nullable', 'string', 'max:255'],
            'distributed_on' => ['nullable', 'date'],
            'status' => ['nullable', 'in:planned,dispatched,delivered'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', Rule::exists('products', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
        ];
    }
}
