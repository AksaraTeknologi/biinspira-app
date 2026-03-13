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
        Schema::table('ad_plans', function (Blueprint $table) {
            // Tambah kolom batch setelah event_id
            $table->string('batch')->nullable()->after('event_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ad_plans', function (Blueprint $table) {
            $table->dropColumn('batch');
        });
    }
};