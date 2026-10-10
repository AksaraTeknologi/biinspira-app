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
            $table->uuid('id')->primary();
            $table->foreignUuid('revision_request_id')->constrained('revision_requests')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // Migrate existing assigned_to data to the pivot table
        if (Schema::hasColumn('revision_requests', 'assigned_to')) {
            $existing = DB::table('revision_requests')
                ->whereNotNull('assigned_to')
                ->select('id', 'assigned_to')
                ->get();

            foreach ($existing as $row) {
                DB::table('revision_request_user')->insert([
                    'id'                  => (string) \Illuminate\Support\Str::uuid(),
                    'revision_request_id' => $row->id,
                    'user_id'             => $row->assigned_to,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ]);
            }

            // Drop the old assigned_to column
            Schema::table('revision_requests', function (Blueprint $table) {
                $table->dropForeign(['assigned_to']);
                $table->dropColumn('assigned_to');
            });
        }
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
        $pivots = DB::table('revision_request_user')->get();
        foreach ($pivots as $pivot) {
            DB::table('revision_requests')
                ->where('id', $pivot->revision_request_id)
                ->update(['assigned_to' => $pivot->user_id]);
        }

        Schema::dropIfExists('revision_request_user');
    }
};
