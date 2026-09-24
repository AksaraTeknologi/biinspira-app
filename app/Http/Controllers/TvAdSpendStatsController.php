<?php

namespace App\Http\Controllers;

use App\Models\AdSpendStat;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TvAdSpendStatsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('tv/ad-spend-stats', [
            'adSpendData' => Inertia::defer(fn () => $this->buildAdSpendPayload()),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        return response()->json($this->buildAdSpendPayload());
    }

    private function buildAdSpendPayload(): array
    {
        $now = now();
        $currentYear = (int) $now->year;
        $currentMonth = (int) $now->month;

        $platforms = AdSpendStat::PLATFORMS;
        $channels = AdSpendStat::CHANNELS;

        // Fetch all records for the current year
        $records = AdSpendStat::whereYear('date', $currentYear)->get();

        // Previous month calculation
        $prevMonth = $currentMonth > 1 ? $currentMonth - 1 : 12;
        $prevMonthYear = $currentMonth > 1 ? $currentYear : $currentYear - 1;

        $thisMonthSpend = (float) $records->filter(fn ($r) => (int) $r->date->format('m') === $currentMonth)->sum('amount');
        $prevMonthSpend = (float) AdSpendStat::whereYear('date', $prevMonthYear)
            ->whereMonth('date', $prevMonth)
            ->sum('amount');

        $thisYearSpend = (float) $records->sum('amount');
        $avgPerMonth = $currentMonth > 0 ? $thisYearSpend / $currentMonth : 0;

        $monthGrowthPercent = $prevMonthSpend > 0
            ? round((($thisMonthSpend - $prevMonthSpend) / $prevMonthSpend) * 100, 1)
            : 0;

        // Monthly breakdown Jan - Dec
        $monthNames = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr', 5 => 'Mei', 6 => 'Jun',
            7 => 'Jul', 8 => 'Ags', 9 => 'Sep', 10 => 'Okt', 11 => 'Nov', 12 => 'Des',
        ];

        $monthlyData = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthRecords = $records->filter(fn ($r) => (int) $r->date->format('m') === $m);
            $totalMonth = (float) $monthRecords->sum('amount');

            $meta = (float) $monthRecords->where('ad_channel', 'meta')->sum('amount');
            $tiktok = (float) $monthRecords->where('ad_channel', 'tiktok')->sum('amount');
            $google = (float) $monthRecords->where('ad_channel', 'google')->sum('amount');
            $boostPost = (float) $monthRecords->where('ad_channel', 'boost_post')->sum('amount');

            $monthlyData[] = [
                'month_number' => $m,
                'month_name' => $monthNames[$m],
                'is_current_or_past' => $m <= $currentMonth,
                'total' => $totalMonth,
                'total_val' => $m <= $currentMonth ? $totalMonth : null,
                'boost_post' => $boostPost,
                'boost_post_val' => $m <= $currentMonth ? $boostPost : null,
                'meta' => $meta,
                'meta_val' => $m <= $currentMonth ? $meta : null,
                'tiktok' => $tiktok,
                'tiktok_val' => $m <= $currentMonth ? $tiktok : null,
                'google' => $google,
                'google_val' => $m <= $currentMonth ? $google : null,
            ];
        }

        // Platform breakdown
        $platformBreakdown = [];
        foreach ($platforms as $pKey => $pLabel) {
            $pRecords = $records->where('platform', $pKey);
            $pThisMonth = (float) $pRecords->filter(fn ($r) => (int) $r->date->format('m') === $currentMonth)->sum('amount');
            $pThisYear = (float) $pRecords->sum('amount');

            // Channel distribution for this platform
            $pChannels = [];
            foreach ($channels as $cKey => $cLabel) {
                $cSum = (float) $pRecords->where('ad_channel', $cKey)->sum('amount');
                $pChannels[$cKey] = [
                    'key' => $cKey,
                    'label' => $cLabel,
                    'amount' => $cSum,
                    'percent' => $pThisYear > 0 ? round(($cSum / $pThisYear) * 100, 1) : 0,
                ];
            }

            // Monthly breakdown for this platform
            $pMonthly = [];
            for ($m = 1; $m <= 12; $m++) {
                $mRecords = $pRecords->filter(fn ($r) => (int) $r->date->format('m') === $m);
                $mSum = (float) $mRecords->sum('amount');
                $boostSum = (float) $mRecords->where('ad_channel', 'boost_post')->sum('amount');
                $metaSum = (float) $mRecords->where('ad_channel', 'meta')->sum('amount');
                $tiktokSum = (float) $mRecords->where('ad_channel', 'tiktok')->sum('amount');
                $googleSum = (float) $mRecords->where('ad_channel', 'google')->sum('amount');

                $pMonthly[] = [
                    'month' => $monthNames[$m],
                    'amount' => $mSum,
                    'amount_val' => $m <= $currentMonth ? $mSum : null,
                    'boost_post' => $boostSum,
                    'boost_post_val' => $m <= $currentMonth ? $boostSum : null,
                    'meta' => $metaSum,
                    'meta_val' => $m <= $currentMonth ? $metaSum : null,
                    'tiktok' => $tiktokSum,
                    'tiktok_val' => $m <= $currentMonth ? $tiktokSum : null,
                    'google' => $googleSum,
                    'google_val' => $m <= $currentMonth ? $googleSum : null,
                ];
            }

            $platformBreakdown[] = [
                'key' => $pKey,
                'label' => $pLabel,
                'this_month' => $pThisMonth,
                'this_year' => $pThisYear,
                'channels' => $pChannels,
                'monthly' => $pMonthly,
            ];
        }

        // Sort platforms by this year descending
        usort($platformBreakdown, fn ($a, $b) => $b['this_year'] <=> $a['this_year']);

        // Channel totals
        $channelTotals = [];
        foreach ($channels as $cKey => $cLabel) {
            $cSum = (float) $records->where('ad_channel', $cKey)->sum('amount');
            $channelTotals[] = [
                'key' => $cKey,
                'label' => $cLabel,
                'amount' => $cSum,
                'percent' => $thisYearSpend > 0 ? round(($cSum / $thisYearSpend) * 100, 1) : 0,
            ];
        }
        usort($channelTotals, fn ($a, $b) => $b['amount'] <=> $a['amount']);

        $topPlatform = $platformBreakdown[0] ?? null;
        $topChannel = $channelTotals[0] ?? null;

        return [
            'summary' => [
                'current_year' => $currentYear,
                'current_month_name' => $now->translatedFormat('F'),
                'this_month_spend' => $thisMonthSpend,
                'prev_month_spend' => $prevMonthSpend,
                'month_growth_percent' => $monthGrowthPercent,
                'month_growth_direction' => $monthGrowthPercent >= 0 ? 'up' : 'down',
                'this_year_spend' => $thisYearSpend,
                'avg_per_month' => $avgPerMonth,
                'top_platform' => $topPlatform ? [
                    'label' => $topPlatform['label'],
                    'amount' => $topPlatform['this_year'],
                ] : null,
                'top_channel' => $topChannel ? [
                    'label' => $topChannel['label'],
                    'percent' => $topChannel['percent'],
                    'amount' => $topChannel['amount'],
                ] : null,
            ],
            'monthly_data' => $monthlyData,
            'platforms' => $platformBreakdown,
            'channels' => $channelTotals,
        ];
    }
}
