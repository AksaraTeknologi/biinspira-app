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
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;


class FormController extends Controller
{
protected function calculateCurrentTotals(AdPlan $plan)
{
    $checkout = $plan->results?->sum('checkout_count') ?? 0;
    $revenue  = $plan->results?->sum('revenue') ?? 0;
    $cost     = $plan->results?->sum(fn($r) => $r->resultPlatforms?->sum('total_cost') ?? 0) ?? 0;

    return compact('checkout', 'revenue', 'cost');
}

protected function getPreviousPlans(AdPlan $plan)
{
    // Ambil tanggal sekarang dari plan
    $currentDate = $plan->created_at;

    // Hitung range bulan: bulan sebelumnya sampai bulan sekarang
    $startOfPrevMonth   = Carbon::parse($currentDate)->subMonth()->startOfMonth();
    $endOfCurrentMonth  = Carbon::parse($currentDate)->endOfMonth();

    // Ambil semua plan dari user yang sama, event yang sama, dan dalam range bulan
    $plans = AdPlan::with(['event', 'results.resultPlatforms.metrics'])
        ->where('user_id', $plan->user_id)
        ->where('event_id', $plan->event_id) // pastikan event sama
        ->where('id', '<>', $plan->id)      // exclude plan sekarang
        ->whereBetween('created_at', [$startOfPrevMonth, $endOfCurrentMonth])
        ->orderBy('created_at', 'asc')
        ->get();

    return $plans;
}

protected function buildEventGraph($plans)
{
    return $plans->map(fn($plan, $index) => [
        'event_name'  => $plan->event->name ?? 'Event',
        'event_label' => 'B' . ($index + 1),
        'pendapatan'  => $plan->results?->sum('revenue') ?? 0,
        'pengeluaran' => $plan->results?->sum(fn($r) => $r->resultPlatforms?->sum('total_cost') ?? 0) ?? 0,
        'audience'    => $plan->results?->sum('checkout_count') ?? 0,
    ]);
}

public function show($id)
{
 $plan = AdPlan::with([
        'user',
        'event',
        'planPlatforms.platform',
        'planPlatforms.goal',
        'results.resultPlatforms.platform',
        'results.resultPlatforms.metrics',
        'evaluations'
    ])->findOrFail($id);

    $totals = $this->calculateCurrentTotals($plan);

$currentDate = $plan->created_at;
$startOfPrevMonth = Carbon::parse($currentDate)->subMonth()->startOfMonth();
$endOfCurrentMonth = Carbon::parse($currentDate)->endOfMonth();

$plansForGraph = AdPlan::with(['results.resultPlatforms'])
    ->where('user_id', $plan->user_id)
    ->where('event_id', $plan->event_id)
    ->whereBetween('created_at', [$startOfPrevMonth, $endOfCurrentMonth])
    ->get();

$graphBulanan = $plansForGraph
    ->groupBy(fn($p) => $p->created_at->format('M-Y'))
    ->map(fn($plansInMonth, $month) => [
        'month' => $month,
        'pendapatan' => $plansInMonth->sum(fn($p) => $p->results?->sum('revenue') ?? 0),
        'pengeluaran' => $plansInMonth->sum(fn($p) => $p->results?->sum(fn($r) => $r->resultPlatforms?->sum('total_cost') ?? 0) ?? 0),
        'audience' => $plansInMonth->sum(fn($p) => $p->results?->sum('checkout_count') ?? 0),
    ])
    ->values();

$graphMingguan = $plansForGraph
    ->groupBy(fn($p) => 'Week ' . Carbon::parse($p->created_at)->weekOfMonth)
    ->map(fn($plansInWeek, $week) => [
        'week' => $week,
        'pendapatan' => $plansInWeek->sum(fn($p) => $p->results?->sum('revenue') ?? 0),
        'pengeluaran' => $plansInWeek->sum(fn($p) => $p->results?->sum(fn($r) => $r->resultPlatforms?->sum('total_cost') ?? 0) ?? 0),
        'audience' => $plansInWeek->sum(fn($p) => $p->results?->sum('checkout_count') ?? 0),
    ])
    ->values();

// Graph event (sesuai function buildEventGraph)
$eventGraph = $this->buildEventGraph($plansForGraph);

$graphData = [
    'bulanan' => $graphBulanan,
    'mingguan' => $graphMingguan, // gunakan hasil hitung otomatis
    'event' => $eventGraph,
];
$previousPlan = null;

if (!is_null($plan->batch)) {
    $previousPlan = AdPlan::where('batch', '<', $plan->batch)
        ->where('event_id', $plan->event_id)
        ->orderBy('batch', 'desc')
        ->first();
}
        return Inertia::render('admin/marketing-show', [
            'graphData' => $graphData,

            'data' => [
                'id'           => $plan->id ?? null,
                'user_name'    => $plan->user->name ?? null,
                'name_event'   => $plan->event->name ?? null,
                'batch' => $plan->batch ?? null, 
                'previous_batch' => $previousPlan?->batch ?? null, 
                'event_batch' => $plan->event?->batch ?? null,
                'status'       => $plan->status ?? null,
                'ad_schedule_time' => $plan->ad_schedule_time ?? null,
                'title_flayer' => $plan->title_flayer ?? null,
                'image_flayer' => $plan->image_flayer ? asset('storage/' . $plan->image_flayer) : null,

           

                'platforms'    => $plan->planPlatforms->map(function ($pp) {
                    return [
                        'start_date'      => $pp->start_date->format('d M Y'),
                        'end_date'        => $pp->end_date->format('d M Y'),
                        'platform_name'   => $pp->platform->name ?? null,
                        'goal_name'       => $pp->goal->name ?? null,
                        'targetType'      => $pp->audience_type,
                        'targetValue'     => $pp->audience_target  !== null ? number_format((float)$pp->audience_target, 0, ',', '.') : null,
                        'daily_budget'    => $pp->daily_budget !== null ? number_format((float)$pp->daily_budget, 0, ',', '.') : null,

                        'age_broad'       => $pp->age_broad,
                        'location_broad'  => $pp->location_broad,

                        'age_targeted'    => $pp->age_targeted,
                        'location_targeted' => $pp->location_targeted,
                        'type_targeted'   => $pp->type_audience_targeted,
                        'name_targeted'   => $pp->name_audience_targeted,
                    ];
                }),

                'result' => $plan->results->map(function ($r) {
                    return [
                        'checkout_count' => $r->checkout_count !== null ? number_format((float)$r->checkout_count, 0, ',', '.') : null,
                        'revenue'        => $r->revenue !== null ? number_format((float)$r->revenue, 0, ',', '.') : null,

                        'result_platforms' => $r->resultPlatforms->map(function ($rp) {
                            return [
                                'result'       => $rp->result !== null ? number_format((float)$rp->result, 0, ',', '.') : null,
                                'total_cost'   => $rp->total_cost !== null ? number_format((float)$rp->total_cost, 0, ',', '.') : null,
                                'platform_name' => $rp->platform->name,

                                'metrics' => $rp->metrics->map(function ($m) {
                                    return [
                                        'reach'               => $m->reach !== null ? number_format((float)$m->reach, 0, ',', '.') : null,
                                        'impressions'         => $m->impressions !== null ? number_format((float)$m->impressions, 0, ',', '.') : null,
                                        'cpr'                 => $m->cost_per_result !== null ? number_format((float)$m->cost_per_result, 0, ',', '.') : null,
                                        'clicks'              => $m->clicks !== null ? number_format((float)$m->clicks, 0, ',', '.') : null,
                                        'likes'               => $m->likes !== null ? number_format((float)$m->likes, 0, ',', '.') : null,
                                        'saves'               => $m->saves !== null ? number_format((float)$m->saves, 0, ',', '.') : null,
                                        'shares'              => $m->shares !== null ? number_format((float)$m->shares, 0, ',', '.') : null,
                                        'profile_visits'      => $m->profile_visits !== null ? number_format((float)$m->profile_visits, 0, ',', '.') : null,
                                        'follows'             => $m->folows !== null ? number_format((float)$m->folows, 0, ',', '.') : null,
                                        'direct_messages'     => $m->direct_messages !== null ? number_format((float)$m->direct_messages, 0, ',', '.') : null,
                                        'external_link_clicks' => $m->external_link_clicks !== null ? number_format((float)$m->external_link_clicks, 0, ',', '.') : null,
                                        'result_ads'          => $m->result_ads !== null ? number_format((float)$m->result_ads, 0, ',', '.') : null,
                                        'click_whatsapp'       => $m->click_whatsapp !== null ? number_format((float)$m->click_whatsapp, 0, ',', '.') : null,
                                        'chat_admin'       => $m->chat_admin !== null ? number_format((float)$m->chat_admin, 0, ',', '.') : null,
                                    ];
                                }),
                            ];
                        }),
                    ];
                }),

                'evaluation' => $plan->evaluations->map(function ($ev) {
                    return [
                        'previous_event'           => $ev->previous_event_name,
                        'previous_checkout'        => $ev->previous_checkout !== null ? number_format((float)$ev->previous_checkout, 0, ',', '.') : null,
                        'previous_ad_performance'  => $ev->previous_ad_performance,
                        'previous_other_performance' => $ev->previous_other_performance,
                        'current_checkout'         => $ev->current_checkout !== null ? number_format((float)$ev->current_checkout, 0, ',', '.') : null,
                        'current_ad_performance'   => $ev->current_ad_performance,
                        'current_other_performance' => $ev->current_other_performance,
                        'next_ad_strategy'         => $ev->next_ad_strategy,
                    ];
                }),
            ]

            
            
        ]);
    }



