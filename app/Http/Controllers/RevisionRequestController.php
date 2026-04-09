<?php

namespace App\Http\Controllers;

use App\Models\RevisionRequest;
use App\Models\RevisionLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Notifications\TaskStatusUpdated;
use App\Services\WhatsappService;
use Illuminate\Support\Facades\Log;

class RevisionRequestController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        $query = RevisionRequest::with([
            'creator:id,name',
            'assignee:id,name',
            'attachments'
        ]);

        if ($user->hasRole('admin')) {
            // admin lihat semua
        } elseif ($user->hasRole('technician')) {
            // technician cuma lihat yg di-assign ke dia
            $query->where('assigned_to', $user->id);
        } else {
            // user biasa cuma lihat yg dia buat
            $query->where('created_by', $user->id);
        }

        $tasks = $query
            ->latest()
            ->get()
            ->map(function ($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'urgency' => $task->urgency,
                    'deadline' => $task->deadline,
                    'related_url' => $task->related_url,

                    'attachments' => $task->attachments->map(fn($a) => [
                        'file_path' => $a->file_path
                    ]),

                    'created_by' => $task->created_by, // 🔥 TAMBAHIN INI
                    'created_by_name' => $task->creator?->name,

                    'assigned_to' => $task->assigned_to,
                    'assigned_to_name' => $task->assignee?->name,

                    'estimation_start' => $task->estimation_start,
                    'estimation_end' => $task->estimation_end,
                ];
            })
            ->groupBy('status');

        // ✅ FIX: include roles
        $users = User::role('technician')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->getRoleNames(), // 🔥 penting
                ];
            });

        return Inertia::render('Requests/Index', [
            'tasks' => $tasks,
            'users' => $users,
            'user_role' => auth()->user()->getRoleNames()->first(),
            'user_id' => auth()->id(),
        ]);
    }

    public function create()
    {
        if (!auth()->user()->hasRole('user')) {
            abort(403);
        }

        $users = User::role('technician')
            ->get()
            ->map(function ($user) {

                $workload = RevisionRequest::where('assigned_to', $user->id)
                    ->whereIn('status', ['todo', 'in_progress'])
                    ->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'workload' => $workload,
                    'role' => $user->getRoleNames(), // 🔥 penting
                ];
            });

        return Inertia::render('Requests/Create', [
            'users' => $users
        ]);
    }

    public function store(Request $request)
    {
        if (!auth()->user()->hasRole('user')) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'related_url' => 'nullable|url',
            'urgency' => 'required|in:high,medium,low',
            'deadline' => 'nullable|date',
            'assigned_to' => 'nullable|exists:users,id',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:jpg,png,jpeg,pdf',
        ]);

        $task = RevisionRequest::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'related_url' => $validated['related_url'] ?? null,
            'urgency' => $validated['urgency'],
            'deadline' => $validated['deadline'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'status' => 'request',
            'created_by' => auth()->id(),
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('attachments', 'public');

                $task->attachments()->create([
                    'file_path' => $path
                ]);
            }
        }

        return redirect()
            ->route('requests.index')
            ->with('success', 'Request created successfully');
    }

    public function updateStatus(Request $request, $id)
    {
        $user = auth()->user();

        if (!$user->hasAnyRole(['technician', 'admin'])) {
            abort(403);
        }

        $task = RevisionRequest::findOrFail($id);

        $oldStatus = $task->status;
        $oldAssigned = $task->assigned_to; // 🔥 simpan sebelum update

        $validated = $request->validate([
            'status' => 'required|in:request,todo,in_progress,in_review,complete',
            'assigned_to' => 'nullable|exists:users,id',
            'estimation_start' => 'nullable|date',
            'estimation_end' => 'nullable|date',
        ]);

        if (in_array($request->status, ['todo', 'in_progress'])) {
            $request->validate([
                'assigned_to' => 'required|exists:users,id',
                'estimation_start' => 'required|date',
                'estimation_end' => 'required|date|after_or_equal:estimation_start',
            ]);
        }

        // 🔥 UPDATE TASK
        $task->update($validated);

        if ($request->assigned_to && $oldAssigned != $request->assigned_to) {

            $technician = User::find($request->assigned_to);

            if ($technician && $technician->phone) {

                $message =
                    "🚀 Task Baru Ditugaskan\n\n" .
                    "Judul: {$task->title}\n" .
                    "Status: {$task->status}\n\n" .
                    "Kamu ditugaskan untuk mengerjakan ini.\n" .
                    "Silakan cek QMS Biinsight 👨‍💻";

                WhatsappService::send($technician->phone, $message);
            }
        }

        if ($oldStatus !== $task->status) {

            RevisionLog::create([
                'revision_id' => $task->id,
                'from_status' => $oldStatus,
                'to_status' => $task->status,
                'changed_by' => $user->id,
                'changed_at' => now(),
            ]);

            $unitUser = User::find($task->created_by);

            if ($unitUser) {

                $unitUser->notify(new TaskStatusUpdated($task));

                if ($unitUser->phone) {

                    $message =
                        "📢 Update Request QMS\n\n" .
                        "Judul: {$task->title}\n" .
                        "Status Baru: {$task->status}\n\n" .
                        "Silakan cek QMS Biinsight 🙏";

                    WhatsappService::send($unitUser->phone, $message);
                }
            }
        }

        return back()->with('success', 'Request updated');
    }
}
