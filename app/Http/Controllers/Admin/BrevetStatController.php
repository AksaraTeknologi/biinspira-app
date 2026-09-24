<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BrevetStat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrevetStatController extends Controller
{
    protected function authorizeAccess(Request $request): void
    {
        if ($request->user()?->hasAnyRole(['technician', 'technician-intern'])) {
            abort(403, 'Akses ditolak: Teknisi dan teknisi magang tidak diperkenankan mengakses data statistik.');
        }
    }

    public function index(Request $request): Response
    {
        $this->authorizeAccess($request);

        $platform = $request->query('platform', 'all');
        $year = (int) ($request->query('year') ?: now()->year);

        $query = BrevetStat::query()->with('creator:id,name');

        if ($platform && $platform !== 'all' && array_key_exists($platform, BrevetStat::PLATFORMS)) {
            $query->where('platform', $platform);
        }

        if ($year) {
            $query->where('year', $year);
        }

        // Summary calculations across all filtered records (before pagination)
        $totalWeekend = (int) (clone $query)->sum('weekend');
        $totalWeekday = (int) (clone $query)->sum('weekday');
        $totalScholarship = (int) (clone $query)->sum('scholarship');
        $totalOther = (int) (clone $query)->sum('other_brevet');
        $totalAll = (int) (clone $query)->sum('total');

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

        $records = $query
            ->orderByDesc('year')
            ->orderByRaw("$monthCase DESC")
            ->orderByRaw("$platformCase ASC")
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        $records->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'platform' => $item->platform,
                'platform_label' => BrevetStat::PLATFORMS[$item->platform] ?? ucfirst($item->platform),
                'batch' => $item->batch,
                'month' => $item->month,
                'year' => (int) $item->year,
                'weekend' => (int) $item->weekend,
                'weekday' => (int) $item->weekday,
                'scholarship' => (int) $item->scholarship,
                'other_brevet' => (int) $item->other_brevet,
                'total' => (int) $item->total,
                'notes' => $item->notes,
                'creator_name' => $item->creator?->name,
                'created_at' => $item->created_at?->toIso8601String(),
            ];
        });

        // Month list for selection
        $months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];

        return Inertia::render('admin/statistics/brevet/index', [
            'records' => $records,
            'summary' => [
                'total_weekend' => $totalWeekend,
                'total_weekday' => $totalWeekday,
                'total_scholarship' => $totalScholarship,
                'total_other' => $totalOther,
                'total_all' => $totalAll,
            ],
            'platforms' => BrevetStat::PLATFORMS,
            'months' => $months,
            'currentPlatform' => $platform,
            'currentYear' => $year,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAccess($request);

        $validated = $request->validate([
            'platform' => ['required', 'string', 'in:' . implode(',', array_keys(BrevetStat::PLATFORMS))],
            'batch' => ['required', 'string', 'max:150'],
            'month' => ['required', 'string', 'max:30'],
            'year' => ['required', 'integer', 'min:2020', 'max:2099'],
            'weekend' => ['required', 'integer', 'min:0'],
            'weekday' => ['required', 'integer', 'min:0'],
            'scholarship' => ['required', 'integer', 'min:0'],
            'other_brevet' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['created_by'] = $request->user()?->id;

        BrevetStat::create($validated);

        return back()->with('success', 'Data peserta brevet berhasil ditambahkan.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->authorizeAccess($request);

        $record = BrevetStat::findOrFail($id);

        $validated = $request->validate([
            'platform' => ['required', 'string', 'in:' . implode(',', array_keys(BrevetStat::PLATFORMS))],
            'batch' => ['required', 'string', 'max:150'],
            'month' => ['required', 'string', 'max:30'],
            'year' => ['required', 'integer', 'min:2020', 'max:2099'],
            'weekend' => ['required', 'integer', 'min:0'],
            'weekday' => ['required', 'integer', 'min:0'],
            'scholarship' => ['required', 'integer', 'min:0'],
            'other_brevet' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $record->update($validated);

        return back()->with('success', 'Data peserta brevet berhasil diperbarui.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->authorizeAccess($request);

        $record = BrevetStat::findOrFail($id);
        $record->delete();

        return back()->with('success', 'Data peserta brevet berhasil dihapus.');
    }
}
