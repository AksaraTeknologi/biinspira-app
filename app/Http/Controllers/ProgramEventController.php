<?php

namespace App\Http\Controllers;

use App\Models\ProgramEvent;
use App\Models\ProgramEventSchedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProgramEventController extends Controller
{
    public function index()
    {
        $query = ProgramEvent::with('user')->orderBy('created_at', 'desc');

        if (!auth()->user()->hasRole('admin')) {
            $query->where('user_id', auth()->id());
        }

        $programEvents = $query->get();

        return Inertia::render('admin/program-events/index', [
            'programEvents'    => $programEvents,
            'dashboard_item'   => 'Program Event',
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/program-events/create');
    }

    public function store(Request $request)
    {
        $type = $request->input('type');

        $rules = [
            'type'                  => ['required', 'in:webinar,bootcamp,certification_program'],
            'title'                 => ['required', 'string', 'max:255'],
            'batch'                 => ['nullable', 'string', 'max:100'],
            'description'           => ['nullable', 'string'],
            'benefits'              => ['nullable', 'string'],
            'price'                 => ['required', 'integer', 'min:0'],
            'strikethrough_price'   => ['nullable', 'integer', 'min:0'],
            'quota'                 => ['nullable', 'integer', 'min:0'],
            'group_url'             => ['nullable', 'url'],
            'registration_deadline' => ['required', 'date'],
        ];

        if ($type === 'webinar') {
            $rules['start_time'] = ['required', 'date'];
            $rules['end_time']   = ['required', 'date'];
        } elseif ($type === 'bootcamp') {
            $rules['start_date']    = ['required', 'date'];
            $rules['end_date']      = ['required', 'date'];
            $rules['requirements']  = ['nullable', 'string'];
            $rules['curriculum']    = ['nullable', 'string'];
            $rules['schedules']     = ['nullable', 'array'];
            $rules['schedules.*.schedule_date'] = ['required', 'date'];
            $rules['schedules.*.day']           = ['required', 'in:senin,selasa,rabu,kamis,jumat,sabtu,minggu'];
            $rules['schedules.*.start_time']    = ['required', 'date_format:H:i'];
            $rules['schedules.*.end_time']      = ['required', 'date_format:H:i'];
            $rules['schedules.*.title']         = ['nullable', 'string'];
        } elseif ($type === 'certification_program') {
            $rules['start_date']                             = ['required', 'date'];
            $rules['end_date']                               = ['required', 'date'];
            $rules['short_description']                      = ['nullable', 'string'];
            $rules['terms_conditions']                       = ['nullable', 'string'];
            $rules['scholarship_price']                      = ['nullable', 'integer', 'min:0'];
            $rules['certif_type']                            = ['nullable', 'in:regular,scholarship'];
            $rules['socialization_registration_deadline']    = ['nullable', 'date'];
            $rules['schedules']                              = ['nullable', 'array'];
            $rules['schedules.*.schedule_type']              = ['required', 'in:main,socialization'];
            $rules['schedules.*.schedule_date']              = ['required', 'date'];
            $rules['schedules.*.day']                        = ['required', 'in:senin,selasa,rabu,kamis,jumat,sabtu,minggu'];
            $rules['schedules.*.start_time']                 = ['required', 'date_format:H:i'];
            $rules['schedules.*.end_time']                   = ['required', 'date_format:H:i'];
            $rules['schedules.*.title']                      = ['nullable', 'string'];
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data             = $validator->validated();
        $data['user_id']  = Auth::id();
        $data['quota']    = $data['quota'] ?? 0;
        $schedules        = $data['schedules'] ?? [];
        unset($data['schedules']);

        $program = ProgramEvent::create($data);

        foreach ($schedules as $schedule) {
            $program->schedules()->create($schedule);
        }

        $route = auth()->user()->hasRole('admin') ? 'admin.program-events.index' : 'user.program-events.index';

        return redirect()->route($route)
            ->with('success', 'Program Event berhasil dibuat.');
    }

    public function edit(string $id)
    {
        $program = ProgramEvent::with(['schedules' => function ($q) {
            $q->orderBy('schedule_date');
        }])->findOrFail($id);

        if (!auth()->user()->hasRole('admin') && $program->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        return Inertia::render('admin/program-events/edit', [
            'program' => $program,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $program = ProgramEvent::findOrFail($id);

        if (!auth()->user()->hasRole('admin') && $program->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        $type = $request->input('type', $program->type);

        $rules = [
            'type'                  => ['required', 'in:webinar,bootcamp,certification_program'],
            'title'                 => ['required', 'string', 'max:255'],
            'batch'                 => ['nullable', 'string', 'max:100'],
            'description'           => ['nullable', 'string'],
            'benefits'              => ['nullable', 'string'],
            'price'                 => ['required', 'integer', 'min:0'],
            'strikethrough_price'   => ['nullable', 'integer', 'min:0'],
            'quota'                 => ['nullable', 'integer', 'min:0'],
            'group_url'             => ['nullable', 'url'],
            'registration_deadline' => ['required', 'date'],
        ];

        if ($type === 'webinar') {
            $rules['start_time'] = ['required', 'date'];
            $rules['end_time']   = ['required', 'date'];
        } elseif ($type === 'bootcamp') {
            $rules['start_date']    = ['required', 'date'];
            $rules['end_date']      = ['required', 'date'];
            $rules['requirements']  = ['nullable', 'string'];
            $rules['curriculum']    = ['nullable', 'string'];
            $rules['schedules']     = ['nullable', 'array'];
            $rules['schedules.*.schedule_date'] = ['required', 'date'];
            $rules['schedules.*.day']           = ['required', 'in:senin,selasa,rabu,kamis,jumat,sabtu,minggu'];
            $rules['schedules.*.start_time']    = ['required', 'date_format:H:i'];
            $rules['schedules.*.end_time']      = ['required', 'date_format:H:i'];
            $rules['schedules.*.title']         = ['nullable', 'string'];
        } elseif ($type === 'certification_program') {
            $rules['start_date']                             = ['required', 'date'];
            $rules['end_date']                               = ['required', 'date'];
            $rules['short_description']                      = ['nullable', 'string'];
            $rules['terms_conditions']                       = ['nullable', 'string'];
            $rules['scholarship_price']                      = ['nullable', 'integer', 'min:0'];
            $rules['certif_type']                            = ['nullable', 'in:regular,scholarship'];
            $rules['socialization_registration_deadline']    = ['nullable', 'date'];
            $rules['schedules']                              = ['nullable', 'array'];
            $rules['schedules.*.schedule_type']              = ['required', 'in:main,socialization'];
            $rules['schedules.*.schedule_date']              = ['required', 'date'];
            $rules['schedules.*.day']                        = ['required', 'in:senin,selasa,rabu,kamis,jumat,sabtu,minggu'];
            $rules['schedules.*.start_time']                 = ['required', 'date_format:H:i'];
            $rules['schedules.*.end_time']                   = ['required', 'date_format:H:i'];
            $rules['schedules.*.title']                      = ['nullable', 'string'];
        }

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $data      = $validator->validated();
        $data['quota'] = $data['quota'] ?? 0;
        $schedules = $data['schedules'] ?? null;
        unset($data['schedules']);

        $program->update($data);

        // Replace schedules if provided
        if ($schedules !== null) {
            $program->schedules()->delete();
            foreach ($schedules as $schedule) {
                $program->schedules()->create($schedule);
            }
        }

        $route = auth()->user()->hasRole('admin') ? 'admin.program-events.index' : 'user.program-events.index';

        return redirect()->route($route)
            ->with('success', 'Program Event berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $program = ProgramEvent::findOrFail($id);

        if (!auth()->user()->hasRole('admin') && $program->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        $program->delete(); // schedules cascade-deleted via FK

        return back()->with('success', 'Program Event berhasil dihapus.');
    }
}
