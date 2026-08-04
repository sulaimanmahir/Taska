<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('raw_materials', function (Blueprint $table) {
            $table->string('material_category')->default('other')->after('unit');
            $table->string('supplier_name')->nullable()->after('description');
            $table->string('supplier_phone')->nullable()->after('supplier_name');
            $table->decimal('supplier_balance', 15, 2)->default(0)->after('supplier_phone');
            $table->decimal('last_purchase_cost', 15, 2)->default(0)->after('supplier_balance');
            $table->decimal('low_stock_threshold', 15, 2)->nullable()->after('last_purchase_cost');
        });

        Schema::table('production_batches', function (Blueprint $table) {
            $table->json('power_source_mix')->nullable()->after('notes');
            $table->decimal('machine_runtime_hours', 10, 2)->default(0)->after('power_source_mix');
            $table->unsignedInteger('downtime_minutes')->default(0)->after('machine_runtime_hours');
            $table->decimal('public_power_hours', 10, 2)->default(0)->after('downtime_minutes');
            $table->decimal('electricity_cost', 15, 2)->default(0)->after('public_power_hours');
            $table->decimal('generator_runtime_hours', 10, 2)->default(0)->after('electricity_cost');
            $table->decimal('generator_fuel_cost', 15, 2)->default(0)->after('generator_runtime_hours');
            $table->decimal('solar_backup_cost', 15, 2)->default(0)->after('generator_fuel_cost');
            $table->decimal('labour_cost', 15, 2)->default(0)->after('solar_backup_cost');
            $table->decimal('treatment_chemical_cost', 15, 2)->default(0)->after('labour_cost');
            $table->decimal('loading_cost', 15, 2)->default(0)->after('treatment_chemical_cost');
            $table->decimal('maintenance_allocation', 15, 2)->default(0)->after('loading_cost');
            $table->decimal('packaging_cost_total', 15, 2)->default(0)->after('maintenance_allocation');
            $table->decimal('total_batch_cost', 15, 2)->default(0)->after('packaging_cost_total');
            $table->decimal('estimated_revenue', 15, 2)->default(0)->after('total_batch_cost');
            $table->decimal('gross_margin', 15, 2)->default(0)->after('estimated_revenue');
            $table->decimal('net_margin', 15, 2)->default(0)->after('gross_margin');
            $table->decimal('cost_per_bag', 15, 4)->default(0)->after('net_margin');
            $table->decimal('cost_per_sachet', 15, 4)->default(0)->after('cost_per_bag');
            $table->decimal('leakage_losses', 15, 2)->default(0)->after('cost_per_sachet');
            $table->decimal('torn_sacks', 15, 2)->default(0)->after('leakage_losses');
            $table->decimal('damaged_nylon', 15, 2)->default(0)->after('torn_sacks');
        });

        Schema::create('production_input_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('raw_material_id')->constrained('raw_materials')->cascadeOnDelete();
            $table->string('supplier_name');
            $table->decimal('quantity', 15, 2);
            $table->decimal('unit_cost', 15, 2);
            $table->decimal('total_cost', 15, 2);
            $table->decimal('amount_paid', 15, 2)->default(0);
            $table->decimal('balance_due', 15, 2)->default(0);
            $table->timestamp('purchased_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('production_energy_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('production_batch_id')->nullable()->constrained('production_batches')->nullOnDelete();
            $table->string('energy_source');
            $table->decimal('runtime_hours', 10, 2)->default(0);
            $table->decimal('cost', 15, 2)->default(0);
            $table->decimal('fuel_litres', 10, 2)->default(0);
            $table->unsignedInteger('outage_minutes')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('logged_at');
            $table->timestamps();
        });

        Schema::create('production_wastage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('production_batch_id')->nullable()->constrained('production_batches')->nullOnDelete();
            $table->foreignId('raw_material_id')->nullable()->constrained('raw_materials')->nullOnDelete();
            $table->string('loss_type');
            $table->decimal('quantity', 15, 2)->default(0);
            $table->decimal('estimated_cost', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('logged_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_wastage_logs');
        Schema::dropIfExists('production_energy_logs');
        Schema::dropIfExists('production_input_purchases');

        Schema::table('production_batches', function (Blueprint $table) {
            $table->dropColumn([
                'power_source_mix',
                'machine_runtime_hours',
                'downtime_minutes',
                'public_power_hours',
                'electricity_cost',
                'generator_runtime_hours',
                'generator_fuel_cost',
                'solar_backup_cost',
                'labour_cost',
                'treatment_chemical_cost',
                'loading_cost',
                'maintenance_allocation',
                'packaging_cost_total',
                'total_batch_cost',
                'estimated_revenue',
                'gross_margin',
                'net_margin',
                'cost_per_bag',
                'cost_per_sachet',
                'leakage_losses',
                'torn_sacks',
                'damaged_nylon',
            ]);
        });

        Schema::table('raw_materials', function (Blueprint $table) {
            $table->dropColumn([
                'material_category',
                'supplier_name',
                'supplier_phone',
                'supplier_balance',
                'last_purchase_cost',
                'low_stock_threshold',
            ]);
        });
    }
};
