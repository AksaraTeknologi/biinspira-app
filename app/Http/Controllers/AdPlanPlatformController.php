<?php

namespace App\Http\Controllers;

use App\Models\AdPlan;
use App\Models\User;
use App\Models\AdPlanPlatform;
use App\Models\MasterAdGoal;
use App\Models\MasterEvent;
use App\Models\MasterPlatform;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AdPlanPlatformController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $query = AdPlan::with([
            'user',
            'event',
            'planPlatforms.platform',
            'planPlatforms.goal',
            'results'
        ]);
        if (!$user->hasRole('admin')) {
            $query->where('user_id', $user->id)->latest();
        }
        $adPlans = $query->get();
        return Inertia::render(
            $user->hasRole('admin') ? 'admin/markets/marketing' : 'user/marketing',
            [
                'adPlans' => $adPlans,
                'isAdmin' => $user->hasRole('admin'),
            ]
        );
    }

    public function create()
    {
        $events = MasterEvent::all();
        $goals = MasterAdGoal::all();
        $platforms = MasterPlatform::all();
        $users = User::select('id', 'name')->get();
        return Inertia::render('admin/markets/components/marketing-create', [
            'dashboard_item' => 'Buat Market Iklan',
            'events' => $events,
            'goals' => $goals,
            'platforms' => $platforms,
            'users' => $users,
        ]);
    }
    public function store(Request $request)
    {
        $mode = $request->input('mode', 'next');
        $platformDataList = $request->only(['boost', 'meta', 'business']);
        $platformDataList = array_filter($platformDataList, fn($data) => is_array($data));

        if (empty($platformDataList)) {
            return back()->withErrors(['message' => 'Tidak ada data platform yang diisi.']);
        }
        $firstPlatform = reset($platformDataList);
        $event = MasterEvent::findOrFail($firstPlatform['event_id']);
        $adPlan = AdPlan::create([
            'event_id' => $event->id,
            'user_id'  => $firstPlatform['user_id'] ?? auth()->id(),
            'status'   => 'draft',
        ]);

        if ($adPlan->wasRecentlyCreated) {
            $event->increment('batch');
        }
        foreach ($platformDataList as $platformKey => $platformData) {
            $rules = [
                'user_id' => 'required|exists:users,id',
                'platform_id' => 'required|exists:master_platforms,id',
                'goals_id' => $mode === 'draft' ? 'nullable|exists:master_ad_goals,id' : 'required|exists:master_ad_goals,id',
                'start_date' => $mode === 'draft' ? 'nullable|date' : 'required|date',
                'end_date' => $mode === 'draft' ? 'nullable|date' : 'required|date|after_or_equal:start_date',
                'daily_budget' => $mode === 'draft' ? 'nullable|numeric|min:0' : 'required|numeric|min:0',
                'audience_target' => $mode === 'draft' ? 'nullable|numeric|min:0' : 'required|numeric|min:0',
                'audience_type' => $mode === 'draft' ? 'nullable|in:targeted,broad,combined' : 'required|in:targeted,broad,combined',
                'type_audience_targeted' => 'nullable|string',
                'name_audience_targeted' => 'nullable|string|max:255',
                'age_targeted' => 'nullable|string|max:255',
                'location_targeted' => 'nullable|string|max:255',
                'age_broad' => 'nullable|string|max:255',
                'location_broad' => 'nullable|string|max:255',
                'event_id' => 'required|exists:master_events,id',
            ];

            $validator = Validator::make($platformData, $rules);

            if ($validator->fails()) {
                return back()
                    ->withErrors($validator)
                    ->withInput()
                    ->with('error', "Validasi gagal untuk platform: {$platformKey}");
            }

            $validated = $validator->validated();

            AdPlanPlatform::updateOrCreate(
                [
                    'ad_plan_id' => $adPlan->id,
                    'platform_id' => $validated['platform_id'],
                ],
                $validated
            );
        }

        $isAdmin = auth()->user()->hasRole('admin');

        if ($mode === 'draft') {
            return redirect()
                ->route($isAdmin ? 'admin.marketing.index' : 'user.marketing.index')
                ->with('success', 'Draft berhasil disimpan!');
        }

        return redirect()
            ->route(
                $isAdmin ? 'admin.marketing.result' : 'user.marketing.result',
                [
                    'id_event' => $event->id,
                    'id_ad_plan' => $adPlan->id,
                ]
            )
            ->with('success', 'Semua perencanaan iklan berhasil disimpan!');
    }


    public function edit($id)
    {
        $user = auth()->user();
        $adPlan = AdPlan::with([
            'user',
            'event',
            'planPlatforms.platform',
            'planPlatforms.goal',
        ])->findOrFail($id);

        if ($user->hasRole('user') && $adPlan->user_id !== $user->id) {
            abort(403, 'Unauthorized action.');
        }
        $masterPlatforms = MasterPlatform::all();
        $adPlan->load([
            'planPlatforms.platform',
            'planPlatforms.goal',
        ]);

        $events = MasterEvent::all();
        $goals = MasterAdGoal::all();
        $platforms = $masterPlatforms;
        $users = User::select('id', 'name')->get();

        return Inertia::render('admin/markets/components/marketing-edit', [
            'adPlan' => $adPlan,
            'events' => $events,
            'goals' => $goals,
            'platforms' => $platforms,
            'users' => $users,
            'dashboard_item' => 'Edit Perencanaan Iklan',
            'isAdmin' => $user->hasRole('admin'),
        ]);
    }

    public function update(Request $request, $id, $mode)
    {
        $data = $request->all();
        $filteredPlatforms = collect($data['platforms'] ?? [])
            ->filter(function ($platform) {
                return !empty($platform['goals_id']) &&
                    !empty($platform['daily_budget']) &&
                    floatval($platform['daily_budget']) > 0;
            })
            ->values()
            ->toArray();
        $data['platforms'] = $filteredPlatforms;

        $validator = Validator::make($data, [
            'user_id' => 'required|exists:users,id',
            'event_id' => 'required|exists:master_events,id',
            'ad_plan_id' => 'required|exists:ad_plans,id',
            'platforms' => 'nullable|array',
            'platforms.*.id' => 'nullable|exists:ad_plan_platforms,id',
            'platforms.*.platform_id' => 'required|exists:master_platforms,id',
            'platforms.*.goals_id' => 'required|exists:master_ad_goals,id',
            'platforms.*.start_date' => 'required|date',
            'platforms.*.end_date' => 'required|date|after_or_equal:platforms.*.start_date',
            'platforms.*.daily_budget' => 'required|numeric|min:0',
            'platforms.*.audience_target' => 'required|numeric|min:0',
            'platforms.*.audience_type' => 'required|in:targeted,broad,combined',
            'platforms.*.type_audience_targeted' => 'nullable|string',
            'platforms.*.name_audience_targeted' => 'nullable|string|max:255',
            'platforms.*.age_targeted' => 'nullable|string|max:255',
            'platforms.*.location_targeted' => 'nullable|string|max:255',
            'platforms.*.age_broad' => 'nullable|string|max:255',
            'platforms.*.location_broad' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $validated = $validator->validated();
        $adPlan = AdPlan::findOrFail($validated['ad_plan_id']);
        $adPlan->update([
            'event_id' => $validated['event_id'],
            'user_id'  => $validated['user_id'],
        ]);

        $latestEndDate = null;
        foreach ($validated['platforms'] ?? [] as $platformData) {
            $platform = AdPlanPlatform::updateOrCreate(
                [
                    'id' => $platformData['id'] ?? null,
                ],
                [
                    'ad_plan_id' => $adPlan->id,
                    'platform_id' => $platformData['platform_id'],
                    'goals_id' => $platformData['goals_id'],
                    'start_date' => $platformData['start_date'],
                    'end_date' => $platformData['end_date'],
                    'daily_budget' => $platformData['daily_budget'],
                    'audience_target' => $platformData['audience_target'],
                    'audience_type' => $platformData['audience_type'],
                    'type_audience_targeted' => $platformData['type_audience_targeted'] ?? null,
                    'name_audience_targeted' => $platformData['name_audience_targeted'] ?? null,
                    'age_targeted' => $platformData['age_targeted'] ?? null,
                    'location_targeted' => $platformData['location_targeted'] ?? null,
                    'age_broad' => $platformData['age_broad'] ?? null,
                    'location_broad' => $platformData['location_broad'] ?? null,
                ]
            );

            // update tanggal terakhir
            $currentEndDate = Carbon::parse($platformData['end_date']);
            if (!$latestEndDate || $currentEndDate->greaterThan($latestEndDate)) {
                $latestEndDate = $currentEndDate;
            }
        }

        $user = auth()->user();
        if ($mode === 'draft') {
            $route = $user->hasRole('admin') ? 'admin.marketing.index' : 'user.marketing.index';
            return redirect()->route($route)->with('success', 'Disimpan sebagai draft.');
        }

        if ($mode === 'next') {
            $route = $user->hasRole('admin') ? 'admin.marketing.result' : 'user.marketing.result';
            return redirect()->route($route, [
                'id_event' => $request->event_id,
                'id_ad_plan' => $request->ad_plan_id,
            ])->with('success', 'Berhasil diperbarui.');
        }
    }
    public function destroy($id)
    {
        $user = auth()->user();
        $isAdmin = $user->hasRole('admin');
        $adPlan = AdPlan::with([
            'user',
            'event',
            'planPlatforms',
            'results.resultPlatforms',
            'evaluations',
        ])->findOrFail($id);


        if (!$isAdmin && $adPlan->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses untuk menghapus data ini.');
        }
        if ($adPlan->results->isNotEmpty()) {
            foreach ($adPlan->results as $result) {
                $result->resultPlatforms()->delete();
            }
            $adPlan->results()->delete();
        }
        if ($adPlan->evaluations->isNotEmpty()) {
            $adPlan->evaluations()->delete();
        }
        if ($adPlan->planPlatforms->isNotEmpty()) {
            $adPlan->planPlatforms()->delete();
        }
        $adPlan->delete();
        return redirect()
            ->route($isAdmin ? 'admin.marketing.index' : 'user.marketing.index')
            ->with('success', 'Data Form 1–3 berhasil dihapus.');
    }
}
