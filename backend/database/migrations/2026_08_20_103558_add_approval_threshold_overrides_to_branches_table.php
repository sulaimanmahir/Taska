<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Optional per-branch overrides for the business-wide approval
     * thresholds (see the businesses table migration from 2026-08-19). Null
     * on every column means "inherit the business-wide setting" - this is
     * why require_inventory_adjustment_approval is a nullable boolean
     * rather than a plain default-false one: false and "not set" are
     * different states here, unlike on the business-level column.
     */
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->decimal('expense_approval_threshold', 12, 2)->nullable()->after('is_active');
            $table->decimal('discount_approval_threshold', 12, 2)->nullable()->after('expense_approval_threshold');
            $table->boolean('require_inventory_adjustment_approval')->nullable()->after('discount_approval_threshold');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['expense_approval_threshold', 'discount_approval_threshold', 'require_inventory_adjustment_approval']);
        });
    }
};
