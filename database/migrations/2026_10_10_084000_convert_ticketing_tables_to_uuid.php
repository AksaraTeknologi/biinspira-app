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
     * Mengubah kolom id dan foreign key terkait ticketing menjadi UUID,
     * serta mengkonversi seluruh data existing menjadi karakter UUID yang valid.
     */
    public function up(): void
    {
        if (!Schema::hasTable('revision_requests')) {
            return;
        }

        // 1. Ambil seluruh data existing dari tabel ticketing sebelum skema diubah
        $oldRequests = DB::table('revision_requests')->get();
        $oldLogs = Schema::hasTable('revision_logs') ? DB::table('revision_logs')->get() : collect();
        $oldAttachments = Schema::hasTable('revision_attachments') ? DB::table('revision_attachments')->get() : collect();
        $oldRequestUsers = Schema::hasTable('revision_request_user') ? DB::table('revision_request_user')->get() : collect();
        $oldComments = Schema::hasTable('revision_comments') ? DB::table('revision_comments')->get() : collect();
        $oldNotifications = Schema::hasTable('ticket_notifications') ? DB::table('ticket_notifications')->get() : collect();
        $oldSubtasks = Schema::hasTable('revision_subtasks') ? DB::table('revision_subtasks')->get() : collect();

        // 2. Buat mapping ID tiket lama (int / uuid) -> UUID baru yang valid
        $ticketIdMap = [];
        foreach ($oldRequests as $req) {
            $currentId = (string) $req->id;
            if (Str::isUuid($currentId)) {
                $ticketIdMap[$currentId] = $currentId;
            } else {
                $ticketIdMap[$currentId] = (string) Str::uuid();
            }
        }

        // Nonaktifkan foreign key checks untuk perubahan skema
        Schema::disableForeignKeyConstraints();

        // 3. Drop tabel lama secara berurutan
        Schema::dropIfExists('ticket_notifications');
        Schema::dropIfExists('revision_comments');
        Schema::dropIfExists('revision_request_user');
        Schema::dropIfExists('revision_attachments');
        Schema::dropIfExists('revision_logs');
        Schema::dropIfExists('revision_subtasks');
        Schema::dropIfExists('revision_requests');

        // 4. Buat ulang tabel dengan tipe data UUID
        // --- revision_requests ---
        Schema::create('revision_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('related_url')->nullable();

            if (Schema::hasTable('applications')) {
                $table->foreignUuid('application_id')->nullable()->constrained('applications')->nullOnDelete();
            } else {
                $table->uuid('application_id')->nullable();
            }

            $table->enum('work_type', ['pengerjaan', 'penambahan_fitur', 'maintenance'])->nullable();
            $table->text('review_note')->nullable();
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('attachment')->nullable();

            $table->enum('urgency', ['high', 'medium', 'low'])->default('medium');
            $table->enum('target_role', ['technician', 'technician-intern'])->default('technician');
            $table->enum('status', ['request', 'todo', 'in_progress', 'in_review', 'complete'])->default('request');

            $table->timestamp('deadline')->nullable();
            $table->timestamp('estimation_start')->nullable();
            $table->timestamp('estimation_end')->nullable();
            $table->timestamp('actual_start')->nullable();
            $table->timestamp('actual_end')->nullable();

            $table->timestamps();
        });

        // --- revision_logs ---
        Schema::create('revision_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('revision_id')->constrained('revision_requests')->cascadeOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('note')->nullable();
            $table->foreignUuid('changed_by')->constrained('users')->cascadeOnDelete();
            $table->timestamp('changed_at');
            $table->timestamps();
        });

        // --- revision_attachments ---
        Schema::create('revision_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('revision_request_id')->constrained('revision_requests')->cascadeOnDelete();
            $table->string('file_path');
            $table->timestamps();
        });

        // --- revision_request_user (pivot assignees) ---
        Schema::create('revision_request_user', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('revision_request_id')->constrained('revision_requests')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        // --- revision_comments ---
        Schema::create('revision_comments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('revision_request_id')->constrained('revision_requests')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        // --- ticket_notifications ---
        Schema::create('ticket_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('revision_request_id')->constrained('revision_requests')->cascadeOnDelete();
            $table->foreignUuid('revision_comment_id')->nullable()->constrained('revision_comments')->cascadeOnDelete();
            $table->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();
            $table->string('sender_name');
            $table->string('ticket_title');
            $table->text('comment_body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });

        // --- revision_subtasks ---
        Schema::create('revision_subtasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('revision_request_id')->constrained('revision_requests')->cascadeOnDelete();
            $table->string('title');
            $table->boolean('is_completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->integer('order')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // 5. Masukkan kembali data yang telah dikonversi ke UUID
        $targetColsReq = Schema::getColumnListing('revision_requests');
        foreach ($oldRequests as $req) {
            $data = (array) $req;
            $oldId = (string) $req->id;
            $data['id'] = $ticketIdMap[$oldId] ?? (string) Str::uuid();
            $filtered = array_intersect_key($data, array_flip($targetColsReq));
            DB::table('revision_requests')->insert($filtered);
        }

        $targetColsLogs = Schema::getColumnListing('revision_logs');
        foreach ($oldLogs as $log) {
            $data = (array) $log;
            $oldRevId = (string) $log->revision_id;
            $data['revision_id'] = $ticketIdMap[$oldRevId] ?? $oldRevId;
            $data['id'] = (isset($log->id) && Str::isUuid((string) $log->id)) ? (string) $log->id : (string) Str::uuid();
            $filtered = array_intersect_key($data, array_flip($targetColsLogs));
            DB::table('revision_logs')->insert($filtered);
        }

        $targetColsAtt = Schema::getColumnListing('revision_attachments');
        foreach ($oldAttachments as $att) {
            $data = (array) $att;
            $oldRevId = (string) $att->revision_request_id;
            $data['revision_request_id'] = $ticketIdMap[$oldRevId] ?? $oldRevId;
            $data['id'] = (isset($att->id) && Str::isUuid((string) $att->id)) ? (string) $att->id : (string) Str::uuid();
            $filtered = array_intersect_key($data, array_flip($targetColsAtt));
            DB::table('revision_attachments')->insert($filtered);
        }

        $targetColsRru = Schema::getColumnListing('revision_request_user');
        foreach ($oldRequestUsers as $rru) {
            $data = (array) $rru;
            $oldRevId = (string) $rru->revision_request_id;
            $data['revision_request_id'] = $ticketIdMap[$oldRevId] ?? $oldRevId;
            $data['id'] = (isset($rru->id) && Str::isUuid((string) $rru->id)) ? (string) $rru->id : (string) Str::uuid();
            $filtered = array_intersect_key($data, array_flip($targetColsRru));
            DB::table('revision_request_user')->insert($filtered);
        }

        $targetColsComm = Schema::getColumnListing('revision_comments');
        foreach ($oldComments as $comm) {
            $data = (array) $comm;
            $oldRevId = (string) $comm->revision_request_id;
            $data['revision_request_id'] = $ticketIdMap[$oldRevId] ?? $oldRevId;
            $data['id'] = (isset($comm->id) && Str::isUuid((string) $comm->id)) ? (string) $comm->id : (string) Str::uuid();
            $filtered = array_intersect_key($data, array_flip($targetColsComm));
            DB::table('revision_comments')->insert($filtered);
        }

        $targetColsNotif = Schema::getColumnListing('ticket_notifications');
        foreach ($oldNotifications as $notif) {
            $data = (array) $notif;
            $oldRevId = (string) $notif->revision_request_id;
            $data['revision_request_id'] = $ticketIdMap[$oldRevId] ?? $oldRevId;
            $data['id'] = (isset($notif->id) && Str::isUuid((string) $notif->id)) ? (string) $notif->id : (string) Str::uuid();
            $filtered = array_intersect_key($data, array_flip($targetColsNotif));
            DB::table('ticket_notifications')->insert($filtered);
        }

        $targetColsSubtasks = Schema::getColumnListing('revision_subtasks');
        foreach ($oldSubtasks as $sub) {
            $data = (array) $sub;
            $oldRevId = (string) $sub->revision_request_id;
            $data['revision_request_id'] = $ticketIdMap[$oldRevId] ?? $oldRevId;
            $data['id'] = (isset($sub->id) && Str::isUuid((string) $sub->id)) ? (string) $sub->id : (string) Str::uuid();
            $filtered = array_intersect_key($data, array_flip($targetColsSubtasks));
            DB::table('revision_subtasks')->insert($filtered);
        }

        // Aktifkan kembali foreign key checks
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Migrasi ke UUID bersifat non-reversible untuk mempertahankan integritas data
    }
};
