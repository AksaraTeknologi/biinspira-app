<?php

namespace App\Http\Controllers;

use App\Models\MasterEvent;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MasterEventController extends Controller
{
    public function index()
    {
        $query = MasterEvent::with('user')->orderBy('end_date', 'asc');
        if (!auth()->user()->hasRole('admin')) {
            $query->where('user_id', auth()->id());
        }
        $events = $query->get();
        $users = User::select('id', 'name')
            ->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'admin');
            })
            ->get();
        return Inertia::render('admin/events/event', [
            'events' => $events,
            'users' => $users,
            'dashboard_item' => 'Master Event',
            'authUserRole' => auth()->user()->role,
        ]);
    }
    public function create()
    {
        $users = User::select('id', 'name')->get();
        return Inertia::render('admin/events/modal/event-modal-add', [
            'users' => $users,
        ]);
    }
    public function store(Request $request)
    {
        if (auth()->user()->hasRole("admin")) {

            $validator = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:255'],
                'batch' => ['required', 'string', 'max:255'],
                'end_date' => ['required', 'date'],
                'user_id' => ['required', 'string', 'exists:users,id'],
            ]);
            if ($validator->fails()) {
                return back()->withErrors($validator)->withInput();
            }
            $data = $validator->validated();
        } else {

            $validator = Validator::make($request->all(), [
                'name' => ['required', 'string', 'max:255'],
                'batch' => ['required', 'string', 'max:255'],
                'end_date' => ['required', 'date'],
            ]);
            if ($validator->fails()) {
                return back()->withErrors($validator)->withInput();
            }
            $data = $validator->validated();
            $data['user_id'] = auth()->id();
        }

        MasterEvent::create($data);

        return back();
    }
    public function edit(String $id)
    {
        $event = MasterEvent::with('user')->findOrFail($id);
        $users = User::select('id', 'name')->get();

        return Inertia::render('admin/events/modal/event-modal-edit', [
            'event' => $event,
            'users' => $users,
        ]);
    }
    public function update(Request $request, String $id)
    {
        $event = MasterEvent::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'batch' => ['required', 'string', 'max:255'],
            'end_date' => ['required', 'date'],
            'user_id' => ['required', 'string', 'exists:users,id'],
        ]);
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $event->update($validator->validated());
        return back();
    }
    public function destroy(String $id)
    {
        $event = MasterEvent::findOrFail($id);
        $event->delete();

        return back();
    }
}
