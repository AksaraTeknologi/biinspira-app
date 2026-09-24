'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Banknote,
    Calendar as CalendarIcon,
    ExternalLink,
    Filter,
    Layers,
    Pencil,
    Plus,
    Trash2,
    TrendingUp,
} from 'lucide-react';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import * as React from 'react';
import { toast } from 'sonner';

interface AdSpendRecord {
    id: number;
    platform: string;
    platform_label: string;
    date: string;
    amount: number;
    ad_channel: string;
    channel_label: string;
    notes: string | null;
    creator_name: string | null;
    created_at: string | null;
}

interface SummaryData {
    total_this_month: number;
    total_this_year: number;
    total_all: number;
    top_platform: { key: string; label: string; total: number } | null;
    top_channel: { key: string; label: string; total: number } | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

interface PageProps extends SharedData {
    records: PaginatedResponse<AdSpendRecord>;
    summary: SummaryData;
    platforms: Record<string, string>;
    channels: Record<string, string>;
    filters: {
        platform: string | null;
        channel: string | null;
        year: number;
        month: number | null;
    };
}

const formatRupiah = (value: string | number) => {
    const clean = String(value).replace(/\D/g, '');
    if (!clean) return '';
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
const toPlainNumber = (value: string | number) => String(value).replace(/\./g, '').replace(/\D/g, '');

export default function AdSpendStatsIndex() {
    const { records, summary, platforms, channels, filters } = usePage<PageProps>().props;

    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [editItem, setEditItem] = React.useState<AdSpendRecord | null>(null);
    const [deleteId, setDeleteId] = React.useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isAddDatePickerOpen, setIsAddDatePickerOpen] = React.useState(false);
    const [isEditDatePickerOpen, setIsEditDatePickerOpen] = React.useState(false);

    // Form state for Add/Edit
    const [formData, setFormData] = React.useState({
        platform: 'biinspira',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        ad_channel: 'boost_post',
        notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Data Statistic', href: '#' },
        { title: 'Statistik Biaya Iklan', href: route('admin.ad-spend-stats.index') },
    ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = {
            ...filters,
            [key]: value === 'all' ? '' : value,
        };
        router.get(route('admin.ad-spend-stats.index'), newFilters as any, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openAddModal = () => {
        setFormData({
            platform: 'biinspira',
            date: new Date().toISOString().split('T')[0],
            amount: '',
            ad_channel: 'boost_post',
            notes: '',
        });
        setIsAddOpen(true);
    };

    const openEditModal = (item: AdSpendRecord) => {
        setEditItem(item);
        setFormData({
            platform: item.platform,
            date: item.date,
            amount: String(Math.round(item.amount)),
            ad_channel: item.ad_channel,
            notes: item.notes || '',
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(
            route('admin.ad-spend-stats.store'),
            {
                ...formData,
                amount: parseFloat(toPlainNumber(formData.amount)) || 0,
            },
            {
                onSuccess: () => {
                    toast.success('Data biaya iklan berhasil disimpan');
                    setIsAddOpen(false);
                    setIsSubmitting(false);
                },
                onError: (errs) => {
                    toast.error(Object.values(errs)[0] || 'Gagal menyimpan data');
                    setIsSubmitting(false);
                },
            }
        );
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem) return;
        setIsSubmitting(true);
        router.put(
            route('admin.ad-spend-stats.update', { id: editItem.id }),
            {
                ...formData,
                amount: parseFloat(toPlainNumber(formData.amount)) || 0,
            },
            {
                onSuccess: () => {
                    toast.success('Data biaya iklan berhasil diperbarui');
                    setEditItem(null);
                    setIsSubmitting(false);
                },
                onError: (errs) => {
                    toast.error(Object.values(errs)[0] || 'Gagal memperbarui data');
                    setIsSubmitting(false);
                },
            }
        );
    };

    const handleDelete = () => {
        if (!deleteId) return;
        setIsSubmitting(true);
        router.delete(route('admin.ad-spend-stats.destroy', { id: deleteId }), {
            onSuccess: () => {
                toast.success('Data biaya iklan berhasil dihapus');
                setDeleteId(null);
                setIsSubmitting(false);
            },
            onError: () => {
                toast.error('Gagal menghapus data');
                setIsSubmitting(false);
            },
        });
    };

    const getChannelBadge = (channel: string) => {
        switch (channel) {
            case 'meta':
                return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300';
            case 'tiktok':
                return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300';
            case 'google':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300';
            case 'boost_post':
                return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Statistik Biaya Iklan" />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                {/* Header Action */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            Statistik Biaya Iklan
                        </h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            Kelola pengeluaran iklan per platform dan channel (Meta, TikTok, Google, Boost Post)
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href="/stats-iklan"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground shadow-2xs hover:bg-accent"
                        >
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                            <span>Buka TV Dashboard</span>
                        </a>

                        <Button onClick={openAddModal} className="h-9 gap-1.5 text-xs font-semibold shadow-xs">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Biaya Iklan</span>
                        </Button>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Bulan Ini</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Banknote className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-xl font-bold text-foreground">
                            {formatCurrency(summary.total_this_month)}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            Total pengeluaran group bulan berjalan
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Tahun Ini (YTD)</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-xl font-bold text-foreground">
                            {formatCurrency(summary.total_this_year)}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            Akumulasi pengeluaran iklan tahun {filters.year || new Date().getFullYear()}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Platform Tertinggi</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                                <Layers className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 truncate text-lg font-bold text-foreground">
                            {summary.top_platform?.label || '-'}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {summary.top_platform ? formatCurrency(summary.top_platform.total) : 'Belum ada data'}
                        </p>
                    </div>

                    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Channel Terbesar</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
                                <Filter className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 truncate text-lg font-bold text-foreground">
                            {summary.top_channel?.label || '-'}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {summary.top_channel ? formatCurrency(summary.top_channel.total) : 'Belum ada data'}
                        </p>
                    </div>
                </div>

                {/* Filter and Table Container */}
                <div className="rounded-2xl border border-border/80 bg-card shadow-2xs">
                    {/* Filters Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 p-3 sm:p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="w-40">
                                <Select
                                    value={filters.platform || 'all'}
                                    onValueChange={(val) => handleFilterChange('platform', val)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Semua Platform" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Platform</SelectItem>
                                        {Object.entries(platforms).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-36">
                                <Select
                                    value={filters.channel || 'all'}
                                    onValueChange={(val) => handleFilterChange('channel', val)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Semua Channel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Channel</SelectItem>
                                        {Object.entries(channels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Menampilkan <span className="font-semibold text-foreground">{records.data.length}</span> baris
                        </p>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-28 text-xs">Tanggal</TableHead>
                                    <TableHead className="text-xs">Platform</TableHead>
                                    <TableHead className="text-xs">Channel Iklan</TableHead>
                                    <TableHead className="text-right text-xs">Nominal</TableHead>
                                    <TableHead className="text-xs">Catatan</TableHead>
                                    <TableHead className="w-24 text-center text-xs">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                                            Tidak ada data pengeluaran iklan yang sesuai filter.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    records.data.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell className="text-xs font-medium whitespace-nowrap">
                                                {row.date}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold">
                                                {row.platform_label}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getChannelBadge(
                                                        row.ad_channel
                                                    )}`}
                                                >
                                                    {row.channel_label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold text-foreground">
                                                {formatCurrency(row.amount)}
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                                                {row.notes || '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => openEditModal(row)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                                                        onClick={() => setDeleteId(row.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80 px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Menampilkan <span className="font-semibold text-foreground">{records.from ?? 0}</span> -{' '}
                            <span className="font-semibold text-foreground">{records.to ?? 0}</span> dari{' '}
                            <span className="font-semibold text-foreground">{records.total}</span> data
                        </p>

                        {records.links && records.links.length > 3 && (
                            <div className="flex flex-wrap items-center gap-1">
                                {records.links.map((link, idx) => {
                                    const isPrev = link.label.toLowerCase().includes('prev') || link.label.includes('«') || link.label.includes('&laquo;');
                                    const isNext = link.label.toLowerCase().includes('next') || link.label.includes('»') || link.label.includes('&raquo;');

                                    return (
                                        <Button
                                            key={idx}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            className={`h-7 px-2.5 text-xs ${link.active ? 'pointer-events-none' : ''}`}
                                            onClick={() => {
                                                if (link.url) {
                                                    router.visit(link.url, { preserveScroll: true, preserveState: true });
                                                }
                                            }}
                                        >
                                            {isPrev ? 'Sebelumnya' : isNext ? 'Selanjutnya' : link.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Data Biaya Iklan</DialogTitle>
                        <DialogDescription>
                            Masukkan pengeluaran iklan per platform dan channel
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-3.5 py-1">
                        <div>
                            <Label htmlFor="platform" className="text-xs">
                                Platform
                            </Label>
                            <Select
                                value={formData.platform}
                                onValueChange={(val) => setFormData({ ...formData, platform: val })}
                            >
                                <SelectTrigger id="platform" className="mt-1 h-9 text-xs">
                                    <SelectValue placeholder="Pilih Platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(platforms).map(([k, label]) => (
                                        <SelectItem key={k} value={k}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="channel" className="text-xs">
                                Channel Iklan
                            </Label>
                            <Select
                                value={formData.ad_channel}
                                onValueChange={(val) => setFormData({ ...formData, ad_channel: val })}
                            >
                                <SelectTrigger id="channel" className="mt-1 h-9 text-xs">
                                    <SelectValue placeholder="Pilih Channel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(channels).map(([k, label]) => (
                                        <SelectItem key={k} value={k}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="date" className="text-xs">
                                Tanggal
                            </Label>
                            <Popover open={isAddDatePickerOpen} onOpenChange={setIsAddDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        type="button"
                                        variant="outline"
                                        className="mt-1 h-9 w-full justify-start text-left text-xs font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {formData.date ? (
                                            format(parseISO(formData.date), 'dd MMMM yyyy', { locale: idLocale })
                                        ) : (
                                            <span className="text-muted-foreground">Pilih tanggal</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto rounded-2xl border border-border bg-popover p-3 shadow-xl z-50" align="start">
                                    <CalendarPicker
                                        mode="single"
                                        selected={formData.date ? parseISO(formData.date) : undefined}
                                        onSelect={(selectedDate) => {
                                            if (selectedDate) {
                                                setFormData({
                                                    ...formData,
                                                    date: format(selectedDate, 'yyyy-MM-dd'),
                                                });
                                                setIsAddDatePickerOpen(false);
                                            }
                                        }}
                                        className={cn(
                                            'rounded-xl p-2 text-sm',
                                            '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
                                            '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
                                            '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
                                            '[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-white',
                                            '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700 dark:[&_.rdp-caption_label]:text-zinc-200',
                                        )}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <Label htmlFor="amount" className="text-xs">
                                Nominal (Rp)
                            </Label>
                            <div className="relative mt-1">
                                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                    Rp
                                </span>
                                <Input
                                    id="amount"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="h-9 pl-9 text-xs font-semibold"
                                    value={formatRupiah(formData.amount)}
                                    onChange={(e) => setFormData({ ...formData, amount: toPlainNumber(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="notes" className="text-xs">
                                Catatan (Opsional)
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Keterangan kampanye atau target iklan..."
                                className="mt-1 text-xs"
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <DialogFooter className="mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => setIsAddOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="h-8 text-xs">
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Data Biaya Iklan</DialogTitle>
                        <DialogDescription>
                            Perbarui detail pengeluaran iklan
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-3.5 py-1">
                        <div>
                            <Label htmlFor="edit-platform" className="text-xs">
                                Platform
                            </Label>
                            <Select
                                value={formData.platform}
                                onValueChange={(val) => setFormData({ ...formData, platform: val })}
                            >
                                <SelectTrigger id="edit-platform" className="mt-1 h-9 text-xs">
                                    <SelectValue placeholder="Pilih Platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(platforms).map(([k, label]) => (
                                        <SelectItem key={k} value={k}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="edit-channel" className="text-xs">
                                Channel Iklan
                            </Label>
                            <Select
                                value={formData.ad_channel}
                                onValueChange={(val) => setFormData({ ...formData, ad_channel: val })}
                            >
                                <SelectTrigger id="edit-channel" className="mt-1 h-9 text-xs">
                                    <SelectValue placeholder="Pilih Channel" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(channels).map(([k, label]) => (
                                        <SelectItem key={k} value={k}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="edit-date" className="text-xs">
                                Tanggal
                            </Label>
                            <Popover open={isEditDatePickerOpen} onOpenChange={setIsEditDatePickerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="edit-date"
                                        type="button"
                                        variant="outline"
                                        className="mt-1 h-9 w-full justify-start text-left text-xs font-normal"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {formData.date ? (
                                            format(parseISO(formData.date), 'dd MMMM yyyy', { locale: idLocale })
                                        ) : (
                                            <span className="text-muted-foreground">Pilih tanggal</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto rounded-2xl border border-border bg-popover p-3 shadow-xl z-50" align="start">
                                    <CalendarPicker
                                        mode="single"
                                        selected={formData.date ? parseISO(formData.date) : undefined}
                                        onSelect={(selectedDate) => {
                                            if (selectedDate) {
                                                setFormData({
                                                    ...formData,
                                                    date: format(selectedDate, 'yyyy-MM-dd'),
                                                });
                                                setIsEditDatePickerOpen(false);
                                            }
                                        }}
                                        className={cn(
                                            'rounded-xl p-2 text-sm',
                                            '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
                                            '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
                                            '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
                                            '[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-white',
                                            '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700 dark:[&_.rdp-caption_label]:text-zinc-200',
                                        )}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div>
                            <Label htmlFor="edit-amount" className="text-xs">
                                Nominal (Rp)
                            </Label>
                            <div className="relative mt-1">
                                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                    Rp
                                </span>
                                <Input
                                    id="edit-amount"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="h-9 pl-9 text-xs font-semibold"
                                    value={formatRupiah(formData.amount)}
                                    onChange={(e) => setFormData({ ...formData, amount: toPlainNumber(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="edit-notes" className="text-xs">
                                Catatan (Opsional)
                            </Label>
                            <Textarea
                                id="edit-notes"
                                className="mt-1 text-xs"
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                        <DialogFooter className="mt-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => setEditItem(null)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="h-8 text-xs">
                                Perbarui
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data pengeluaran iklan ini?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setDeleteId(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isSubmitting}
                            className="h-8 text-xs"
                            onClick={handleDelete}
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
