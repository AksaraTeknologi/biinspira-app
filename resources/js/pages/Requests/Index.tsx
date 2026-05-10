'use client';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import KanbanBoard from '../../components/KanbanBoard';

type User = {
    id: number;
    name: string;
    role: string;
};

type Task = {
    id: number;
    title: string;
    description: string;
    status: string;
};

type Props = {
    tasks: Record<string, Task[]>;
    users: User[];
};

type RoleItem = {
    name: string;
};

type PageProps = {
    auth?: {
        user?: {
            id?: number;
            roles?: Array<RoleItem | string>;
        };
    };
    user_role?: string;
    user_id?: number;
    user_name?: string;
    errors?: Record<string, string | string[]>;
    flash?: {
        success?: string | { message?: string };
        error?: string | { message?: string };
    };
};

export default function Index({ tasks, users }: Props) {
    const { auth, errors = {}, flash, user_role, user_id, user_name } = usePage<PageProps>().props;
    const userRoles = auth?.user?.roles || [];

    const resolvedRole = () => {
        if (typeof user_role === 'string' && user_role.length > 0) {
            return user_role;
        }

        const firstRole = userRoles[0];
        if (!firstRole) return null;

        if (typeof firstRole === 'string') {
            return firstRole;
        }

        return firstRole.name ?? null;
    };

    const userRole = resolvedRole();
    const currentUserId = user_id ?? auth?.user?.id;

    const [search, setSearch] = useState('');

    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach((err) => {
                const message = Array.isArray(err) ? err[0] : err;
                if (message) toast.error(String(message));
            });
        }
    }, [errors]);

    useEffect(() => {
        if (flash?.success) {
            const msg = typeof flash.success === 'string' ? flash.success : flash.success.message;

            if (msg) toast.success(String(msg));
        }

        if (flash?.error) {
            const msg = typeof flash.error === 'string' ? flash.error : flash.error.message;

            if (msg) toast.error(String(msg));
        }
    }, [flash]);

    const filteredTasks = Object.fromEntries(
        Object.entries(tasks).map(([status, taskList]) => [
            status,
            taskList.filter((task) => task.title.toLowerCase().includes(search.toLowerCase())),
        ]),
    );

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Ticketing Website',
            href: '/requests',
        },
    ];

    const isUserOrAdmin = ['user', 'admin'].includes(String(userRole ?? '').toLowerCase());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ticket Board" />

            <div className="space-y-6 p-6">
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold text-gray-800 dark:text-zinc-100">Ticket Board</h2>
                                    <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-400">Tarik dan lepas kartu untuk memperbarui status</p>
                                </div>

                                {isUserOrAdmin && (
                                    <Link
                                        href="/requests/create"
                                        className="flex items-center gap-1.5 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-900"
                                    >
                                        <Plus size={16} />
                                        Buat Tiket Baru
                                    </Link>
                                )}
                            </div>

                            <div className="w-full">
                                <input
                                    type="text"
                                    placeholder="Cari tiket..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:max-w-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="w-full overflow-x-auto pb-1">
                            <KanbanBoard key={search} tasks={filteredTasks} users={users} user_role={userRole} user_id={currentUserId} user_name={user_name} />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
