<?php

namespace Tests\Feature;

use App\Models\ClinicAppointment;
use App\Models\ClinicConsultation;
use App\Models\LabRequest;
use App\Models\LabTestCatalog;
use App\Models\PatientRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class HealthOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_clinic_and_lab_can_run_patient_to_result_workflow(): void
    {
        $tenant = $this->createTenantContext('clinic', 'clinic-owner@example.com');

        Sanctum::actingAs($tenant['user']);

        $patientId = $this->postJson('/api/health/patients', [
            'branch_id' => $tenant['branch']->id,
            'full_name' => 'Ifeanyi Okeke',
            'phone' => '08036667777',
            'gender' => 'Male',
            'blood_group' => 'A+',
            'medical_history' => 'Hypertension',
            'hmo_provider' => 'AXA Mansard',
            'insurance_number' => 'HMO-7782',
        ])->assertCreated()
            ->assertJsonPath('full_name', 'Ifeanyi Okeke')
            ->json('id');

        $appointmentId = $this->postJson('/api/health/appointments', [
            'branch_id' => $tenant['branch']->id,
            'patient_id' => $patientId,
            'scheduled_for' => now()->addHour()->toISOString(),
            'reason' => 'Recurring fever',
            'referral_source' => 'Walk-in',
        ])->assertCreated()
            ->assertJsonPath('status', 'scheduled')
            ->json('id');

        $consultationId = $this->postJson('/api/health/consultations', [
            'appointment_id' => $appointmentId,
            'patient_id' => $patientId,
            'triage_vitals' => [
                'temperature' => '38.4',
                'blood_pressure' => '125/85',
                'pulse_rate' => '92',
            ],
            'doctor_notes' => 'Patient reports weakness and fever for three days.',
            'diagnosis' => 'Suspected malaria',
            'treatment_plan' => 'Run malaria parasite test and start hydration.',
            'follow_up_date' => now()->addDays(3)->toISOString(),
            'billing_amount' => 18000,
            'amount_paid' => 9000,
        ])->assertCreated()
            ->assertJsonPath('receipt_number', fn ($value) => str($value)->startsWith('RCT-'))
            ->json('id');

        $this->getJson('/api/health/appointments')
            ->assertOk()
            ->assertJsonPath('0.status', 'completed');

        $labTestId = $this->postJson('/api/health/lab-tests', [
            'name' => 'Malaria Parasite Test',
            'sample_type' => 'Blood',
            'reference_range' => 'negative',
            'price' => 7500,
            'turnaround_hours' => 6,
        ])->assertCreated()
            ->assertJsonPath('name', 'Malaria Parasite Test')
            ->json('id');

        $labRequestId = $this->postJson('/api/health/lab-requests', [
            'patient_id' => $patientId,
            'consultation_id' => $consultationId,
            'test_id' => $labTestId,
        ])->assertCreated()
            ->assertJsonPath('status', 'requested')
            ->assertJsonPath('sample_barcode', fn ($value) => str($value)->startsWith('LAB-'))
            ->json('id');

        $this->postJson("/api/health/lab-requests/{$labRequestId}/collect-sample")
            ->assertOk()
            ->assertJsonPath('status', 'sample_collected');

        $this->postJson("/api/health/lab-requests/{$labRequestId}/submit-result", [
            'result_value' => 'positive',
        ])->assertOk()
            ->assertJsonPath('status', 'review_pending')
            ->assertJsonPath('is_abnormal', true);

        $this->postJson("/api/health/lab-requests/{$labRequestId}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'approved');

        $rejectedLabRequestId = $this->postJson('/api/health/lab-requests', [
            'patient_id' => $patientId,
            'consultation_id' => $consultationId,
            'test_id' => $labTestId,
        ])->assertCreated()
            ->json('id');

        $this->postJson("/api/health/lab-requests/{$rejectedLabRequestId}/reject", [
            'rejection_reason' => 'Sample contaminated during collection',
        ])->assertOk()
            ->assertJsonPath('status', 'rejected')
            ->assertJsonPath('rejection_reason', 'Sample contaminated during collection');

        $this->getJson('/api/health/overview')
            ->assertOk()
            ->assertJsonPath('summary.patients_count', 1)
            ->assertJsonPath('summary.consultations_today', 1)
            ->assertJsonPath('summary.unpaid_bills', 9000)
            ->assertJsonPath('summary.abnormal_results', 1)
            ->assertJsonPath('summary.rejected_specimens', 1);
    }

    public function test_health_endpoints_reject_foreign_tenant_relations_and_clinicians(): void
    {
        $tenant = $this->createTenantContext('clinic', 'clinic-scope@example.com');
        $otherTenant = $this->createTenantContext('clinic', 'clinic-other@example.com');

        $foreignClinician = User::factory()->create([
            'email' => 'foreign-clinician@example.com',
            'role' => 'doctor',
        ]);
        $this->attachActiveMember($foreignClinician, $otherTenant['business']->id);

        $foreignPatient = PatientRecord::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'patient_code' => 'PAT-FOREIGN-001',
            'full_name' => 'Foreign Patient',
        ]);

        $foreignAppointment = ClinicAppointment::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'patient_id' => $foreignPatient->id,
            'doctor_id' => $foreignClinician->id,
            'appointment_code' => 'APT-FOREIGN-001',
            'scheduled_for' => now()->addHour(),
            'status' => 'scheduled',
        ]);

        $foreignConsultation = ClinicConsultation::create([
            'business_id' => $otherTenant['business']->id,
            'appointment_id' => $foreignAppointment->id,
            'patient_id' => $foreignPatient->id,
            'doctor_id' => $foreignClinician->id,
            'receipt_number' => 'RCT-FOREIGN-001',
        ]);

        $foreignLabTest = LabTestCatalog::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Lab Test',
        ]);

        $foreignLabRequest = LabRequest::create([
            'business_id' => $otherTenant['business']->id,
            'patient_id' => $foreignPatient->id,
            'consultation_id' => $foreignConsultation->id,
            'test_id' => $foreignLabTest->id,
            'requested_by' => $foreignClinician->id,
            'sample_barcode' => 'LAB-FOREIGN-001',
            'status' => 'requested',
        ]);

        $localPatient = PatientRecord::create([
            'business_id' => $tenant['business']->id,
            'branch_id' => $tenant['branch']->id,
            'patient_code' => 'PAT-LOCAL-001',
            'full_name' => 'Local Patient',
        ]);

        $localLabTest = LabTestCatalog::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Local Lab Test',
        ]);

        $localLabRequest = LabRequest::create([
            'business_id' => $tenant['business']->id,
            'patient_id' => $localPatient->id,
            'test_id' => $localLabTest->id,
            'sample_barcode' => 'LAB-LOCAL-001',
            'status' => 'requested',
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/health/patients', [
            'branch_id' => $otherTenant['branch']->id,
            'full_name' => 'Invalid Branch Patient',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);

        $this->postJson('/api/health/appointments', [
            'branch_id' => $otherTenant['branch']->id,
            'patient_id' => $foreignPatient->id,
            'doctor_id' => $foreignClinician->id,
            'scheduled_for' => now()->addHour()->toISOString(),
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'patient_id', 'doctor_id']);

        $this->postJson('/api/health/consultations', [
            'appointment_id' => $foreignAppointment->id,
            'patient_id' => $foreignPatient->id,
            'doctor_id' => $foreignClinician->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['appointment_id', 'patient_id', 'doctor_id']);

        $this->postJson('/api/health/lab-requests', [
            'patient_id' => $foreignPatient->id,
            'consultation_id' => $foreignConsultation->id,
            'test_id' => $foreignLabTest->id,
            'requested_by' => $foreignClinician->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['patient_id', 'consultation_id', 'test_id', 'requested_by']);

        $this->postJson("/api/health/lab-requests/{$localLabRequest->id}/collect-sample", [
            'technician_id' => $foreignClinician->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['technician_id']);

        $this->postJson("/api/health/lab-requests/{$localLabRequest->id}/submit-result", [
            'result_value' => 'positive',
            'technician_id' => $foreignClinician->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['technician_id']);

        $this->postJson("/api/health/lab-requests/{$foreignLabRequest->id}/approve")
            ->assertStatus(403);
    }

    private function attachActiveMember(User $user, int $businessId): void
    {
        DB::table('business_user')->insert([
            'business_id' => $businessId,
            'user_id' => $user->id,
            'role_id' => null,
            'branch_id' => null,
            'status' => 'active',
            'joined_at' => now(),
            'created_by' => null,
        ]);
    }
}
