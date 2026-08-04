<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\AcademicTerm;
use App\Models\SchoolClassroom;
use App\Models\SchoolSubject;
use App\Models\StudentEnrollment;
use App\Models\StudentRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class SchoolWorkflowTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_school_business_can_record_attendance_results_and_promotions(): void
    {
        $tenant = $this->createTenantContext('school', 'school-workflow@example.com');

        Sanctum::actingAs($tenant['user']);

        $session = AcademicSession::create([
            'business_id' => $tenant['business']->id,
            'name' => '2026/2027',
            'starts_on' => now()->startOfYear()->toDateString(),
            'ends_on' => now()->endOfYear()->toDateString(),
        ]);

        $term = AcademicTerm::create([
            'business_id' => $tenant['business']->id,
            'academic_session_id' => $session->id,
            'name' => 'First Term',
            'starts_on' => now()->startOfMonth()->toDateString(),
            'ends_on' => now()->addMonths(3)->toDateString(),
        ]);

        $classroom = SchoolClassroom::create([
            'business_id' => $tenant['business']->id,
            'name' => 'JSS 1 Blue',
        ]);

        $subject = SchoolSubject::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Mathematics',
        ]);

        $student = StudentRecord::create([
            'business_id' => $tenant['business']->id,
            'admission_number' => 'STD-001',
            'full_name' => 'Halima Bello',
            'status' => 'active',
        ]);

        $enrollment = StudentEnrollment::create([
            'business_id' => $tenant['business']->id,
            'student_id' => $student->id,
            'academic_session_id' => $session->id,
            'academic_term_id' => $term->id,
            'school_classroom_id' => $classroom->id,
            'enrollment_status' => 'enrolled',
        ]);

        $this->postJson('/api/school/attendance', [
            'student_id' => $student->id,
            'academic_term_id' => $term->id,
            'attendance_date' => now()->toDateString(),
            'status' => 'present',
            'notes' => 'On time for morning assembly',
        ])->assertCreated()
            ->assertJsonPath('student.full_name', 'Halima Bello')
            ->assertJsonPath('status', 'present');

        $this->postJson('/api/school/results', [
            'student_id' => $student->id,
            'academic_term_id' => $term->id,
            'school_subject_id' => $subject->id,
            'score' => 84,
            'teacher_comment' => 'Strong performance',
        ])->assertCreated()
            ->assertJsonPath('student.full_name', 'Halima Bello')
            ->assertJsonPath('subject.name', 'Mathematics')
            ->assertJsonPath('grade', 'A');

        $this->postJson("/api/school/enrollments/{$enrollment->id}/promote", [
            'decision' => 'graduated',
        ])->assertOk()
            ->assertJsonPath('promotion_decision', 'graduated')
            ->assertJsonPath('student.status', 'graduated')
            ->assertJsonPath('student.is_alumni', true);
    }

    public function test_school_workflow_rejects_foreign_attendance_and_result_relations(): void
    {
        $tenant = $this->createTenantContext('school', 'school-scope@example.com');
        $otherTenant = $this->createTenantContext('school', 'school-scope-other@example.com');

        Sanctum::actingAs($tenant['user']);

        $foreignSession = AcademicSession::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Session',
            'starts_on' => now()->startOfYear()->toDateString(),
            'ends_on' => now()->endOfYear()->toDateString(),
        ]);

        $foreignTerm = AcademicTerm::create([
            'business_id' => $otherTenant['business']->id,
            'academic_session_id' => $foreignSession->id,
            'name' => 'Foreign Term',
            'starts_on' => now()->startOfMonth()->toDateString(),
            'ends_on' => now()->addMonths(3)->toDateString(),
        ]);

        $foreignSubject = SchoolSubject::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Foreign Subject',
        ]);

        $foreignStudent = StudentRecord::create([
            'business_id' => $otherTenant['business']->id,
            'admission_number' => 'STD-FOREIGN',
            'full_name' => 'Foreign Student',
        ]);

        $this->postJson('/api/school/attendance', [
            'student_id' => $foreignStudent->id,
            'academic_term_id' => $foreignTerm->id,
            'attendance_date' => now()->toDateString(),
            'status' => 'present',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['student_id', 'academic_term_id']);

        $this->postJson('/api/school/results', [
            'student_id' => $foreignStudent->id,
            'academic_term_id' => $foreignTerm->id,
            'school_subject_id' => $foreignSubject->id,
            'score' => 50,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['student_id', 'academic_term_id', 'school_subject_id']);
    }

    public function test_school_enrollment_promotion_is_hidden_from_other_businesses(): void
    {
        $tenant = $this->createTenantContext('school', 'school-policy-owner@example.com');
        $otherTenant = $this->createTenantContext('school', 'school-policy-guest@example.com');

        $session = AcademicSession::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Owner Session',
            'starts_on' => now()->startOfYear()->toDateString(),
            'ends_on' => now()->endOfYear()->toDateString(),
        ]);

        $term = AcademicTerm::create([
            'business_id' => $tenant['business']->id,
            'academic_session_id' => $session->id,
            'name' => 'Owner Term',
            'starts_on' => now()->startOfMonth()->toDateString(),
            'ends_on' => now()->addMonths(3)->toDateString(),
        ]);

        $classroom = SchoolClassroom::create([
            'business_id' => $tenant['business']->id,
            'name' => 'Owner Classroom',
        ]);

        $student = StudentRecord::create([
            'business_id' => $tenant['business']->id,
            'admission_number' => 'STD-OWNER',
            'full_name' => 'Owner Student',
            'status' => 'active',
        ]);

        $enrollment = StudentEnrollment::create([
            'business_id' => $tenant['business']->id,
            'student_id' => $student->id,
            'academic_session_id' => $session->id,
            'academic_term_id' => $term->id,
            'school_classroom_id' => $classroom->id,
            'enrollment_status' => 'enrolled',
        ]);

        Sanctum::actingAs($otherTenant['user']);

        $this->postJson("/api/school/enrollments/{$enrollment->id}/promote", [
            'decision' => 'promoted',
        ])->assertForbidden();
    }
}
