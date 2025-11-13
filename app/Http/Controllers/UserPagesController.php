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
}
