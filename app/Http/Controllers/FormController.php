<?php

namespace App\Http\Controllers;

use App\Models\AdPlan;
use App\Models\AdPlanPlatform;
use Illuminate\Http\Request;
use App\Models\AdResult;
use App\Models\MasterAdGoal;
use App\Models\MasterEvent;
use App\Models\MasterPlatform;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;

class FormController extends Controller
{
    /**
     * Tampilkan form input dan data hasil iklan
     */
    public function planForm()
    {
        $events = MasterEvent::query()
            ->select('master_events.id as event_id', 'master_events.name as event_name')
            ->get()
            ->map(fn($item) => [
                'id' => $item->event_id,
                'name' => $item->event_name,
            ]);

        $platforms = MasterPlatform::query()
            ->select('master_platforms.id as platform_id', 'master_platforms.name as platform_name')
            ->get()
            ->map(fn($item) => [
                'id' => $item->platform_id,
                'name' => $item->platform_name,
            ]);

        $goals = MasterAdGoal::all();

        // dd($events, $platforms);

        return Inertia::render('user/adsForm', [
            'title_pages' => 'Add Advertise',
            'events' => $events,
            'platforms' => $platforms,
            'goals' => $goals,
        ]);
    }

    /**
     * Simpan hasil iklan baru
     */
    public function AdPlanStore(Request $request)
    {
        return response()->json([
            'message' => 'Ad plan platform berhasil disimpan',
        ]);
    }

    /**
     * Simpan hasil iklan baru
     */
    public function AdResultStore(Request $request)
    {
        return response()->json([
            'message' => 'REsult Iklan berhasil disimpan!',
        ]);
    }
    /**
     * Simpan hasil iklan baru
     */
    public function AdEvalStore(Request $request)
    {
        return response()->json([
            'message' => 'Evaluasi Iklan berhasil disimpan!',
        ]);
    }
}
