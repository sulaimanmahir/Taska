<?php

namespace Tests\Feature;

use App\Models\AcademicSession;
use App\Models\AcademicTerm;
use App\Models\SchoolClassroom;
use App\Models\SchoolFeeStructure;
use App\Models\SchoolSubject;
use App\Models\StudentRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesTenantContext;
use Tests\TestCase;

class SchoolOperationsTest extends TestCase
{
    use CreatesTenantContext;
    use RefreshDatabase;

    public function test_school_can_run_academic_finance_and_promotion_flow(): void
    {
        $tenant = $this->createTenantContext('school', 'school-owner@example.com');
        Sanctum::actingAs($tenant['user']);

        $sessionId = $this->postJson('/api/school/sessions', [
            'name' => '2026/2027',
            'starts_on' => '2026-09-01',
            'ends_on' => '2027-07-30',
            'is_active' => true,
        ])->assertCreated()->json('id');

        $termId = $this->postJson('/api/school/terms', [
            'academic_session_id' => $sessionId,
            'name' => 'First Term',
            'starts_on' => '2026-09-01',
            'ends_on' => '2026-12-15',
            'is_active' => true,
        ])->assertCreated()->json('id');

        $classroomId = $this->postJson('/api/school/classes', [
            'branch_id' => $tenant['branch']->id,
            'name' => 'JSS 1',
            'stream' => 'Gold',
            'department' => 'Junior School',
            'capacity' => 35,
        ])->assertCreated()->json('id');

        $subjectId = $this->postJson('/api/school/subjects', [
            'name' => 'Mathematics',
            'department' => 'Junior School',
        ])->assertCreated()->json('id');

        $studentId = $this->postJson('/api/school/students', [
            'branch_id' => $tenant['branch']->id,
            'full_name' => 'Zainab Musa',
            'gender' => 'Female',
            'phone' => '08035554444',
            'admitted_on' => now()->toDateString(),
            'guardian' => [
                'full_name' => 'Musa Ibrahim',
                'relationship' => 'Father',
                'phone' => '08030001111',
            ],
        ])->assertCreated()
            ->assertJsonPath('guardians.0.full_name', 'Musa Ibrahim')
            ->json('id');

        $enrollmentId = $this->postJson('/api/school/enrollments', [
            'student_id' => $studentId,
            'academic_session_id' => $sessionId,
            'academic_term_id' => $termId,
            'school_classroom_id' => $classroomId,
        ])->assertCreated()->json('id');

        $this->postJson('/api/school/attendance', [
            'student_id' => $studentId,
            'academic_term_id' => $termId,
            'attendance_date' => now()->toDateString(),
            'status' => 'present',
        ])->assertCreated()
            ->assertJsonPath('status', 'present');

        $this->postJson('/api/school/results', [
            'student_id' => $studentId,
            'academic_term_id' => $termId,
            'school_subject_id' => $subjectId,
            'score' => 78,
            'teacher_comment' => 'Strong performance and focus.',
        ])->assertCreated()
            ->assertJsonPath('grade', 'A');

        $feeStructureId = $this->postJson('/api/school/fee-structures', [
            'academic_session_id' => $sessionId,
            'academic_term_id' => $termId,
            'school_classroom_id' => $classroomId,
            'name' => 'Tuition',
            'amount' => 50000,
            'discount_amount' => 5000,
            'scholarship_amount' => 0,
        ])->assertCreated()->json('id');

        $this->postJson('/api/school/fee-payments', [
            'student_id' => $studentId,
            'school_fee_structure_id' => $feeStructureId,
            'amount_paid' => 30000,
            'payment_method' => 'transfer',
        ])->assertCreated()
            ->assertJsonPath('amount_paid', '30000.00');

        $this->getJson('/api/school/debtors')
            ->assertOk()
            ->assertJsonPath('0.balance', 15000);

        $this->postJson("/api/school/enrollments/{$enrollmentId}/promote", [
            'decision' => 'promoted',
        ])->assertOk()
            ->assertJsonPath('promotion_decision', 'promoted');

        $this->getJson('/api/school/overview')
            ->assertOk()
            ->assertJsonPath('summary.enrolled_students', 1)
            ->assertJsonPath('summary.fees_collected', 30000)
            ->assertJsonPath('summary.students_promoted', 1)
            ->assertJsonPath('summary.attendance_rate', 100);
    }

