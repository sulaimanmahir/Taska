<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('monthly_price', 12, 2)->default(0);
            $table->decimal('yearly_price', 12, 2)->default(0);
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });

        Schema::create('subscription_plan_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $table->string('feature_key');
            $table->string('feature_name');
            $table->string('value_type', 20);
            $table->string('value')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['plan_id', 'feature_key']);
        });

        Schema::create('business_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $table->string('status', 30);
            $table->date('starts_at');
            $table->date('ends_at')->nullable();
            $table->date('cancelled_at')->nullable();
            $table->boolean('is_auto_renew')->default(false);
            $table->string('billing_cycle', 20)->default('monthly');
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->string('currency', 10)->default('NGN');
            $table->timestamps();
        });

        Schema::create('subscription_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained('business_subscriptions')->cascadeOnDelete();
            $table->string('feature_key');
            $table->unsignedInteger('current_usage')->default(0);
            $table->unsignedInteger('limit_value')->nullable();
            $table->timestamp('reset_at')->nullable();
            $table->timestamps();

            $table->unique(['subscription_id', 'feature_key']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('business_subscriptions')->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->string('type', 30);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('currency', 10)->default('NGN');
            $table->string('status', 30)->default('pending');
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_method', 30)->nullable();
            $table->string('gateway_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('provider', 30);
            $table->string('last_four', 10)->nullable();
            $table->string('brand')->nullable();
            $table->unsignedTinyInteger('expiry_month')->nullable();
            $table->unsignedSmallInteger('expiry_year')->nullable();
            $table->text('gateway_token');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();
            $table->string('bank_code')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('payment_method_id')->nullable()->constrained('payment_methods')->nullOnDelete();
            $table->string('gateway', 30);
            $table->string('reference')->unique();
            $table->string('status', 30);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('NGN');
            $table->text('failure_reason')->nullable();
            $table->unsignedInteger('attempt_number')->default(1);
            $table->timestamps();
        });

        Schema::create('billing_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->string('type', 40);
            $table->string('channel', 30);
            $table->string('subject');
            $table->text('message');
            $table->json('data')->nullable();
            $table->boolean('is_sent')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('auto_renew_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnDelete();
            $table->foreignId('payment_method_id')->constrained('payment_methods')->cascadeOnDelete();
            $table->boolean('consent_given')->default(false);
            $table->text('consent_text')->nullable();
            $table->timestamp('consented_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->date('next_charge_date')->nullable();
            $table->decimal('next_charge_amount', 12, 2)->nullable();
            $table->string('billing_cycle', 20)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auto_renew_consents');
        Schema::dropIfExists('billing_notifications');
        Schema::dropIfExists('payment_attempts');
        Schema::dropIfExists('payment_methods');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('subscription_usages');
        Schema::dropIfExists('business_subscriptions');
        Schema::dropIfExists('subscription_plan_features');
        Schema::dropIfExists('subscription_plans');
    }
};
