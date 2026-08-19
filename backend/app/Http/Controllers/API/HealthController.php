<?php

namespace App\Http\Controllers\API;

use App\Concerns\ValidatesBusinessOwnership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Health\CollectLabSampleRequest;
use App\Http\Requests\Health\RejectLabSpecimenRequest;
use App\Http\Requests\Health\StoreConsultationRequest;
use App\Http\Requests\Health\StoreLabRequestRequest;
use App\Http\Requests\Health\SubmitLabResultRequest;
use App\Http\Resources\HealthConsultationResource;
use App\Http\Resources\HealthLabRequestResource;
use App\Models\ClinicAppointment;
use App\Models\ClinicConsultation;
use App\Models\LabRequest;
use App\Models\LabTestCatalog;
use App\Models\PatientRecord;
use App\Services\HealthService;
use Illuminate\Http\Request;

class HealthController extends Controller
{
    use ValidatesBusinessOwnership;

    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $patientSummary = PatientRecord::query()
            ->where('business_id', $businessId)
            ->selectRaw('COUNT(*) as patients_count')
            ->first();

        $appointmentSummary = ClinicAppointment::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(scheduled_for) = date('now') THEN 1 ELSE 0 END), 0) as appointments_today,
                COALESCE(SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END), 0) as upcoming_appointments
            ")
            ->first();

        $consultationSummary = ClinicConsultation::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END), 0) as consultations_today,
                COALESCE(SUM(billing_amount - amount_paid), 0) as unpaid_bills
            ")
            ->first();

        $labSummary = LabRequest::query()
            ->where('business_id', $businessId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'review_pending' THEN 1 ELSE 0 END), 0) as pending_approvals,
                COALESCE(SUM(CASE WHEN is_abnormal = 1 THEN 1 ELSE 0 END), 0) as abnormal_results,
                COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejected_specimens
            ")
            ->first();

        $turnaround = LabRequest::query()
            ->where('business_id', $businessId)
            ->whereNotNull('sample_collected_at')
            ->whereNotNull('approved_at')
            ->get()
            ->map(fn (LabRequest $entry) => $entry->sample_collected_at->diffInHours($entry->approved_at))
            ->avg();

        return response()->json([
            'summary' => [
                'patients_count' => (int) ($patientSummary?->patients_count ?? 0),
                'appointments_today' => (int) ($appointmentSummary?->appointments_today ?? 0),
                'upcoming_appointments' => (int) ($appointmentSummary?->upcoming_appointments ?? 0),
                'consultations_today' => (int) ($consultationSummary?->consultations_today ?? 0),
                'unpaid_bills' => (float) ($consultationSummary?->unpaid_bills ?? 0),
                'pending_approvals' => (int) ($labSummary?->pending_approvals ?? 0),
                'abnormal_results' => (int) ($labSummary?->abnormal_results ?? 0),
                'rejected_specimens' => (int) ($labSummary?->rejected_specimens ?? 0),
                'turnaround_hours' => round($turnaround ?? 0, 1),
            ],
        ]);
    }

    public function patients(Request $request)
    {
        return response()->json(
            PatientRecord::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with(['appointments', 'consultations', 'labRequests'])
                ->latest()
                ->get()
        );
    }

    public function storePatient(Request $request, HealthService $healthService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'full_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'blood_group' => 'nullable|string|max:10',
            'medical_history' => 'nullable|string',
            'hmo_provider' => 'nullable|string|max:255',
            'insurance_number' => 'nullable|string|max:255',
            'guardian_name' => 'nullable|string|max:255',
            'guardian_phone' => 'nullable|string|max:50',
        ]);

        return response()->json(
            $healthService->createPatient($validated, $businessId),
            201
        );
    }

    public function appointments(Request $request)
    {
        return response()->json(
            ClinicAppointment::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with(['patient', 'doctor', 'consultation'])
                ->latest('scheduled_for')
                ->get()
        );
    }

    public function storeAppointment(Request $request, HealthService $healthService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'patient_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('patient_records', $businessId),
            ],
            'doctor_id' => [
                'nullable',
                'integer',
                $this->activeBusinessUserRule($businessId),
            ],
            'scheduled_for' => 'required|date',
            'reason' => 'nullable|string',
            'referral_source' => 'nullable|string|max:255',
        ]);

        return response()->json(
            $healthService->createAppointment($validated, $businessId),
            201
        );
    }

    public function consultations(Request $request)
    {
        return response()->json(
            HealthConsultationResource::collection(
                ClinicConsultation::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with(['patient', 'appointment', 'doctor', 'labRequests'])
                ->latest()
                ->get()
            )->resolve()
        );
    }

    public function storeConsultation(StoreConsultationRequest $request, HealthService $healthService)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        return response()->json(
            (new HealthConsultationResource(
                $healthService->createConsultation($validated, $businessId)->loadMissing('labRequests')
            ))->resolve(),
            201
        );
    }

    public function labTests(Request $request)
    {
        return response()->json(
            LabTestCatalog::query()
                ->where('business_id', $request->user()->current_business_id)
                ->latest()
                ->get()
        );
    }

    public function storeLabTest(Request $request, HealthService $healthService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sample_type' => 'nullable|string|max:255',
            'reference_range' => 'nullable|string|max:255',
            'price' => 'nullable|numeric|min:0',
            'turnaround_hours' => 'nullable|integer|min:1',
        ]);

        return response()->json(
            $healthService->createLabTest($validated, $request->user()->current_business_id),
            201
        );
    }

    public function labRequests(Request $request)
    {
        return response()->json(
            HealthLabRequestResource::collection(
                LabRequest::query()
                ->where('business_id', $request->user()->current_business_id)
                ->with(['patient', 'consultation', 'test', 'technician'])
                ->latest()
                ->get()
            )->resolve()
        );
    }

    public function storeLabRequest(StoreLabRequestRequest $request, HealthService $healthService)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        return response()->json(
            (new HealthLabRequestResource($healthService->createLabRequest($validated, $businessId)))->resolve(),
            201
        );
    }

    public function collectSample(CollectLabSampleRequest $request, LabRequest $labRequest, HealthService $healthService)
    {
        $this->authorize('update', $labRequest);

        return response()->json(
            (new HealthLabRequestResource($healthService->collectSample($labRequest, $request->validated())))->resolve()
        );
    }

    public function submitLabResult(SubmitLabResultRequest $request, LabRequest $labRequest, HealthService $healthService)
    {
        $this->authorize('update', $labRequest);

        return response()->json(
            (new HealthLabRequestResource($healthService->submitResult($labRequest, $request->validated())))->resolve()
        );
    }

    public function approveLabResult(Request $request, LabRequest $labRequest, HealthService $healthService)
    {
        $this->authorize('update', $labRequest);

        return response()->json((new HealthLabRequestResource($healthService->approveResult($labRequest)))->resolve());
    }

    public function rejectLabSpecimen(RejectLabSpecimenRequest $request, LabRequest $labRequest, HealthService $healthService)
    {
        $this->authorize('update', $labRequest);

        return response()->json(
            (new HealthLabRequestResource(
                $healthService->rejectSpecimen($labRequest, $request->validated()['rejection_reason'])
            ))->resolve()
        );
    }
}
