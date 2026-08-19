<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * An invited-but-not-yet-accepted member has no joined_at yet (see
     * BusinessProvisioningService::attachUserToBusiness()) - it's set for
     * real once they accept via BusinessTeamService::acceptInvite().
     */
    public function up(): void
    {
        Schema::table('business_user', function (Blueprint $table) {
            $table->timestamp('joined_at')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('business_user', function (Blueprint $table) {
            $table->timestamp('joined_at')->useCurrent()->change();
        });
    }
};
