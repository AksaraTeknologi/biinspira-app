import TaskModal from '@/components/TaskModal';
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
import { Textarea } from '@/components/ui/textarea';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { router } from '@inertiajs/react';
import { AlertCircle, Check, ChevronLeft, ChevronRight, Inbox, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type User = {
    id: number;
    name: string;
    role: string;
};

type Task = {
    id: number;
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
    created_by?: number;
    review_note?: string | null;
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
    high: { label: 'Urgensi Tinggi', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    medium: { label: 'Urgensi Sedang', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
    low: { label: 'Urgensi Rendah', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
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
}: {
    tasks: Partial<Board>;
    users: User[];
    user_role: unknown;
    user_id?: number;
    user_name?: string;
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

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
    }, [tasks]);

    const openTask = (task: Task) => setSelectedTask(task);
    const closeTask = () => setSelectedTask(null);

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

        if (role === 'technician' || role === 'technician-intern') {
            return user_id != null ? Boolean(task.assignees?.some((id) => Number(id) === Number(user_id))) : false;
        }

        if (role === 'user') {
            if (user_id == null || task.created_by == null) {
                return true;
            }

            return Number(task.created_by) === Number(user_id);
        }

        return false;
    };

    const isTaskOwner = (task: Task) => {
        if (role === 'admin' && task.created_by_name === 'AKSARA TEKNOLOGI MANDIRI') {
            return true;
        }

        if (user_id != null && task.created_by != null) {
            if (Number(task.created_by) === Number(user_id)) return true;
        }

        if (user_name != null && task.created_by_name != null) {
            if (task.created_by_name === user_name) return true;
        }

        return false;
    };

    const removeTaskFromBoard = (taskId: number) => {
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
                    toast.success('Tiket dikembalikan ke Sedang Dikerjakan');
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

    const hasActiveFilters = urgencyFilter !== 'all' || targetRoleFilter !== 'all';
    const totalAllTasks = Object.values(board).reduce((acc, curr) => acc + (curr?.length || 0), 0);

    const renderTaskCard = (task: Task, col: keyof Board) => {
        const overdue = isOverdue(task);
        const showReviewActions = col === 'in_review' && isTaskOwner(task);
        const urgencyConfig = URGENCY_CONFIG[task.urgency] ?? URGENCY_CONFIG.low;

        return (
            <ContextMenu key={task.id}>
                <ContextMenuTrigger asChild>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            openTask(task);
                        }}
                        className={`group relative mb-2.5 cursor-pointer rounded-xl border p-3.5 wrap-break-word shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                            overdue
                                ? 'border-red-300 bg-red-50/90 shadow-red-100 dark:border-red-900/60 dark:bg-red-950/40'
                                : 'border-gray-200/80 bg-white hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                        }`}
                    >
                        {overdue && (
                            <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
                                !
                            </span>
                        )}

                        <p
                            className={`mb-1.5 pr-4 text-xs leading-relaxed font-semibold ${overdue ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-zinc-100'}`}
                        >
                            {task.title}
                        </p>

                        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                            {/* Urgency badge */}
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${urgencyConfig.className}`}>
                                {urgencyConfig.label}
                            </span>

                            {(role === 'technician' || role === 'admin') && task.target_role === 'technician-intern' && (
                                <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    Untuk Intern
                                </span>
                            )}
                        </div>

                        <p className={`mb-3 truncate text-[11px] font-medium ${overdue ? 'text-red-400' : 'text-gray-400 dark:text-zinc-500'}`}>
                            {task.created_by_name || '-'}
                        </p>

                        {/* Review note preview */}
                        {task.review_note && col === 'in_progress' && (
                            <div className="mb-2.5">
                                <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                                    <AlertCircle className="h-3 w-3" /> Ada Revisi
                                </span>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <div
                                title={task.created_by_name || ''}
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-2xs ${getAvatarColor(task.created_by_name)}`}
                            >
                                {getInitials(task.created_by_name)}
                            </div>

                            {task.deadline && (
                                <div
                                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        overdue
                                            ? 'bg-red-500 font-semibold text-white'
                                            : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    {formatDate(task.deadline)}
                                </div>
                            )}

                            {task.assignees_name && (
                                <span
                                    title={task.assignees_name}
                                    className={`inline-block max-w-[130px] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                        overdue
                                            ? 'bg-red-500 text-white'
                                            : col === 'todo'
                                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
                                              : col === 'in_progress'
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                                                : col === 'in_review'
                                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200'
                                                  : col === 'complete'
                                                    ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300'
                                    }`}
                                >
                                    {task.assignees_name}
                                </span>
                            )}
                        </div>

                        {/* Review action buttons (only for ticket owner in in_review) */}
                        {showReviewActions && (
                            <div
                                className="mt-3 flex items-center gap-2 border-t border-orange-200 pt-2.5 dark:border-orange-900/40"
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

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => {
                                setUrgencyFilter('all');
                                setTargetRoleFilter('all');
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
                                                className={`max-h-[calc(100vh-320px)] min-h-[420px] flex-1 overflow-y-auto rounded-xl p-1 transition-colors duration-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-track]:bg-transparent ${
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

            <TaskModal task={selectedTask} users={users} currentUserId={user_id ?? null} onClose={closeTask} />

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
