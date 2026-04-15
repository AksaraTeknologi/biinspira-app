import { useState } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { router } from "@inertiajs/react"
import TaskModal from "./TaskModal"
import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
} from "@/components/ui/context-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/* =========================
   TYPES
========================= */

type User = {
    id: number
    name: string
    role: string
}

type Task = {
    id: number
    title: string
    description?: string
    status: string
    urgency: "low" | "medium" | "high"
    created_by_name?: string
    assigned_to?: number
    assigned_to_name?: string
    deadline?: string
    estimation_start?: string
    estimation_end?: string
    actual_start?: string
    actual_end?: string
    attachment?: string
    created_by?: number
}

type Board = {
    request: Task[]
    todo: Task[]
    in_progress: Task[]
    in_review: Task[]
    complete: Task[]
}

/* =========================
   COLUMN CONFIG
========================= */

const COLUMN_CONFIG = {
    request: {
        label: "Permintaan",
        icon: "○",
        headerBg: "bg-white",
        headerBorder: "border border-gray-300",
        headerText: "text-gray-600",
        iconColor: "text-gray-400",
        columnBg: "bg-gray-50",
        dotColor: "bg-gray-400",
    },
    todo: {
        label: "Akan Dikerjakan",
        icon: "●",
        headerBg: "bg-purple-500",
        headerBorder: "border border-purple-500",
        headerText: "text-white",
        iconColor: "text-white",
        columnBg: "bg-purple-50",
        dotColor: "bg-purple-400",
    },
    in_progress: {
        label: "Sedang Dikerjakan",
        icon: "↻",
        headerBg: "bg-blue-400",
        headerBorder: "border border-blue-400",
        headerText: "text-white",
        iconColor: "text-white",
        columnBg: "bg-blue-50",
        dotColor: "bg-blue-400",
    },
    in_review: {
        label: "Sedang Ditinjau",
        icon: "◎",
        headerBg: "bg-orange-400",
        headerBorder: "border border-orange-400",
        headerText: "text-white",
        iconColor: "text-white",
        columnBg: "bg-orange-50",
        dotColor: "bg-orange-400",
    },
    complete: {
        label: "Selesai",
        icon: "✓",
        headerBg: "bg-teal-500",
        headerBorder: "border border-teal-500",
        headerText: "text-white",
        iconColor: "text-white",
        columnBg: "bg-teal-50",
        dotColor: "bg-teal-400",
    },
}

/* =========================
   TOAST
========================= */

function showToast(
    message: string,
    type: "success" | "error" | "info" = "info"
) {
    const toast = document.createElement("div")

    const base =
        "fixed top-5 right-5 px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 text-sm font-medium backdrop-blur-md border transition-all duration-300 animate-slideIn"

    const variants = {
        success: "bg-green-50 text-green-700 border-green-200",
        error: "bg-red-50 text-red-700 border-red-200",
        info: "bg-gray-900 text-white border-gray-800",
    }

    const icons = {
        success: "✓",
        error: "⚠",
        info: "ℹ",
    }

    toast.className = `${base} ${variants[type]}`
    toast.innerHTML = `
        <span class="text-base">${icons[type]}</span>
        <span>${message}</span>
    `

    document.body.appendChild(toast)

    setTimeout(() => {
        toast.style.opacity = "0"
        toast.style.transform = "translateY(-10px)"
        setTimeout(() => toast.remove(), 300)
    }, 2500)
}

/* =========================
   AVATAR COLORS
========================= */

const AVATAR_COLORS = [
    "bg-blue-400",
    "bg-purple-400",
    "bg-pink-400",
    "bg-teal-400",
    "bg-orange-400",
    "bg-green-400",
]

function getAvatarColor(name?: string) {
    if (!name) return "bg-gray-300"
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length
    return AVATAR_COLORS[idx]
}

function getInitials(name?: string) {
    if (!name) return "?"
    const parts = name.trim().split(" ")
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase()
}



/* =========================
   COMPONENT
========================= */

