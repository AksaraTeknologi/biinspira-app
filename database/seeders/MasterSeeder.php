<?php

namespace Database\Seeders;

use App\Models\MasterAdGoal;
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
    }
}
