<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TvPlatformStatsService
{
    public const PLATFORM_STATS_CACHE_KEY = 'tv_dashboard.platform_stats.v5';
    public const PLATFORM_STATS_UPDATED_AT_KEY = 'tv_dashboard.platform_stats_updated_at.v5';
    public const BIINSPIRA_RATE_LIMIT_UNTIL_KEY = 'tv_dashboard.biinspira_rate_limit_until.v4';
    public const CACHE_TTL_HOURS = 12;

    private const MAX_DETAIL_PAGES = 100;

    public function __construct(
        private readonly PlatformClientService $client,
    ) {}

    public function getPlatformStats(?array $platformsConfig = null, bool $forceRefresh = false): array
    {
        $platforms = $platformsConfig ?? config('services.platforms', []);
        $availablePlatformKeys = $this->client->getAvailablePlatformKeys($platforms);
        $logoMap = $this->client->buildPlatformLogoMap();
        $cachedStats = Cache::get(self::PLATFORM_STATS_CACHE_KEY, []);

        if (! empty($availablePlatformKeys) && ($forceRefresh || ! is_array($cachedStats) || empty($cachedStats))) {
            $cachedStats = $this->warmPlatformStats($platforms, $logoMap);
        }

        return $this->formatCachedPlatformStats($availablePlatformKeys, is_array($cachedStats) ? $cachedStats : [], $logoMap);
    }

    /**
     * Force-refresh platform summary statistics and clear cached drilldown details for the active period.
     *
     * @return list<array<string, mixed>>
     */
    public function refreshPlatformStats(?array $platformsConfig = null): array
    {
        $platforms = $platformsConfig ?? config('services.platforms', []);
        $availablePlatformKeys = $this->client->getAvailablePlatformKeys($platforms);
        $logoMap = $this->client->buildPlatformLogoMap();
        $now = now();

        foreach (array_merge($availablePlatformKeys, ['group']) as $key) {
            Cache::forget($this->detailCacheKey($key, 'month', $now));
            Cache::forget($this->detailCacheKey($key, 'day', $now));
        }

        $cachedStats = $this->warmPlatformStats($platforms, $logoMap);

        return $this->formatCachedPlatformStats($availablePlatformKeys, $cachedStats, $logoMap);
    }

    public function getStatsGeneratedAt(): string
    {
        $updatedAt = Cache::get(self::PLATFORM_STATS_UPDATED_AT_KEY);

        return is_string($updatedAt) && $updatedAt !== ''
            ? $updatedAt
            : now()->toIso8601String();
    }

    /**
     * @param  list<string>  $availablePlatformKeys
     * @param  array<string, array<string, mixed>>  $cachedStats
     * @param  array<string, string>  $logoMap
     * @return list<array<string, mixed>>
     */
    private function formatCachedPlatformStats(array $availablePlatformKeys, array $cachedStats, array $logoMap): array
    {
        $stats = [];
        foreach ($availablePlatformKeys as $key) {
            $label = PlatformClientService::PLATFORM_LABELS[$key] ?? $key;
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

    /**
     * Fetch statistics for all configured platforms in parallel and persist to cache.
     *
     * @return array<string, array<string, mixed>>
     */
    public function warmPlatformStats(?array $platformsConfig = null, ?array $logoMap = null): array
    {
        $platforms = $platformsConfig ?? config('services.platforms', []);
        $availablePlatformKeys = $this->client->getAvailablePlatformKeys($platforms);
        $logoMap ??= $this->client->buildPlatformLogoMap();

        $cachedStats = Cache::get(self::PLATFORM_STATS_CACHE_KEY, []);
        if (! is_array($cachedStats)) {
            $cachedStats = [];
        }

        if (empty($availablePlatformKeys)) {
            return $cachedStats;
        }

        $keysToRequest = [];
        foreach ($availablePlatformKeys as $platformKey) {
            if ($platformKey === 'biinspira' && $this->isBiinspiraRateLimited()) {
                Log::warning('TV dashboard Biinspira skipped due to rate-limit cooldown');
                continue;
            }
            $keysToRequest[] = $platformKey;
        }

        if (in_array('smartcountingacademy', $keysToRequest, true)) {
            foreach (['smartcountingacademy_new', 'smartcounting'] as $extraKey) {
                if (isset($platforms[$extraKey]) && $this->client->hasPlatformCredentials($platforms[$extraKey])) {
                    $keysToRequest[] = $extraKey;
                }
            }
        }

        if (empty($keysToRequest)) {
            return $cachedStats;
        }

        $responses = Http::pool(function (Pool $pool) use ($keysToRequest, $platforms): array {
            $requests = [];

            foreach ($keysToRequest as $key) {
                $platform = $platforms[$key] ?? null;
                if (! $this->client->hasPlatformCredentials($platform)) {
                    continue;
                }

                $baseUrl = rtrim((string) $platform['base_url'], '/');
                $token = (string) $platform['token'];
                $endpoint = $this->client->resolveInvoicesEndpoint($key);

                $requests[] = $this->client
                    ->buildPoolRequest($pool, $key, $key, $token, 12)
                    ->get("{$baseUrl}/{$endpoint}/statistics", [
                        'status' => 'paid',
                    ]);
            }

            return $requests;
        });

        $parsedResults = [];
        foreach ($keysToRequest as $key) {
            $parsedResults[$key] = $this->parseStatisticsResponse($key, $responses[$key] ?? null);

            if ($key === 'biinspira' && $parsedResults[$key]['rate_limited']) {
                $this->markBiinspiraRateLimited();
            }
        }

        foreach ($availablePlatformKeys as $platformKey) {
            if (! isset($parsedResults[$platformKey])) {
                continue;
            }

            $result = $parsedResults[$platformKey];
            $hasData = ! $result['failed'];
            $metrics = $hasData
                ? $this->extractNormalizedMetrics($result['statistics'])
                : $this->emptyMetricValues();

            if ($platformKey === 'smartcountingacademy') {
                $breakdown = [
                    $platformKey => [
                        'failed' => $result['failed'],
                        'keys' => array_keys($result['statistics']),
                        'metrics' => $metrics,
                    ],
                ];

                foreach (['smartcountingacademy_new', 'smartcounting'] as $extraKey) {
                    $extraResult = $parsedResults[$extraKey] ?? null;
                    if ($extraResult && ! $extraResult['failed'] && ! empty($extraResult['statistics'])) {
                        $extraMetrics = $this->extractNormalizedMetrics($extraResult['statistics']);
                        foreach ($metrics as $metricKey => $metricValue) {
                            $metrics[$metricKey] = $metricValue + $extraMetrics[$metricKey];
                        }
                        $hasData = true;
                        $breakdown[$extraKey] = [
                            'failed' => false,
                            'keys' => array_keys($extraResult['statistics']),
                            'metrics' => $extraMetrics,
                        ];
                    } else {
                        $breakdown[$extraKey] = [
                            'configured' => isset($parsedResults[$extraKey]),
                            'failed' => $extraResult['failed'] ?? true,
                            'keys' => is_array($extraResult['statistics'] ?? null) ? array_keys($extraResult['statistics']) : [],
                        ];
                    }
                }

                Log::info('TV dashboard Smartcounting Academy breakdown', $breakdown);
            }

            if (! $hasData) {
                continue;
            }

            $cachedStats[$platformKey] = $this->buildPlatformStatFromMetrics(
                $platformKey,
                PlatformClientService::PLATFORM_LABELS[$platformKey] ?? $platformKey,
                $metrics,
                $logoMap[$platformKey] ?? null
            );
        }

        $ttl = now()->addHours(self::CACHE_TTL_HOURS);
        Cache::put(self::PLATFORM_STATS_CACHE_KEY, $cachedStats, $ttl);
        Cache::put(self::PLATFORM_STATS_UPDATED_AT_KEY, now()->toIso8601String(), $ttl);

        return $cachedStats;
    }

    public function getDetailPoints(string $platformKey, string $metric, ?array $platformsConfig = null, bool $forceRefresh = false): array
    {
        $now = now();
        $cacheKey = $this->detailCacheKey($platformKey, $metric, $now);

        if (! $forceRefresh) {
            $cached = Cache::get($cacheKey);
            if (is_array($cached) && ! empty($cached)) {
                return $cached;
            }
        }

        $platforms = $platformsConfig ?? config('services.platforms', []);
        $range = $metric === 'month'
            ? ['start' => $now->copy()->startOfYear(), 'end' => $now->copy()->endOfYear()]
            : ['start' => $now->copy()->startOfMonth(), 'end' => $now->copy()->endOfMonth()];

        $fetchResult = $this->fetchCombinedInvoicesForPlatform(
            $platformKey,
            $platforms,
            $range['start']->toDateString(),
            $range['end']->toDateString()
        );

        if ($fetchResult['failed']) {
            $existing = Cache::get($cacheKey);
            if (is_array($existing) && ! empty($existing)) {
                return $existing;
            }
        }

        $payload = $metric === 'month'
            ? $this->buildMonthDetailPayload($platformKey, $fetchResult['items'], $now)
            : $this->buildDayDetailPayload($platformKey, $fetchResult['items'], $now);

        if (! $fetchResult['failed']) {
            Cache::put($cacheKey, $payload, now()->addHours(self::CACHE_TTL_HOURS));
        }

        return $payload;
    }

    public function getGroupDetailPoints(string $metric, ?array $platformsConfig = null, bool $forceRefresh = false): array
    {
        $now = now();
        $cacheKey = $this->detailCacheKey('group', $metric, $now);

        if (! $forceRefresh) {
            $cached = Cache::get($cacheKey);
            if (is_array($cached) && ! empty($cached)) {
                return $cached;
            }
        }

        $platforms = $platformsConfig ?? config('services.platforms', []);
        $availablePlatformKeys = $this->client->getAvailablePlatformKeys($platforms);

        $platformDetails = [];
        foreach ($availablePlatformKeys as $key) {
            $platformDetails[$key] = $this->getDetailPoints($key, $metric, $platforms, $forceRefresh);
        }

        $payload = $this->buildGroupPayloadFromPlatformDetails($availablePlatformKeys, $platformDetails, $metric, $now);
        Cache::put($cacheKey, $payload, now()->addHours(self::CACHE_TTL_HOURS));

        return $payload;
    }

    /**
     * Warm both monthly and daily detail caches (including group aggregation)
     * using a single yearly invoice fetch per platform whenever possible.
     *
     * @return array{warmed: int, failed: int, skipped: int}
     */
    public function warmDetails(?array $platformsConfig = null): array
    {
        $platforms = $platformsConfig ?? config('services.platforms', []);
        $availablePlatformKeys = $this->client->getAvailablePlatformKeys($platforms);
        $now = now();

        $yearStart = $now->copy()->startOfYear()->toDateString();
        $yearEnd = $now->copy()->endOfYear()->toDateString();
        $monthStart = $now->copy()->startOfMonth()->toDateString();
        $monthEnd = $now->copy()->endOfMonth()->toDateString();

        $warmed = 0;
        $failed = 0;
        $skipped = 0;

        $monthDetailsByPlatform = [];
        $dayDetailsByPlatform = [];

        foreach ($availablePlatformKeys as $platformKey) {
            $monthCacheKey = $this->detailCacheKey($platformKey, 'month', $now);
            $dayCacheKey = $this->detailCacheKey($platformKey, 'day', $now);

            if ($platformKey === 'biinspira' && $this->isBiinspiraRateLimited()) {
                $skipped++;
                $monthDetailsByPlatform[$platformKey] = Cache::get($monthCacheKey) ?? $this->buildMonthDetailPayload($platformKey, [], $now);
                $dayDetailsByPlatform[$platformKey] = Cache::get($dayCacheKey) ?? $this->buildDayDetailPayload($platformKey, [], $now);
                continue;
            }

            $yearFetch = $this->fetchCombinedInvoicesForPlatform($platformKey, $platforms, $yearStart, $yearEnd);

            if ($yearFetch['failed']) {
                $failed++;
                $monthDetailsByPlatform[$platformKey] = Cache::get($monthCacheKey) ?? $this->buildMonthDetailPayload($platformKey, [], $now);
                $dayDetailsByPlatform[$platformKey] = Cache::get($dayCacheKey) ?? $this->buildDayDetailPayload($platformKey, [], $now);
                continue;
            }

            $monthPayload = $this->buildMonthDetailPayload($platformKey, $yearFetch['items'], $now);
            Cache::put($monthCacheKey, $monthPayload, now()->addHours(self::CACHE_TTL_HOURS));
            $monthDetailsByPlatform[$platformKey] = $monthPayload;

            if ($yearFetch['truncated']) {
                $dayFetch = $this->fetchCombinedInvoicesForPlatform($platformKey, $platforms, $monthStart, $monthEnd);
                $dayInvoices = $dayFetch['failed'] ? $yearFetch['items'] : $dayFetch['items'];
            } else {
                $dayInvoices = $yearFetch['items'];
            }

            $dayPayload = $this->buildDayDetailPayload($platformKey, $dayInvoices, $now);
            Cache::put($dayCacheKey, $dayPayload, now()->addHours(self::CACHE_TTL_HOURS));
            $dayDetailsByPlatform[$platformKey] = $dayPayload;

            $warmed++;
        }

        if (! empty($availablePlatformKeys)) {
            $groupMonthKey = $this->detailCacheKey('group', 'month', $now);
            if ($warmed > 0 || ! Cache::has($groupMonthKey)) {
                $groupMonthPayload = $this->buildGroupPayloadFromPlatformDetails($availablePlatformKeys, $monthDetailsByPlatform, 'month', $now);
                Cache::put($groupMonthKey, $groupMonthPayload, now()->addHours(self::CACHE_TTL_HOURS));
            }

            $groupDayKey = $this->detailCacheKey('group', 'day', $now);
            if ($warmed > 0 || ! Cache::has($groupDayKey)) {
                $groupDayPayload = $this->buildGroupPayloadFromPlatformDetails($availablePlatformKeys, $dayDetailsByPlatform, 'day', $now);
                Cache::put($groupDayKey, $groupDayPayload, now()->addHours(self::CACHE_TTL_HOURS));
            }
        }

        return [
            'warmed' => $warmed,
            'failed' => $failed,
            'skipped' => $skipped,
        ];
    }

    private function detailCacheKey(string $platformKey, string $metric, Carbon $now): string
    {
        $year = (int) $now->year;
        $month = (int) $now->month;

        return "tv_dashboard.detail.{$platformKey}.{$metric}.{$year}.{$month}";
    }

    private function isBiinspiraRateLimited(): bool
    {
        $rateLimitUntil = Cache::get(self::BIINSPIRA_RATE_LIMIT_UNTIL_KEY);

        return is_string($rateLimitUntil) && now()->lt(Carbon::parse($rateLimitUntil));
    }

    private function markBiinspiraRateLimited(): void
    {
        Cache::put(self::BIINSPIRA_RATE_LIMIT_UNTIL_KEY, now()->addMinutes(5)->toIso8601String(), now()->addMinutes(10));
    }

    /**
     * @return array{statistics: array<string, mixed>, failed: bool, rate_limited: bool}
     */
    private function parseStatisticsResponse(string $platformKey, mixed $response): array
    {
        if (! $response instanceof Response) {
            Log::warning('TV dashboard statistics request error', [
                'platform' => $platformKey,
                'message' => $response instanceof \Throwable ? $response->getMessage() : 'Unknown pool failure',
            ]);

            return [
                'statistics' => [],
                'failed' => true,
                'rate_limited' => false,
            ];
        }

        if (! $response->successful()) {
            $rateLimited = $response->status() === 429;
            $endpoint = $this->client->resolveInvoicesEndpoint($platformKey);

            Log::warning('TV dashboard failed to fetch statistics', [
                'platform' => $platformKey,
                'endpoint' => "{$endpoint}/statistics",
                'status' => $response->status(),
                'response_body' => substr($response->body(), 0, 300),
            ]);

            return [
                'statistics' => [],
                'failed' => true,
                'rate_limited' => $rateLimited,
            ];
        }

        $statistics = $response->json('data', []);
        if (! is_array($statistics)) {
            $endpoint = $this->client->resolveInvoicesEndpoint($platformKey);

            Log::warning('TV dashboard statistics payload invalid', [
                'platform' => $platformKey,
                'endpoint' => "{$endpoint}/statistics",
                'payload_preview' => substr($response->body(), 0, 300),
            ]);

            return [
                'statistics' => [],
                'failed' => true,
                'rate_limited' => false,
            ];
        }

        $currentYear = (int) now()->year;
        $yearlyCurrent = $statistics['yearly_nominal'][$currentYear]
            ?? $statistics['yearly_nominal'][(string) $currentYear]
            ?? null;

        if (is_array($yearlyCurrent)) {
            if (empty($statistics['monthly_nominal_this_year']) && isset($yearlyCurrent['monthly'])) {
                $statistics['monthly_nominal_this_year'] = $yearlyCurrent['monthly'];
            }
            if (! isset($statistics['total_nominal_this_year']) && isset($yearlyCurrent['total'])) {
                $statistics['total_nominal_this_year'] = $yearlyCurrent['total'];
            }
        }

        return [
            'statistics' => $statistics,
            'failed' => false,
            'rate_limited' => false,
        ];
    }

    /**
     * @return array{items: list<array<string, mixed>>, failed: bool, truncated: bool}
     */
    private function fetchCombinedInvoicesForPlatform(string $platformKey, array $platforms, string $startDate, string $endDate): array
    {
        $platform = $platforms[$platformKey] ?? null;
        if (! $this->client->hasPlatformCredentials($platform)) {
            return ['items' => [], 'failed' => true, 'truncated' => false];
        }

        if ($platformKey === 'biinspira' && $this->isBiinspiraRateLimited()) {
            return ['items' => [], 'failed' => true, 'truncated' => false];
        }

        $primary = $this->fetchPaidInvoicesForRange(
            $platformKey,
            rtrim((string) $platform['base_url'], '/'),
            (string) $platform['token'],
            $startDate,
            $endDate
        );

        if ($platformKey === 'biinspira' && $primary['rate_limited']) {
            $this->markBiinspiraRateLimited();
        }

        $items = $primary['items'];
        $failed = $primary['failed'];
        $truncated = $primary['truncated'];

        if ($platformKey === 'smartcountingacademy') {
            foreach (['smartcountingacademy_new', 'smartcounting'] as $extraKey) {
                $extraPlatform = $platforms[$extraKey] ?? null;
                if (! $this->client->hasPlatformCredentials($extraPlatform)) {
                    continue;
                }

                $extraResult = $this->fetchPaidInvoicesForRange(
                    $extraKey,
                    rtrim((string) $extraPlatform['base_url'], '/'),
                    (string) $extraPlatform['token'],
                    $startDate,
                    $endDate
                );

                if (! $extraResult['failed']) {
                    $items = array_merge($items, $extraResult['items']);
                    $failed = false;
                }
                $truncated = $truncated || $extraResult['truncated'];
            }
        }

        return [
            'items' => $items,
            'failed' => $failed,
            'truncated' => $truncated,
        ];
    }

    /**
     * @return array{items: list<array<string, mixed>>, failed: bool, rate_limited: bool, truncated: bool}
     */
    private function fetchPaidInvoicesForRange(string $platformKey, string $baseUrl, string $token, string $startDate, string $endDate): array
    {
        $items = [];
        $perPage = 100;
        $startTimestamp = strtotime($startDate . ' 00:00:00');
        $endTimestamp = strtotime($endDate . ' 23:59:59');
        $requestStartDate = Carbon::parse($startDate)->subDay()->toDateString();
        $requestEndDate = Carbon::parse($endDate)->addDay()->toDateString();
        $failed = false;
        $rateLimited = false;
        $truncated = false;

        try {
            $page = 1;
            $hasMore = true;
            $lastSignature = null;

            while ($hasMore && $page <= self::MAX_DETAIL_PAGES) {
                $endpoint = $this->client->resolveInvoicesEndpoint($platformKey);

                $response = $this->client->buildPlatformRequest($platformKey, $token)
                    ->get("{$baseUrl}/{$endpoint}", [
                        'status' => 'paid',
                        'page' => $page,
                        'per_page' => $perPage,
                        'start_date' => $requestStartDate,
                        'end_date' => $requestEndDate,
                    ]);

                if (! $response->successful()) {
                    if ($response->status() === 429) {
                        $rateLimited = true;
                    }
                    if ($page === 1) {
                        $failed = true;
                    }
                    Log::warning('TV dashboard detail failed to fetch invoices', [
                        'platform' => $platformKey,
                        'url' => "{$baseUrl}/{$endpoint}",
                        'status' => $response->status(),
                        'response_body' => substr($response->body(), 0, 300),
                    ]);
                    break;
                }

                $data = $response->json('data.items');
                if (! is_array($data)) {
                    $data = $response->json('data.data');
                }
                if (! is_array($data)) {
                    $data = $response->json('data', []);
                }
                if (! is_array($data) || empty($data)) {
                    break;
                }

                $filtered = array_values(array_filter($data, function ($item) use ($startTimestamp, $endTimestamp) {
                    $paidAt = $item['paid_at'] ?? null;
                    if (! $paidAt) {
                        return false;
                    }

                    $timestamp = strtotime((string) $paidAt);
                    if ($timestamp === false) {
                        return false;
                    }

                    return $timestamp >= $startTimestamp && $timestamp <= $endTimestamp;
                }));

                $items = array_merge($items, $filtered);

                $currentPage = (int) ($response->json('data.pagination.current_page')
                    ?? $response->json('data.meta.current_page')
                    ?? $response->json('data.current_page')
                    ?? $response->json('meta.current_page')
                    ?? $page);
                $lastPage = (int) ($response->json('data.pagination.last_page')
                    ?? $response->json('data.meta.last_page')
                    ?? $response->json('data.last_page')
                    ?? $response->json('meta.last_page')
                    ?? 0);

                if ($lastPage > 0) {
                    $hasMore = $currentPage < $lastPage;
                } else {
                    $signature = md5(json_encode(array_column($data, 'id')));
                    if ($lastSignature !== null && $signature === $lastSignature) {
                        break;
                    }
                    $lastSignature = $signature;
                    $hasMore = count($data) === $perPage;
                }

                $page++;
            }

            if ($hasMore && $page > self::MAX_DETAIL_PAGES) {
                $truncated = true;
            }
        } catch (\Throwable $e) {
            if (empty($items)) {
                $failed = true;
            }
            Log::warning('TV dashboard detail invoices fetch exception', [
                'platform' => $platformKey,
                'message' => $e->getMessage(),
            ]);
        }

        return [
            'items' => $items,
            'failed' => $failed,
            'rate_limited' => $rateLimited,
            'truncated' => $truncated,
        ];
    }

    private function buildGroupPayloadFromPlatformDetails(array $availablePlatformKeys, array $platformDetails, string $metric, Carbon $now): array
    {
        $year = (int) $now->year;
        $startOfMonth = $now->copy()->startOfMonth();
        $points = [];

        if ($metric === 'month') {
            for ($m = 1; $m <= 12; $m++) {
                $points[] = [
                    'key' => sprintf('%04d-%02d', $year, $m),
                    'label' => Carbon::create($year, $m, 1)->locale('id')->translatedFormat('F'),
                    'value' => 0.0,
                    'platforms' => [],
                ];
            }
        } else {
            $daysInMonth = (int) $startOfMonth->daysInMonth;
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $date = $startOfMonth->copy()->day($d);
                $points[] = [
                    'key' => $date->format('Y-m-d'),
                    'label' => $date->locale('id')->translatedFormat('d M'),
                    'value' => 0.0,
                    'platforms' => [],
                ];
            }
        }

        $platformList = [];
        foreach ($availablePlatformKeys as $key) {
            $platformList[] = [
                'key' => $key,
                'label' => PlatformClientService::PLATFORM_LABELS[$key] ?? $key,
            ];

            if (! isset($platformDetails[$key]['points'])) {
                continue;
            }

            foreach ($platformDetails[$key]['points'] as $idx => $p) {
                if (isset($points[$idx])) {
                    $val = (float) ($p['value'] ?? 0);
                    $points[$idx]['value'] += $val;
                    $points[$idx]['platforms'][$key] = $val;
                }
            }
        }

        $this->applyConsecutiveChanges($points);

        if ($metric === 'month') {
            $this->applyMonthlyAverageChanges($points);
        }

        $totalGroup = array_reduce($points, fn ($sum, $row) => $sum + ($row['value'] ?? 0), 0.0);

        return [
            'platform' => 'group',
            'platform_label' => 'Group Biinspira',
            'metric' => $metric,
            'title' => $metric === 'month' ? 'Rincian Omset Group (Bulanan)' : 'Rincian Omset Group (Harian)',
            'subtitle' => $metric === 'month'
                ? "Periode Januari - Desember {$year}"
                : $startOfMonth->locale('id')->translatedFormat('F Y'),
            'points' => $points,
            'platforms' => $platformList,
            'total' => $totalGroup,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @return array{total: float, this_month: float, last_month: float, today: float, yesterday: float}
     */
    private function emptyMetricValues(): array
    {
        return [
            'total' => 0.0,
            'this_month' => 0.0,
            'last_month' => 0.0,
            'today' => 0.0,
            'yesterday' => 0.0,
        ];
    }

    /**
     * Extract canonical revenue metrics from a single platform statistics payload
     * so platforms using different field conventions (e.g. purchases vs invoices)
     * can be summed accurately without key-name mismatches.
     *
     * @return array{total: float, this_month: float, last_month: float, today: float, yesterday: float}
     */
    private function extractNormalizedMetrics(array $statistics): array
    {
        $monthlyNominal = is_array($statistics['monthly_nominal_this_year'] ?? null)
            ? array_change_key_case($statistics['monthly_nominal_this_year'], CASE_LOWER)
            : [];
        $now = now();
        $currentMonthKey = strtolower($now->format('F'));
        $lastMonthFallback = (int) $now->month > 1
            ? ($monthlyNominal[strtolower($now->copy()->subMonthNoOverflow()->format('F'))] ?? null)
            : null;

        $totalRevenue = $this->client->resolveStatisticNumber($this->client->pickStatisticValue($statistics, [
            'total_nominal_this_year',
            'this_year_revenue',
            'revenue_this_year',
            'total_revenue_this_year',
            'year_to_date_revenue',
            'total_revenue',
            'revenue_total',
            'total_nominal',
            'gross_revenue',
        ]));

        $thisMonthRevenue = $this->client->resolveStatisticNumber($this->client->pickStatisticValue(
            $statistics,
            [
                'this_month_revenue',
                'total_nominal_this_month',
                'monthly_revenue',
                'revenue_this_month',
                'this_month_income',
                'income_this_month',
                'current_month_revenue',
                'this_month',
            ],
            $monthlyNominal[$currentMonthKey] ?? 0.0
        ));

        $lastMonthRevenue = $this->client->resolveStatisticNumber($this->client->pickStatisticValue(
            $statistics,
            [
                'total_nominal_last_month',
                'last_month_revenue',
                'total_nominal_previous_month',
                'previous_month_revenue',
                'revenue_last_month',
                'last_month_income',
                'income_last_month',
                'last_month',
            ],
            $lastMonthFallback ?? 0.0
        ));

        $todayRevenue = $this->client->resolveStatisticNumber($this->client->pickStatisticValue($statistics, [
            'total_nominal_today',
            'today_revenue',
            'revenue_today',
            'total_today',
            'nominal_today',
            'today_income',
            'income_today',
            'daily_revenue',
            'revenue_daily',
            'today_amount',
            'today',
        ]));

        $yesterdayRevenue = $this->client->resolveStatisticNumber($this->client->pickStatisticValue($statistics, [
            'total_nominal_yesterday',
            'yesterday_revenue',
            'revenue_yesterday',
            'total_yesterday',
            'nominal_yesterday',
            'yesterday_income',
            'income_yesterday',
            'yesterday_amount',
            'yesterday',
        ]));

        return [
            'total' => $totalRevenue,
            'this_month' => $thisMonthRevenue,
            'last_month' => $lastMonthRevenue,
            'today' => $todayRevenue,
            'yesterday' => $yesterdayRevenue,
        ];
    }

    /**
     * @param  array{total: float, this_month: float, last_month: float, today: float, yesterday: float}  $metrics
     * @return array<string, mixed>
     */
    private function buildPlatformStatFromMetrics(string $key, string $label, array $metrics, ?string $logo): array
    {
        $totalRevenue = $metrics['total'];
        $thisMonthRevenue = $metrics['this_month'];
        $lastMonthRevenue = $metrics['last_month'];
        $todayRevenue = $metrics['today'];
        $yesterdayRevenue = $metrics['yesterday'];

        $monthChange = $this->buildChange($thisMonthRevenue, $lastMonthRevenue);
        $dayChange = $this->buildChange($todayRevenue, $yesterdayRevenue);

        $currentMonth = (int) now()->month;
        $previousMonths = $currentMonth - 1;
        if ($previousMonths > 0) {
            $priorRevenue = max(0.0, $totalRevenue - $thisMonthRevenue);
            $monthlyAvg = $priorRevenue / $previousMonths;
        } else {
            $monthlyAvg = $totalRevenue;
        }
        $avgChange = $this->buildChange($thisMonthRevenue, $monthlyAvg);

        return [
            'key' => $key,
            'label' => $label,
            'logo' => $logo,
            'total' => $totalRevenue,
            'this_month' => $thisMonthRevenue,
            'last_month' => $lastMonthRevenue,
            'today' => $todayRevenue,
            'yesterday' => $yesterdayRevenue,
            'month_change_percentage' => $monthChange['percentage'],
            'month_change_direction' => $monthChange['direction'],
            'day_change_percentage' => $dayChange['percentage'],
            'day_change_direction' => $dayChange['direction'],
            'avg_change_percentage' => $avgChange['percentage'],
            'avg_change_direction' => $avgChange['direction'],
            'monthly_avg' => round($monthlyAvg),
        ];
    }

    private function buildMonthDetailPayload(string $platformKey, array $invoices, Carbon $now): array
    {
        $year = (int) $now->year;
        $points = [];

        for ($month = 1; $month <= 12; $month++) {
            $points[] = [
                'key' => sprintf('%04d-%02d', $year, $month),
                'label' => Carbon::create($year, $month, 1)->locale('id')->translatedFormat('F'),
                'value' => 0.0,
            ];
        }

        foreach ($invoices as $invoice) {
            $paidAt = $invoice['paid_at'] ?? null;
            if (! $paidAt) {
                continue;
            }

            try {
                $paidDate = Carbon::parse((string) $paidAt)->setTimezone(config('app.timezone'));
            } catch (\Throwable) {
                continue;
            }

            if ((int) $paidDate->year !== $year) {
                continue;
            }

            $idx = (int) $paidDate->month - 1;
            if (! isset($points[$idx])) {
                continue;
            }

            $points[$idx]['value'] += $this->resolveInvoiceNominal($invoice);
        }

        $this->applyConsecutiveChanges($points);
        $this->applyMonthlyAverageChanges($points);

        return [
            'platform' => $platformKey,
            'platform_label' => PlatformClientService::PLATFORM_LABELS[$platformKey] ?? $platformKey,
            'metric' => 'month',
            'title' => 'Rincian Bulanan Tahun Ini',
            'subtitle' => "Periode Januari - Desember {$year}",
            'points' => $points,
            'total' => array_reduce($points, fn ($sum, $row) => $sum + ($row['value'] ?? 0), 0.0),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    private function buildDayDetailPayload(string $platformKey, array $invoices, Carbon $now): array
    {
        $startOfMonth = $now->copy()->startOfMonth();
        $daysInMonth = (int) $startOfMonth->daysInMonth;
        $points = [];

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $date = $startOfMonth->copy()->day($day);
            $points[] = [
                'key' => $date->format('Y-m-d'),
                'label' => $date->locale('id')->translatedFormat('d M'),
                'value' => 0.0,
            ];
        }

        foreach ($invoices as $invoice) {
            $paidAt = $invoice['paid_at'] ?? null;
            if (! $paidAt) {
                continue;
            }

            try {
                $paidDate = Carbon::parse((string) $paidAt)->setTimezone(config('app.timezone'));
            } catch (\Throwable) {
                continue;
            }

            if (! $paidDate->isSameMonth($startOfMonth) || (int) $paidDate->year !== (int) $startOfMonth->year) {
                continue;
            }

            $idx = (int) $paidDate->day - 1;
            if (! isset($points[$idx])) {
                continue;
            }

            $points[$idx]['value'] += $this->resolveInvoiceNominal($invoice);
        }

        $this->applyConsecutiveChanges($points);

        return [
            'platform' => $platformKey,
            'platform_label' => PlatformClientService::PLATFORM_LABELS[$platformKey] ?? $platformKey,
            'metric' => 'day',
            'title' => 'Rincian Harian Bulan Ini',
            'subtitle' => $startOfMonth->locale('id')->translatedFormat('F Y'),
            'points' => $points,
            'total' => array_reduce($points, fn ($sum, $row) => $sum + ($row['value'] ?? 0), 0.0),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    private function applyConsecutiveChanges(array &$points): void
    {
        for ($i = 1; $i < count($points); $i++) {
            $change = $this->buildChange($points[$i]['value'], $points[$i - 1]['value']);
            $points[$i]['change_percentage'] = $change['percentage'];
            $points[$i]['change_direction'] = $change['direction'];
        }
    }

    private function applyMonthlyAverageChanges(array &$points): void
    {
        for ($i = 0; $i < count($points); $i++) {
            if ($i === 0) {
                $points[$i]['avg_change_percentage'] = 0.0;
                $points[$i]['avg_change_direction'] = 'flat';
                $points[$i]['avg_value'] = 0.0;
                continue;
            }

            $slice = array_slice($points, 0, $i);
            $nonZeroSlice = array_filter($slice, fn ($p) => ($p['value'] ?? 0.0) > 0.0);
            if (empty($nonZeroSlice)) {
                $points[$i]['avg_change_percentage'] = 0.0;
                $points[$i]['avg_change_direction'] = 'flat';
                $points[$i]['avg_value'] = 0.0;
                continue;
            }

            $avg = array_sum(array_column(array_values($nonZeroSlice), 'value')) / count($nonZeroSlice);
            $avgChange = $this->buildChange($points[$i]['value'], $avg);
            $points[$i]['avg_change_percentage'] = $avgChange['percentage'];
            $points[$i]['avg_change_direction'] = $avgChange['direction'];
            $points[$i]['avg_value'] = round($avg);
        }
    }

    private function resolveInvoiceNominal(array $invoice): float
    {
        return $this->client->resolveStatisticNumber($this->client->pickStatisticValue($invoice, [
            'nett_amount',
            'total_nominal',
            'amount',
            'total',
            'paid_amount',
            'nominal',
            'price',
        ]));
    }

    private function emptyPlatformStat(string $key, string $label, ?string $logo): array
    {
        return [
            'key' => $key,
            'label' => $label,
            'logo' => $logo,
            'total' => 0.0,
            'this_month' => 0.0,
            'last_month' => 0.0,
            'today' => 0.0,
            'yesterday' => 0.0,
            'month_change_percentage' => 0.0,
            'month_change_direction' => 'flat',
            'day_change_percentage' => 0.0,
            'day_change_direction' => 'flat',
            'avg_change_percentage' => 0.0,
            'avg_change_direction' => 'flat',
            'monthly_avg' => 0.0,
        ];
    }

    /**
     * @return array{percentage: float, direction: string}
     */
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
}
