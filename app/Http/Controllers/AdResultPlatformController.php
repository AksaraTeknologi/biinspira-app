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
        $adPlan = AdPlan::with([
            'planPlatforms.platform',
            'planPlatforms.goal',
        ])->findOrFail($id_ad_plan);

        $platforms = $adPlan->planPlatforms->pluck('platform')->filter()->unique('id')->values();
        $adResult = AdResult::where('ad_plan_id', $adPlan->id)->first();
        $adResultsByPlatform = [];
        $settingsByPlatform = [];

        $adResultPlatforms = $adResult
            ? AdResultPlatform::with('metrics')->where('ad_result_id', $adResult->id)->get()
            : collect();

        foreach ($platforms as $platform) {
            $planPlatformsForPlatform = $adPlan->planPlatforms->where('platform_id', $platform->id)->values();

            $settingsList = [];
            foreach ($planPlatformsForPlatform as $idx => $pp) {
                // Find matching result platform: first by ad_plan_platform_id, or if only 1 setting/legacy, by platform_id
                $arp = $adResultPlatforms->firstWhere('ad_plan_platform_id', $pp->id);
                if (!$arp && $planPlatformsForPlatform->count() === 1) {
                    $arp = $adResultPlatforms->firstWhere('platform_id', $pp->platform_id);
                }
                $metric = $arp ? $arp->metrics->first() : null;

                $settingsList[] = [
                    'ad_plan_platform_id' => $pp->id,
                    'platform_id' => $pp->platform_id,
                    'setting_index' => $idx + 1,
                    'setting_name' => 'Setting ' . ($idx + 1) . ($pp->goal ? ' (' . $pp->goal->name . ')' : ''),
                    'goal_name' => $pp->goal?->name,
                    'start_date' => $pp->start_date ? Carbon::parse($pp->start_date)->format('Y-m-d') : null,
                    'end_date' => $pp->end_date ? Carbon::parse($pp->end_date)->format('Y-m-d') : null,
                    'daily_budget' => $pp->daily_budget,
                    'ad_result_platform_id' => $arp?->id,
                    'total_cost' => $arp?->total_cost ?? 0,
                    'cost_month_1_amount' => $arp?->cost_month_1_amount ?? null,
                    'cost_month_2_amount' => $arp?->cost_month_2_amount ?? null,
                    'media_partner' => $arp?->media_partner ?? '',
                    'result_ads' => $arp?->result,
                    'reach' => $metric?->reach ?? 0,
                    'impressions' => $metric?->impressions ?? 0,
                    'cost_per_result' => $metric?->cost_per_result ?? 0,
                    'clicks' => $metric?->clicks ?? 0,
                    'likes' => $metric?->likes ?? 0,
                    'saves' => $metric?->saves ?? 0,
                    'shares' => $metric?->shares ?? 0,
                    'profile_visits' => $metric?->profile_visits ?? 0,
                    'folows' => $metric?->folows ?? 0,
                    'direct_messages' => $metric?->direct_messages ?? 0,
                    'external_link_clicks' => $metric?->external_link_clicks ?? 0,
                    'click_whatsapp' => $metric?->click_whatsapp ?? 0,
                    'chat_admin' => $metric?->chat_admin ?? 0,
                ];
            }

            if (empty($settingsList)) {
                $arp = $adResultPlatforms->firstWhere('platform_id', $platform->id);
                $metric = $arp ? $arp->metrics->first() : null;
                $settingsList[] = [
                    'ad_plan_platform_id' => null,
                    'platform_id' => $platform->id,
                    'setting_index' => 1,
                    'setting_name' => 'Setting 1',
                    'goal_name' => null,
                    'ad_result_platform_id' => $arp?->id,
                    'total_cost' => $arp?->total_cost ?? 0,
                    'cost_month_1_amount' => $arp?->cost_month_1_amount ?? null,
                    'cost_month_2_amount' => $arp?->cost_month_2_amount ?? null,
                    'media_partner' => $arp?->media_partner ?? '',
                    'result_ads' => $arp?->result,
                    'reach' => $metric?->reach ?? 0,
                    'impressions' => $metric?->impressions ?? 0,
                    'cost_per_result' => $metric?->cost_per_result ?? 0,
                    'clicks' => $metric?->clicks ?? 0,
                    'likes' => $metric?->likes ?? 0,
                    'saves' => $metric?->saves ?? 0,
                    'shares' => $metric?->shares ?? 0,
                    'profile_visits' => $metric?->profile_visits ?? 0,
                    'folows' => $metric?->folows ?? 0,
                    'direct_messages' => $metric?->direct_messages ?? 0,
                    'external_link_clicks' => $metric?->external_link_clicks ?? 0,
                    'click_whatsapp' => $metric?->click_whatsapp ?? 0,
                    'chat_admin' => $metric?->chat_admin ?? 0,
                ];
            }

            $settingsByPlatform[$platform->id] = $settingsList;

            // Also keep legacy adResultsByPlatform for backward compatibility
            $legacyArp = $adResultPlatforms->firstWhere('platform_id', $platform->id);
            $adResultsByPlatform[$platform->id] = [
                'adResultPlatform' => $legacyArp,
                'adMetric' => $legacyArp ? $legacyArp->metrics->first() : null,
            ];
        }

        return Inertia::render('admin/markets/marketing/marketing-form2', [
            'events' => $event,
            'platforms' => $platforms,
            'adPlan' => $adPlan,
            'isAdmin' => $user->hasRole('admin'),
            'adResultData' => [
                'adResult' => $adResult,
                'adResultsByPlatform' => $adResultsByPlatform,
                'settingsByPlatform' => $settingsByPlatform,
            ],
        ]);
    }

    public function storeOrUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ad_result_id'     => 'nullable|exists:ad_results,id',
            'ad_plan_id'       => 'required|exists:ad_plans,id',
            'checkout_count'   => 'required|numeric|min:0',
            'checkout_weekend' => 'nullable|numeric|min:0',
            'checkout_weekday' => 'nullable|numeric|min:0',
            'revenue'          => 'required|numeric|min:0',
            'cost_month'       => 'nullable|string',
            'cost_month_2'     => 'nullable|string',
            'revenue_month'    => 'nullable|string',
            'media_partner'    => 'nullable|string',
            'platforms'        => 'required|array',
            'platforms.*.platform_id'         => 'required|exists:master_platforms,id',
            'platforms.*.ad_plan_platform_id' => 'nullable|exists:ad_plan_platforms,id',
            'platforms.*.total_cost'          => 'required|numeric|min:0',
            'platforms.*.cost_month_1_amount' => 'nullable|numeric|min:0',
            'platforms.*.cost_month_2_amount' => 'nullable|numeric|min:0',
            'platforms.*.reach'               => 'required|integer|min:0',
            'platforms.*.impressions'         => 'required|integer|min:0',
            'platforms.*.cost_per_result'     => 'required|integer|min:0',
            'platforms.*.result_ads'          => 'nullable|integer|min:0',
            'platforms.*.clicks'              => 'nullable|integer|min:0',
            'platforms.*.likes'               => 'nullable|integer|min:0',
            'platforms.*.saves'               => 'nullable|integer|min:0',
            'platforms.*.shares'              => 'nullable|integer|min:0',
            'platforms.*.profile_visits'      => 'nullable|integer|min:0',
            'platforms.*.folows'              => 'nullable|integer|min:0',
            'platforms.*.direct_messages'     => 'nullable|integer|min:0',
            'platforms.*.external_link_clicks' => 'nullable|integer|min:0',
            'platforms.*.click_whatsapp'      => 'nullable|integer|min:0',
            'platforms.*.chat_admin'          => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();

        $adResult = AdResult::updateOrCreate(
            ['ad_plan_id' => $data['ad_plan_id']],
            [
                'checkout_count'   => $data['checkout_count'],
                'checkout_weekend' => $data['checkout_weekend'] ?? null,
                'checkout_weekday' => $data['checkout_weekday'] ?? null,
                'revenue'          => $data['revenue'],
                'cost_month'       => $data['cost_month'] ?? null,
                'cost_month_2'     => $data['cost_month_2'] ?? null,
                'revenue_month'    => $data['revenue_month'] ?? null,
                'media_partner'    => $data['media_partner'] ?? null,
            ]
        );

        $planUpdate = [];
        if (array_key_exists('cost_month', $data)) {
            $planUpdate['cost_month'] = $data['cost_month'];
        }
        if (array_key_exists('cost_month_2', $data)) {
            $planUpdate['cost_month_2'] = $data['cost_month_2'];
        }
        if (array_key_exists('revenue_month', $data)) {
            $planUpdate['revenue_month'] = $data['revenue_month'];
        }
        if (!empty($planUpdate)) {
            AdPlan::where('id', $data['ad_plan_id'])->update($planUpdate);
        }

        $savedPlatformIds = [];
        $lastSavedArp = null;

        foreach ($data['platforms'] as $platformData) {
            $matchCriteria = [
                'ad_result_id' => $adResult->id,
            ];
            if (!empty($platformData['ad_plan_platform_id'])) {
                $matchCriteria['ad_plan_platform_id'] = $platformData['ad_plan_platform_id'];
            } else {
                $matchCriteria['platform_id'] = $platformData['platform_id'];
            }

            $adResultPlatform = AdResultPlatform::updateOrCreate(
                $matchCriteria,
                [
                    'platform_id'         => $platformData['platform_id'],
                    'ad_plan_platform_id' => $platformData['ad_plan_platform_id'] ?? null,
                    'result'              => $platformData['result_ads'] ?? null,
                    'media_partner'       => $platformData['media_partner'] ?? null,
                    'total_cost'          => $platformData['total_cost'],
                    'cost_month_1_amount' => $platformData['cost_month_1_amount'] ?? null,
                    'cost_month_2_amount' => $platformData['cost_month_2_amount'] ?? null,
                ]
            );

            $savedPlatformIds[] = $adResultPlatform->id;
            $lastSavedArp = $adResultPlatform;

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
                    'click_whatsapp'        => $platformData['click_whatsapp'] ?? 0,
                    'chat_admin'            => $platformData['chat_admin'] ?? 0,
                ]
            );
        }

        if (!empty($savedPlatformIds)) {
            AdResultPlatform::where('ad_result_id', $adResult->id)
                ->whereNotIn('id', $savedPlatformIds)
                ->delete();
        }

        $adPlan = AdPlan::with('planPlatforms.platform')->findOrFail($data['ad_plan_id']);
        if ($lastSavedArp && $this->shouldCompleteImmediately($lastSavedArp)) {
            $adPlan->update(['status' => 'completed']);
            return redirect()
                ->route(
                    auth()->user()->hasRole('admin') ? 'admin.marketing.index' : 'user.marketing.index'
                )->with('success', 'Data Hasil iklan berhasil disimpan atau diperbarui.');
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

    private function shouldCompleteImmediately(AdResultPlatform $adResultPlatform): bool
    {
        return $adResultPlatform->platform?->name === MasterPlatform::TYPE_MEDIA_PARTNER;
    }
}
