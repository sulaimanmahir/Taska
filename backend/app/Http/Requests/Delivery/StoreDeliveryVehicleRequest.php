<?php

namespace App\Http\Requests\Delivery;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDeliveryVehicleRequest extends FormRequest
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
            'assigned_user_id' => [
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
            'vehicle_type' => 'required|string|max:100',
            'ownership_model' => 'required|in:company_owned,investor_owned,partner_owned,rider_owned,investor_rider',
            'plate_number' => 'nullable|string|max:100',
            'owner_name' => 'required|string|max:255',
            'purchase_value' => 'nullable|numeric|min:0',
            'fuel_responsibility' => 'required|in:company,owner,rider',
            'maintenance_responsibility' => 'required|in:company,owner,rider',
            'is_active' => 'nullable|boolean',
        ];
    }
}
