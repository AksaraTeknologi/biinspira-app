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
        Schema::create('revision_requests', function (Blueprint $table) {
            $table->id();

            $table->string('title');
            $table->text('description');

            $table->string('related_url')->nullable();

            // user role 'unit' yang bikin request
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();

            $table->string('attachment')->nullable(); // field untuk foto / file

            $table->enum('urgency', [
                'high',
                'medium',
                'low'
            ])->default('medium');

            $table->enum('status', [
                'request',
                'todo',
                'in_progress',
                'in_review',
                'complete'
            ])->default('request');

            $table->timestamp('deadline')->nullable();

            $table->timestamp('estimation_start')->nullable();
            $table->timestamp('estimation_end')->nullable();


            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('revision_requests');
    }
};
