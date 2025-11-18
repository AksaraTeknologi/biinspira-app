<?php

namespace Database\Factories;

use App\Models\AdPlan;
use App\Models\MasterEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdPlan>
 */
class AdPlanFactory extends Factory
{
    protected $model = AdPlan::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => $this->faker->uuid(), // Sesuai skema
            'user_id' => User::inRandomOrder()->first()->id,
            'event_id' => MasterEvent::inRandomOrder()->first()->id,
            'status' => $this->faker->randomElement(['draft', 'completed']),
            'created_at' => $this->faker->dateTimeBetween('-9 months', 'now'),
            'updated_at' => $this->faker->dateTimeBetween('-9 months', 'now'),
        ];
    }
}
