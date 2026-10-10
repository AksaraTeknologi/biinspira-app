import TaskModal, { ticketCommentsCache, type Subtask } from '@/components/TaskModal';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    Check,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Hammer,
    Inbox,
    MessageSquare,
    RotateCcw,
    SlidersHorizontal,
    Sparkles,
    User as UserIcon,
    Wrench,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type User = {
    id: number | string;
    name: string;
    role: string;
};

type Application = {
    id: number | string;
    name: string;
    color?: string | null;
};

type Comment = {
    id: number | string;
    body: string;
    user_id: number | string;
    user_name: string;
    created_at: string;
};

type Task = {
    id: number | string;
    title: string;
    description?: string;
    status: 'request' | 'todo' | 'in_progress' | 'in_review' | 'complete';
    urgency: 'low' | 'medium' | 'high';
    target_role?: string;
    created_by_name?: string;
    assignees?: number[] | string[];
    assignees_name?: string | null;
    deadline?: string | null;
    estimation_start?: string | null;
    estimation_end?: string | null;
    actual_start?: string | null;
    actual_end?: string | null;
    attachment?: string;
    created_by?: number | string;
    review_note?: string | null;
    work_type?: 'pengerjaan' | 'penambahan_fitur' | 'maintenance' | null;
    application_id?: number | string | null;
    application?: Application | null;
    comments?: Comment[];
    subtasks?: Subtask[];
};

type Board = {
    request: Task[];
    todo: Task[];
    in_progress: Task[];
    in_review: Task[];
    complete: Task[];
};

const COLUMN_CONFIG = {
    request: {
        label: 'Permintaan',
        icon: '○',
        headerBg: 'bg-white dark:bg-zinc-900',
        headerBorder: 'border border-gray-300 dark:border-zinc-700',
        headerText: 'text-gray-600 dark:text-zinc-200',
        iconColor: 'text-gray-400 dark:text-zinc-400',
        columnBg: 'bg-gray-50/80 dark:bg-zinc-900/60',
    },
    todo: {
        label: 'Akan Dikerjakan',
        icon: '●',
        headerBg: 'bg-purple-500 dark:bg-purple-600',
        headerBorder: 'border border-purple-500 dark:border-purple-500',
        headerText: 'text-white',
        iconColor: 'text-white',
        columnBg: 'bg-purple-50/70 dark:bg-purple-950/30',
    },
    in_progress: {
        label: 'Sedang Dikerjakan',
        icon: '↻',
        headerBg: 'bg-blue-500 dark:bg-primary',
        headerBorder: 'border border-blue-500 dark:border-blue-500',
        headerText: 'text-white',
        iconColor: 'text-white',
        columnBg: 'bg-blue-50/70 dark:bg-blue-950/30',
    },
    in_review: {
        label: 'Sedang Ditinjau',
        icon: '◎',
        headerBg: 'bg-orange-500 dark:bg-orange-600',
        headerBorder: 'border border-orange-500 dark:border-orange-500',
        headerText: 'text-white',
        iconColor: 'text-white',
        columnBg: 'bg-orange-50/70 dark:bg-orange-950/30',
    },
    complete: {
        label: 'Selesai',
        icon: '✓',
        headerBg: 'bg-teal-500 dark:bg-teal-600',
        headerBorder: 'border border-teal-500 dark:border-teal-500',
        headerText: 'text-white',
        iconColor: 'text-white',
        columnBg: 'bg-teal-50/70 dark:bg-teal-950/30',
    },
};

const URGENCY_CONFIG = {
    high: {
        label: 'Tinggi',
        fullLabel: 'Urgensi Tinggi',
        className: 'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
        dot: 'bg-red-500',
    },
    medium: {
        label: 'Sedang',
        fullLabel: 'Urgensi Sedang',
        className: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
        dot: 'bg-amber-500',
    },
    low: {
        label: 'Rendah',
        fullLabel: 'Urgensi Rendah',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50',
        dot: 'bg-emerald-500',
    },
};

const AVATAR_COLORS = ['bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-teal-400', 'bg-orange-400', 'bg-green-400'];

function getAvatarColor(name?: string) {
    if (!name) return 'bg-gray-300';
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
}

function getInitials(name?: string) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

type RejectDialogState = {
    task: Task;
    note: string;
} | null;

type PageSizeOption = 10 | 15 | 20 | 'all';

