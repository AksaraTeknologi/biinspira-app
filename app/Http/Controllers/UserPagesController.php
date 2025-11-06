<?php

namespace App\Http\Controllers;

use App\Models\AdPlan;
use App\Models\MasterEvent;
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

    public function adsForm()
    {
        return Inertia::render('user/adsForm', [
            'title_pages' => 'Form Advertise'
        ]);
    }
}