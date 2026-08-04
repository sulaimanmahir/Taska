<?php

namespace App\Services;

use App\Models\AcademicSession;
use App\Models\AcademicTerm;
use App\Models\SchoolClassroom;
use App\Models\SchoolFeePayment;
use App\Models\SchoolFeeStructure;
use App\Models\SchoolSubject;
use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use App\Models\StudentGuardian;
use App\Models\StudentRecord;
use App\Models\StudentResult;
use Illuminate\Support\Facades\DB;

class SchoolService
{
    public function createSession(array $payload, int $businessId): AcademicSession
    {
        if (!empty($payload['is_active'])) {
            AcademicSession::where('business_id', $businessId)->update(['is_active' => false]);
        }

        return AcademicSession::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createTerm(array $payload, int $businessId): AcademicTerm
    {
        if (!empty($payload['is_active'])) {
            AcademicTerm::where('business_id', $businessId)->update(['is_active' => false]);
        }

        return AcademicTerm::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createClassroom(array $payload, int $businessId): SchoolClassroom
    {
        return SchoolClassroom::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createSubject(array $payload, int $businessId): SchoolSubject
    {
        return SchoolSubject::create([
            ...$payload,
            'business_id' => $businessId,
        ]);
    }

    public function createStudent(array $payload, int $businessId): StudentRecord
    {
        return DB::transaction(function () use ($payload, $businessId) {
            $student = StudentRecord::create([
                'business_id' => $businessId,
                'branch_id' => $payload['branch_id'] ?? null,
                'admission_number' => 'STD-' . $businessId . '-' . strtoupper(str()->random(6)),
                'full_name' => $payload['full_name'],
                'date_of_birth' => $payload['date_of_birth'] ?? null,
                'gender' => $payload['gender'] ?? null,
                'phone' => $payload['phone'] ?? null,
                'email' => $payload['email'] ?? null,
                'admitted_on' => $payload['admitted_on'] ?? now()->toDateString(),
                'status' => $payload['status'] ?? 'active',
                'transfer_status' => $payload['transfer_status'] ?? null,
                'is_alumni' => $payload['is_alumni'] ?? false,
            ]);

            if (!empty($payload['guardian'])) {
                StudentGuardian::create([
                    'student_id' => $student->id,
                    ...$payload['guardian'],
                ]);
            }

            return $student->fresh(['guardians']);
        });
    }

    public function enrollStudent(array $payload, int $businessId): StudentEnrollment
    {
        return StudentEnrollment::create([
            ...$payload,
            'business_id' => $businessId,
            'promotion_decision' => $payload['promotion_decision'] ?? null,
        ])->fresh(['student', 'session', 'term', 'classroom']);
    }

    public function recordAttendance(array $payload, int $businessId): StudentAttendance
    {
        return StudentAttendance::updateOrCreate(
            [
                'business_id' => $businessId,
                'student_id' => $payload['student_id'],
                'academic_term_id' => $payload['academic_term_id'],
                'attendance_date' => $payload['attendance_date'],
            ],
            [
                'status' => $payload['status'],
                'notes' => $payload['notes'] ?? null,
            ]
        )->fresh(['student', 'term']);
    }

    public function createFeeStructure(array $payload, int $businessId): SchoolFeeStructure
    {
        return SchoolFeeStructure::create([
            ...$payload,
            'business_id' => $businessId,
        ])->fresh(['classroom']);
    }

    public function recordFeePayment(array $payload, int $businessId): SchoolFeePayment
    {
        return SchoolFeePayment::create([
            ...$payload,
            'business_id' => $businessId,
            'receipt_number' => 'FEE-' . $businessId . '-' . strtoupper(str()->random(6)),
            'paid_at' => $payload['paid_at'] ?? now(),
        ])->fresh(['student', 'structure']);
    }

    public function recordResult(array $payload, int $businessId): StudentResult
    {
        $grade = match (true) {
            $payload['score'] >= 70 => 'A',
            $payload['score'] >= 60 => 'B',
            $payload['score'] >= 50 => 'C',
            $payload['score'] >= 45 => 'D',
            $payload['score'] >= 40 => 'E',
            default => 'F',
        };

        return StudentResult::updateOrCreate(
            [
                'business_id' => $businessId,
                'student_id' => $payload['student_id'],
                'academic_term_id' => $payload['academic_term_id'],
                'school_subject_id' => $payload['school_subject_id'],
            ],
            [
                'score' => $payload['score'],
                'grade' => $grade,
                'teacher_comment' => $payload['teacher_comment'] ?? null,
            ]
        )->fresh(['student', 'term', 'subject']);
    }

    public function promoteEnrollment(StudentEnrollment $enrollment, string $decision): StudentEnrollment
    {
        $enrollment->update([
            'promotion_decision' => $decision,
            'enrollment_status' => $decision === 'graduated' ? 'graduated' : 'enrolled',
        ]);

        if ($decision === 'graduated') {
            $enrollment->student()->update([
                'status' => 'graduated',
                'is_alumni' => true,
            ]);
        }

        if ($decision === 'repeat') {
            $enrollment->update(['enrollment_status' => 'repeat']);
        }

        return $enrollment->fresh(['student', 'session', 'term', 'classroom']);
    }
}
