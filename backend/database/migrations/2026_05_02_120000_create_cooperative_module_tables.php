<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cooperatives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('share_price', 14, 2)->default(1000);
            $table->unsignedInteger('minimum_member_shares')->default(1);
            $table->text('contribution_rule')->nullable();
            $table->string('profit_cycle')->default('monthly');
            $table->string('status')->default('active');
            $table->text('sharia_notes')->nullable();
            $table->timestamps();

            $table->unique('business_id');
        });

        Schema::create('cooperative_loan_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('required_guarantors')->default(2);
            $table->unsignedInteger('min_shares_per_guarantor')->default(1);
            $table->unsignedInteger('min_combined_guarantor_shares')->default(2);
            $table->unsignedInteger('borrower_min_shares')->default(1);
            $table->string('loan_limit_mode')->default('multiplier');
            $table->decimal('loan_limit_value', 14, 2)->default(2);
            $table->boolean('lock_borrower_shares')->default(true);
            $table->boolean('lock_guarantor_shares')->default(true);
            $table->string('liability_mode')->default('proportional');
            $table->boolean('allow_admin_override')->default(false);
            $table->text('custom_liability_notes')->nullable();
            $table->timestamps();

            $table->unique('cooperative_id');
        });

        Schema::create('cooperative_branding_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->string('branding_tier')->default('basic');
            $table->string('logo_url')->nullable();
            $table->string('primary_color')->nullable();
            $table->string('secondary_color')->nullable();
            $table->boolean('remove_powered_by_taska')->default(false);
            $table->string('custom_domain')->nullable();
            $table->string('custom_tagline')->nullable();
            $table->timestamps();

            $table->unique('cooperative_id');
        });

        Schema::create('cooperative_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('member_number')->unique();
            $table->string('role')->default('member');
            $table->date('joined_at')->nullable();
            $table->string('status')->default('active');
            $table->decimal('shares_locked', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['cooperative_id', 'customer_id']);
        });

        Schema::create('cooperative_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('cooperative_members')->cascadeOnDelete();
            $table->string('transaction_type')->default('purchase');
            $table->decimal('units', 14, 2);
            $table->decimal('amount_paid', 14, 2)->default(0);
            $table->decimal('price_per_share', 14, 2)->default(0);
            $table->date('issued_at');
            $table->text('notes')->nullable();
            $table->string('locked_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('cooperative_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('wallet_type');
            $table->decimal('balance', 14, 2)->default(0);
            $table->decimal('locked_balance', 14, 2)->default(0);
            $table->string('currency', 3)->default('NGN');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['cooperative_id', 'wallet_type']);
        });

        Schema::create('cooperative_financing', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('cooperative_members')->cascadeOnDelete();
            $table->foreignId('override_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('financing_type');
            $table->string('status')->default('draft');
            $table->decimal('amount_requested', 14, 2)->nullable();
            $table->decimal('amount_disbursed', 14, 2)->default(0);
            $table->decimal('capital_amount', 14, 2)->nullable();
            $table->decimal('cooperative_capital', 14, 2)->nullable();
            $table->decimal('member_capital', 14, 2)->nullable();
            $table->decimal('profit_share_cooperative', 8, 2)->nullable();
            $table->decimal('profit_share_member', 8, 2)->nullable();
            $table->string('profit_share_ratio')->nullable();
            $table->text('business_description')->nullable();
            $table->unsignedInteger('duration_months')->nullable();
            $table->date('repayment_due_date')->nullable();
            $table->decimal('late_penalty_amount', 14, 2)->default(0);
            $table->string('late_penalty_destination')->default('charity');
            $table->text('admin_override_reason')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->json('guarantee_snapshot')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('cooperative_guarantors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financing_id')->constrained('cooperative_financing')->cascadeOnDelete();
            $table->foreignId('guarantor_member_id')->constrained('cooperative_members')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->decimal('shares_committed', 14, 2)->default(0);
            $table->decimal('liability_share_percent', 8, 2)->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['financing_id', 'guarantor_member_id']);
        });

        Schema::create('cooperative_financing_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financing_id')->constrained('cooperative_financing')->cascadeOnDelete();
            $table->date('reporting_period_start');
            $table->date('reporting_period_end');
            $table->decimal('revenue', 14, 2)->default(0);
            $table->decimal('direct_cost', 14, 2)->default(0);
            $table->decimal('net_profit', 14, 2)->default(0);
            $table->decimal('cooperative_share_amount', 14, 2)->default(0);
            $table->decimal('member_share_amount', 14, 2)->default(0);
            $table->string('status')->default('submitted');
            $table->text('report_notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('cooperative_investments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('name');
            $table->string('category')->default('halal_trade');
            $table->string('status')->default('active');
            $table->decimal('amount', 14, 2);
            $table->decimal('expected_return_rate', 8, 2)->nullable();
            $table->decimal('current_value', 14, 2)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('linked_inventory')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('cooperative_profit_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->date('cycle_start');
            $table->date('cycle_end');
            $table->decimal('total_profit', 14, 2)->default(0);
            $table->decimal('distributable_profit', 14, 2)->default(0);
            $table->decimal('reserve_allocation', 14, 2)->default(0);
            $table->decimal('charity_allocation', 14, 2)->default(0);
            $table->string('status')->default('draft');
            $table->timestamp('distributed_at')->nullable();
            $table->json('distribution_snapshot')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('cooperative_profit_distributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profit_cycle_id')->constrained('cooperative_profit_cycles')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('cooperative_members')->cascadeOnDelete();
            $table->decimal('shares_at_record', 14, 2)->default(0);
            $table->decimal('ownership_percent', 8, 2)->default(0);
            $table->decimal('amount', 14, 2)->default(0);
            $table->string('status')->default('pending');
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamps();

            $table->unique(['profit_cycle_id', 'member_id']);
        });

        Schema::create('cooperative_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('cooperative_members')->cascadeOnDelete();
            $table->string('withdrawal_type');
            $table->string('status')->default('requested');
            $table->decimal('amount', 14, 2);
            $table->text('reason')->nullable();
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('cooperative_governance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cooperative_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('record_type');
            $table->string('title');
            $table->date('record_date')->nullable();
            $table->string('status')->default('scheduled');
            $table->text('summary')->nullable();
            $table->json('decisions_json')->nullable();
            $table->string('attachment_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cooperative_governance_records');
        Schema::dropIfExists('cooperative_withdrawals');
        Schema::dropIfExists('cooperative_profit_distributions');
        Schema::dropIfExists('cooperative_profit_cycles');
        Schema::dropIfExists('cooperative_investments');
        Schema::dropIfExists('cooperative_financing_reports');
        Schema::dropIfExists('cooperative_guarantors');
        Schema::dropIfExists('cooperative_financing');
        Schema::dropIfExists('cooperative_wallets');
        Schema::dropIfExists('cooperative_shares');
        Schema::dropIfExists('cooperative_members');
        Schema::dropIfExists('cooperative_branding_settings');
        Schema::dropIfExists('cooperative_loan_settings');
        Schema::dropIfExists('cooperatives');
    }
};
