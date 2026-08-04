<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\School\PromoteEnrollmentRequest;
use App\Http\Requests\School\StoreAttendanceRequest;
use App\Http\Requests\School\StoreResultRequest;
use App\Http\Resources\StudentAttendanceResource;
use App\Http\Resources\StudentEnrollmentResource;
use App\Http\Resources\StudentResultResource;
use App\Models\AcademicSession;
use App\Models\AcademicTerm;
use App\Models\SchoolClassroom;
use App\Models\SchoolFeePayment;
use App\Models\SchoolFeeStructure;
use App\Models\SchoolSubject;
use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use App\Models\StudentRecord;
use App\Models\StudentResult;
use App\Services\SchoolService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SchoolController extends Controller
{
    public function overview(Request $request)
    {
        $businessId = $request->user()->current_business_id;
        $today = today()->toDateString();

        $students = StudentRecord::where('business_id', $businessId)->count();
        $feesCollected = SchoolFeePayment::where('business_id', $businessId)->whereDate('paid_at', $today)->sum('amount_paid');
        $attendanceSummary = StudentAttendance::where('business_id', $businessId)
            ->whereDate('attendance_date', $today)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END), 0) as present_count,
                COUNT(*) as total_count
            ")
            ->first();
        $promoted = StudentEnrollment::where('business_id', $businessId)->where('promotion_decision', 'promoted')->count();

        $outstandingFees = SchoolFeeStructure::where('business_id', $businessId)->get()->sum(function ($structure) {
            $expected = (float) $structure->amount - (float) $structure->discount_amount - (float) $structure->scholarship_amount;
            $paid = (float) $structure->payments()->sum('amount_paid');
            return max($expected - $paid, 0);
        });

        return response()->json([
            'summary' => [
                'enrolled_students' => $students,
                'fees_collected' => (float) $feesCollected,
                'outstanding_fees' => (float) $outstandingFees,
                'students_promoted' => $promoted,
                'attendance_rate' => ($attendanceSummary?->total_count ?? 0) > 0
                    ? round(((int) $attendanceSummary->present_count / (int) $attendanceSummary->total_count) * 100, 1)
                    : 0,
            ],
        ]);
    }

    public function sessions(Request $request)
    {
        return response()->json(AcademicSession::where('business_id', $request->user()->current_business_id)->latest()->get());
    }

    public function storeSession(Request $request, SchoolService $schoolService)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'starts_on' => 'required|date',
            'ends_on' => 'required|date|after:starts_on',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json($schoolService->createSession($validated, $request->user()->current_business_id), 201);
    }

    public function terms(Request $request)
    {
        return response()->json(
            AcademicTerm::where('business_id', $request->user()->current_business_id)
                ->with('session')
                ->latest()
                ->get()
        );
    }

    public function storeTerm(Request $request, SchoolService $schoolService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'academic_session_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('academic_sessions', $businessId),
            ],
            'name' => 'required|string|max:255',
            'starts_on' => 'required|date',
            'ends_on' => 'required|date|after:starts_on',
            'is_active' => 'nullable|boolean',
        ]);

        return response()->json($schoolService->createTerm($validated, $businessId), 201);
    }

    public function classrooms(Request $request)
    {
        return response()->json(
            SchoolClassroom::where('business_id', $request->user()->current_business_id)
                ->with(['teacher', 'enrollments.student'])
                ->latest()
                ->get()
        );
    }

    public function storeClassroom(Request $request, SchoolService $schoolService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'name' => 'required|string|max:255',
            'stream' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'class_teacher_id' => [
                'nullable',
                'integer',
                $this->activeBusinessUserRule($businessId),
            ],
            'capacity' => 'nullable|integer|min:0',
        ]);

        return response()->json($schoolService->createClassroom($validated, $businessId), 201);
    }

    public function subjects(Request $request)
    {
        return response()->json(
            SchoolSubject::where('business_id', $request->user()->current_business_id)
                ->with('teacher')
                ->latest()
                ->get()
        );
    }

    public function storeSubject(Request $request, SchoolService $schoolService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'subject_teacher_id' => [
                'nullable',
                'integer',
                $this->activeBusinessUserRule($businessId),
            ],
        ]);

        return response()->json($schoolService->createSubject($validated, $businessId), 201);
    }

    public function students(Request $request)
    {
        return response()->json(
            StudentRecord::where('business_id', $request->user()->current_business_id)
                ->with(['guardians', 'enrollments.classroom', 'feePayments'])
                ->latest()
                ->get()
        );
    }

    public function storeStudent(Request $request, SchoolService $schoolService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('branches', $businessId),
            ],
            'full_name' => 'required|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email',
            'admitted_on' => 'nullable|date',
            'guardian' => 'nullable|array',
            'guardian.full_name' => 'required_with:guardian|string|max:255',
            'guardian.relationship' => 'nullable|string|max:100',
            'guardian.phone' => 'nullable|string|max:50',
            'guardian.email' => 'nullable|email',
            'guardian.address' => 'nullable|string|max:255',
        ]);

        return response()->json($schoolService->createStudent($validated, $businessId), 201);
    }

    public function enrollments(Request $request)
    {
        return response()->json(
            StudentEnrollment::where('business_id', $request->user()->current_business_id)
                ->with(['student', 'session', 'term', 'classroom'])
                ->latest()
                ->get()
        );
    }

    public function storeEnrollment(Request $request, SchoolService $schoolService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'student_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('student_records', $businessId),
            ],
            'academic_session_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('academic_sessions', $businessId),
            ],
            'academic_term_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('academic_terms', $businessId),
            ],
            'school_classroom_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('school_classrooms', $businessId),
            ],
        ]);

        return response()->json($schoolService->enrollStudent($validated, $businessId), 201);
    }

    public function promote(PromoteEnrollmentRequest $request, StudentEnrollment $enrollment, SchoolService $schoolService)
    {
        $this->authorize('update', $enrollment);
        $validated = $request->validated();

        return response()->json(
            (new StudentEnrollmentResource(
                $schoolService->promoteEnrollment($enrollment, $validated['decision'])
            ))->resolve()
        );
    }

    public function attendance(Request $request)
    {
        return response()->json(
            StudentAttendanceResource::collection(
                StudentAttendance::where('business_id', $request->user()->current_business_id)
                ->with(['student', 'term'])
                ->latest('attendance_date')
                ->get()
            )->resolve()
        );
    }

    public function storeAttendance(StoreAttendanceRequest $request, SchoolService $schoolService)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        return response()->json(
            (new StudentAttendanceResource($schoolService->recordAttendance($validated, $businessId)))->resolve(),
            201
        );
    }

    public function results(Request $request)
    {
        return response()->json(
            StudentResultResource::collection(
                StudentResult::where('business_id', $request->user()->current_business_id)
                ->with(['student', 'term', 'subject'])
                ->latest()
                ->get()
            )->resolve()
        );
    }

    public function storeResult(StoreResultRequest $request, SchoolService $schoolService)
    {
        $businessId = $request->user()->current_business_id;
        $validated = $request->validated();

        return response()->json(
            (new StudentResultResource($schoolService->recordResult($validated, $businessId)))->resolve(),
            201
        );
    }

    public function feeStructures(Request $request)
    {
        return response()->json(
            SchoolFeeStructure::where('business_id', $request->user()->current_business_id)
                ->with(['classroom', 'payments'])
                ->latest()
                ->get()
        );
    }

    public function storeFeeStructure(Request $request, SchoolService $schoolService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'academic_session_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('academic_sessions', $businessId),
            ],
            'academic_term_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('academic_terms', $businessId),
            ],
            'school_classroom_id' => [
                'nullable',
                'integer',
                $this->businessOwnedRule('school_classrooms', $businessId),
            ],
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'scholarship_amount' => 'nullable|numeric|min:0',
        ]);

        return response()->json($schoolService->createFeeStructure($validated, $businessId), 201);
    }

    public function feePayments(Request $request)
    {
        return response()->json(
            SchoolFeePayment::where('business_id', $request->user()->current_business_id)
                ->with(['student', 'structure.classroom'])
                ->latest('paid_at')
                ->get()
        );
    }

    public function storeFeePayment(Request $request, SchoolService $schoolService)
    {
        $businessId = $request->user()->current_business_id;

        $validated = $request->validate([
            'student_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('student_records', $businessId),
            ],
            'school_fee_structure_id' => [
                'required',
                'integer',
                $this->businessOwnedRule('school_fee_structures', $businessId),
            ],
            'amount_paid' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string|max:100',
            'paid_at' => 'nullable|date',
        ]);

        return response()->json($schoolService->recordFeePayment($validated, $businessId), 201);
    }

    public function debtors(Request $request)
    {
        $businessId = $request->user()->current_business_id;

        $debtors = StudentRecord::where('business_id', $businessId)
            ->with('feePayments', 'enrollments.classroom')
            ->get()
            ->map(function (StudentRecord $student) use ($businessId) {
                $classroomId = $student->enrollments->last()?->school_classroom_id;
                $structures = SchoolFeeStructure::where('business_id', $businessId)
                    ->where(function ($query) use ($classroomId) {
                        $query->whereNull('school_classroom_id');
                        if ($classroomId) {
                            $query->orWhere('school_classroom_id', $classroomId);
                        }
                    })
                    ->get();

                $expected = $structures->sum(fn (SchoolFeeStructure $structure) => max(
                    (float) $structure->amount - (float) $structure->discount_amount - (float) $structure->scholarship_amount,
                    0
                ));
                $paid = $student->feePayments->sum('amount_paid');

                return [
                    'student_id' => $student->id,
                    'full_name' => $student->full_name,
                    'classroom' => $student->enrollments->last()?->classroom?->name,
                    'expected' => round($expected, 2),
                    'paid' => round($paid, 2),
                    'balance' => round(max($expected - $paid, 0), 2),
                ];
            })
            ->filter(fn (array $debtor) => $debtor['balance'] > 0)
            ->values();

        return response()->json($debtors);
    }

    private function businessOwnedRule(string $table, int $businessId)
    {
        return Rule::exists($table, 'id')->where(fn ($query) => $query->where('business_id', $businessId));
    }

    private function activeBusinessUserRule(int $businessId)
    {
        return Rule::exists('users', 'id')->where(function ($query) use ($businessId) {
            $query->whereExists(function ($subQuery) use ($businessId) {
                $subQuery->selectRaw('1')
                    ->from('business_user')
                    ->whereColumn('business_user.user_id', 'users.id')
                    ->where('business_user.business_id', $businessId)
                    ->where('business_user.status', 'active');
            });
        });
    }
}