    public function generatePDF($id)
    {
        $request = AdPlan::with([
            'user',
            'event',
            'planPlatforms.platform',
            'planPlatforms.goal',
            'results.resultPlatforms.metrics',
            'evaluations'
        ])->findOrFail($id);

        $data = [
            'id'           => $request->id ?? null,
            'user_name'    => $request->user->name ?? null,
            'name_event'   => $request->event->name ?? null,
            'batch'        => $request->event->batch ?? null,
            'status'       => $request->status ?? null,
            'ad_schedule_time' => $request->ad_schedule_time ?? null,
            'title_flayer' => $request->title_flayer ?? null,
            'image_flayer' => $request->image_flayer ? public_path('storage/' . $request->image_flayer) : null,

            'platforms'    => $request->planPlatforms->map(function ($pp) {
                return [
                    'start_date'      => $pp->start_date->format('d M Y'),
                    'end_date'        => $pp->end_date->format('d M Y'),
                    'platform_name'   => $pp->platform->name ?? null,
                    'goal_name'       => $pp->goal->name ?? null,
                    'targetType'      => $pp->audience_type,
                    'targetValue'     => $pp->audience_target !== null ? number_format((float)$pp->audience_target, 0, ',', '.') : null,
                    'daily_budget'    => $pp->daily_budget !== null ? number_format((float)$pp->daily_budget, 0, ',', '.') : null,

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
                    'checkout_count' => $r->checkout_count !== null ? number_format((float)$r->checkout_count, 0, ',', '.') : null,
                    'revenue'        => $r->revenue !== null ? number_format((float)$r->revenue, 0, ',', '.') : null,

                    'result_platforms' => $r->resultPlatforms->map(function ($rp) {
                        return [
                            'result'       => $rp->result !== null ? number_format((float)$rp->result, 0, ',', '.') : null,
                            'total_cost'   => $rp->total_cost !== null ? number_format((float)$rp->total_cost, 0, ',', '.') : null,
                            'platform_name' => $rp->platform->name,

                            'metrics' => $rp->metrics->map(function ($m) {
                                return [
                                    'reach'               => $m->reach !== null ? number_format((float)$m->reach, 0, ',', '.') : null,
                                    'impressions'         => $m->impressions !== null ? number_format((float)$m->impressions, 0, ',', '.') : null,
                                    'cpr'                 => $m->cost_per_result !== null ? number_format((float)$m->cost_per_result, 0, ',', '.') : null,
                                    'clicks'              => $m->clicks !== null ? number_format((float)$m->clicks, 0, ',', '.') : null,
                                    'likes'               => $m->likes !== null ? number_format((float)$m->likes, 0, ',', '.') : null,
                                    'saves'               => $m->saves !== null ? number_format((float)$m->saves, 0, ',', '.') : null,
                                    'shares'              => $m->shares !== null ? number_format((float)$m->shares, 0, ',', '.') : null,
                                    'profile_visits'      => $m->profile_visits !== null ? number_format((float)$m->profile_visits, 0, ',', '.') : null,
                                    'follows'             => $m->folows !== null ? number_format((float)$m->folows, 0, ',', '.') : null,
                                    'direct_messages'     => $m->direct_messages !== null ? number_format((float)$m->direct_messages, 0, ',', '.') : null,
                                    'external_link_clicks' => $m->external_link_clicks !== null ? number_format((float)$m->external_link_clicks, 0, ',', '.') : null,
                                    'result_ads'          => $m->result_ads !== null ? number_format((float)$m->result_ads, 0, ',', '.') : null,
                                    'click_whatsapp'       => $m->click_whatsapp !== null ? number_format((float)$m->click_whatsapp, 0, ',', '.') : null,
                                    'chat_admin'       => $m->chat_admin !== null ? number_format((float)$m->chat_admin, 0, ',', '.') : null,
                                ];
                            }),
                        ];
                    }),
                ];
            }),

            'evaluation' => $request->evaluations->map(function ($ev) {
                return [
                    'previous_event'           => $ev->previous_event_name,
                    'previous_checkout'        => $ev->previous_checkout !== null ? number_format((float)$ev->previous_checkout, 0, ',', '.') : null,
                    'previous_ad_performance'  => $ev->previous_ad_performance,
                    'previous_other_performance' => $ev->previous_other_performance,
                    'current_checkout'         => $ev->current_checkout !== null ? number_format((float)$ev->current_checkout, 0, ',', '.') : null,
                    'current_ad_performance'   => $ev->current_ad_performance,
                    'current_other_performance' => $ev->current_other_performance,
                    'next_ad_strategy'         => $ev->next_ad_strategy,
                ];
            }),
        ];

        $pdf = PDF::loadView('marketing.marketing', compact('data'))
            ->setPaper('a4', 'portrait');

        return $pdf->download('marketing-report-' . $id . '.pdf');
    }
}
