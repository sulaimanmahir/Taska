<?php

namespace Tests\Feature;

use App\Models\ClinicConsultation;
use App\Models\LabRequest;
use App\Models\LabTestCatalog;
use App\Models\PatientRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class HealthWorkflowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_health_business_can_run_consultation_and_lab_workflows(): void
    {
        $tenant = $this->createTenantContext('clinic', 'health-workflow@example.com');

        Sanctum::actingAs($tenant['user']);

        $patient = PatientRecord::create([
            'business_id' => $tenant['business']->id,
            'patient_code' => 'PAT-TEST-001',
            'full_name' => 'Amina Yusuf',
        ]);

        $labTest = LabTestCatalog::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Malaria Rapid Test',
            'sample_type' => 'blood',
            'reference_range' => 'negative',
            'price' => 2500,
            'turnaround_hours' => 2,
        ]);

        $consultation = $this->postJson('/api/health/consultations', [
            'patient_id' => $patient->id,
            'doctor_id' => $tenant['user']->id,
            'triage_vitals' => ['temperature' => 38.1],
            'diagnosis' => 'Suspected malaria',
            'billing_amount' => 5000,
            'amount_paid' => 2500,
        ])->assertCreated()
            ->assertJsonPath('patient.full_name', 'Amina Yusuf')
            ->assertJsonPath('diagnosis', 'Suspected malaria')
            ->json();

        $labRequest = $this->postJson('/api/health/lab-requests', [
            'patient_id' => $patient->id,
            'consultation_id' => $consultation['id'],
            'test_id' => $labTest->id,
            'requested_by' => $tenant['user']->id,
        ])->assertCreated()
            ->assertJsonPath('patient.full_name', 'Amina Yusuf')
            ->assertJsonPath('test.name', 'Malaria Rapid Test')
            ->json();

        $this->postJson("/api/health/lab-requests/{$labRequest['id']}/collect-sample", [
            'technician_id' => $tenant['user']->id,
        ])->assertOk()
            ->assertJsonPath('status', 'sample_collected');

        $this->postJson("/api/health/lab-requests/{$labRequest['id']}/submit-result", [
            'result_value' => 'positive',
            'technician_id' => $tenant['user']->id,
        ])->assertOk()
            ->assertJsonPath('status', 'review_pending')
            ->assertJsonPath('is_abnormal', true);

        $this->postJson("/api/health/lab-requests/{$labRequest['id']}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'approved');

        $rejectableRequest = LabRequest::create([
            'business_id' => $tenant['business']->id,
            'patient_id' => $patient->id,
            'consultation_id' => $consultation['id'],
            'test_id' => $labTest->id,
            'requested_by' => $tenant['user']->id,
            'sample_barcode' => 'LAB-REJECT-001',
            'status' => 'requested',
        ]);

        $this->postJson("/api/health/lab-requests/{$rejectableRequest->id}/reject", [
            'rejection_reason' => 'Clotted specimen',
        ])->assertOk()
            ->assertJsonPath('status', 'rejected')
            ->assertJsonPath('rejection_reason', 'Clotted specimen');
    }

    public function test_health_workflow_rejects_foreign_consultation_and_lab_relations(): void
    {
        $tenant = $this->createTenantContext('clinic', 'health-scope@example.com');
        $otherTenant = $this->createTenantContext('clinic', 'health-scope-other@example.com');

        Sanctum::actingAs($tenant['user']);

        $foreignPatient = PatientRecord::create([
            'business_id' => $otherTenant['business']->id,
            'patient_code' => 'PAT-FOREIGN-001',
            'full_name' => 'Foreign Patient',
        ]);

        $foreignLabTest = LabTestCatalog::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Test',
        ]);

        $foreignConsultation = ClinicConsultation::create([
            'business_id' => $otherTenant['business']->id,
            'patient_id' => $foreignPatient->id,
            'receipt_number' => 'RCT-FOREIGN-001',
        ]);

        $this->postJson('/api/health/consultations', [
            'patient_id' => $foreignPatient->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['patient_id']);

        $this->postJson('/api/health/lab-requests', [
            'patient_id' => $foreignPatient->id,
            'consultation_id' => $foreignConsultation->id,
            'test_id' => $foreignLabTest->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['patient_id', 'consultation_id', 'test_id']);
    }

    public function test_health_lab_request_actions_are_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('clinic', 'health-policy-owner@example.com');
        $otherTenant = $this->createTenantContext('clinic', 'health-policy-guest@example.com');

        $patient = PatientRecord::create([
            'business_id' => $tenant['business']->id,
            'patient_code' => 'PAT-OWNER-001',
            'full_name' => 'Owner Patient',
        ]);

        $labTest = LabTestCatalog::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Owner Test',
        ]);

        $labRequest = LabRequest::create([
            'business_id' => $tenant['business']->id,
            'patient_id' => $patient->id,
            'test_id' => $labTest->id,
            'requested_by' => $tenant['user']->id,
            'sample_barcode' => 'LAB-OWNER-001',
            'status' => 'requested',
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->postJson("/api/health/lab-requests/{$labRequest->id}/collect-sample", [])
            ->assertForbidden();

        $this->postJson("/api/health/lab-requests/{$labRequest->id}/approve", [])
            ->assertForbidden();
    }
}
