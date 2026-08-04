<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotel_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('room_number');
            $table->string('category');
            $table->string('floor')->nullable();
            $table->enum('status', ['available', 'reserved', 'occupied', 'cleaning', 'blocked', 'out_of_service'])->default('available');
            $table->enum('cleaning_status', ['clean', 'dirty', 'in_progress', 'inspected'])->default('clean');
            $table->decimal('base_rate', 15, 2)->default(0);
            $table->decimal('extra_guest_charge', 15, 2)->default(0);
            $table->decimal('late_checkout_charge', 15, 2)->default(0);
            $table->decimal('early_checkin_charge', 15, 2)->default(0);
            $table->text('blocked_reason')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['business_id', 'room_number']);
        });

        Schema::create('hotel_bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('room_id')->constrained('hotel_rooms')->cascadeOnDelete();
            $table->string('reservation_code')->unique();
            $table->string('guest_name');
            $table->string('guest_phone')->nullable();
            $table->string('guest_email')->nullable();
            $table->enum('status', ['reserved', 'checked_in', 'checked_out', 'cancelled', 'no_show'])->default('reserved');
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->timestamp('actual_check_in_at')->nullable();
            $table->timestamp('actual_check_out_at')->nullable();
            $table->unsignedInteger('adults')->default(1);
            $table->unsignedInteger('extra_guests')->default(0);
            $table->boolean('is_repeat_guest')->default(false);
            $table->string('payment_method')->nullable();
            $table->decimal('room_rate', 15, 2)->default(0);
            $table->decimal('extra_guest_charge_total', 15, 2)->default(0);
            $table->decimal('late_checkout_charge_total', 15, 2)->default(0);
            $table->decimal('early_checkin_charge_total', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('hotel_housekeeping_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('hotel_rooms')->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pending', 'in_progress', 'cleaned', 'inspected'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('logged_at')->nullable();
            $table->timestamps();
        });

        Schema::create('hotel_maintenance_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('hotel_rooms')->cascadeOnDelete();
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('details')->nullable();
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'resolved'])->default('open');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('hotel_room_inspection_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('room_id')->constrained('hotel_rooms')->cascadeOnDelete();
            $table->foreignId('inspected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pass', 'fail'])->default('pass');
            $table->text('notes')->nullable();
            $table->timestamp('inspected_at')->nullable();
            $table->timestamps();
        });

        Schema::create('hotel_staff_shift_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('staff_name');
            $table->string('shift_role');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_staff_shift_logs');
        Schema::dropIfExists('hotel_room_inspection_logs');
        Schema::dropIfExists('hotel_maintenance_requests');
        Schema::dropIfExists('hotel_housekeeping_logs');
        Schema::dropIfExists('hotel_bookings');
        Schema::dropIfExists('hotel_rooms');
    }
};
