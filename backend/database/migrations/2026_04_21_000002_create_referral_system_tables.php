<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('referral_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->string('referral_code')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('status')->default('pending'); // pending, active, suspended, terminated
            $table->string('agent_type'); // reseller, affiliate, introducer
            $table->string('tier'); // bronze, silver, gold, platinum
            $table->decimal('commission_rate', 5, 2)->default(20.00);
            $table->decimal('recurring_rate', 5, 2)->default(5.00);
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();
            $table->string('bank_code')->nullable();
            $table->string('payment_method')->default('bank_transfer');
            $table->decimal('total_earnings', 12, 2)->default(0);
            $table->decimal('pending_payout', 12, 2)->default(0);
            $table->decimal('total_paid', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('onboarded_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->index(['referral_code']);
            $table->index(['business_id', 'status']);
            $table->index('agent_type');
            $table->index('tier');
        });

        Schema::create('referral_agent_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('referral_agents')->onDelete('cascade');
            $table->string('type'); // id_card, certificate, address_proof
            $table->string('file_path');
            $table->string('file_name');
            $table->string('mime_type');
            $table->bigInteger('file_size');
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            
            $table->index(['agent_id', 'type']);
        });

        Schema::create('referral_agent_onboarding', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('referral_agents')->onDelete('cascade');
            $table->integer('step'); // 1: personal_info, 2: documents, 3: payout_info, 4: agreement
            $table->string('step_name');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();
            
            $table->unique(['agent_id', 'step']);
        });

        Schema::create('referral_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('referral_agents')->onDelete('cascade');
            $table->foreignId('referred_business_id')->constrained('businesses')->onDelete('cascade');
            $table->string('type'); // first_purchase, recurring, bonus
            $table->string('status')->default('pending'); // pending, approved, paid, cancelled
            $table->decimal('amount', 12, 2);
            $table->decimal('rate_applied', 5, 2);
            $table->string('currency')->default('NGN');
            $table->foreignId('invoice_id')->nullable()->constrained()->onDelete('set null');
            $table->string('description')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            
            $table->index(['agent_id', 'status']);
            $table->index(['referred_business_id']);
        });

        Schema::create('referral_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('referral_agents')->onDelete('cascade');
            $table->foreignId('referred_business_id')->constrained('businesses')->onDelete('cascade');
            $table->string('source_url')->nullable();
            $table->string('utm_source')->nullable();
            $table->string('utm_medium')->nullable();
            $table->string('utm_campaign')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->boolean('is_converted')->default(false);
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();
            
            $table->unique(['referred_business_id', 'agent_id']);
            $table->index(['agent_id', 'is_converted']);
        });

        Schema::create('referral_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // bronze, silver, gold, platinum
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->integer('min_referrals')->default(0);
            $table->integer('max_referrals')->nullable();
            $table->decimal('commission_rate', 5, 2)->default(20.00);
            $table->decimal('recurring_rate', 5, 2)->default(5.00);
            $table->string('badge_color')->default('#CD7F32');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('referral_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('referral_agents')->onDelete('cascade');
            $table->string('payout_number')->unique();
            $table->decimal('amount', 12, 2);
            $table->decimal('fees', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2);
            $table->string('currency')->default('NGN');
            $table->string('status')->default('pending'); // pending, processing, completed, failed, cancelled
            $table->string('payment_method'); // bank_transfer, wallet
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();
            $table->string('gateway_reference')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            $table->index(['agent_id', 'status']);
            $table->index('payout_number');
        });

        Schema::create('referral_bonuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('referral_agents')->onDelete('cascade');
            $table->string('type'); // tier_upgrade, performance, seasonal
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('NGN');
            $table->string('status')->default('pending');
            $table->json('conditions')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        Schema::create('referral_fraud_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_id')->constrained('referral_agents')->onDelete('cascade');
            $table->string('type'); // self_referral, duplicate_ip, suspicious_pattern
            $table->string('severity'); // low, medium, high, critical
            $table->text('description');
            $table->json('evidence')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            
            $table->index(['agent_id', 'is_resolved']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('referral_fraud_logs');
        Schema::dropIfExists('referral_bonuses');
        Schema::dropIfExists('referral_payouts');
        Schema::dropIfExists('referral_tiers');
        Schema::dropIfExists('referral_tracking');
        Schema::dropIfExists('referral_commissions');
        Schema::dropIfExists('referral_agent_onboarding');
        Schema::dropIfExists('referral_agent_documents');
        Schema::dropIfExists('referral_agents');
    }
};