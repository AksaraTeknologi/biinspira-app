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
    CalendarIcon,
    GraduationCap,
    Layers,
    LineChart as LineChartIcon,
    Lock,
    Maximize2,
    Minimize2,
    Sparkles,
    Table as TableIcon,
    TrendingUp,
    Tv,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ComparisonData, PlatformComparisonItem, StatisticsOmsetProps } from './types';
import { formatCompactCurrency, formatCurrency, getTimeBasedMessage } from './utils';

function getPlatformInitials(label?: string) {
    if (!label) return 'NA';
    return label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

// Platform color mapping for distinct visual presentation
const PLATFORM_COLORS: Record<string, string> = {
    biinspira: 'var(--primary)',
    smartcounting: '#0284c7', // Sky
    smartcountingacademy: '#0d9488', // Teal
    kompeten: '#16a34a', // Green
    sekolahpajak: '#eab308', // Amber
    talenta: '#f97316', // Orange
    skillgrow: '#ec4899', // Pink
    aksademy: '#8b5cf6', // Purple
};

type ActiveTab = 'monthly' | 'monthly_line' | 'cumulative' | 'platform' | 'table';

export default function StatisticsOmset({ comparisonData, generatedAt }: StatisticsOmsetProps) {
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [activeTab, setActiveTab] = useState<ActiveTab>('monthly');
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Auto-reload data every 5 minutes (matching /statistics)
    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({
                only: ['comparisonData', 'generatedAt'],
            });
        }, 300000);

        return () => window.clearInterval(timer);
    }, []);

    // Live clock update
    useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    // Track fullscreen status
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    const formattedFullDate = useMemo(() => {
        return currentTime.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, [currentTime]);

    const cornerMessage = getTimeBasedMessage(currentTime);

    return (
        <>
            <Head title="Statistik Omset - Biinspira Group" />
            <div className="flex min-h-screen w-screen flex-col bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center lg:h-screen lg:overflow-hidden">
                {/* Main Light Glassmorphic Container matching /statistics */}
                <div className="flex flex-1 flex-col overflow-y-auto bg-slate-900/18 px-3 py-2.5 backdrop-blur-[1px] sm:px-6 sm:py-4 lg:px-8 lg:overflow-hidden">
                    {/* Header Bar */}
                    <div className="mb-2.5 flex shrink-0 flex-col gap-2 sm:mb-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] tracking-[0.2em] text-slate-100/90 uppercase sm:text-xs sm:tracking-[0.28em]">
                                    LIVE MONITORING BIINSPIRA GROUP
                                </p>
                                <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
                                    Perbandingan Omset 2025 vs 2026
                                </h1>
                            </div>
                            {/* Mobile Quick Action Link to Platform TV & Lock */}
                            <div className="flex items-center gap-1.5 sm:hidden">
                                <Link
                                    href="/stats"
                                    className="flex h-8 items-center gap-1 rounded-full border border-white/45 bg-white/20 px-2.5 text-[11px] font-medium text-white backdrop-blur-sm transition active:scale-95"
                                    title="Buka Statistik Platform"
                                >
                                    <Tv className="h-3.5 w-3.5 text-sky-200" />
                                    <span>Platform</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm transition active:scale-95"
                                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh TV'}
                                >
                                    {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.post(route('tv.stats.lock'))}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm transition active:scale-95 hover:bg-rose-500/30"
                                    title="Kunci Layar Statistik"
                                >
                                    <Lock className="h-3.5 w-3.5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Desktop Navigation Actions */}
                        <div className="hidden sm:flex sm:items-center sm:gap-1.5 xl:gap-2">
                            <Link
                                href="/stats"
                                className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/30"
                                title="Buka Statistik Platform TV"
                            >
                                <Tv className="h-3.5 w-3.5 text-sky-200" />
                                <span>Platform</span>
                            </Link>

                            <Link
                                href="/stats-iklan"
                                className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/30"
                                title="Buka Halaman Statistik Biaya Iklan"
                            >
                                <Banknote className="h-3.5 w-3.5 text-blue-200" />
                                <span>Biaya Iklan</span>
                            </Link>

                            <Link
                                href="/stats-brevet"
                                className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/30"
                                title="Buka Halaman Total Peserta Brevet"
                            >
                                <GraduationCap className="h-3.5 w-3.5 text-amber-200" />
                                <span>Peserta Brevet</span>
                            </Link>

                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/30"
                                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh TV'}
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.post(route('tv.stats.lock'))}
                                className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm transition hover:bg-rose-500/30 hover:border-rose-400/60"
                                title="Kunci Tampilan Statistik"
                            >
                                <Lock className="h-3.5 w-3.5 text-white" />
                                <span>Kunci</span>
                            </button>

                            <p className="flex h-9 items-center rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm">
                                Update: {new Date(generatedAt).toLocaleTimeString('id-ID')}
                            </p>
                        </div>
                    </div>

                    {/* Secondary Navigation Tabs matching stats-brevet */}
                    <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/45 bg-white/20 p-1.5 backdrop-blur-sm sm:gap-2">
                        {[
                            { id: 'monthly', label: 'Per Bulan', icon: CalendarIcon },
                            { id: 'cumulative', label: 'Tren Kumulatif', icon: TrendingUp },
                            { id: 'platform', label: 'Per Platform', icon: Layers },
                            { id: 'table', label: 'Tabel Rincian', icon: TableIcon },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive =
                                tab.id === 'monthly'
                                    ? activeTab === 'monthly' || activeTab === 'monthly_line'
                                    : activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                                    className={`flex h-8 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition sm:px-4 ${
                                        isActive
                                            ? 'bg-white text-primary shadow-md'
                                            : 'text-white hover:bg-white/25'
                                    }`}
                                >
                                    <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-white/80'}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Deferred Content */}
                    <Deferred
                        data="comparisonData"
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
                        <ComparisonView data={comparisonData!} activeTab={activeTab} setActiveTab={setActiveTab} />
                    </Deferred>
                </div>

                {/* Running Text Marquee Footer matching /statistics */}
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
                        <span>
                            {cornerMessage.emoji} {cornerMessage.title.toUpperCase()}: {cornerMessage.message}
                        </span>
                        <span className="text-sky-400">•</span>
                        <span>✨ LIVE MONITORING BIINSPIRA GROUP</span>
                        <span className="text-sky-400">•</span>
                        <span>📊 Data Omset 2025 vs 2026 Diperbarui Secara Real-Time</span>
                        <span className="text-sky-400">•</span>
                        <span>📅 {formattedFullDate}</span>
                        <span className="text-sky-400">•</span>
                        <span>
                            {cornerMessage.emoji} {cornerMessage.title.toUpperCase()}: {cornerMessage.message}
                        </span>
                        <span className="text-sky-400">•</span>
                        <span>✨ LIVE MONITORING BIINSPIRA GROUP</span>
                        <span className="text-sky-400">•</span>
                        <span>📊 Data Omset 2025 vs 2026 Diperbarui Secara Real-Time</span>
                        <span className="text-sky-400">•</span>
                    </div>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPARISON VIEW (LIGHT FROSTED GLASS THEME)
// ─────────────────────────────────────────────────────────────
function ComparisonView({
    data,
    activeTab,
    setActiveTab,
}: {
    data: ComparisonData;
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
}) {
    const summary = data.summary;
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformComparisonItem | null>(null);
    const [modalChartType, setModalChartType] = useState<'bar' | 'line'>('bar');

    const monthlyChartData = useMemo(() => {
        return data.monthly_comparison.map((item) => ({
            ...item,
            omset_2026_val: item.is_current_or_past ? item.omset_2026 : null,
        }));
    }, [data.monthly_comparison]);

    const platformMonthlyData = useMemo(() => {
        if (!selectedPlatform) return [];
        return data.monthly_comparison.map((m) => {
            const v2025 = m.platforms_2025?.[selectedPlatform.key] ?? 0;
            const v2026 = m.platforms_2026?.[selectedPlatform.key] ?? 0;
            const diff = v2026 - v2025;
            let growthPct = 0;
            let growthDir: 'up' | 'down' | 'flat' = 'flat';
            if (v2025 > 0) {
                growthPct = Number((((v2026 - v2025) / v2025) * 100).toFixed(1));
                growthDir = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
            } else if (v2026 > 0) {
                growthPct = 100;
                growthDir = 'up';
            }

            return {
                month_num: m.month,
                month: m.short_name,
                month_name: m.month_name,
                omset_2025: v2025,
                omset_2026: v2026,
                omset_2026_val: m.is_current_or_past ? v2026 : null,
                difference: diff,
                growth_percentage: Math.abs(growthPct),
                growth_direction: growthDir,
                is_current_or_past: m.is_current_or_past,
            };
        });
    }, [selectedPlatform, data.monthly_comparison]);

    return (
        <div className="flex flex-1 flex-col lg:min-h-0 lg:overflow-hidden">
            {/* Top 4 KPI Cards: Compact 2-column grid on mobile, 4-column on desktop */}
            <div className="mb-2.5 grid shrink-0 grid-cols-2 gap-2 sm:mb-3 sm:gap-2.5 lg:grid-cols-4">
                {/* Card 1: Total Omset 2026 */}
                <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3.5 sm:p-3 xl:p-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/80 text-white shadow-xs sm:h-11 sm:w-11 sm:rounded-xl xl:h-12 xl:w-12">
                        <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                Omset 2026
                            </p>
                            <span
                                className={`py-0.2 inline-flex items-center gap-0.5 rounded-full px-1.5 text-[9px] font-bold sm:px-2 sm:text-[10px] ${
                                    summary.growth_direction === 'up'
                                        ? 'border border-emerald-400/80 bg-emerald-100 text-emerald-800'
                                        : 'border border-rose-400/80 bg-rose-100 text-rose-800'
                                }`}
                            >
                                {summary.growth_direction === 'up' ? '↑ +' : '↓ -'}
                                {summary.growth_percentage}%
                            </span>
                        </div>
                        <p
                            className="mt-0.5 truncate text-xs leading-tight font-black text-slate-900 sm:text-lg xl:text-xl 2xl:text-2xl"
                            title={formatCurrency(summary.total_2026)}
                        >
                            {formatCurrency(summary.total_2026)}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                            Avg: <span className="font-semibold text-slate-700">{formatCompactCurrency(summary.monthly_avg_2026)}</span>/bln
                        </p>
                    </div>
                </div>

                {/* Card 2: Total Omset 2025 */}
                <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3.5 sm:p-3 xl:p-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-slate-500 to-slate-700 text-white shadow-xs sm:h-11 sm:w-11 sm:rounded-xl xl:h-12 xl:w-12">
                        <CalendarIcon className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">Omset 2025</p>
                            <span className="py-0.2 rounded-full border border-slate-300 bg-slate-100 px-1.5 text-[9px] font-bold text-slate-700 sm:px-2 sm:text-[10px]">
                                Full
                            </span>
                        </div>
                        <p
                            className="mt-0.5 truncate text-xs leading-tight font-black text-slate-900 sm:text-lg xl:text-xl 2xl:text-2xl"
                            title={formatCurrency(summary.total_2025)}
                        >
                            {formatCurrency(summary.total_2025)}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                            Avg: <span className="font-semibold text-slate-700">{formatCompactCurrency(summary.monthly_avg_2025)}</span>/bln
                        </p>
                    </div>
                </div>

                {/* Card 3: Selisih Omset (Pertumbuhan 2026 vs 2025) */}
                <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3.5 sm:p-3 xl:p-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-indigo-600 text-white shadow-xs sm:h-11 sm:w-11 sm:rounded-xl xl:h-12 xl:w-12">
                        <ArrowUpRight className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">
                                Selisih Omset
                            </p>
                            <span
                                className={`py-0.2 inline-flex items-center gap-0.5 rounded-full px-1.5 text-[9px] font-bold sm:px-2 sm:text-[10px] ${
                                    summary.difference >= 0
                                        ? 'border border-emerald-400/80 bg-emerald-100 text-emerald-800'
                                        : 'border border-rose-400/80 bg-rose-100 text-rose-800'
                                }`}
                            >
                                {summary.difference >= 0 ? 'Surplus' : 'Defisit'}
                            </span>
                        </div>
                        <p
                            className={`mt-0.5 truncate text-xs leading-tight font-black sm:text-lg xl:text-xl 2xl:text-2xl ${
                                summary.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                            title={formatCurrency(summary.difference)}
                        >
                            {summary.difference >= 0 ? '+' : ''}{formatCurrency(summary.difference)}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">
                            YoY: <span className="font-semibold text-slate-700">{summary.difference >= 0 ? '+' : ''}{summary.growth_percentage}%</span> • vs 2025 Full
                        </p>
                    </div>
                </div>

                {/* Card 4: Bulan Tertinggi */}
                <div className="flex items-center gap-2 rounded-2xl border border-white/55 bg-white/88 p-2 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur sm:gap-3.5 sm:p-3 xl:p-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-xs sm:h-11 sm:w-11 sm:rounded-xl xl:h-12 xl:w-12">
                        <Sparkles className="h-4 w-4 sm:h-6 sm:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[9px] font-bold tracking-wider text-slate-500 uppercase sm:text-[10px] xl:text-xs">Bulan Tertinggi</p>
                            <span className="py-0.2 rounded-full border border-emerald-300 bg-emerald-50 px-1.5 text-[9px] font-bold text-emerald-800 sm:px-2 sm:text-[10px]">
                                Peak
                            </span>
                        </div>
                        <div className="mt-0.5 flex items-baseline justify-between gap-1 sm:mt-1">
                            <div>
                                <span className="text-[9px] font-bold text-slate-500 sm:text-[10px]">26: </span>
                                <span className="text-xs font-black text-primary sm:text-sm">{summary.best_month_2026.month.slice(0, 3)}</span>
                                <p className="text-[10px] font-black text-primary sm:text-xs">{formatCompactCurrency(summary.best_month_2026.value)}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-bold text-slate-500 sm:text-[10px]">25: </span>
                                <span className="text-xs font-bold text-slate-700 sm:text-sm">{summary.best_month_2025.month.slice(0, 3)}</span>
                                <p className="text-[10px] font-bold text-slate-700 sm:text-xs">{formatCompactCurrency(summary.best_month_2025.value)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chart Container in White Glassmorphism matching Dialog/Cards */}
            <div className="flex min-h-110 flex-1 flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/88 p-3 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:p-3.5 xl:p-4 lg:min-h-0">
                {/* Toolbar inside card */}
                <div className="mb-2 flex shrink-0 flex-col gap-2 border-b border-slate-200/80 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-8 sm:w-8">
                            {activeTab === 'monthly' && <BarChart3 className="h-4 w-4" />}
                            {activeTab === 'monthly_line' && <LineChartIcon className="h-4 w-4" />}
                            {activeTab === 'cumulative' && <LineChartIcon className="h-4 w-4" />}
                            {activeTab === 'platform' && <Layers className="h-4 w-4" />}
                            {activeTab === 'table' && <TableIcon className="h-4 w-4" />}
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-slate-900 sm:text-sm xl:text-base">
                                {activeTab === 'monthly' && 'Grafik Perbandingan Omset Bulanan'}
                                {activeTab === 'monthly_line' && 'Grafik Garis Perbandingan Omset Bulanan'}
                                {activeTab === 'cumulative' && 'Kurva Pertumbuhan Akumulatif (YTD)'}
                                {activeTab === 'platform' && 'Rincian Performa Tiap Platform'}
                                {activeTab === 'table' && 'Matriks Data Omset Bulanan 2025 vs 2026'}
                            </h2>
                            <p className="text-[10px] text-slate-500 sm:text-[11px]">
                                {activeTab === 'monthly' && 'Perbandingan omset aktual bulan demi bulan antara 2025 dan 2026 (Diagram Batang)'}
                                {activeTab === 'monthly_line' && 'Tren kurva omset aktual bulan demi bulan antara 2025 dan 2026 (Grafik Garis)'}
                                {activeTab === 'cumulative' && 'Progres akumulasi pendapatan group sepanjang tahun berjalan'}
                                {activeTab === 'platform' && 'Kontribusi omset platform Biinspira Group • Klik kartu untuk lihat grafik rincian'}
                                {activeTab === 'table' && 'Rincian angka nominal, selisih dan persentase pertumbuhan'}
                            </p>
                        </div>
                    </div>

                    {/* Chart Controls & Legend */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {/* Tab Switcher Batang vs Garis untuk Perbandingan Bulanan */}
                        {(activeTab === 'monthly' || activeTab === 'monthly_line') && (
                            <div className="flex items-center rounded-full border border-slate-300/80 bg-slate-100 p-0.5 text-xs shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('monthly')}
                                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition sm:px-3 ${
                                        activeTab === 'monthly'
                                            ? 'bg-white text-primary shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="Tampilkan Diagram Batang"
                                >
                                    <BarChart3 className="h-3.5 w-3.5" />
                                    <span>Batang</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('monthly_line')}
                                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition sm:px-3 ${
                                        activeTab === 'monthly_line'
                                            ? 'bg-white text-primary shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="Tampilkan Grafik Garis"
                                >
                                    <LineChartIcon className="h-3.5 w-3.5" />
                                    <span>Garis</span>
                                </button>
                            </div>
                        )}

                        {/* Chart Legend Badges */}
                        <div className="flex items-center self-start sm:self-auto gap-3 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] shadow-2xs sm:px-3 sm:text-xs">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-sm bg-slate-400 sm:h-3 sm:w-3" />
                                <span className="font-semibold text-slate-600">2025</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-sm bg-primary sm:h-3 sm:w-3" />
                                <span className="font-bold text-primary">2026</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab 1: Monthly Comparison Bar Chart */}
                {activeTab === 'monthly' && (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="h-85 min-h-75 w-full sm:h-full sm:min-h-0 sm:flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.monthly_comparison} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                                    <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="short_name"
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
                                        tickFormatter={(val) => formatCompactCurrency(val)}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(15,23,42,0.04)' }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload || !payload.length) return null;
                                            const item = payload[0]?.payload;
                                            if (!item) return null;

                                            return (
                                                <div className="min-w-64 rounded-2xl border border-slate-200 bg-white/95 p-3.5 text-xs text-slate-900 shadow-2xl backdrop-blur-xl">
                                                    <p className="border-b border-slate-100 pb-1.5 text-sm font-extrabold text-primary">
                                                        Bulan {item.month_name}
                                                    </p>
                                                    <div className="mt-2 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-slate-500">Omset 2025:</span>
                                                            <span className="font-semibold text-slate-800">{formatCurrency(item.omset_2025)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-primary">Omset 2026:</span>
                                                            <span className="font-black text-primary">{formatCurrency(item.omset_2026)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                                                            <span className="font-medium text-slate-500">Selisih:</span>
                                                            <span
                                                                className={`font-bold ${item.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                                                            >
                                                                {item.difference >= 0 ? '+' : ''}
                                                                {formatCurrency(item.difference)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-slate-500">Pertumbuhan YoY:</span>
                                                            <span
                                                                className={`inline-flex items-center font-black ${
                                                                    item.growth_direction === 'up'
                                                                        ? 'text-emerald-600'
                                                                        : item.growth_direction === 'down'
                                                                          ? 'text-rose-600'
                                                                          : 'text-slate-500'
                                                                }`}
                                                            >
                                                                {item.growth_direction === 'up' && <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />}
                                                                {item.growth_direction === 'down' && (
                                                                    <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
                                                                )}
                                                                {item.growth_direction === 'up' ? '+' : ''}
                                                                {item.growth_percentage}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Bar dataKey="omset_2025" name="2025" fill="#94a3b8" radius={[6, 6, 0, 0]} maxBarSize={42} />
                                    <Bar dataKey="omset_2026" name="2026" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={42} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Tab 1B: Monthly Comparison Line Chart */}
                {activeTab === 'monthly_line' && (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="h-85 min-h-75 w-full sm:h-full sm:min-h-0 sm:flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyChartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="short_name"
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
                                        tickFormatter={(val) => formatCompactCurrency(val)}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: 'rgba(15,23,42,0.12)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                                        content={({ active, payload }) => {
                                            if (!active || !payload || !payload.length) return null;
                                            const item = payload[0]?.payload;
                                            if (!item) return null;

                                            return (
                                                <div className="min-w-64 rounded-2xl border border-slate-200 bg-white/95 p-3.5 text-xs text-slate-900 shadow-2xl backdrop-blur-xl">
                                                    <p className="border-b border-slate-100 pb-1.5 text-sm font-extrabold text-primary">
                                                        Bulan {item.month_name}
                                                    </p>
                                                    <div className="mt-2 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-medium text-slate-500">Omset 2025:</span>
                                                            <span className="font-semibold text-slate-800">{formatCurrency(item.omset_2025)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-primary">Omset 2026:</span>
                                                            <span className="font-black text-primary">
                                                                {item.is_current_or_past ? formatCurrency(item.omset_2026) : 'Belum Berjalan'}
                                                            </span>
                                                        </div>
                                                        {item.is_current_or_past && (
                                                            <>
                                                                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                                                                    <span className="font-medium text-slate-500">Selisih:</span>
                                                                    <span
                                                                        className={`font-bold ${item.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                                                                    >
                                                                        {item.difference >= 0 ? '+' : ''}
                                                                        {formatCurrency(item.difference)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-medium text-slate-500">Pertumbuhan YoY:</span>
                                                                    <span
                                                                        className={`inline-flex items-center font-black ${
                                                                            item.growth_direction === 'up'
                                                                                ? 'text-emerald-600'
                                                                                : item.growth_direction === 'down'
                                                                                  ? 'text-rose-600'
                                                                                  : 'text-slate-500'
                                                                        }`}
                                                                    >
                                                                        {item.growth_direction === 'up' && <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />}
                                                                        {item.growth_direction === 'down' && (
                                                                            <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
                                                                        )}
                                                                        {item.growth_direction === 'up' ? '+' : ''}
                                                                        {item.growth_percentage}%
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="omset_2025"
                                        name="2025"
                                        stroke="#94a3b8"
                                        strokeWidth={3}
                                        dot={{ r: 5, fill: '#94a3b8', strokeWidth: 2, stroke: '#ffffff' }}
                                        activeDot={{ r: 7, fill: '#64748b', strokeWidth: 2.5, stroke: '#ffffff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="omset_2026_val"
                                        name="2026"
                                        stroke="var(--primary)"
                                        strokeWidth={3.5}
                                        dot={{ r: 5, fill: 'var(--primary)', strokeWidth: 2, stroke: '#ffffff' }}
                                        activeDot={{ r: 8, fill: 'var(--primary)', strokeWidth: 2.5, stroke: '#ffffff' }}
                                        connectNulls={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Tab 2: Cumulative Area / Line Chart */}
                {activeTab === 'cumulative' && (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="h-85 min-h-75 w-full sm:h-full sm:min-h-0 sm:flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.monthly_comparison} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="grad2026" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                                        </linearGradient>
                                        <linearGradient id="grad2025" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="short_name"
                                        stroke="#64748b"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={{ stroke: 'rgba(15,23,42,0.12)' }}
                                        tickFormatter={(val) => formatCompactCurrency(val)}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (!active || !payload || !payload.length) return null;
                                            const item = payload[0]?.payload;
                                            if (!item) return null;

                                            return (
                                                <div className="min-w-64 rounded-2xl border border-slate-200 bg-white/95 p-3.5 text-xs text-slate-900 shadow-2xl backdrop-blur-xl">
                                                    <p className="border-b border-slate-100 pb-1.5 text-sm font-extrabold text-primary">
                                                        Akumulasi s.d {item.month_name}
                                                    </p>
                                                    <div className="mt-2 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-slate-500">Akumulasi 2025:</span>
                                                            <span className="font-semibold text-slate-800">
                                                                {formatCurrency(item.cumulative_2025)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-primary">Akumulasi 2026:</span>
                                                            <span className="font-black text-primary">{formatCurrency(item.cumulative_2026)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                                                            <span className="text-slate-500">Selisih Akumulatif:</span>
                                                            <span
                                                                className={`font-bold ${item.cumulative_2026 >= item.cumulative_2025 ? 'text-emerald-600' : 'text-rose-600'}`}
                                                            >
                                                                {item.cumulative_2026 >= item.cumulative_2025 ? '+' : ''}
                                                                {formatCurrency(item.cumulative_2026 - item.cumulative_2025)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cumulative_2025"
                                        name="Akumulasi 2025"
                                        stroke="#94a3b8"
                                        strokeWidth={2.5}
                                        fill="url(#grad2025)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="cumulative_2026"
                                        name="Akumulasi 2026"
                                        stroke="var(--primary)"
                                        strokeWidth={3.5}
                                        fill="url(#grad2026)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Tab 3: Per Platform Comparison */}
                {activeTab === 'platform' && (
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
                        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                            {data.platform_comparison.map((platform) => {
                                return (
                                    <div
                                        key={platform.key}
                                        onClick={() => setSelectedPlatform(platform)}
                                        className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:scale-[1.01] hover:border-primary/60 hover:shadow-md"
                                        title={`Klik untuk melihat grafik perbandingan ${platform.label}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <h2 className="truncate text-base font-bold text-slate-800 transition group-hover:text-primary" title={platform.label}>
                                                {platform.label}
                                            </h2>
                                            <div className="flex min-h-7 shrink-0 items-center justify-end">
                                                {platform.logo ? (
                                                    <img
                                                        src={platform.logo}
                                                        alt={platform.label}
                                                        className="max-h-7 w-auto max-w-24 object-contain"
                                                    />
                                                ) : (
                                                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white shadow-2xs">
                                                        <span className="text-[10px] font-bold text-slate-600">
                                                            {platform.label.slice(0, 2).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-2.5 space-y-1.5 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] text-slate-500">2026:</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black text-primary">{formatCurrency(platform.total_2026)}</span>
                                                    <span
                                                        className={`py-0.2 inline-flex items-center gap-0.5 rounded-full px-1.5 text-[10px] font-bold ${
                                                            platform.growth_direction === 'up'
                                                                ? 'border border-emerald-300 bg-emerald-100 text-emerald-800'
                                                                : platform.growth_direction === 'down'
                                                                  ? 'border border-rose-300 bg-rose-100 text-rose-800'
                                                                  : 'border border-slate-200 bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {platform.growth_direction === 'up' && <ArrowUpRight className="h-3 w-3" />}
                                                        {platform.growth_direction === 'down' && <ArrowDownRight className="h-3 w-3" />}
                                                        {platform.growth_direction === 'up' ? '+' : platform.growth_direction === 'down' ? '-' : ''}
                                                        {platform.growth_percentage}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] text-slate-500">2025:</span>
                                                <span className="font-medium text-slate-700">{formatCurrency(platform.total_2025)}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-1">
                                                <span className="text-[11px] text-slate-500">Selisih:</span>
                                                <span className={`font-bold ${platform.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {platform.difference >= 0 ? '+' : ''}
                                                    {formatCurrency(platform.difference)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-[10px] text-slate-400 transition-colors group-hover:text-primary">
                                                <span className="font-medium">Lihat grafik rincian</span>
                                                <span className="font-bold">→</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab 4: Tabular Details Matrix */}
                {activeTab === 'table' && (
                    <div className="flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-auto">
                        <table className="min-w-135 sm:min-w-full text-left text-xs">
                            <thead className="sticky top-0 border-b border-slate-200 bg-slate-100 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                                <tr>
                                    <th className="px-3 py-2.5">Bulan</th>
                                    <th className="px-3 py-2.5 text-right">Omset 2025</th>
                                    <th className="px-3 py-2.5 text-right">Omset 2026</th>
                                    <th className="px-3 py-2.5 text-right">Selisih (Rp)</th>
                                    <th className="px-3 py-2.5 text-right">Pertumbuhan (%)</th>
                                    <th className="px-3 py-2.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                                {data.monthly_comparison.map((row) => (
                                    <tr key={row.month} className="transition hover:bg-primary/5">
                                        <td className="px-3 py-2 font-bold text-slate-900">{row.month_name}</td>
                                        <td className="px-3 py-2 text-right text-slate-600">{formatCurrency(row.omset_2025)}</td>
                                        <td className="px-3 py-2 text-right font-black text-primary">{formatCurrency(row.omset_2026)}</td>
                                        <td className="px-3 py-2 text-right font-semibold">
                                            <span className={row.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                {row.difference >= 0 ? '+' : ''}
                                                {formatCurrency(row.difference)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <span
                                                className={`inline-flex items-center font-bold ${
                                                    row.growth_direction === 'up'
                                                        ? 'text-emerald-600'
                                                        : row.growth_direction === 'down'
                                                          ? 'text-rose-600'
                                                          : 'text-slate-500'
                                                }`}
                                            >
                                                {row.growth_direction === 'up' ? '+' : row.growth_direction === 'down' ? '-' : ''}
                                                {row.growth_percentage}%
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {row.is_current_or_past ? (
                                                <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                    Berjalan/Tercatat
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                                    Akan Datang
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="sticky bottom-0 border-t-2 border-slate-300 bg-slate-100 font-black text-slate-900">
                                <tr>
                                    <td className="px-3 py-2.5 uppercase">Total Akumulasi</td>
                                    <td className="px-3 py-2.5 text-right text-slate-700">{formatCurrency(summary.total_2025)}</td>
                                    <td className="px-3 py-2.5 text-right font-black text-primary">{formatCurrency(summary.total_2026)}</td>
                                    <td className="px-3 py-2.5 text-right">
                                        <span className={summary.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                            {summary.difference >= 0 ? '+' : ''}
                                            {formatCurrency(summary.difference)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-emerald-600">+{summary.growth_percentage}%</td>
                                    <td className="px-3 py-2.5 text-center text-xs text-slate-500">YoY Full</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Platform Drilldown Dialog (Perbandingan Omset 2025 vs 2026: Batang & Garis) */}
            <Dialog open={!!selectedPlatform} onOpenChange={(open) => !open && setSelectedPlatform(null)}>
                <DialogContent className="max-h-[92vh] w-[95vw] overflow-y-auto overflow-x-hidden p-5 sm:max-w-4xl sm:p-6">
                    {selectedPlatform && (
                        <div className="space-y-4">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-bold text-slate-900">
                                    Perbandingan Omset: {selectedPlatform.label}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    Perbandingan tren omset bulanan 2025 vs 2026 • Periode Januari - Desember
                                </DialogDescription>
                            </DialogHeader>

                            {/* Platform Badge & Info */}
                            <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
                                        {selectedPlatform.logo ? (
                                            <img
                                                src={selectedPlatform.logo}
                                                alt={selectedPlatform.label}
                                                className="max-h-8 w-auto max-w-16 object-contain"
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-slate-700">
                                                {getPlatformInitials(selectedPlatform.label)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 sm:text-base">{selectedPlatform.label}</h3>
                                            <span
                                                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    selectedPlatform.growth_direction === 'up'
                                                        ? 'border border-emerald-300 bg-emerald-100 text-emerald-800'
                                                        : selectedPlatform.growth_direction === 'down'
                                                          ? 'border border-rose-300 bg-rose-100 text-rose-800'
                                                          : 'border border-slate-200 bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {selectedPlatform.growth_direction === 'up' && <ArrowUpRight className="h-3 w-3" />}
                                                {selectedPlatform.growth_direction === 'down' && <ArrowDownRight className="h-3 w-3" />}
                                                {selectedPlatform.growth_direction === 'up' ? '+' : selectedPlatform.growth_direction === 'down' ? '-' : ''}
                                                {selectedPlatform.growth_percentage}% YoY
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Kontribusi: <span className="font-semibold text-slate-700">{selectedPlatform.share_2026}%</span> dari total omset group 2026
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 4 Summary Mini Cards */}
                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Omset 2026</p>
                                    <p className="mt-1 truncate text-xs font-black text-primary sm:text-sm" title={formatCurrency(selectedPlatform.total_2026)}>
                                        {formatCurrency(selectedPlatform.total_2026)}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-500">Tahun berjalan</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Omset 2025 (Full)</p>
                                    <p className="mt-1 truncate text-xs font-bold text-slate-700 sm:text-sm" title={formatCurrency(selectedPlatform.total_2025)}>
                                        {formatCurrency(selectedPlatform.total_2025)}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-500">12 Bulan penuh</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Selisih Nominal</p>
                                    <p className={`mt-1 truncate text-xs font-black sm:text-sm ${selectedPlatform.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} title={formatCurrency(selectedPlatform.difference)}>
                                        {selectedPlatform.difference >= 0 ? '+' : ''}{formatCurrency(selectedPlatform.difference)}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-500">2026 vs 2025</p>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Pertumbuhan</p>
                                    <p className={`mt-1 truncate text-xs font-black sm:text-sm ${selectedPlatform.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {selectedPlatform.difference >= 0 ? '↑ +' : '↓ -'}{selectedPlatform.growth_percentage}%
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-slate-500">YoY Growth</p>
                                </div>
                            </div>

                            {/* Toolbar: Legends & Toggle Batang/Garis */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded-xs bg-slate-400"></span>
                                        <span className="font-semibold text-slate-600">Omset 2025</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded-xs bg-primary"></span>
                                        <span className="font-bold text-primary">Omset 2026</span>
                                    </div>
                                </div>

                                {/* Toggle Batang dan Garis */}
                                <div className="flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setModalChartType('bar')}
                                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                                            modalChartType === 'bar' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <BarChart3 className="h-3.5 w-3.5" />
                                        <span>Batang</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModalChartType('line')}
                                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                                            modalChartType === 'line' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        <LineChartIcon className="h-3.5 w-3.5" />
                                        <span>Garis</span>
                                    </button>
                                </div>
                            </div>

                            {/* Chart Container */}
                            <div className="w-full rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {modalChartType === 'bar' ? (
                                            <BarChart data={platformMonthlyData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                                                <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                                                <YAxis
                                                    stroke="#64748b"
                                                    fontSize={11}
                                                    tickLine={false}
                                                    tickFormatter={(v) => formatCompactCurrency(v)}
                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (!active || !payload?.length) return null;
                                                        const item = payload[0]?.payload as any;
                                                        if (!item) return null;
                                                        return (
                                                            <div className="min-w-56 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-900 shadow-xl backdrop-blur">
                                                                <p className="border-b border-slate-100 pb-1 font-bold text-slate-900">
                                                                    {item.month_name} • {selectedPlatform.label}
                                                                </p>
                                                                <div className="mt-2 space-y-1.5">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <span className="font-medium text-slate-500">Omset 2026:</span>
                                                                        <span className="font-black text-primary">
                                                                            {item.is_current_or_past
                                                                                ? formatCurrency(item.omset_2026)
                                                                                : 'Akan Datang'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <span className="font-medium text-slate-500">Omset 2025:</span>
                                                                        <span className="font-semibold text-slate-700">
                                                                            {formatCurrency(item.omset_2025)}
                                                                        </span>
                                                                    </div>
                                                                    {item.is_current_or_past && (
                                                                        <>
                                                                            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1">
                                                                                <span className="font-medium text-slate-500">Selisih:</span>
                                                                                <span
                                                                                    className={`font-bold ${
                                                                                        item.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                                                    }`}
                                                                                >
                                                                                    {item.difference >= 0 ? '+' : ''}
                                                                                    {formatCurrency(item.difference)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="font-medium text-slate-500">Pertumbuhan:</span>
                                                                                <span
                                                                                    className={`font-bold ${
                                                                                        item.growth_direction === 'up'
                                                                                            ? 'text-emerald-600'
                                                                                            : item.growth_direction === 'down'
                                                                                              ? 'text-rose-600'
                                                                                              : 'text-slate-500'
                                                                                    }`}
                                                                                >
                                                                                    {item.growth_direction === 'up' ? '+' : item.growth_direction === 'down' ? '-' : ''}
                                                                                    {item.growth_percentage}%
                                                                                </span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }}
                                                />
                                                <Bar dataKey="omset_2025" name="Omset 2025" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                                <Bar
                                                    dataKey="omset_2026"
                                                    name="Omset 2026"
                                                    fill="var(--primary)"
                                                    radius={[4, 4, 0, 0]}
                                                />
                                            </BarChart>
                                        ) : (
                                            <LineChart data={platformMonthlyData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                                                <CartesianGrid vertical={false} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                                                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                                                <YAxis
                                                    stroke="#64748b"
                                                    fontSize={11}
                                                    tickLine={false}
                                                    tickFormatter={(v) => formatCompactCurrency(v)}
                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (!active || !payload?.length) return null;
                                                        const item = payload[0]?.payload as any;
                                                        if (!item) return null;
                                                        return (
                                                            <div className="min-w-56 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-900 shadow-xl backdrop-blur">
                                                                <p className="border-b border-slate-100 pb-1 font-bold text-slate-900">
                                                                    {item.month_name} • {selectedPlatform.label}
                                                                </p>
                                                                <div className="mt-2 space-y-1.5">
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <span className="font-medium text-slate-500">Omset 2026:</span>
                                                                        <span className="font-black text-primary">
                                                                            {item.is_current_or_past
                                                                                ? formatCurrency(item.omset_2026)
                                                                                : 'Akan Datang'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-4">
                                                                        <span className="font-medium text-slate-500">Omset 2025:</span>
                                                                        <span className="font-semibold text-slate-700">
                                                                            {formatCurrency(item.omset_2025)}
                                                                        </span>
                                                                    </div>
                                                                    {item.is_current_or_past && (
                                                                        <>
                                                                            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1">
                                                                                <span className="font-medium text-slate-500">Selisih:</span>
                                                                                <span
                                                                                    className={`font-bold ${
                                                                                        item.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                                                                    }`}
                                                                                >
                                                                                    {item.difference >= 0 ? '+' : ''}
                                                                                    {formatCurrency(item.difference)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <span className="font-medium text-slate-500">Pertumbuhan:</span>
                                                                                <span
                                                                                    className={`font-bold ${
                                                                                        item.growth_direction === 'up'
                                                                                            ? 'text-emerald-600'
                                                                                            : item.growth_direction === 'down'
                                                                                              ? 'text-rose-600'
                                                                                              : 'text-slate-500'
                                                                                    }`}
                                                                                >
                                                                                    {item.growth_direction === 'up' ? '+' : item.growth_direction === 'down' ? '-' : ''}
                                                                                    {item.growth_percentage}%
                                                                                </span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="omset_2025"
                                                    name="Omset 2025"
                                                    stroke="#94a3b8"
                                                    strokeWidth={2.5}
                                                    dot={{ r: 4, fill: '#94a3b8', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                    activeDot={{ r: 6, fill: '#64748b', strokeWidth: 2, stroke: '#ffffff' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="omset_2026_val"
                                                    name="Omset 2026"
                                                    stroke="var(--primary)"
                                                    strokeWidth={3}
                                                    dot={{ r: 4.5, fill: 'var(--primary)', strokeWidth: 1.5, stroke: '#ffffff' }}
                                                    activeDot={{ r: 7, fill: 'var(--primary)', strokeWidth: 2, stroke: '#ffffff' }}
                                                    connectNulls={false}
                                                />
                                            </LineChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Monthly Details Table Matrix */}
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                                            <tr>
                                                <th className="px-3 py-2">Bulan</th>
                                                <th className="px-3 py-2 text-right">Omset 2025</th>
                                                <th className="px-3 py-2 text-right">Omset 2026</th>
                                                <th className="px-3 py-2 text-right">Selisih</th>
                                                <th className="px-3 py-2 text-right">YoY</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {platformMonthlyData.map((row) => (
                                                <tr key={row.month_num} className="hover:bg-slate-50/80">
                                                    <td className="px-3 py-1.5 font-medium text-slate-800">
                                                        {row.month_name}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right text-slate-600">
                                                        {formatCurrency(row.omset_2025)}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right font-bold text-primary">
                                                        {row.is_current_or_past ? formatCurrency(row.omset_2026) : '-'}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right">
                                                        {row.is_current_or_past ? (
                                                            <span className={`font-semibold ${row.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                {row.difference >= 0 ? '+' : ''}{formatCurrency(row.difference)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right">
                                                        {row.is_current_or_past ? (
                                                            <span
                                                                className={`inline-flex items-center font-bold ${
                                                                    row.growth_direction === 'up'
                                                                        ? 'text-emerald-600'
                                                                        : row.growth_direction === 'down'
                                                                          ? 'text-rose-600'
                                                                          : 'text-slate-500'
                                                                }`}
                                                            >
                                                                {row.growth_direction === 'up' ? '+' : row.growth_direction === 'down' ? '-' : ''}
                                                                {row.growth_percentage}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400">Akan datang</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
