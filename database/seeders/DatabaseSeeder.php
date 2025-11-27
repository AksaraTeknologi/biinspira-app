<?php

namespace Database\Seeders;

use App\Models\AdEvaluation;
use App\Models\AdMetric;
use App\Models\AdPlan;
use App\Models\AdPlanPlatform;
use App\Models\AdResult;
use App\Models\AdResultPlatform;
use App\Models\User;
use App\Models\Variant;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'user']);

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'password' => bcrypt('admin'),
            'email_verified_at' => now(),
        ])->assignRole('admin');

        User::factory()->create([
            'name' => 'biinspira',
            'email' => 'user@gmail.com',
            'password' => bcrypt('user'),
            'email_verified_at' => now(),
        ])->assignRole('user');

        $this->call(MasterSeeder::class);

        // 3. Setelah factory diperbaiki, panggil factory terdalam
        // Ini akan membuat 20 data dummy lengkap dengan semua relasi ke atas
        // (AdMetric -> AdResultPlatform -> AdResult -> AdPlan -> User/Event)
        // AdPlan::factory()->count(20)->create();
        // AdPlanPlatform::factory()->count(20)->create();
        // AdResult::factory()->count(20)->create();
        // AdResultPlatform::factory()->count(20)->create();
        // AdMetric::factory()->count(20)->create();
        // AdEvaluation::factory()->count(20)->create();
    }
}
