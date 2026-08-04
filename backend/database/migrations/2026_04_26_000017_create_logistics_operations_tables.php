<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('logistics_fleet_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('asset_type');
            $table->string('name');
            $table->string('plate_number')->nullable();
            $table->string('ownership_model')->default('company_owned');
            $table->string('capacity_unit')->nullable();
            $table->decimal('capacity_value', 12, 2)->default(0);
            $table->decimal('purchase_value', 14, 2)->default(0);
            $table->decimal('target_km_per_litre', 10, 2)->default(0);
            $table->string('status')->default('active');
            $table->string('fuel_responsibility')->default('company');
            $table->string('maintenance_responsibility')->default('company');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('logistics_trip_sheets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('fleet_asset_id')->nullable()->constrained('logistics_fleet_assets')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('trip_code')->unique();
            $table->string('job_type')->default('haulage');
            $table->string('customer_name')->nullable();
            $table->string('route_name');
            $table->string('origin');
            $table->string('destination');
            $table->date('trip_date');
            $table->string('status')->default('planned');
            $table->decimal('expected_revenue', 14, 2)->default(0);
            $table->decimal('actual_revenue', 14, 2)->default(0);
            $table->decimal('distance_km', 12, 2)->default(0);
            $table->decimal('expected_fuel_cost', 14, 2)->default(0);
            $table->decimal('actual_fuel_cost', 14, 2)->default(0);
            $table->decimal('loading_cost', 14, 2)->default(0);
            $table->decimal('driver_allowance', 14, 2)->default(0);
            $table->decimal('maintenance_cost', 14, 2)->default(0);
            $table->decimal('other_cost', 14, 2)->default(0);
            $table->decimal('profit_estimate', 14, 2)->default(0);
            $table->string('payment_status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('departed_at')->nullable();
            $table->timestamp('arrived_at')->nullable();
            $table->timestamps();
        });

        Schema::create('logistics_trip_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_sheet_id')->constrained('logistics_trip_sheets')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('stop_order')->default(1);
            $table->string('stop_name');
            $table->string('location')->nullable();
            $table->string('status')->default('planned');
            $table->decimal('expected_revenue', 14, 2)->default(0);
            $table->decimal('actual_revenue', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('arrived_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('logistics_fuel_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trip_sheet_id')->nullable()->constrained('logistics_trip_sheets')->nullOnDelete();
            $table->foreignId('fleet_asset_id')->nullable()->constrained('logistics_fleet_assets')->nullOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('log_date');
            $table->decimal('litres', 12, 2)->default(0);
            $table->decimal('unit_cost', 14, 2)->default(0);
            $table->decimal('amount', 14, 2)->default(0);
            $table->decimal('odometer_km', 12, 2)->default(0);
            $table->string('source')->default('cash');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('logistics_maintenance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fleet_asset_id')->nullable()->constrained('logistics_fleet_assets')->nullOnDelete();
            $table->foreignId('trip_sheet_id')->nullable()->constrained('logistics_trip_sheets')->nullOnDelete();
            $table->date('logged_on');
            $table->string('category')->default('routine_service');
            $table->string('status')->default('open');
            $table->decimal('cost', 14, 2)->default(0);
            $table->text('summary');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('logistics_driver_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trip_sheet_id')->constrained('logistics_trip_sheets')->cascadeOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('gross_revenue', 14, 2)->default(0);
            $table->decimal('trip_cost', 14, 2)->default(0);
            $table->decimal('driver_payout', 14, 2)->default(0);
            $table->decimal('company_retained', 14, 2)->default(0);
            $table->decimal('fuel_deduction', 14, 2)->default(0);
            $table->decimal('maintenance_deduction', 14, 2)->default(0);
            $table->string('status')->default('pending');
            $table->timestamp('settled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logistics_driver_settlements');
        Schema::dropIfExists('logistics_maintenance_logs');
        Schema::dropIfExists('logistics_fuel_logs');
        Schema::dropIfExists('logistics_trip_stops');
        Schema::dropIfExists('logistics_trip_sheets');
        Schema::dropIfExists('logistics_fleet_assets');
    }
};
