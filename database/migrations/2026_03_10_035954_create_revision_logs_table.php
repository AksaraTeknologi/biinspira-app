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
        Schema::create('revision_logs', function (Blueprint $table) {

            $table->id();

            // ✅ FK ke revision_requests (UUID)
            $table->foreignId('revision_id')
                ->constrained('revision_requests')
                ->cascadeOnDelete();

            $table->string('from_status')->nullable();
            $table->string('to_status');

            $table->text('note')->nullable();

            // ✅ FK ke users (UUID)
            $table->foreignUuid('changed_by')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamp('changed_at');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('revision_logs');
    }
};
