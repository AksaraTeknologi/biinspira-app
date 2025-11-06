<?php

namespace Database\Seeders;

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
    }
}
