<?php

namespace App\Http\Controllers;

use App\Models\AdPlan;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class AdPlanController extends Controller
{
    public function index()
    {
        $adPlans = AdPlan::with(['event','user'])->get();
        return Inertia::render('admin/markets/marketing', [
            'adPlans' => $adPlans
        ]);
    }
    public function create()
    {
        return Inertia::render('admin/markets/marketing-create', [
            'dashboard_item' => 'Buat Market Iklan',
        ]);
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request()->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
            'event_id' => 'required|exists:events,id',
            'user_id' => 'required|exists:users,id',
        ]);
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        AdPlan::create($validator->validated());
        return redirect()->route('admin.marketing.index');
    }
}
