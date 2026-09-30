<?php

use App\Models\AdMetric;
use App\Models\AdPlan;
use App\Models\AdPlanPlatform;
use App\Models\AdResult;
use App\Models\AdResultPlatform;
use App\Models\MasterAdGoal;
use App\Models\MasterEvent;
use App\Models\MasterPlatform;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'admin']);
    Role::firstOrCreate(['name' => 'user']);

    $this->admin = User::firstOrCreate(
        ['email' => 'admin_test@example.com'],
        [
            'name' => 'Admin Tester',
            'password' => Hash::make('password123'),
        ]
    );
    if (!$this->admin->hasRole('admin')) {
        $this->admin->assignRole('admin');
    }

    $this->platform = MasterPlatform::firstOrCreate(
        ['name' => 'Meta Ads']
    );

    $this->goal = MasterAdGoal::firstOrCreate(
        ['name' => 'Klik WhatsApp']
    );

    $this->event = MasterEvent::firstOrCreate(
        ['name' => 'Brevet Pajak A & B'],
        [
            'user_id' => $this->admin->id,
            'batch' => 1,
            'end_date' => '2026-12-31',
        ]
    );
});

test('ad plan can be created with batch, cost_month, and revenue_month', function () {
    $response = $this->actingAs($this->admin)->post(route('admin.marketing.store'), [
        'mode' => 'draft',
        'ad_schedule_time' => '10:00:00',
        'batch' => 'Batch 5',
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
        'platforms' => [
            [
                'platform_id' => $this->platform->id,
                'event_id' => $this->event->id,
                'goals_id' => $this->goal->id,
                'user_id' => $this->admin->id,
                'start_date' => '2026-09-28',
                'end_date' => '2026-10-04',
                'daily_budget' => 50000,
                'audience_target' => 1000,
                'audience_type' => 'targeted',
            ],
        ],
    ]);

    $response->assertRedirect(route('admin.marketing.index'));

    $this->assertDatabaseHas('ad_plans', [
        'event_id' => $this->event->id,
        'batch' => 'Batch 5',
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
    ]);
});

test('ad plan can be updated with batch, cost_month, and revenue_month', function () {
    $plan = AdPlan::create([
        'event_id' => $this->event->id,
        'user_id' => $this->admin->id,
        'batch' => 'Old Batch',
        'cost_month' => '2026-08',
        'revenue_month' => '2026-08',
        'ad_schedule_time' => '09:00:00',
        'status' => 'draft',
    ]);

    $platformRecord = AdPlanPlatform::create([
        'ad_plan_id' => $plan->id,
        'platform_id' => $this->platform->id,
        'goals_id' => $this->goal->id,
        'start_date' => '2026-09-28',
        'end_date' => '2026-10-04',
        'daily_budget' => 50000,
        'audience_target' => 500,
        'audience_type' => 'broad',
    ]);

    $response = $this->actingAs($this->admin)->post(
        route('admin.marketing.update.mode', ['id' => $plan->id, 'mode' => 'draft']),
        [
            'ad_plan_id' => $plan->id,
            'event_id' => $this->event->id,
            'user_id' => $this->admin->id,
            'batch' => 'Updated Batch 10',
            'cost_month' => '2026-09',
            'revenue_month' => '2026-09',
            'ad_schedule_time' => '11:00:00',
            'platforms' => [
                [
                    'id' => $platformRecord->id,
                    'platform_id' => $this->platform->id,
                    'goals_id' => $this->goal->id,
                    'start_date' => '2026-09-28',
                    'end_date' => '2026-10-04',
                    'daily_budget' => 60000,
                    'audience_target' => 600,
                    'audience_type' => 'broad',
                ],
            ],
        ]
    );

    $response->assertRedirect();

    $this->assertDatabaseHas('ad_plans', [
        'id' => $plan->id,
        'batch' => 'Updated Batch 10',
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
    ]);
});

