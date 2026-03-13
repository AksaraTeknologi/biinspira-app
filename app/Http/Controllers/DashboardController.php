<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\User;
use App\Models\MasterEvent;
use App\Models\AdPlan;
use App\Models\AdResult;
use App\Models\AdResultPlatform;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            "totalUser" => User::count(),
            "totalEvent" => MasterEvent::count(),
            "totalIklan" => AdPlan::count(),
        ];
        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'dashboard_item' => 'Dashboard',
        ]);
    }

    public function dashboardUser()
    {
        $rawDataGraphic  = $this->getRawDataGraphic();
        $tableData       = $this->getTableData();
        $dataHistoris    = $this->getDataHistories();
        $audiencePerEvent = $this->getAudiencePerEvent(); // ✅ BARU

        return Inertia::render('user/dashboard', [
            'rawDataGraphic'   => $rawDataGraphic,
            'tableData'        => $tableData,
            'dataHistoris'     => $dataHistoris,
            'audiencePerEvent' => $audiencePerEvent, // ✅ BARU
            'dashboard_item'   => 'Dashboard',
        ]);
    }

    public function dashboardMarketing()
    {
        $rawDataGraphic  = $this->getRawDataGraphic();
        $tableData       = $this->getTableData();
        $dataHistoris    = $this->getDataHistories();
        $audiencePerEvent = $this->getAudiencePerEvent(); // ✅ BARU

        return Inertia::render('admin/dashboard_new', [
            'rawDataGraphic'   => $rawDataGraphic,
            'tableData'        => $tableData,
            'dataHistoris'     => $dataHistoris,
            'audiencePerEvent' => $audiencePerEvent, // ✅ BARU
            'dashboard_item'   => 'Dashboard',
        ]);
    }

    // ✅ BARU: Halaman khusus grafik peserta per event
    public function audienceChart()
    {
        $user   = Auth::user();
        $isAdmin = method_exists($user, 'hasRole') && $user->hasRole('admin');

        // Ambil semua event yang tersedia sebagai pilihan filter
        $eventQuery = MasterEvent::select('id', 'name');
        if (!$isAdmin) {
            $eventQuery->where('user_id', $user->id);
        }
        $events = $eventQuery->orderBy('name')->get();

        // Data audience per batch (grafik)
        $audiencePerBatch = $this->getAudiencePerBatch();

        // Data audience per user (cards bawah)
        $audiencePerUser = collect($audiencePerBatch)
            ->groupBy('user_id')
            ->map(function ($batches) {
                $userName = $batches->first()['user_name'];
                // Group by event lalu batch
                $eventGroups = $batches->groupBy('event_id')->map(function ($eventBatches) {
                    return [
                        'event_id'   => $eventBatches->first()['event_id'],
                        'event_name' => $eventBatches->first()['event_name'],
                        'total'      => (int) $eventBatches->sum('audience'),
                        'batches'    => $eventBatches->map(fn($b) => [
                            'batch_number' => $b['batch_number'],
                            'audience'     => $b['audience'],
                            'has_result'   => $b['has_result'],
                        ])->values(),
                    ];
                })->values();

                return [
                    'user_id'   => $batches->first()['user_id'],
                    'user_name' => $userName,
                    'total'     => (int) $batches->sum('audience'),
                    'events'    => $eventGroups,
                ];
            })
            ->sortByDesc('total')
            ->values();

        return Inertia::render(
            $isAdmin ? 'admin/audience-chart' : 'user/audience-chart',
            [
                'events'           => $events,
                'audiencePerBatch' => $audiencePerBatch,
                'audiencePerUser'  => $audiencePerUser,
                'isAdmin'          => $isAdmin,
                'dashboard_item'   => 'Grafik Peserta Per Event',
            ]
        );
    }

    // ✅ BARU: Filter audience per event (dipanggil via AJAX dari halaman baru)
    public function audienceChartFilter(Request $request)
    {
        $eventIds = $request->input('event_ids', []); // array of event id
        $data = $this->getAudiencePerEvent($eventIds);
        return response()->json($data);
    }

    // ─────────────────────────────────────────────
    // Query audience per event (dipakai di dashboard)
    // ─────────────────────────────────────────────
    private function getAudiencePerEvent(array $eventIds = [])
    {
        $user    = Auth::user();
        $isAdmin = method_exists($user, 'hasRole') && $user->hasRole('admin');

        $query = AdResult::with([
            'plan:id,event_id,user_id',
            'plan.event:id,name',
        ])->select('id', 'ad_plan_id', 'checkout_count');

        if (!$isAdmin) {
            $query->whereHas('plan', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        if (!empty($eventIds)) {
            $query->whereHas('plan', function ($q) use ($eventIds) {
                $q->whereIn('event_id', $eventIds);
            });
        }

        return $query->get()
            ->groupBy(fn($item) => $item->plan?->event?->id)
            ->map(function ($items, $eventId) {
                $firstItem = $items->first();
                return [
                    'event_id'   => $eventId,
                    'event_name' => $firstItem->plan?->event?->name ?? 'Unknown',
                    'audience'   => (int) $items->sum('checkout_count'),
                ];
            })
            ->sortByDesc('audience')
            ->values();
    }

    // ─────────────────────────────────────────────
    // Query audience per batch (dipakai di audience-chart)
    // Batch = urutan AdPlan per event by created_at
    // ─────────────────────────────────────────────
    private function getAudiencePerBatch(array $eventIds = [])
    {
        $user    = Auth::user();
        $isAdmin = method_exists($user, 'hasRole') && $user->hasRole('admin');

        $planQuery = AdPlan::with([
            'event:id,name',
            'user:id,name',
        ])->select('id', 'event_id', 'user_id', 'created_at')
          ->orderBy('user_id')
          ->orderBy('event_id')
          ->orderBy('created_at');

        if (!$isAdmin) {
            $planQuery->where('user_id', $user->id);
        }

        if (!empty($eventIds)) {
            $planQuery->whereIn('event_id', $eventIds);
        }

        $plans = $planQuery->get();

        // Nomor batch per event
        $batchCounter = [];
        $plans->each(function ($plan) use (&$batchCounter) {
            $eid = $plan->event_id;
            $batchCounter[$eid] = ($batchCounter[$eid] ?? 0) + 1;
            $plan->batch_number = $batchCounter[$eid];
        });

        // Ambil results sekaligus
        $planIds = $plans->pluck('id');
        $results = AdResult::whereIn('ad_plan_id', $planIds)
                    ->select('ad_plan_id', 'checkout_count')
                    ->get()
                    ->keyBy('ad_plan_id');

        return $plans->map(function ($plan) use ($results) {
            $result   = $results->get($plan->id);
            $audience = $result ? (int) $result->checkout_count : 0;
            return [
                'ad_plan_id'   => $plan->id,
                'event_id'     => $plan->event_id,
                'event_name'   => $plan->event?->name ?? 'Unknown',
                'user_id'      => $plan->user_id,
                'user_name'    => $plan->user?->name ?? 'Unknown',
                'batch_number' => $plan->batch_number,
                'label'        => ($plan->event?->name ?? 'Event') . ' - Batch ' . $plan->batch_number,
                'short_label'  => 'B' . $plan->batch_number,
                'audience'     => $audience,
                'has_result'   => $result !== null,
            ];
        })->values();
    }

    // ─────────────────────────────────────────────
    // Methods yang sudah ada (tidak diubah)
    // ─────────────────────────────────────────────
    private function groupByWeek(Collection $items)
    {
        return $items->groupBy(function ($item) {
            $date = Carbon::parse($item['date']);
            return $date->format('Y-m') . '-W' . $date->weekOfMonth;
        });
    }

    private function groupByEvent(Collection $items)
    {
        return $items->groupBy(function ($item) {
            return $item['id'];
        });
    }

    private function getRawDataGraphic()
    {
        $query = AdResultPlatform::with([
            'result:id,ad_plan_id,checkout_count,revenue',
            'result.plan.user:id,name',
            'result.plan.planPlatforms:id,ad_plan_id,end_date,audience_target',
        ])->select('id', 'ad_result_id', 'total_cost', 'created_at');

        $user = Auth::user();
        $userName = null;
        if ($user) {
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect();
            $userName = $roles->first() ? strtolower($roles->first()) : null;
        }

        if ($userName !== 'admin') {
            $query->whereHas('result.plan.user', function ($q) {
                $q->where('id', Auth::user()->id);
            });
        }

        $query->whereHas(
            'result.plan.planPlatforms',
            fn($q) =>
            $q->whereBetween('end_date', [
                now()->subMonths(11)->startOfMonth(),
                now()->endOfMonth()
            ])
        );

        $raw = $query->get()->map(function ($item, $key) {
            $platforms = $item->result->plan->planPlatforms;

            return [
                'id'          => $item->result?->id,
                'event_name'  => $item->result->plan->event?->name,
                'event_label' => $key + 1,
                'date'        => optional($platforms->first()?->end_date)->toDateString(),
                'month_key'   => optional($platforms->first()?->end_date)->format('Y-m'),
                'month_label' => optional($platforms->first()?->end_date)->format('M'),
                'pendapatan'  => (int) $item->result?->revenue,
                'pengeluaran' => (int) $item->total_cost,
                'audience'    => (int) $item->result?->checkout_count,
                'user'        => ucfirst(strtolower($item->result->plan->user?->name)),
            ];
        });

        $bulanan = $raw
            ->groupBy('month_key')
            ->map(fn($i) => [
                'user'        => $i->first()['user'],
                'month'       => $i->first()['month_label'],
                'pendapatan'  => $i->sum('pendapatan'),
                'pengeluaran' => $i->sum('pengeluaran'),
                'audience'    => $i->sum('audience'),
            ])
            ->sortKeys()
            ->values();

        $mingguan = $this->groupByWeek($raw)
            ->map(function ($items, $weekKey) {
                $firstDate = Carbon::parse($items->first()['date']);
                return [
                    'week'        => 'Minggu ' . $firstDate->weekOfMonth,
                    'month'       => $firstDate->format('M'),
                    'year'        => $firstDate->year,
                    'pendapatan'  => $items->sum('pendapatan'),
                    'pengeluaran' => $items->sum('pengeluaran'),
                    'audience'    => $items->sum('audience'),
                ];
            })
            ->values();

        $event = $this->groupByEvent($raw)
            ->map(fn($i) => [
                'event_name'  => $i->first()['event_name'],
                'event_label' => "E" . $i->first()['event_label'],
                'pendapatan'  => $i->sum('pendapatan'),
                'pengeluaran' => $i->sum('pengeluaran'),
                'audience'    => $i->sum('audience'),
            ])
            ->values();

        return [
            'bulanan'  => $bulanan,
            'mingguan' => $mingguan,
            'event'    => $event,
        ];
    }

    private function getTableData()
    {
        $query = AdResultPlatform::with([
            'result:id,ad_plan_id,revenue,checkout_count',
            'result.plan.user:id,name',
            'result.plan.planPlatforms:id,ad_plan_id,end_date',
            'platform:id,name',
        ])->select('id', 'ad_result_id', 'platform_id', 'total_cost', 'created_at');

        $user = Auth::user();
        $userName = null;
        if ($user) {
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect();
            $userName = $roles->first() ? strtolower($roles->first()) : null;
        }

        if ($userName !== 'admin') {
            $query->whereHas('result.plan.user', function ($q) {
                $q->where('id', Auth::user()->id);
            });
        }

        $query->where('created_at', '>=', now()->subMonths(6)->startOfMonth());

        return $query->get()
            ->map(function ($item, $key) {
                return [
                    'no'         => $key + 1,
                    'id'         => $item->id,
                    'plan_id'    => $item->result->ad_plan_id,
                    'user'       => optional($item->result->plan->user)->name
                        ? ucfirst(strtolower(optional($item->result->plan->user)->name))
                        : null,
                    'event_name' => $item->result->plan->event?->name,
                    'audience'   => $item->result->checkout_count,
                    'status'     => optional($item->platform)->name,
                    'cost'       => 'Rp ' . number_format((int) round($item->total_cost ?? 0), 0, ',', '.'),
                    'omset'      => (int) round(optional($item->result)->revenue ?? 0),
                    'date'       => optional($item->result->plan->planPlatforms->first())->end_date
                        ? optional($item->result->plan->planPlatforms->first())->end_date->format('F')
                        : null,
                    'ordinal'    => optional($item->result->plan->planPlatforms->first())->end_date
                        ? optional($item->result->plan->planPlatforms->first())->end_date->format('Y-m-d')
                        : null,
                ];
            })
            ->sortByDesc('ordinal')
            ->values()
            ->map(fn($item) => $item);
    }

    private function getDataHistories()
    {
        $query = AdPlan::with([
            'user:id,name,avatar',
            'event:id,name',
            'results:id,ad_plan_id,created_at',
            'results.resultPlatforms:id,ad_result_id,platform_id,total_cost,created_at',
            'planPlatforms:id,ad_plan_id,platform_id',
            'planPlatforms.platform:id,name',
        ])->select('id', 'user_id', 'event_id', 'created_at');

        $user = Auth::user();
        $userName = null;
        if ($user) {
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect();
            $userName = $roles->first() ? strtolower($roles->first()) : null;
        }

        if ($userName !== 'admin') {
            $query->where('user_id', Auth::id());
        }

        $query->whereBetween('created_at', [
            now()->subMonths(11)->startOfMonth(),
            now()->endOfMonth(),
        ]);

        return $query->get()
            ->map(function ($item, $key) {
                $firstResult   = $item->results->first();
                $firstPlatform = $firstResult ? $firstResult->resultPlatforms->first() : null;
                $totalCost     = $firstPlatform ? $firstPlatform->total_cost : null;
                $firstPlanPlatform = $item->planPlatforms->first();

                return [
                    'id'         => $key + 1,
                    'date'       => $item->created_at->format('d M Y'),
                    'event_name' => $item->event?->name,
                    'user_name'  => $item->user?->name
                        ? ucfirst(strtolower($item->user->name))
                        : null,
                    'amount'     => $totalCost === null
                        ? '-'
                        : number_format((int) round($totalCost), 0, ',', '.'),
                    'avatar'     => $item->user?->avatar ?: null,
                    'time'       => $item->created_at->format('H:i:s'),
                    'color'      => (function () use ($firstPlanPlatform) {
                        $type = $firstPlanPlatform?->platform?->name;
                        return match ($type) {
                            'Business Suite' => 'bg-chart-1',
                            'Boost Post'     => 'bg-chart-3',
                            'Meta Ads'       => 'bg-chart-2',
                            default          => 'bg-[#ccb8a5]',
                        };
                    })(),
                    'created_at' => $item->created_at,
                ];
            })
            ->sortByDesc(fn($i) => $i['created_at'] ?? Carbon::now())
            ->values()
            ->map(function ($item) {
                unset($item['created_at']);
                return $item;
            });
    }
}