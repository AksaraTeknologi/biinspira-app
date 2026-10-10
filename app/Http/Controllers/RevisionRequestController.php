<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\RevisionComment;
use App\Models\RevisionRequest;
use App\Models\RevisionLog;
use App\Models\RevisionSubtask;
use App\Models\TicketNotification;
use App\Models\User;
use App\Events\CommentPosted;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use App\Notifications\TaskStatusUpdated;
use App\Traits\WablasTrait;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class RevisionRequestController extends Controller
{
    use WablasTrait;

    public function index()
    {
        $user = Auth::user();

        $hasSubtasksTable = Schema::hasTable('revision_subtasks');

        $withRelations = [
            'creator' => function ($q) {
                $q->select('id', 'name')->with('roles');
            },
            'assignees:id,name',
            'attachments',
            'application:id,name,color',
            'comments' => function ($q) {
                $q->with('author:id,name')->oldest();
            },
        ];

        if ($hasSubtasksTable) {
            $withRelations['subtasks'] = function ($q) {
                $q->orderBy('order')->orderBy('id');
            };
        }

        $query = RevisionRequest::with($withRelations);

        if ($user->hasRole('admin')) {
            // admin lihat semua
        } elseif ($user->hasRole('technician')) {
            // technician HANYA lihat tiket programmer (bukan intern)
            $query->where('target_role', 'technician')
                  ->where(function ($taskQuery) use ($user) {
                      $taskQuery->whereDoesntHave('assignees')
                                ->orWhereHas('assignees', function ($q) use ($user) {
                                    $q->where('user_id', $user->id);
                                });
                  });
        } elseif ($user->hasRole('technician-intern')) {
            // technician-intern hanya bisa melihat tiket yang ditujukan untuk technician-intern
            $query->where('target_role', 'technician-intern');
        } else {
            // user biasa sekarang bisa melihat tiket orang lain juga
        }

        $tasks = $query
            ->latest()
            ->get()
            ->map(function ($task) use ($hasSubtasksTable) {
                return [
                    'id'               => $task->id,
                    'title'            => $task->title,
                    'description'      => $task->description,
                    'status'           => $task->status,
                    'urgency'          => $task->urgency,
                    'target_role'      => $task->target_role,
                    'deadline'         => $task->deadline,
                    'related_url'      => $task->related_url,
                    'review_note'      => $task->review_note,
                    'work_type'        => $task->work_type,
                    'application_id'   => $task->application_id,
                    'application'      => $task->application ? [
                        'id'    => $task->application->id,
                        'name'  => $task->application->name,
                        'color' => $task->application->color,
                    ] : null,

                    'attachments' => $task->attachments->map(fn ($a) => [
                        'file_path' => $a->file_path,
                    ]),

                    'created_by'      => $task->created_by,
                    'created_by_name' => $task->creator
                        ? ($task->creator->hasRole('admin') ? 'AKSARA TEKNOLOGI MANDIRI' : $task->creator->name)
                        : null,

                    'assignees'      => $task->assignees->pluck('id'),
                    'assignees_name' => $task->assignees->pluck('name')->join(', '),

                    'estimation_start' => $task->estimation_start,
                    'estimation_end'   => $task->estimation_end,

                    'comments' => $task->comments->map(fn ($c) => [
                        'id'         => $c->id,
                        'body'       => $c->body,
                        'user_id'    => $c->user_id,
                        'user_name'  => $c->author?->name ?? '-',
                        'created_at' => $c->created_at->diffForHumans(),
                    ]),

                    'subtasks' => ($hasSubtasksTable && $task->relationLoaded('subtasks'))
                        ? $task->subtasks->map(fn ($s) => [
                            'id'           => $s->id,
                            'title'        => $s->title,
                            'is_completed' => (bool) $s->is_completed,
                            'completed_at' => $s->completed_at?->toISOString(),
                            'order'        => $s->order,
                        ])
                        : [],
                ];
            })
            ->groupBy('status');

        // ✅ FIX: include roles
        $users = User::role(['technician', 'technician-intern'])
            ->get()
            ->map(function ($user) {
                return [
                    'id'   => $user->id,
                    'name' => $user->name,
                    'role' => $user->getRoleNames(), // 🔥 penting
                ];
            });

        // Daftar aplikasi aktif untuk filter & form
        $applications = Application::where('is_active', true)
            ->select('id', 'name', 'color')
            ->orderBy('name')
            ->get();

        return Inertia::render('requests/index', [
            'tasks'        => $tasks,
            'users'        => $users,
            'applications' => $applications,
            'user_role'    => Auth::user()->getRoleNames()->first(),
            'user_id'      => Auth::id(),
            'user_name'    => Auth::user()->name,
        ]);
    }

    public function create()
    {
        if (!Auth::user()->hasAnyRole(['user', 'admin'])) {
            abort(403);
        }

        $applications = Application::where('is_active', true)
            ->select('id', 'name', 'color')
            ->orderBy('name')
            ->get();

        return Inertia::render('requests/create', [
            'applications' => $applications,
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->hasAnyRole(['user', 'admin'])) {
            abort(403);
        }

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'related_url'    => 'nullable|string',
            'urgency'        => 'required|in:high,medium,low',
            'target_role'    => 'required|in:technician,technician-intern',
            'deadline'       => 'required|date',
            'assignees'      => 'nullable|array',
            'assignees.*'    => 'exists:users,id',
            'attachments'    => 'nullable|array',
            'attachments.*'  => 'nullable|file|mimes:jpg,png,jpeg,pdf',
            'application_id' => 'nullable|exists:applications,id',
            'work_type'      => 'nullable|in:pengerjaan,penambahan_fitur,maintenance',
            'subtasks'        => 'nullable|array',
            'subtasks.*'      => 'nullable',
        ]);

        $task = RevisionRequest::create([
            'title'          => $validated['title'],
            'description'    => $validated['description'] ?? '',
            'related_url'    => $validated['related_url'] ?? null,
            'urgency'        => $validated['urgency'],
            'target_role'    => $validated['target_role'],
            'deadline'       => $validated['deadline'] ?? null,
            'status'         => 'request',
            'created_by'     => Auth::id(),
            'application_id' => $validated['application_id'] ?? null,
            'work_type'      => $validated['work_type'] ?? null,
        ]);

        if (!empty($validated['assignees'])) {
            $task->assignees()->attach($validated['assignees']);
        }

        if (!empty($validated['subtasks']) && Schema::hasTable('revision_subtasks')) {
            foreach ($validated['subtasks'] as $index => $item) {
                $trimmed = trim(is_array($item) ? ($item['title'] ?? '') : (string) $item);
                if ($trimmed !== '') {
                    $task->subtasks()->create([
                        'title'        => $trimmed,
                        'is_completed' => false,
                        'order'        => $index + 1,
                        'created_by'   => Auth::id(),
                    ]);
                }
            }
        }

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                try {
                    $path = $file->store('attachments', 'public');

                    if (!$path) {
                        Log::error('File store returned null', [
                            'filename' => $file->getClientOriginalName(),
                            'task_id'  => $task->id,
                        ]);
                        continue;
                    }

                    $task->attachments()->create([
                        'file_path' => $path,
                    ]);
                } catch (\Exception $e) {
                    Log::error('File upload error', [
                        'error'    => $e->getMessage(),
                        'filename' => $file->getClientOriginalName(),
                        'task_id'  => $task->id,
                    ]);
                }
            }
        }

        // ✅ KIRIM WA KE ADMIN saat tiket baru dibuat (kecuali jika admin yang buat)
        $creator = Auth::user();
        if (!$creator->hasRole('admin')) {
            $this->notifyAdminNewTicket($task, $creator);
        }

        return redirect()
            ->route('requests.index')
            ->with('success', 'Tiket Berhasil dibuat');
    }

    public function edit($id)
    {
        $task = RevisionRequest::with('attachments')->findOrFail($id);
        $user = Auth::user();
        $isAdmin = $user->hasRole('admin');
        $isCreator = (string) $task->created_by === (string) $user->id;

        // Hanya admin dan user pembuat tiket yang dapat mengedit tiket
        if (!$isAdmin && !$isCreator) {
            abort(403, 'Hanya admin dan pembuat tiket yang dapat mengedit tiket.');
        }

        $applications = Application::where('is_active', true)
            ->select('id', 'name', 'color')
            ->orderBy('name')
            ->get();

        return Inertia::render('requests/edit', [
            'task' => [
                'id'             => $task->id,
                'title'          => $task->title,
                'description'    => $task->description,
                'related_url'    => $task->related_url,
                'urgency'        => $task->urgency,
                'target_role'    => $task->target_role,
                'deadline'       => $task->deadline,
                'created_by'     => $task->created_by,
                'assignees'      => $task->assignees->pluck('id'),
                'application_id' => $task->application_id,
                'work_type'      => $task->work_type,
                'attachments'    => $task->attachments->map(fn ($a) => [
                    'file_path' => $a->file_path,
                ]),
                'subtasks'       => Schema::hasTable('revision_subtasks')
                    ? $task->subtasks()->orderBy('order')->orderBy('id')->get()->map(fn ($s) => [
                        'id'           => $s->id,
                        'title'        => $s->title,
                        'is_completed' => (bool) $s->is_completed,
                    ])
                    : [],
            ],
            'applications' => $applications,
        ]);
    }

    public function destroy($id)
    {
        $task = RevisionRequest::findOrFail($id);
        $user = Auth::user();
        $isAdmin = $user->hasRole('admin');
        $isCreator = (string) $task->created_by === (string) $user->id;

        // Hanya admin dan user pembuat tiket yang dapat menghapus tiket
        if (!$isAdmin && !$isCreator) {
            abort(403, 'Hanya admin dan pembuat tiket yang dapat menghapus tiket.');
        }

        foreach ($task->attachments as $file) {
            Storage::disk('public')->delete($file->file_path);
        }

        $task->delete();

        return back();
    }

    public function update(Request $request, $id)
    {
        $task = RevisionRequest::findOrFail($id);
        $user = Auth::user();
        $isAdmin = $user->hasRole('admin');
        $isCreator = (string) $task->created_by === (string) $user->id;

        // 🔐 AUTH: Hanya admin dan pembuat tiket yang dapat memperbarui tiket
        if (!$isAdmin && !$isCreator) {
            abort(403, 'Hanya admin dan pembuat tiket yang dapat memperbarui tiket.');
        }

        // ✅ VALIDASI
        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'related_url'    => 'nullable|string',
            'urgency'        => 'required|in:high,medium,low',
            'target_role'    => 'required|in:technician,technician-intern',
            'deadline'       => 'required|date',
            'assignees'      => 'nullable|array',
            'assignees.*'    => 'exists:users,id',
            'attachments'    => 'nullable|array',
            'attachments.*'  => 'nullable|file|mimes:jpg,png,jpeg,pdf',
            'application_id' => 'nullable|exists:applications,id',
            'work_type'      => 'nullable|in:pengerjaan,penambahan_fitur,maintenance',
            'subtasks'       => 'nullable|array',
            'subtasks.*'     => 'nullable',
        ]);

        // ✅ UPDATE DATA
        $task->update([
            'title'          => $validated['title'],
            'description'    => $validated['description'] ?? '',
            'related_url'    => $validated['related_url'] ?? null,
            'urgency'        => $validated['urgency'],
            'target_role'    => $validated['target_role'],
            'deadline'       => $validated['deadline'] ?? null,
            'application_id' => $validated['application_id'] ?? null,
            'work_type'      => $validated['work_type'] ?? null,
        ]);

        // ✅ SINKRONISASI SUBTASKS (jika dikirim dari form)
        if ($request->has('subtasks') && Schema::hasTable('revision_subtasks')) {
            $submittedSubtasks = $request->input('subtasks') ?? [];
            $existingSubtasks = $task->subtasks()->get()->keyBy(fn ($s) => (string) $s->id);
            $usedIds = [];

            foreach ($submittedSubtasks as $index => $item) {
                $id = is_array($item) ? ($item['id'] ?? null) : null;
                $title = trim(is_array($item) ? ($item['title'] ?? '') : (string) $item);

                if ($title === '') continue;

                if ($id && $existingSubtasks->has((string) $id)) {
                    $existing = $existingSubtasks->get((string) $id);
                    $existing->update([
                        'title' => $title,
                        'order' => $index + 1,
                    ]);
                    $usedIds[] = (string) $id;
                } else {
                    // Cek berdasarkan judul jika ID tidak disertakan
                    $match = $existingSubtasks->first(function ($s) use ($title, $usedIds) {
                        return !in_array((string) $s->id, $usedIds) && $s->title === $title;
                    });

                    if ($match) {
                        $match->update([
                            'order' => $index + 1,
                        ]);
                        $usedIds[] = (string) $match->id;
                    } else {
                        $created = $task->subtasks()->create([
                            'title'        => $title,
                            'is_completed' => false,
                            'order'        => $index + 1,
                            'created_by'   => $user->id,
                        ]);
                        $usedIds[] = (string) $created->id;
                    }
                }
            }

            $task->subtasks()->whereNotIn('id', $usedIds)->delete();
        }

        // ✅ HANDLE FILE BARU (optional, gak hapus lama)
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                try {
                    $path = $file->store('attachments', 'public');

                    if (!$path) {
                        Log::error('File store returned null', [
                            'filename' => $file->getClientOriginalName(),
                            'task_id'  => $task->id,
                        ]);
                        continue;
                    }

                    $task->attachments()->create([
                        'file_path' => $path,
                    ]);
                } catch (\Exception $e) {
                    Log::error('File upload error', [
                        'error'    => $e->getMessage(),
                        'filename' => $file->getClientOriginalName(),
                        'task_id'  => $task->id,
                    ]);
                }
            }
        }

        return redirect()
            ->route('requests.index')
            ->with('success', 'Tiket Berhasil diperbarui');
    }

    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();

        if (!$user->hasAnyRole(['technician', 'technician-intern', 'admin'])) {
            abort(403);
        }

        $task = RevisionRequest::findOrFail($id);

        $oldStatus    = $task->status;
        $oldAssignees = $task->assignees->pluck('id')->toArray();

        // =========================
        // VALIDATION RULES
        // =========================
        $rules = [
            'status'           => 'required|in:request,todo,in_progress,in_review,complete',
            'assignees'        => 'nullable|array',
            'assignees.*'      => 'exists:users,id',
            'estimation_start' => 'nullable|date',
            'estimation_end'   => 'nullable|date',
        ];

        if (in_array($request->status, ['todo', 'in_progress'])) {
            $rules['assignees']        = 'required|array';
            $rules['assignees.*']      = 'exists:users,id';
            $rules['estimation_start'] = 'required|date';
            $rules['estimation_end']   = 'required|date|after_or_equal:estimation_start';
        }

        $validated = $request->validate($rules);

        // =========================
        // UPDATE TASK
        // =========================
        $task->update([
            'status'           => $validated['status'],
            'estimation_start' => $validated['estimation_start'] ?? null,
            'estimation_end'   => $validated['estimation_end'] ?? null,
        ]);

        if (isset($validated['assignees'])) {
            $task->assignees()->sync($validated['assignees']);
        }

        Log::info('Revision request status update processed', [
            'revision_id' => $task->id,
            'updated_by'  => $user->id,
            'old_status'  => $oldStatus,
            'new_status'  => $task->status,
            'old_assignees' => $oldAssignees,
            'assignees'     => $validated['assignees'] ?? [],
        ]);

        // =========================
        // WHATSAPP NOTIF (ASSIGN CHANGE)
        // =========================
        $this->notifyAssignedTechnicians($task, $validated['assignees'] ?? [], $oldAssignees);

        // =========================
        // STATUS CHANGE LOG + NOTIF
        // =========================
        if ($oldStatus !== $task->status) {

            RevisionLog::create([
                'revision_id' => $task->id,
                'from_status' => $oldStatus,
                'to_status'   => $task->status,
                'changed_by'  => $user->id,
                'changed_at'  => now(),
            ]);

            $unitUser = User::find($task->created_by);

            if (!$unitUser) {
                Log::warning('Skip task creator notifications', [
                    'revision_id' => $task->id,
                    'created_by'  => $task->created_by,
                    'reason'      => 'creator_not_found',
                ]);
            } elseif (!$unitUser->hasRole('admin')) {
                Log::info('Dispatching task creator notifications', [
                    'revision_id'    => $task->id,
                    'creator_user_id' => $unitUser->id,
                    'has_phone'       => !empty($unitUser->phone),
                ]);

                $unitUser->notify(new TaskStatusUpdated($task));

                $this->notifyTaskCreatorStatusUpdate($task, $unitUser);
            } else {
                Log::info('Skip task creator notifications', [
                    'revision_id' => $task->id,
                    'reason'      => 'creator_is_admin',
                ]);
            }
        } else {
            Log::info('Skip task creator notifications', [
                'revision_id' => $task->id,
                'old_status'  => $oldStatus,
                'new_status'  => $task->status,
                'reason'      => 'status_unchanged',
            ]);
        }

        return redirect()
            ->route('requests.index')
            ->with('success', 'Tiket Berhasil diperbarui');
    }

    /**
     * Review action by user: acc (→complete) or reject (→in_progress with note)
     */
    public function reviewAction(Request $request, $id)
    {
        $user = Auth::user();
        $task = RevisionRequest::findOrFail($id);

        // Hanya pembuat tiket yang bisa melakukan review action
        if ((string) $task->created_by !== (string) $user->id) {
            abort(403, 'Hanya pembuat tiket yang dapat melakukan aksi review.');
        }

        if ($task->status !== 'in_review') {
            return back()->withErrors(['action' => 'Tiket harus berada di tahap review terlebih dahulu.']);
        }

        $validated = $request->validate([
            'action'      => 'required|in:accept,reject',
            'review_note' => 'nullable|string|max:2000',
        ]);

        $oldStatus = $task->status;

        if ($validated['action'] === 'accept') {
            $task->update([
                'status'      => 'complete',
                'review_note' => null,
            ]);
        } else {
            // reject → kembali ke in_progress
            $task->update([
                'status'      => 'in_progress',
                'review_note' => $validated['review_note'] ?? null,
            ]);
        }

        RevisionLog::create([
            'revision_id' => $task->id,
            'from_status' => $oldStatus,
            'to_status'   => $task->status,
            'changed_by'  => $user->id,
            'changed_at'  => now(),
        ]);

        // Notif WA ke Programmer tentang hasil review
        if ($task->assignees->isNotEmpty()) {
            foreach ($task->assignees as $technician) {
                $message = $this->buildReviewActionMessage($task, $user, $validated['action'], $validated['review_note'] ?? null);
                $this->sendWhatsappMessage($technician->phone, $message, [
                    'revision_id' => $task->id,
                    'event'       => 'review_action_' . $validated['action'],
                ]);
            }
        }

        $statusLabel = $validated['action'] === 'accept' ? 'diterima dan ditandai Selesai' : 'dikembalikan ke Pengerjaan';

        return redirect()
            ->route('requests.index')
            ->with('success', "Hasil review tiket berhasil {$statusLabel}.");
    }

    /**
     * Ambil daftar komentar untuk tiket (API polling)
     */
    public function getComments($id)
    {
        $task = RevisionRequest::findOrFail($id);

        $comments = $task->comments()
            ->with('author')
            ->oldest()
            ->get()
            ->map(fn ($c) => [
                'id'         => $c->id,
                'body'       => $c->body,
                'user_id'    => $c->user_id,
                'user_name'  => $c->author?->name ?? 'User',
                'created_at' => $c->created_at?->diffForHumans() ?? 'Baru saja',
            ]);

        return response()->json(['comments' => $comments]);
    }

    /**
     * Tambah komentar pada tiket
     */
    public function addComment(Request $request, $id)
    {
        $task = RevisionRequest::findOrFail($id);
        $user = Auth::user();

        // Semua role yang punya akses bisa komentar
        if (!$user->hasAnyRole(['admin', 'technician', 'technician-intern', 'user'])) {
            abort(403);
        }

        $validated = $request->validate([
            'body' => 'required|string|max:5000',
        ]);

        $comment = $task->comments()->create([
            'user_id' => $user->id,
            'body'    => $validated['body'],
        ]);

        // Target penerima notifikasi berdasarkan role & penugasan:
        $recipients = collect();

        // 1. Semua Admin (kecuali si pengirim)
        $adminIds = User::role('admin')->where('id', '!=', $user->id)->pluck('id');
        $recipients = $recipients->merge($adminIds);

        // 2. Pembuat tiket (jika bukan pengirim)
        if ($task->created_by && (string) $task->created_by !== (string) $user->id) {
            $recipients->push($task->created_by);
        }

        // 3. Programmer / teknisi yang ditugaskan di tiket ini (kecuali si pengirim)
        $assigneeIds = $task->assignees()->where('users.id', '!=', $user->id)->pluck('users.id');
        $recipients = $recipients->merge($assigneeIds);

        $recipientIds = $recipients->unique()->values()->all();

        // Simpan notifikasi ke database
        foreach ($recipientIds as $recipientId) {
            TicketNotification::create([
                'user_id'             => $recipientId,
                'revision_request_id' => $task->id,
                'revision_comment_id' => $comment->id,
                'ticket_title'        => $task->title,
                'sender_id'           => $user->id,
                'sender_name'         => $user->name,
                'comment_body'        => $comment->body,
            ]);
        }

        // Broadcast event real-time (Laravel Reverb)
        try {
            event(new CommentPosted($task, $comment, $recipientIds));
        } catch (\Throwable $e) {
            Log::warning('Broadcast CommentPosted failed: ' . $e->getMessage());
        }

        return back();
    }

    /**
     * Hapus komentar
     */
    public function deleteComment($id, $commentId)
    {
        RevisionRequest::findOrFail($id); // validasi tiket exist
        $comment = RevisionComment::findOrFail($commentId);
        $user    = Auth::user();

        // Hanya penulis komentar atau admin yang bisa hapus
        if (!$user->hasRole('admin') && (string) $comment->user_id !== (string) $user->id) {
            abort(403, 'Hanya admin yang dapat menghapus komentar orang lain.');
        }

        $comment->delete();

        return back();
    }

    /**
     * Dapatkan subtask untuk tiket
     */
    public function getSubtasks($id)
    {
        $task = RevisionRequest::findOrFail($id);
        
        if (!Schema::hasTable('revision_subtasks')) {
            return response()->json(['success' => true, 'subtasks' => []]);
        }

        $subtasks = $task->subtasks()->orderBy('order')->orderBy('id')->get()->map(fn ($s) => [
            'id'           => $s->id,
            'title'        => $s->title,
            'is_completed' => (bool) $s->is_completed,
            'completed_at' => $s->completed_at?->toISOString(),
            'order'        => $s->order,
        ]);

        return response()->json([
            'success'  => true,
            'subtasks' => $subtasks,
        ]);
    }

    /**
     * Tambah subtask baru ke tiket
     */
    public function addSubtask(Request $request, $id)
    {
        $task = RevisionRequest::findOrFail($id);
        $user = Auth::user();

        $isCreator = (string) $task->created_by === (string) $user->id;
        $isAdmin   = $user->hasRole('admin');

        // Hanya admin dan user pembuat tiket yang dapat menambah subtask
        if (!$isAdmin && !$isCreator) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin dan pembuat tiket yang dapat menambahkan subtask.',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $maxOrder = $task->subtasks()->max('order') ?? 0;

        $subtask = $task->subtasks()->create([
            'title'        => trim($validated['title']),
            'is_completed' => false,
            'order'        => $maxOrder + 1,
            'created_by'   => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subtask berhasil ditambahkan',
            'subtask' => [
                'id'           => $subtask->id,
                'title'        => $subtask->title,
                'is_completed' => false,
                'completed_at' => null,
                'order'        => $subtask->order,
            ],
        ]);
    }

    /**
     * Toggle status ceklis subtask (otomatis tersimpan)
     */
    public function toggleSubtask(Request $request, $id, $subtaskId)
    {
        $task = RevisionRequest::findOrFail($id);
        $user = Auth::user();

        $isCreator    = (string) $task->created_by === (string) $user->id;
        $isAdmin      = $user->hasRole('admin');
        $isTechnician = $user->hasAnyRole(['technician', 'technician-intern']);

        // Hanya admin, pembuat tiket, atau teknisi yang boleh melakukan ceklis
        if (!$isAdmin && !$isCreator && !$isTechnician) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki hak akses untuk mengubah status subtask ini.',
            ], 403);
        }

        // Syarat melakukan ceklis: status tiket harus "in_progress" (sedang dikerjakan), termasuk untuk admin
        if ($task->status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'Subtask hanya dapat diceklis jika status tiket sedang dikerjakan.',
            ], 403);
        }

        $subtask = $task->subtasks()->findOrFail($subtaskId);

        $newCompleted = $request->has('is_completed')
            ? (bool) $request->input('is_completed')
            : !$subtask->is_completed;

        $subtask->update([
            'is_completed' => $newCompleted,
            'completed_at' => $newCompleted ? now() : null,
        ]);

        return response()->json([
            'success' => true,
            'message' => $newCompleted ? 'Subtask ditandai selesai' : 'Subtask diaktifkan kembali',
            'subtask' => [
                'id'           => $subtask->id,
                'title'        => $subtask->title,
                'is_completed' => (bool) $subtask->is_completed,
                'completed_at' => $subtask->completed_at?->toISOString(),
                'order'        => $subtask->order,
            ],
        ]);
    }

    /**
     * Update judul subtask
     */
    public function updateSubtask(Request $request, $id, $subtaskId)
    {
        $task = RevisionRequest::findOrFail($id);
        $user = Auth::user();

        $isCreator = (string) $task->created_by === (string) $user->id;
        $isAdmin   = $user->hasRole('admin');

        // Hanya admin dan user pembuat tiket yang dapat merubah subtask
        if (!$isAdmin && !$isCreator) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin dan pembuat tiket yang dapat merubah subtask.',
            ], 403);
        }

        $subtask = $task->subtasks()->findOrFail($subtaskId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
        ]);

        $subtask->update([
            'title' => trim($validated['title']),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subtask berhasil diperbarui',
            'subtask' => [
                'id'           => $subtask->id,
                'title'        => $subtask->title,
                'is_completed' => (bool) $subtask->is_completed,
                'completed_at' => $subtask->completed_at?->toISOString(),
                'order'        => $subtask->order,
            ],
        ]);
    }

    /**
     * Hapus subtask
     */
    public function deleteSubtask($id, $subtaskId)
    {
        $task = RevisionRequest::findOrFail($id);
        $user = Auth::user();

        $isCreator = (string) $task->created_by === (string) $user->id;
        $isAdmin   = $user->hasRole('admin');

        // Hanya admin dan user pembuat tiket yang dapat menghapus subtask
        if (!$isAdmin && !$isCreator) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin dan pembuat tiket yang dapat menghapus subtask.',
            ], 403);
        }

        $subtask = $task->subtasks()->findOrFail($subtaskId);
        $subtask->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subtask berhasil dihapus',
        ]);
    }

    /**
     * Halaman statistik tiket aktif (admin & technician)
     */
    public function statistics(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasAnyRole(['admin', 'technician'])) {
            abort(403);
        }

        $query = RevisionRequest::with([
            'assignees:id,name',
            'application:id,name,color',
        ])->whereIn('status', ['todo', 'in_progress', 'in_review']);

        if ($request->filled('application_id')) {
            $query->where('application_id', $request->input('application_id'));
        }

        if ($request->filled('work_type')) {
            $query->where('work_type', $request->input('work_type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage = min(50, max(5, (int) $request->input('per_page', 10)));
        $tasks   = $query->latest()->paginate($perPage)->withQueryString();

        $tasks->through(function ($task) {
            return [
                'id'           => $task->id,
                'title'        => $task->title,
                'status'       => $task->status,
                'urgency'      => $task->urgency,
                'work_type'    => $task->work_type,
                'deadline'     => $task->deadline,
                'application'  => $task->application ? [
                    'id'    => $task->application->id,
                    'name'  => $task->application->name,
                    'color' => $task->application->color,
                ] : null,
                'assignees_name' => $task->assignees->pluck('name')->join(', '),
            ];
        });

        $applications = Application::where('is_active', true)
            ->select('id', 'name', 'color')
            ->orderBy('name')
            ->get();

        // Summary (tanpa paginate)
        $allActive = RevisionRequest::whereIn('status', ['todo', 'in_progress', 'in_review']);
        $summary = [
            'total'            => (clone $allActive)->count(),
            'pengerjaan'       => (clone $allActive)->where('work_type', 'pengerjaan')->count(),
            'penambahan_fitur' => (clone $allActive)->where('work_type', 'penambahan_fitur')->count(),
            'maintenance'      => (clone $allActive)->where('work_type', 'maintenance')->count(),
            'todo'             => (clone $allActive)->where('status', 'todo')->count(),
            'in_progress'      => (clone $allActive)->where('status', 'in_progress')->count(),
            'in_review'        => (clone $allActive)->where('status', 'in_review')->count(),
        ];

        return Inertia::render('requests/statistics', [
            'tasks'        => $tasks,
            'applications' => $applications,
            'summary'      => $summary,
            'filters'      => [
                'application_id' => $request->input('application_id'),
                'work_type'      => $request->input('work_type'),
                'status'         => $request->input('status'),
                'per_page'       => $perPage,
            ],
        ]);
    }

    private function notifyAssignedTechnicians(RevisionRequest $task, array $newAssignees, array $oldAssignees): void
    {
        $newAssigneeIds = array_diff($newAssignees, $oldAssignees);

        if (empty($newAssigneeIds)) {
            Log::info('Skip WhatsApp assignment notification', [
                'revision_id' => $task->id,
                'assignees'   => $newAssignees,
                'old_assignees' => $oldAssignees,
                'reason'      => 'no_new_assignees',
            ]);
            return;
        }

        $technicians = User::whereIn('id', $newAssigneeIds)->get();

        foreach ($technicians as $technician) {
            $message = $this->buildAssignedTaskMessage($task, $technician);
            $this->sendWhatsappMessage($technician->phone, $message, [
                'revision_id'       => $task->id,
                'recipient_user_id' => $technician->id,
                'event'             => 'assigned_to_technician',
            ]);
        }
    }

    private function notifyTaskCreatorStatusUpdate(RevisionRequest $task, User $unitUser): void
    {
        $message = $this->buildStatusChangedMessage($task, $unitUser);

        $this->sendWhatsappMessage($unitUser->phone, $message, [
            'revision_id'       => $task->id,
            'recipient_user_id' => $unitUser->id,
            'event'             => 'status_changed_for_creator',
        ]);
    }

    private function sendWhatsappMessage(?string $phone, string $message, array $context = []): void
    {
        if (empty($phone)) {
            Log::warning('Skip WhatsApp message via Wablas', array_merge($context, [
                'reason' => 'empty_phone',
            ]));
            return;
        }

        $phoneNumber = $this->formatPhoneNumber($phone);
        if (empty($phoneNumber)) {
            Log::warning('Skip WhatsApp message via Wablas', array_merge($context, [
                'reason'         => 'invalid_phone_after_normalization',
                'phone_original' => $phone,
            ]));
            return;
        }

        $waData = [
            [
                'phone'   => $phoneNumber,
                'message' => $message,
                'isGroup' => 'false',
            ],
        ];

        Log::info('Attempting WhatsApp message via Wablas', array_merge($context, [
            'phone_original'  => $phone,
            'phone'           => $phoneNumber,
            'message_length'  => strlen($message),
            'message_preview' => substr($message, 0, 120),
        ]));

        $sent = self::sendText($waData);

        if ($sent) {
            Log::info('WhatsApp message sent successfully via Wablas', array_merge($context, [
                'phone' => $phoneNumber,
            ]));
            return;
        }

        Log::warning('Failed to send WhatsApp message via Wablas', array_merge($context, [
            'phone' => $phoneNumber,
        ]));
    }

    private function notifyAdminNewTicket(RevisionRequest $task, $creator): void
    {
        $adminPhone = '085142505797';
        $message    = $this->buildNewTicketAdminMessage($task, $creator);

        $this->sendWhatsappMessage($adminPhone, $message, [
            'revision_id' => $task->id,
            'event'       => 'new_ticket_created',
        ]);
    }

    private function buildNewTicketAdminMessage(RevisionRequest $task, $creator): string
    {
        return "*[Biinsight - Tiket Baru Masuk]* 🎫\n\n" .
            "Ada tiket baru yang perlu ditindaklanjuti:\n\n" .
            "ID Tiket: #{$task->id}\n" .
            "Judul: {$this->formatTextForWhatsapp($task->title)}\n" .
            "Dibuat Oleh: {$this->formatTextForWhatsapp($creator->name)}\n" .
            "Urgensi: {$this->formatUrgencyLabel($task->urgency)}\n" .
            "Deadline: {$this->formatDateForWhatsapp($task->deadline)}\n" .
            "Link Terkait: {$this->formatTextForWhatsapp($task->related_url)}\n\n" .
            "*Silakan assign programmer dan tentukan waktu pengerjaan.*\n\n" .
            "Pantau tiket: https://biinsight.id/requests";
    }

    private function buildReviewActionMessage(RevisionRequest $task, $reviewer, string $action, ?string $reviewNote): string
    {
        $actionLabel  = $action === 'accept' ? 'DITERIMA ✅' : 'DITOLAK / PERLU REVISI ❌';
        $noteSection  = $reviewNote
            ? "\nCatatan Revisi:\n{$this->formatTextForWhatsapp($reviewNote)}\n"
            : '';

        $reviewerName = $reviewer->hasRole('admin') ? 'AKSARA TEKNOLOGI MANDIRI' : $reviewer->name;

        return "*[Biinsight - Hasil Review Tiket]* 📋\n\n" .
            "ID Tiket: #{$task->id}\n" .
            "Judul: {$this->formatTextForWhatsapp($task->title)}\n" .
            "Status Review: {$actionLabel}\n" .
            "Direview Oleh: {$this->formatTextForWhatsapp($reviewerName)}\n" .
            $noteSection .
            "\nSilakan cek halaman Ticketing Website Biinsight (https://biinsight.id/requests).";
    }

    private function buildAssignedTaskMessage(RevisionRequest $task, User $technician): string
    {
        $creator     = User::find($task->created_by);
        $creatorName = $creator ? ($creator->hasRole('admin') ? 'AKSARA TEKNOLOGI MANDIRI' : $creator->name) : null;

        return "*[Biinsight - Task Baru Ditugaskan]* 🚀\n\n" .
            "Halo {$technician->name},\n\n" .
            "Kamu mendapatkan penugasan tiket baru dengan detail berikut:\n\n" .
            "ID Tiket: #{$task->id}\n" .
            "Judul: {$this->formatTextForWhatsapp($task->title)}\n" .
            "Prioritas: {$this->formatUrgencyLabel($task->urgency)}\n" .
            "Dibuat Oleh: {$this->formatTextForWhatsapp($creatorName)}\n" .
            "Deadline: {$this->formatDateForWhatsapp($task->deadline)}\n" .
            "Estimasi Mulai: {$this->formatDateForWhatsapp($task->estimation_start)}\n" .
            "Estimasi Selesai: {$this->formatDateForWhatsapp($task->estimation_end)}\n" .
            "Link Terkait: {$this->formatTextForWhatsapp($task->related_url)}\n\n" .
            "Silakan cek halaman Ticketing Website Biinsight (https://biinsight.id/requests) untuk mulai mengerjakan.";
    }

    private function buildStatusChangedMessage(RevisionRequest $task, User $unitUser): string
    {
        $technicianNames = $task->assignees->pluck('name')->join(', ');

        $statusGuidance = $this->buildStatusGuidanceMessage($task->status);

        return "*[Biinsight - Update Status Request]* 📢\n\n" .
            "Halo {$unitUser->name},\n\n" .
            "Status tiket kamu sudah diperbarui dengan rincian:\n\n" .
            "ID Tiket: #{$task->id}\n" .
            "Judul: {$this->formatTextForWhatsapp($task->title)}\n" .
            "Status Terbaru: {$this->formatStatusLabel($task->status)}\n" .
            "Prioritas: {$this->formatUrgencyLabel($task->urgency)}\n" .
            "Ditangani Oleh: {$this->formatTextForWhatsapp($technicianNames)}\n" .
            "Deadline: {$this->formatDateForWhatsapp($task->deadline)}\n" .
            "Estimasi Mulai: {$this->formatDateForWhatsapp($task->estimation_start)}\n" .
            "Estimasi Selesai: {$this->formatDateForWhatsapp($task->estimation_end)}\n" .
            "Link Terkait: {$this->formatTextForWhatsapp($task->related_url)}\n\n" .
            "Tindak Lanjut:\n{$statusGuidance}\n\n" .
            "Silakan pantau progres selanjutnya melalui halaman Ticketing Website Biinsight (https://biinsight.id/requests).";
    }

    private function formatStatusLabel(?string $status): string
    {
        return match ($status) {
            'request'     => 'Request Masuk',
            'todo'        => 'Akan Dikerjakan',
            'in_progress' => 'Sedang Dikerjakan',
            'in_review'   => 'Dalam Review',
            'complete'    => 'Selesai',
            default       => $this->formatTextForWhatsapp($status),
        };
    }

    private function buildStatusGuidanceMessage(?string $status): string
    {
        return match ($status) {
            'todo'        => "- Tiket sudah masuk antrean pengerjaan.\n" .
                "- Tim IT akan mulai bekerja sesuai jadwal estimasi.\n" .
                "- Jika ada informasi tambahan, silakan update di tiket bagian deskripsi.",
            'in_progress' => "- Tiket sedang diproses oleh tim IT.\n" .
                "- Mohon menunggu proses pengerjaan hingga update berikutnya.\n" .
                "- Jika ada perubahan kebutuhan, mohon informasikan secepatnya melalui nomor telepon tim IT.",
            'in_review'   => "- Pengerjaan tiket sudah selesai dan siap untuk ditinjau.\n" .
                "- Mohon sampaikan jika ada revisi dari hasil pekerjaan.\n" .
                "- Jika sudah sesuai, silakan hubungi PIC/IT untuk konfirmasi penyelesaian.",
            'complete'    => "- Tiket telah dinyatakan selesai.\n" .
                "- Terima kasih atas kerja sama Anda.",
            default       => "- Status tiket telah diperbarui.\n" .
                "- Silakan cek detail terbaru pada halaman tiket.",
        };
    }

    private function formatUrgencyLabel(?string $urgency): string
    {
        return match ($urgency) {
            'high'   => 'Tinggi',
            'medium' => 'Sedang',
            'low'    => 'Rendah',
            default  => $this->formatTextForWhatsapp($urgency),
        };
    }

    private function formatDateForWhatsapp(mixed $value): string
    {
        if (empty($value)) {
            return '-';
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('d M Y');
        }

        if (is_string($value)) {
            $timestamp = strtotime($value);

            if ($timestamp !== false) {
                return date('d M Y', $timestamp);
            }

            return trim($value) !== '' ? $value : '-';
        }

        return '-';
    }

    private function formatTextForWhatsapp(mixed $value): string
    {
        if ($value === null) {
            return '-';
        }

        if (is_string($value)) {
            $text = trim($value);
            return $text !== '' ? $text : '-';
        }

        return (string) $value;
    }

    private function formatPhoneNumber(string $phoneNumber): string
    {
        $phoneNumber = preg_replace('/[^0-9]/', '', $phoneNumber);

        if (str_starts_with($phoneNumber, '0')) {
            return '62' . substr($phoneNumber, 1);
        }

        if (str_starts_with($phoneNumber, '62')) {
            return $phoneNumber;
        }

        if (str_starts_with($phoneNumber, '8')) {
            return '62' . $phoneNumber;
        }

        return $phoneNumber;
    }

    private function normalizeNullableIdentifier(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value)) {
            $value = trim($value);
            return $value !== '' ? $value : null;
        }

        if (is_int($value)) {
            return (string) $value;
        }

        return null;
    }
}
