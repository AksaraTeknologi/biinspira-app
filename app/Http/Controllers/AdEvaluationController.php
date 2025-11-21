<?php

namespace App\Http\Controllers;

use App\Models\AdEvaluation;
use App\Models\AdPlan;
use App\Models\AdResult;
use Illuminate\Http\Request;
use App\Models\MasterPlatform;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use SebastianBergmann\Environment\Console;

class AdEvaluationController extends Controller
{
    // public function evaluationForm($id)
    // {
    //     $currentPlan = AdPlan::with('event')->findOrFail($id);

    //     $basePlan = AdPlan::where('id', $currentPlan->id)->where('status', 'completed')->first();
    //     $previousPlan = AdPlan::with('event')->where('event_id', $currentPlan->event_id)
    //         ->where('status', 'completed')
    //         ->where('created_at', '<', $currentPlan->created_at)
    //         ->orderBy('created_at', 'desc')
    //         ->first();

    //     $previousAdResult = null;
    //     $prevEvaluation = null;
    //     if ($previousPlan) {
    //         $previousAdResult = AdResult::where('ad_plan_id', $previousPlan->id)
    //             ->with(['resultPlatforms.platform'])
    //             ->first();

    //         $prevEvaluation = AdEvaluation::where('ad_plan_id', $previousPlan->id)->first();
    //     }
    //     $adResult = AdResult::where('ad_plan_id', $currentPlan->id)
    //         ->with(['resultPlatforms.platform'])
    //         ->first();
    //     $adEvaluation = AdEvaluation::where('ad_plan_id', $currentPlan->id)->first();
    //     $platforms = MasterPlatform::select('id', 'name')->get();
    //     $user = auth()->user();
    //     return Inertia::render('admin/markets/marketing/marketing-eval', [
    //         'currentPlan' => $currentPlan,
    //         'previousPlan' => $previousPlan,
    //         'adResult' => $adResult,
    //         'prevEvaluation' => $prevEvaluation,
    //         'previousAdResult' => $previousAdResult,
    //         'adEvaluation' => $adEvaluation,
    //         'platforms' => $platforms,
    //         'isAdmin' => $user->hasRole('admin'),
    //     ]);
    // }

    public function evaluationForm($id)
    {
        // --- 1. Ambil rencana sekarang
        $currentPlan = AdPlan::with('event')->findOrFail($id);

        // --- 2. Cari evaluasi sebelumnya berdasarkan event & status
        $previousEvaluation = AdEvaluation::with(['plan.event'])
            ->whereHas('plan', function ($q) use ($currentPlan) {
                $q->where('event_id', $currentPlan->event_id)
                    ->where('status', 'completed');
            })
            ->orderBy('created_at', 'desc')
            ->first();

        $previousPlan = null;
        $previousAdResult = null;
        $prevEvaluation = null;

        /**
         * ============================
         * CASE A: EVENT 0 → EVENT 1
         * Jika previousEvaluation ditemukan tetapi plan_id-nya
         * BERBEDA dari currentPlan → berarti ini batch pertama
         * ============================
         */
        if ($previousEvaluation && $previousEvaluation->ad_plan_id !== $currentPlan->id) {
            $previousPlan = $previousEvaluation->plan;
            $prevEvaluation = $previousEvaluation;

            if ($previousPlan) {
                $previousAdResult = AdResult::with(['resultPlatforms.platform'])
                    ->where('ad_plan_id', $previousPlan->id)
                    ->first();
            }
        }
        /**
         * ============================
         * CASE B: EVENT 1 → EVENT 2 → EVENT 3...
         * Jika previousEvaluation tidak valid untuk currentPlan,
         * gunakan previousPlan berdasarkan created_at
         * ============================
         */
        else {
            $previousPlan = AdPlan::with('event')
                ->where('event_id', $currentPlan->event_id)
                ->where('status', 'completed')
                ->where('created_at', '<', $currentPlan->created_at)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($previousPlan) {
                $previousAdResult = AdResult::with(['resultPlatforms.platform'])
                    ->where('ad_plan_id', $previousPlan->id)
                    ->first();

                $prevEvaluation = AdEvaluation::where('ad_plan_id', $previousPlan->id)->first();
            }
        }

        // --- CURRENT evaluation & result
        $currentEvaluation = AdEvaluation::where('ad_plan_id', $currentPlan->id)->first();

        $adResult = AdResult::with(['resultPlatforms.platform'])
            ->where('ad_plan_id', $currentPlan->id)
            ->first();

        $platforms = MasterPlatform::select('id', 'name')->get();

        return Inertia::render('admin/markets/marketing/marketing-eval', [
            'currentPlan'        => $currentPlan,
            'previousPlan'       => $previousPlan,
            'prevEvaluation'     => $prevEvaluation,
            'adEvaluation'       => $currentEvaluation,
            'adResult'           => $adResult,
            'previousAdResult'   => $previousAdResult,
            'platforms'          => $platforms,
            'isAdmin'            => auth()->user()->hasRole('admin'),
        ]);
    }


