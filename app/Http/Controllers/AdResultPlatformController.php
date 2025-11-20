<?php

namespace App\Http\Controllers;

use App\Models\AdMetric;
use App\Models\AdPlan;
use App\Models\AdPlanPlatform;
use App\Models\MasterEvent;
use App\Models\AdResult;
use App\Models\AdResultPlatform;
use App\Models\MasterPlatform;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AdResultPlatformController extends Controller
{
    public function resultForm($id_event, $id_ad_plan)
    {
        $user = auth()->user();
        $event = MasterEvent::select('id', 'name', 'batch')->findOrFail($id_event);
        $adPlan = AdPlan::with('planPlatforms.platform')->findOrFail($id_ad_plan);
        $platforms = $adPlan->planPlatforms->pluck('platform');
        $adResult = AdResult::where('ad_plan_id', $adPlan->id)->first();
        $adResultsByPlatform = [];

        if ($adResult) {
            $adResultPlatforms = AdResultPlatform::where('ad_result_id', $adResult->id)->get();

            foreach ($adResultPlatforms as $arp) {
                $adResultsByPlatform[$arp->platform_id] = [
                    'adResultPlatform' => $arp,
                    'adMetric' => AdMetric::where('ad_result_platform_id', $arp->id)->first(),
                ];
            }
        }


        return Inertia::render('admin/markets/marketing/marketing-form2', [
            'events' => $event,
            'platforms' => $platforms,
            'adPlan' => $adPlan,
            'isAdmin' => $user->hasRole('admin'),
            'adResultData' => [
                'adResult' => $adResult,
                'adResultsByPlatform' => $adResultsByPlatform,
            ],
        ]);
    }
    public function storeOrUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ad_result_id'    => 'nullable|exists:ad_results,id',
            'ad_plan_id'      => 'required|exists:ad_plans,id',
            'checkout_count'  => 'required|integer|min:0',
            'revenue'         => 'required|numeric|min:0',
            'platforms'       => 'required|array',
            'platforms.*.platform_id'       => 'required|exists:master_platforms,id',
            'platforms.*.total_cost'      => 'required|numeric|min:0',
            'platforms.*.reach'           => 'required|integer|min:0',
            'platforms.*.impressions'     => 'required|integer|min:0',
            'platforms.*.cost_per_result' => 'required|integer|min:0',
            'platforms.*.result_ads'      => 'nullable|integer|min:0',
            'platforms.*.clicks'          => 'nullable|integer|min:0',
            'platforms.*.likes'           => 'nullable|integer|min:0',
            'platforms.*.saves'           => 'nullable|integer|min:0',
            'platforms.*.shares'          => 'nullable|integer|min:0',
            'platforms.*.profile_visits'  => 'nullable|integer|min:0',
            'platforms.*.folows'          => 'nullable|integer|min:0',
            'platforms.*.direct_messages' => 'nullable|integer|min:0',
            'platforms.*.external_link_clicks' => 'nullable|integer|min:0',
        ]);
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        $data = $validator->validated();
        $adResult = AdResult::updateOrCreate(
            ['id' => $data['ad_result_id'] ?? null],
            [
                'ad_plan_id'     => $data['ad_plan_id'],
                'checkout_count' => $data['checkout_count'],
                'revenue'        => $data['revenue'],
            ]
        );
        foreach ($data['platforms'] as $platformData) {
            $adResultPlatform = AdResultPlatform::updateOrCreate(
                [
                    'ad_result_id' => $adResult->id,
                    'platform_id'  => $platformData["platform_id"],
                ],
                [
                    'result'     => $platformData['result_ads'] ?? null,
                    'total_cost' => $platformData['total_cost'],
                ]
            );

            // buat atau update AdMetric per platform
            AdMetric::updateOrCreate(
                ['ad_result_platform_id' => $adResultPlatform->id],
                [
                    'reach'                 => $platformData['reach'] ?? 0,
                    'impressions'           => $platformData['impressions'] ?? 0,
                    'cost_per_result'       => $platformData['cost_per_result'] ?? 0,
                    'clicks'                => $platformData['clicks'] ?? 0,
                    'likes'                 => $platformData['likes'] ?? 0,
                    'saves'                 => $platformData['saves'] ?? 0,
                    'shares'                => $platformData['shares'] ?? 0,
                    'profile_visits'        => $platformData['profile_visits'] ?? 0,
                    'folows'                => $platformData['folows'] ?? 0,
                    'direct_messages'       => $platformData['direct_messages'] ?? 0,
                    'external_link_clicks'  => $platformData['external_link_clicks'] ?? 0,
                    'result_ads'            => $platformData['result_ads'] ?? 0,
                ]
            );
        }
        $user = auth()->user();
        if ($user->hasRole('admin')) {
            $route = 'admin.marketing.evaluation';
        } elseif ($user->hasRole('user')) {
            $route = 'user.marketing.evaluation';
        }
        return redirect()
            ->route($route, ['id' => $data['ad_plan_id']])
            ->with('success', 'Data hasil iklan berhasil disimpan atau diperbarui.');
    }
}
