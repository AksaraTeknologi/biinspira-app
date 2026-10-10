<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignUuid('revision_request_id')
                ->constrained('revision_requests')
                ->cascadeOnDelete();
            $table->foreignUuid('revision_comment_id')
                ->constrained('revision_comments')
                ->cascadeOnDelete();
            $table->foreignUuid('sender_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('sender_name');
            $table->string('ticket_title');
            $table->text('comment_body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_notifications');
    }
};
