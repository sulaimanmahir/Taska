<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agro_seasonal_forecasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('season_name');
            $table->string('region_name');
            $table->decimal('forecast_quantity', 14, 2)->default(0);
            $table->decimal('reserved_quantity', 14, 2)->default(0);
            $table->decimal('confidence_score', 5, 2)->default(0);
            $table->date('forecast_start_date')->nullable();
            $table->date('forecast_end_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('agro_subsidy_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('programme_name');
            $table->string('agency_name')->nullable();
            $table->string('region_name')->nullable();
            $table->decimal('quantity', 14, 2)->default(0);
            $table->decimal('unit_price', 14, 2)->default(0);
            $table->decimal('subsidy_amount', 14, 2)->default(0);
            $table->decimal('amount_due', 14, 2)->default(0);
            $table->decimal('amount_received', 14, 2)->default(0);
            $table->date('sale_date');
            $table->string('status', 30)->default('pending');
            $table->timestamps();
        });

        Schema::create('agro_farmer_credit_recoveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('recovery_reference')->unique();
            $table->string('region_name')->nullable();
            $table->decimal('credit_amount', 14, 2)->default(0);
            $table->decimal('recovered_amount', 14, 2)->default(0);
            $table->decimal('outstanding_amount', 14, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->date('last_contacted_at')->nullable();
            $table->string('status', 30)->default('open');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('agro_advisory_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('farmer_name')->nullable();
            $table->string('region_name')->nullable();
            $table->string('advisory_type');
            $table->string('crop_or_input')->nullable();
            $table->text('recommendation');
            $table->string('follow_up_status')->default('pending');
            $table->date('advised_on');
            $table->date('follow_up_date')->nullable();
            $table->timestamps();
        });

        Schema::create('agro_regional_sales_trends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('region_name');
            $table->string('season_name')->nullable();
            $table->string('input_category')->nullable();
            $table->decimal('sales_amount', 14, 2)->default(0);
            $table->decimal('quantity_sold', 14, 2)->default(0);
            $table->date('trend_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agro_regional_sales_trends');
        Schema::dropIfExists('agro_advisory_records');
        Schema::dropIfExists('agro_farmer_credit_recoveries');
        Schema::dropIfExists('agro_subsidy_sales');
        Schema::dropIfExists('agro_seasonal_forecasts');
    }
};
