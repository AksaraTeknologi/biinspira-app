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
                'id'           => $request->id ?? null,
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
                                        'click_whatsapp'       => $m->click_whatsapp !== null ? number_format((float)$m->click_whatsapp,0,',','.') : null,
                                        'chat_admin'       => $m->chat_admin !== null ? number_format((float)$m->chat_admin,0,',','.') : null,
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
            'status'       => $request->status ?? null,

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
                                    'click_whatsapp'       => $m->click_whatsapp !== null ? number_format((float)$m->click_whatsapp,0,',','.') : null,
                                    'chat_admin'       => $m->chat_admin !== null ? number_format((float)$m->chat_admin,0,',','.') : null,
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
