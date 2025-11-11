<?php

namespace Database\Seeders;

use App\Models\MasterAdGoal;
use App\Models\MasterEvent;
use App\Models\MasterPlatform;
use Illuminate\Database\Seeder;

class MasterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        MasterPlatform::create(['id' => 1, 'name' => 'Boost Post',]);
        MasterPlatform::create(['id' => 2, 'name' => 'Meta Ads',]);
        MasterPlatform::create(['id' => 3, 'name' => 'Business Suite',]);

        MasterAdGoal::create(['id' => 1, 'name' => 'Klik WhatsApp',]);
        MasterAdGoal::create(['id' => 2, 'name' => 'Kunjungan Profil Instagram',]);
        MasterAdGoal::create(['id' => 3, 'name' => 'Kunjungan Website/Linktree',]);

        MasterEvent::create([ 'id' => 1, 'name' => 'Laravel Bootcamp', 'batch' => '1', 'end_date' => now()->addMonths(1)->format('Y-m-d'), 'created_at' => now(), 'updated_at' => now(), ]);
        MasterEvent::create([ 'id' => 2, 'name' => 'Website Design Figma to Code', 'batch' => '1', 'end_date' => now()->addMonths(1)->format('Y-m-d'), 'created_at' => now(), 'updated_at' => now(), ]);
        MasterEvent::create([ 'id' => 3, 'name' => 'Blender Bootcamp', 'batch' => '1', 'end_date' => now()->addMonths(1)->format('Y-m-d'), 'created_at' => now(), 'updated_at' => now(), ]);
    }
}
