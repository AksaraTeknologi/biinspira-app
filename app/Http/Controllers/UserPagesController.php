<?php

namespace App\Http\Controllers;

use App\Models\AdPlan;
use App\Models\MasterEvent;
use App\Models\MasterPlatform;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;

class UserPagesController extends Controller
{
    public function dashboard()
    {
        $stats = [
            "totalUser" => User::count(),
            "totalEvent" => MasterEvent::count(),
            "totalIklan" => AdPlan::count(),
        ];
        return Inertia::render('user/dashboard', [
            'stats' => $stats,
            'dashboard_item' => 'Dashboard',
        ]);
    }

    public function marketing()
    {
        // data tabel
        // Dummy data (sementara, sebelum ambil dari DB)
        $adPlans = [
            [
                'id' => '1',
                'status' => 'draft',
                'event' => [
                    'name' => 'Peluncuran Produk Baru',
                    'platform' => 'facebook',
                    'event_date' => '2025-11-15',
                ],
            ],
            [
                'id' => '2',
                'status' => 'completed',
                'event' => [
                    'name' => 'Workshop Digital Marketing',
                    'platform' => 'instagram',
                    'event_date' => '2025-12-01',
                ],
            ],
            [
                'id' => '3',
                'status' => 'draft',
                'event' => [
                    'name' => 'Seminar UMKM Go Online',
                    'platform' => 'youtube',
                    'event_date' => '2026-01-10',
                ],
            ],
        ];

        // render view
        return Inertia::render('user/marketing', [
            'title_pages' => 'Marketing',
            'ad_plans' => $adPlans
        ]);
    }

    // public function planForm()
    // {
    //     $events = AdPlan::query()
    //         ->join('master_events', 'ad_plans.event_id', '=', 'master_events.id')
    //         ->select('ad_plans.id as ad_plan_id', 'master_events.name as event_name')
    //         ->get()
    //         ->map(fn($item) => [
    //             'id' => $item->ad_plan_id,
    //             'name' => $item->event_name,
    //         ]);

    //     $platforms = MasterPlatform::query()
    //         ->select('master_platforms.id as platform_id', 'master_platforms.name as platform_name')
    //         ->get()
    //         ->map(fn($item) => [
    //             'id' => $item->platform_id,
    //             'name' => $item->platform_name,
    //         ]);

    //     // dd($events, $platforms);

    //     return Inertia::render('user/adsForm', [
    //         'title_pages' => 'Add Advertise',
    //         'events' => $events,
    //         'platforms' => $platforms,
    //     ]);
    // }
}
