<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('farm_plots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('location')->nullable();
            $table->decimal('size_hectares', 12, 2)->default(0);
            $table->string('soil_type')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('farm_planting_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plot_id')->constrained('farm_plots')->cascadeOnDelete();
            $table->string('crop_name');
            $table->string('season_name')->nullable();
            $table->date('planting_date');
            $table->date('expected_harvest_date')->nullable();
            $table->date('actual_harvest_date')->nullable();
            $table->decimal('planted_area_hectares', 12, 2)->default(0);
            $table->string('status')->default('planned');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('farm_input_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('planting_cycle_id')->constrained('farm_planting_cycles')->cascadeOnDelete();
            $table->string('input_type');
            $table->string('input_name');
            $table->decimal('quantity', 12, 3)->default(0);
            $table->string('unit')->default('kg');
            $table->decimal('cost', 14, 2)->default(0);
            $table->date('applied_on');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('farm_harvest_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('planting_cycle_id')->constrained('farm_planting_cycles')->cascadeOnDelete();
            $table->decimal('quantity_harvested', 12, 3)->default(0);
            $table->string('unit')->default('kg');
            $table->decimal('estimated_revenue', 14, 2)->default(0);
            $table->decimal('loss_quantity', 12, 3)->default(0);
            $table->date('harvested_on');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('farm_harvest_logs');
        Schema::dropIfExists('farm_input_logs');
        Schema::dropIfExists('farm_planting_cycles');
        Schema::dropIfExists('farm_plots');
    }
};
