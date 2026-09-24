'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    Award,
    Banknote,
    BarChart3,
    Briefcase,
    Calendar,
    GraduationCap,
    Lock,
    Maximize2,
    Minimize2,
    Package,
    Sparkles,
    Table as TableIcon,
    Tv,
    Users,
} from 'lucide-react';
import * as React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface BrevetChartPoint {
    name: string;
    label: string;
    batch_full?: string;
    weekend: number;
    weekday: number;
    scholarship: number;
    other_brevet: number;
    total: number;
}

interface BrevetTableRow {
    no: number;
    id: number;
    platform: string;
    batch: string;
    month: string;
    year: number;
    weekend: number;
    weekday: number;
    scholarship: number;
    other_brevet: number;
    total: number;
}

interface PlatformBrevetData {
    key: string;
    label: string;
    summary: {
        total: number;
        weekend: number;
        weekend_pct: number;
        weekday: number;
        weekday_pct: number;
        scholarship: number;
        scholarship_pct: number;
        other_brevet: number;
        other_brevet_pct: number;
    };
    chart_data: BrevetChartPoint[];
    table_rows: BrevetTableRow[];
}

interface BrevetPayload {
    platforms: Record<string, PlatformBrevetData>;
    default_platform: string;
}

interface PageProps {
    brevetData?: BrevetPayload;
    generatedAt: string;
}

