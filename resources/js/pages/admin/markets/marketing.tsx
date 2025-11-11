'use client';

import DeleteButton from '@/components/delete-button';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    RowSelectionState,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import { Pencil } from 'lucide-react';
import React from 'react';

interface Event {
    id: number;
    name: string;
    batch: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface Plan {
    id: string;
    event: Event;
    status: string;
    user: User;
}

interface Goal {
    id: number;
    name: string;
}

interface AdPlanPlatforms {
    id: number;
    start_date: string;
    end_date: string;
    audience_target: string;
    daily_budget: number;
    audience_type: string;
    age_targeted: string;
    age_broad: string;
    location_targeted: string;
    location_broad: string;
    type_audience_targeted: string;
    name_audience_targeted: string;
    event: Event;
    plan: Plan;
    user: User;
    goal: Goal;
    status: string;
}

const breadcrumbs = [{ title: 'Marketing', href: route('admin.marketing.index') }];

export default function Marketing() {
    const { adPlanPlatforms } = usePage<{ adPlanPlatforms: AdPlanPlatforms[] }>().props;

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

    const columns: ColumnDef<AdPlanPlatforms>[] = [
        {
            header: 'Event',
            accessorKey: 'plan.event.name',
            cell: ({ row }) => row.original.plan?.event?.name || '-',
        },
        {
            header: 'Tanggal Berakhir',
            accessorKey: 'end_date',
            cell: ({ row }) => {
                const date = new Date(row.original.end_date);
                const formatted = date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });
                return <div className="font-medium">{formatted}</div>;
            },
        },
        {
            header: 'Batch',
            accessorKey: 'plan.event.batch',
            cell: ({ row }) => row.original.plan?.event?.batch || '-',
        },
        {
            header: 'User',
            accessorKey: 'plan.user.name',
            cell: ({ row }) => row.original.plan?.user?.name || '-',
        },
        {
            header: 'Goal',
            accessorKey: 'goal.name',
            cell: ({ row }) => row.original.goal?.name || '-',
        },
        {
            header: 'Tipe Audiens',
            accessorKey: 'audience_type',
            cell: ({ row }) => {
                const type_audiens = row.original.audience_type || '-';
                if (type_audiens == 'targeted') {
                    return 'Targetting Audiens';
                } else if (type_audiens == 'broad') {
                    return 'Broad';
                } else if (type_audiens == 'combined') {
                    return 'Combined';
                } else {
                    return '-';
                }
            },
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ row }) => (
                <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                        row.original.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                >
                    {row.original.plan?.status || '-'}
                </span>
            ),
        },
        {
            id: 'Aksi',
            header: 'Aksi',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href={route('admin.marketing.edit', row.original.id)}>
                            <Pencil />
                        </Link>
                    </Button>
                    <DeleteButton id={row.original.plan.id} routeTable="marketing" name={row.original.plan?.event?.name}/>
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
    ];

    const table = useReactTable({
        data: adPlanPlatforms,
        columns,
        state: { sorting, globalFilter, columnVisibility, rowSelection },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    const handleAddAd = () => {
        router.visit(route('admin.marketing.create'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Daftar Iklan</h1>
                    <Button onClick={handleAddAd} className="bg-blue-600 hover:bg-blue-700">
                        + Tambah Iklan
                    </Button>
                </div>

                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
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
                                    <TableCell colSpan={columns.length} className="py-6 text-center">
                                        Tidak ada data iklan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
