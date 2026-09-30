import { DataTableServerPagination } from '@/components/data-table-server-pagination';
import DeleteButton from '@/components/delete-button';
import AppLayout from '@/layouts/app-layout';
import { AddApplicationModal } from '@/pages/applications/modal/application-modal-add';
import { EditApplicationModal } from '@/pages/applications/modal/application-modal-edit';
import type { Application } from '@/types/application';
import type { PaginatedData } from '@/types/pagination';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AppWindow, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type Filters = {
    search?: string | null;
    per_page?: number;
};

type Props = {
    applications: PaginatedData<Application>;
    filters: Filters;
};

export default function ApplicationsIndex({ applications, filters }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Ticketing Website', href: route('requests.index') },
        { title: 'Kelola Aplikasi', href: route('applications.index') },
    ];

    const [searchValue, setSearchValue] = useState(filters.search ?? '');
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((value: string) => {
        setSearchValue(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            if (value) {
                params.set('search', value);
            } else {
                params.delete('search');
            }
            params.set('page', '1');
            router.get(
                `${window.location.pathname}?${params.toString()}`,
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 400);
    }, []);

    useEffect(() => {
        setSearchValue(filters.search ?? '');
    }, [filters.search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Aplikasi" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-zinc-100">
                            <AppWindow className="h-6 w-6" />
                            Kelola Aplikasi
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                            Kelola daftar aplikasi yang bisa dipilih saat membuat tiket
                        </p>
                    </div>
                    <div>
                        <AddApplicationModal onSuccess={() => router.reload()} />
                    </div>
                </div>

                {/* Tabel */}
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
                        <div className="relative w-full max-w-sm">
                            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Cari aplikasi..."
                                value={searchValue}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-8 pl-9 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                            />
                            {searchValue && (
                                <button
                                    type="button"
                                    onClick={() => handleSearch('')}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-zinc-800">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400">Deskripsi</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400">Tiket</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-zinc-400">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm text-gray-400 dark:text-zinc-500">
                                            Belum ada aplikasi. Tambahkan aplikasi pertama!
                                        </td>
                                    </tr>
                                ) : (
                                    applications.data.map((app, idx) => (
                                        <tr
                                            key={app.id}
                                            className="border-b border-gray-50 transition-colors hover:bg-gray-50/80 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                                        >
                                            <td className="px-4 py-3 text-xs text-gray-400">
                                                {(applications.current_page - 1) * applications.per_page + idx + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-xs"
                                                    style={{ backgroundColor: app.color ?? '#6B7280' }}
                                                >
                                                    {app.name}
                                                </span>
                                            </td>
                                            <td className="max-w-xs px-4 py-3 text-xs text-gray-500 dark:text-zinc-400">
                                                <p className="truncate" title={app.description ?? '-'}>
                                                    {app.description || '-'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 dark:bg-zinc-700 dark:text-zinc-300">
                                                    {app.revision_requests_count ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                        app.is_active
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                            : 'bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-zinc-400'
                                                    }`}
                                                >
                                                    {app.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <EditApplicationModal application={app} onSuccess={() => router.reload()} />
                                                    <DeleteButton id={app.id} name={app.name} routeName="applications.destroy" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-gray-100 px-5 dark:border-zinc-800">
                        <DataTableServerPagination pagination={applications} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
