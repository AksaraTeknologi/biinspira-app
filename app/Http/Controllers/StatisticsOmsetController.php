<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StatisticsOmsetController extends Controller
{
    private const CACHE_KEY_2026 = 'statistics_omset.data.2026';
    private const CACHE_KEY_2025 = 'statistics_omset.data.2025';
    private const CACHE_KEY_FULL = 'statistics_omset.data.full';

    private array $platformLabels = [
        'biinspira' => 'Biinspira',
        'smartcounting' => 'Smartcounting',
        'smartcountingacademy' => 'Smartcounting Academy',
        'kompeten' => 'Kompeten',
        'sekolahpajak' => 'Sekolah Pajak',
        'talenta' => 'Talenta',
        'skillgrow' => 'Skillgrow',
        'aksademy' => 'Aksademy',
    ];

    private array $customAuthHeaderPlatforms = [
        'biinspira',
        'smartcounting',
        'smartcountingacademy',
    ];

    private array $monthMap = [
        1 => ['key' => 'january', 'name' => 'Januari', 'short' => 'Jan'],
        2 => ['key' => 'february', 'name' => 'Februari', 'short' => 'Feb'],
        3 => ['key' => 'march', 'name' => 'Maret', 'short' => 'Mar'],
        4 => ['key' => 'april', 'name' => 'April', 'short' => 'Apr'],
        5 => ['key' => 'may', 'name' => 'Mei', 'short' => 'Mei'],
        6 => ['key' => 'june', 'name' => 'Juni', 'short' => 'Jun'],
        7 => ['key' => 'july', 'name' => 'Juli', 'short' => 'Jul'],
        8 => ['key' => 'august', 'name' => 'Agustus', 'short' => 'Ags'],
        9 => ['key' => 'september', 'name' => 'September', 'short' => 'Sep'],
        10 => ['key' => 'october', 'name' => 'Oktober', 'short' => 'Okt'],
        11 => ['key' => 'november', 'name' => 'November', 'short' => 'Nov'],
        12 => ['key' => 'december', 'name' => 'Desember', 'short' => 'Des'],
    ];

    /**
     * Verified historical baseline for 2025 across all platforms.
     * Prevents expensive live scans of thousands of historical transactions over HTTP during web requests.
     */
    private const HISTORICAL_2025_DATA = [
        'monthly_totals' => [
            'january' => 367510200.0,
            'february' => 106764000.0,
            'march' => 253225100.0,
            'april' => 243037200.0,
            'may' => 186921000.0,
            'june' => 332417000.0,
            'july' => 142558002.0,
            'august' => 350169000.0,
            'september' => 311158100.0,
            'october' => 325288600.0,
            'november' => 324272800.0,
            'december' => 235035600.0,
        ],
        'platform_totals' => [
            'biinspira' => 1761902700.0,
            'smartcounting' => 1410402202.0,
            'smartcountingacademy' => 0.0,
            'kompeten' => 0.0,
            'sekolahpajak' => 0.0,
            'talenta' => 0.0,
            'skillgrow' => 4702000.0,
            'aksademy' => 1349700.0,
        ],
        'platform_monthly' => [
            'biinspira' => [
                'january' => 205969200.0,
                'february' => 106764000.0,
                'march' => 142314100.0,
                'april' => 128206200.0,
                'may' => 68373000.0,
                'june' => 185392000.0,
                'july' => 0.0,
                'august' => 208635000.0,
                'september' => 212572100.0,
                'october' => 194443000.0,
                'november' => 198030000.0,
                'december' => 111204100.0,
            ],
            'smartcounting' => [
                'january' => 161541000.0,
                'february' => 0.0,
                'march' => 110911000.0,
                'april' => 114831000.0,
                'may' => 118548000.0,
                'june' => 147025000.0,
                'july' => 142558002.0,
                'august' => 141386000.0,
                'september' => 98461000.0,
                'october' => 130825600.0,
                'november' => 124758800.0,
                'december' => 119556800.0,
            ],
            'smartcountingacademy' => [
                'january' => 0.0, 'february' => 0.0, 'march' => 0.0, 'april' => 0.0,
                'may' => 0.0, 'june' => 0.0, 'july' => 0.0, 'august' => 0.0,
                'september' => 0.0, 'october' => 0.0, 'november' => 0.0, 'december' => 0.0,
            ],
            'kompeten' => [
                'january' => 0.0, 'february' => 0.0, 'march' => 0.0, 'april' => 0.0,
                'may' => 0.0, 'june' => 0.0, 'july' => 0.0, 'august' => 0.0,
                'september' => 0.0, 'october' => 0.0, 'november' => 0.0, 'december' => 0.0,
            ],
            'sekolahpajak' => [
                'january' => 0.0, 'february' => 0.0, 'march' => 0.0, 'april' => 0.0,
                'may' => 0.0, 'june' => 0.0, 'july' => 0.0, 'august' => 0.0,
                'september' => 0.0, 'october' => 0.0, 'november' => 0.0, 'december' => 0.0,
            ],
            'talenta' => [
                'january' => 0.0, 'february' => 0.0, 'march' => 0.0, 'april' => 0.0,
                'may' => 0.0, 'june' => 0.0, 'july' => 0.0, 'august' => 0.0,
                'september' => 0.0, 'october' => 0.0, 'november' => 0.0, 'december' => 0.0,
            ],
            'skillgrow' => [
                'january' => 0.0, 'february' => 0.0, 'march' => 0.0, 'april' => 0.0,
                'may' => 0.0, 'june' => 0.0, 'july' => 0.0, 'august' => 10000.0,
                'september' => 0.0, 'october' => 0.0, 'november' => 1324000.0, 'december' => 3368000.0,
            ],
            'aksademy' => [
                'january' => 0.0, 'february' => 0.0, 'march' => 0.0, 'april' => 0.0,
                'may' => 0.0, 'june' => 0.0, 'july' => 0.0, 'august' => 138000.0,
                'september' => 125000.0, 'october' => 20000.0, 'november' => 160000.0, 'december' => 906700.0,
            ],
        ],
    ];

    public function index(): Response
    {
        @set_time_limit(60);

        return Inertia::render('tv/statistics-omset', [
            'comparisonData' => Inertia::defer(fn () => $this->buildComparisonData()),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    public function refresh(): JsonResponse
    {
        @set_time_limit(60);

        Cache::forget(self::CACHE_KEY_2026);
        Cache::forget(self::CACHE_KEY_FULL);

        $data = $this->buildComparisonData(true);

        return response()->json([
            'success' => true,
            'message' => 'Data statistik omset 2025 vs 2026 berhasil diperbarui.',
            'data' => $data,
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    public function data(): JsonResponse
    {
        return response()->json($this->buildComparisonData());
    }

    private function buildComparisonData(bool $forceRefresh = false): array
    {
        if (! $forceRefresh && Cache::has(self::CACHE_KEY_FULL)) {
            return Cache::get(self::CACHE_KEY_FULL);
        }

        $platformsConfig = config('services.platforms', []);
        $logos = $this->buildPlatformLogoMap();

        $data2026 = $this->get2026Data($platformsConfig, $forceRefresh);
        $data2025 = $this->get2025Data($platformsConfig, $forceRefresh);

        $currentMonth = (int) now()->month; // 1-12

        $monthlyComparison = [];
        $cum2025 = 0.0;
        $cum2026 = 0.0;

        $ytd2025 = 0.0;
        $ytd2026 = 0.0;

        $best2025 = ['month' => '-', 'value' => 0.0];
        $best2026 = ['month' => '-', 'value' => 0.0];

        foreach ($this->monthMap as $num => $info) {
            $monthKey = $info['key'];
            $val2025 = (float) ($data2025['monthly_totals'][$monthKey] ?? 0.0);
            $val2026 = (float) ($data2026['monthly_totals'][$monthKey] ?? 0.0);

            $cum2025 += $val2025;
            $cum2026 += $val2026;

            if ($num <= $currentMonth) {
                $ytd2025 += $val2025;
                $ytd2026 += $val2026;
            }

            if ($val2025 > $best2025['value']) {
                $best2025 = ['month' => $info['name'], 'value' => $val2025];
            }
            if ($val2026 > $best2026['value']) {
                $best2026 = ['month' => $info['name'], 'value' => $val2026];
            }

            $diff = $val2026 - $val2025;
            $change = $this->calculateChange($val2026, $val2025);

            $platformBreakdown2025 = [];
            $platformBreakdown2026 = [];
            foreach ($this->platformLabels as $pKey => $pLabel) {
                $platformBreakdown2025[$pKey] = (float) ($data2025['platform_monthly'][$pKey][$monthKey] ?? 0.0);
                $platformBreakdown2026[$pKey] = (float) ($data2026['platform_monthly'][$pKey][$monthKey] ?? 0.0);
            }

            $monthlyComparison[] = [
                'month' => $num,
                'month_key' => $monthKey,
                'month_name' => $info['name'],
                'short_name' => $info['short'],
                'omset_2025' => $val2025,
                'omset_2026' => $val2026,
                'difference' => $diff,
                'growth_percentage' => $change['percentage'],
                'growth_direction' => $change['direction'],
                'cumulative_2025' => $cum2025,
                'cumulative_2026' => $cum2026,
                'platforms_2025' => $platformBreakdown2025,
                'platforms_2026' => $platformBreakdown2026,
                'is_current_or_past' => $num <= $currentMonth,
            ];
        }

        $total2025 = array_sum(array_column($monthlyComparison, 'omset_2025'));
        $total2026 = array_sum(array_column($monthlyComparison, 'omset_2026'));

        $totalChange = $this->calculateChange($total2026, $total2025);
        $ytdChange = $this->calculateChange($ytd2026, $ytd2025);

        // Platform comparisons
        $platformComparison = [];
        foreach ($this->platformLabels as $pKey => $pLabel) {
            $pTotal2025 = (float) ($data2025['platform_totals'][$pKey] ?? 0.0);
            $pTotal2026 = (float) ($data2026['platform_totals'][$pKey] ?? 0.0);
            $pChange = $this->calculateChange($pTotal2026, $pTotal2025);

            $platformComparison[] = [
                'key' => $pKey,
                'label' => $pLabel,
                'logo' => $logos[$pKey] ?? null,
                'total_2025' => $pTotal2025,
                'total_2026' => $pTotal2026,
                'difference' => $pTotal2026 - $pTotal2025,
                'growth_percentage' => $pChange['percentage'],
                'growth_direction' => $pChange['direction'],
                'share_2025' => $total2025 > 0 ? round(($pTotal2025 / $total2025) * 100, 1) : 0.0,
                'share_2026' => $total2026 > 0 ? round(($pTotal2026 / $total2026) * 100, 1) : 0.0,
            ];
        }

        // Sort platform comparison by 2026 total descending
        usort($platformComparison, fn ($a, $b) => $b['total_2026'] <=> $a['total_2026']);

        $summary = [
            'total_2025' => $total2025,
            'total_2026' => $total2026,
            'difference' => $total2026 - $total2025,
            'growth_percentage' => $totalChange['percentage'],
            'growth_direction' => $totalChange['direction'],
            'ytd_2025' => $ytd2025,
            'ytd_2026' => $ytd2026,
            'ytd_difference' => $ytd2026 - $ytd2025,
            'ytd_growth_percentage' => $ytdChange['percentage'],
            'ytd_growth_direction' => $ytdChange['direction'],
            'current_month_name' => $this->monthMap[$currentMonth]['name'] ?? 'Bulan Berjalan',
            'monthly_avg_2025' => round($total2025 / 12),
            'monthly_avg_2026' => $currentMonth > 0 ? round($ytd2026 / $currentMonth) : 0.0,
            'best_month_2025' => $best2025,
            'best_month_2026' => $best2026,
        ];

        $payload = [
            'summary' => $summary,
            'monthly_comparison' => $monthlyComparison,
            'platform_comparison' => $platformComparison,
            'platforms' => array_map(fn ($k) => [
                'key' => $k,
                'label' => $this->platformLabels[$k],
                'logo' => $logos[$k] ?? null,
            ], array_keys($this->platformLabels)),
            'generated_at' => now()->toIso8601String(),
        ];

        Cache::put(self::CACHE_KEY_FULL, $payload, now()->addMinutes(5));

        return $payload;
    }

    private function get2026Data(array $platformsConfig, bool $forceRefresh = false): array
    {
        if (! $forceRefresh && Cache::has(self::CACHE_KEY_2026)) {
            return Cache::get(self::CACHE_KEY_2026);
        }

        $monthKeys = array_column($this->monthMap, 'key');
        $monthlyTotals = array_fill_keys($monthKeys, 0.0);
        $platformTotals = [];
        $platformMonthly = [];

        foreach ($this->platformLabels as $key => $_label) {
            $platformTotals[$key] = 0.0;
            $platformMonthly[$key] = array_fill_keys($monthKeys, 0.0);
        }

        // Concurrent parallel request using Http::pool for lightning-fast 2026 data fetching
        try {
            $responses = Http::pool(function ($pool) use ($platformsConfig) {
                $requests = [];
                foreach ($this->platformLabels as $key => $_label) {
                    $platform = $platformsConfig[$key] ?? null;
                    if (! is_array($platform) || empty($platform['base_url']) || empty($platform['token'])) {
                        continue;
                    }

                    $endpoint = in_array($key, ['smartcounting', 'smartcountingacademy', 'biinspira'], true) ? 'purchases' : 'invoices';
                    $baseUrl = rtrim((string) $platform['base_url'], '/');
                    $token = (string) $platform['token'];

                    $client = in_array($key, $this->customAuthHeaderPlatforms, true)
                        ? $pool->as($key)->timeout(6)->withHeaders(['api-auth-key' => $token])
                        : $pool->as($key)->timeout(6)->withToken($token);

                    $requests[] = $client->get("{$baseUrl}/{$endpoint}/statistics", [
                        'status' => 'paid',
                    ]);
                }

                return $requests;
            });

            foreach ($this->platformLabels as $key => $_label) {
                $response = $responses[$key] ?? null;
                if (! $response || ! $response->successful()) {
                    continue;
                }

                $statsData = $response->json('data') ?? [];
                $monthly = $statsData['monthly_nominal_this_year'] ?? [];

                foreach ($monthKeys as $mKey) {
                    $val = (float) ($monthly[$mKey] ?? 0.0);
                    $monthlyTotals[$mKey] += $val;
                    $platformTotals[$key] += $val;
                    $platformMonthly[$key][$mKey] = $val;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("StatisticsOmset 2026 pool fetch exception: {$e->getMessage()}");
        }

        $result = [
            'monthly_totals' => $monthlyTotals,
            'platform_totals' => $platformTotals,
            'platform_monthly' => $platformMonthly,
        ];

        Cache::put(self::CACHE_KEY_2026, $result, now()->addMinutes(5));

        return $result;
    }

    private function get2025Data(array $platformsConfig, bool $forceRefresh = false): array
    {
        if (! $forceRefresh && Cache::has(self::CACHE_KEY_2025)) {
            return Cache::get(self::CACHE_KEY_2025);
        }

        // Return verified historical baseline immediately
        $result = self::HISTORICAL_2025_DATA;
        Cache::put(self::CACHE_KEY_2025, $result, now()->addDays(365));

        return $result;
    }

    private function calculateChange(float $current, float $previous): array
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
            'percentage' => round(abs($delta), 1),
            'direction' => $direction,
        ];
    }

    private function buildPlatformLogoMap(): array
    {
        $logos = [];
        $users = User::query()
            ->select(['name', 'email', 'avatar'])
            ->whereNotNull('avatar')
            ->get();

        $platformAliases = [
            'biinspira' => ['biinspira'],
            'smartcounting' => ['smartcounting'],
            'smartcountingacademy' => ['smartcountingacademy', 'smartcounting'],
            'kompeten' => ['kompeten', 'kompetenidn'],
            'sekolahpajak' => ['sekolahpajak'],
            'talenta' => ['talenta'],
            'skillgrow' => ['skillgrow'],
            'aksademy' => ['aksademy'],
        ];

        foreach ($this->platformLabels as $platformKey => $_label) {
            $aliases = $platformAliases[$platformKey] ?? [$platformKey];

            $matchedUser = $users->first(function (User $user) use ($platformKey): bool {
                $nameKey = $this->normalizePlatformKey((string) $user->name);
                $emailKey = $this->normalizePlatformKey(Str::before((string) $user->email, '@'));

                return $nameKey === $platformKey || $emailKey === $platformKey;
            });

            if (! $matchedUser) {
                $matchedUser = $users->first(function (User $user) use ($aliases): bool {
                    $nameKey = $this->normalizePlatformKey((string) $user->name);
                    $emailKey = $this->normalizePlatformKey(Str::before((string) $user->email, '@'));

                    foreach ($aliases as $alias) {
                        if (str_contains($nameKey, $alias) || str_contains($emailKey, $alias)) {
                            return true;
                        }
                    }

                    return false;
                });
            }

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
}
