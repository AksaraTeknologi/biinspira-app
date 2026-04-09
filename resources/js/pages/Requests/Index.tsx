"use client"

import KanbanBoard from "../../components/KanbanBoard"
import { Head, Link, usePage } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { ClipboardList, Plus } from "lucide-react"
import { useEffect, useState } from "react"

type User = {
    id: number
    name: string
    role: string
}

type Task = {
    id: number
    title: string
    description: string
    status: string
}

type Props = {
    tasks: Record<string, Task[]>
    users: User[]
}

type Toast = {
    id: number
    text: string
    type: "success" | "error"
}

export default function Index({ tasks, users }: Props) {

    const { auth, errors, flash } = usePage().props as any
    const userRoles = auth?.user?.roles || []
    const userRole = userRoles[0] ?? null

    console.log(auth.user)

    const [toasts, setToasts] = useState<Toast[]>([])
    const [search, setSearch] = useState("") // ✅ NEW

    // 🔥 helper add toast
    const addToast = (text: string, type: "success" | "error" = "success") => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, text, type }])

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3000)
    }

    // =========================
    // ERROR HANDLER
    // =========================
    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach((err: any) => {
                addToast(err, "error")
            })
        }
    }, [errors])

    // =========================
    // SUCCESS HANDLER
    // =========================
    useEffect(() => {
        if (flash?.success) {
            const msg = typeof flash.success === "string"
                ? flash.success
                : flash.success.message

            addToast(msg, "success")
        }
    }, [flash])

    // ✅ FILTER TASKS (BY TITLE)
    const filteredTasks = Object.fromEntries(
        Object.entries(tasks).map(([status, taskList]) => [
            status,
            taskList.filter((task) =>
                task.title.toLowerCase().includes(search.toLowerCase())
            ),
        ])
    )

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: "Ticketing Website",
            href: "/requests",
        },
    ]

    const isUser = auth?.user?.roles?.some((r: any) => r.name.toLowerCase() === "user")

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="QMS Requests" />

            {/* TOAST */}
            <div className="fixed top-5 right-5 z-50 space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="px-4 py-2 rounded-lg shadow-lg text-white bg-red-500
                                   transform transition-all duration-300
                                   translate-x-0 opacity-100
                                   animate-[slideIn_0.3s_ease]"
                    >
                        {toast.text}
                    </div>
                ))}
            </div>

            <style>
                {`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                `}
            </style>

            <div className="p-6 space-y-6">

                {/* BOARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

                    {/* BOARD HEADER */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">

                        <div>
                            <h2 className="font-semibold text-gray-800 text-sm">
                                Request Workflow
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Drag cards to update status
                            </p>
                        </div>

                        {/* 🔥 SEARCH (TAMBAHAN, TIDAK MERUSAK LAYOUT) */}
                        <div className="absolute left-1/2 transform -translate-x-1/2">
                            <input
                                type="text"
                                placeholder="Search request..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {isUser && (
                            <Link
                                href="/requests/create"
                                className="flex items-center gap-1.5 bg-blue-800 hover:bg-blue-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                            >
                                <Plus size={16} />
                                Create Request
                            </Link>
                        )}

                    </div>

                    {/* BOARD CONTENT */}
                    <div className="p-5">
                        <KanbanBoard
                            key={search} // 🔥 ini kuncinya
                            tasks={filteredTasks}
                            users={users}
                            user_role={userRole}
                        />
                    </div>

                </div>

            </div>
        </AppLayout>
    )
}