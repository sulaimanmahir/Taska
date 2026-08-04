<?php

namespace App\Http\Requests\Health;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CollectLabSampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = (int) $this->user()->current_business_id;

        return [
            'technician_id' => [
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
        ];
    }
}
