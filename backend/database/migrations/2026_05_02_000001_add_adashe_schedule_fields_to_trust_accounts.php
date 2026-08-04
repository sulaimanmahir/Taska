<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trust_accounts', function (Blueprint $table) {
            $table->string('cycle_name')->nullable()->after('account_type');
            $table->decimal('installment_amount', 15, 2)->nullable()->after('limit');
            $table->unsignedInteger('contribution_frequency_days')->nullable()->after('installment_amount');
            $table->date('next_due_date')->nullable()->after('last_payment_date');
        });
    }

    public function down(): void
    {
        Schema::table('trust_accounts', function (Blueprint $table) {
            $table->dropColumn([
                'cycle_name',
                'installment_amount',
                'contribution_frequency_days',
                'next_due_date',
            ]);
        });
    }
};
