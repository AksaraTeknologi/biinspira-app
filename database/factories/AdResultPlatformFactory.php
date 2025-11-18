<?php

namespace Database\Factories;

use App\Models\AdResult;
use App\Models\AdResultPlatform;
use App\Models\MasterPlatform;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdResultPlatform>
 */
class AdResultPlatformFactory extends Factory
{
    protected $model = AdResultPlatform::class;
    /**    
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => $this->faker->uuid(),
            'ad_result_id' => AdResult::inRandomOrder()->first()->id,
            'platform_id' => MasterPlatform::inRandomOrder()->first()->id,
            'result' => $this->faker->optional()->numberBetween(100, 5000), // Sesuai goal
            'total_cost' => $this->faker->randomFloat(2, 500000, 10000000),
            'created_at' => $this->faker->dateTimeBetween('-9 months', 'now'),
            'updated_at' => $this->faker->dateTimeBetween('-9 months', 'now'),
        ];
    }
}
