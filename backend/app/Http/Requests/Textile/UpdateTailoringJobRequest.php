<?php

namespace App\Http\Requests\Textile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTailoringJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'assigned_tailor' => ['nullable', 'string', 'max:255'],
            'stage' => ['nullable', 'in:cutting,stitching,fitting,finishing,completed'],
            'priority' => ['nullable', 'in:normal,urgent'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
