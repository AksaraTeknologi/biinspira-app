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
        Schema::table('revision_requests', function (Blueprint $table) {
            $table->enum('target_role', ['technician', 'technician-intern'])->default('technician')->after('urgency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('revision_requests', function (Blueprint $table) {
            $table->dropColumn('target_role');
        });
    }
};
