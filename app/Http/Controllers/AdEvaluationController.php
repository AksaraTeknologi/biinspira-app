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
        // Ambil AdPlan saat ini beserta event
        $currentPlan = AdPlan::with('event')->findOrFail($id);

        // Cari batch sebelumnya dengan nama event sama
        $previousPlan = AdPlan::with('event')
            ->whereHas('event', function ($query) use ($currentPlan) {
                $query->where('name', $currentPlan->event->name);
            })
            ->where('created_at', '<', $currentPlan->created_at)
            ->orderBy('created_at', 'desc')
            ->first();

        // Hasil iklan saat ini
        $adResult = AdResult::where('ad_plan_id', $currentPlan->id)
            ->with(['resultPlatforms.platform'])
            ->first();

        // Hasil iklan batch sebelumnya
        $previousAdResult = null;
        if ($previousPlan) {
            $previousAdResult = AdResult::where('ad_plan_id', $previousPlan->id)
                ->with(['resultPlatforms.platform'])
                ->first();
        }

        // Ambil evaluasi sebelumnya jika ada
        $adEvaluation = AdEvaluation::where('ad_plan_id', $currentPlan->id)->first();

        // List platform
        $platforms = MasterPlatform::select('id', 'name')->get();
        $user = auth()->user();
        return Inertia::render('admin/markets/marketing/marketing-eval', [
            'currentPlan' => $currentPlan,
            'previousPlan' => $previousPlan,
            'adResult' => $adResult,
            'previousAdResult' => $previousAdResult,
            'adEvaluation' => $adEvaluation,
            'platforms' => $platforms,
            'isAdmin' => $user->hasRole('admin'),
        ]);
    }

    public function storeOrUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ad_plan_id' => ['required', 'exists:ad_plans,id'],
            'current_event_name' => ['required', 'string', 'max:255'],
            'current_checkout' => ['required', 'integer', 'min:0'],
            'current_ad_performance' => ['required', 'string', 'max:255'],
            'current_other_performance' => ['required', 'string', 'max:255'],
            'next_ad_strategy' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();
        $currentPlan = AdPlan::with('event')->findOrFail($data['ad_plan_id']);

        // Cari batch sebelumnya dengan nama event yang sama
        $previousPlan = AdPlan::with('event')
            ->whereHas('event', function ($query) use ($currentPlan) {
                $query->where('name', $currentPlan->event->name);
            })
            ->where('created_at', '<', $currentPlan->created_at)
            ->orderBy('created_at', 'desc')
            ->first();

        $previousEvaluation = null;
        if ($previousPlan) {
            $previousEvaluation = AdEvaluation::where('ad_plan_id', $previousPlan->id)->first();
        }

        // Simpan atau update evaluasi
        $adEvaluation = AdEvaluation::updateOrCreate(
            ['ad_plan_id' => $currentPlan->id],
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

        // Update status plan
        if ($currentPlan->status === 'draft') {
            $currentPlan->update(['status' => 'completed']);
        }
        $user = auth()->user();
        if ($user->hasRole('admin')) {
            $route = 'admin.marketing.index';
        } elseif ($user->hasRole('user')) {
            $route = 'user.marketing.index';
        }
        return redirect()
            ->route($route)
            ->with('success', 'Evaluasi iklan berhasil disimpan dan dibandingkan dengan batch sebelumnya.');
    }
}
