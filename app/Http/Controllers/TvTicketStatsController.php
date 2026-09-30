<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\RevisionRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TvTicketStatsController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('tv/ticket-stats', [
            'ticketData'  => Inertia::defer(fn () => $this->buildTicketPayload()),
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        return response()->json($this->buildTicketPayload());
    }

    private function buildTicketPayload(): array
    {
        $allActive = RevisionRequest::with([
            'application:id,name,color,slug',
            'assignees:id,name',
            'creator:id,name',
        ])
        ->whereIn('status', ['todo', 'in_progress', 'in_review'])
        ->latest()
        ->get();

        // 1. KPI Counts
        $summary = [
            'total_active'     => $allActive->count(),
            'in_progress'      => $allActive->where('status', 'in_progress')->count(),
            'todo'             => $allActive->where('status', 'todo')->count(),
            'in_review'        => $allActive->where('status', 'in_review')->count(),
            'pengerjaan'       => $allActive->where('work_type', 'pengerjaan')->count(),
            'penambahan_fitur' => $allActive->where('work_type', 'penambahan_fitur')->count(),
            'maintenance'      => $allActive->where('work_type', 'maintenance')->count(),
            'unassigned_type'  => $allActive->whereNull('work_type')->count(),
            'completed_week'   => RevisionRequest::where('status', 'complete')
                                    ->where('updated_at', '>=', now()->subDays(7))
                                    ->count(),
        ];

        // Format task helper
        $formatTask = function ($task) {
            $deadline = $task->deadline ? Carbon::parse($task->deadline) : null;
            $diffDays = $deadline ? (int) now()->startOfDay()->diffInDays($deadline->startOfDay(), false) : null;

            $deadlineLabel = '-';
            $isOverdue = false;
            if ($deadline) {
                if ($diffDays < 0) {
                    $deadlineLabel = 'Lewat ' . abs($diffDays) . ' hr';
                    $isOverdue = true;
                } elseif ($diffDays === 0) {
                    $deadlineLabel = 'Hari ini';
                } elseif ($diffDays === 1) {
                    $deadlineLabel = 'Besok';
                } else {
                    $deadlineLabel = $diffDays . ' hr lagi';
                }
            }

            return [
                'id'               => $task->id,
                'title'            => $task->title,
                'description'      => $task->description,
                'status'           => $task->status,
                'urgency'          => $task->urgency,
                'target_role'      => $task->target_role,
                'work_type'        => $task->work_type,
                'deadline'         => $task->deadline,
                'deadline_label'   => $deadlineLabel,
                'is_overdue'       => $isOverdue,
                'estimation_start' => $task->estimation_start,
                'estimation_end'   => $task->estimation_end,
                'application'      => $task->application ? [
                    'id'    => $task->application->id,
                    'name'  => $task->application->name,
                    'color' => $task->application->color,
                ] : null,
                'assignees'        => $task->assignees->map(fn ($u) => [
                    'id'   => $u->id,
                    'name' => $u->name,
                ]),
                'assignees_name'   => $task->assignees->pluck('name')->join(', '),
                'creator_name'     => $task->creator?->name ?? 'User',
            ];
        };

        // 2. Currently In-Progress Tasks
        $inProgressTasks = $allActive->where('status', 'in_progress')->map($formatTask)->values();

        // 3. Application Groups
        $applications = Application::where('is_active', true)->orderBy('name')->get();

        $appStats = [];
        foreach ($applications as $app) {
            $appTasks = $allActive->where('application_id', $app->id);
            if ($appTasks->count() > 0) {
                $appStats[] = [
                    'id'                => (string) $app->id,
                    'name'              => $app->name,
                    'color'             => $app->color ?? '#3B82F6',
                    'description'       => $app->description,
                    'total_tasks'       => $appTasks->count(),
                    'in_progress_count' => $appTasks->where('status', 'in_progress')->count(),
                    'todo_count'        => $appTasks->where('status', 'todo')->count(),
                    'in_review_count'   => $appTasks->where('status', 'in_review')->count(),
                    'pengerjaan_count'  => $appTasks->where('work_type', 'pengerjaan')->count(),
                    'fitur_count'       => $appTasks->where('work_type', 'penambahan_fitur')->count(),
                    'maintenance_count' => $appTasks->where('work_type', 'maintenance')->count(),
                    'tasks'             => $appTasks->map($formatTask)->values(),
                ];
            }
        }

        // Tasks without specific application
        $generalTasks = $allActive->whereNull('application_id');
        if ($generalTasks->count() > 0) {
            $appStats[] = [
                'id'                => 'general',
                'name'              => 'Umum / Lainnya',
                'color'             => '#6B7280',
                'description'       => 'Tiket sistem umum tanpa aplikasi spesifik',
                'total_tasks'       => $generalTasks->count(),
                'in_progress_count' => $generalTasks->where('status', 'in_progress')->count(),
                'todo_count'        => $generalTasks->where('status', 'todo')->count(),
                'in_review_count'   => $generalTasks->where('status', 'in_review')->count(),
                'pengerjaan_count'  => $generalTasks->where('work_type', 'pengerjaan')->count(),
                'fitur_count'       => $generalTasks->where('work_type', 'penambahan_fitur')->count(),
                'maintenance_count' => $generalTasks->where('work_type', 'maintenance')->count(),
                'tasks'             => $generalTasks->map($formatTask)->values(),
            ];
        }

        // 4. Programmer Workload (Technician & Intern)
        $programmers = User::role(['technician', 'technician-intern'])
            ->with(['roles'])
            ->get();

        $programmerStats = [];
        foreach ($programmers as $prog) {
            $progTasks = $allActive->filter(fn ($t) => $t->assignees->contains('id', $prog->id));
            $programmerStats[] = [
                'id'                => (string) $prog->id,
                'name'              => $prog->name,
                'role'              => $prog->hasRole('technician') ? 'Programmer' : 'Programmer Magang',
                'is_intern'         => $prog->hasRole('technician-intern'),
                'total_assigned'    => $progTasks->count(),
                'in_progress_count' => $progTasks->where('status', 'in_progress')->count(),
                'tasks'             => $progTasks->map($formatTask)->values(),
            ];
        }

        usort($programmerStats, fn ($a, $b) => $b['in_progress_count'] <=> $a['in_progress_count'] ?: $b['total_assigned'] <=> $a['total_assigned']);

        return [
            'summary'           => $summary,
            'in_progress_tasks' => $inProgressTasks,
            'applications'      => $appStats,
            'programmers'       => $programmerStats,
            'all_tasks'         => $allActive->map($formatTask)->values(),
        ];
    }
}
