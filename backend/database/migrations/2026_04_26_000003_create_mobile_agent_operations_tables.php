<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mobile_agent_commission_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('service_type');
            $table->decimal('minimum_volume', 14, 2)->default(0);
            $table->decimal('maximum_volume', 14, 2)->nullable();
            $table->decimal('commission_rate', 8, 2)->default(0);
            $table->decimal('flat_bonus', 14, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('mobile_agent_float_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('agent_name');
            $table->decimal('requested_amount', 14, 2);
            $table->decimal('approved_amount', 14, 2)->default(0);
            $table->string('status')->default('pending');
            $table->string('reason')->nullable();
            $table->timestamp('requested_at');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('mobile_agent_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('commission_tier_id')->nullable()->constrained('mobile_agent_commission_tiers')->nullOnDelete();
            $table->string('agent_name');
            $table->string('service_type');
            $table->string('transaction_reference')->unique();
            $table->decimal('transaction_amount', 14, 2);
            $table->decimal('commission_amount', 14, 2)->default(0);
            $table->decimal('cash_delta', 14, 2)->default(0);
            $table->decimal('float_delta', 14, 2)->default(0);
            $table->decimal('closing_float_balance', 14, 2)->default(0);
            $table->string('status')->default('completed');
            $table->boolean('is_reversal_requested')->default(false);
            $table->text('notes')->nullable();
            $table->timestamp('processed_at');
            $table->timestamps();
        });

        Schema::create('mobile_agent_reversal_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mobile_agent_transaction_id')->constrained('mobile_agent_transactions')->cascadeOnDelete();
            $table->string('reason');
            $table->string('status')->default('pending');
            $table->decimal('amount', 14, 2);
            $table->timestamp('requested_at');
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('mobile_agent_shortage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('agent_name');
            $table->decimal('shortage_amount', 14, 2);
            $table->decimal('recovered_amount', 14, 2)->default(0);
            $table->string('status')->default('open');
            $table->string('reason')->nullable();
            $table->timestamp('logged_at');
            $table->timestamps();
        });

        Schema::create('mobile_agent_fraud_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mobile_agent_transaction_id')->nullable()->constrained('mobile_agent_transactions')->nullOnDelete();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('agent_name')->nullable();
            $table->string('alert_type');
            $table->string('severity')->default('medium');
            $table->boolean('is_resolved')->default(false);
            $table->text('details')->nullable();
            $table->timestamp('flagged_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mobile_agent_fraud_alerts');
        Schema::dropIfExists('mobile_agent_shortage_logs');
        Schema::dropIfExists('mobile_agent_reversal_logs');
        Schema::dropIfExists('mobile_agent_transactions');
        Schema::dropIfExists('mobile_agent_float_requests');
        Schema::dropIfExists('mobile_agent_commission_tiers');
    }
};
