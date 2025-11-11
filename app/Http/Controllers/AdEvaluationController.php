<?php

namespace App\Http\Controllers;

use App\Models\AdEvaluation;
use App\Models\AdPlan;
use App\Models\AdResult;
use Illuminate\Http\Request;
use App\Models\MasterPlatform;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AdEvaluationController extends Controller
{
    public function evaluationForm($id)
    {
        $AdPlans = AdPlan::with(['user', 'event'])
            ->orderBy('created_at', 'desc')
            ->get();
        $currentPlan = $AdPlans->first();
        $previousPlan = $AdPlans->skip(1)->first();
        $adResult = AdResult::where('ad_plan_id', $id)
            ->with(['resultPlatforms.platform'])
            ->firstOrFail();
        $previousAdResult = null;
        if ($previousPlan) {
            $previousAdResult = AdResult::where('ad_plan_id', $previousPlan->id)
                ->with(['resultPlatforms.platform'])
                ->first();
        }
        $platforms = MasterPlatform::select('id', 'name')->get();
        $adEvaluation = AdEvaluation::where('ad_plan_id', $id)->first();
        return Inertia::render('admin/markets/marketing/marketing-eval', [
            'currentPlan' => $currentPlan,
            'previousPlan' => $previousPlan,
            'adResult' => $adResult,
            'previousAdResult' => $previousAdResult,
            'adEvaluation' => $adEvaluation,
            'platforms' => $platforms,
        ]);
    }
    public function storeOrUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            "ad_plan_id" => ["required", "exists:ad_plans,id"],
            "current_event_name" => ["required", "string", "max:255"],
            "current_checkout" => ["required", "integer", "min:0"],
            "current_ad_performance" => ["required", "string", "max:255"],
            "current_other_performance" => ["required", "string", "max:255"],
            "next_ad_strategy" => ["required", "string"],
        ]);

        if ($validator->fails()) {
            dd($validator->errors());
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();
        $currentPlan = AdPlan::with('event')
            ->where('id', $data['ad_plan_id'])
            ->first();

        if (!$currentPlan) {
            return back()->with('error', 'Data Ad Plan tidak ditemukan.');
        }
        $currentEventName = $data['current_event_name'];
        $currentCreatedAt = $currentPlan->created_at;
        $previousPlan = AdPlan::with('event')
            ->whereHas('event', function ($query) use ($currentEventName) {
                $query->where('name', $currentEventName);
            })
            ->where('created_at', '<', $currentCreatedAt)
            ->orderBy('created_at', 'desc')
            ->first();
        $previousEvaluation = null;
        if ($previousPlan) {
            $previousEvaluation = AdEvaluation::where('ad_plan_id', $previousPlan->id)->first();
        }
        $adEvaluation = AdEvaluation::updateOrCreate(
            [
                'ad_plan_id' => $data['ad_plan_id'],
            ],
            [
                'previous_event_name' => $previousPlan ? $previousPlan->event->name : 'Tidak ada batch sebelumnya',
                'previous_checkout' => $previousEvaluation ? $previousEvaluation->current_checkout : 0,
                'current_checkout' => $data['current_checkout'],
                'previous_ad_performance' => $previousEvaluation ? $previousEvaluation->current_ad_performance : 'Tidak ada Ulasan',
                'current_ad_performance' => $data['current_ad_performance'],
                'previous_other_performance' => $previousEvaluation ? $previousEvaluation->current_other_performance : 'Tidak ada Ulasan',
                'current_other_performance' => $data['current_other_performance'],
                'next_ad_strategy' => $data['next_ad_strategy'],
            ]
        );
        if ($currentPlan->status === 'draft') {
            $currentPlan->update(['status' => 'completed']);
        }
        return redirect()
            ->route('admin.marketing.index')
            ->with('success', 'Evaluasi iklan berhasil disimpan dengan membandingkan batch sebelumnya!');
    }
}
