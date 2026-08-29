<?php

namespace App\Http\Controllers;

use App\Models\ProgramEvent;
use App\Models\ProgramEventGroupLink;
use App\Models\ProgramEventSchedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProgramEventController extends Controller
{
    public function index()
    {
        $query = ProgramEvent::with(['user', 'schedules', 'groupLinks.user:id,name,avatar,email'])->orderBy('created_at', 'desc');

        $programEvents = $query->get();

        $holidays = Cache::remember('indonesian_holidays', now()->addDays(30), function () {
            try {
                $apiUrl = 'https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/holidays.json';
                $response = Http::get($apiUrl);
                if ($response->successful()) {
                    return $response->json();
                }
            } catch (\Exception $e) {
                Log::error('Gagal mengambil data hari libur: ' . $e->getMessage());
            }
            return [];
        });

        return Inertia::render('admin/program-events/index', [
            'programEvents'    => $programEvents,
            'holidays'         => $holidays,
            'dashboard_item'   => 'Program Event',
        ]);
    }

    public function create(Request $request)
    {
        $duplicateData = null;
        if ($request->has('duplicate_from')) {
            $duplicateData = ProgramEvent::with(['schedules', 'groupLinks.user:id,name,avatar,email'])->find($request->query('duplicate_from'));
        }

        return Inertia::render('admin/program-events/create', [
            'duplicateData' => $duplicateData,
        ]);
    }

    public function store(Request $request)
    {
        $type = $request->input('type');

        $rules = [
            'type'                  => ['required', 'in:webinar,bootcamp,certification_program'],
            'title'                 => ['required', 'string', 'max:255'],
            'batch'                 => ['nullable', 'string', 'max:100'],
            'mentor'                => ['nullable', 'string', 'max:255'],
            'description'           => ['nullable', 'string'],
            'benefits'              => ['nullable', 'string'],
            'price'                 => ['required', 'integer', 'min:0'],
            'strikethrough_price'   => ['nullable', 'integer', 'min:0'],
            'quota'                 => ['nullable', 'integer', 'min:0'],
            'group_links'           => ['nullable', 'array'],
            'group_links.*.url'     => ['required', 'url'],
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
        $groupLinks       = $data['group_links'] ?? [];
        unset($data['schedules'], $data['group_links']);

        $program = ProgramEvent::create($data);

        foreach ($schedules as $schedule) {
            $program->schedules()->create($schedule);
        }

        foreach ($groupLinks as $link) {
            if (!empty($link['url'])) {
                $program->groupLinks()->create([
                    'user_id' => Auth::id(),
                    'url'     => $link['url'],
                ]);
            }
        }

        $route = auth()->user()->hasRole('admin') ? 'admin.program-events.index' : 'user.program-events.index';

        return redirect()->route($route)
            ->with('success', 'Program Event berhasil dibuat.');
    }

    public function edit(string $id)
    {
        $program = ProgramEvent::with([
            'schedules' => function ($q) {
                $q->orderBy('schedule_date');
            },
            'groupLinks.user:id,name,avatar,email'
        ])->findOrFail($id);

        return Inertia::render('admin/program-events/edit', [
            'program' => $program,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $program = ProgramEvent::findOrFail($id);

        $type = $request->input('type', $program->type);

        $rules = [
            'type'                  => ['required', 'in:webinar,bootcamp,certification_program'],
            'title'                 => ['required', 'string', 'max:255'],
            'batch'                 => ['nullable', 'string', 'max:100'],
            'mentor'                => ['nullable', 'string', 'max:255'],
            'description'           => ['nullable', 'string'],
            'benefits'              => ['nullable', 'string'],
            'price'                 => ['required', 'integer', 'min:0'],
            'strikethrough_price'   => ['nullable', 'integer', 'min:0'],
            'quota'                 => ['nullable', 'integer', 'min:0'],
            'group_links'           => ['nullable', 'array'],
            'group_links.*.id'      => ['nullable', 'string'],
            'group_links.*.url'     => ['required', 'url'],
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

        $data           = $validator->validated();
        $data['quota']  = $data['quota'] ?? 0;
        $schedules      = $data['schedules'] ?? null;
        $submittedLinks = $data['group_links'] ?? null;
        unset($data['schedules'], $data['group_links']);

        $program->update($data);

        // Replace schedules if provided
        if ($schedules !== null) {
            $program->schedules()->delete();
            foreach ($schedules as $schedule) {
                $program->schedules()->create($schedule);
            }
        }

        // Handle group links synchronization with ownership protection
        if ($submittedLinks !== null) {
            $existingLinks = $program->groupLinks()->get();
            $submittedIds  = collect($submittedLinks)->pluck('id')->filter()->toArray();
            $isAdmin       = auth()->user()->hasRole('admin');
            $currentUserId = auth()->id();

            // 1. Delete removed links (only if admin OR user is the owner of that link)
            foreach ($existingLinks as $existing) {
                if (!in_array($existing->id, $submittedIds)) {
                    if ($isAdmin || $existing->user_id === $currentUserId) {
                        $existing->delete();
                    }
                }
            }

            // 2. Update existing links or create new ones
            foreach ($submittedLinks as $linkData) {
                if (!empty($linkData['id'])) {
                    $link = $existingLinks->firstWhere('id', $linkData['id']);
                    if ($link) {
                        // Only allow edit if admin OR user is the owner of that link
                        if ($isAdmin || $link->user_id === $currentUserId) {
                            $link->update([
                                'url' => $linkData['url'],
                            ]);
                        }
                    }
                } else {
                    // New link added
                    if (!empty($linkData['url'])) {
                        $program->groupLinks()->create([
                            'user_id' => $currentUserId,
                            'url'     => $linkData['url'],
                        ]);
                    }
                }
            }
        }

        $route = auth()->user()->hasRole('admin') ? 'admin.program-events.index' : 'user.program-events.index';

        return redirect()->route($route)
            ->with('success', 'Program Event berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $program = ProgramEvent::findOrFail($id);

        $program->delete(); // schedules & group_links cascade-deleted via FK

        return back()->with('success', 'Program Event berhasil dihapus.');
    }

    public function move(Request $request, string $id)
    {
        $request->validate([
            'new_start_date' => ['required', 'date'],
        ]);

        $program = ProgramEvent::with('schedules')->findOrFail($id);

        $newStartDate = \Carbon\Carbon::parse($request->new_start_date)->startOfDay();

        if ($program->type === 'webinar') {
            $oldStart = \Carbon\Carbon::parse($program->start_time)->startOfDay();
            $diffInDays = $oldStart->diffInDays($newStartDate, false);
            
            $program->start_time = \Carbon\Carbon::parse($program->start_time)->addDays($diffInDays);
            $program->end_time = \Carbon\Carbon::parse($program->end_time)->addDays($diffInDays);
        } else {
            $oldStart = \Carbon\Carbon::parse($program->start_date)->startOfDay();
            $diffInDays = $oldStart->diffInDays($newStartDate, false);
            
            $program->start_date = \Carbon\Carbon::parse($program->start_date)->addDays($diffInDays);
            $program->end_date = \Carbon\Carbon::parse($program->end_date)->addDays($diffInDays);
            
            if ($program->socialization_registration_deadline) {
                $program->socialization_registration_deadline = \Carbon\Carbon::parse($program->socialization_registration_deadline)->addDays($diffInDays);
            }
        }
        
        if ($program->registration_deadline) {
            $program->registration_deadline = \Carbon\Carbon::parse($program->registration_deadline)->addDays($diffInDays);
        }

        $program->save();

        if (isset($diffInDays) && $diffInDays !== 0) {
            foreach ($program->schedules as $schedule) {
                if ($schedule->schedule_date) {
                    $newScheduleDate = \Carbon\Carbon::parse($schedule->schedule_date)->addDays($diffInDays);
                    $schedule->schedule_date = $newScheduleDate->format('Y-m-d');
                    
                    $daysMap = [
                        0 => 'minggu', 1 => 'senin', 2 => 'selasa', 
                        3 => 'rabu', 4 => 'kamis', 5 => 'jumat', 6 => 'sabtu'
                    ];
                    $schedule->day = $daysMap[$newScheduleDate->dayOfWeek];
                    $schedule->save();
                }
            }
        }

        return back()->with('success', 'Jadwal acara berhasil digeser.');
    }

    public function duplicate(Request $request, $id)
    {
        $original = ProgramEvent::findOrFail($id);

        $validated = $request->validate([
            'batch'                                 => ['nullable', 'string', 'max:255'],
            'mentor'                                => ['nullable', 'string', 'max:255'],
            'start_date'                            => ['nullable', 'date'],
            'end_date'                              => ['nullable', 'date', 'after_or_equal:start_date'],
            'start_time'                            => ['nullable', 'date'],
            'end_time'                              => ['nullable', 'date', 'after:start_time'],
            'registration_deadline'                 => ['nullable', 'date'],
            'socialization_registration_deadline'   => ['nullable', 'date'],
            'schedules'                             => ['nullable', 'array'],
            'group_links'                           => ['nullable', 'array'],
            'group_links.*.url'                     => ['required', 'url'],
        ]);

        $duplicate = $original->replicate();
        if (isset($validated['batch'])) $duplicate->batch = $validated['batch'];
        if (isset($validated['mentor'])) $duplicate->mentor = $validated['mentor'];
        
        // Update dates if provided
        if (isset($validated['start_date'])) $duplicate->start_date = $validated['start_date'];
        if (isset($validated['end_date'])) $duplicate->end_date = $validated['end_date'];
        if (isset($validated['start_time'])) $duplicate->start_time = $validated['start_time'];
        if (isset($validated['end_time'])) $duplicate->end_time = $validated['end_time'];
        if (isset($validated['registration_deadline'])) $duplicate->registration_deadline = $validated['registration_deadline'];
        if (isset($validated['socialization_registration_deadline'])) $duplicate->socialization_registration_deadline = $validated['socialization_registration_deadline'];
        
        $duplicate->slug = null;
        $duplicate->save();

        if (isset($validated['schedules'])) {
            foreach ($validated['schedules'] as $scheduleData) {
                $duplicate->schedules()->create([
                    'schedule_type' => $scheduleData['schedule_type'],
                    'title'         => $scheduleData['title'] ?? null,
                    'schedule_date' => $scheduleData['schedule_date'] ?? null,
                    'day'           => $scheduleData['day'] ?? null,
                    'start_time'    => $scheduleData['start_time'],
                    'end_time'      => $scheduleData['end_time'],
                ]);
            }
        }

        // Save new group links if provided in duplicate form (default empty, do not duplicate old ones)
        if (!empty($validated['group_links'])) {
            foreach ($validated['group_links'] as $linkData) {
                if (!empty($linkData['url'])) {
                    $duplicate->groupLinks()->create([
                        'user_id' => auth()->id(),
                        'url'     => $linkData['url'],
                    ]);
                }
            }
        }

        return redirect()->back()->with('success', 'Program event berhasil diduplikat.');
    }
}
