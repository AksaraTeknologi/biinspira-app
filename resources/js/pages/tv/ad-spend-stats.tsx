'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    BarChart3,
    Calendar,
    ChevronRight,
    CreditCard,
    DollarSign,
    GraduationCap,
    Layers,
    LineChart as LineChartIcon,
    Lock,
    Maximize2,
    Minimize2,
    PieChart,
    Sparkles,
    Table as TableIcon,
    TrendingUp,
    Tv,
    X,
} from 'lucide-react';
import * as React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart as RechartsPieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

function getPlatformInitials(label?: string) {
    if (!label) return 'NA';
    return label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

interface MonthlyPoint {
    month_number: number;
    month_name: string;
    is_current_or_past: boolean;
    total: number;
    total_val: number | null;
    meta: number;
    meta_val?: number | null;
    tiktok: number;
    tiktok_val?: number | null;
    google: number;
    google_val?: number | null;
    boost_post: number;
    boost_post_val?: number | null;
}

interface PlatformChannel {
    key: string;
    label: string;
    amount: number;
    percent: number;
}

interface PlatformItem {
    key: string;
    label: string;
    this_month: number;
    this_year: number;
    channels: Record<string, PlatformChannel>;
    monthly: {
        month: string;
        amount: number;
        amount_val: number | null;
        boost_post?: number;
        boost_post_val?: number | null;
        meta?: number;
        meta_val?: number | null;
        tiktok?: number;
        tiktok_val?: number | null;
        google?: number;
        google_val?: number | null;
    }[];
}

interface ChannelItem {
    key: string;
    label: string;
    amount: number;
    percent: number;
}

interface AdSpendPayload {
    summary: {
        current_year: number;
        current_month_name: string;
        this_month_spend: number;
        prev_month_spend: number;
        month_growth_percent: number;
        month_growth_direction: 'up' | 'down';
        this_year_spend: number;
        avg_per_month: number;
        top_platform: { label: string; amount: number } | null;
        top_channel: { label: string; percent: number; amount: number } | null;
    };
    monthly_data: MonthlyPoint[];
    platforms: PlatformItem[];
    channels: ChannelItem[];
}

interface PageProps {
    adSpendData?: AdSpendPayload;
    generatedAt: string;
}

export default function TvAdSpendStatsPage({ adSpendData, generatedAt }: PageProps) {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'monthly' | 'channels' | 'platforms' | 'table'>('monthly');
    const [chartType, setChartType] = React.useState<'bar' | 'line'>('bar');
    const [platformChartType, setPlatformChartType] = React.useState<'bar' | 'line'>('bar');
    const [selectedPlatform, setSelectedPlatform] = React.useState<PlatformItem | null>(null);

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

    // Formatters
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    const formatCompactCurrency = (val: number) => {
        if (!val || Math.abs(val) < 1) return '0';
        if (Math.abs(val) >= 1_000_000_000) {
            return (val / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M';
        }
        if (Math.abs(val) >= 1_000_000) {
            return (val / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
        }
        if (Math.abs(val) >= 1_000) {
            return (val / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + ' rb';
        }
        return val.toLocaleString('id-ID');
    };

    const channelColors: Record<string, string> = {
        meta: '#3b82f6', // blue
        tiktok: '#a855f7', // purple
        google: '#10b981', // emerald
        boost_post: '#f59e0b', // amber
    };

    return (
        <>
            <Head title="Statistik Biaya Iklan - Biinspira Group" />
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
                                    Statistik Biaya Iklan
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
                            {/* View Tabs */}
                            <div className="grid w-full grid-cols-4 items-center rounded-full border border-white/45 bg-white/20 p-1 text-white backdrop-blur-sm sm:inline-flex sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('monthly')}
                                    className={`h-7 rounded-full px-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        activeTab === 'monthly' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Tren Bulanan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('channels')}
                                    className={`h-7 rounded-full px-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        activeTab === 'channels' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Channel Iklan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('platforms')}
                                    className={`h-7 rounded-full px-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        activeTab === 'platforms' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Per Platform
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('table')}
                                    className={`h-7 rounded-full px-2 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        activeTab === 'table' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Tabel Rincian
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
                                    href="/stats-brevet"
                                    className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
                                    title="Total Peserta Brevet"
                                >
                                    <GraduationCap className="h-3.5 w-3.5 text-amber-200" />
                                    <span>Peserta Brevet</span>
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

                    {/* Deferred Content */}
                    <Deferred
                        data="adSpendData"
                        fallback={
                            <div className="flex flex-1 flex-col gap-3">
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="h-22 w-full rounded-2xl bg-white/30" />
                                    ))}
                                </div>
                                <Skeleton className="w-full flex-1 rounded-3xl bg-white/30" />
                            </div>
                        }
                    >
                        {adSpendData && (
                            <div className="flex flex-1 flex-col gap-2.5 lg:overflow-hidden">
                                {/* Top KPI Summary Cards */}
                                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
                                    {/* Card 1: Bulan Ini */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3.5 sm:p-3 xl:p-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-xs sm:h-11 sm:w-11 xl:h-12 xl:w-12">
                                            <Banknote className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                                    Biaya Iklan ({adSpendData.summary.current_month_name})
                                                </p>
                                                <span
                                                    className={`py-0.2 rounded-full border px-1.5 text-[9px] font-bold sm:px-2 sm:text-[10px] ${
                                                        adSpendData.summary.month_growth_direction === 'up'
                                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                                            : 'border-rose-300 bg-rose-50 text-rose-800'
                                                    }`}
                                                >
                                                    {adSpendData.summary.month_growth_direction === 'up' ? '↑ +' : '↓ '}
                                                    {adSpendData.summary.month_growth_percent}%
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-xs leading-tight font-black text-slate-900 sm:text-lg xl:text-xl 2xl:text-2xl">
                                                {formatCurrency(adSpendData.summary.this_month_spend)}
                                            </p>
                                            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                                                Bulan Lalu: <span className="font-semibold text-slate-700">{formatCompactCurrency(adSpendData.summary.prev_month_spend)}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 2: Tahun Ini */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3.5 sm:p-3 xl:p-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-xs sm:h-11 sm:w-11 xl:h-12 xl:w-12">
                                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                                    Biaya Iklan {adSpendData.summary.current_year} (YTD)
                                                </p>
                                                <span className="py-0.2 rounded-full border border-indigo-300 bg-indigo-50 px-1.5 text-[9px] font-bold text-indigo-800 sm:px-2 sm:text-[10px]">
                                                    Total YTD
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-xs leading-tight font-black text-slate-900 sm:text-lg xl:text-xl 2xl:text-2xl">
                                                {formatCurrency(adSpendData.summary.this_year_spend)}
                                            </p>
                                            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                                                Rata-rata: <span className="font-semibold text-slate-700">{formatCompactCurrency(adSpendData.summary.avg_per_month)}/bln</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 3: Platform Tertinggi */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3.5 sm:p-3 xl:p-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-cyan-600 text-white shadow-xs sm:h-11 sm:w-11 xl:h-12 xl:w-12">
                                            <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                                    Platform Tertinggi
                                                </p>
                                                <span className="py-0.2 rounded-full border border-sky-300 bg-sky-50 px-1.5 text-[9px] font-bold text-sky-800 sm:px-2 sm:text-[10px]">
                                                    Top Brand
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-xs leading-tight font-black text-primary sm:text-lg xl:text-xl">
                                                {adSpendData.summary.top_platform?.label || '-'}
                                            </p>
                                            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                                                Total: <span className="font-semibold text-slate-700">{formatCompactCurrency(adSpendData.summary.top_platform?.amount || 0)}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Card 4: Channel Utama */}
                                    <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2.5 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3.5 sm:p-3 xl:p-3.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-pink-600 text-white shadow-xs sm:h-11 sm:w-11 xl:h-12 xl:w-12">
                                            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                                    Channel Dominan
                                                </p>
                                                <span className="py-0.2 rounded-full border border-purple-300 bg-purple-50 px-1.5 text-[9px] font-bold text-purple-800 sm:px-2 sm:text-[10px]">
                                                    {adSpendData.summary.top_channel?.percent || 0}%
                                                </span>
                                            </div>
                                            <p className="mt-0.5 truncate text-xs leading-tight font-black text-purple-700 sm:text-lg xl:text-xl">
                                                {adSpendData.summary.top_channel?.label || '-'}
                                            </p>
                                            <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                                                Nominal: <span className="font-semibold text-slate-700">{formatCompactCurrency(adSpendData.summary.top_channel?.amount || 0)}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Chart Area & Platform Cards Layout */}
                                <div className="grid flex-1 grid-cols-1 gap-2.5 lg:min-h-0 lg:grid-cols-12">
                                    {/* Left Main Chart (8 cols) */}
                                    <div className="flex flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/88 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-4 lg:col-span-8 lg:min-h-0">
                                        {/* Chart Toolbar */}
                                        <div className="mb-2 flex shrink-0 items-center justify-between border-b border-slate-200/80 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-8 sm:w-8">
                                                    {activeTab === 'monthly' && <BarChart3 className="h-4 w-4" />}
                                                    {activeTab === 'channels' && <PieChart className="h-4 w-4" />}
                                                    {activeTab === 'platforms' && <Layers className="h-4 w-4" />}
                                                    {activeTab === 'table' && <TableIcon className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <h2 className="text-xs font-bold text-slate-900 sm:text-sm">
                                                        {activeTab === 'monthly' && 'Tren Pengeluaran Iklan Bulanan Group'}
                                                        {activeTab === 'channels' && 'Proporsi Alokasi Channel Iklan'}
                                                        {activeTab === 'platforms' && 'Perbandingan Biaya Iklan Antar Platform'}
                                                        {activeTab === 'table' && 'Matriks Data Biaya Iklan Bulanan'}
                                                    </h2>
                                                    <p className="text-[10px] text-slate-500 sm:text-[11px]">
                                                        {activeTab === 'monthly' && 'Visualisasi pengeluaran iklan bulan demi bulan sepanjang tahun berjalan'}
                                                        {activeTab === 'channels' && 'Distribusi biaya iklan antara Meta, TikTok, Google, dan Boost Post'}
                                                        {activeTab === 'platforms' && 'Perbandingan budget iklan bulan ini dan akumulasi setahun penuh'}
                                                        {activeTab === 'table' && 'Rincian angka nominal per bulan dan per platform'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Sub Controls */}
                                            {activeTab === 'monthly' && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center rounded-full border border-slate-300/80 bg-slate-100 p-0.5 text-xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => setChartType('bar')}
                                                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition ${
                                                                chartType === 'bar' ? 'bg-white text-primary shadow-xs' : 'text-slate-600'
                                                            }`}
                                                        >
                                                            Batang
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setChartType('line')}
                                                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold transition ${
                                                                chartType === 'line' ? 'bg-white text-primary shadow-xs' : 'text-slate-600'
                                                            }`}
                                                        >
                                                            Garis
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chart 1: Monthly Trend */}
                                        {activeTab === 'monthly' && (
                                            <div className="flex min-h-75 flex-1 flex-col sm:min-h-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {chartType === 'bar' ? (
                                                        <BarChart data={adSpendData.monthly_data} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                                                            <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                                            <XAxis dataKey="month_name" stroke="#64748b" fontSize={11} tickLine={false} />
                                                            <YAxis
                                                                stroke="#64748b"
                                                                fontSize={11}
                                                                tickLine={false}
                                                                tickFormatter={(v) => formatCompactCurrency(v)}
                                                            />
                                                            <Tooltip
                                                                content={({ active, payload }) => {
                                                                    if (!active || !payload?.length) return null;
                                                                    const item = payload[0]?.payload as MonthlyPoint;
                                                                    return (
                                                                        <div className="min-w-56 rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-900 shadow-xl backdrop-blur">
                                                                            <p className="border-b border-slate-100 pb-1 font-bold text-primary">
                                                                                Bulan {item.month_name} 2026
                                                                            </p>
                                                                            <div className="mt-2 space-y-1">
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium text-amber-600">Boost Post:</span>
                                                                                    <span className="font-semibold">{formatCurrency(item.boost_post)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium text-blue-600">Meta Ads:</span>
                                                                                    <span className="font-semibold">{formatCurrency(item.meta)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium text-purple-600">TikTok Ads:</span>
                                                                                    <span className="font-semibold">{formatCurrency(item.tiktok)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium text-emerald-600">Google Ads:</span>
                                                                                    <span className="font-semibold">{formatCurrency(item.google)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between border-t border-slate-100 pt-1 font-black text-slate-900">
                                                                                    <span>Total Iklan:</span>
                                                                                    <span>{formatCurrency(item.total)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }}
                                                            />
                                                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                                                            <Bar dataKey="boost_post" name="Boost Post" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                                            <Bar dataKey="meta" name="Meta Ads" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                                            <Bar dataKey="tiktok" name="TikTok Ads" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
                                                            <Bar dataKey="google" name="Google Ads" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    ) : (
                                                        <LineChart data={adSpendData.monthly_data} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                                                            <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                                            <XAxis dataKey="month_name" stroke="#64748b" fontSize={11} tickLine={false} />
                                                            <YAxis
                                                                stroke="#64748b"
                                                                fontSize={11}
                                                                tickLine={false}
                                                                tickFormatter={(v) => formatCompactCurrency(v)}
                                                            />
                                                            <Tooltip
                                                                content={({ active, payload }) => {
                                                                    if (!active || !payload?.length) return null;
                                                                    const item = payload[0]?.payload as MonthlyPoint;
                                                                    return (
                                                                        <div className="min-w-56 rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-900 shadow-xl backdrop-blur">
                                                                            <p className="border-b border-slate-100 pb-1 font-bold text-primary">
                                                                                Bulan {item.month_name} 2026
                                                                            </p>
                                                                            <div className="mt-2 space-y-1">
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium text-amber-600">Boost Post:</span>
                                                                                    <span className="font-semibold">{formatCurrency(item.boost_post)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium text-blue-600">Meta Ads:</span>
                                                                                    <span className="font-semibold">{formatCurrency(item.meta)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium text-purple-600">TikTok Ads:</span>
                                                                                    <span className="font-semibold">{formatCurrency(item.tiktok)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium text-emerald-600">Google Ads:</span>
                                                                                    <span className="font-semibold">{formatCurrency(item.google)}</span>
                                                                                </div>
                                                                                <div className="flex justify-between border-t border-slate-100 pt-1 font-black text-slate-900">
                                                                                    <span>Total Biaya Iklan:</span>
                                                                                    <span>
                                                                                        {item.is_current_or_past ? formatCurrency(item.total) : 'Belum Berjalan'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }}
                                                            />
                                                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="boost_post_val"
                                                                name="Boost Post"
                                                                stroke="#f59e0b"
                                                                strokeWidth={2.5}
                                                                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                                connectNulls={false}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="meta_val"
                                                                name="Meta Ads"
                                                                stroke="#3b82f6"
                                                                strokeWidth={2.5}
                                                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                                connectNulls={false}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="tiktok_val"
                                                                name="TikTok Ads"
                                                                stroke="#a855f7"
                                                                strokeWidth={2.5}
                                                                dot={{ r: 4, fill: '#a855f7', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                                connectNulls={false}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="google_val"
                                                                name="Google Ads"
                                                                stroke="#10b981"
                                                                strokeWidth={2.5}
                                                                dot={{ r: 4, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                                connectNulls={false}
                                                            />
                                                            <Line
                                                                type="monotone"
                                                                dataKey="total_val"
                                                                name="Total Biaya Iklan"
                                                                stroke="#0f172a"
                                                                strokeWidth={3.5}
                                                                dot={{ r: 5, fill: '#0f172a', strokeWidth: 2, stroke: '#ffffff' }}
                                                                connectNulls={false}
                                                            />
                                                        </LineChart>
                                                    )}
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Chart 2: Channel Breakdown */}
                                        {activeTab === 'channels' && (
                                            <div className="grid min-h-75 flex-1 grid-cols-1 items-center gap-4 sm:min-h-0 sm:grid-cols-2">
                                                <div className="h-full min-h-55">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RechartsPieChart>
                                                            <Pie
                                                                data={adSpendData.channels}
                                                                dataKey="amount"
                                                                nameKey="label"
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={55}
                                                                outerRadius={85}
                                                                paddingAngle={3}
                                                            >
                                                                {adSpendData.channels.map((entry) => (
                                                                    <Cell key={entry.key} fill={channelColors[entry.key] || '#64748b'} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip formatter={(val: number) => formatCurrency(val)} />
                                                        </RechartsPieChart>
                                                    </ResponsiveContainer>
                                                </div>

                                                <div className="space-y-2.5 pr-2">
                                                    {adSpendData.channels.map((ch) => (
                                                        <div key={ch.key} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className="h-3 w-3 rounded-full"
                                                                        style={{ backgroundColor: channelColors[ch.key] || '#64748b' }}
                                                                    />
                                                                    <span className="font-bold text-slate-800">{ch.label}</span>
                                                                </div>
                                                                <span className="font-black text-slate-900">{ch.percent}%</span>
                                                            </div>
                                                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                                                                <span>Total Pengeluaran:</span>
                                                                <span className="font-bold text-slate-700">{formatCurrency(ch.amount)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Chart 3: Platform Comparison */}
                                        {activeTab === 'platforms' && (
                                            <div className="flex min-h-75 flex-1 flex-col sm:min-h-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={adSpendData.platforms}
                                                        layout="vertical"
                                                        margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
                                                    >
                                                        <CartesianGrid horizontal={false} stroke="rgba(15,23,42,0.06)" />
                                                        <XAxis type="number" tickFormatter={(v) => formatCompactCurrency(v)} stroke="#64748b" fontSize={11} />
                                                        <YAxis type="category" dataKey="label" stroke="#64748b" fontSize={11} width={80} />
                                                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                                                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                                                        <Bar dataKey="this_month" name="Bulan Ini" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                                        <Bar dataKey="this_year" name="Tahun Ini (YTD)" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}

                                        {/* Tab 4: Table Matrix */}
                                        {activeTab === 'table' && (
                                            <div className="flex-1 overflow-auto rounded-xl border border-slate-200">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="sticky top-0 bg-slate-100 font-bold text-slate-700">
                                                        <tr>
                                                            <th className="p-2">Platform</th>
                                                            <th className="p-2 text-right">Bulan Ini</th>
                                                            <th className="p-2 text-right">Tahun Ini (YTD)</th>
                                                            <th className="p-2 text-right">Meta</th>
                                                            <th className="p-2 text-right">TikTok</th>
                                                            <th className="p-2 text-right">Google</th>
                                                            <th className="p-2 text-right">Boost Post</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {adSpendData.platforms.map((p) => (
                                                            <tr key={p.key} className="hover:bg-slate-50">
                                                                <td className="p-2 font-bold text-slate-900">{p.label}</td>
                                                                <td className="p-2 text-right font-semibold text-blue-600">
                                                                    {formatCurrency(p.this_month)}
                                                                </td>
                                                                <td className="p-2 text-right font-black text-primary">
                                                                    {formatCurrency(p.this_year)}
                                                                </td>
                                                                <td className="p-2 text-right text-slate-600">
                                                                    {formatCompactCurrency(p.channels.meta?.amount || 0)}
                                                                </td>
                                                                <td className="p-2 text-right text-slate-600">
                                                                    {formatCompactCurrency(p.channels.tiktok?.amount || 0)}
                                                                </td>
                                                                <td className="p-2 text-right text-slate-600">
                                                                    {formatCompactCurrency(p.channels.google?.amount || 0)}
                                                                </td>
                                                                <td className="p-2 text-right text-slate-600">
                                                                    {formatCompactCurrency(p.channels.boost_post?.amount || 0)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Platform Cards Grid (4 cols) */}
                                    <div className="flex flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/88 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-4 lg:col-span-4 lg:min-h-0">
                                        <div className="mb-2 flex shrink-0 items-center justify-between border-b border-slate-200/80 pb-2">
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-900 sm:text-sm">Rincian Per Platform</h3>
                                                <p className="text-[10px] text-slate-500">Klik kartu platform untuk grafik detail</p>
                                            </div>
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                {adSpendData.platforms.length} Platform
                                            </span>
                                        </div>

                                        {/* Scrollable Cards List */}
                                        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                                            {adSpendData.platforms.map((plat) => (
                                                <div
                                                    key={plat.key}
                                                    onClick={() => setSelectedPlatform(plat)}
                                                    className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white/90 p-2.5 transition-all hover:border-primary/50 hover:bg-white hover:shadow-md"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary">
                                                            {plat.label}
                                                        </h4>
                                                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                                                    </div>

                                                    <div className="mt-1.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-1.5 text-left">
                                                        <div>
                                                            <span className="text-[9px] font-medium text-slate-500">Bulan Ini</span>
                                                            <p className="text-xs font-black text-blue-600">
                                                                {formatCurrency(plat.this_month)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-medium text-slate-500">Tahun Ini</span>
                                                            <p className="text-xs font-black text-slate-900">
                                                                {formatCurrency(plat.this_year)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Mini channel progress bar */}
                                                    {plat.this_year > 0 && (
                                                        <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                            <div
                                                                style={{ width: `${plat.channels.meta?.percent || 0}%` }}
                                                                className="bg-blue-500"
                                                                title={`Meta: ${plat.channels.meta?.percent}%`}
                                                            />
                                                            <div
                                                                style={{ width: `${plat.channels.tiktok?.percent || 0}%` }}
                                                                className="bg-purple-500"
                                                                title={`TikTok: ${plat.channels.tiktok?.percent}%`}
                                                            />
                                                            <div
                                                                style={{ width: `${plat.channels.google?.percent || 0}%` }}
                                                                className="bg-emerald-500"
                                                                title={`Google: ${plat.channels.google?.percent}%`}
                                                            />
                                                            <div
                                                                style={{ width: `${plat.channels.boost_post?.percent || 0}%` }}
                                                                className="bg-amber-500"
                                                                title={`Boost Post: ${plat.channels.boost_post?.percent}%`}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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
                            ✨ LIVE MONITORING BIAYA IKLAN BIINSPIRA GROUP
                        </span>
                        <span className="text-sky-400">•</span>
                        <span>📢 Data Terintegrasi: Boost Post, Meta Ads, TikTok Ads & Google Ads</span>
                        <span className="text-sky-400">•</span>
                        <span>🎯 Efisiensi Budget & ROAS Lintas Platform</span>
                        <span className="text-sky-400">•</span>
                        <span>📊 Data Diperbarui Secara Real-Time</span>
                        <span className="text-sky-400">•</span>

                        <span>📅 {formattedFullDate}</span>
                        <span className="text-sky-400">•</span>
                        <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            ✨ LIVE MONITORING BIAYA IKLAN BIINSPIRA GROUP
                        </span>
                        <span className="text-sky-400">•</span>
                        <span>📢 Data Terintegrasi: Boost Post, Meta Ads, TikTok Ads & Google Ads</span>
                        <span className="text-sky-400">•</span>
                        <span>🎯 Efisiensi Budget & ROAS Lintas Platform</span>
                        <span className="text-sky-400">•</span>
                        <span>📊 Data Diperbarui Secara Real-Time</span>
                        <span className="text-sky-400">•</span>
                    </div>
                </div>

                {/* Platform Drilldown Dialog (Desain seragam dengan /stats + Toggle Batang & Garis) */}
                <Dialog open={!!selectedPlatform} onOpenChange={(open) => !open && setSelectedPlatform(null)}>
                    <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto overflow-x-hidden p-6 sm:max-w-4xl">
                        {selectedPlatform && (
                            <div className="space-y-4">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-bold">
                                        Rincian Biaya Iklan: {selectedPlatform.label}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-slate-500">
                                        Pengeluaran iklan tahun berjalan per bulan • Periode Januari - Desember 2026
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Platform Badge Container (Sesuai gaya /stats) */}
                                <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-700 shadow-xs">
                                        {getPlatformInitials(selectedPlatform.label)}
                                    </div>
                                    <div className="min-w-0 text-sm text-slate-700">
                                        <span className="font-bold text-slate-900">{selectedPlatform.label}</span>
                                        <span className="truncate text-slate-500"> • Periode Januari - Desember 2026</span>
                                    </div>
                                </div>

                                {/* Summary Pills & Toggle Batang/Garis */}
                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                                            Total Periode: <span className="font-bold text-slate-900">{formatCurrency(selectedPlatform.this_year)}</span>
                                        </div>
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700">
                                            Bulan Ini: <span className="font-bold text-blue-600">{formatCurrency(selectedPlatform.this_month)}</span>
                                        </div>
                                    </div>

                                    {/* Toggle Batang dan Garis */}
                                    <div className="flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5">
                                        <button
                                            type="button"
                                            onClick={() => setPlatformChartType('bar')}
                                            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                                                platformChartType === 'bar' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Batang
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPlatformChartType('line')}
                                            className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                                                platformChartType === 'line' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Garis
                                        </button>
                                    </div>
                                </div>

                                {/* Chart Container */}
                                <div className="w-full rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="h-68 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {platformChartType === 'bar' ? (
                                                <BarChart data={selectedPlatform.monthly} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                                                    <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (!active || !payload?.length) return null;
                                                            const item = payload[0]?.payload as any;
                                                            return (
                                                                <div className="min-w-52 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-900 shadow-xl backdrop-blur">
                                                                    <p className="border-b border-slate-100 pb-1 font-bold text-primary">
                                                                        {selectedPlatform.label} - Bulan {item.month} 2026
                                                                    </p>
                                                                    <div className="mt-2 space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium text-amber-600">Boost Post:</span>
                                                                            <span className="font-semibold">{formatCurrency(item.boost_post ?? 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium text-blue-600">Meta Ads:</span>
                                                                            <span className="font-semibold">{formatCurrency(item.meta ?? 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium text-purple-600">TikTok Ads:</span>
                                                                            <span className="font-semibold">{formatCurrency(item.tiktok ?? 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium text-emerald-600">Google Ads:</span>
                                                                            <span className="font-semibold">{formatCurrency(item.google ?? 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between border-t border-slate-100 pt-1 font-black text-slate-900">
                                                                            <span>Total Bulan Ini:</span>
                                                                            <span>{formatCurrency(item.amount ?? 0)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                                                    <Bar dataKey="boost_post" name="Boost Post" stackId="p" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                                                    <Bar dataKey="meta" name="Meta Ads" stackId="p" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                                    <Bar dataKey="tiktok" name="TikTok Ads" stackId="p" fill="#a855f7" radius={[0, 0, 0, 0]} />
                                                    <Bar dataKey="google" name="Google Ads" stackId="p" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            ) : (
                                                <LineChart data={selectedPlatform.monthly} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                                                    <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => formatCompactCurrency(v)} />
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (!active || !payload?.length) return null;
                                                            const item = payload[0]?.payload as any;
                                                            return (
                                                                <div className="min-w-52 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-900 shadow-xl backdrop-blur">
                                                                    <p className="border-b border-slate-100 pb-1 font-bold text-primary">
                                                                        {selectedPlatform.label} - Bulan {item.month} 2026
                                                                    </p>
                                                                    <div className="mt-2 space-y-1">
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium text-amber-600">Boost Post:</span>
                                                                            <span className="font-semibold">{formatCurrency(item.boost_post ?? 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium text-blue-600">Meta Ads:</span>
                                                                            <span className="font-semibold">{formatCurrency(item.meta ?? 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium text-purple-600">TikTok Ads:</span>
                                                                            <span className="font-semibold">{formatCurrency(item.tiktok ?? 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium text-emerald-600">Google Ads:</span>
                                                                            <span className="font-semibold">{formatCurrency(item.google ?? 0)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between border-t border-slate-100 pt-1 font-black text-slate-900">
                                                                            <span>Total Pengeluaran:</span>
                                                                            <span>
                                                                                {item.amount_val !== null ? formatCurrency(item.amount) : 'Belum Berjalan'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="boost_post_val"
                                                        name="Boost Post"
                                                        stroke="#f59e0b"
                                                        strokeWidth={2.5}
                                                        dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                        connectNulls={false}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="meta_val"
                                                        name="Meta Ads"
                                                        stroke="#3b82f6"
                                                        strokeWidth={2.5}
                                                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                        connectNulls={false}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="tiktok_val"
                                                        name="TikTok Ads"
                                                        stroke="#a855f7"
                                                        strokeWidth={2.5}
                                                        dot={{ r: 4, fill: '#a855f7', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                        connectNulls={false}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="google_val"
                                                        name="Google Ads"
                                                        stroke="#10b981"
                                                        strokeWidth={2.5}
                                                        dot={{ r: 4, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                        connectNulls={false}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="amount_val"
                                                        name="Total Platform"
                                                        stroke="#0f172a"
                                                        strokeWidth={3.5}
                                                        dot={{ r: 5, fill: '#0f172a', strokeWidth: 2, stroke: '#ffffff' }}
                                                        connectNulls={false}
                                                    />
                                                </LineChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Channel Distribution Pills for this platform */}
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-slate-700">Distribusi Channel Iklan Platform Ini:</p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {['boost_post', 'meta', 'tiktok', 'google'].map((chKey) => {
                                            const chData = selectedPlatform.channels[chKey] ?? {
                                                label:
                                                    chKey === 'boost_post'
                                                        ? 'Boost Post'
                                                        : chKey === 'meta'
                                                          ? 'Meta Ads'
                                                          : chKey === 'tiktok'
                                                            ? 'TikTok Ads'
                                                            : 'Google Ads',
                                                amount: 0,
                                                percent: 0,
                                            };
                                            const colorClasses =
                                                chKey === 'boost_post'
                                                    ? 'border-amber-200 bg-amber-50/60 text-amber-800'
                                                    : chKey === 'meta'
                                                      ? 'border-blue-200 bg-blue-50/60 text-blue-800'
                                                      : chKey === 'tiktok'
                                                        ? 'border-purple-200 bg-purple-50/60 text-purple-800'
                                                        : 'border-emerald-200 bg-emerald-50/60 text-emerald-800';

                                            return (
                                                <div key={chKey} className={`rounded-xl border p-2.5 ${colorClasses}`}>
                                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                                        <span>{chData.label}</span>
                                                        <span>{chData.percent}%</span>
                                                    </div>
                                                    <p className="mt-1 text-xs font-black text-slate-900">
                                                        {formatCurrency(chData.amount)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
