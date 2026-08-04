<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HealthConsultationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'appointment_id' => $this->appointment_id,
            'patient_id' => $this->patient_id,
            'doctor_id' => $this->doctor_id,
            'triage_vitals' => $this->triage_vitals,
            'doctor_notes' => $this->doctor_notes,
            'diagnosis' => $this->diagnosis,
            'treatment_plan' => $this->treatment_plan,
            'follow_up_date' => $this->follow_up_date?->toJSON(),
            'billing_amount' => $this->billing_amount,
            'amount_paid' => $this->amount_paid,
            'receipt_number' => $this->receipt_number,
            'patient' => $this->whenLoaded('patient', fn () => [
                'id' => $this->patient?->id,
                'patient_code' => $this->patient?->patient_code,
                'full_name' => $this->patient?->full_name,
                'phone' => $this->patient?->phone,
                'gender' => $this->patient?->gender,
            ]),
            'appointment' => $this->whenLoaded('appointment', fn () => [
                'id' => $this->appointment?->id,
                'appointment_code' => $this->appointment?->appointment_code,
                'scheduled_for' => $this->appointment?->scheduled_for?->toJSON(),
                'status' => $this->appointment?->status,
                'reason' => $this->appointment?->reason,
            ]),
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id' => $this->doctor?->id,
                'name' => $this->doctor?->name,
                'email' => $this->doctor?->email,
            ]),
            'lab_requests_count' => $this->whenLoaded('labRequests', fn () => $this->labRequests->count()),
            'created_at' => $this->created_at?->toJSON(),
            'updated_at' => $this->updated_at?->toJSON(),
        ];
    }
}
