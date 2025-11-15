<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\User;
use App\Models\MasterEvent;
use App\Models\AdPlan;
use App\Models\AdResultPlatform;
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

        return Inertia::render('user/dashboard', [
            'rawDataGraphic' => $rawDataGraphic,
            'dashboard_item' => 'Dashboard',
        ]);
    }

    public function dashboardMarketing()
    {
        $rawDataGraphic = $this->getRawDataGraphic();
        $tableData = $this->getTableData();
        $dataHistoris = $this->getDataEvents();

        // dd($rawDataGraphic, $tableData, $dataHistoris);

        return Inertia::render('admin/dashboard_new', [
            'rawDataGraphic' => $rawDataGraphic,
            'tableData' => $tableData,
            'dataHistoris' => $dataHistoris,
            'dashboard_item' => 'Dashboard',
        ]);
    }

    private function getRawDataGraphic()
    {
        $query = AdResultPlatform::with(['result:id,ad_plan_id,revenue', 'result.plan.user:id,name'])
            ->select('id', 'ad_result_id', 'total_cost', 'created_at');

        $user = Auth::user();
        $userName = null;
        if ($user) {
            // If Spatie's package is used, getRoleNames() returns a Collection
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect();
            $userName = $roles->first() ? strtolower($roles->first()) : null;
        }

        // dd($userName);

        if ($userName !== 'admin') {
            $query->whereHas('result.plan.user', function ($q) {
                $q->where('id', Auth::user()->id);
            });
        }

        return $query->get()->map(function ($item) {
            return [
                'pendapatan' => (int) round(optional($item->result)->revenue ?? 0),
                'pengeluaran' => (int) round($item->total_cost ?? 0),
                'month' => $item->created_at->format('Y-m') ?? null,
                'label' => $item->created_at->format('M') ?? null,
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
            })->values();
    }

    private function getTableData()
    {
        $query = AdResultPlatform::with([
            'result.plan.user:id,name',
            'platform:id,name',
        ])->select('id', 'ad_result_id', 'platform_id', 'total_cost', 'created_at');

        $user = Auth::user();
        $userName = null;
        if ($user) {
            // If Spatie's package is used, getRoleNames() returns a Collection
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect();
            $userName = $roles->first() ? strtolower($roles->first()) : null;
        }

        // dd($userName);

        if ($userName !== 'admin') {
            $query->whereHas('result.plan.user', function ($q) {
                $q->where('id', Auth::user()->id);
            });
        }

        return $query->get()
            ->map(function ($item, $key) {
                return [
                    'no' => $key + 1,
                    'user' => optional($item->result->plan->user)->name ? ucfirst(strtolower(optional($item->result->plan->user)->name)) : null,
                    'status' => optional($item->platform)->name,
                    'cost' => "Rp " . (int) round($item->total_cost ?? 0),
                    'date' => $item->created_at->format('F'),
                ];
            });
    }

    private function getDataEvents()
    {
        $query = AdResultPlatform::with([
            'result.plan:id,created_at,event_id,user_id',
            'result.plan.planPlatforms:id,ad_plan_id,end_date',
            'result.plan.event:id,name',
            'result.plan.user:id,name',
            'platform:id,name',
        ])
            ->select('id', 'ad_result_id', 'platform_id', 'total_cost');

        $user = Auth::user();
        $userName = null;
        if ($user) {
            // If Spatie's package is used, getRoleNames() returns a Collection
            $roles = method_exists($user, 'getRoleNames') ? $user->getRoleNames() : collect();
            $userName = $roles->first() ? strtolower($roles->first()) : null;
        }

        // dd($userName);

        if ($userName !== 'admin') {
            $query->whereHas('result.plan.user', function ($q) {
                $q->where('id', Auth::user()->id);
            });
        }

        return $query->get()
            ->map(function ($item, $key) {
                return [
                    'id' => $key + 1,
                    'date' => optional($item->result->plan->planPlatforms->first())->end_date ? optional($item->result->plan->planPlatforms->first())->end_date->format('d M Y') : null,
                    'event_name' => optional($item->result->plan->event)->name,
                    'user_name' => optional($item->result->plan->user)->name ? ucfirst(strtolower(optional($item->result->plan->user)->name)) : null,
                    'amount' => $item->total_cost,
                    'avatar' => "https://i.pravatar.cc/100?img=" . rand(1, 70),
                    'time' => optional($item->result->plan)->created_at->format('H:i:s'),
                    'color' => (function () use ($item) {
                        $type = optional($item->platform)->name;
                        return match ($type) {
                            'Business Suite' => 'bg-primary',
                            'Boost Post'     => 'bg-destructive',
                            'Meta Ads'       => 'bg-green-500',
                            default           => 'bg-gray-400',
                        };
                    })(),
                ];
            });
    }
}
