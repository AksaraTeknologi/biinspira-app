<?php

namespace App\Http\Controllers;

use App\Models\MasterAdGoal;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class MasterAdGoalController extends Controller
{
    public function index()
    {
        $masterAdGoals = MasterAdGoal::all();

        // dd($masterAdGoals);

        return Inertia::render('admin/adgoals/adgoal', [
            'masterAdGoals' => $masterAdGoals,
            'dashboard_item' => 'Master Ad Goal',
        ]);
    }
    public function create()
    {
        return Inertia::render('admin/adgoals/adgoal-create', [
            'dashboard_item' => 'Buat Ad Goal',
        ]);
    }
    public function store(Request $request) {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255', 'unique:master_ad_goals,name'],
        ]);
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        MasterAdGoal::create($validator->validated());
        return redirect()->route('admin.adgoals.index');

    }
    public function edit(String $id) {
        $adGoal = MasterAdGoal::findOrFail($id);

        return Inertia::render('admin/adgoals/adgoal-edit', [
            'adGoal' => $adGoal,
            'dashboard_item' => 'Edit Ad Goal',
        ]);
    }
    public function update(Request $request, String $id) {
        $adGoal = MasterAdGoal::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255', 'unique:master_ad_goals,name,' . $adGoal->id],
        ]);
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $adGoal->update($validator->validated());
        return redirect()->route('admin.adgoals.index');
    }
    public function destroy(String $id) {
        $adGoal = MasterAdGoal::findOrFail($id);
        $adGoal->delete();
        return redirect()->route('admin.adgoals.index');
    }
}
