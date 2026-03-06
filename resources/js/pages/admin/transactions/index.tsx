import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Deferred, Head } from '@inertiajs/react';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';
import { format, subMonths } from 'date-fns';
import { CalendarIcon, ListFilter } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { columns, Invoice } from './columns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '/admin/transactions',
    },
];

interface PlatformOption {
    key: string;
    label: string;
}

interface PlatformStats {
    paid_transactions: number;
    total_revenue: number;
    this_month_revenue: number;
}

interface TransactionsProps {
    invoices?: Invoice[];
    perPlatformStats?: Record<string, PlatformStats>;
    availablePlatforms: PlatformOption[];
    flash?: {
        success?: string;
        error?: string;
    };
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function StatsLoading() {
    return (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-md border bg-input p-4">
                    <Skeleton className="mb-2 h-4 w-32" />
                    <Skeleton className="h-8 w-24" />
                </div>
            ))}
        </div>
    );
}

function TableLoading() {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 py-4">
                <Skeleton className="h-10 w-full max-w-sm" />
                <Skeleton className="ml-auto h-10 w-24" />
            </div>
            <div className="overflow-hidden rounded-md border">
                <div className="bg-border p-3">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <Skeleton key={i} className="h-4 w-24" />
                        ))}
                    </div>
                </div>
                <div className="space-y-4 bg-input p-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4">
                            {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                <Skeleton key={j} className="h-4 w-24" />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatsCards({ perPlatformStats, selectedPlatform }: { perPlatformStats: Record<string, PlatformStats>; selectedPlatform: string }) {
    const statistics = useMemo(() => {
        if (selectedPlatform === 'all') {
            const totals = { paid_transactions: 0, total_revenue: 0, this_month_revenue: 0 };
            Object.values(perPlatformStats).forEach((s) => {
                totals.paid_transactions += s.paid_transactions;
                totals.total_revenue += s.total_revenue;
                totals.this_month_revenue += s.this_month_revenue;
            });
            return totals;
        }
        return perPlatformStats[selectedPlatform] ?? { paid_transactions: 0, total_revenue: 0, this_month_revenue: 0 };
    }, [perPlatformStats, selectedPlatform]);

    return (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-md border bg-input p-4">
                <p className="text-sm text-muted-foreground">Transaksi Berhasil</p>
                <p className="text-2xl font-bold text-green-600">{statistics.paid_transactions}</p>
            </div>
            <div className="rounded-md border bg-input p-4">
                <p className="text-sm text-muted-foreground">Total Pendapatan</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.total_revenue)}</p>
            </div>
            <div className="rounded-md border bg-input p-4">
                <p className="text-sm text-muted-foreground">Pendapatan Bulan Ini</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.this_month_revenue)}</p>
            </div>
        </div>
    );
}

function InvoiceTable({ invoices, selectedPlatform, date }: { invoices: Invoice[]; selectedPlatform: string; date: DateRange | undefined }) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

    const filteredInvoices = useMemo(() => {
        let data = invoices;
        if (selectedPlatform !== 'all') {
            data = data.filter((inv) => inv.source_platform === selectedPlatform);
        }
        if (date?.from) {
            const from = new Date(date.from);
            from.setHours(0, 0, 0, 0);
            data = data.filter((inv) => inv.paid_at && new Date(inv.paid_at) >= from);
        }
        if (date?.to) {
            const to = new Date(date.to);
            to.setHours(23, 59, 59, 999);
            data = data.filter((inv) => inv.paid_at && new Date(inv.paid_at) <= to);
        }
        return data;
    }, [invoices, selectedPlatform, date]);

    const table = useReactTable({
        data: filteredInvoices,
        columns: columns as ColumnDef<Invoice, unknown>[],
        state: { sorting, globalFilter, columnVisibility },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <>
            {/* Search & Columns Filter */}
            <div className="flex items-center gap-2 py-4">
                <Input
                    placeholder="Cari transaksi..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="max-w-sm bg-input"
                />
                <div className="ml-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <ListFilter /> Filter
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-md border">
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
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Tidak ada data transaksi.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">{table.getFilteredRowModel().rows.length} transaksi ditemukan.</div>
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

export default function Transactions({ invoices, perPlatformStats, availablePlatforms, flash }: TransactionsProps) {
    const [selectedPlatform, setSelectedPlatform] = React.useState('all');
    const [date, setDate] = React.useState<DateRange | undefined>(() => ({
        from: subMonths(new Date(), 1),
        to: new Date(),
    }));

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi" />
            <div className="p-4">
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-2xl font-semibold">Daftar Transaksi</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <Label htmlFor="date-range" className="text-sm font-medium">
                                Rentang Tanggal
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date-range"
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-start text-left font-normal sm:w-[300px]',
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
                                <PopoverContent className="w-auto p-0" align="start">
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
                                                '[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white',
                                                '[&_.rdp-day_range_middle]:bg-blue-100 [&_.rdp-day_range_middle]:text-zinc-800',
                                                '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
                                            )}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                            <SelectTrigger className="w-[180px] bg-input">
                                <SelectValue placeholder="Pilih Platform" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Platform</SelectItem>
                                {availablePlatforms.map((p) => (
                                    <SelectItem key={p.key} value={p.key}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Statistics Cards */}
                <Deferred data="perPlatformStats" fallback={<StatsLoading />}>
                    <StatsCards perPlatformStats={perPlatformStats ?? {}} selectedPlatform={selectedPlatform} />
                </Deferred>

                {/* Invoice Table */}
                <Deferred data="invoices" fallback={<TableLoading />}>
                    <InvoiceTable invoices={invoices ?? []} selectedPlatform={selectedPlatform} date={date} />
                </Deferred>
            </div>
        </AppLayout>
    );
}
