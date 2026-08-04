<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sme_cash_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('entry_type')->default('cash_in');
            $table->string('source')->default('sales');
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('payment_method')->default('cash');
            $table->string('reference')->nullable();
            $table->date('entry_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('sme_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('category')->default('debtor_collection');
            $table->string('status')->default('open');
            $table->string('title');
            $table->text('notes')->nullable();
            $table->decimal('amount_in_focus', 14, 2)->default(0);
            $table->date('due_on');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('sme_daily_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->date('target_date');
            $table->decimal('sales_target', 14, 2)->default(0);
            $table->decimal('collection_target', 14, 2)->default(0);
            $table->decimal('expense_limit', 14, 2)->default(0);
            $table->decimal('actual_sales', 14, 2)->default(0);
            $table->decimal('actual_collections', 14, 2)->default(0);
            $table->decimal('actual_expenses', 14, 2)->default(0);
            $table->string('status')->default('open');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sme_daily_targets');
        Schema::dropIfExists('sme_follow_ups');
        Schema::dropIfExists('sme_cash_entries');
    }
};
