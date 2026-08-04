<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HealthLabRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'patient_id' => $this->patient_id,
            'consultation_id' => $this->consultation_id,
            'test_id' => $this->test_id,
            'requested_by' => $this->requested_by,
            'technician_id' => $this->technician_id,
            'sample_barcode' => $this->sample_barcode,
            'status' => $this->status,
            'result_value' => $this->result_value,
            'is_abnormal' => $this->is_abnormal,
            'rejection_reason' => $this->rejection_reason,
            'sample_collected_at' => $this->sample_collected_at?->toJSON(),
            'approved_at' => $this->approved_at?->toJSON(),
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient?->id,
                'patient_code' => $this->patient?->patient_code,
                'full_name' => $this->patient?->full_name,
                'phone' => $this->patient?->phone,
            ]),
            'consultation' => $this->whenLoaded('consultation', fn () => [
                'id' => $this->consultation?->id,
                'receipt_number' => $this->consultation?->receipt_number,
                'diagnosis' => $this->consultation?->diagnosis,
            ]),
            'test' => $this->whenLoaded('test', fn () => [
                'id' => $this->test?->id,
                'name' => $this->test?->name,
                'sample_type' => $this->test?->sample_type,
                'reference_range' => $this->test?->reference_range,
                'turnaround_hours' => $this->test?->turnaround_hours,
            ]),
            'technician' => $this->whenLoaded('technician', fn () => [
                'id' => $this->technician?->id,
                'name' => $this->technician?->name,
                'email' => $this->technician?->email,
            ]),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
