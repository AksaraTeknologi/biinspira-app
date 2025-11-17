<?php

namespace Database\Factories;

use App\Models\AdPlan;
use App\Models\AdPlanPlatform;
use App\Models\MasterAdGoal;
use App\Models\MasterPlatform;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdPlanPlatform>
 */
class AdPlanPlatformFactory extends Factory
{
    protected $model = AdPlanPlatform::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('now', '+1 month');
        $endDate = $this->faker->dateTimeBetween($startDate, (clone $startDate)->modify('+45 days'));
        $audienceType = $this->faker->randomElement(['targeted', 'broad', 'combined']);

        return [
            'id' => $this->faker->uuid(),
            'ad_plan_id' => AdPlan::inRandomOrder()->first()->id,
            'platform_id' => MasterPlatform::inRandomOrder()->first()->id,
            'goals_id' => MasterAdGoal::inRandomOrder()->first()->id,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'audience_target' => $this->faker->numberBetween(10000, 5000000),
            'daily_budget' => $this->faker->randomFloat(2, 50000, 2000000),
            'audience_type' => $audienceType,
            'age_targeted' => $audienceType != 'broad' ? $this->faker->randomElement(['18-24', '25-34', '18-45']) : null,
            'age_broad' => $audienceType != 'targeted' ? $this->faker->randomElement(['18-65+', '21+']) : null,
            'location_targeted' => $audienceType != 'broad' ? $this->faker->city() . ', ' . $this->faker->city() : null,
            'location_broad' => $audienceType != 'targeted' ? $this->faker->country() : null,
            'type_audience_targeted' => $audienceType != 'broad' ? $this->faker->randomElement(['Interests', 'Lookalike', 'Custom Audience']) : null,
            'name_audience_targeted' => $audienceType != 'broad' ? $this->faker->words(3, true) : null,
        ];
    }
}
