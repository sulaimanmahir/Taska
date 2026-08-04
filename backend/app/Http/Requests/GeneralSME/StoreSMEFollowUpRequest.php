<?php

namespace App\Http\Requests\GeneralSME;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSMEFollowUpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $businessId = $this->user()?->current_business_id;

        return [
            'customer_id' => ['nullable', Rule::exists('customers', 'id')->where(fn ($query) => $query->where('business_id', $businessId))],
            'assigned_to' => ['nullable', Rule::exists('users', 'id')->where(function ($query) use ($businessId) {
                $query->whereExists(function ($membershipQuery) use ($businessId) {
                    $membershipQuery
                        ->selectRaw('1')
                        ->from('business_user')
                        ->whereColumn('business_user.user_id', 'users.id')
                        ->where('business_user.business_id', $businessId)
                        ->where('business_user.status', 'active');
                });
            })],
            'category' => 'nullable|string|max:255',
            'status' => 'nullable|in:open,in_progress,completed',
            'title' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'amount_in_focus' => 'nullable|numeric|min:0',
            'due_on' => 'required|date',
        ];
    }
}
