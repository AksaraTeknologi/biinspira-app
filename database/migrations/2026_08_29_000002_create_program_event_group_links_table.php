<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('program_event_group_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('program_event_id')->constrained('program_events')->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->text('url');
            $table->timestamps();
        });

        // Migrate any existing group_url from program_events
        try {
            $events = DB::table('program_events')->whereNotNull('group_url')->where('group_url', '!=', '')->get();
            foreach ($events as $event) {
                DB::table('program_event_group_links')->insert([
                    'id'               => (string) Str::uuid(),
                    'program_event_id' => $event->id,
                    'user_id'          => $event->user_id,
                    'url'              => $event->group_url,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);
            }
        } catch (\Exception $e) {
            // Ignore if table was empty
        }

        // Drop redundant group_url column from program_events
        if (Schema::hasColumn('program_events', 'group_url')) {
            Schema::table('program_events', function (Blueprint $table) {
                $table->dropColumn('group_url');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_event_group_links');

        if (!Schema::hasColumn('program_events', 'group_url')) {
            Schema::table('program_events', function (Blueprint $table) {
                $table->string('group_url')->nullable()->after('quota');
            });
        }
    }
};
