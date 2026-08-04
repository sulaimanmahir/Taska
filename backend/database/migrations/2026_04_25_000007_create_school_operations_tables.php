<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('starts_on');
            $table->date('ends_on');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
            $table->string('name');
            $table->date('starts_on');
            $table->date('ends_on');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('school_classrooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('stream')->nullable();
            $table->string('department')->nullable();
            $table->foreignId('class_teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('capacity')->default(0);
            $table->timestamps();
        });

        Schema::create('school_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('department')->nullable();
            $table->foreignId('subject_teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('student_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('admission_number')->unique();
            $table->string('full_name');
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->date('admitted_on')->nullable();
            $table->string('status')->default('active');
            $table->string('transfer_status')->nullable();
            $table->boolean('is_alumni')->default(false);
            $table->timestamps();
        });

        Schema::create('student_guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('student_records')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('relationship')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->timestamps();
        });

        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('student_records')->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->foreignId('school_classroom_id')->constrained('school_classrooms')->cascadeOnDelete();
            $table->string('enrollment_status')->default('enrolled');
            $table->string('promotion_decision')->nullable();
            $table->timestamps();
        });

        Schema::create('student_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('student_records')->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->date('attendance_date');
            $table->string('status');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('student_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('student_records')->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->foreignId('school_subject_id')->constrained('school_subjects')->cascadeOnDelete();
            $table->decimal('score', 8, 2)->default(0);
            $table->string('grade')->nullable();
            $table->text('teacher_comment')->nullable();
            $table->timestamps();
        });

        Schema::create('school_fee_structures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_session_id')->constrained('academic_sessions')->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->foreignId('school_classroom_id')->nullable()->constrained('school_classrooms')->nullOnDelete();
            $table->string('name');
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('scholarship_amount', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('school_fee_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('student_records')->cascadeOnDelete();
            $table->foreignId('school_fee_structure_id')->constrained('school_fee_structures')->cascadeOnDelete();
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->string('receipt_number')->nullable();
            $table->timestamp('paid_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_fee_payments');
        Schema::dropIfExists('school_fee_structures');
        Schema::dropIfExists('student_results');
        Schema::dropIfExists('student_attendances');
        Schema::dropIfExists('student_enrollments');
        Schema::dropIfExists('student_guardians');
        Schema::dropIfExists('student_records');
        Schema::dropIfExists('school_subjects');
        Schema::dropIfExists('school_classrooms');
        Schema::dropIfExists('academic_terms');
        Schema::dropIfExists('academic_sessions');
    }
};
