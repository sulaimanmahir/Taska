<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Opt-in per business: a null threshold means "never require approval"
     * for that action type, so existing businesses see no behavior change
     * until an owner explicitly configures one in Settings.
     */
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->decimal('expense_approval_threshold', 12, 2)->nullable()->after('currency');
            $table->decimal('discount_approval_threshold', 12, 2)->nullable()->after('expense_approval_threshold');
            $table->boolean('require_inventory_adjustment_approval')->default(false)->after('discount_approval_threshold');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['expense_approval_threshold', 'discount_approval_threshold', 'require_inventory_adjustment_approval']);
        });
    }
};
