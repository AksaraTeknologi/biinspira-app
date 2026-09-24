<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdSpendStat;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdSpendStatController extends Controller
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

        $platform = $request->query('platform');
        $channel = $request->query('channel');
        $year = (int) ($request->query('year') ?: now()->year);
        $month = $request->query('month') ? (int) $request->query('month') : null;

        $query = AdSpendStat::query()->with('creator:id,name');

        if ($platform && array_key_exists($platform, AdSpendStat::PLATFORMS)) {
            $query->where('platform', $platform);
        }

        if ($channel && array_key_exists($channel, AdSpendStat::CHANNELS)) {
            $query->where('ad_channel', $channel);
        }

        if ($year) {
            $query->whereYear('date', $year);
        }

        if ($month) {
            $query->whereMonth('date', $month);
        }

        $records = $query->orderByDesc('date')->orderByDesc('id')->paginate(10)->withQueryString();

        $records->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'platform' => $item->platform,
                'platform_label' => AdSpendStat::PLATFORMS[$item->platform] ?? ucfirst($item->platform),
                'date' => $item->date->format('Y-m-d'),
                'amount' => (float) $item->amount,
                'ad_channel' => $item->ad_channel,
                'channel_label' => AdSpendStat::CHANNELS[$item->ad_channel] ?? ucfirst($item->ad_channel),
                'notes' => $item->notes,
                'creator_name' => $item->creator?->name,
                'created_at' => $item->created_at?->toIso8601String(),
            ];
        });

        // Summary metrics calculation
        $now = now();
        $thisMonthStart = $now->copy()->startOfMonth()->toDateString();
        $thisMonthEnd = $now->copy()->endOfMonth()->toDateString();
        $thisYearStart = $now->copy()->startOfYear()->toDateString();
        $thisYearEnd = $now->copy()->endOfYear()->toDateString();

        $totalThisMonth = (float) AdSpendStat::whereBetween('date', [$thisMonthStart, $thisMonthEnd])->sum('amount');
        $totalThisYear = (float) AdSpendStat::whereBetween('date', [$thisYearStart, $thisYearEnd])->sum('amount');
        $totalAll = (float) AdSpendStat::sum('amount');

        // Top platform and channel this year
        $topPlatformRecord = AdSpendStat::whereBetween('date', [$thisYearStart, $thisYearEnd])
            ->selectRaw('platform, sum(amount) as total')
            ->groupBy('platform')
            ->orderByDesc('total')
            ->first();

        $topChannelRecord = AdSpendStat::whereBetween('date', [$thisYearStart, $thisYearEnd])
            ->selectRaw('ad_channel, sum(amount) as total')
            ->groupBy('ad_channel')
            ->orderByDesc('total')
            ->first();

        return Inertia::render('admin/statistics/ad-spend/index', [
            'records' => $records,
            'summary' => [
                'total_this_month' => $totalThisMonth,
                'total_this_year' => $totalThisYear,
                'total_all' => $totalAll,
                'top_platform' => $topPlatformRecord ? [
                    'key' => $topPlatformRecord->platform,
                    'label' => AdSpendStat::PLATFORMS[$topPlatformRecord->platform] ?? $topPlatformRecord->platform,
                    'total' => (float) $topPlatformRecord->total,
                ] : null,
                'top_channel' => $topChannelRecord ? [
                    'key' => $topChannelRecord->ad_channel,
                    'label' => AdSpendStat::CHANNELS[$topChannelRecord->ad_channel] ?? $topChannelRecord->ad_channel,
                    'total' => (float) $topChannelRecord->total,
                ] : null,
            ],
            'platforms' => AdSpendStat::PLATFORMS,
            'channels' => AdSpendStat::CHANNELS,
            'filters' => [
                'platform' => $platform,
                'channel' => $channel,
                'year' => $year,
                'month' => $month,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorizeAccess($request);

        $validated = $request->validate([
            'platform' => ['required', 'string', 'in:' . implode(',', array_keys(AdSpendStat::PLATFORMS))],
            'date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
            'ad_channel' => ['required', 'string', 'in:' . implode(',', array_keys(AdSpendStat::CHANNELS))],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $validated['created_by'] = $request->user()?->id;

        AdSpendStat::create($validated);

        return back()->with('success', 'Data biaya iklan berhasil disimpan.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $this->authorizeAccess($request);

        $record = AdSpendStat::findOrFail($id);

        $validated = $request->validate([
            'platform' => ['required', 'string', 'in:' . implode(',', array_keys(AdSpendStat::PLATFORMS))],
            'date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0'],
            'ad_channel' => ['required', 'string', 'in:' . implode(',', array_keys(AdSpendStat::CHANNELS))],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $record->update($validated);

        return back()->with('success', 'Data biaya iklan berhasil diperbarui.');
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->authorizeAccess($request);

        $record = AdSpendStat::findOrFail($id);
        $record->delete();

        return back()->with('success', 'Data biaya iklan berhasil dihapus.');
    }
}
