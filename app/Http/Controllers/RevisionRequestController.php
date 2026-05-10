<?php

namespace App\Http\Controllers;

use App\Models\RevisionRequest;
use App\Models\RevisionLog;
use App\Models\User;
use Illuminate\Http\Request;
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

        $query = RevisionRequest::with([
            'creator' => function ($q) {
                $q->select('id', 'name')->with('roles');
            },
            'assignee:id,name',
            'attachments'
        ]);

        if ($user->hasRole('admin')) {
            // admin lihat semua
        } elseif ($user->hasRole('technician')) {
            // technician lihat task yg belum ditugaskan atau yg sudah ditugaskan ke dirinya
            $query->where(function ($taskQuery) use ($user) {
                $taskQuery->whereNull('assigned_to')
                    ->orWhere('assigned_to', $user->id);
            });
        } else {
            // user biasa sekarang bisa melihat tiket orang lain juga
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
                    'review_note' => $task->review_note,

                    'attachments' => $task->attachments->map(fn($a) => [
                        'file_path' => $a->file_path
                    ]),

                    'created_by' => $task->created_by,
                    'created_by_name' => $task->creator ? ($task->creator->hasRole('admin') ? 'AKSARA TEKNOLOGI MANDIRI' : $task->creator->name) : null,

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

        return Inertia::render('requests/index', [
            'tasks' => $tasks,
            'users' => $users,
            'user_role' => Auth::user()->getRoleNames()->first(),
            'user_id' => Auth::id(),
            'user_name' => Auth::user()->name,
        ]);
    }

    public function create()
    {
        if (!Auth::user()->hasAnyRole(['user', 'admin'])) {
            abort(403);
        }

        return Inertia::render('requests/create');
    }

    public function store(Request $request)
    {
        if (!Auth::user()->hasAnyRole(['user', 'admin'])) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'related_url' => 'required|string',
            'urgency' => 'required|in:high,medium,low',
            'deadline' => 'required|date',
            'assigned_to' => 'nullable|exists:users,id',
            'attachments' => 'required|array|min:1',
            'attachments.*' => 'required|file|mimes:jpg,png,jpeg,pdf',
        ]);

        $task = RevisionRequest::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'related_url' => $validated['related_url'] ?? null,
            'urgency' => $validated['urgency'],
            'deadline' => $validated['deadline'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'status' => 'request',
            'created_by' => Auth::id(),
        ]);

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                try {
                    $path = $file->store('attachments', 'public');

                    if (!$path) {
                        Log::error('File store returned null', [
                            'filename' => $file->getClientOriginalName(),
                            'task_id' => $task->id,
                        ]);
                        continue;
                    }

                    $task->attachments()->create([
                        'file_path' => $path
                    ]);
                } catch (\Exception $e) {
                    Log::error('File upload error', [
                        'error' => $e->getMessage(),
                        'filename' => $file->getClientOriginalName(),
                        'task_id' => $task->id,
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

        if ($user->hasRole('technician') && $task->assigned_to !== $user->id) abort(403);
        if ($user->hasRole('user') && $task->created_by !== $user->id) abort(403);

        return Inertia::render('requests/edit', [
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'related_url' => $task->related_url,
                'urgency' => $task->urgency,
                'deadline' => $task->deadline,
                'assigned_to' => $task->assigned_to,
                'attachments' => $task->attachments->map(fn($a) => [
                    'file_path' => $a->file_path,
                ]),
            ]
        ]);
    }

    public function destroy($id)
    {
        $task = RevisionRequest::findOrFail($id);
        $user = Auth::user();

        if ($user->hasRole('technician') && $task->assigned_to !== $user->id) abort(403);

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

        // 🔐 AUTH
        if ($user->hasRole('technician')) {
            $isAssignedToSelf = (string) $task->assigned_to === (string) $user->id;
            $isUnassigned = $task->assigned_to === null;
            $incomingAssignedTo = $request->input('assigned_to');

            if (! $isAssignedToSelf && ! $isUnassigned) {
                abort(403);
            }

            if ($incomingAssignedTo !== null && (string) $incomingAssignedTo !== (string) $user->id) {
                abort(403);
            }

            if ($isUnassigned && (string) $incomingAssignedTo !== (string) $user->id) {
                abort(403);
            }
        }
        if ($user->hasRole('user') && $task->created_by !== $user->id) abort(403);

        // ✅ VALIDASI
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'related_url' => 'required|string',
            'urgency' => 'required|in:high,medium,low',
            'deadline' => 'required|date',
            'assigned_to' => 'nullable|exists:users,id',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|mimes:jpg,png,jpeg,pdf',
        ]);

        if (! $request->hasFile('attachments') && $task->attachments()->count() === 0) {
            return back()
                ->withErrors(['attachments' => 'Lampiran wajib diisi.'])
                ->withInput();
        }

        // ✅ UPDATE DATA
        $task->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'related_url' => $validated['related_url'] ?? null,
            'urgency' => $validated['urgency'],
            'deadline' => $validated['deadline'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
        ]);

        // ✅ HANDLE FILE BARU (optional, gak hapus lama)
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                try {
                    $path = $file->store('attachments', 'public');

                    if (!$path) {
                        Log::error('File store returned null', [
                            'filename' => $file->getClientOriginalName(),
                            'task_id' => $task->id,
                        ]);
                        continue;
                    }

                    $task->attachments()->create([
                        'file_path' => $path
                    ]);
                } catch (\Exception $e) {
                    Log::error('File upload error', [
                        'error' => $e->getMessage(),
                        'filename' => $file->getClientOriginalName(),
                        'task_id' => $task->id,
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

        if (!$user->hasAnyRole(['technician', 'admin'])) {
            abort(403);
        }

        $task = RevisionRequest::findOrFail($id);

        $oldStatus = $task->status;
        $oldAssigned = $task->assigned_to;

        // =========================
        // VALIDATION RULES
        // =========================
        $rules = [
            'status' => 'required|in:request,todo,in_progress,in_review,complete',
            'assigned_to' => 'nullable|exists:users,id',
            'estimation_start' => 'nullable|date',
            'estimation_end' => 'nullable|date',
        ];

        if (in_array($request->status, ['todo', 'in_progress'])) {
            $rules['assigned_to'] = 'required|exists:users,id';
            $rules['estimation_start'] = 'required|date';
            $rules['estimation_end'] = 'required|date|after_or_equal:estimation_start';
        }

        $validated = $request->validate($rules);

        // =========================
        // UPDATE TASK
        // =========================
        $task->update($validated);

        Log::info('Revision request status update processed', [
            'revision_id' => $task->id,
            'updated_by' => $user->id,
            'old_status' => $oldStatus,
            'new_status' => $task->status,
            'old_assigned_to' => $oldAssigned,
            'assigned_to' => $validated['assigned_to'] ?? null,
        ]);

        // =========================
        // WHATSAPP NOTIF (ASSIGN CHANGE)
        // =========================
        $this->notifyAssignedTechnician($task, $validated['assigned_to'] ?? null, $oldAssigned);

        // =========================
        // STATUS CHANGE LOG + NOTIF
        // =========================
        if ($oldStatus !== $task->status) {

            RevisionLog::create([
                'revision_id' => $task->id,
                'from_status' => $oldStatus,
                'to_status' => $task->status,
                'changed_by' => $user->id,
                'changed_at' => now(),
            ]);

            $unitUser = User::find($task->created_by);

            if (!$unitUser) {
                Log::warning('Skip task creator notifications', [
                    'revision_id' => $task->id,
                    'created_by' => $task->created_by,
                    'reason' => 'creator_not_found',
                ]);
            } elseif (!$unitUser->hasRole('admin')) {
                Log::info('Dispatching task creator notifications', [
                    'revision_id' => $task->id,
                    'creator_user_id' => $unitUser->id,
                    'has_phone' => !empty($unitUser->phone),
                ]);

                $unitUser->notify(new TaskStatusUpdated($task));

                $this->notifyTaskCreatorStatusUpdate($task, $unitUser);
            } else {
                Log::info('Skip task creator notifications', [
                    'revision_id' => $task->id,
                    'reason' => 'creator_is_admin',
                ]);
            }
        } else {
            Log::info('Skip task creator notifications', [
                'revision_id' => $task->id,
                'old_status' => $oldStatus,
                'new_status' => $task->status,
                'reason' => 'status_unchanged',
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
        if ((int) $task->created_by !== (int) $user->id) {
            abort(403, 'Hanya pembuat tiket yang dapat melakukan aksi review.');
        }

        if ($task->status !== 'in_review') {
            return back()->withErrors(['action' => 'Tiket harus berada di tahap review terlebih dahulu.']);
        }

        $validated = $request->validate([
            'action' => 'required|in:accept,reject',
            'review_note' => 'nullable|string|max:2000',
        ]);

        $oldStatus = $task->status;

        if ($validated['action'] === 'accept') {
            $task->update([
                'status' => 'complete',
                'review_note' => null,
            ]);
        } else {
            // reject → kembali ke in_progress
            $task->update([
                'status' => 'in_progress',
                'review_note' => $validated['review_note'] ?? null,
            ]);
        }

        RevisionLog::create([
            'revision_id' => $task->id,
            'from_status' => $oldStatus,
            'to_status' => $task->status,
            'changed_by' => $user->id,
            'changed_at' => now(),
        ]);

        // Notif WA ke teknisi tentang hasil review
        if ($task->assigned_to) {
            $technician = User::find($task->assigned_to);
            if ($technician) {
                $message = $this->buildReviewActionMessage($task, $user, $validated['action'], $validated['review_note'] ?? null);
                $this->sendWhatsappMessage($technician->phone, $message, [
                    'revision_id' => $task->id,
                    'event' => 'review_action_' . $validated['action'],
                ]);
            }
        }

        $statusLabel = $validated['action'] === 'accept' ? 'diterima dan ditandai Selesai' : 'dikembalikan ke Pengerjaan';

        return redirect()
            ->route('requests.index')
            ->with('success', "Hasil review tiket berhasil {$statusLabel}.");
    }

    private function notifyAssignedTechnician(RevisionRequest $task, int|string|null $assignedTo, int|string|null $oldAssigned): void
    {
        $assignedToRaw = $assignedTo;
        $oldAssignedRaw = $oldAssigned;

        $assignedTo = $this->normalizeNullableIdentifier($assignedTo);
        $oldAssigned = $this->normalizeNullableIdentifier($oldAssigned);

        if (!$assignedTo || $oldAssigned === $assignedTo) {
            Log::info('Skip WhatsApp assignment notification', [
                'revision_id' => $task->id,
                'assigned_to_raw' => $assignedToRaw,
                'old_assigned_to_raw' => $oldAssignedRaw,
                'assigned_to' => $assignedTo,
                'old_assigned_to' => $oldAssigned,
                'reason' => 'no_new_assignee_or_assignee_unchanged',
            ]);
            return;
        }

        $technician = User::find($assignedTo);

        if (!$technician) {
            Log::warning('Skip WhatsApp assignment notification', [
                'revision_id' => $task->id,
                'assigned_to' => $assignedTo,
                'reason' => 'technician_not_found',
            ]);
            return;
        }

        $message = $this->buildAssignedTaskMessage($task, $technician);

        $this->sendWhatsappMessage($technician->phone, $message, [
            'revision_id' => $task->id,
            'recipient_user_id' => $technician->id,
            'event' => 'assigned_to_technician',
        ]);
    }

    private function notifyTaskCreatorStatusUpdate(RevisionRequest $task, User $unitUser): void
    {
        $message = $this->buildStatusChangedMessage($task, $unitUser);

        $this->sendWhatsappMessage($unitUser->phone, $message, [
            'revision_id' => $task->id,
            'recipient_user_id' => $unitUser->id,
            'event' => 'status_changed_for_creator',
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
                'reason' => 'invalid_phone_after_normalization',
                'phone_original' => $phone,
            ]));
            return;
        }

        $waData = [
            [
                'phone' => $phoneNumber,
                'message' => $message,
                'isGroup' => 'false',
            ],
        ];

        Log::info('Attempting WhatsApp message via Wablas', array_merge($context, [
            'phone_original' => $phone,
            'phone' => $phoneNumber,
            'message_length' => strlen($message),
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
        $message = $this->buildNewTicketAdminMessage($task, $creator);

        $this->sendWhatsappMessage($adminPhone, $message, [
            'revision_id' => $task->id,
            'event' => 'new_ticket_created',
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
            "*Silakan assign teknisi/programmer dan tentukan waktu pengerjaan.*\n\n" .
            "Pantau tiket: https://biinsight.id/requests";
    }

    private function buildReviewActionMessage(RevisionRequest $task, $reviewer, string $action, ?string $reviewNote): string
    {
        $actionLabel = $action === 'accept' ? 'DITERIMA ✅' : 'DITOLAK / PERLU REVISI ❌';
        $noteSection = $reviewNote
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
        $creator = User::find($task->created_by);
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
        $technicianName = $task->assigned_to
            ? User::find($task->assigned_to)?->name
            : null;

        $statusGuidance = $this->buildStatusGuidanceMessage($task->status);

        return "*[Biinsight - Update Status Request]* 📢\n\n" .
            "Halo {$unitUser->name},\n\n" .
            "Status tiket kamu sudah diperbarui dengan rincian:\n\n" .
            "ID Tiket: #{$task->id}\n" .
            "Judul: {$this->formatTextForWhatsapp($task->title)}\n" .
            "Status Terbaru: {$this->formatStatusLabel($task->status)}\n" .
            "Prioritas: {$this->formatUrgencyLabel($task->urgency)}\n" .
            "Ditangani Oleh: {$this->formatTextForWhatsapp($technicianName)}\n" .
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
            'request' => 'Request Masuk',
            'todo' => 'Akan Dikerjakan',
            'in_progress' => 'Sedang Dikerjakan',
            'in_review' => 'Dalam Review',
            'complete' => 'Selesai',
            default => $this->formatTextForWhatsapp($status),
        };
    }

    private function buildStatusGuidanceMessage(?string $status): string
    {
        return match ($status) {
            'todo' => "- Tiket sudah masuk antrean pengerjaan.\n" .
                "- Tim IT akan mulai bekerja sesuai jadwal estimasi.\n" .
                "- Jika ada informasi tambahan, silakan update di tiket bagian deskripsi.",
            'in_progress' => "- Tiket sedang diproses oleh tim IT.\n" .
                "- Mohon menunggu proses pengerjaan hingga update berikutnya.\n" .
                "- Jika ada perubahan kebutuhan, mohon informasikan secepatnya melalui nomor telepon tim IT.",
            'in_review' => "- Pengerjaan tiket sudah selesai dan siap untuk ditinjau.\n" .
                "- Mohon sampaikan jika ada revisi dari hasil pekerjaan.\n" .
                "- Jika sudah sesuai, silakan hubungi PIC/IT untuk konfirmasi penyelesaian.",
            'complete' => "- Tiket telah dinyatakan selesai.\n" .
                "- Terima kasih atas kerja sama Anda.",
            default => "- Status tiket telah diperbarui.\n" .
                "- Silakan cek detail terbaru pada halaman tiket.",
        };
    }

    private function formatUrgencyLabel(?string $urgency): string
    {
        return match ($urgency) {
            'high' => 'Tinggi',
            'medium' => 'Sedang',
            'low' => 'Rendah',
            default => $this->formatTextForWhatsapp($urgency),
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