    public function test_school_endpoints_reject_foreign_tenant_relations_and_teachers(): void
    {
        $tenant = $this->createTenantContext('school', 'school-scope@example.com');
        $otherTenant = $this->createTenantContext('school', 'school-other@example.com');

        $foreignTeacher = User::factory()->create([
            'email' => 'foreign-teacher@example.com',
            'role' => 'teacher',
        ]);
        $this->attachActiveMember($foreignTeacher, $otherTenant['business']->id);

        $foreignSession = AcademicSession::create([
            'business_id' => $otherTenant['business']->id,
            'name' => '2030/2031',
            'starts_on' => '2030-09-01',
            'ends_on' => '2031-07-30',
        ]);

        $foreignTerm = AcademicTerm::create([
            'business_id' => $otherTenant['business']->id,
            'academic_session_id' => $foreignSession->id,
            'name' => 'First Term',
            'starts_on' => '2030-09-01',
            'ends_on' => '2030-12-15',
        ]);

        $foreignClassroom = SchoolClassroom::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'SS 1',
            'class_teacher_id' => $foreignTeacher->id,
        ]);

        $foreignSubject = SchoolSubject::create([
            'business_id' => $otherTenant['business']->id,
            'name' => 'Physics',
            'subject_teacher_id' => $foreignTeacher->id,
        ]);

        $foreignStudent = StudentRecord::create([
            'business_id' => $otherTenant['business']->id,
            'branch_id' => $otherTenant['branch']->id,
            'admission_number' => 'STD-FOREIGN-001',
            'full_name' => 'Foreign Student',
            'admitted_on' => now()->toDateString(),
            'status' => 'active',
        ]);

        $foreignFeeStructure = SchoolFeeStructure::create([
            'business_id' => $otherTenant['business']->id,
            'academic_session_id' => $foreignSession->id,
            'academic_term_id' => $foreignTerm->id,
            'school_classroom_id' => $foreignClassroom->id,
            'name' => 'Foreign Tuition',
            'amount' => 45000,
        ]);

        Sanctum::actingAs($tenant['user']);

        $this->postJson('/api/school/terms', [
            'academic_session_id' => $foreignSession->id,
            'name' => 'Invalid Term',
            'starts_on' => '2030-09-01',
            'ends_on' => '2030-12-15',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['academic_session_id']);

        $this->postJson('/api/school/classes', [
            'branch_id' => $otherTenant['branch']->id,
            'name' => 'Invalid Class',
            'class_teacher_id' => $foreignTeacher->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id', 'class_teacher_id']);

        $this->postJson('/api/school/subjects', [
            'name' => 'Invalid Subject',
            'subject_teacher_id' => $foreignTeacher->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['subject_teacher_id']);

        $this->postJson('/api/school/students', [
            'branch_id' => $otherTenant['branch']->id,
            'full_name' => 'Invalid Student',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['branch_id']);

        $this->postJson('/api/school/enrollments', [
            'student_id' => $foreignStudent->id,
            'academic_session_id' => $foreignSession->id,
            'academic_term_id' => $foreignTerm->id,
            'school_classroom_id' => $foreignClassroom->id,
        ])->assertStatus(422)
            ->assertJsonValidationErrors([
                'student_id',
                'academic_session_id',
                'academic_term_id',
                'school_classroom_id',
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
            'score' => 75,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['student_id', 'academic_term_id', 'school_subject_id']);

        $this->postJson('/api/school/fee-structures', [
            'academic_session_id' => $foreignSession->id,
            'academic_term_id' => $foreignTerm->id,
            'school_classroom_id' => $foreignClassroom->id,
            'name' => 'Invalid Fee',
            'amount' => 10000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['academic_session_id', 'academic_term_id', 'school_classroom_id']);

        $this->postJson('/api/school/fee-payments', [
            'student_id' => $foreignStudent->id,
            'school_fee_structure_id' => $foreignFeeStructure->id,
            'amount_paid' => 5000,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['student_id', 'school_fee_structure_id']);
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