export default function TvBrevetStatsPage({ brevetData, generatedAt }: PageProps) {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [currentPlatformKey, setCurrentPlatformKey] = React.useState('all');
    const [viewMode, setViewMode] = React.useState<'combined' | 'chart' | 'table'>('combined');

    const formattedFullDate = React.useMemo(() => {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Current platform data
    const activeData: PlatformBrevetData | undefined =
        brevetData?.platforms[currentPlatformKey] || brevetData?.platforms['all'];

    return (
        <>
            <Head title="Statistik Peserta Brevet - Biinspira Group" />
            <div className="flex min-h-screen w-screen flex-col bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center lg:h-screen lg:overflow-hidden">
                {/* Main Light Glassmorphic Container */}
                <div className="flex flex-1 flex-col overflow-y-auto bg-slate-900/18 px-3 py-2.5 backdrop-blur-[1px] sm:px-6 sm:py-4 lg:px-8 lg:overflow-hidden">
                    {/* Header Bar */}
                    <div className="mb-2.5 flex shrink-0 flex-col gap-2 sm:mb-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] tracking-[0.2em] text-slate-100/90 uppercase sm:text-xs sm:tracking-[0.28em]">
                                    LIVE MONITORING BIINSPIRA GROUP
                                </p>
                                <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
                                    Total Peserta Brevet Pajak
                                </h1>
                            </div>

                            {/* Mobile Navigation Links */}
                            <div className="flex items-center gap-1.5 sm:hidden">
                                <Link
                                    href="/stats"
                                    className="flex h-8 items-center gap-1 rounded-full border border-white/45 bg-white/20 px-2.5 text-[11px] font-medium text-white backdrop-blur-sm"
                                >
                                    <Tv className="h-3.5 w-3.5 text-sky-200" />
                                    <span>Platform</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm"
                                >
                                    {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.post(route('tv.stats.lock'))}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm hover:bg-rose-500/30"
                                >
                                    <Lock className="h-3.5 w-3.5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Top Controls & Navigation */}
                        <div className="flex shrink-0 items-center justify-between gap-1.5 sm:justify-end xl:gap-2">
                            {/* Layout Mode Toggle */}
                            <div className="flex items-center rounded-full border border-white/45 bg-white/20 p-1 text-white backdrop-blur-sm">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('combined')}
                                    className={`h-7 rounded-full px-2.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        viewMode === 'combined' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Grafik & Tabel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('chart')}
                                    className={`h-7 rounded-full px-2.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        viewMode === 'chart' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Grafik Saja
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={`h-7 rounded-full px-2.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        viewMode === 'table' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Tabel Saja
                                </button>
                            </div>

                            {/* Desktop Unified Navigation Suite */}
                            <div className="hidden sm:flex sm:items-center sm:gap-1.5 xl:gap-2">
                                <Link
                                    href="/stats"
                                    className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
                                    title="Statistik Omset Platform"
                                >
                                    <Tv className="h-3.5 w-3.5 text-sky-200" />
                                    <span>Platform</span>
                                </Link>

                                <Link
                                    href="/stats-omset"
                                    className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
                                    title="Perbandingan Omset 2025 vs 2026"
                                >
                                    <BarChart3 className="h-3.5 w-3.5 text-emerald-200" />
                                    <span>Omset '25 vs '26</span>
                                </Link>

                                <Link
                                    href="/stats-iklan"
                                    className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
                                    title="Statistik Biaya Iklan"
                                >
                                    <Banknote className="h-3.5 w-3.5 text-blue-200" />
                                    <span>Biaya Iklan</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30"
                                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh TV'}
                                >
                                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.post(route('tv.stats.lock'))}
                                    className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-rose-500/30 hover:border-rose-400/60"
                                    title="Kunci Tampilan Statistik"
                                >
                                    <Lock className="h-3.5 w-3.5 text-white" />
                                    <span>Kunci</span>
                                </button>

                                <p className="flex h-9 items-center rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium text-white backdrop-blur-sm">
                                    Update: {new Date(generatedAt).toLocaleTimeString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Platform Selector Tabs matching Excel bottom sheets */}
                    <Deferred
                        data="brevetData"
                        fallback={<Skeleton className="mb-2 h-10 w-full rounded-2xl bg-white/20" />}
                    >
                        {brevetData && (
                            <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/45 bg-white/20 p-1.5 backdrop-blur-sm sm:gap-2">
                                {Object.entries(brevetData.platforms).map(([pKey, pVal]) => (
                                    <button
                                        key={pKey}
                                        type="button"
                                        onClick={() => setCurrentPlatformKey(pKey)}
                                        className={`h-8 shrink-0 rounded-xl px-3 text-xs font-bold transition sm:px-4 ${
                                            currentPlatformKey === pKey
                                                ? 'bg-white text-primary shadow-md'
                                                : 'text-white hover:bg-white/25'
                                        }`}
                                    >
                                        {pVal.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </Deferred>

                    {/* Deferred Content */}
                    <Deferred
                        data="brevetData"
                        fallback={
                            <div className="flex flex-1 flex-col gap-3">
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/30" />
                                    ))}
                                </div>
                                <Skeleton className="w-full flex-1 rounded-3xl bg-white/30" />
                            </div>
                        }
                    >
                        {activeData && (
                            <div className="flex flex-1 flex-col gap-2.5 lg:overflow-hidden">
                                {/* Top KPI Summary Cards */}
                                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                                    {/* Card 1: Total Peserta */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3 sm:p-3 xl:p-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-xs sm:h-11 sm:w-11 xl:h-12 xl:w-12">
                                            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                                    Total Pendaftar
                                                </p>
                                                <span className="py-0.2 rounded-full border border-indigo-300 bg-indigo-50 px-1.5 text-[9px] font-bold text-indigo-800 sm:px-2 sm:text-[10px]">
                                                    100%
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-sm leading-tight font-black text-slate-900 sm:text-xl xl:text-2xl 2xl:text-3xl">
                                                {activeData.summary.total.toLocaleString('id-ID')}
                                            </p>
                                            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                                                {activeData.label}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 2: Weekend */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3 sm:p-3 xl:p-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-sky-600 text-white shadow-xs sm:h-11 sm:w-11 xl:h-12 xl:w-12">
                                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                                    Weekend
                                                </p>
                                                <span className="py-0.2 rounded-full border border-blue-300 bg-blue-50 px-1.5 text-[9px] font-bold text-blue-800 sm:px-2 sm:text-[10px]">
                                                    {activeData.summary.weekend_pct}%
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-sm leading-tight font-black text-blue-700 sm:text-xl xl:text-2xl 2xl:text-3xl">
                                                {activeData.summary.weekend.toLocaleString('id-ID')}
                                            </p>
                                            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                                                Kelas Sabtu/Minggu
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 3: Weekday */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3 sm:p-3 xl:p-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-red-600 text-white shadow-xs sm:h-11 sm:w-11 xl:h-12 xl:w-12">
                                            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                                    Weekday
                                                </p>
                                                <span className="py-0.2 rounded-full border border-rose-300 bg-rose-50 px-1.5 text-[9px] font-bold text-rose-800 sm:px-2 sm:text-[10px]">
                                                    {activeData.summary.weekday_pct}%
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-sm leading-tight font-black text-rose-700 sm:text-xl xl:text-2xl 2xl:text-3xl">
                                                {activeData.summary.weekday.toLocaleString('id-ID')}
                                            </p>
                                            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                                                Kelas Reguler
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 4: Beasiswa */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3 sm:p-3 xl:p-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-xs sm:h-11 sm:w-11 xl:h-12 xl:w-12">
                                            <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                                    Beasiswa
                                                </p>
                                                <span className="py-0.2 rounded-full border border-emerald-300 bg-emerald-50 px-1.5 text-[9px] font-bold text-emerald-800 sm:px-2 sm:text-[10px]">
                                                    {activeData.summary.scholarship_pct}%
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-sm leading-tight font-black text-emerald-700 sm:text-xl xl:text-2xl 2xl:text-3xl">
                                                {activeData.summary.scholarship.toLocaleString('id-ID')}
                                            </p>
                                            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                                                Peserta Beasiswa
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 5: Brevet Lain */}
                                    <div className="col-span-2 flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:col-span-1 sm:gap-3 sm:p-3 xl:p-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-yellow-600 text-white shadow-xs sm:h-11 sm:w-11 xl:h-12 xl:w-12">
                                            <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                                    Brevet Lain
                                                </p>
                                                <span className="py-0.2 rounded-full border border-amber-300 bg-amber-50 px-1.5 text-[9px] font-bold text-amber-800 sm:px-2 sm:text-[10px]">
                                                    {activeData.summary.other_brevet_pct}%
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-sm leading-tight font-black text-amber-700 sm:text-xl xl:text-2xl 2xl:text-3xl">
                                                {activeData.summary.other_brevet.toLocaleString('id-ID')}
                                            </p>
                                            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                                                Bundling / CFTR
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Visualization: Chart & Table */}
                                <div
                                    className={`grid flex-1 gap-2.5 lg:min-h-0 ${
                                        viewMode === 'combined'
                                            ? 'grid-cols-1 lg:grid-cols-12'
                                            : 'grid-cols-1'
                                    }`}
                                >
                                    {/* Left: Grouped Bar Chart (Weekend vs Weekday vs Beasiswa vs Brevet Lain) */}
                                    {(viewMode === 'combined' || viewMode === 'chart') && (
                                        <div
                                            className={`flex flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/88 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-4 lg:min-h-0 ${
                                                viewMode === 'combined' ? 'lg:col-span-7' : 'lg:col-span-12'
                                            }`}
                                        >
                                            <div className="mb-2 flex shrink-0 items-center justify-between border-b border-slate-200/80 pb-2">
                                                <div>
                                                    <h2 className="text-xs font-bold text-slate-900 sm:text-sm">
                                                        Pendaftar Weekend vs Weekday vs Beasiswa vs Brevet Lain - {activeData.label}
                                                    </h2>
                                                    <p className="text-[10px] text-slate-500">
                                                        Visualisasi perbandingan kategori peserta pendaftar brevet
                                                    </p>
                                                </div>

                                                {/* Legend indicator */}
                                                <div className="hidden sm:flex items-center gap-2 text-[11px]">
                                                    <span className="flex items-center gap-1 font-semibold text-blue-700">
                                                        <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Weekend
                                                    </span>
                                                    <span className="flex items-center gap-1 font-semibold text-rose-700">
                                                        <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Weekday
                                                    </span>
                                                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Beasiswa
                                                    </span>
                                                    <span className="flex items-center gap-1 font-semibold text-amber-700">
                                                        <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Brevet Lain
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex min-h-70 flex-1 flex-col sm:min-h-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={activeData.chart_data} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                                                        <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                                                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                                                        <Tooltip
                                                            content={({ active, payload }) => {
                                                                if (!active || !payload?.length) return null;
                                                                const item = payload[0]?.payload as BrevetChartPoint;
                                                                return (
                                                                    <div className="min-w-56 rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-900 shadow-xl backdrop-blur">
                                                                        <p className="border-b border-slate-100 pb-1 font-bold text-primary">
                                                                            {item.batch_full || item.name}
                                                                        </p>
                                                                        <div className="mt-2 space-y-1">
                                                                            <div className="flex justify-between text-blue-700 font-semibold">
                                                                                <span>Weekend:</span>
                                                                                <span>{item.weekend} peserta</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-rose-700 font-semibold">
                                                                                <span>Weekday:</span>
                                                                                <span>{item.weekday} peserta</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-emerald-700 font-semibold">
                                                                                <span>Beasiswa:</span>
                                                                                <span>{item.scholarship} peserta</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-amber-700 font-semibold">
                                                                                <span>Brevet Lain:</span>
                                                                                <span>{item.other_brevet} peserta</span>
                                                                            </div>
                                                                            <div className="flex justify-between border-t border-slate-100 pt-1 font-black text-slate-900">
                                                                                <span>Total Batch:</span>
                                                                                <span>{item.total} peserta</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }}
                                                        />
                                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                                                        <Bar dataKey="weekend" name="Weekend" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                                        <Bar dataKey="weekday" name="Weekday" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                                        <Bar dataKey="scholarship" name="Beasiswa" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                                        <Bar dataKey="other_brevet" name="Brevet Lain" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    )}

                                    {/* Right: Table View matching Excel Layout */}
                                    {(viewMode === 'combined' || viewMode === 'table') && (
                                        <div
                                            className={`flex flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/88 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-4 lg:min-h-0 ${
                                                viewMode === 'combined' ? 'lg:col-span-5' : 'lg:col-span-12'
                                            }`}
                                        >
                                            <div className="mb-2 flex shrink-0 items-center justify-between border-b border-slate-200/80 pb-2">
                                                <div>
                                                    <h3 className="text-xs font-bold text-slate-900 sm:text-sm">
                                                        Tabel Data Pendaftar Brevet
                                                    </h3>
                                                    <p className="text-[10px] text-slate-500">
                                                        Format matriks sesuai template Excel resmi
                                                    </p>
                                                </div>
                                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                    {activeData.table_rows.length} Batch Terdata
                                                </span>
                                            </div>

                                            <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-white">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="sticky top-0 bg-slate-100 font-bold text-slate-700 shadow-2xs">
                                                        <tr>
                                                            <th className="p-2 text-center w-8">No</th>
                                                            <th className="p-2">Batch</th>
                                                            <th className="p-2">Bulan</th>
                                                            <th className="p-2 text-right text-blue-700">Weekend</th>
                                                            <th className="p-2 text-right text-rose-700">Weekday</th>
                                                            <th className="p-2 text-right text-emerald-700">Beasiswa</th>
                                                            <th className="p-2 text-right text-amber-700">Lain</th>
                                                            <th className="p-2 text-right font-black text-slate-900">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {activeData.table_rows.map((row, idx) => (
                                                            <tr key={row.id} className="hover:bg-amber-50/40">
                                                                <td className="p-2 text-center font-medium text-slate-400">{idx + 1}</td>
                                                                <td className="p-2 font-semibold text-slate-800" title={row.batch}>
                                                                    <div className="max-w-32.5 truncate sm:max-w-xs">{row.batch}</div>
                                                                </td>
                                                                <td className="p-2 text-slate-500">{row.month}</td>
                                                                <td className="p-2 text-right font-bold text-blue-700">{row.weekend}</td>
                                                                <td className="p-2 text-right font-bold text-rose-700">{row.weekday}</td>
                                                                <td className="p-2 text-right font-bold text-emerald-700">{row.scholarship}</td>
                                                                <td className="p-2 text-right font-bold text-amber-700">{row.other_brevet}</td>
                                                                <td className="p-2 text-right font-black text-slate-900">{row.total}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="sticky bottom-0 bg-slate-100 font-extrabold text-slate-900 shadow-sm border-t-2 border-slate-300">
                                                        <tr>
                                                            <td colSpan={3} className="p-2 text-xs uppercase font-black">
                                                                Total
                                                            </td>
                                                            <td className="p-2 text-right font-black text-blue-700">
                                                                {activeData.summary.weekend}
                                                            </td>
                                                            <td className="p-2 text-right font-black text-rose-700">
                                                                {activeData.summary.weekday}
                                                            </td>
                                                            <td className="p-2 text-right font-black text-emerald-700">
                                                                {activeData.summary.scholarship}
                                                            </td>
                                                            <td className="p-2 text-right font-black text-amber-700">
                                                                {activeData.summary.other_brevet}
                                                            </td>
                                                            <td className="p-2 text-right text-sm font-black text-primary">
                                                                {activeData.summary.total}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Deferred>
                </div>

                {/* Running Text Footer Marquee */}
                <div className="relative z-20 flex h-10 w-full shrink-0 items-center overflow-hidden border-t border-white/20 bg-slate-950/90 text-white shadow-2xl backdrop-blur">
                    <style>{`
                        @keyframes tvMarquee {
                            0% { transform: translateX(0%); }
                            100% { transform: translateX(-50%); }
                        }
                        .animate-tv-marquee {
                            display: flex;
                            width: max-content;
                            animation: tvMarquee 35s linear infinite;
                        }
                    `}</style>
                    <div className="animate-tv-marquee items-center gap-10 text-sm font-bold tracking-wide whitespace-nowrap text-slate-100 sm:text-base">
                        <span>📅 {formattedFullDate}</span>
                        <span className="text-sky-400">•</span>
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            ✨ LIVE MONITORING PESERTA BREVET BIINSPIRA GROUP
                        </span>
                        <span className="text-sky-400">•</span>
                        <span>🎓 Data Pendaftar: Biinspira, Smartcounting, Sekolah Pajak, Kompeten, Talenta, LevelUp, Aksademy & Skill Grow</span>
                        <span className="text-sky-400">•</span>
                        <span>📋 Kategori Kelas: Weekend, Weekday, Beasiswa, dan Brevet Lain / CFTR</span>
                        <span className="text-sky-400">•</span>
                        <span>📊 Data Diperbarui Secara Real-Time</span>
                        <span className="text-sky-400">•</span>

                        <span>📅 {formattedFullDate}</span>
                        <span className="text-sky-400">•</span>
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            ✨ LIVE MONITORING PESERTA BREVET BIINSPIRA GROUP
                        </span>
                        <span className="text-sky-400">•</span>
                        <span>🎓 Data Pendaftar: Biinspira, Smartcounting, Sekolah Pajak, Kompeten, Talenta, LevelUp, Aksademy & Skill Grow</span>
                        <span className="text-sky-400">•</span>
                        <span>📋 Kategori Kelas: Weekend, Weekday, Beasiswa, dan Brevet Lain / CFTR</span>
                        <span className="text-sky-400">•</span>
                        <span>📊 Data Diperbarui Secara Real-Time</span>
                        <span className="text-sky-400">•</span>
                    </div>
                </div>
            </div>
        </>
    );
}
