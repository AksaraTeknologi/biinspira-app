<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = ['admin', 'technician', 'unit'];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // assign ke user lama
        $users = User::all();

        foreach ($users as $user) {
            if ($user->role) {
                $user->assignRole($user->role);
            }
        }
    }
}