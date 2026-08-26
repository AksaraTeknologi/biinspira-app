'use client';

import DeleteButton from '@/components/delete-button';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
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
import { format } from 'date-fns';
import { CalendarIcon, Eye, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';

interface Event {
    id: number;
    name: string;
    batch: string;
}

interface User {
    id: number;
    name: string;
}

interface Goal {
    id: number;
    name: string;
}

interface Platform {
    id: number;
    name: string;
}

interface PlanPlatform {
    id: number;
    start_date: string;
    end_date: string;
    audience_type: string;
    goal: Goal;
    platform: Platform;
}

interface AdPlan {
    id: number;
    ad_schedule_time: string;
    user: User;
    event: Event;
    status: string;
    duration_days: number;
    total_cost: number;
    checkout_count: number;
    image_flayer: string;
    title_flayer: string;
    plan_platforms: PlanPlatform[];
}

const breadcrumbs = [{ title: 'Marketing', href: route('admin.marketing.index') }];

function MarketingTable({ adPlans, isAdmin }: { adPlans: AdPlan[]; isAdmin: boolean }) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const columns = useMemo<ColumnDef<AdPlan>[]>(
        () => [
            {
                id: 'aksi',
                header: 'Aksi',
                cell: ({ row }) => {
                    const plan = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={route('admin.marketing.show', plan.id)}>
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href={route('admin.marketing.edit', plan.id)}>
                                    <Pencil className="h-4 w-4" />
                                </Link>
                            </Button>
                            {isAdmin && <DeleteButton id={plan.id} routeTable="marketing" name={plan.event?.name} role="admin" />}
                        </div>
                    );
                },
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'user.name',
                header: 'User',
                cell: ({ row }) => row.original.user?.name || '-',
            },
            {
                accessorKey: 'event.name',
                header: 'Event',
                cell: ({ row }) => row.original.event?.name || '-',
            },
            {
                id: 'flayer',
                header: 'Flayer Iklan',
                cell: ({ row }) => {
                    const plan = row.original;
                    return plan.image_flayer ? (
                        <a
                            href={plan.image_flayer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary hover:underline"
                        >
                            <Eye className="h-4 w-4" />
                            <span>{plan.title_flayer || 'Flayer'}</span>
                        </a>
                    ) : (
                        '-'
                    );
                },
                enableSorting: false,
            },
            {
                accessorKey: 'ad_schedule_time',
                header: 'Jam Tayang Iklan',
                cell: ({ row }) => {
                    const t = row.original.ad_schedule_time;
                    return t ? t.slice(0, 5) + ' WIB' : '-';
                },
            },
            {
                accessorKey: 'duration_days',
                header: 'Durasi (Hari)',
                cell: ({ row }) => row.original.duration_days || '-',
            },
            {
                accessorKey: 'total_cost',
                header: 'Total Biaya',
                cell: ({ row }) => {
                    const v = row.original.total_cost;
                    return v ? `Rp ${Number(v).toLocaleString('id-ID')}` : '-';
                },
            },
            {
                accessorKey: 'checkout_count',
                header: 'Jumlah Peserta',
                cell: ({ row }) => {
                    const v = row.original.checkout_count;
                    return v ? Number(v).toLocaleString('id-ID') : '-';
                },
            },
            {
                id: 'platform',
                header: 'Platform',
                cell: ({ row }) => row.original.plan_platforms?.map((p) => p.platform?.name).join(', ') || '-',
                enableSorting: false,
            },
            {
                id: 'goal',
                header: 'Goal',
                cell: ({ row }) => row.original.plan_platforms?.map((p) => p.goal?.name).join(', ') || '-',
                enableSorting: false,
            },
            {
                id: 'audience_type',
                header: 'Tipe Target Peserta',
                cell: ({ row }) => {
                    const types = [
                        ...new Set(
                            row.original.plan_platforms?.map((p) =>
                                p.audience_type === 'targeted'
                                    ? 'Targetting Audiens'
                                    : p.audience_type === 'broad'
                                      ? 'Broad'
                                      : p.audience_type === 'combined'
                                        ? 'Combined'
                                        : '-',
                            ),
                        ),
                    ].join(', ');
                    return types || '-';
                },
                enableSorting: false,
            },
            {
                id: 'end_date',
                header: 'Tanggal Berakhir',
                cell: ({ row }) => row.original.plan_platforms?.map((p) => formatDate(p.end_date)).join(', ') || '-',
                enableSorting: false,
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ row }) => {
                    const s = row.original.status;
                    return (
                        <span
                            className={`rounded px-2 py-1 text-xs font-medium ${
                                s === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : s === 'draft'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {s || '-'}
                        </span>
                    );
                },
            },
        ],
        [isAdmin],
    );

    const table = useReactTable({
        data: adPlans,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize } },
    });

    return (
        <>
            {/* Search & page size */}
            <div className="flex items-center gap-2 py-4">
                <Input
                    placeholder="Cari iklan..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm bg-input"
                />
                <div className="ml-auto flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Per halaman</Label>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(val) => {
                            setPageSize(Number(val));
                            table.setPageSize(Number(val));
                        }}
                    >
                        <SelectTrigger className="w-20 bg-input">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 25, 50, 100].map((n) => (
                                <SelectItem key={n} value={String(n)}>
                                    {n}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border shadow-sm">
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
                                <TableCell colSpan={columns.length} className="py-6 text-center text-gray-500">
                                    Tidak ada data iklan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length} iklan ditemukan.</div>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                        Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                        Next
                    </Button>
                </div>
            </div>
        </>
    );
}

export default function Marketing() {
    const { adPlans = [], isAdmin } = usePage<{ adPlans?: AdPlan[]; isAdmin?: boolean }>().props;
    const { filters } = usePage().props as any;

    const [date, setDate] = useState<DateRange | undefined>(() => {
        if (filters?.start_date && filters?.end_date) {
            return {
                from: new Date(filters.start_date),
                to: new Date(filters.end_date),
            };
        }
        return undefined;
    });

    const handleAddAd = () => {
        router.visit(route(isAdmin ? 'admin.marketing.create' : 'user.marketing.create'));
    };

    const applyFilter = () => {
        router.get(
            route('admin.marketing.index'),
            {
                start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
                end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const resetFilter = () => {
        setDate(undefined);
        router.get(
            route('admin.marketing.index'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Daftar Iklan</h1>
                    {isAdmin && (
                        <Button
                            onClick={handleAddAd}
                            className="gap-2 bg-primary hover:bg-blue-700 dark:border dark:border-primary dark:bg-background dark:hover:bg-blue-900"
                        >
                            + Tambah Iklan
                        </Button>
                    )}
                </div>

                {/* Filter Section */}
                <div className="rounded-lg border bg-input p-4 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="date-range" className="text-sm font-medium">
                                Rentang Tanggal
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date-range"
                                        variant={'outline'}
                                        className={cn(
                                            'w-full justify-start text-left font-normal sm:w-75',
                                            'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700',
                                            !date && 'text-muted-foreground',
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, 'dd MMM yyyy')} - {format(date.to, 'dd MMM yyyy')}
                                                </>
                                            ) : (
                                                format(date.from, 'dd MMM yyyy')
                                            )
                                        ) : (
                                            <span>Pilih rentang tanggal</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg" align="start">
                                    <div className="bg-white dark:bg-gray-900">
                                        <Calendar
                                            mode="range"
                                            selected={date}
                                            onSelect={setDate}
                                            numberOfMonths={2}
                                            className={cn(
                                                'rounded-xl p-2 text-sm',
                                                '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
                                                '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
                                                '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
                                                '[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-white',
                                                '[&_.rdp-day_range_middle]:bg-blue-100 [&_.rdp-day_range_middle]:text-zinc-800',
                                                '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
                                            )}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={applyFilter} disabled={!date?.from || !date?.to} className="bg-primary hover:bg-primary/90">
                                Terapkan Filter
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetFilter}
                                className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    {/* Selected Date Info */}
                    {date?.from && date?.to && (
                        <div className="mt-3 text-sm text-muted-foreground">
                            Menampilkan iklan dengan periode:{' '}
                            <strong>
                                {format(date.from, 'dd MMM yyyy')} - {format(date.to, 'dd MMM yyyy')}
                            </strong>
                        </div>
                    )}
                </div>

                <MarketingTable adPlans={adPlans} isAdmin={isAdmin ?? false} />
            </div>
        </AppLayout>
    );
}
