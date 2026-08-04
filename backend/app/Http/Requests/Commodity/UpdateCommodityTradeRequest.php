<?php

namespace App\Http\Requests\Commodity;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommodityTradeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:open,closed,cancelled'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', 'in:unpaid,partial,paid'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
