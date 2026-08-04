<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDeliveryOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
            'branch_id' => [
                'nullable',
                'integer',
                Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'pickup_branch_id' => [
                'nullable',
                'integer',
                Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'dropoff_branch_id' => [
                'nullable',
                'integer',
                Rule::exists('branches', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'assigned_rider_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')->where(function ($query) use ($businessId) {
                    $query->whereExists(function ($subQuery) use ($businessId) {
                        $subQuery->selectRaw('1')
                            ->from('business_user')
                            ->whereColumn('business_user.user_id', 'users.id')
                            ->where('business_user.business_id', $businessId)
                            ->where('business_user.status', 'active');
                    });
                }),
            ],
            'vehicle_id' => [
                'nullable',
                'integer',
                Rule::exists('delivery_vehicles', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'parcel_category' => ['required', 'string', 'max:255'],
            'parcel_description' => ['nullable', 'string'],
            'pricing_model' => ['required', Rule::in(['flat', 'distance'])],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'base_fee' => ['required', 'numeric', 'min:0'],
            'distance_fee' => ['nullable', 'numeric', 'min:0'],
            'urgent_fee' => ['nullable', 'numeric', 'min:0'],
            'cod_amount' => ['nullable', 'numeric', 'min:0'],
            'is_urgent' => ['nullable', 'boolean'],
            'pickup_address' => ['required', 'string', 'max:255'],
            'dropoff_address' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'sender' => ['required', 'array'],
            'sender.name' => ['required', 'string', 'max:255'],
            'sender.phone' => ['required', 'string', 'max:50'],
            'sender.email' => ['nullable', 'email'],
            'sender.address' => ['nullable', 'string', 'max:255'],
            'sender.landmark' => ['nullable', 'string', 'max:255'],
            'recipient' => ['required', 'array'],
            'recipient.name' => ['required', 'string', 'max:255'],
            'recipient.phone' => ['required', 'string', 'max:50'],
            'recipient.email' => ['nullable', 'email'],
            'recipient.address' => ['nullable', 'string', 'max:255'],
            'recipient.landmark' => ['nullable', 'string', 'max:255'],
            'offline' => ['nullable', 'array'],
            'offline.created_offline' => ['nullable', 'boolean'],
            'offline.device_id' => ['nullable', 'string', 'max:255'],
            'offline.local_timestamp' => ['nullable', 'date'],
        ];
    }
}