    // public function evaluationForm($id)
    // {
    //     // --- 1. Ambil rencana sekarang (ad_plan)
    //     $currentPlan = AdPlan::with('event')->findOrFail($id);

    //     // !! Jika di AdPlan id nya sudah pernah di pakai pada ad_eval sebelum nya maka
    //     // !! gunakan current dari event 1 ad_plan sebelum nya
    //     // !! Jika di adPlan id nya tidak di temukan maka menggunakan previousEvaluation.
    //     // --- 2. Ambil evaluasi sebelumnya berdasarkan relasi plan
    //     $previousEvaluation = AdEvaluation::with(['plan.event'])
    //         ->whereHas('plan', function ($q) use ($currentPlan) {
    //             $q->where('event_id', $currentPlan->event_id)
    //                 ->where('status', 'completed');
    //             // ->where('created_at', '<', $currentPlan->created_at);
    //         })
    //         ->orderBy('created_at', 'desc')
    //         ->first();
    //     // --- 3. Jika previousEvaluation ditemukan → ambil previousPlan
    //     $previousPlan = $previousEvaluation?->plan ?? null;

    //     // --- 4. Ambil result sebelumnya
    //     $previousAdResult = $previousPlan
    //         ? AdResult::with(['resultPlatforms.platform'])
    //         ->where('ad_plan_id', $previousPlan->id)
    //         ->first()
    //         : null;

    //     // --- 5. Ambil evaluation & result sekarang
    //     $currentEvaluation = AdEvaluation::where('ad_plan_id', $currentPlan->id)->first();

    //     $adResult = AdResult::with(['resultPlatforms.platform'])
    //         ->where('ad_plan_id', $currentPlan->id)
    //         ->first();

    //     $platforms = MasterPlatform::select('id', 'name')->get();

    //     return Inertia::render('admin/markets/marketing/marketing-eval', [
    //         'currentPlan'        => $currentPlan,
    //         'previousPlan'       => $previousPlan,
    //         'prevEvaluation'     => $previousEvaluation,
    //         'adEvaluation'       => $currentEvaluation,
    //         'adResult'           => $adResult,
    //         'previousAdResult'   => $previousAdResult,
    //         'platforms'          => $platforms,
    //         'isAdmin'            => auth()->user()->hasRole('admin'),
    //     ]);
    // }

    public function storeOrUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ad_plan_id' => ['required', 'exists:ad_plans,id'],
            'previous_event_name' => ['required', 'string', 'max:255'],
            'current_event_name' => ['required', 'string', 'max:255'],
            'previous_checkout' => ['required', 'integer', 'min:0'],
            'current_checkout' => ['required', 'integer', 'min:0'],
            'previous_ad_performance' => ['nullable', 'string', 'max:255'],
            'current_ad_performance' => ['required', 'string', 'max:255'],
            'previous_other_performance' => ['nullable', 'string', 'max:255'],
            'current_other_performance' => ['required', 'string', 'max:255'],
            'next_ad_strategy' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data = $validator->validated();
        $currentPlan = AdPlan::with('event')->findOrFail($data['ad_plan_id']);

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

        $adEvaluation = AdEvaluation::updateOrCreate(
            ['ad_plan_id' => $currentPlan->id],
            [
                'previous_event_name' => $previousPlan ? $previousPlan->event->name : $data['previous_event_name'],
                'previous_checkout' => $previousEvaluation ? $previousEvaluation->current_checkout : $data['previous_checkout'],
                'current_checkout' => $data['current_checkout'],
                'previous_ad_performance' => $previousEvaluation ? $previousEvaluation->current_ad_performance : $data["previous_ad_performance"],
                'current_ad_performance' => $data['current_ad_performance'],
                'previous_other_performance' => $previousEvaluation ? $previousEvaluation->current_other_performance : $data["previous_other_performance"],
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
