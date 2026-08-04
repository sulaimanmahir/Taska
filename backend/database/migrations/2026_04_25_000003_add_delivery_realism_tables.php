<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->string('delivery_otp_code', 12)->nullable()->after('tracking_code');
            $table->timestamp('delivery_otp_verified_at')->nullable()->after('delivered_at');
            $table->timestamp('delayed_at')->nullable()->after('delivery_otp_verified_at');
            $table->decimal('delay_penalty_amount', 15, 2)->default(0)->after('delayed_at');
            $table->boolean('cod_fraud_flagged')->default(false)->after('delay_penalty_amount');
        });

        Schema::create('delivery_wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('delivery_order_id')->nullable()->constrained('delivery_orders')->nullOnDelete();
            $table->foreignId('rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('direction', ['credit', 'debit']);
            $table->string('reference');
            $table->string('reason');
            $table->decimal('amount', 15, 2)->default(0);
            $table->json('meta')->nullable();
            $table->timestamps();
        });

        Schema::create('delivery_complaints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('delivery_order_id')->constrained('delivery_orders')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source')->default('internal');
            $table->string('category');
            $table->enum('status', ['open', 'investigating', 'resolved'])->default('open');
            $table->text('summary');
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_complaints');
        Schema::dropIfExists('delivery_wallet_transactions');

        Schema::table('delivery_orders', function (Blueprint $table) {
            $table->dropColumn([
                'delivery_otp_code',
                'delivery_otp_verified_at',
                'delayed_at',
                'delay_penalty_amount',
                'cod_fraud_flagged',
            ]);
        });
    }
};
