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
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { router } from '@inertiajs/react';
import { useState } from 'react';
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
    created_by_name?: string;
    assigned_to?: number | null;
    assigned_to_name?: string;
    deadline?: string | null;
    estimation_start?: string | null;
    estimation_end?: string | null;
    actual_start?: string | null;
    actual_end?: string | null;
    attachment?: string;
    created_by?: number;
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
        columnBg: 'bg-gray-50 dark:bg-zinc-900/60',
    },
    todo: {
        label: 'Akan Dikerjakan',
        icon: '●',
        headerBg: 'bg-purple-500 dark:bg-purple-600',
        headerBorder: 'border border-purple-500 dark:border-purple-500',
        headerText: 'text-white',
        iconColor: 'text-white',
        columnBg: 'bg-purple-50 dark:bg-purple-950/40',
    },
    in_progress: {
        label: 'Sedang Dikerjakan',
        icon: '↻',
        headerBg: 'bg-blue-400 dark:bg-blue-600',
        headerBorder: 'border border-blue-400 dark:border-blue-500',
        headerText: 'text-white',
        iconColor: 'text-white',
        columnBg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    in_review: {
        label: 'Sedang Ditinjau',
        icon: '◎',
        headerBg: 'bg-orange-400 dark:bg-orange-600',
        headerBorder: 'border border-orange-400 dark:border-orange-500',
        headerText: 'text-white',
        iconColor: 'text-white',
        columnBg: 'bg-orange-50 dark:bg-orange-950/40',
    },
    complete: {
        label: 'Selesai',
        icon: '✓',
        headerBg: 'bg-teal-500 dark:bg-teal-600',
        headerBorder: 'border border-teal-500 dark:border-teal-500',
        headerText: 'text-white',
        iconColor: 'text-white',
        columnBg: 'bg-teal-50 dark:bg-teal-950/40',
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

export default function KanbanBoard({
    tasks,
    users,
    user_role,
    user_id,
}: {
    tasks: Partial<Board>;
    users: User[];
    user_role: unknown;
    user_id?: number;
}) {
    const columns: (keyof Board)[] = ['request', 'todo', 'in_progress', 'in_review', 'complete'];

    const [board, setBoard] = useState<Board>({
        request: tasks?.request ?? [],
        todo: tasks?.todo ?? [],
        in_progress: tasks?.in_progress ?? [],
        in_review: tasks?.in_review ?? [],
        complete: tasks?.complete ?? [],
    });

    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [deleteTask, setDeleteTask] = useState<Task | null>(null);

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
    const canDrag = ['admin', 'technician'].includes(role);

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

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        if (!canDrag) {
            toast.error('Hanya admin atau technician yang bisa memindahkan task');
            return;
        }

        const startColumn = source.droppableId as keyof Board;
        const finishColumn = destination.droppableId as keyof Board;

        const startTasks = Array.from(board[startColumn]);
        const finishTasks = Array.from(board[finishColumn]);
        const task = startTasks[source.index];

        if ((finishColumn === 'todo' || finishColumn === 'in_progress') && (!task.assigned_to || !task.estimation_start || !task.estimation_end)) {
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

        if (startColumn === finishColumn) {
            startTasks.splice(source.index, 1);
            startTasks.splice(destination.index, 0, task);
            setBoard({ ...board, [startColumn]: startTasks });
        } else {
            startTasks.splice(source.index, 1);
            finishTasks.splice(destination.index, 0, task);
            task.status = finishColumn;
            setBoard({
                ...board,
                [startColumn]: startTasks,
                [finishColumn]: finishTasks,
            });
        }

        router.patch(
            `/requests/${draggableId}/status`,
            {
                status: finishColumn,
                assigned_to: task.assigned_to,
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

        if (role === 'technician') {
            return user_id != null ? Number(task.assigned_to) === Number(user_id) : false;
        }

        if (role === 'user') {
            if (user_id == null || task.created_by == null) {
                return true;
            }

            return Number(task.created_by) === Number(user_id);
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

    const renderTaskCard = (task: Task, col: keyof Board) => {
        const overdue = isOverdue(task);

        return (
            <ContextMenu key={task.id}>
                <ContextMenuTrigger asChild>
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            openTask(task);
                        }}
                        className={`relative mb-2 cursor-pointer rounded-xl border p-3 wrap-break-word shadow-sm transition-all duration-200 hover:shadow-md ${
                            overdue
                                ? 'border-red-400 bg-red-50 shadow-red-100 dark:border-red-600 dark:bg-red-950/40'
                                : 'border-transparent bg-white hover:border-gray-200 dark:bg-zinc-900 dark:hover:border-zinc-700'
                        } `}
                    >
                        {overdue && <span className="absolute top-2 right-2 text-xs font-bold text-red-500 dark:text-red-400">!</span>}

                        <p
                            className={`mb-2 pr-4 text-sm leading-snug font-semibold ${overdue ? 'text-red-700 dark:text-red-300' : 'text-gray-800 dark:text-zinc-100'}`}
                        >
                            {task.title}
                        </p>

                        <p className={`mb-3 truncate text-xs ${overdue ? 'text-red-400' : 'text-gray-400 dark:text-zinc-400'}`}>
                            {task.created_by_name || '-'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                            <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${getAvatarColor(task.created_by_name)}`}
                            >
                                {getInitials(task.created_by_name)}
                            </div>

                            {task.deadline && (
                                <div
                                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${overdue ? 'bg-red-500 font-semibold text-white' : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-300'}`}
                                >
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                            {task.assigned_to_name && (
                                <span
                                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
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
                                    {task.assigned_to_name}
                                </span>
                            )}
                        </div>
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
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="w-full">
                    <div className="grid min-w-240 grid-cols-5 gap-3">
                        {columns.map((col) => {
                            const config = COLUMN_CONFIG[col];
                            const count = board[col]?.length ?? 0;

                            return (
                                <div key={col} className="flex flex-col">
                                    <div className={`mb-3 flex items-center gap-2 rounded-full px-3 py-2 ${config.headerBg} ${config.headerBorder}`}>
                                        <span className={`text-sm ${config.iconColor}`}>{config.icon}</span>
                                        <span className={`flex-1 text-xs font-semibold ${config.headerText}`}>{config.label}</span>
                                        {count > 0 && (
                                            <span
                                                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                                                    col === 'request'
                                                        ? 'bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-zinc-200'
                                                        : 'bg-white/30 text-white'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        )}
                                    </div>

                                    <Droppable droppableId={col}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`min-h-100 flex-1 rounded-2xl p-2 transition-colors duration-200 ${config.columnBg} ${snapshot.isDraggingOver ? 'ring-2 ring-gray-300 ring-inset dark:ring-zinc-600' : ''} `}
                                            >
                                                {board[col]?.map((task, index) =>
                                                    canDrag ? (
                                                        <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={snapshot.isDragging ? 'scale-105 rotate-1 opacity-80' : ''}
                                                                >
                                                                    {renderTaskCard(task, col)}
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ) : (
                                                        <div key={task.id}>{renderTaskCard(task, col)}</div>
                                                    ),
                                                )}

                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>

            <TaskModal task={selectedTask} users={users} currentUserId={user_id ?? null} onClose={closeTask} />

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
        </>
    );
}
