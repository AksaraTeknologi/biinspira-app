<?php

namespace Database\Seeders;

use App\Models\Agent;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AgentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Agent::create(['name' => 'Vieta', 'phone' => '085649796210']);
        Agent::create(['name' => 'Ratna', 'phone' => '081334440200']);
        Agent::create(['name' => 'Heny', 'phone' => '081357556781']);
        Agent::create(['name' => 'Etna', 'phone' => '0811362991']);
        Agent::create(['name' => 'Nila', 'phone' => '081333227270']);
        Agent::create(['name' => 'Ririh', 'phone' => '081283117797']);
        Agent::create(['name' => 'Mufti', 'phone' => '082333712524']);
        Agent::create(['name' => 'Fani', 'phone' => '081233339148']);
        Agent::create(['name' => 'Syarie', 'phone' => '081233155530']);
        Agent::create(['name' => 'Titik', 'phone' => '081335369420']);
        Agent::create(['name' => 'Ratih', 'phone' => '082234442534']);
        Agent::create(['name' => 'Winda', 'phone' => '08113507289']);
    }
}
