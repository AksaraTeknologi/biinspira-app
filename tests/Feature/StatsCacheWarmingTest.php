<?php

use App\Services\OmsetComparisonService;
use App\Services\TvPlatformStatsService;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Cache::flush();

    config()->set('services.platforms', [
        'biinspira' => [
            'base_url' => 'https://biinspira.test/api',
            'token' => 'token-biinspira',
        ],
        'kompeten' => [
            'base_url' => 'https://kompeten.test/api',
            'token' => 'token-kompeten',
        ],
    ]);
});

function resetHttpFake(array|Closure|null $callback = null): void
{
    Http::swap(new \Illuminate\Http\Client\Factory());
    Http::fake($callback);
}

function fakeHealthyPlatformApis(): void
{
    $nowIso = now()->toIso8601String();
    $monthKey = strtolower(now()->format('F'));

    resetHttpFake([
        'https://biinspira.test/api/purchases/statistics*' => Http::response([
            'data' => [
                'total_nominal_this_year' => 50000000,
                'this_month_revenue' => 12000000,
                'total_nominal_last_month' => 10000000,
                'total_nominal_today' => 1500000,
                'total_nominal_yesterday' => 1000000,
                'yearly_nominal' => [
                    '2026' => [
                        'total' => 50000000,
                        'monthly' => [$monthKey => 12000000],
                    ],
                ],
            ],
        ], 200),
        'https://kompeten.test/api/invoices/statistics*' => Http::response([
            'data' => [
                'total_nominal_this_year' => 30000000,
                'this_month_revenue' => 8000000,
                'total_nominal_last_month' => 6000000,
                'total_nominal_today' => 900000,
                'total_nominal_yesterday' => 500000,
                'yearly_nominal' => [
                    '2026' => [
                        'total' => 30000000,
                        'monthly' => [$monthKey => 8000000],
                    ],
                ],
            ],
        ], 200),
        'https://biinspira.test/api/purchases*' => Http::response([
            'data' => [
                'items' => [
                    ['id' => 1, 'paid_at' => $nowIso, 'nett_amount' => 1500000],
                ],
                'pagination' => ['current_page' => 1, 'last_page' => 1],
            ],
        ], 200),
        'https://kompeten.test/api/invoices*' => Http::response([
            'data' => [
                'items' => [
                    ['id' => 2, 'paid_at' => $nowIso, 'nett_amount' => 900000],
                ],
                'pagination' => ['current_page' => 1, 'last_page' => 1],
            ],
        ], 200),
    ]);
}

test('stats:warm command caches tv stats, omset comparison, and detail endpoints so controllers make zero api calls', function () {
    fakeHealthyPlatformApis();

    $this->artisan('stats:warm')->assertSuccessful();

    expect(Cache::has(TvPlatformStatsService::PLATFORM_STATS_CACHE_KEY))->toBeTrue();
    expect(Cache::has(OmsetComparisonService::CACHE_KEY_FULL))->toBeTrue();

    // Replace HTTP fake with an empty fake and assert controllers never hit external APIs
    resetHttpFake();

    $session = ['stats_authenticated' => true];

    $this->withSession($session)
        ->get('/stats')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('tv/dashboard')
            ->reloadOnly('platformStats', fn (Assert $reload) => $reload
                ->has('platformStats', 2)
                ->where('platformStats.0.key', 'biinspira')
                ->where('platformStats.0.total', 50000000)
                ->where('platformStats.1.key', 'kompeten')
                ->where('platformStats.1.total', 30000000)
            )
        );

    $this->withSession($session)
        ->getJson('/stats/detail?platform=kompeten&metric=month')
        ->assertOk()
        ->assertJsonPath('platform', 'kompeten')
        ->assertJsonPath('total', 900000);

    $this->withSession($session)
        ->getJson('/stats/detail?platform=kompeten&metric=day')
        ->assertOk()
        ->assertJsonPath('platform', 'kompeten')
        ->assertJsonPath('total', 900000);

    $this->withSession($session)
        ->getJson('/stats/detail?platform=group&metric=month')
        ->assertOk()
        ->assertJsonPath('platform', 'group')
        ->assertJsonPath('total', 2400000);

    $this->withSession($session)
        ->getJson('/stats-omset/data')
        ->assertOk()
        ->assertJsonPath('summary.total_2026', 20000000);

    Http::assertNothingSent();
});

test('stats-omset refresh endpoint forces fresh fetch while data endpoint uses cache', function () {
    fakeHealthyPlatformApis();

    $this->artisan('stats:warm --only=omset')->assertSuccessful();

    $session = ['stats_authenticated' => true];

    resetHttpFake([
        'https://biinspira.test/api/purchases/statistics*' => Http::response([
            'data' => [
                'yearly_nominal' => [
                    '2026' => [
                        'total' => 75000000,
                        'monthly' => [strtolower(now()->format('F')) => 25000000],
                    ],
                ],
            ],
        ], 200),
        'https://kompeten.test/api/invoices/statistics*' => Http::response([
            'data' => [
                'yearly_nominal' => [
                    '2026' => [
                        'total' => 30000000,
                        'monthly' => [strtolower(now()->format('F')) => 10000000],
                    ],
                ],
            ],
        ], 200),
    ]);

    // Cached data should still return previous 20,000,000 without calling API
    $this->withSession($session)
        ->getJson('/stats-omset/data')
        ->assertOk()
        ->assertJsonPath('summary.total_2026', 20000000);

    Http::assertNothingSent();

    // Explicit refresh should fetch updated API data (25M + 10M = 35M)
    $this->withSession($session)
        ->postJson('/stats-omset/refresh')
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.summary.total_2026', 35000000);
});

test('controllers fall back to live fetch when cache is completely empty', function () {
    fakeHealthyPlatformApis();

    $session = ['stats_authenticated' => true];

    $this->withSession($session)
        ->get('/stats')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->reloadOnly('platformStats', fn (Assert $reload) => $reload
                ->has('platformStats', 2)
                ->where('platformStats.0.total', 50000000)
            )
        );

    expect(Cache::has(TvPlatformStatsService::PLATFORM_STATS_CACHE_KEY))->toBeTrue();
});

test('warming preserves existing cached data when external apis fail', function () {
    fakeHealthyPlatformApis();
    $this->artisan('stats:warm --skip-details')->assertSuccessful();

    // Simulate total API outage
    resetHttpFake([
        '*' => Http::response(['message' => 'Service Unavailable'], 503),
    ]);

    $this->artisan('stats:warm --skip-details')->assertSuccessful();

    Http::assertSentCount(4);

    $tvStats = app(TvPlatformStatsService::class)->getPlatformStats();
    expect($tvStats)->toHaveCount(2);
    expect($tvStats[0]['total'])->toBe(50000000.0);

    $omsetData = app(OmsetComparisonService::class)->getComparisonData();
    expect((float) $omsetData['summary']['total_2026'])->toBe(20000000.0);
});

test('stats:warm rejects invalid --only option', function () {
    $this->artisan('stats:warm --only=invalid')
        ->assertExitCode(2);
});

test('stats:warm is scheduled every five minutes', function () {
    $events = collect(app(Schedule::class)->events());

    $warmEvent = $events->first(fn ($event) => str_contains((string) $event->command, 'stats:warm'));

    expect($warmEvent)->not->toBeNull();
    expect($warmEvent->expression)->toBe('*/5 * * * *');
});
