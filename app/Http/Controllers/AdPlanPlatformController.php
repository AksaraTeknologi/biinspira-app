<?php

namespace App\Http\Controllers;

use App\Models\AdPlan;
use App\Models\AdPlanPlatform;
use App\Models\MasterAdGoal;
use App\Models\MasterEvent;
use App\Models\MasterPlatform;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AdPlanPlatformController extends Controller
{
    public function index()
    {
        $adPlanPlatforms = AdPlanPlatform::with(["plan.event", "plan.user", "platform", "goal"])->get();
        return Inertia::render("admin/markets/marketing", [
            'adPlanPlatforms' => $adPlanPlatforms
        ]);
    }
    public function create()
    {
        $events = MasterEvent::all();
        $goals = MasterAdGoal::all();
        $platforms = MasterPlatform::all();
        return Inertia::render('admin/markets/components/marketing-create', [
            'dashboard_item' => 'Buat Market Iklan',
            'events' => $events,
            'goals' => $goals,
            'platforms' => $platforms,
        ]);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            "platform_id" => "required|exists:master_platforms,id",
            "goals_id" => "required|exists:master_ad_goals,id",
            "start_date" => "required|date",
            "end_date" => "required|date|after_or_equal:start_date",
            "daily_budget" => "required|numeric|min:0",
            "audience_target" => "required|numeric|min:0",
            "audience_type" => "required|in:targeted,broad,combined",
            "type_audience_targeted" => "nullable|string",
            "name_audience_targeted" => "nullable|string|max:255",
            "age_targeted" => "nullable|string|max:255",
            "location_targeted" => "nullable|string|max:255",
            "age_broad" => "nullable|string|max:255",
            "location_broad" => "nullable|string|max:255",
            "event_id" => "required|exists:master_events,id",
        ]);
        if ($validator->fails()) {
            dd($validator->errors());
            return back()->withErrors($validator)->withInput();
        }
        $data = $validator->validated();
        $event = MasterEvent::findOrFail($data['event_id']);
        $event->increment('batch');
        $adPlan = AdPlan::create([
            'user_id' => auth()->id(),
            'event_id' => $event->id,
            'status' => 'draft',
        ]);
        AdPlanPlatform::create(array_merge($data, [
            'ad_plan_id' => $adPlan->id,
        ]));
        // ? Apakah perlu dari form 1 langsung ke form 2 tanpa button non-aktif jika tanggal end_date tidak di pakai ?
        return redirect()
            ->route('admin.marketing.result', ["id_event" => $data["event_id"], "id_platform" => $data["platform_id"], "id_ad_plan" => $adPlan->id])
            ->with('success', 'Perencanaan iklan berhasil disimpan!');
    }
    public function edit($id)
    {
        $events = MasterEvent::all();
        $goals = MasterAdGoal::all();
        $platforms = MasterPlatform::all();
        $adPlanPlatform = AdPlanPlatform::with(["plan.event", "platform", "goal", "plan"])->findOrFail($id);
        return Inertia::render('admin/markets/components/marketing-edit', [
            'events' => $events,
            'goals' => $goals,
            'platforms' => $platforms,
            'adPlanPlatform' => $adPlanPlatform,
            'dashboard_item' => 'Edit Market Iklan',
        ]);
    }
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            "platform_id" => "required|exists:master_platforms,id",
            "goals_id" => "required|exists:master_ad_goals,id",
            "start_date" => "required|date",
            "end_date" => "required|date|after_or_equal:start_date",
            "daily_budget" => "required|numeric|min:0",
            "audience_target" => "required|numeric|min:0",
            "audience_type" => "required|in:targeted,broad,combined",
            "type_audience_targeted" => "nullable|string",
            "name_audience_targeted" => "nullable|string|max:255",
            "age_targeted" => "nullable|string|max:255",
            "location_targeted" => "nullable|string|max:255",
            "age_broad" => "nullable|string|max:255",
            "location_broad" => "nullable|string|max:255",
            "event_id" => "required|exists:master_events,id",
        ]);
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        $data = $validator->validated();
        $adPlanPlatform = AdPlanPlatform::with('plan')->findOrFail($id);
        if ($adPlanPlatform->plan) {
            $adPlanPlatform->plan->update(['event_id' => $data['event_id']]);
        }
        $adPlanPlatform->update($data);
        return redirect()->route('admin.marketing.index')->with('success', 'Data berhasil diperbarui');
    }

    public function destroy($id)
    {
        $adPlan = AdPlan::with([
        'user',
        'event',
        'planPlatforms',
        'results.resultPlatforms',
        'evaluations',
    ])->findOrFail($id);
    if ($adPlan->results->isNotEmpty()) {
        foreach ($adPlan->results as $result) {
            $result->resultPlatforms()->delete(); // hapus platform
        }
        $adPlan->results()->delete(); // hapus hasil iklan
    }
    if ($adPlan->evaluations->isNotEmpty()) {
        $adPlan->evaluations()->delete();
    }
    $adPlan->delete();
    return redirect()
        ->route('admin.marketing.index')
        ->with('success', 'Data Form 1–3 berhasil dihapus.');
    }
}
