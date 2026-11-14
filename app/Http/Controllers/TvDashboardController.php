<?php

namespace App\Http\Controllers;

use App\Models\AdSpendStat;
use App\Models\BrevetStat;
use App\Models\RevisionRequest;
use App\Services\PlatformClientService;
use App\Services\TvPlatformStatsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TvDashboardController extends Controller
{
    public function __construct(
        private readonly PlatformClientService $platformClient,
        private readonly TvPlatformStatsService $tvStatsService,
    ) {}

    public function statsDashboard(): Response
    {
        $availablePlatformKeys = $this->platformClient->getAvailablePlatformKeys();

        $activeTicketsCount = RevisionRequest::query()
            ->whereIn('status', ['todo', 'in_progress', 'in_review'])
            ->count();
        $inProgressTicketsCount = RevisionRequest::query()
            ->where('status', 'in_progress')
            ->count();

        $currentYear = (int) now()->year;
        $brevetTotalThisYear = (int) BrevetStat::query()
            ->where('year', $currentYear)
            ->sum('total');

        $adSpendThisMonth = (float) AdSpendStat::query()
            ->whereYear('date', $currentYear)
            ->whereMonth('date', (int) now()->month)
            ->sum('amount');

        $adSpendThisYear = (float) AdSpendStat::query()
            ->whereYear('date', $currentYear)
            ->sum('amount');

        return Inertia::render('tv/stats-dashboard', [
            'overview' => [
                'active_platforms_count' => count($availablePlatformKeys),
                'active_tickets_count' => $activeTicketsCount,
                'in_progress_tickets_count' => $inProgressTicketsCount,
                'brevet_total_year' => $brevetTotalThisYear,
                'ad_spend_this_month' => $adSpendThisMonth,
                'ad_spend_this_year' => $adSpendThisYear,
                'year' => $currentYear,
            ],
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    public function index(): Response
    {
        $platforms = config('services.platforms', []);

        return Inertia::render('tv/dashboard', [
            'platformStats' => Inertia::defer(fn () => $this->tvStatsService->getPlatformStats($platforms)),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    public function detail(Request $request): JsonResponse
    {
        $platforms = config('services.platforms', []);
        $availablePlatformKeys = $this->platformClient->getAvailablePlatformKeys($platforms);

        $validated = $request->validate([
            'platform' => ['required', 'string', Rule::in(array_merge($availablePlatformKeys, ['group']))],
            'metric' => ['required', 'string', Rule::in(['month', 'day'])],
        ]);

        $platformKey = $validated['platform'];
        $metric = $validated['metric'];

        if ($platformKey === 'group') {
            return response()->json($this->tvStatsService->getGroupDetailPoints($metric, $platforms));
        }

        $platform = $platforms[$platformKey] ?? null;

        if (! $this->platformClient->hasPlatformCredentials($platform)) {
            return response()->json([
                'message' => 'Platform tidak valid atau credential tidak tersedia.',
            ], 422);
        }

        return response()->json($this->tvStatsService->getDetailPoints($platformKey, $metric, $platforms));
    }
}
