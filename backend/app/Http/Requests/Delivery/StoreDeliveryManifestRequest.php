<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDeliveryManifestRequest extends FormRequest
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
            'vehicle_id' => [
                'nullable',
                'integer',
                Rule::exists('delivery_vehicles', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
            'rider_id' => [
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
            'title' => 'required|string|max:255',
            'status' => 'nullable|in:draft,dispatched',
            'notes' => 'nullable|string',
            'delivery_order_ids' => 'required|array|min:1',
            'delivery_order_ids.*' => [
                'integer',
                Rule::exists('delivery_orders', 'id')->where(fn ($query) => $query->where('business_id', $businessId)),
            ],
        ];
    }
}
