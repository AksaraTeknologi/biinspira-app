<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TvDashboardController extends Controller
{
    private const PLATFORM_STATS_CACHE_KEY = 'tv_dashboard.platform_stats';
    private const BIINSPIRA_RATE_LIMIT_UNTIL_KEY = 'tv_dashboard.biinspira_rate_limit_until';

    private array $platformLabels = [
        'biinspira' => 'Biinspira',
        'smartcounting' => 'Smartcounting',
        'kompeten' => 'Kompeten',
        'sekolahpajak' => 'Sekolah Pajak',
        'talenta' => 'Talenta',
        'skillgrow' => 'Skillgrow',
        'aksademy' => 'Aksademy',
    ];

    private array $customAuthHeaderPlatforms = [
        'biinspira',
        'smartcounting',
    ];

    public function index(): Response
    {
        $platforms = config('services.platforms', []);

        return Inertia::render('tv/dashboard', [
            'platformStats' => Inertia::defer(fn() => $this->buildPlatformStats($platforms)),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    private function buildPlatformStats(array $platforms): array
    {
        $stats = [];
        $logoMap = $this->buildPlatformLogoMap();
        $cachedStats = Cache::get(self::PLATFORM_STATS_CACHE_KEY, []);

        $availablePlatformKeys = [];
        foreach ($this->platformLabels as $key => $label) {
            $platform = $platforms[$key] ?? null;
            if (! $this->hasPlatformCredentials($platform)) {
                continue;
            }
            $availablePlatformKeys[] = $key;
        }

        $cachedStats = $this->refreshPlatformStats($platforms, $availablePlatformKeys, $cachedStats, $logoMap);

        foreach ($availablePlatformKeys as $key) {
            $label = $this->platformLabels[$key] ?? $key;
            $cached = $cachedStats[$key] ?? null;

            if (is_array($cached)) {
                $cached['label'] = $label;
                $cached['logo'] = $logoMap[$key] ?? ($cached['logo'] ?? null);
                $stats[] = $cached;
                continue;
            }

            $stats[] = $this->emptyPlatformStat($key, $label, $logoMap[$key] ?? null);
        }

        return $stats;
    }

    private function refreshPlatformStats(array $platforms, array $platformKeys, array $cachedStats, array $logoMap): array
    {
        if (empty($platformKeys)) {
            return $cachedStats;
        }

        foreach ($platformKeys as $platformKey) {
            $platform = $platforms[$platformKey] ?? null;
            if (! is_array($platform)) {
                continue;
            }

            if ($platformKey === 'biinspira') {
                $rateLimitUntil = Cache::get(self::BIINSPIRA_RATE_LIMIT_UNTIL_KEY);
                if (is_string($rateLimitUntil) && now()->lt(Carbon::parse($rateLimitUntil))) {
                    Log::warning('TV dashboard Biinspira skipped due to rate-limit cooldown', [
                        'cooldown_until' => $rateLimitUntil,
                    ]);
                    continue;
                }
            }

            $result = $this->fetchStatisticsForPlatform(
                $platformKey,
                (string) ($platform['base_url'] ?? ''),
                (string) ($platform['token'] ?? '')
            );

            if ($result['rate_limited'] && $platformKey === 'biinspira') {
                Cache::put(self::BIINSPIRA_RATE_LIMIT_UNTIL_KEY, now()->addMinutes(5)->toIso8601String(), now()->addMinutes(10));
            }

            if ($result['failed']) {
                continue;
            }

            $stat = $this->buildPlatformStatFromStatistics(
                $platformKey,
                $this->platformLabels[$platformKey] ?? $platformKey,
                $result['statistics'],
                $logoMap[$platformKey] ?? null
            );

            $cachedStats[$platformKey] = $stat;
        }

        Cache::put(self::PLATFORM_STATS_CACHE_KEY, $cachedStats, now()->addHours(12));

        return $cachedStats;
    }

    private function buildPlatformStatFromStatistics(string $key, string $label, array $statistics, ?string $logo): array
    {
        $totalRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'total_revenue',
            'revenue_total',
            'total_nominal',
            'gross_revenue',
        ]));

        $thisMonthRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'this_month_revenue',
            'total_nominal_this_month',
            'monthly_revenue',
            'revenue_this_month',
        ]));

        $lastMonthRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'total_nominal_last_month',
            'last_month_revenue',
            'total_nominal_previous_month',
            'previous_month_revenue',
            'revenue_last_month',
        ]));

        $todayRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'total_nominal_today',
            'today_revenue',
            'revenue_today',
            'total_today',
            'nominal_today',
        ]));

        $yesterdayRevenue = $this->resolveStatisticNumber($this->pickStatisticValue($statistics, [
            'total_nominal_yesterday',
            'yesterday_revenue',
            'revenue_yesterday',
            'total_yesterday',
            'nominal_yesterday',
        ]));

        $monthChange = $this->buildChange($thisMonthRevenue, $lastMonthRevenue);
        $dayChange = $this->buildChange($todayRevenue, $yesterdayRevenue);

        return [
            'key' => $key,
            'label' => $label,
            'logo' => $logo,
            'total' => $totalRevenue,
            'this_month' => $thisMonthRevenue,
            'today' => $todayRevenue,
            'month_change_percentage' => $monthChange['percentage'],
            'month_change_direction' => $monthChange['direction'],
            'day_change_percentage' => $dayChange['percentage'],
            'day_change_direction' => $dayChange['direction'],
        ];
    }

    private function fetchStatisticsForPlatform(string $platformKey, string $baseUrl, string $token): array
    {
        $hasRequestFailure = false;
        $rateLimited = false;

        try {
            $endpoint = $this->resolveInvoicesEndpoint($platformKey);
            $response = $this->buildPlatformRequest($platformKey, $token)
                ->get("{$baseUrl}/{$endpoint}/statistics", [
                    'status' => 'paid',
                ]);

            if (! $response->successful()) {
                $hasRequestFailure = true;
                if ($response->status() === 429) {
                    $rateLimited = true;
                }

                Log::warning('TV dashboard failed to fetch statistics', [
                    'platform' => $platformKey,
                    'url' => "{$baseUrl}/{$endpoint}/statistics",
                    'status' => $response->status(),
                    'response_body' => substr($response->body(), 0, 300),
                ]);

                return [
                    'statistics' => [],
                    'failed' => $hasRequestFailure,
                    'rate_limited' => $rateLimited,
                ];
            }

            $statistics = $response->json('data', []);
            if (! is_array($statistics)) {
                $hasRequestFailure = true;
                Log::warning('TV dashboard statistics payload invalid', [
                    'platform' => $platformKey,
                    'url' => "{$baseUrl}/{$endpoint}/statistics",
                    'payload_preview' => substr($response->body(), 0, 300),
                ]);

                return [
                    'statistics' => [],
                    'failed' => $hasRequestFailure,
                    'rate_limited' => $rateLimited,
                ];
            }

            if ($platformKey === 'biinspira') {
                Log::info('TV dashboard Biinspira statistics payload sample', [
                    'keys' => array_keys($statistics),
                    'total_revenue' => $statistics['total_revenue'] ?? null,
                    'this_month_revenue' => $statistics['this_month_revenue'] ?? null,
                    'today' => $statistics['total_nominal_today'] ?? null,
                    'yesterday' => $statistics['total_nominal_yesterday'] ?? null,
                    'last_month' => $statistics['total_nominal_last_month'] ?? null,
                ]);
            }
        } catch (\Throwable $e) {
            $hasRequestFailure = true;
            Log::warning('TV dashboard statistics fetch exception', [
                'platform' => $platformKey,
                'message' => $e->getMessage(),
            ]);

            return [
                'statistics' => [],
                'failed' => $hasRequestFailure,
                'rate_limited' => $rateLimited,
            ];
        }

        return [
            'statistics' => $statistics,
            'failed' => $hasRequestFailure,
            'rate_limited' => $rateLimited,
        ];
    }

    private function emptyPlatformStat(string $key, string $label, ?string $logo): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'logo' => $logo,
            'total' => 0.0,
            'this_month' => 0.0,
            'today' => 0.0,
            'month_change_percentage' => 0.0,
            'month_change_direction' => 'flat',
            'day_change_percentage' => 0.0,
            'day_change_direction' => 'flat',
        ];
    }

    private function buildChange(float $current, float $previous): array
    {
        if ($previous <= 0.0) {
            if ($current <= 0.0) {
                return ['percentage' => 0.0, 'direction' => 'flat'];
            }

            return ['percentage' => 100.0, 'direction' => 'up'];
        }

        $delta = (($current - $previous) / $previous) * 100;
        $direction = $delta > 0 ? 'up' : ($delta < 0 ? 'down' : 'flat');

        return [
            'percentage' => round(abs($delta), 2),
            'direction' => $direction,
        ];
    }

    private function buildPlatformRequest(string $platformKey, string $token)
    {
        if (in_array($platformKey, $this->customAuthHeaderPlatforms, true)) {
            return Http::timeout(12)->withHeaders([
                'api-auth-key' => $token,
            ]);
        }

        return Http::timeout(12)->withToken($token);
    }

    private function resolveInvoicesEndpoint(string $platformKey): string
    {
        return $platformKey === 'smartcounting' || $platformKey === 'biinspira' ? 'purchases' : 'invoices';
    }

    private function hasPlatformCredentials(mixed $platform): bool
    {
        return is_array($platform) && ! empty($platform['base_url']) && ! empty($platform['token']);
    }

    private function buildPlatformLogoMap(): array
    {
        $logos = [];
        $users = User::query()
            ->select(['name', 'email', 'avatar'])
            ->whereNotNull('avatar')
            ->get();

        foreach ($this->platformLabels as $platformKey => $_label) {
            $matchedUser = $users->first(function (User $user) use ($platformKey): bool {
                $nameKey = $this->normalizePlatformKey((string) $user->name);
                $emailKey = $this->normalizePlatformKey(Str::before((string) $user->email, '@'));

                return $nameKey === $platformKey || $emailKey === $platformKey;
            });

            if (! $matchedUser || ! $matchedUser->avatar) {
                continue;
            }

            $logos[$platformKey] = Str::startsWith($matchedUser->avatar, ['http://', 'https://'])
                ? $matchedUser->avatar
                : url('/storage/' . ltrim($matchedUser->avatar, '/'));
        }

        return $logos;
    }

    private function normalizePlatformKey(string $value): string
    {
        return Str::of($value)
            ->lower()
            ->replaceMatches('/[^a-z0-9]/', '')
            ->toString();
    }

    private function resolveStatisticNumber(mixed $value): float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '') {
                return 0.0;
            }

            if (is_numeric($trimmed)) {
                return (float) $trimmed;
            }

            $normalized = preg_replace('/[^0-9,.-]/', '', $trimmed);
            if ($normalized === null || $normalized === '') {
                return 0.0;
            }

            $lastComma = strrpos($normalized, ',');
            $lastDot = strrpos($normalized, '.');

            if ($lastComma !== false && $lastDot !== false) {
                if ($lastComma > $lastDot) {
                    $normalized = str_replace('.', '', $normalized);
                    $normalized = str_replace(',', '.', $normalized);
                } else {
                    $normalized = str_replace(',', '', $normalized);
                }
            } elseif ($lastComma !== false) {
                $normalized = str_replace(',', '.', $normalized);
            }

            return is_numeric($normalized) ? (float) $normalized : 0.0;
        }

        return 0.0;
    }

    private function pickStatisticValue(array $statistics, array $keys): mixed
    {
        foreach ($keys as $key) {
            if (array_key_exists($key, $statistics)) {
                return $statistics[$key];
            }
        }

        return 0.0;
    }
}
