<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leather_processing_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('batch_number')->unique();
            $table->date('processing_date');
            $table->string('status')->default('completed'); // pending, in_progress, completed, cancelled
            $table->string('hide_type'); // cattle, goat, sheep, camel, other
            $table->unsignedInteger('input_hide_count');
            $table->decimal('input_weight_kg', 12, 2)->nullable();
            $table->decimal('output_sqft', 12, 2)->default(0);
            $table->unsignedInteger('reject_count')->default(0);
            $table->decimal('tanning_chemical_cost', 15, 2)->default(0);
            $table->decimal('labour_cost', 15, 2)->default(0);
            $table->decimal('other_cost', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('business_id');
            $table->index(['business_id', 'processing_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leather_processing_batches');
    }
};
