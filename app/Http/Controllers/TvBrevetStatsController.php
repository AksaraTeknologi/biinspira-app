<?php

namespace App\Http\Controllers;

use App\Models\BrevetStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TvBrevetStatsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('tv/brevet-stats', [
            'brevetData' => Inertia::defer(fn () => $this->buildBrevetPayload()),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        return response()->json($this->buildBrevetPayload());
    }

    private function buildBrevetPayload(): array
    {
        $monthCase = "CASE month 
            WHEN 'Januari' THEN 1 
            WHEN 'Februari' THEN 2 
            WHEN 'Maret' THEN 3 
            WHEN 'April' THEN 4 
            WHEN 'Mei' THEN 5 
            WHEN 'Juni' THEN 6 
            WHEN 'Juli' THEN 7 
            WHEN 'Agustus' THEN 8 
            WHEN 'September' THEN 9 
            WHEN 'Oktober' THEN 10 
            WHEN 'November' THEN 11 
            WHEN 'Desember' THEN 12 
            ELSE 0 END";

        $platformCase = "CASE platform 
            WHEN 'biinspira' THEN 1 
            WHEN 'smartcounting' THEN 2 
            WHEN 'sekolahpajak' THEN 3 
            WHEN 'kompeten' THEN 4 
            WHEN 'talenta' THEN 5 
            WHEN 'levelup' THEN 6 
            WHEN 'aksademy' THEN 7 
            WHEN 'skillgrow' THEN 8 
            ELSE 99 END";

        $allRecords = BrevetStat::orderByDesc('year')
            ->orderByRaw("$monthCase DESC")
            ->orderByRaw("$platformCase ASC")
            ->orderByDesc('id')
            ->get();

        $platformConfigs = [
            'all' => '🌟 Akumulasi Group',
        ] + BrevetStat::PLATFORMS;

        $platformsData = [];

        foreach ($platformConfigs as $pKey => $pLabel) {
            $records = $pKey === 'all'
                ? $allRecords
                : $allRecords->where('platform', $pKey)->values();

            $totalWeekend = (int) $records->sum('weekend');
            $totalWeekday = (int) $records->sum('weekday');
            $totalScholarship = (int) $records->sum('scholarship');
            $totalOther = (int) $records->sum('other_brevet');
            $totalOverall = (int) $records->sum('total');

            // Format records for table matching Excel
            $tableRows = $records->map(function ($item, $index) {
                return [
                    'no' => $index + 1,
                    'id' => $item->id,
                    'platform' => $item->platform,
                    'batch' => $item->batch,
                    'month' => $item->month,
                    'year' => (int) $item->year,
                    'weekend' => (int) $item->weekend,
                    'weekday' => (int) $item->weekday,
                    'scholarship' => (int) $item->scholarship,
                    'other_brevet' => (int) $item->other_brevet,
                    'total' => (int) $item->total,
                ];
            })->all();

            // Chart data: grouped by month or batch
            // If specific platform, show per-batch/month
            // If 'all', group by month
            $chartData = [];
            if ($pKey === 'all') {
                // Group by month
                $monthGroups = $records->groupBy('month');
                foreach ($monthGroups as $mName => $mRecords) {
                    $chartData[] = [
                        'name' => $mName,
                        'label' => $mName,
                        'weekend' => (int) $mRecords->sum('weekend'),
                        'weekday' => (int) $mRecords->sum('weekday'),
                        'scholarship' => (int) $mRecords->sum('scholarship'),
                        'other_brevet' => (int) $mRecords->sum('other_brevet'),
                        'total' => (int) $mRecords->sum('total'),
                    ];
                }
            } else {
                // Per batch/month like in Excel
                foreach ($records as $item) {
                    // Extract short batch label e.g. "Batch 100" from "Batch 100 (weekend), ..."
                    $shortBatch = preg_replace('/\s*\(.*$/', '', $item->batch) ?: $item->batch;
                    $chartData[] = [
                        'name' => $shortBatch . ' (' . substr($item->month, 0, 3) . ')',
                        'label' => $item->month,
                        'batch_full' => $item->batch,
                        'weekend' => (int) $item->weekend,
                        'weekday' => (int) $item->weekday,
                        'scholarship' => (int) $item->scholarship,
                        'other_brevet' => (int) $item->other_brevet,
                        'total' => (int) $item->total,
                    ];
                }
            }

            $platformsData[$pKey] = [
                'key' => $pKey,
                'label' => $pLabel,
                'summary' => [
                    'total' => $totalOverall,
                    'weekend' => $totalWeekend,
                    'weekend_pct' => $totalOverall > 0 ? round(($totalWeekend / $totalOverall) * 100, 1) : 0,
                    'weekday' => $totalWeekday,
                    'weekday_pct' => $totalOverall > 0 ? round(($totalWeekday / $totalOverall) * 100, 1) : 0,
                    'scholarship' => $totalScholarship,
                    'scholarship_pct' => $totalOverall > 0 ? round(($totalScholarship / $totalOverall) * 100, 1) : 0,
                    'other_brevet' => $totalOther,
                    'other_brevet_pct' => $totalOverall > 0 ? round(($totalOther / $totalOverall) * 100, 1) : 0,
                ],
                'chart_data' => $chartData,
                'table_rows' => $tableRows,
            ];
        }

        return [
            'platforms' => $platformsData,
            'default_platform' => 'sekolahpajak',
        ];
    }
}
