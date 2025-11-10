<?php

namespace App\Http\Controllers;

use App\Models\AdMetric;
use App\Models\AdPlan;
use App\Models\MasterEvent;
use App\Models\AdResult;
use App\Models\AdResultPlatform;
use App\Models\MasterPlatform;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AdResultPlatformController extends Controller
{
    public function resultForm($id_event, $id_platform, $id_ad_plan)
    {
        $events = MasterEvent::select('id', 'name', "batch")->findOrFail($id_event);
        $platforms = MasterPlatform::select("id", "name")->get();
        $selectedPlatform = MasterPlatform::findOrFail($id_platform);
        $adPlan = AdPlan::findOrFail($id_ad_plan);
        return Inertia::render('admin/markets/marketing/marketing-form2', [
            'events' => $events,
            'platforms' => $platforms,
            "selectedPlatform" => $selectedPlatform,
            "adPlan" => $adPlan,
        ]);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ad_plan_id'     => 'required|exists:ad_plans,id',
            'checkout_count' => 'required|integer|min:0',
            'revenue'        => 'required|numeric|min:0',
            'platform_id'    => 'required|exists:master_platforms,id',
            'result'         => 'nullable|integer|min:0',
            'total_cost'     => 'required|numeric|min:0',
            'reach'               => 'required|integer|min:0',
            'impressions'         => 'required|integer|min:0',
            'cost_per_result'     => 'required|integer|min:0',
            'clicks'              => 'nullable|integer|min:0',
            'likes'               => 'nullable|integer|min:0',
            'saves'               => 'nullable|integer|min:0',
            'shares'              => 'nullable|integer|min:0',
            'profile_visits'      => 'nullable|integer|min:0',
            'folows'              => 'nullable|integer|min:0',
            'direct_messages'     => 'nullable|integer|min:0',
            'external_link_clicks' => 'nullable|integer|min:0',
            'result_ads'          => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            dd($validator->errors());
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();
        $adResult = AdResult::create([
            'ad_plan_id'     => $data['ad_plan_id'],
            'checkout_count' => $data['checkout_count'],
            'revenue'        => $data['revenue'],
        ]);
        $adResultPlatform = AdResultPlatform::create([
            'ad_result_id' => $adResult->id,
            'platform_id'  => $data['platform_id'],
            'result'       => $data['result'] ?? null,
            'total_cost'   => $data['total_cost'],
        ]);
        AdMetric::create([
            'ad_result_platform_id' => $adResultPlatform->id,
            'reach'                 => $data['reach'] ?? 0,
            'impressions'           => $data['impressions'] ?? 0,
            'cost_per_result'       => $data['cost_per_result'] ?? 0,
            'clicks'                => $data['clicks'] ?? 0,
            'likes'                 => $data['likes'] ?? 0,
            'saves'                 => $data['saves'] ?? 0,
            'shares'                => $data['shares'] ?? 0,
            'profile_visits'        => $data['profile_visits'] ?? 0,
            'folows'                => $data['folows'] ?? 0,
            'direct_messages'       => $data['direct_messages'] ?? 0,
            'external_link_clicks'  => $data['external_link_clicks'] ?? 0,
            'result_ads'            => $data['result_ads'] ?? 0,
        ]);

        return redirect()
            ->route('admin.marketing.index')
            ->with('success', 'Data hasil iklan dan metrik berhasil disimpan.');
    }
}
