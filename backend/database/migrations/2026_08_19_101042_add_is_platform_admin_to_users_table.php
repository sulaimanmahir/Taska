<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `role` on this table is a tenant-scoped label (every business owner is
     * `admin` of their own business by default - see
     * BusinessProvisioningService) and is separately mirrored per-business
     * in the role_user pivot. It was never meant to gate the platform-wide
     * /api/admin/* routes, but the `role:admin` middleware alias was reused
     * for both, so any self-registered business owner could reach platform
     * admin endpoints. This column is a distinct, explicit flag for real
     * platform staff, granted only via `php artisan taska:grant-platform-admin`.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_platform_admin')->default(false)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_platform_admin');
        });
    }
};