test('ad result saves brevet weekend and weekday breakdown along with reporting months', function () {
    $plan = AdPlan::create([
        'event_id' => $this->event->id,
        'user_id' => $this->admin->id,
        'batch' => 'Batch Brevet',
        'ad_schedule_time' => '09:00:00',
        'status' => 'draft',
    ]);

    $response = $this->actingAs($this->admin)->post(route('admin.marketing.result.store'), [
        'ad_plan_id' => $plan->id,
        'checkout_count' => 30,
        'checkout_weekend' => 18,
        'checkout_weekday' => 12,
        'revenue' => 25000000,
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
        'platforms' => [
            [
                'platform_id' => $this->platform->id,
                'total_cost' => 850000,
                'reach' => 10000,
                'impressions' => 20000,
                'cost_per_result' => 28000,
            ],
        ],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('ad_results', [
        'ad_plan_id' => $plan->id,
        'checkout_count' => 30,
        'checkout_weekend' => 18,
        'checkout_weekday' => 12,
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
    ]);

    // Also verify cost_month and revenue_month sync to ad_plans
    $this->assertDatabaseHas('ad_plans', [
        'id' => $plan->id,
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
    ]);
});

test('marketing show returns brevet weekend/weekday and reporting months', function () {
    $plan = AdPlan::create([
        'event_id' => $this->event->id,
        'user_id' => $this->admin->id,
        'batch' => 'Batch 7',
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
        'ad_schedule_time' => '09:00:00',
        'status' => 'draft',
    ]);

    $result = AdResult::create([
        'ad_plan_id' => $plan->id,
        'checkout_count' => 25,
        'checkout_weekend' => 15,
        'checkout_weekday' => 10,
        'revenue' => 20000000,
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
    ]);

    $response = $this->actingAs($this->admin)->get(route('admin.marketing.show', $plan->id));
    $response->assertOk();

    $pageData = $response->viewData('page');
    $props = $pageData['props']['data'] ?? [];

    expect($props['batch'])->toBe('Batch 7');
    expect($props['cost_month'])->toBe('2026-09');
    expect($props['revenue_month'])->toBe('2026-09');

    $resultFirst = $props['result'][0] ?? [];
    expect($resultFirst['checkout_weekend'])->toBe('15');
    expect($resultFirst['checkout_weekday'])->toBe('10');
});

test('marketing index includes batch in ad plan listing', function () {
    $plan = AdPlan::create([
        'event_id' => $this->event->id,
        'user_id' => $this->admin->id,
        'batch' => 'Batch 99',
        'ad_schedule_time' => '09:00:00',
        'status' => 'draft',
    ]);

    $response = $this->actingAs($this->admin)->get(route('admin.marketing.index'));
    $response->assertOk();

    $pageData = $response->viewData('page');
    $plans = collect($pageData['props']['adPlans'] ?? []);

    $found = $plans->firstWhere('id', $plan->id);
    expect($found)->not->toBeNull();
    expect($found['batch'])->toBe('Batch 99');
});

test('dashboard monthly graphic allocates cross-month ad spend and revenue into chosen reporting month', function () {
    // Campaign ends in October, but reporting month is allocated to September 2026
    $plan = AdPlan::create([
        'event_id' => $this->event->id,
        'user_id' => $this->admin->id,
        'batch' => 'Cross-Month Campaign',
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
        'ad_schedule_time' => '09:00:00',
        'status' => 'completed',
    ]);

    AdPlanPlatform::create([
        'ad_plan_id' => $plan->id,
        'platform_id' => $this->platform->id,
        'goals_id' => $this->goal->id,
        'start_date' => '2026-09-28',
        'end_date' => '2026-10-04',
        'daily_budget' => 50000,
        'audience_target' => 500,
        'audience_type' => 'broad',
    ]);

    $result = AdResult::create([
        'ad_plan_id' => $plan->id,
        'checkout_count' => 15,
        'revenue' => 15000000,
        'cost_month' => '2026-09',
        'revenue_month' => '2026-09',
    ]);

    $resultPlatform = AdResultPlatform::create([
        'ad_result_id' => $result->id,
        'platform_id' => $this->platform->id,
        'total_cost' => 1200000,
    ]);

    AdMetric::create([
        'ad_result_platform_id' => $resultPlatform->id,
        'reach' => 8000,
        'impressions' => 12000,
        'cost_per_result' => 80000,
    ]);

    $response = $this->actingAs($this->admin)->get(route('admin.marketing.dashboard'));
    $response->assertOk();

    $pageData = $response->viewData('page');
    $bulanan = collect($pageData['props']['rawDataGraphic']['bulanan'] ?? []);

    // Look for the September 2026 bucket
    $sepBucket = $bulanan->firstWhere('month_key', '2026-09');
    expect($sepBucket)->not->toBeNull();
    expect($sepBucket['pengeluaran'])->toBeGreaterThanOrEqual(1200000);
    expect($sepBucket['pendapatan'])->toBeGreaterThanOrEqual(15000000);
});

test('ad plan can be created and updated with dual reporting cost months', function () {
    $response = $this->actingAs($this->admin)->post(route('admin.marketing.store'), [
        'mode' => 'draft',
        'ad_schedule_time' => '10:00:00',
        'batch' => 'Dual Month Plan',
        'cost_month' => '2026-08',
        'cost_month_2' => '2026-09',
        'revenue_month' => '2026-09',
        'platforms' => [
            [
                'platform_id' => $this->platform->id,
                'event_id' => $this->event->id,
                'goals_id' => $this->goal->id,
                'user_id' => $this->admin->id,
                'start_date' => '2026-08-25',
                'end_date' => '2026-09-05',
                'daily_budget' => 50000,
                'audience_target' => 1000,
                'audience_type' => 'targeted',
            ],
        ],
    ]);

    $response->assertRedirect(route('admin.marketing.index'));

    $this->assertDatabaseHas('ad_plans', [
        'batch' => 'Dual Month Plan',
        'cost_month' => '2026-08',
        'cost_month_2' => '2026-09',
        'revenue_month' => '2026-09',
    ]);
});

test('ad result can be saved per setting with individual metrics and dual month spend amounts', function () {
    $plan = AdPlan::create([
        'event_id' => $this->event->id,
        'user_id' => $this->admin->id,
        'batch' => 'Multi Setting Plan',
        'cost_month' => '2026-08',
        'cost_month_2' => '2026-09',
        'revenue_month' => '2026-09',
        'ad_schedule_time' => '10:00:00',
        'status' => 'draft',
    ]);

    $setting1 = AdPlanPlatform::create([
        'ad_plan_id' => $plan->id,
        'platform_id' => $this->platform->id,
        'goals_id' => $this->goal->id,
        'start_date' => '2026-08-25',
        'end_date' => '2026-09-05',
        'daily_budget' => 50000,
        'audience_target' => 1000,
        'audience_type' => 'targeted',
    ]);

    $setting2 = AdPlanPlatform::create([
        'ad_plan_id' => $plan->id,
        'platform_id' => $this->platform->id,
        'goals_id' => $this->goal->id,
        'start_date' => '2026-08-28',
        'end_date' => '2026-09-05',
        'daily_budget' => 40000,
        'audience_target' => 800,
        'audience_type' => 'broad',
    ]);

    $response = $this->actingAs($this->admin)->post(route('admin.marketing.result.store'), [
        'ad_plan_id' => $plan->id,
        'checkout_count' => 20,
        'revenue' => 18000000,
        'cost_month' => '2026-08',
        'cost_month_2' => '2026-09',
        'revenue_month' => '2026-09',
        'platforms' => [
            [
                'platform_id' => $this->platform->id,
                'ad_plan_platform_id' => $setting1->id,
                'total_cost' => 500000,
                'cost_month_1_amount' => 200000,
                'cost_month_2_amount' => 300000,
                'reach' => 6000,
                'impressions' => 11000,
                'cost_per_result' => 25000,
            ],
            [
                'platform_id' => $this->platform->id,
                'ad_plan_platform_id' => $setting2->id,
                'total_cost' => 350000,
                'cost_month_1_amount' => 150000,
                'cost_month_2_amount' => 200000,
                'reach' => 4500,
                'impressions' => 8500,
                'cost_per_result' => 30000,
            ],
        ],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('ad_results', [
        'ad_plan_id' => $plan->id,
        'cost_month' => '2026-08',
        'cost_month_2' => '2026-09',
    ]);

    $this->assertDatabaseHas('ad_result_platforms', [
        'ad_plan_platform_id' => $setting1->id,
        'total_cost' => 500000,
        'cost_month_1_amount' => 200000,
        'cost_month_2_amount' => 300000,
    ]);

    $this->assertDatabaseHas('ad_result_platforms', [
        'ad_plan_platform_id' => $setting2->id,
        'total_cost' => 350000,
        'cost_month_1_amount' => 150000,
        'cost_month_2_amount' => 200000,
    ]);
});

test('dashboard monthly graphic splits dual-month spend across cost_month and cost_month_2', function () {
    $plan = AdPlan::create([
        'event_id' => $this->event->id,
        'user_id' => $this->admin->id,
        'batch' => 'Split Month Campaign',
        'cost_month' => '2026-08',
        'cost_month_2' => '2026-09',
        'revenue_month' => '2026-09',
        'ad_schedule_time' => '09:00:00',
        'status' => 'completed',
    ]);

    $setting1 = AdPlanPlatform::create([
        'ad_plan_id' => $plan->id,
        'platform_id' => $this->platform->id,
        'goals_id' => $this->goal->id,
        'start_date' => '2026-08-25',
        'end_date' => '2026-09-05',
        'daily_budget' => 50000,
        'audience_target' => 500,
        'audience_type' => 'broad',
    ]);

    $result = AdResult::create([
        'ad_plan_id' => $plan->id,
        'checkout_count' => 10,
        'revenue' => 10000000,
        'cost_month' => '2026-08',
        'cost_month_2' => '2026-09',
        'revenue_month' => '2026-09',
    ]);

    $resultPlatform = AdResultPlatform::create([
        'ad_result_id' => $result->id,
        'platform_id' => $this->platform->id,
        'ad_plan_platform_id' => $setting1->id,
        'total_cost' => 700000,
        'cost_month_1_amount' => 300000,
        'cost_month_2_amount' => 400000,
    ]);

    AdMetric::create([
        'ad_result_platform_id' => $resultPlatform->id,
        'reach' => 5000,
        'impressions' => 10000,
        'cost_per_result' => 70000,
    ]);

    $response = $this->actingAs($this->admin)->get(route('admin.marketing.dashboard'));
    $response->assertOk();

    $pageData = $response->viewData('page');
    $bulanan = collect($pageData['props']['rawDataGraphic']['bulanan'] ?? []);

    $augBucket = $bulanan->firstWhere('month_key', '2026-08');
    $sepBucket = $bulanan->firstWhere('month_key', '2026-09');

    expect($augBucket)->not->toBeNull();
    expect($augBucket['pengeluaran'])->toBeGreaterThanOrEqual(300000);

    expect($sepBucket)->not->toBeNull();
    expect($sepBucket['pengeluaran'])->toBeGreaterThanOrEqual(400000);
    expect($sepBucket['pendapatan'])->toBeGreaterThanOrEqual(10000000);
});

