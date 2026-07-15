'use client';

import DeleteButton from '@/components/delete-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { BookOpen, CalendarDays, GraduationCap, Pencil, Plus, Video } from 'lucide-react';
import * as React from 'react';

interface ProgramEvent {
    id: string;
    type: 'webinar' | 'bootcamp' | 'certification_program';
    title: string;
    batch: string | null;
    start_time: string | null;
    end_time: string | null;
    start_date: string | null;
    end_date: string | null;
    registration_deadline: string | null;
    price: number;
    quota: number;
    user: { id: string; name: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
    webinar: 'Webinar',
    bootcamp: 'Bootcamp',
    certification_program: 'Sertifikasi',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
    webinar: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    bootcamp: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    certification_program: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
};

const TYPE_ICONS = {
    webinar: <Video className="size-4 text-blue-500" />,
    bootcamp: <BookOpen className="size-4 text-purple-500" />,
    certification_program: <GraduationCap className="size-4 text-emerald-500" />,
};

function formatDate(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProgramEventIndex() {
    const { programEvents } = usePage<{ programEvents: ProgramEvent[] }>().props;
    const { auth } = usePage<any>().props;
    const role = auth.role[0] || 'user';
    const isAdmin = role === 'admin';
    const prefix = isAdmin ? 'admin' : 'user';

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState('all');

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Program Event', href: '' }];

    const filteredData = React.useMemo(() => {
        if (typeFilter === 'all') return programEvents;
        return programEvents.filter((p) => p.type === typeFilter);
    }, [programEvents, typeFilter]);

    const columns: ColumnDef<ProgramEvent>[] = [
        {
            id: 'aksi',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button asChild variant="link" size="sm" className="h-8 w-8 p-0">
                        <Link href={route(`${prefix}.program-events.edit`, row.original.id)}>
                            <Pencil className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        </Link>
                    </Button>
                    <DeleteButton id={row.original.id} name={row.original.title} routeName={`${prefix}.program-events.destroy`} />
                </div>
            ),
            enableSorting: false,
        },
        {
            accessorKey: 'title',
            header: 'Judul',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 font-medium">
                    {TYPE_ICONS[row.original.type]}
                    {row.original.title}
                </div>
            ),
        },
        {
            accessorKey: 'batch',
            header: 'Batch',
            cell: ({ row }) => (
                row.original.batch ? (
                    <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700">
                        {row.original.batch}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                )
            ),
        },
        {
            accessorKey: 'type',
            header: 'Tipe',
            cell: ({ row }) => (
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TYPE_BADGE_COLORS[row.original.type] || 'bg-muted')}>
                    {TYPE_LABELS[row.original.type]}
                </span>
            ),
        },
        {
            accessorKey: 'registration_deadline',
            header: 'Deadline Pendaftaran',
            cell: ({ row }) => {
                const deadline = row.original.registration_deadline;
                if (!deadline) return <span className="text-sm text-muted-foreground">-</span>;
                return (
                    <div className="flex flex-col gap-0.5 whitespace-nowrap">
                        <span className="text-sm font-medium">
                            {new Date(deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                            {new Date(deadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'tanggal',
            header: 'Tanggal Mulai',
            cell: ({ row }) => {
                const date = row.original.start_time ?? row.original.start_date;
                if (!date) return <span className="text-sm text-muted-foreground">-</span>;
                const hasTime = !!row.original.start_time;
                return (
                    <div className="flex flex-col gap-0.5 whitespace-nowrap">
                        <span className="text-sm font-medium">
                            {new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {hasTime && (
                            <span className="text-[11px] text-muted-foreground">
                                {new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'price',
            header: 'Harga',
            cell: ({ row }) => (
                <span className="text-sm whitespace-nowrap">
                    {row.original.price === 0
                        ? 'Gratis'
                        : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.original.price)}
                </span>
            ),
        },
    ];

    const table = useReactTable({
        data: filteredData,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Program Event" />
            <div className="p-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">Program Event</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Kelola program event — Webinar, Bootcamp, dan Certification Program
                        </p>
                    </div>
                    <Link href={route(`${prefix}.program-events.create`)}>
                        <Button className="gap-2 text-white">
                            <Plus className="size-4" />
                            Buat Program Baru
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-4 flex items-center gap-3">
                    <Input
                        placeholder="Cari program..."
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="max-w-xs bg-input"
                    />
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[200px] bg-input">
                            <SelectValue placeholder="Semua Tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="webinar">Webinar</SelectItem>
                            <SelectItem value="bootcamp">Bootcamp</SelectItem>
                            <SelectItem value="certification_program">Certification Program</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-md border shadow-sm">
                    <Table>
                        <TableHeader className="bg-border">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody className="bg-input">
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                        Belum ada Program Event. Klik "Buat Program Baru" untuk memulai.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-end space-x-2 py-4">
                    <span className="flex-1 text-sm text-muted-foreground">
                        {table.getFilteredRowModel().rows.length} program ditemukan
                    </span>
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Next
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
