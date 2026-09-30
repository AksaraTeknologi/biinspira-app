<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('color', 7)->nullable()->comment('Hex color, e.g. #3B82F6');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        if (Schema::hasTable('revision_requests') && Schema::hasColumn('revision_requests', 'application_id')) {
            Schema::table('revision_requests', function (Blueprint $table) {
                $table->foreign('application_id')->references('id')->on('applications')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('revision_requests') && Schema::hasColumn('revision_requests', 'application_id')) {
            Schema::table('revision_requests', function (Blueprint $table) {
                $table->dropForeign(['application_id']);
            });
        }
        Schema::dropIfExists('applications');
    }
};
