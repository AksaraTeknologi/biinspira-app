<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\User;
use App\Models\MasterEvent;
use App\Models\AdPlan;
use App\Models\AdResultPlatform;
use Illuminate\Support\Carbon;
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

        // dd($dataHistoris);

        return Inertia::render('admin/dashboard_new', [
            'rawDataGraphic' => $rawDataGraphic,
            'tableData' => $tableData,
            'dataHistoris' => $dataHistoris,
            'dashboard_item' => 'Dashboard',
        ]);
    }

    private function getRawDataGraphic()
    {
        $query = AdResultPlatform::with([
            'result:id,ad_plan_id,revenue',
            'result.plan.user:id,name',
            'result.plan.planPlatforms:id,ad_plan_id,end_date',
        ])->select('id', 'ad_result_id', 'total_cost', 'created_at');

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

        // filter hanya mengambi 12 bulan terakhir
        $query->whereHas('result.plan.planPlatforms', function ($q) {
            $q->whereBetween('end_date', [
                now()->subMonths(11)->startOfMonth(),
                now()->endOfMonth()
            ]);
        });

        return $query->get()->map(function ($item) {
            return [
                'pendapatan' => (int) round(optional($item->result)->revenue ?? 0),
                'pengeluaran' => (int) round($item->total_cost ?? 0),
                // 'month' => $item->created_at->format('Y-m') ?? null,
                'month' => optional($item->result->plan->planPlatforms->first())->end_date ? optional($item->result->plan->planPlatforms->first())->end_date->format('Y-m') : null,
                // 'label' => $item->created_at->format('M') ?? null,
                'label' => optional($item->result->plan->planPlatforms->first())->end_date ? optional($item->result->plan->planPlatforms->first())->end_date->format('M') : null,
                'user' => optional($item->result->plan->user)->name ? ucfirst(strtolower(optional($item->result->plan->user)->name)) : null,
            ];
        })
            ->groupBy('month')->map(function ($i, $mK) {
                return [
                    'user' => $i->first()['user'],
                    'month'      => $i->first()['label'],
                    'pendapatan' => $i->sum('pendapatan'),
                    'pengeluaran' => $i->sum('pengeluaran'),
                ];
            })->sortBy(function ($item, $key) {  // <<< SORT DI SINI
                return $key;                   // key = "Y-m" format → auto ascending
            })->values();
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
            'results.resultPlatforms.platform:id,name',
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

        // dd($query->get());

        return $query->get()
            ->map(function ($item, $key) {
                $firstResult = $item->results->first();
                $firstPlatform = $firstResult ? $firstResult->resultPlatforms->first() : null;
                $totalCost = $firstPlatform ? $firstPlatform->total_cost : null;

                return [
                    'id' => $key + 1,
                    'date' => $item->created_at->format('d M Y'),
                    'event_name' => $item->event?->name,
                    'user_name' => $item->user?->name ? ucfirst(strtolower($item->user->name)) : null,
                    'amount' => $totalCost === null ? '-' : number_format((int) round($totalCost), 0, ',', '.'),
                    'avatar' => $item->user?->avatar ?: null,
                    'time' => $item->created_at->format('H:i:s'),
                    'color' => (function () use ($firstPlatform) {
                       $type = $firstPlatform?->platform?->name;
                        return match ($type) {
                            'Business Suite' => 'bg-primary',
                            'Boost Post'     => 'bg-destructive',
                            'Meta Ads'       => 'bg-green-500',
                            default           => 'bg-gray-400',
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
