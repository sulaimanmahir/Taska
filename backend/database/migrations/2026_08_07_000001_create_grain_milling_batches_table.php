<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grain_milling_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('batch_number')->unique();
            $table->date('milling_date');
            $table->string('status')->default('completed'); // pending, in_progress, completed, cancelled
            $table->string('grain_type'); // maize, rice, sorghum, millet, wheat, groundnut, other
            $table->decimal('input_quantity_kg', 15, 2);
            $table->decimal('output_quantity_kg', 15, 2)->default(0);
            $table->decimal('byproduct_quantity_kg', 15, 2)->default(0);
            $table->decimal('wastage_quantity_kg', 15, 2)->default(0);
            $table->decimal('labour_cost', 15, 2)->default(0);
            $table->decimal('electricity_cost', 15, 2)->default(0);
            $table->decimal('packaging_cost', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('business_id');
            $table->index(['business_id', 'milling_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grain_milling_batches');
    }
};
