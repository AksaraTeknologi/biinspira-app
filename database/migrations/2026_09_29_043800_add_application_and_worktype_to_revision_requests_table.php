<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('revision_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('revision_requests', 'application_id')) {
                $table->foreignUuid('application_id')
                    ->nullable()
                    ->after('related_url')
                    ->constrained('applications')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('revision_requests', 'work_type')) {
                $table->enum('work_type', ['pengerjaan', 'penambahan_fitur', 'maintenance'])
                    ->nullable()
                    ->after('application_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('revision_requests', function (Blueprint $table) {
            if (Schema::hasColumn('revision_requests', 'application_id')) {
                $table->dropForeign(['application_id']);
                $table->dropColumn('application_id');
            }
            if (Schema::hasColumn('revision_requests', 'work_type')) {
                $table->dropColumn('work_type');
            }
        });
    }
};
