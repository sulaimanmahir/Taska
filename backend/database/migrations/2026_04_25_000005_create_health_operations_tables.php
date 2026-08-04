<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('patient_code')->unique();
            $table->string('full_name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('blood_group')->nullable();
            $table->text('medical_history')->nullable();
            $table->string('hmo_provider')->nullable();
            $table->string('insurance_number')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_phone')->nullable();
            $table->timestamps();
        });

        Schema::create('clinic_appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('patient_id')->constrained('patient_records')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('appointment_code')->unique();
            $table->timestamp('scheduled_for');
            $table->enum('status', ['scheduled', 'checked_in', 'completed', 'missed', 'cancelled'])->default('scheduled');
            $table->string('reason')->nullable();
            $table->string('referral_source')->nullable();
            $table->timestamps();
        });

        Schema::create('clinic_consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('clinic_appointments')->nullOnDelete();
            $table->foreignId('patient_id')->constrained('patient_records')->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('triage_vitals')->nullable();
            $table->text('doctor_notes')->nullable();
            $table->text('diagnosis')->nullable();
            $table->text('treatment_plan')->nullable();
            $table->timestamp('follow_up_date')->nullable();
            $table->decimal('billing_amount', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->string('receipt_number')->nullable();
            $table->timestamps();
        });

        Schema::create('lab_test_catalog', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('sample_type')->nullable();
            $table->string('reference_range')->nullable();
            $table->decimal('price', 15, 2)->default(0);
            $table->unsignedInteger('turnaround_hours')->default(24);
            $table->timestamps();
        });

        Schema::create('lab_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->constrained('patient_records')->cascadeOnDelete();
            $table->foreignId('consultation_id')->nullable()->constrained('clinic_consultations')->nullOnDelete();
            $table->foreignId('test_id')->constrained('lab_test_catalog')->cascadeOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sample_barcode')->unique();
            $table->enum('status', ['requested', 'sample_collected', 'processing', 'review_pending', 'approved', 'rejected'])->default('requested');
            $table->text('result_value')->nullable();
            $table->boolean('is_abnormal')->default(false);
            $table->text('rejection_reason')->nullable();
            $table->timestamp('sample_collected_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_requests');
        Schema::dropIfExists('lab_test_catalog');
        Schema::dropIfExists('clinic_consultations');
        Schema::dropIfExists('clinic_appointments');
        Schema::dropIfExists('patient_records');
    }
};