export default function KanbanBoard({
    tasks,
    users,
    user_role,
    user_id,

}: {
    tasks: Partial<Board>
    users: User[]
    user_role: string
    user_id: number
}) {
    const columns: (keyof Board)[] = [
        "request",
        "todo",
        "in_progress",
        "in_review",
        "complete",
    ]

    const [board, setBoard] = useState<Board>({
        request: tasks?.request ?? [],
        todo: tasks?.todo ?? [],
        in_progress: tasks?.in_progress ?? [],
        in_review: tasks?.in_review ?? [],
        complete: tasks?.complete ?? [],
    })

    const [selectedTask, setSelectedTask] = useState<Task | null>(null)

    const openTask = (task: Task) => setSelectedTask(task)
    const closeTask = () => setSelectedTask(null)

    const urgencyBadge = (level: string) => {
        if (level === "high") return "bg-red-500 text-white"
        if (level === "medium") return "bg-orange-400 text-white"
        return "bg-green-400 text-white"
    }
    const normalizeRole = (role: any) => {
        if (!role) return ""
        if (typeof role === "string") return role.toLowerCase()
        if (Array.isArray(role)) return role[0]?.name?.toLowerCase?.() ?? ""
        if (typeof role === "object") return role.name?.toLowerCase?.() ?? ""
        return ""
    }

    const role = normalizeRole(user_role)
    const canDrag = ["admin", "technician"].includes(role)

    /* =========================
       OVERDUE CHECK
    ========================= */

    const isOverdue = (task: Task) => {
        if (!task.deadline) return false
        const today = new Date()
        const deadline = new Date(task.deadline)
        return (
            deadline < today &&
            task.status !== "complete" &&
            task.status !== "in_review"
        )
    }

    /* =========================
       FORMAT DATE
    ========================= */

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null
        const d = new Date(dateStr)
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
    }

    /* =========================
       DRAG DROP
    ========================= */

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result

        if (!destination) return
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) return

        if (!canDrag) {
            showToast("Hanya admin atau technician yang bisa memindahkan task!")
            return
        }

        const startColumn = source.droppableId as keyof Board
        const finishColumn = destination.droppableId as keyof Board

        const startTasks = Array.from(board[startColumn])
        const finishTasks = Array.from(board[finishColumn])

        const task = startTasks[source.index]

        // 🔥 VALIDASI DATA (TEKNISI + ESTIMASI)
        if (
            (finishColumn === "todo" || finishColumn === "in_progress") &&
            (!task.assigned_to || !task.estimation_start || !task.estimation_end)
        ) {
            showToast("Isi teknisi & estimasi waktu sebelum memindahkan")
            return
        }

        // 🔥 VALIDASI FLOW (ANTI LONCAT)
        if (
            finishColumn === "in_review" &&
            startColumn !== "in_progress"
        ) {
            showToast("Harus dari 'Sedang Dikerjakan' dulu 🔄")
            return
        }

        if (
            finishColumn === "complete" &&
            startColumn !== "in_review"
        ) {
            showToast("Harus lewat tahap review dulu ✅")
            return
        }

        // =========================
        // UPDATE UI
        // =========================
        if (startColumn === finishColumn) {
            startTasks.splice(source.index, 1)
            startTasks.splice(destination.index, 0, task)
            setBoard({ ...board, [startColumn]: startTasks })
        } else {
            startTasks.splice(source.index, 1)
            finishTasks.splice(destination.index, 0, task)
            task.status = finishColumn

            setBoard({
                ...board,
                [startColumn]: startTasks,
                [finishColumn]: finishTasks,
            })
        }

        // =========================
        // API CALL
        // =========================
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
                    showToast("Gagal update 🚨")
                },
            }
        )
    }

    /* =========================
       TASK CARD
    ========================= */
    const canManageTask = (task: Task) => {
        return (
            role === "admin" ||
            (role === "user" &&
                Number(task.created_by) === Number(user_id))
        )
    }
    const renderTaskCard = (task: Task, col: keyof Board) => {
        const overdue = isOverdue(task)
        const config = COLUMN_CONFIG[col]
        const [open, setOpen] = useState(false)

        return (
            <ContextMenu key={task.id}>
                <ContextMenuTrigger asChild>
                    <div
                        onClick={(e) => {
                            e.stopPropagation()
                            openTask(task)
                        }}
                        className={`
                        relative bg-white rounded-xl p-3 mb-2 cursor-pointer 
                        shadow-sm hover:shadow-md transition-all duration-200 break-words
                        border
                        ${overdue
                                ? "border-red-400 bg-red-50 shadow-red-100"
                                : "border-transparent hover:border-gray-200"
                            }
                    `}
                    >
                        {/* Overdue badge */}
                        {overdue && (
                            <span className="absolute top-2 right-2 text-red-500 text-xs font-bold">!</span>
                        )}

                        {/* Title */}
                        <p className={`font-semibold text-sm mb-2 pr-4 leading-snug ${overdue ? "text-red-700" : "text-gray-800"}`}>
                            {task.title}
                        </p>

                        {/* Platform name */}
                        <p className={`text-xs mb-3 truncate ${overdue ? "text-red-400" : "text-gray-400"}`}>
                            {task.created_by_name || "-"}
                        </p>



                        {/* Footer row */}
                        <div className="flex items-center gap-2 flex-wrap">

                            {/* Avatar */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${getAvatarColor(task.created_by_name)}`}>
                                {getInitials(task.created_by_name)}
                            </div>

                            {/* Deadline */}
                            {task.deadline && (
                                <div className={`flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${overdue ? "bg-red-500 text-white font-semibold" : "bg-gray-100 text-gray-500"}`}>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatDate(task.deadline)}
                                </div>
                            )}

                            {/* Assignee name badge */}
                            {task.assigned_to_name && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${overdue ? "bg-red-500 text-white" : `${config.dotColor} bg-opacity-20 text-gray-600`}`}
                                    style={overdue ? {} : { background: undefined }}
                                >
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${overdue
                                        ? "bg-red-500 text-white"
                                        : col === "todo" ? "bg-purple-100 text-purple-700"
                                            : col === "in_progress" ? "bg-blue-100 text-blue-700"
                                                : col === "in_review" ? "bg-orange-100 text-orange-700"
                                                    : col === "complete" ? "bg-teal-100 text-teal-700"
                                                        : "bg-gray-100 text-gray-600"
                                        }`}>
                                        {task.assigned_to_name}
                                    </span>
                                </span>
                            )}

                        </div>
                    </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-40">
                    {canManageTask(task) && (
                        <ContextMenuItem
                            onClick={() => {
                                router.get(route('requests.edit', task.id))
                            }}
                        >
                            Edit
                        </ContextMenuItem>
                    )}

                    {canManageTask(task) && (
                        <ContextMenuItem
                            className="text-red-500 focus:text-red-500"
                            onSelect={(e) => {
                                e.preventDefault() // penting biar context menu gak nutup duluan glitchy
                                setOpen(true)
                            }}
                        >
                            Delete
                        </ContextMenuItem>
                    )}

                    <AlertDialog open={open} onOpenChange={setOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus task ini?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Data yang dihapus tidak bisa dikembalikan.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>

                                <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => {
                                        router.delete(route("requests.destroy", task.id), {
                                            preserveScroll: true,
                                            onSuccess: () => showToast("Task berhasil dihapus", "success"),
                                            onError: () => showToast("Gagal hapus task", "error"),
                                        })
                                    }}
                                >
                                    Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
              
                
            </ContextMenuContent>
            </ContextMenu >
        )
}

/* =========================
   RENDER
========================= */

return (
    <>
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-5 gap-3">

                {columns.map((col) => {
                    const config = COLUMN_CONFIG[col]
                    const count = board[col]?.length ?? 0

                    return (
                        <div key={col} className="flex flex-col">

                            {/* Column Header */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-full mb-3 ${config.headerBg} ${config.headerBorder}`}>
                                <span className={`text-sm ${config.iconColor}`}>
                                    {config.icon}
                                </span>
                                <span className={`text-xs font-semibold flex-1 ${config.headerText}`}>
                                    {config.label}
                                </span>
                                {count > 0 && (
                                    <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${col === "request" ? "bg-gray-200 text-gray-600" : "bg-white/30 text-white"
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </div>

                            {/* Column Body */}
                            <Droppable droppableId={col}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`
                                                flex-1 rounded-2xl p-2 min-h-[400px] transition-colors duration-200
                                                ${config.columnBg}
                                                ${snapshot.isDraggingOver ? "ring-2 ring-inset ring-gray-300" : ""}
                                            `}
                                    >
                                        {board[col]?.map((task, index) =>
                                            canDrag ? (
                                                <Draggable
                                                    key={task.id}
                                                    draggableId={task.id.toString()}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={snapshot.isDragging ? "opacity-80 rotate-1 scale-105" : ""}
                                                        >
                                                            {renderTaskCard(task, col)}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ) : (
                                                <div key={task.id}>
                                                    {renderTaskCard(task, col)}
                                                </div>
                                            )
                                        )}

                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    )
                })}

            </div>
        </DragDropContext>

        {/* MODAL */}
        <TaskModal
            task={selectedTask}
            users={users}
            onClose={closeTask}
        />

        {/* ANIMATION */}
        <style>{`
                @keyframes slideIn {
                    0% { transform: translateY(-20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease forwards;
                }
                @keyframes dangerGlow {
                    0% { box-shadow: 0 0 5px rgba(239,68,68,0.5); }
                    50% { box-shadow: 0 0 20px rgba(239,68,68,1); }
                    100% { box-shadow: 0 0 5px rgba(239,68,68,0.5); }
                }
                .animate-danger {
                    animation: dangerGlow 1s infinite;
                }
            `}</style>
    </>
)
}