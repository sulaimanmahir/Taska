<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fuel_tanks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('fuel_type', 50);
            $table->decimal('capacity_litres', 14, 2)->default(0);
            $table->decimal('current_stock_litres', 14, 2)->default(0);
            $table->decimal('reorder_level_litres', 14, 2)->default(0);
            $table->decimal('price_per_litre', 14, 2)->default(0);
            $table->decimal('last_dip_variance', 14, 2)->default(0);
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        Schema::create('fuel_pumps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('fuel_tank_id')->nullable()->constrained('fuel_tanks')->nullOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('attendant_name')->nullable();
            $table->unsignedInteger('nozzle_count')->default(1);
            $table->decimal('meter_reading_start', 14, 2)->default(0);
            $table->decimal('meter_reading_current', 14, 2)->default(0);
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        Schema::create('fuel_nozzle_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('fuel_pump_id')->constrained('fuel_pumps')->cascadeOnDelete();
            $table->string('attendant_name');
            $table->string('shift_name')->nullable();
            $table->date('reading_date');
            $table->decimal('opening_reading', 14, 2)->default(0);
            $table->decimal('closing_reading', 14, 2)->default(0);
            $table->decimal('litres_sold', 14, 2)->default(0);
            $table->decimal('unit_price', 14, 2)->default(0);
            $table->decimal('expected_sales_amount', 14, 2)->default(0);
            $table->decimal('recorded_sales_amount', 14, 2)->default(0);
            $table->decimal('cash_reported', 14, 2)->default(0);
            $table->decimal('variance_amount', 14, 2)->default(0);
            $table->string('status', 30)->default('balanced');
            $table->timestamps();
        });

        Schema::create('fuel_tank_dips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('fuel_tank_id')->constrained('fuel_tanks')->cascadeOnDelete();
            $table->timestamp('dipped_at');
            $table->decimal('opening_stock_litres', 14, 2)->default(0);
            $table->decimal('deliveries_received_litres', 14, 2)->default(0);
            $table->decimal('closing_stock_litres', 14, 2)->default(0);
            $table->decimal('expected_stock_litres', 14, 2)->default(0);
            $table->decimal('variance_litres', 14, 2)->default(0);
            $table->decimal('variance_value', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('fuel_shift_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained()->nullOnDelete();
            $table->string('attendant_name');
            $table->string('shift_name');
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->decimal('cash_expected', 14, 2)->default(0);
            $table->decimal('cash_reported', 14, 2)->default(0);
            $table->decimal('shortage_amount', 14, 2)->default(0);
            $table->decimal('recovery_amount', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->string('status', 30)->default('open');
            $table->timestamps();
        });

        Schema::create('fuel_price_change_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('fuel_type', 50);
            $table->decimal('old_price', 14, 2)->default(0);
            $table->decimal('new_price', 14, 2)->default(0);
            $table->timestamp('effective_at');
            $table->string('changed_by_name')->nullable();
            $table->string('reason')->nullable();
            $table->timestamps();
        });

        Schema::create('fuel_variance_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('fuel_tank_id')->nullable()->constrained('fuel_tanks')->nullOnDelete();
            $table->foreignId('fuel_pump_id')->nullable()->constrained('fuel_pumps')->nullOnDelete();
            $table->foreignId('fuel_shift_log_id')->nullable()->constrained('fuel_shift_logs')->nullOnDelete();
            $table->string('alert_type', 50);
            $table->string('severity', 30)->default('medium');
            $table->decimal('metric_value', 14, 2)->default(0);
            $table->decimal('threshold_value', 14, 2)->default(0);
            $table->text('details')->nullable();
            $table->timestamp('detected_at');
            $table->boolean('is_resolved')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fuel_variance_alerts');
        Schema::dropIfExists('fuel_price_change_logs');
        Schema::dropIfExists('fuel_shift_logs');
        Schema::dropIfExists('fuel_tank_dips');
        Schema::dropIfExists('fuel_nozzle_readings');
        Schema::dropIfExists('fuel_pumps');
        Schema::dropIfExists('fuel_tanks');
    }
};
