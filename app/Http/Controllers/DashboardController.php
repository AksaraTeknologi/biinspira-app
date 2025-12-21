<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\User;
use App\Models\MasterEvent;
use App\Models\AdPlan;
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
        $rawDataGraphic = $this->getRawDataGraphic();
        $tableData = $this->getTableData();
        $dataHistoris = $this->getDataHistories();

        // dd($tableData);

        return Inertia::render('user/dashboard', [
            'rawDataGraphic' => $rawDataGraphic,
            'tableData' => $tableData,
            'dataHistoris' => $dataHistoris,
            'dashboard_item' => 'Dashboard',
        ]);
    }

    public function dashboardMarketing()
    {
        $rawDataGraphic = $this->getRawDataGraphic();
        $tableData = $this->getTableData();
        $dataHistoris = $this->getDataHistories();

        // dd($rawDataGraphic);

        return Inertia::render('admin/dashboard_new', [
            'rawDataGraphic' => $rawDataGraphic,
            'tableData' => $tableData,
            'dataHistoris' => $dataHistoris,
            'dashboard_item' => 'Dashboard',
        ]);
    }

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

        // role filtering
        $user = Auth::user();
        $userName = null;
        if ($user) {
            // If Spatie's package is used, getRoleNames() returns a Collection
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect();
            $userName = $roles->first() ? strtolower($roles->first()) : null;
        }

        if ($userName !== 'admin') {
            $query->whereHas('result.plan.user', function ($q) {
                $q->where('id', Auth::user()->id);
            });
        }

        // 📅 12 bulan terakhir
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
                // 'event_date' => optional($platforms->first()?->end_date)->format('d/n/y'),
                'date'        => optional($platforms->first()?->end_date)->toDateString(),
                'month_key'   => optional($platforms->first()?->end_date)->format('Y-m'),
                'month_label' => optional($platforms->first()?->end_date)->format('M'),
                'pendapatan'  => (int) $item->result?->revenue,
                'pengeluaran' => (int) $item->total_cost,
                'audience'    => (int) $item->result?->checkout_count,
                'user'        => ucfirst(strtolower($item->result->plan->user?->name)),
            ];
        });

        // ======================
        // Mounthly
        // ======================
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

        // ======================
        // Weekly
        // ======================
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

        // ======================
        // Events
        // ======================
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
            'result:id,ad_plan_id,revenue',
            'result.plan.user:id,name',
            'result.plan.planPlatforms:id,ad_plan_id,end_date',
            'platform:id,name',
        ])->select('id', 'ad_result_id', 'platform_id', 'total_cost', 'created_at');

        $user = Auth::user();
        $userName = null;
        if ($user) {
            // If Spatie's package is used, getRoleNames() returns a Collection
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect();
            $userName = $roles->first() ? strtolower($roles->first()) : null;
        }

        if ($userName !== 'admin') {
            $query->whereHas('result.plan.user', function ($q) {
                $q->where('id', Auth::user()->id);
            });
        }

        // filter hanya mengambi 6 bulan terakhir
        $query->where('created_at', '>=', now()->subMonths(6)->startOfMonth());

        return $query->get()
            ->map(function ($item, $key) {
                return [
                    'no' => $key + 1,
                    'id' => $item->id,
                    'plan_id' => $item->result->ad_plan_id,
                    'user' => optional($item->result->plan->user)->name ? ucfirst(strtolower(optional($item->result->plan->user)->name)) : null,
                    'status' => optional($item->platform)->name,
                    'cost' => 'Rp ' . number_format((int) round($item->total_cost ?? 0), 0, ',', '.'),
                    'omset' => (int) round(optional($item->result)->revenue ?? 0),
                    'date' => $item->created_at->format('F'),
                    'ordinal' => $item->created_at->format('Y-m-d'),
                    // 'date' => optional($item->result->plan->planPlatforms->first())->end_date ? optional($item->result->plan->planPlatforms->first())->end_date->format('F') : null,
                    // 'ordinal' => optional($item->result->plan->planPlatforms->first())->end_date ? optional($item->result->plan->planPlatforms->first())->end_date->format('Y-m-d') : null,
                ];
            })  // 🔥 SORT berdasarkan tanggal asli
            ->sortByDesc('ordinal')
            ->values()
            ->map(function ($item) {
                return $item;
            });
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
            // If Spatie's package is used, getRoleNames() returns a Collection
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect();
            $userName = $roles->first() ? strtolower($roles->first()) : null;
        }

        // non-admin users only see their own plans
        if ($userName !== 'admin') {
            $query->where('user_id', Auth::id());
        }

        // filter hanya mengambil 11 bulan terakhir
        $query->whereBetween('created_at', [
            now()->subMonths(11)->startOfMonth(),
            now()->endOfMonth(),
        ]);

        return $query->get()
            ->map(function ($item, $key) {
                $firstResult = $item->results->first();
                $firstPlatform = $firstResult ? $firstResult->resultPlatforms->first() : null;
                $totalCost = $firstPlatform ? $firstPlatform->total_cost : null;
                $firstPlanPlatform = $item->planPlatforms->first();

                return [
                    'id' => $key + 1,
                    'date' => $item->created_at->format('d M Y'),
                    'event_name' => $item->event?->name,
                    'user_name' => $item->user?->name ? ucfirst(strtolower($item->user->name)) : null,
                    'amount' => $totalCost === null ? '-' : number_format((int) round($totalCost), 0, ',', '.'),
                    'avatar' => $item->user?->avatar ?: null,
                    'time' => $item->created_at->format('H:i:s'),
                    'color' => (function () use ($firstPlanPlatform) {
                        $type = $firstPlanPlatform?->platform?->name;
                        return match ($type) {
                            'Business Suite' => 'bg-chart-1',
                            'Boost Post'     => 'bg-chart-3',
                            'Meta Ads'       => 'bg-chart-2',
                            default           => 'bg-[#ccb8a5]',
                        };
                    })(),
                    // include created_at for reliable sorting, will be removed before returning to front-end
                    'created_at' => $item->created_at,
                ];
            })
            ->sortByDesc(function ($i) {
                return $i['created_at'] ?? Carbon::now();
            })
            ->values()
            ->map(function ($item) {
                unset($item['created_at']);
                return $item;
            });
    }
}
