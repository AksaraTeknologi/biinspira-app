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
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    Calendar,
    ExternalLink,
    GraduationCap,
    Package,
    Pencil,
    Plus,
    Trash2,
    Users,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

interface BrevetRecord {
    id: number;
    platform: string;
    platform_label: string;
    batch: string;
    month: string;
    year: number;
    weekend: number;
    weekday: number;
    scholarship: number;
    other_brevet: number;
    total: number;
    notes: string | null;
    creator_name: string | null;
    created_at: string | null;
}

interface SummaryData {
    total_weekend: number;
    total_weekday: number;
    total_scholarship: number;
    total_other: number;
    total_all: number;
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
    records: PaginatedResponse<BrevetRecord>;
    summary: SummaryData;
    platforms: Record<string, string>;
    months: string[];
    currentPlatform: string;
    currentYear: number;
}

const computeBatchName = (weekend: string, weekday: string, scholarship: string) => {
    const cleanWk = weekend.trim().replace(/^batch\s*/i, '').replace(/\(weekend\)/i, '').trim();
    const cleanWd = weekday.trim().replace(/^batch\s*/i, '').replace(/\(weekday\)/i, '').trim();
    const cleanSc = scholarship.trim().replace(/^batch\s*/i, '').replace(/\(beasiswa\)/i, '').trim();

    const parts: string[] = [];
    if (cleanWk) parts.push(`${cleanWk} (weekend)`);
    if (cleanWd) parts.push(`${cleanWd} (weekday)`);
    if (cleanSc) parts.push(`${cleanSc} (beasiswa)`);

    if (parts.length === 0) return '';
    return `Batch ${parts.join(', ')}`;
};

const parseBatchSegments = (batch: string) => {
    let weekend = '';
    let weekday = '';
    let scholarship = '';

    const wkMatch = batch.match(/(?:Batch\s+)?([^\s,]+|\d+)\s*\((?:weekend|Weekend)\)/i);
    if (wkMatch) weekend = wkMatch[1];

    const wdMatch = batch.match(/([^\s,]+|\d+)\s*\((?:weekday|Weekday)\)/i);
    if (wdMatch) weekday = wdMatch[1];

    const scMatch = batch.match(/([^\s,]+|\d+)\s*\((?:beasiswa|Beasiswa)\)/i);
    if (scMatch) scholarship = scMatch[1];

    if (!weekend && !weekday && !scholarship && batch.trim()) {
        weekend = batch.replace(/^Batch\s+/i, '').trim();
    }

    return { weekend, weekday, scholarship };
};

