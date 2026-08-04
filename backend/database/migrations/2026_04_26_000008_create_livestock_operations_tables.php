<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('livestock_pens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('section')->nullable();
            $table->unsignedInteger('capacity')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('livestock_animal_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('pen_id')->nullable()->constrained('livestock_pens')->nullOnDelete();
            $table->string('name');
            $table->string('species');
            $table->string('breed')->nullable();
            $table->unsignedInteger('animal_count')->default(0);
            $table->decimal('average_weight_kg', 10, 2)->default(0);
            $table->string('status')->default('active');
            $table->date('acquired_on')->nullable();
            $table->timestamps();
        });

        Schema::create('livestock_weight_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('animal_group_id')->constrained('livestock_animal_groups')->cascadeOnDelete();
            $table->decimal('weight_kg', 10, 2);
            $table->unsignedInteger('sample_size')->default(1);
            $table->timestamp('weighed_at');
            $table->timestamps();
        });

        Schema::create('livestock_milk_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('animal_group_id')->constrained('livestock_animal_groups')->cascadeOnDelete();
            $table->decimal('litres', 10, 2);
            $table->date('recorded_on');
            $table->timestamps();
        });

        Schema::create('livestock_disease_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('animal_group_id')->nullable()->constrained('livestock_animal_groups')->nullOnDelete();
            $table->string('disease_name');
            $table->string('severity')->default('moderate');
            $table->unsignedInteger('affected_count')->default(0);
            $table->date('recorded_on');
            $table->string('status')->default('open');
            $table->timestamps();
        });

        Schema::create('livestock_medication_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('animal_group_id')->nullable()->constrained('livestock_animal_groups')->nullOnDelete();
            $table->string('medication_name');
            $table->string('dosage')->nullable();
            $table->unsignedInteger('treated_count')->default(0);
            $table->decimal('cost', 12, 2)->default(0);
            $table->date('administered_on');
            $table->timestamps();
        });

        Schema::create('livestock_breeding_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('animal_group_id')->constrained('livestock_animal_groups')->cascadeOnDelete();
            $table->string('cycle_name');
            $table->unsignedInteger('paired_count')->default(0);
            $table->unsignedInteger('successful_births')->default(0);
            $table->date('expected_delivery_date')->nullable();
            $table->date('actual_delivery_date')->nullable();
            $table->string('status')->default('planned');
            $table->timestamps();
        });

        Schema::create('livestock_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('animal_group_id')->nullable()->constrained('livestock_animal_groups')->nullOnDelete();
            $table->string('sale_type')->default('live_sale');
            $table->unsignedInteger('quantity')->default(0);
            $table->decimal('revenue', 12, 2)->default(0);
            $table->date('sold_on');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('livestock_sales');
        Schema::dropIfExists('livestock_breeding_records');
        Schema::dropIfExists('livestock_medication_records');
        Schema::dropIfExists('livestock_disease_logs');
        Schema::dropIfExists('livestock_milk_logs');
        Schema::dropIfExists('livestock_weight_logs');
        Schema::dropIfExists('livestock_animal_groups');
        Schema::dropIfExists('livestock_pens');
    }
};
