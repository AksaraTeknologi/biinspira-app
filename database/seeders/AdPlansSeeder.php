<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AdPlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ambil ID User pertama yang ada di database.
        //    Pastikan tabel users sudah terisi.
        $userId = DB::table('users')->value('id');

        // 2. Ambil 3 ID Event pertama dari tabel master_events.
        //    Pastikan MasterEventsSeeder sudah dijalankan.
        $eventIds = DB::table('master_events')->limit(3)->pluck('id');

        // Cek apakah data user dan event tersedia
        if (!$userId || $eventIds->isEmpty()) {
            echo "Skipping AdPlanSeeder: Data in 'users' or 'master_events' not found.\n";
            return;
        }

        DB::table('ad_plans')->insert([
            [
                'id' => Str::uuid(), // UUID untuk primary key
                'user_id' => $userId,
                'event_id' => $eventIds[0],
                'status' => 'completed',
                'created_at' => Carbon::now()->subDays(5),
                'updated_at' => Carbon::now()->subDays(5),
            ],
            [
                'id' => Str::uuid(),
                'user_id' => $userId,
                'event_id' => $eventIds[1],
                'status' => 'draft',
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ],
            [
                'id' => Str::uuid(),
                'user_id' => $userId,
                'event_id' => $eventIds[2],
                'status' => 'completed',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);
    }
}
