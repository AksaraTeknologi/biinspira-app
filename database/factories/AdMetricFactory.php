<?php

namespace Database\Factories;

use App\Models\AdMetric;
use App\Models\AdResultPlatform;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\AdMetric>
 */
class AdMetricFactory extends Factory
{
    protected $model = AdMetric::class;
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $reach = $this->faker->numberBetween(10000, 500000);
        $impressions = $reach + $this->faker->numberBetween(5000, 100000);
        $costPerResult = $this->faker->numberBetween(1000, 50000);

        return [
            'id' => $this->faker->uuid(),
            'ad_result_platform_id' => AdResultPlatform::inRandomOrder()->first()->id,
            'reach' => $reach,
            'impressions' => $impressions,
            'cost_per_result' => $costPerResult,
            'clicks' => $this->faker->optional()->numberBetween(100, 10000),
            'likes' => $this->faker->optional()->numberBetween(50, 5000),
            'saves' => $this->faker->optional()->numberBetween(10, 1000),
            'shares' => $this->faker->optional()->numberBetween(5, 500),
            'profile_visits' => $this->faker->optional()->numberBetween(50, 2000),
            'folows' => $this->faker->optional()->numberBetween(10, 500), // Sesuai typo di skema
            'direct_messages' => $this->faker->optional()->numberBetween(5, 200),
            'external_link_clicks' => $this->faker->optional()->numberBetween(50, 5000),
            'result_ads' => $this->faker->optional()->numberBetween(10, 1000),
        ];
    }
}
