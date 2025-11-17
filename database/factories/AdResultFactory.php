<?php

namespace Database\Factories;

use App\Models\AdPlan;
use App\Models\AdResult;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdResult>
 */
class AdResultFactory extends Factory
{
    protected $model = AdResult::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => $this->faker->uuid(),
            'ad_plan_id' => AdPlan::inRandomOrder()->first()->id,
            'checkout_count' => $this->faker->numberBetween(10, 1000),
            'revenue' => $this->faker->randomFloat(2, 1000000, 500000000),
        ];
    }
}
