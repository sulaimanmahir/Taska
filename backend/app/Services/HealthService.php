<?php

namespace App\Services;

use App\Models\ClinicAppointment;
use App\Models\ClinicConsultation;
use App\Models\LabRequest;
use App\Models\LabTestCatalog;
use App\Models\PatientRecord;
use Illuminate\Support\Facades\DB;

class HealthService
{
    public function createPatient(array $payload, int $businessId): PatientRecord
    {
        return PatientRecord::create([
            ...$payload,
            'business_id' => $businessId,
            'patient_code' => 'PAT-' . $businessId . '-' . strtoupper(str()->random(6)),
        ]);
    }

    public function createAppointment(array $payload, int $businessId): ClinicAppointment
    {
        $appointment = ClinicAppointment::create([
            ...$payload,
            'business_id' => $businessId,
            'appointment_code' => 'APT-' . $businessId . '-' . strtoupper(str()->random(6)),
        ]);

        return $appointment->fresh(['patient', 'doctor', 'consultation']);
    }

    public function createConsultation(array $payload, int $businessId): ClinicConsultation
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $consultation = ClinicConsultation::create([
                ...$payload,
                'business_id' => $businessId,
                'receipt_number' => 'RCT-' . $businessId . '-' . strtoupper(str()->random(6)),
            ]);

            if (!empty($payload['appointment_id'])) {
                ClinicAppointment::whereKey($payload['appointment_id'])->update([
                    'status' => 'completed',
                ]);
            }

            return $consultation->load(['patient', 'appointment', 'doctor']);
        });
    }

    public function createLabTest(array $payload, int $businessId): LabTestCatalog
    {
        return LabTestCatalog::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createLabRequest(array $payload, int $businessId): LabRequest
    {
        $labRequest = LabRequest::create([
            ...$payload,
            'business_id' => $businessId,
            'sample_barcode' => 'LAB-' . $businessId . '-' . strtoupper(str()->random(8)),
        ]);

        return $labRequest->fresh(['patient', 'consultation', 'test', 'technician']);
    }

    public function collectSample(LabRequest $request, array $payload): LabRequest
    {
        $request->update([
            'technician_id' => $payload['technician_id'] ?? $request->technician_id,
            'status' => 'sample_collected',
            'sample_collected_at' => now(),
        ]);

        return $request->fresh(['patient', 'test', 'technician']);
    }

    public function submitResult(LabRequest $request, array $payload): LabRequest
    {
        $reference = strtolower((string) $request->test?->reference_range);
        $resultValue = (string) ($payload['result_value'] ?? '');
        $isAbnormal = !empty($payload['is_abnormal']);

        if (!$isAbnormal && $reference !== '') {
            $isAbnormal = !str_contains($reference, strtolower($resultValue));
        }

        $request->update([
            'status' => 'review_pending',
            'result_value' => $resultValue,
            'is_abnormal' => $isAbnormal,
            'technician_id' => $payload['technician_id'] ?? $request->technician_id,
        ]);

        return $request->fresh(['patient', 'test', 'technician']);
    }

    public function approveResult(LabRequest $request): LabRequest
    {
        $request->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        return $request->fresh(['patient', 'test', 'technician']);
    }

    public function rejectSpecimen(LabRequest $request, string $reason): LabRequest
    {
        $request->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
        ]);

        return $request->fresh(['patient', 'test', 'technician']);
    }
}
