<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('business_category')->nullable()->after('business_type');
            $table->string('logo_url')->nullable()->after('phone');
        });

        Schema::table('business_user', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('role_id')->constrained()->nullOnDelete();
            $table->string('status')->default('active')->after('branch_id');
        });
    }

    public function down(): void
    {
        Schema::table('business_user', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['branch_id', 'status']);
        });

        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['business_category', 'logo_url']);
        });
    }
};
