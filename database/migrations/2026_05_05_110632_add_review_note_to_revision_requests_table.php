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
            $table->text('review_note')->nullable()->after('related_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('revision_requests', function (Blueprint $table) {
            $table->dropColumn('review_note');
        });
    }
};
