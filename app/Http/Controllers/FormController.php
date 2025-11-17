<?php

namespace App\Http\Controllers;

use App\Models\AdMetric;
use App\Models\AdPlan;
use App\Models\AdPlanPlatform;
use Illuminate\Http\Request;
use App\Models\AdResult;
use App\Models\AdResultPlatform;
use App\Models\MasterAdGoal;
use App\Models\MasterEvent;
use App\Models\MasterPlatform;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;

class FormController extends Controller
{
    public function show($id)
    {
        $request = AdPlan::with([
            'user',
            'event',
            'planPlatforms.platform',
            'planPlatforms.goal',
            'results.resultPlatforms.metrics',
            'evaluations'
        ])
            ->where('id', $id)
            ->first(); // gunakan first, bukan get()

        return Inertia::render('admin/marketing-show', [
            'data' => [
                'user_name'    => $request->user->name ?? null,
                'name_event'   => $request->event->name ?? null,
                'status'       => $request->status ?? null,

                'platforms'    => $request->planPlatforms->map(function ($pp) {
                    return [
                        'start_date'      => $pp->start_date->format('d M Y'),
                        'end_date'        => $pp->end_date->format('d M Y'),
                        'platform_name'   => $pp->platform->name ?? null,
                        'goal_name'       => $pp->goal->name ?? null,
                        'targetType'      => $pp->audience_type,
                        'targetValue'     => $pp->audience_target,
                        'daily_budget'    => $pp->daily_budget,

                        'age_broad'       => $pp->age_broad,
                        'location_broad'  => $pp->location_broad,

                        'age_targeted'    => $pp->age_targeted,
                        'location_targeted' => $pp->location_targeted,
                        'type_targeted'   => $pp->type_audience_targeted,
                        'name_targeted'   => $pp->name_audience_targeted,
                    ];
                }),

                'result' => $request->results->map(function ($r) {
                    return [
                        'checkout_count' => $r->checkout_count,
                        'revenue'        => $r->revenue,

                        'result_platforms' => $r->resultPlatforms->map(function ($rp) {
                            return [
                                'result'       => $rp->result,
                                'total_cost'   => $rp->total_cost,
                                'platform_name' => $rp->platform->name,

                                'metrics' => $rp->metrics->map(function ($m) {
                                    return [
                                        'reach'               => $m->reach,
                                        'impressions'         => $m->impressions,
                                        'cpr'                 => $m->cost_per_result,
                                        'clicks'              => $m->clicks,
                                        'likes'               => $m->likes,
                                        'saves'               => $m->saves,
                                        'shares'              => $m->shares,
                                        'profile_visits'      => $m->profile_visits,
                                        'follows'             => $m->folows,
                                        'direct_messages'     => $m->direct_messages,
                                        'external_link_clicks' => $m->external_link_clicks,
                                        'result_ads'          => $m->result_ads,
                                    ];
                                }),
                            ];
                        }),
                    ];
                }),

                'evaluation' => $request->evaluations->map(function ($ev) {
                    return [
                        'previous_event'           => $ev->previous_event_name,
                        'previous_checkout'        => $ev->previous_checkout,
                        'previous_ad_performance'  => $ev->previous_ad_performance,
                        'previous_other_performance' => $ev->previous_other_performance,
                        'current_checkout'         => $ev->current_checkout,
                        'current_ad_performance'   => $ev->current_ad_performance,
                        'current_other_performance' => $ev->current_other_performance,
                        'next_ad_strategy'         => $ev->next_ad_strategy,
                    ];
                }),
            ]
        ]);
    }

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
        dd($request->all());

        return response()->json([
            'message' => 'Ad plan platform berhasil disimpan',
        ]);
    }

    /**
     * Simpan hasil iklan baru
     */
    public function AdResultStore(Request $request)
    {
        dd($request->all());

        return response()->json([
            'message' => 'REsult Iklan berhasil disimpan!',
        ]);
    }
    /**
     * Simpan hasil iklan baru
     */
    public function AdEvalStore(Request $request)
    {
        dd($request->all());

        return response()->json([
            'message' => 'Evaluasi Iklan berhasil disimpan!',
        ]);
    }
}
