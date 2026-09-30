<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Safely converts ad_spend_stats, brevet_stats, applications, revision_comments,
     * and ticket_notifications to UUID primary keys with zero data loss.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver !== 'mysql') {
            return;
        }

        // 1. ad_spend_stats
        if (Schema::hasTable('ad_spend_stats') && Schema::getColumnType('ad_spend_stats', 'id') !== 'string') {
            DB::statement('ALTER TABLE `ad_spend_stats` ADD COLUMN `uuid_id` CHAR(36) NULL AFTER `id`');
            
            $rows = DB::table('ad_spend_stats')->select('id')->get();
            foreach ($rows as $row) {
                DB::table('ad_spend_stats')->where('id', $row->id)->update(['uuid_id' => (string) Str::uuid()]);
            }

            DB::statement('ALTER TABLE `ad_spend_stats` MODIFY `id` BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE `ad_spend_stats` DROP PRIMARY KEY');
            DB::statement('ALTER TABLE `ad_spend_stats` DROP COLUMN `id`');
            DB::statement('ALTER TABLE `ad_spend_stats` CHANGE `uuid_id` `id` CHAR(36) NOT NULL PRIMARY KEY FIRST');
        }

        // 2. brevet_stats
        if (Schema::hasTable('brevet_stats') && Schema::getColumnType('brevet_stats', 'id') !== 'string') {
            DB::statement('ALTER TABLE `brevet_stats` ADD COLUMN `uuid_id` CHAR(36) NULL AFTER `id`');
            
            $rows = DB::table('brevet_stats')->select('id')->get();
            foreach ($rows as $row) {
                DB::table('brevet_stats')->where('id', $row->id)->update(['uuid_id' => (string) Str::uuid()]);
            }

            DB::statement('ALTER TABLE `brevet_stats` MODIFY `id` BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE `brevet_stats` DROP PRIMARY KEY');
            DB::statement('ALTER TABLE `brevet_stats` DROP COLUMN `id`');
            DB::statement('ALTER TABLE `brevet_stats` CHANGE `uuid_id` `id` CHAR(36) NOT NULL PRIMARY KEY FIRST');
        }

        // 3. applications & revision_requests.application_id
        if (Schema::hasTable('applications') && Schema::getColumnType('applications', 'id') !== 'string') {
            try {
                DB::statement('ALTER TABLE `revision_requests` DROP FOREIGN KEY `revision_requests_application_id_foreign`');
            } catch (\Throwable $e) {}

            DB::statement('ALTER TABLE `applications` ADD COLUMN `uuid_id` CHAR(36) NULL AFTER `id`');
            
            $hasRevReqAppId = Schema::hasTable('revision_requests') && Schema::hasColumn('revision_requests', 'application_id');
            if ($hasRevReqAppId) {
                DB::statement('ALTER TABLE `revision_requests` ADD COLUMN `uuid_application_id` CHAR(36) NULL AFTER `application_id`');
            }

            $apps = DB::table('applications')->select('id')->get();
            foreach ($apps as $app) {
                $newUuid = (string) Str::uuid();
                DB::table('applications')->where('id', $app->id)->update(['uuid_id' => $newUuid]);
                if ($hasRevReqAppId) {
                    DB::table('revision_requests')->where('application_id', $app->id)->update(['uuid_application_id' => $newUuid]);
                }
            }

            DB::statement('ALTER TABLE `applications` MODIFY `id` BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE `applications` DROP PRIMARY KEY');
            DB::statement('ALTER TABLE `applications` DROP COLUMN `id`');
            DB::statement('ALTER TABLE `applications` CHANGE `uuid_id` `id` CHAR(36) NOT NULL PRIMARY KEY FIRST');

            if ($hasRevReqAppId) {
                DB::statement('ALTER TABLE `revision_requests` DROP COLUMN `application_id`');
                DB::statement('ALTER TABLE `revision_requests` CHANGE `uuid_application_id` `application_id` CHAR(36) NULL AFTER `related_url`');
                DB::statement('ALTER TABLE `revision_requests` ADD CONSTRAINT `revision_requests_application_id_foreign` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE SET NULL');
            }
        }

        // 4. revision_comments & ticket_notifications.revision_comment_id
        if (Schema::hasTable('revision_comments') && Schema::getColumnType('revision_comments', 'id') !== 'string') {
            if (Schema::hasTable('ticket_notifications')) {
                try {
                    DB::statement('ALTER TABLE `ticket_notifications` DROP FOREIGN KEY `ticket_notifications_revision_comment_id_foreign`');
                } catch (\Throwable $e) {}
            }

            DB::statement('ALTER TABLE `revision_comments` ADD COLUMN `uuid_id` CHAR(36) NULL AFTER `id`');
            
            $hasNotifCommentId = Schema::hasTable('ticket_notifications') && Schema::hasColumn('ticket_notifications', 'revision_comment_id');
            if ($hasNotifCommentId) {
                DB::statement('ALTER TABLE `ticket_notifications` ADD COLUMN `uuid_revision_comment_id` CHAR(36) NULL AFTER `revision_comment_id`');
            }

            $comments = DB::table('revision_comments')->select('id')->get();
            foreach ($comments as $c) {
                $newUuid = (string) Str::uuid();
                DB::table('revision_comments')->where('id', $c->id)->update(['uuid_id' => $newUuid]);
                if ($hasNotifCommentId) {
                    DB::table('ticket_notifications')->where('revision_comment_id', $c->id)->update(['uuid_revision_comment_id' => $newUuid]);
                }
            }

            DB::statement('ALTER TABLE `revision_comments` MODIFY `id` BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE `revision_comments` DROP PRIMARY KEY');
            DB::statement('ALTER TABLE `revision_comments` DROP COLUMN `id`');
            DB::statement('ALTER TABLE `revision_comments` CHANGE `uuid_id` `id` CHAR(36) NOT NULL PRIMARY KEY FIRST');

            if ($hasNotifCommentId) {
                DB::statement('ALTER TABLE `ticket_notifications` DROP COLUMN `revision_comment_id`');
                DB::statement('ALTER TABLE `ticket_notifications` CHANGE `uuid_revision_comment_id` `revision_comment_id` CHAR(36) NOT NULL AFTER `revision_request_id`');
                DB::statement('ALTER TABLE `ticket_notifications` ADD CONSTRAINT `ticket_notifications_revision_comment_id_foreign` FOREIGN KEY (`revision_comment_id`) REFERENCES `revision_comments` (`id`) ON DELETE CASCADE');
            }
        }

        // 5. ticket_notifications.id
        if (Schema::hasTable('ticket_notifications') && Schema::getColumnType('ticket_notifications', 'id') !== 'string') {
            DB::statement('ALTER TABLE `ticket_notifications` ADD COLUMN `uuid_id` CHAR(36) NULL AFTER `id`');
            
            $notifs = DB::table('ticket_notifications')->select('id')->get();
            foreach ($notifs as $n) {
                DB::table('ticket_notifications')->where('id', $n->id)->update(['uuid_id' => (string) Str::uuid()]);
            }

            DB::statement('ALTER TABLE `ticket_notifications` MODIFY `id` BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE `ticket_notifications` DROP PRIMARY KEY');
            DB::statement('ALTER TABLE `ticket_notifications` DROP COLUMN `id`');
            DB::statement('ALTER TABLE `ticket_notifications` CHANGE `uuid_id` `id` CHAR(36) NOT NULL PRIMARY KEY FIRST');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way migration to UUID
    }
};
