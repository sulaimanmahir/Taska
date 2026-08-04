<?php

namespace App\Http\Requests\GeneralSME;

use Illuminate\Foundation\Http\FormRequest;

class StoreSMEDailyTargetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'target_date' => 'required|date',
            'sales_target' => 'nullable|numeric|min:0',
            'collection_target' => 'nullable|numeric|min:0',
            'expense_limit' => 'nullable|numeric|min:0',
            'actual_sales' => 'nullable|numeric|min:0',
            'actual_collections' => 'nullable|numeric|min:0',
            'actual_expenses' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:open,closed',
            'notes' => 'nullable|string',
        ];
    }
}