export default function KanbanBoard({
    tasks,
    users,
    user_role,
    user_id,
    user_name,
    applications = [],
}: {
    tasks: Partial<Board>;
    users: User[];
    user_role: unknown;
    user_id?: number | string;
    user_name?: string;
    applications?: Application[];
}) {
    const columns: (keyof Board)[] = ['request', 'todo', 'in_progress', 'in_review', 'complete'];

    const [board, setBoard] = useState<Board>({
        request: tasks?.request ?? [],
        todo: tasks?.todo ?? [],
        in_progress: tasks?.in_progress ?? [],
        in_review: tasks?.in_review ?? [],
        complete: tasks?.complete ?? [],
    });

    // Pagination & Filter settings
    const [pageSize, setPageSize] = useState<PageSizeOption>(10);
    const [columnPages, setColumnPages] = useState<Record<keyof Board, number>>({
        request: 1,
        todo: 1,
        in_progress: 1,
        in_review: 1,
        complete: 1,
    });
    const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [targetRoleFilter, setTargetRoleFilter] = useState<'all' | 'technician' | 'technician-intern'>('all');
    const [applicationFilter, setApplicationFilter] = useState<'all' | number | string>('all');
    const [workTypeFilter, setWorkTypeFilter] = useState<'all' | 'pengerjaan' | 'penambahan_fitur' | 'maintenance'>('all');

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [openChatInitially, setOpenChatInitially] = useState(false);
    const [deleteTask, setDeleteTask] = useState<Task | null>(null);
    const [rejectDialog, setRejectDialog] = useState<RejectDialogState>(null);
    const [reviewProcessing, setReviewProcessing] = useState(false);

    // Sync board state when tasks prop updates
    useEffect(() => {
        setBoard({
            request: tasks?.request ?? [],
            todo: tasks?.todo ?? [],
            in_progress: tasks?.in_progress ?? [],
            in_review: tasks?.in_review ?? [],
            complete: tasks?.complete ?? [],
        });

        if (selectedTask) {
            const allTasks = Object.values(tasks ?? {}).flat();
            const updated = allTasks.find((t) => t.id === selectedTask.id || String(t.id) === String(selectedTask.id));
            if (updated) {
                setSelectedTask(updated);
            }
        }
    }, [tasks]);

    // Buka task dari event (misal klik notifikasi popover)
    useEffect(() => {
        const handleOpenTask = (e: any) => {
            const taskId = e.detail?.taskId;
            const openChat = e.detail?.openChat;
            if (taskId && tasks) {
                const allTasks = Object.values(tasks).flat();
                const found = allTasks.find((t) => String(t.id) === String(taskId));
                if (found) {
                    setSelectedTask(found);
                    if (openChat) {
                        setOpenChatInitially(true);
                    }
                }
            }
        };

        window.addEventListener('open-ticket-task', handleOpenTask);
        return () => window.removeEventListener('open-ticket-task', handleOpenTask);
    }, [tasks]);

    // Buka task dari query parameter (misal notifikasi: ?open_task=123&open_chat=1)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const openTaskId = params.get('open_task');
        const openChat = params.get('open_chat');

        if (openTaskId && tasks) {
            const allTasks = Object.values(tasks).flat();
            const found = allTasks.find((t) => String(t.id) === String(openTaskId));
            if (found) {
                setSelectedTask(found);
                if (openChat === '1') {
                    setOpenChatInitially(true);
                }
            }
        }
    }, [tasks]);

    const openTask = (task: Task, openChat = false) => {
        setOpenChatInitially(openChat);
        setSelectedTask(task);
    };

    const closeTask = () => {
        setSelectedTask(null);
        setOpenChatInitially(false);
        if (typeof window !== 'undefined' && window.location.search.includes('open_task')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('open_task');
            url.searchParams.delete('open_chat');
            window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
        }
    };

    const handleSubtasksChange = (taskId: number | string, updatedSubtasks: Subtask[]) => {
        setBoard((prev) => {
            const next = { ...prev };
            (Object.keys(next) as Array<keyof Board>).forEach((col) => {
                next[col] = next[col].map((t) => (t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t));
            });
            return next;
        });
        setSelectedTask((prev) => (prev && prev.id === taskId ? { ...prev, subtasks: updatedSubtasks } : prev));
    };

    const normalizeRole = (role: unknown) => {
        if (!role) return '';
        if (typeof role === 'string') return role.toLowerCase();
        if (Array.isArray(role)) {
            const firstRole = role[0] as { name?: string } | string | undefined;
            if (!firstRole) return '';
            if (typeof firstRole === 'string') return firstRole.toLowerCase();
            return firstRole.name?.toLowerCase() ?? '';
        }
        if (typeof role === 'object') {
            const roleObject = role as { name?: string };
            return roleObject.name?.toLowerCase() ?? '';
        }
        return '';
    };

    const role = normalizeRole(user_role);
    const canDrag = ['admin', 'technician', 'technician-intern'].includes(role);

    const isOverdue = (task: Task) => {
        if (!task.deadline) return false;
        const today = new Date();
        const deadline = new Date(task.deadline);
        return deadline < today && task.status !== 'complete' && task.status !== 'in_review';
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    // Filter tasks for a column based on active toolbar filters
    const getFilteredTasksForColumn = (col: keyof Board) => {
        const list = board[col] || [];
        return list.filter((task) => {
            if (urgencyFilter !== 'all' && task.urgency !== urgencyFilter) return false;
            if (targetRoleFilter !== 'all' && task.target_role !== targetRoleFilter) return false;
            if (applicationFilter !== 'all' && String(task.application_id) !== String(applicationFilter)) return false;
            if (workTypeFilter !== 'all' && task.work_type !== workTypeFilter) return false;
            return true;
        });
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        if (!canDrag) {
            toast.error('Hanya admin atau programmer yang bisa memindahkan task');
            return;
        }

        const startColumn = source.droppableId as keyof Board;
        const finishColumn = destination.droppableId as keyof Board;

        const startFiltered = getFilteredTasksForColumn(startColumn);
        const finishFiltered = getFilteredTasksForColumn(finishColumn);

        const limit = pageSize === 'all' ? Infinity : pageSize;
        const startPage = columnPages[startColumn] || 1;
        const finishPage = columnPages[finishColumn] || 1;

        const startPageItems = pageSize === 'all' ? startFiltered : startFiltered.slice((startPage - 1) * limit, startPage * limit);
        const task = startPageItems[source.index];

        if (!task) return;

        // Validation rules
        if (
            (finishColumn === 'todo' || finishColumn === 'in_progress') &&
            (!task.assignees || task.assignees.length === 0 || !task.estimation_start || !task.estimation_end)
        ) {
            toast.error('Isi programmer dan estimasi waktu sebelum memindahkan');
            return;
        }

        if (finishColumn === 'in_review' && startColumn !== 'in_progress') {
            toast.error('Harus dari Sedang Dikerjakan terlebih dahulu');
            return;
        }

        if (finishColumn === 'complete' && startColumn !== 'in_review') {
            toast.error('Harus lewat tahap review terlebih dahulu');
            return;
        }

        const startRawTasks = Array.from(board[startColumn]);
        const finishRawTasks = Array.from(board[finishColumn]);

        const rawSourceIndex = startRawTasks.findIndex((t) => t.id === task.id);
        if (rawSourceIndex === -1) return;

        if (startColumn === finishColumn) {
            const destPageItems = pageSize === 'all' ? finishFiltered : finishFiltered.slice((finishPage - 1) * limit, finishPage * limit);
            let rawDestIndex: number;

            if (destination.index >= destPageItems.length) {
                rawDestIndex = startRawTasks.length - 1;
            } else {
                const destTask = destPageItems[destination.index];
                rawDestIndex = startRawTasks.findIndex((t) => t.id === destTask.id);
                if (rawDestIndex === -1) rawDestIndex = destination.index;
            }

            const [moved] = startRawTasks.splice(rawSourceIndex, 1);
            startRawTasks.splice(rawDestIndex, 0, moved);
            setBoard({ ...board, [startColumn]: startRawTasks });
        } else {
            const destPageItems = pageSize === 'all' ? finishFiltered : finishFiltered.slice((finishPage - 1) * limit, finishPage * limit);
            let rawDestIndex: number;

            if (destination.index >= destPageItems.length) {
                if (destPageItems.length === 0) {
                    rawDestIndex = finishRawTasks.length;
                } else {
                    const lastTask = destPageItems[destPageItems.length - 1];
                    const foundIdx = finishRawTasks.findIndex((t) => t.id === lastTask.id);
                    rawDestIndex = foundIdx !== -1 ? foundIdx + 1 : finishRawTasks.length;
                }
            } else {
                const destTask = destPageItems[destination.index];
                const foundIdx = finishRawTasks.findIndex((t) => t.id === destTask.id);
                rawDestIndex = foundIdx !== -1 ? foundIdx : finishRawTasks.length;
            }

            const [moved] = startRawTasks.splice(rawSourceIndex, 1);
            moved.status = finishColumn;
            finishRawTasks.splice(rawDestIndex, 0, moved);

            setBoard({
                ...board,
                [startColumn]: startRawTasks,
                [finishColumn]: finishRawTasks,
            });
        }

        router.patch(
            `/requests/${draggableId}/status`,
            {
                status: finishColumn,
                assignees: task.assignees || [],
                estimation_start: task.estimation_start,
                estimation_end: task.estimation_end,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onError: () => {
                    toast.error('Gagal update task');
                },
            },
        );
    };

    const canManageTask = (task: Task) => {
        if (role === 'admin') {
            return true;
        }

        // Teknisi tidak bisa edit atau hapus tiket
        if (role === 'technician' || role === 'technician-intern') {
            return false;
        }

        // Hanya admin dan user pembuatnya saja
        if (user_id != null && task.created_by != null) {
            return String(task.created_by) === String(user_id);
        }

        if (user_name && task.created_by_name) {
            return task.created_by_name.trim().toLowerCase() === user_name.trim().toLowerCase();
        }

        return false;
    };

    const isTaskOwner = (task: Task) => {
        if (role === 'admin' && task.created_by_name === 'AKSARA TEKNOLOGI MANDIRI') {
            return true;
        }

        if (user_id != null && task.created_by != null) {
            if (String(task.created_by) === String(user_id)) return true;
        }

        if (user_name != null && task.created_by_name != null) {
            if (task.created_by_name.trim().toLowerCase() === user_name.trim().toLowerCase()) return true;
        }

        return false;
    };

    const removeTaskFromBoard = (taskId: number | string) => {
        setBoard((prev) => ({
            request: prev.request.filter((item) => item.id !== taskId),
            todo: prev.todo.filter((item) => item.id !== taskId),
            in_progress: prev.in_progress.filter((item) => item.id !== taskId),
            in_review: prev.in_review.filter((item) => item.id !== taskId),
            complete: prev.complete.filter((item) => item.id !== taskId),
        }));
    };

    const handleAccept = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        setReviewProcessing(true);
        router.patch(
            `/requests/${task.id}/review`,
            { action: 'accept' },
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    removeTaskFromBoard(task.id);
                    setReviewProcessing(false);
                },
                onError: () => {
                    toast.error('Gagal memproses review');
                    setReviewProcessing(false);
                },
            },
        );
    };

    const handleReject = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!rejectDialog) return;
        setReviewProcessing(true);
        router.patch(
            `/requests/${rejectDialog.task.id}/review`,
            { action: 'reject', review_note: rejectDialog.note },
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: () => {
                    setRejectDialog(null);
                    setReviewProcessing(false);
                },
                onError: () => {
                    toast.error('Gagal memproses review');
                    setReviewProcessing(false);
                },
            },
        );
    };

    const hasActiveFilters =
        urgencyFilter !== 'all' ||
        targetRoleFilter !== 'all' ||
        applicationFilter !== 'all' ||
        workTypeFilter !== 'all';
    const totalAllTasks = Object.values(board).reduce((acc, curr) => acc + (curr?.length || 0), 0);

    const renderTaskCard = (task: Task, col: keyof Board) => {
        const overdue = isOverdue(task);
        const showReviewActions = col === 'in_review' && isTaskOwner(task);
        const urgencyConfig = URGENCY_CONFIG[task.urgency] ?? URGENCY_CONFIG.low;
        const commentCount = ticketCommentsCache.get(task.id)?.length ?? task.comments?.length ?? 0;
        const isInternTask = task.target_role === 'technician-intern';
        const assigneeList = task.assignees_name
            ? task.assignees_name
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [];

        return (
            <ContextMenu key={task.id}>
                <ContextMenuTrigger asChild>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            openTask(task);
                        }}
                        className={`group relative mb-2.5 cursor-pointer rounded-2xl border p-3.5 wrap-break-word shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                            overdue
                                ? 'border-red-200/90 bg-red-50/60 border-l-[3.5px] border-l-red-500 hover:border-red-400 dark:border-red-900/60 dark:bg-red-950/25 dark:border-l-red-400 dark:hover:border-red-700'
                                : isInternTask
                                  ? 'border-amber-200/80 bg-amber-50/50 border-l-[3.5px] border-l-amber-600/90 hover:border-amber-400 dark:border-amber-900/50 dark:bg-amber-950/25 dark:border-l-amber-500 dark:hover:border-amber-600'
                                  : 'border-blue-200/80 bg-blue-50/40 border-l-[3.5px] border-l-blue-500 hover:border-blue-400 dark:border-blue-900/50 dark:bg-blue-950/20 dark:border-l-blue-400 dark:hover:border-blue-600'
                        }`}
                    >
                        {/* Baris 1: Aplikasi Badge & Urgensi Badge */}
                        <div className="mb-2 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                                {task.application ? (
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-semibold border shadow-2xs min-w-0 max-w-32.5 whitespace-nowrap overflow-hidden"
                                        style={{
                                            backgroundColor: `${task.application.color ?? '#3b82f6'}15`,
                                            borderColor: `${task.application.color ?? '#3b82f6'}35`,
                                            color: task.application.color ?? '#3b82f6',
                                        }}
                                        title={`Aplikasi: ${task.application.name}`}
                                    >
                                        <span
                                            className="h-1.5 w-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: task.application.color ?? '#3b82f6' }}
                                        />
                                        <span className="truncate whitespace-nowrap">{task.application.name}</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-zinc-800 dark:text-zinc-400 whitespace-nowrap shrink-0">
                                        Umum
                                    </span>
                                )}
                            </div>

                            {/* Urgency Badge */}
                            <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0 whitespace-nowrap ${urgencyConfig.className}`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${urgencyConfig.dot} shrink-0`} />
                                <span className="whitespace-nowrap">{urgencyConfig.label}</span>
                            </span>
                        </div>

                        {/* Baris 2: Judul Tiket (Satu-satunya elemen yang boleh turun ke bawah/panjang) */}
                        <h3
                            className={`mb-2 text-xs font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary ${
                                overdue ? 'text-red-700 dark:text-red-300' : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                        >
                            {task.title}
                        </h3>

                        {/* Baris 3: Tipe Pengerjaan (Kiri) & Komentar Diskusi (Kanan) - Semua single-line truncate */}
                        <div className="mb-2 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                                {task.work_type ? (
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold min-w-0 max-w-full whitespace-nowrap overflow-hidden ${
                                            task.work_type === 'pengerjaan'
                                                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300'
                                                : task.work_type === 'penambahan_fitur'
                                                  ? 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300'
                                                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                                        }`}
                                    >
                                        {task.work_type === 'pengerjaan' && <Wrench className="h-3 w-3 shrink-0" />}
                                        {task.work_type === 'penambahan_fitur' && <Sparkles className="h-3 w-3 shrink-0" />}
                                        {task.work_type === 'maintenance' && <Hammer className="h-3 w-3 shrink-0" />}
                                        <span className="truncate whitespace-nowrap">
                                            {task.work_type === 'pengerjaan' && 'Pengerjaan'}
                                            {task.work_type === 'penambahan_fitur' && 'Penambahan Fitur'}
                                            {task.work_type === 'maintenance' && 'Maintenance'}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400 whitespace-nowrap shrink-0">
                                        <Wrench className="h-3 w-3 shrink-0 text-gray-400" /> Pengerjaan
                                    </span>
                                )}

                                {task.review_note && col === 'in_progress' && (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 whitespace-nowrap shrink-0">
                                        <AlertCircle className="h-3 w-3 shrink-0" /> Revisi
                                    </span>
                                )}
                            </div>

                            {/* Komentar Diskusi Badge (Rapi di kanan baris tipe, klik langsung fokus chat) */}
                            {commentCount > 0 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openTask(task, true);
                                    }}
                                    title={`${commentCount} pesan diskusi (klik untuk buka chat)`}
                                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[10.5px] font-semibold text-primary dark:text-blue-300 border border-blue-200/70 dark:border-blue-900/60 shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-colors shadow-2xs whitespace-nowrap"
                                >
                                    <MessageSquare className="h-3 w-3 shrink-0 text-primary dark:text-blue-400" />
                                    <span>{commentCount}</span>
                                </button>
                            )}
                        </div>

                        {/* Baris 4: Programmer Penanggung Jawab (Dengan Shadcn Tooltip & truncate nama panjang) */}
                        {assigneeList.length > 0 && (
                            <TooltipProvider delayDuration={500}>
                                <Tooltip delayDuration={500}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="mb-2 flex items-center justify-between gap-1.5 rounded-lg border border-gray-100 bg-gray-50/80 px-2 py-1 text-[11px] text-gray-700 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 max-w-full overflow-hidden"
                                        >
                                            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                                                <UserIcon className="h-3 w-3 shrink-0 text-blue-500 dark:text-blue-400" />
                                                <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 shrink-0 whitespace-nowrap">IT:</span>
                                                <span className="truncate font-medium whitespace-nowrap">{assigneeList[0]}</span>
                                            </div>
                                            {assigneeList.length > 1 && (
                                                <span
                                                    className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.2 text-[9.5px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 shadow-2xs whitespace-nowrap"
                                                >
                                                    +{assigneeList.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs max-w-xs shadow-md">
                                        <p className="font-semibold text-[11px] mb-0.5">Penugasan Programmer:</p>
                                        <p className="text-[11px] text-zinc-100">{task.assignees_name}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {/* Subtask Mini Indicator */}
                        {task.subtasks && task.subtasks.length > 0 && (() => {
                            const total = task.subtasks.length;
                            const completed = task.subtasks.filter((s) => s.is_completed).length;
                            const isAllDone = total > 0 && completed === total;
                            const pct = Math.round((completed / total) * 100);

                            return (
                                <div className="mb-2 rounded-lg border border-gray-100 bg-gray-50/80 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                                    <div className="mb-1 flex items-center justify-between text-[10.5px]">
                                        <div className="flex items-center gap-1 font-semibold text-gray-700 dark:text-zinc-200">
                                            <CheckSquare className={cn('h-3 w-3 shrink-0', isAllDone ? 'text-emerald-500' : 'text-blue-500')} />
                                            <span>Subtask</span>
                                        </div>
                                        <span className={cn('font-bold', isAllDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-zinc-400')}>
                                            {completed}/{total} ({pct}%)
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
                                        <div
                                            className={cn(
                                                'h-full transition-all duration-300',
                                                isAllDone ? 'bg-emerald-500' : 'bg-primary',
                                            )}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Baris 5: Footer Pembuat Tiket (Kiri) dan Deadline (Kanan) */}
                        <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-2 flex items-center justify-between gap-1.5 text-xs">
                            {/* Kiri: Avatar & Nama Pembuat */}
                            <div
                                title={`Dibuat oleh: ${task.created_by_name || '-'}`}
                                className="flex items-center gap-1.5 min-w-0 flex-1 pr-2 overflow-hidden"
                            >
                                <div
                                    className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[8.5px] font-bold text-white shadow-2xs ${getAvatarColor(task.created_by_name)}`}
                                >
                                    {getInitials(task.created_by_name)}
                                </div>
                                <span className="truncate text-[10.5px] text-gray-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                                    {task.created_by_name || '-'}
                                </span>
                            </div>

                            {/* Kanan: Deadline */}
                            {task.deadline && (
                                <div
                                    title={`Deadline: ${formatDate(task.deadline)}`}
                                    className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0 whitespace-nowrap ${
                                        overdue
                                            ? 'bg-red-500 font-semibold text-white'
                                            : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span className="whitespace-nowrap">{formatDate(task.deadline)}</span>
                                </div>
                            )}
                        </div>

                        {/* Review action buttons (only for ticket owner in in_review) */}
                        {showReviewActions && (
                            <div
                                className="mt-2.5 flex items-center gap-2 border-t border-orange-200 pt-2 dark:border-orange-900/40"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Button
                                    size="sm"
                                    disabled={reviewProcessing}
                                    className="h-7 flex-1 gap-1 bg-teal-500 text-[11px] text-white hover:bg-teal-600"
                                    onClick={(e) => handleAccept(task, e)}
                                >
                                    <Check className="h-3 w-3" />
                                    Terima
                                </Button>
                                <Button
                                    size="sm"
                                    disabled={reviewProcessing}
                                    variant="outline"
                                    className="h-7 flex-1 gap-1 border-red-300 text-[11px] text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRejectDialog({ task, note: '' });
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                    Revisi
                                </Button>
                            </div>
                        )}
                    </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-40 dark:border-zinc-700 dark:bg-zinc-900">
                    {canManageTask(task) && (
                        <ContextMenuItem
                            onClick={() => {
                                router.get(route('requests.edit', task.id));
                            }}
                        >
                            Edit
                        </ContextMenuItem>
                    )}

                    {canManageTask(task) && (
                        <ContextMenuItem
                            className="text-red-500 focus:text-red-500"
                            onSelect={(e) => {
                                e.preventDefault();
                                setDeleteTask(task);
                            }}
                        >
                            Delete
                        </ContextMenuItem>
                    )}
                </ContextMenuContent>
            </ContextMenu>
        );
    };

    return (
        <>
            {/* Top Toolbar: Limit Selector & Filters */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span className="font-medium">Batas per Kolom:</span>
                    </div>

                    <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800">
                        {([10, 15, 20, 'all'] as PageSizeOption[]).map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => {
                                    setPageSize(size);
                                    // Reset pages to 1 when changing page size
                                    setColumnPages({
                                        request: 1,
                                        todo: 1,
                                        in_progress: 1,
                                        in_review: 1,
                                        complete: 1,
                                    });
                                }}
                                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                                    pageSize === size
                                        ? 'bg-primary text-white shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                                }`}
                            >
                                {size === 'all' ? 'Semua (Scroll)' : `${size}`}
                            </button>
                        ))}
                    </div>

                    {/* Filter Urgensi */}
                    <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800">
                        {(
                            [
                                { id: 'all', label: 'Semua Urgensi' },
                                { id: 'high', label: 'Tinggi' },
                                { id: 'medium', label: 'Sedang' },
                                { id: 'low', label: 'Rendah' },
                            ] as const
                        ).map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setUrgencyFilter(item.id);
                                    setColumnPages({ request: 1, todo: 1, in_progress: 1, in_review: 1, complete: 1 });
                                }}
                                className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                                    urgencyFilter === item.id
                                        ? 'bg-primary text-white shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Role Technician / Intern Filter */}
                    {(role === 'technician' || role === 'admin') && (
                        <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800">
                            {(
                                [
                                    { id: 'all', label: 'Semua Role' },
                                    { id: 'technician', label: 'Programmer' },
                                    { id: 'technician-intern', label: 'Programmer Magang' },
                                ] as const
                            ).map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        setTargetRoleFilter(item.id);
                                        setColumnPages({ request: 1, todo: 1, in_progress: 1, in_review: 1, complete: 1 });
                                    }}
                                    className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                                        targetRoleFilter === item.id
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Filter Aplikasi */}
                    {applications.length > 0 && (
                        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800">
                            <span className="text-xs text-gray-500 dark:text-zinc-400">Aplikasi:</span>
                            <select
                                value={applicationFilter}
                                onChange={(e) => {
                                    setApplicationFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
                                    setColumnPages({ request: 1, todo: 1, in_progress: 1, in_review: 1, complete: 1 });
                                }}
                                className="bg-transparent text-xs font-medium text-gray-700 focus:outline-none dark:text-zinc-200"
                            >
                                <option value="all">Semua Aplikasi</option>
                                {applications.map((app) => (
                                    <option key={app.id} value={app.id}>
                                        {app.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Filter Work Type */}
                    <div className="flex items-center gap-1.5">
                        <Select
                            value={workTypeFilter}
                            onValueChange={(value) => {
                                setWorkTypeFilter(value as any);
                                setColumnPages({ request: 1, todo: 1, in_progress: 1, in_review: 1, complete: 1 });
                            }}
                        >
                            <SelectTrigger className="h-7 w-auto min-w-32.5 rounded-lg border-gray-200 bg-white px-2.5 text-xs shadow-2xs dark:border-zinc-700 dark:bg-zinc-800">
                                <span className="text-gray-400 dark:text-zinc-500 mr-0.5">Tipe:</span>
                                <SelectValue placeholder="Semua Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    <span className="text-xs">Semua Tipe</span>
                                </SelectItem>
                                <SelectItem value="pengerjaan">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Wrench className="h-3.5 w-3.5 text-blue-500" />
                                        <span>Pengerjaan</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="penambahan_fitur">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                                        <span>Penambahan Fitur</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="maintenance">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Hammer className="h-3.5 w-3.5 text-amber-500" />
                                        <span>Maintenance</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                setUrgencyFilter('all');
                                setTargetRoleFilter('all');
                                setApplicationFilter('all');
                                setWorkTypeFilter('all');
                                setColumnPages({ request: 1, todo: 1, in_progress: 1, in_review: 1, complete: 1 });
                            }}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Reset Filter
                        </button>
                    )}
                </div>

                <div className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                    Total Tiket: <span className="font-bold text-gray-800 dark:text-zinc-200">{totalAllTasks}</span>
                </div>
            </div>

            {/* Kanban Board Columns */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="w-full">
                    <div className="grid min-w-240 grid-cols-5 gap-3.5">
                        {columns.map((col) => {
                            const config = COLUMN_CONFIG[col];
                            const filteredList = getFilteredTasksForColumn(col);
                            const totalCount = filteredList.length;
                            const limit = pageSize === 'all' ? Infinity : pageSize;
                            const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalCount / limit));
                            const currentPage = Math.min(columnPages[col] || 1, totalPages);
                            const paginatedTasks =
                                pageSize === 'all' ? filteredList : filteredList.slice((currentPage - 1) * limit, currentPage * limit);

                            const startItem = totalCount === 0 ? 0 : (currentPage - 1) * (pageSize === 'all' ? totalCount : pageSize) + 1;
                            const endItem = pageSize === 'all' ? totalCount : Math.min(currentPage * pageSize, totalCount);

                            return (
                                <div
                                    key={col}
                                    className="flex flex-col rounded-2xl border border-gray-200/80 bg-gray-50/50 p-2.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/40"
                                >
                                    {/* Column Header */}
                                    <div
                                        className={`mb-2.5 flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${config.headerBg} ${config.headerBorder} shadow-2xs`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className={`text-sm font-bold ${config.iconColor}`}>{config.icon}</span>
                                            <span className={`truncate text-xs font-semibold ${config.headerText}`}>{config.label}</span>
                                        </div>

                                        {totalCount > 0 && (
                                            <span
                                                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                                                    col === 'request'
                                                        ? 'bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-zinc-200'
                                                        : 'bg-white/25 text-white'
                                                }`}
                                            >
                                                {totalCount}
                                            </span>
                                        )}
                                    </div>

                                    {/* Droppable Scroll Area */}
                                    <Droppable droppableId={col}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`max-h-[calc(100vh-320px)] min-h-105 flex-1 overflow-y-auto rounded-xl p-1 transition-colors duration-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent ${
                                                    config.columnBg
                                                } ${snapshot.isDraggingOver ? 'ring-2 ring-blue-400 ring-inset dark:ring-blue-500' : ''}`}
                                            >
                                                {paginatedTasks.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-zinc-500">
                                                        <Inbox className="mb-2 h-7 w-7 stroke-[1.5] opacity-40" />
                                                        <p className="text-xs font-medium">Belum ada tiket</p>
                                                    </div>
                                                ) : (
                                                    paginatedTasks.map((task, index) =>
                                                        canDrag ? (
                                                            <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        className={
                                                                            snapshot.isDragging ? 'scale-105 rotate-1 opacity-90 shadow-xl' : ''
                                                                        }
                                                                    >
                                                                        {renderTaskCard(task, col)}
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ) : (
                                                            <div key={task.id}>{renderTaskCard(task, col)}</div>
                                                        ),
                                                    )
                                                )}

                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>

                                    {/* Column Pagination Footer (when count > pageSize) */}
                                    {pageSize !== 'all' && totalPages > 1 && (
                                        <div className="mt-2.5 flex items-center justify-between border-t border-gray-200/80 px-1 pt-2 dark:border-zinc-800">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={currentPage <= 1}
                                                onClick={() =>
                                                    setColumnPages((prev) => ({
                                                        ...prev,
                                                        [col]: Math.max(1, currentPage - 1),
                                                    }))
                                                }
                                                className="h-6 w-6 rounded-md hover:bg-gray-200 disabled:opacity-25 dark:hover:bg-zinc-800"
                                                title="Halaman sebelumnya"
                                            >
                                                <ChevronLeft className="h-3.5 w-3.5" />
                                            </Button>

                                            <div className="text-center">
                                                <span className="text-[11px] font-semibold text-gray-600 dark:text-zinc-300">
                                                    Hal {currentPage} / {totalPages}
                                                </span>
                                                <span className="block text-[10px] text-gray-400 dark:text-zinc-500">
                                                    ({startItem}-{endItem} dari {totalCount})
                                                </span>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={currentPage >= totalPages}
                                                onClick={() =>
                                                    setColumnPages((prev) => ({
                                                        ...prev,
                                                        [col]: Math.min(totalPages, currentPage + 1),
                                                    }))
                                                }
                                                className="h-6 w-6 rounded-md hover:bg-gray-200 disabled:opacity-25 dark:hover:bg-zinc-800"
                                                title="Halaman berikutnya"
                                            >
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>

            <TaskModal
                task={selectedTask}
                users={users}
                currentUserId={user_id ?? null}
                onClose={closeTask}
                initialOpenChat={openChatInitially}
                onSubtasksChange={handleSubtasksChange}
            />

            {/* Delete Confirmation */}
            <AlertDialog
                open={Boolean(deleteTask)}
                onOpenChange={(open) => {
                    if (!open) setDeleteTask(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus task ini?</AlertDialogTitle>
                        <AlertDialogDescription>Data yang dihapus tidak bisa dikembalikan.</AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>

                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => {
                                if (!deleteTask) return;

                                const deletedTaskId = deleteTask.id;

                                router.delete(route('requests.destroy', deleteTask.id), {
                                    preserveScroll: true,
                                    onSuccess: () => {
                                        removeTaskFromBoard(deletedTaskId);
                                        setSelectedTask((prev) => (prev?.id === deletedTaskId ? null : prev));
                                        setDeleteTask(null);
                                        toast.success('Tiket berhasil dihapus');
                                    },
                                    onError: () => {
                                        toast.error('Gagal hapus tiket');
                                    },
                                });
                            }}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reject / Revision Note Dialog */}
            <AlertDialog
                open={Boolean(rejectDialog)}
                onOpenChange={(open) => {
                    if (!open) setRejectDialog(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kembalikan ke Pengerjaan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tiket akan dikembalikan ke <strong>Sedang Dikerjakan</strong>. Tulis catatan revisi agar programmer mengetahui apa yang perlu
                            diperbaiki.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="my-2">
                        <Textarea
                            placeholder="Contoh: Tombol pada halaman X masih tidak berfungsi, mohon diperbaiki..."
                            className="min-h-28 resize-none"
                            value={rejectDialog?.note ?? ''}
                            onChange={(e) => setRejectDialog((prev) => (prev ? { ...prev, note: e.target.value } : null))}
                        />
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={reviewProcessing}>Batal</AlertDialogCancel>
                        <AlertDialogAction className="bg-orange-500 hover:bg-orange-600" disabled={reviewProcessing} onClick={handleReject}>
                            {reviewProcessing ? 'Memproses...' : 'Kembalikan ke Pengerjaan'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
