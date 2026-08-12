<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('revision_request_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('revision_request_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        // Migrate existing assigned_to data to the pivot table
        DB::statement('
            INSERT INTO revision_request_user (revision_request_id, user_id, created_at, updated_at)
            SELECT id, assigned_to, NOW(), NOW()
            FROM revision_requests
            WHERE assigned_to IS NOT NULL
        ');

        // Drop the old assigned_to column
        Schema::table('revision_requests', function (Blueprint $table) {
            $table->dropForeign(['assigned_to']);
            $table->dropColumn('assigned_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('revision_requests', function (Blueprint $table) {
            $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
        });

        // Migrate data back
        DB::statement('
            UPDATE revision_requests r
            JOIN revision_request_user ru ON r.id = ru.revision_request_id
            SET r.assigned_to = ru.user_id
        ');

        Schema::dropIfExists('revision_request_user');
    }
};
