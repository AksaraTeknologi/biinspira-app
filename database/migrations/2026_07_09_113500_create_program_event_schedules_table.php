<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('program_event_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('program_event_id')->constrained('program_events')->onDelete('cascade');
            $table->enum('schedule_type', ['main', 'socialization'])->default('main');
            // 'main'          = jadwal reguler (bootcamp & certif)
            // 'socialization' = jadwal sosialisasi (certif only)
            $table->string('title')->nullable();
            $table->date('schedule_date');
            $table->enum('day', ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']);
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_event_schedules');
    }
};
