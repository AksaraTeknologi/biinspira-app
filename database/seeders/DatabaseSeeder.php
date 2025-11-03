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
            'name' => 'Vieta',
            'email' => 'vieta@gmail.com',
            'phone' => '085649796210',
            'password' => bcrypt('admin'),
            'email_verified_at' => now(),
        ])->assignRole('admin');

        User::factory()->create([
            'name' => 'Ratih',
            'email' => 'ratih@gmail.com',
            'phone' => '082234442534',
            'password' => bcrypt('admin'),
            'email_verified_at' => now(),
        ])->assignRole('admin');

        $this->call(ProductSeeder::class);
        $this->call(AgentSeeder::class);
    }
}
