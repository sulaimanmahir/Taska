<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('access_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->onDelete('cascade');
            $table->foreignId('actor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action'); // member_added, member_updated, branch_created, branch_updated
            $table->string('subject_type'); // user, branch
            $table->unsignedBigInteger('subject_id');
            $table->string('subject_label')->nullable(); // denormalized name, survives the subject being deleted later
            // Only the fields that actually changed, as {"field": {"from": x, "to": y}} -
            // not a full before/after snapshot, so the log stays readable and doesn't
            // need to know every column on every subject type up front.
            $table->json('changes')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index('business_id');
            $table->index(['business_id', 'subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_audit_logs');
    }
};
