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
        // dd("OK 0",$request->all());
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
            "name_event" => "required|string|max:255",
        ]);
        if ($validator->fails()) {
            dd("Validasi gagal:", $validator->errors()->all());
        }
        $data = $validator->validated();
        $event = MasterEvent::firstOrCreate(
            ['name' => $data['name_event']],
            [
                'batch' => 1,
                'end_date' => $data['end_date'],
            ]
        );

        if (!$event->wasRecentlyCreated) {
            $event->increment('batch');
        }
        $adPlan = AdPlan::create([
            'user_id' => auth()->id(),
            'event_id' => $event->id,
            'status' => 'draft',
        ]);

        AdPlanPlatform::create(array_merge($data, [
            'ad_plan_id' => $adPlan->id,
        ]));

        return redirect()
            ->route('admin.marketing.index')
            ->with('success', 'Perencanaan iklan berhasil disimpan!');
    }
    public function edit($id)
    {
        $events = MasterEvent::all();
        $goals = MasterAdGoal::all();
        $platforms = MasterPlatform::all();
        $adPlanPlatform = AdPlanPlatform::with(["plan","platform","goal"])->findOrFail($id);
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
        $data = $request->validate([
            'name_event' => 'required|string|max:255',
            'platform_id' => 'required|exists:master_platforms,id',
            'goals_id' => 'required|exists:master_ad_goals,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'daily_budget' => 'nullable|numeric',
            'audience_target' => 'nullable|string',
            'audience_type' => 'nullable|string',
            'age_targeted' => 'nullable|string',
            'location_targeted' => 'nullable|string',
            'type_audience_targeted' => 'nullable|string',
            'name_audience_targeted' => 'nullable|string',
            'age_broad' => 'nullable|string',
            'location_broad' => 'nullable|string',
        ]);

        $event = MasterEvent::firstOrCreate(
            ['name' => $data['name_event']],
            ['end_batch' => $data['end_date'], 'batch' => 1]
        );

        $adPlanPlatform = AdPlanPlatform::findOrFail($id);
        $adPlanPlatform->update(array_merge($data, ['event_id' => $event->id]));

        return redirect()->route('admin.markets.index')->with('success', 'Data berhasil diperbarui');
    }
    public function destroy($id)
    {
        $adPlanPlatform = AdPlanPlatform::findOrFail($id);
        $adPlanPlatform->delete();
        return redirect()->route('admin.marketing.index');
    }
}
