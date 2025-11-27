<?php

namespace App\Http\Controllers;

use App\Models\MasterEvent;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;

class MasterEventController extends Controller
{
    public function index()
    {
        $events = MasterEvent::select('id', 'name', 'batch', 'end_date')->orderBy('end_date', 'asc')->get();

        return Inertia::render('admin/events/event', [
            'events' => $events,
            'dashboard_item' => 'Master Event',
        ]);
    }
    public function create()
    {
        return Inertia::render('admin/events/modal/event-modal-add');
    }
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'batch' => ['required', 'string', 'max:255'],
            'end_date' => ['required', 'date'],
        ]);
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        MasterEvent::create($validator->validated());
        return redirect()->route('admin.events.index');
    }
    public function edit(String $id)
    {
        $event = MasterEvent::findOrFail($id);

        return Inertia::render('admin/events/modal/event-modal-edit', [
            'event' => $event,
        ]);
    }
    public function update(Request $request, String $id)
    {
        $event = MasterEvent::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'batch' => ['required', 'string', 'max:255'],
            'end_date' => ['required', 'date'],
        ]);
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $event->update($validator->validated());
        return redirect()->route('admin.events.index');
    }
    public function destroy(String $id)
    {
        $event = MasterEvent::findOrFail($id);
        $event->delete();

        return redirect()->route('admin.events.index');
    }
}
