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
        // Metric values
        $dataD = $this->faker->numberBetween(100, 500);
        $dataDO = $this->faker->optional()->numberBetween(100, 500);

        return [
            'id' => $this->faker->uuid(),
            'ad_result_platform_id' => AdResultPlatform::inRandomOrder()->first()->id,
            'reach' => $dataD,
            'impressions' => $dataD,
            'cost_per_result' => $dataD,
            'clicks' => $dataDO,
            'likes' => $dataDO,
            'saves' => $dataDO,
            'shares' => $dataDO,
            'profile_visits' => $dataDO,
            'folows' => $dataDO,
            'direct_messages' => $dataDO,
            'external_link_clicks' => $dataDO,
            'result_ads' => $dataDO,
            'created_at' => $this->faker->dateTimeBetween('-9 months', 'now'),
            'updated_at' => $this->faker->dateTimeBetween('-9 months', 'now'),
        ];
    }
}