export default function BrevetStatsIndex() {
    const { records, summary, platforms, months, currentPlatform, currentYear } = usePage<PageProps>().props;

    const [isAddOpen, setIsAddOpen] = React.useState(false);
    const [editItem, setEditItem] = React.useState<BrevetRecord | null>(null);
    const [deleteId, setDeleteId] = React.useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Segmented batch state for modal
    const [batchSegments, setBatchSegments] = React.useState({
        weekend: '',
        weekday: '',
        scholarship: '',
    });

    // Form state
    const [formData, setFormData] = React.useState({
        platform: currentPlatform !== 'all' ? currentPlatform : 'biinspira',
        batch: '',
        month: 'September',
        year: currentYear || 2026,
        weekend: 0,
        weekday: 0,
        scholarship: 0,
        other_brevet: 0,
        notes: '',
    });

    const liveTotal =
        (Number(formData.weekend) || 0) +
        (Number(formData.weekday) || 0) +
        (Number(formData.scholarship) || 0) +
        (Number(formData.other_brevet) || 0);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Data Statistic', href: '#' },
        { title: 'Total Peserta Brevet', href: route('admin.brevet-stats.index') },
    ];

    const handlePlatformTab = (platKey: string) => {
        router.get(
            route('admin.brevet-stats.index'),
            { platform: platKey, year: currentYear },
            { preserveState: true, preserveScroll: true }
        );
    };

    const openAddModal = () => {
        setFormData({
            platform: currentPlatform !== 'all' ? currentPlatform : 'biinspira',
            batch: '',
            month: 'September',
            year: currentYear || 2026,
            weekend: 0,
            weekday: 0,
            scholarship: 0,
            other_brevet: 0,
            notes: '',
        });
        setBatchSegments({
            weekend: '',
            weekday: '',
            scholarship: '',
        });
        setIsAddOpen(true);
    };

    const openEditModal = (item: BrevetRecord) => {
        setEditItem(item);
        setFormData({
            platform: item.platform,
            batch: item.batch,
            month: item.month,
            year: item.year,
            weekend: item.weekend,
            weekday: item.weekday,
            scholarship: item.scholarship,
            other_brevet: item.other_brevet,
            notes: item.notes || '',
        });
        setBatchSegments(parseBatchSegments(item.batch));
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const finalBatch = formData.batch.trim() || computeBatchName(batchSegments.weekend, batchSegments.weekday, batchSegments.scholarship);
        if (!finalBatch) {
            toast.error('Mohon isi minimal salah satu segmentasi batch (Weekend / Weekday / Beasiswa)');
            return;
        }
        setIsSubmitting(true);
        router.post(
            route('admin.brevet-stats.store'),
            {
                ...formData,
                batch: finalBatch,
                weekend: Number(formData.weekend),
                weekday: Number(formData.weekday),
                scholarship: Number(formData.scholarship),
                other_brevet: Number(formData.other_brevet),
            },
            {
                onSuccess: () => {
                    toast.success('Data peserta brevet berhasil ditambahkan');
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
        const finalBatch = formData.batch.trim() || computeBatchName(batchSegments.weekend, batchSegments.weekday, batchSegments.scholarship);
        if (!finalBatch) {
            toast.error('Mohon isi minimal salah satu segmentasi batch (Weekend / Weekday / Beasiswa)');
            return;
        }
        setIsSubmitting(true);
        router.put(
            route('admin.brevet-stats.update', { id: editItem.id }),
            {
                ...formData,
                batch: finalBatch,
                weekend: Number(formData.weekend),
                weekday: Number(formData.weekday),
                scholarship: Number(formData.scholarship),
                other_brevet: Number(formData.other_brevet),
            },
            {
                onSuccess: () => {
                    toast.success('Data peserta brevet berhasil diperbarui');
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
        router.delete(route('admin.brevet-stats.destroy', { id: deleteId }), {
            onSuccess: () => {
                toast.success('Data peserta brevet berhasil dihapus');
                setDeleteId(null);
                setIsSubmitting(false);
            },
            onError: () => {
                toast.error('Gagal menghapus data');
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Total Peserta Brevet" />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                {/* Header Action */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            Total Peserta Brevet
                        </h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">
                            Pengelolaan data pendaftar Brevet Pajak per batch, kategori kelas, dan platform (Sesuai Excel Template)
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <a
                            href="/stats-brevet"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground shadow-2xs hover:bg-accent"
                        >
                            <ExternalLink className="h-3.5 w-3.5 text-primary" />
                            <span>Buka TV Dashboard</span>
                        </a>

                        <Button onClick={openAddModal} className="h-9 gap-1.5 text-xs font-semibold shadow-xs">
                            <Plus className="h-4 w-4" />
                            <span>Tambah Data Brevet</span>
                        </Button>
                    </div>
                </div>

                {/* KPI Summary Cards - Solid White with Distinct Category Accents */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="rounded-xl border border-border/80 bg-white p-3.5 shadow-2xs dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Total Pendaftar</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <GraduationCap className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-foreground">
                            {summary.total_all.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">Akumulasi peserta</p>
                    </div>

                    <div className="rounded-xl border border-blue-200/90 bg-white p-3.5 shadow-2xs dark:border-blue-900/60 dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Weekend</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-400">
                                <Calendar className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-foreground dark:text-blue-100">
                            {summary.total_weekend.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">Kelas Sabtu/Minggu</p>
                    </div>

                    <div className="rounded-xl border border-rose-200/90 bg-white p-3.5 shadow-2xs dark:border-rose-900/60 dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Weekday</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-400">
                                <Briefcase className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-foreground dark:text-rose-100">
                            {summary.total_weekday.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">Kelas Reguler Senin-Jumat</p>
                    </div>

                    <div className="rounded-xl border border-emerald-200/90 bg-white p-3.5 shadow-2xs dark:border-emerald-900/60 dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Beasiswa</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400">
                                <Award className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-foreground dark:text-emerald-100">
                            {summary.total_scholarship.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Peserta Jalur Beasiswa</p>
                    </div>

                    <div className="col-span-2 rounded-xl border border-amber-200/90 bg-white p-3.5 shadow-2xs sm:col-span-1 dark:border-amber-900/60 dark:bg-card">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Lainnya (CAP/CFTR)</span>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-400">
                                <Package className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black text-foreground dark:text-amber-100">
                            {summary.total_other.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">Bundling / Potongan / CFTR</p>
                    </div>
                </div>

                {/* Platform Tabs & Table Container */}
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
                    {/* Platform Selector Tabs matching Excel bottom sheets */}
                    <div className="flex flex-wrap items-center gap-1.5 border-b border-border/80 bg-muted/40 p-2 sm:px-3">
                        <span className="mr-1 text-xs font-bold text-muted-foreground uppercase">Platform:</span>
                        <button
                            type="button"
                            onClick={() => handlePlatformTab('all')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                currentPlatform === 'all'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground'
                            }`}
                        >
                            🌟 Semua Platform (Akumulasi)
                        </button>
                        {Object.entries(platforms).map(([pKey, pLabel]) => (
                            <button
                                key={pKey}
                                type="button"
                                onClick={() => handlePlatformTab(pKey)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    currentPlatform === pKey
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground'
                                }`}
                            >
                                {pLabel}
                            </button>
                        ))}
                    </div>

                    {/* Table View matching Excel Layout */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/20">
                                    <TableHead className="w-12 text-center text-xs font-bold">No</TableHead>
                                    <TableHead className="min-w-64 text-xs font-bold">Batch</TableHead>
                                    {currentPlatform === 'all' && (
                                        <TableHead className="w-32 text-xs font-bold">Platform</TableHead>
                                    )}
                                    <TableHead className="w-28 text-xs font-bold">Bulan</TableHead>
                                    <TableHead className="w-24 text-right text-xs font-bold text-blue-600 dark:text-blue-400">
                                        Weekend
                                    </TableHead>
                                    <TableHead className="w-24 text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                                        Weekday
                                    </TableHead>
                                    <TableHead className="w-24 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        Beasiswa
                                    </TableHead>
                                    <TableHead className="w-36 text-right text-xs font-bold text-amber-600 dark:text-amber-400">
                                        Lainnya (CAP/CFTR)
                                    </TableHead>
                                    <TableHead className="w-28 text-right text-xs font-extrabold text-foreground">
                                        Total
                                    </TableHead>
                                    <TableHead className="w-20 text-center text-xs font-bold">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={currentPlatform === 'all' ? 10 : 9} className="h-32 text-center text-xs text-muted-foreground">
                                            Belum ada data pendaftar brevet untuk platform ini.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    records.data.map((row, idx) => (
                                        <TableRow key={row.id} className="hover:bg-muted/30">
                                            <TableCell className="text-center text-xs font-medium text-muted-foreground">
                                                {(records.from ?? 1) + idx}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-foreground">
                                                {row.batch}
                                            </TableCell>
                                            {currentPlatform === 'all' && (
                                                <TableCell className="text-xs">
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                                        {row.platform_label}
                                                    </span>
                                                </TableCell>
                                            )}
                                            <TableCell className="text-xs text-muted-foreground">
                                                {row.month} {row.year}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold text-blue-700 dark:text-blue-300">
                                                {row.weekend}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold text-rose-700 dark:text-rose-300">
                                                {row.weekday}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                                {row.scholarship}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-bold text-amber-700 dark:text-amber-300">
                                                {row.other_brevet}
                                            </TableCell>
                                            <TableCell className="text-right text-xs font-black text-foreground">
                                                {row.total}
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
                            {records.data.length > 0 && (
                                <TableFooter className="bg-muted/50 font-bold">
                                    <TableRow>
                                        <TableCell colSpan={currentPlatform === 'all' ? 4 : 3} className="text-xs font-black uppercase">
                                            Total Keseluruhan
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-black text-blue-700 dark:text-blue-300">
                                            {summary.total_weekend}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-black text-rose-700 dark:text-rose-300">
                                            {summary.total_weekday}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-black text-emerald-700 dark:text-emerald-300">
                                            {summary.total_scholarship}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-black text-amber-700 dark:text-amber-300">
                                            {summary.total_other}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-black text-primary">
                                            {summary.total_all}
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableFooter>
                            )}
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
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Data Peserta Brevet</DialogTitle>
                        <DialogDescription>
                            Isi rincian batch dan jumlah pendaftar tiap kategori
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-3.5 py-1">
                        <div className="grid grid-cols-3 gap-3">
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
                                <Label htmlFor="month" className="text-xs">
                                    Bulan
                                </Label>
                                <Select
                                    value={formData.month}
                                    onValueChange={(val) => setFormData({ ...formData, month: val })}
                                >
                                    <SelectTrigger id="month" className="mt-1 h-9 text-xs">
                                        <SelectValue placeholder="Pilih Bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m) => (
                                            <SelectItem key={m} value={m}>
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="year" className="text-xs">
                                    Tahun
                                </Label>
                                <Select
                                    value={String(formData.year)}
                                    onValueChange={(val) => setFormData({ ...formData, year: Number(val) })}
                                >
                                    <SelectTrigger id="year" className="mt-1 h-9 text-xs">
                                        <SelectValue placeholder="Pilih Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Segmentasi Nama Batch</Label>
                                <span className="text-[10px] text-muted-foreground">Otomatis digabung saat disimpan</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <div>
                                    <Label htmlFor="batch-weekend" className="text-[11px] text-blue-600 dark:text-blue-400">
                                        Batch Weekend
                                    </Label>
                                    <Input
                                        id="batch-weekend"
                                        placeholder="Contoh: 100"
                                        className="mt-1 h-9 text-xs"
                                        value={batchSegments.weekend}
                                        onChange={(e) => {
                                            const newSegs = { ...batchSegments, weekend: e.target.value };
                                            setBatchSegments(newSegs);
                                            setFormData({ ...formData, batch: computeBatchName(newSegs.weekend, newSegs.weekday, newSegs.scholarship) });
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="batch-weekday" className="text-[11px] text-rose-600 dark:text-rose-400">
                                        Batch Weekday
                                    </Label>
                                    <Input
                                        id="batch-weekday"
                                        placeholder="Contoh: 35"
                                        className="mt-1 h-9 text-xs"
                                        value={batchSegments.weekday}
                                        onChange={(e) => {
                                            const newSegs = { ...batchSegments, weekday: e.target.value };
                                            setBatchSegments(newSegs);
                                            setFormData({ ...formData, batch: computeBatchName(newSegs.weekend, newSegs.weekday, newSegs.scholarship) });
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="batch-scholarship" className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                        Batch Beasiswa
                                    </Label>
                                    <Input
                                        id="batch-scholarship"
                                        placeholder="Contoh: 85 (Opsional)"
                                        className="mt-1 h-9 text-xs"
                                        value={batchSegments.scholarship}
                                        onChange={(e) => {
                                            const newSegs = { ...batchSegments, scholarship: e.target.value };
                                            setBatchSegments(newSegs);
                                            setFormData({ ...formData, batch: computeBatchName(newSegs.weekend, newSegs.weekday, newSegs.scholarship) });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-[11px] dark:border-slate-800 dark:bg-slate-900/50">
                                <span className="text-muted-foreground">Format Tersimpan:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate ml-2">
                                    {formData.batch || <span className="font-normal italic text-muted-foreground">Belum diisi</span>}
                                </span>
                            </div>
                        </div>

                        {/* 4 Category Inputs */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div>
                                <Label htmlFor="weekend" className="text-xs text-blue-600 dark:text-blue-400">
                                    Weekend
                                </Label>
                                <Input
                                    id="weekend"
                                    type="number"
                                    min="0"
                                    className="mt-1 h-9 text-xs font-bold"
                                    value={formData.weekend}
                                    onChange={(e) => setFormData({ ...formData, weekend: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="weekday" className="text-xs text-rose-600 dark:text-rose-400">
                                    Weekday
                                </Label>
                                <Input
                                    id="weekday"
                                    type="number"
                                    min="0"
                                    className="mt-1 h-9 text-xs font-bold"
                                    value={formData.weekday}
                                    onChange={(e) => setFormData({ ...formData, weekday: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="scholarship" className="text-xs text-emerald-600 dark:text-emerald-400">
                                    Beasiswa
                                </Label>
                                <Input
                                    id="scholarship"
                                    type="number"
                                    min="0"
                                    className="mt-1 h-9 text-xs font-bold"
                                    value={formData.scholarship}
                                    onChange={(e) => setFormData({ ...formData, scholarship: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="other_brevet" className="text-xs text-amber-600 dark:text-amber-400">
                                    Lainnya (CAP/CFTR)
                                </Label>
                                <Input
                                    id="other_brevet"
                                    type="number"
                                    min="0"
                                    className="mt-1 h-9 text-xs font-bold"
                                    value={formData.other_brevet}
                                    onChange={(e) => setFormData({ ...formData, other_brevet: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Live Total preview */}
                        <div className="flex items-center justify-between rounded-lg bg-muted p-2.5 text-xs">
                            <span className="font-semibold text-muted-foreground">Total Peserta Batch Ini:</span>
                            <span className="text-base font-black text-primary">{liveTotal} Peserta</span>
                        </div>

                        <div>
                            <Label htmlFor="notes" className="text-xs">
                                Catatan (Opsional)
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder="Keterangan tambahan..."
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
                                Simpan Data
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Data Peserta Brevet</DialogTitle>
                        <DialogDescription>
                            Perbarui rincian batch dan pendaftar
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-3.5 py-1">
                        <div className="grid grid-cols-3 gap-3">
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
                                <Label htmlFor="edit-month" className="text-xs">
                                    Bulan
                                </Label>
                                <Select
                                    value={formData.month}
                                    onValueChange={(val) => setFormData({ ...formData, month: val })}
                                >
                                    <SelectTrigger id="edit-month" className="mt-1 h-9 text-xs">
                                        <SelectValue placeholder="Pilih Bulan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((m) => (
                                            <SelectItem key={m} value={m}>
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="edit-year" className="text-xs">
                                    Tahun
                                </Label>
                                <Select
                                    value={String(formData.year)}
                                    onValueChange={(val) => setFormData({ ...formData, year: Number(val) })}
                                >
                                    <SelectTrigger id="edit-year" className="mt-1 h-9 text-xs">
                                        <SelectValue placeholder="Pilih Tahun" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                                            <SelectItem key={y} value={String(y)}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Segmentasi Nama Batch</Label>
                                <span className="text-[10px] text-muted-foreground">Otomatis digabung saat disimpan</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                <div>
                                    <Label htmlFor="edit-batch-weekend" className="text-[11px] text-blue-600 dark:text-blue-400">
                                        Batch Weekend
                                    </Label>
                                    <Input
                                        id="edit-batch-weekend"
                                        placeholder="Contoh: 100"
                                        className="mt-1 h-9 text-xs"
                                        value={batchSegments.weekend}
                                        onChange={(e) => {
                                            const newSegs = { ...batchSegments, weekend: e.target.value };
                                            setBatchSegments(newSegs);
                                            setFormData({ ...formData, batch: computeBatchName(newSegs.weekend, newSegs.weekday, newSegs.scholarship) });
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-batch-weekday" className="text-[11px] text-rose-600 dark:text-rose-400">
                                        Batch Weekday
                                    </Label>
                                    <Input
                                        id="edit-batch-weekday"
                                        placeholder="Contoh: 35"
                                        className="mt-1 h-9 text-xs"
                                        value={batchSegments.weekday}
                                        onChange={(e) => {
                                            const newSegs = { ...batchSegments, weekday: e.target.value };
                                            setBatchSegments(newSegs);
                                            setFormData({ ...formData, batch: computeBatchName(newSegs.weekend, newSegs.weekday, newSegs.scholarship) });
                                        }}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-batch-scholarship" className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                        Batch Beasiswa
                                    </Label>
                                    <Input
                                        id="edit-batch-scholarship"
                                        placeholder="Contoh: 85 (Opsional)"
                                        className="mt-1 h-9 text-xs"
                                        value={batchSegments.scholarship}
                                        onChange={(e) => {
                                            const newSegs = { ...batchSegments, scholarship: e.target.value };
                                            setBatchSegments(newSegs);
                                            setFormData({ ...formData, batch: computeBatchName(newSegs.weekend, newSegs.weekday, newSegs.scholarship) });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-[11px] dark:border-slate-800 dark:bg-slate-900/50">
                                <span className="text-muted-foreground">Format Tersimpan:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate ml-2">
                                    {formData.batch || <span className="font-normal italic text-muted-foreground">Belum diisi</span>}
                                </span>
                            </div>
                        </div>

                        {/* 4 Category Inputs */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div>
                                <Label htmlFor="edit-weekend" className="text-xs text-blue-600 dark:text-blue-400">
                                    Weekend
                                </Label>
                                <Input
                                    id="edit-weekend"
                                    type="number"
                                    min="0"
                                    className="mt-1 h-9 text-xs font-bold"
                                    value={formData.weekend}
                                    onChange={(e) => setFormData({ ...formData, weekend: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-weekday" className="text-xs text-rose-600 dark:text-rose-400">
                                    Weekday
                                </Label>
                                <Input
                                    id="edit-weekday"
                                    type="number"
                                    min="0"
                                    className="mt-1 h-9 text-xs font-bold"
                                    value={formData.weekday}
                                    onChange={(e) => setFormData({ ...formData, weekday: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-scholarship" className="text-xs text-emerald-600 dark:text-emerald-400">
                                    Beasiswa
                                </Label>
                                <Input
                                    id="edit-scholarship"
                                    type="number"
                                    min="0"
                                    className="mt-1 h-9 text-xs font-bold"
                                    value={formData.scholarship}
                                    onChange={(e) => setFormData({ ...formData, scholarship: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit-other_brevet" className="text-xs text-amber-600 dark:text-amber-400">
                                    Lainnya (CAP/CFTR)
                                </Label>
                                <Input
                                    id="edit-other_brevet"
                                    type="number"
                                    min="0"
                                    className="mt-1 h-9 text-xs font-bold"
                                    value={formData.other_brevet}
                                    onChange={(e) => setFormData({ ...formData, other_brevet: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Live Total preview */}
                        <div className="flex items-center justify-between rounded-lg bg-muted p-2.5 text-xs">
                            <span className="font-semibold text-muted-foreground">Total Peserta Batch Ini:</span>
                            <span className="text-base font-black text-primary">{liveTotal} Peserta</span>
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
                            Apakah Anda yakin ingin menghapus data peserta batch ini?
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
