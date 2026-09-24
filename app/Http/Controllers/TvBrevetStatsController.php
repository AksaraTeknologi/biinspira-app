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

        $monthOrder = [
            'Januari' => 1,
            'Februari' => 2,
            'Maret' => 3,
            'April' => 4,
            'Mei' => 5,
            'Juni' => 6,
            'Juli' => 7,
            'Agustus' => 8,
            'September' => 9,
            'Oktober' => 10,
            'November' => 11,
            'Desember' => 12,
        ];

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

            // Chart data:
            // Urutkan sesuai bulan dan tahun, paling terbaru disebelah kanan (oldest on left -> newest on right)
            // Tampilkan tahun di grafik
            // Jika bulannya sama, urutkan dari batch weekend paling kecil (terlama) sebelah kiri, terbaru sebelah kanan
            $chartData = [];
            if ($pKey === 'all') {
                // Group by year and month
                $monthGroups = [];
                foreach ($records as $item) {
                    $mNum = $monthOrder[$item->month] ?? 0;
                    $groupKey = sprintf('%04d_%02d', (int) $item->year, $mNum);
                    if (! isset($monthGroups[$groupKey])) {
                        $monthGroups[$groupKey] = [
                            'year' => (int) $item->year,
                            'month' => $item->month,
                            'records' => [],
                        ];
                    }
                    $monthGroups[$groupKey]['records'][] = $item;
                }

                // Sort chronologically (oldest on left, newest on right)
                ksort($monthGroups);

                foreach ($monthGroups as $group) {
                    $mRecords = collect($group['records']);
                    $monthYearLabel = $group['month'] . ' ' . $group['year'];
                    $chartData[] = [
                        'name' => $monthYearLabel,
                        'label' => $monthYearLabel,
                        'month' => $group['month'],
                        'year' => $group['year'],
                        'weekend' => (int) $mRecords->sum('weekend'),
                        'weekday' => (int) $mRecords->sum('weekday'),
                        'scholarship' => (int) $mRecords->sum('scholarship'),
                        'other_brevet' => (int) $mRecords->sum('other_brevet'),
                        'total' => (int) $mRecords->sum('total'),
                    ];
                }
            } else {
                // Sort chronologically: Year ASC -> Month ASC -> Weekend Batch ASC -> ID ASC
                $sortedRecords = $records->sort(function ($a, $b) use ($monthOrder) {
                    if ((int) $a->year !== (int) $b->year) {
                        return (int) $a->year <=> (int) $b->year;
                    }

                    $mA = $monthOrder[$a->month] ?? 0;
                    $mB = $monthOrder[$b->month] ?? 0;
                    if ($mA !== $mB) {
                        return $mA <=> $mB;
                    }

                    // Kalau bulannya sama, urutkan dari batch weekend paling kecil (terlama) sebelah kiri
                    $bA = $this->parseWeekendBatchNumber($a->batch);
                    $bB = $this->parseWeekendBatchNumber($b->batch);
                    if ($bA !== $bB) {
                        return $bA <=> $bB;
                    }

                    return (int) $a->id <=> (int) $b->id;
                })->values();

                foreach ($sortedRecords as $item) {
                    // Extract short batch label e.g. "Batch 100" from "Batch 100 (weekend), ..."
                    $shortBatch = preg_replace('/\s*\(.*$/', '', $item->batch) ?: $item->batch;
                    $shortMonth = substr($item->month, 0, 3);
                    $chartData[] = [
                        'name' => $shortBatch . ' (' . $shortMonth . ' ' . $item->year . ')',
                        'label' => $item->month . ' ' . $item->year,
                        'batch_full' => $item->batch . ' (' . $item->month . ' ' . $item->year . ')',
                        'month' => $item->month,
                        'year' => (int) $item->year,
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

    private function parseWeekendBatchNumber(?string $batch): int
    {
        if (! $batch) {
            return 0;
        }

        // Match number before (weekend) e.g. "Batch 100 (weekend)" or "100 (weekend)"
        if (preg_match('/(\d+)\s*\(\s*weekend/i', $batch, $matches)) {
            return (int) $matches[1];
        }

        // Match number after "Batch" e.g. "Batch 100"
        if (preg_match('/Batch\s*(\d+)/i', $batch, $matches)) {
            return (int) $matches[1];
        }

        // First integer in string
        if (preg_match('/\d+/', $batch, $matches)) {
            return (int) $matches[0];
        }

        return 0;
    }
}
