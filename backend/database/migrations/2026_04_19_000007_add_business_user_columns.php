<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('current_business_id')->nullable()->constrained('businesses')->onDelete('set null');
            $table->foreignId('current_branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->string('phone')->nullable()->change();
            $table->string('avatar_url')->nullable()->change();
        });

        Schema::create('business_user', function (Blueprint $table) {
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('role_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('joined_at')->useCurrent();
            $table->primary(['business_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_user');
        
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_business_id']);
            $table->dropForeign(['current_branch_id']);
            $table->dropColumn(['current_business_id', 'current_branch_id', 'phone', 'avatar_url']);
        });
    }
};