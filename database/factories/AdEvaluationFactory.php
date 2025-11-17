<?php

namespace Database\Factories;

use App\Models\AdEvaluation;
use App\Models\AdPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdEvaluation>
 */
class AdEvaluationFactory extends Factory
{
    protected $model = AdEvaluation::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $prevCheckout = $this->faker->numberBetween(100, 1000);
        $currCheckout = $prevCheckout + $this->faker->numberBetween(50, 500);

        return [
            'id' => $this->faker->uuid(),
            'ad_plan_id' => AdPlan::inRandomOrder()->first()->id,
            'previous_event_name' => $this->faker->company() . ' ' . $this->faker->randomElement(['Fest', 'Expo', 'Sale']),
            'previous_checkout' => $prevCheckout,
            'current_checkout' => $currCheckout,
            'previous_ad_performance' => $this->faker->sentence(),
            'current_ad_performance' => $this->faker->sentence(),
            'previous_other_performance' => $this->faker->sentence(),
            'current_other_performance' => $this->faker->sentence(),
            'next_ad_strategy' => $this->faker->paragraph(),
        ];
    }
}
