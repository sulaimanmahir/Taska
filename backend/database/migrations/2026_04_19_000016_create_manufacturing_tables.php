<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('warehouse_id')->nullable()->constrained()->onDelete('set null');
            $table->string('name');
            $table->string('sku')->nullable();
            $table->string('unit')->default('pcs');
            $table->decimal('quantity', 15, 2)->default(0);
            $table->decimal('cost_per_unit', 15, 2)->default(0);
            $table->integer('reorder_level')->default(10);
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('business_id');
        });

        Schema::create('production_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('batch_number')->unique();
            $table->date('production_date');
            $table->string('status')->default('pending'); // pending, in_progress, completed, cancelled
            $table->decimal('total_input_quantity', 15, 2)->default(0);
            $table->decimal('total_output_quantity', 15, 2)->default(0);
            $table->decimal('damaged_quantity', 15, 2)->default(0);
            $table->decimal('wastage_quantity', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index('business_id');
        });

        Schema::create('production_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_batch_id')->constrained('production_batches')->onDelete('cascade');
            $table->foreignId('raw_material_id')->constrained('raw_materials')->onDelete('cascade');
            $table->decimal('quantity_used', 15, 2);
            $table->decimal('cost', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('production_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_batch_id')->constrained('production_batches')->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity_produced', 15, 2);
            $table->decimal('damaged_quantity', 15, 2)->default(0);
            $table->decimal('selling_price', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::table('businesses', function (Blueprint $table) {
            // Pure Water Factory fields
            $table->integer('production_capacity_per_day')->nullable();
            $table->string('water_source_type')->nullable();
            $table->boolean('treatment_line_enabled')->default(false);
            $table->string('packaging_types')->nullable();
            $table->string('sachet_bag_size')->nullable();
            $table->string('bottle_sizes')->nullable();
            $table->boolean('batch_tracking_enabled')->default(true);
            $table->integer('machine_count')->nullable();
            $table->boolean('distribution_enabled')->default(false);
            $table->boolean('quality_check_enabled')->default(true);

            // Pure Water Retail fields
            $table->boolean('sells_sachet_water')->default(true);
            $table->boolean('sells_bottled_water')->default(false);
            $table->boolean('wholesale_enabled')->default(false);
            $table->boolean('retailer_pricing_enabled')->default(false);
            $table->boolean('crate_tracking_enabled')->default(false);
            $table->string('package_type_support')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn([
                'production_capacity_per_day', 'water_source_type', 'treatment_line_enabled',
                'packaging_types', 'sachet_bag_size', 'bottle_sizes', 'batch_tracking_enabled',
                'machine_count', 'distribution_enabled', 'quality_check_enabled',
                'sells_sachet_water', 'sells_bottled_water', 'wholesale_enabled',
                'retailer_pricing_enabled', 'crate_tracking_enabled', 'package_type_support'
            ]);
        });

        Schema::dropIfExists('production_outputs');
        Schema::dropIfExists('production_materials');
        Schema::dropIfExists('production_batches');
        Schema::dropIfExists('raw_materials');
    }
};
