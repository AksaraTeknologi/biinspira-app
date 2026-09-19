import { Skeleton } from '@/components/ui/skeleton';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CalendarIcon,
    Layers,
    LineChart as LineChartIcon,
    Maximize2,
    Minimize2,
    Sparkles,
    Table as TableIcon,
    TrendingUp,
    Tv,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ComparisonData, StatisticsOmsetProps } from './types';
import { formatCompactCurrency, formatCurrency, getTimeBasedMessage } from './utils';

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

export default function StatisticsOmset({ comparisonData, generatedAt }: StatisticsOmsetProps) {
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [activeTab, setActiveTab] = useState<'monthly' | 'cumulative' | 'platform' | 'table'>('monthly');
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
            <div className="flex h-screen w-screen flex-col overflow-hidden bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center">
                {/* Main Light Glassmorphic Container matching /statistics */}
                <div className="flex flex-1 flex-col overflow-hidden bg-slate-900/18 px-4 py-0 pt-3 backdrop-blur-[1px] sm:px-6 sm:py-4 lg:px-8 lg:py-4">
                    {/* Header Bar */}
                    <div className="mb-3 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs tracking-[0.28em] text-slate-100/90 uppercase">LIVE MONITORING BIINSPIRA GROUP</p>
                            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
                                Perbandingan Omset 2025 vs 2026
                            </h1>
                        </div>

                        {/* Top Controls & Navigation in a single neat row */}
                        <div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
                            {/* Tab Switcher */}
                            <div className="inline-flex h-9 items-center rounded-full border border-white/45 bg-white/20 p-1 text-white backdrop-blur-sm">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('monthly')}
                                    className={`h-7 rounded-full px-2.5 text-xs font-medium transition xl:px-3 ${
                                        activeTab === 'monthly' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Per Bulan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('cumulative')}
                                    className={`h-7 rounded-full px-2.5 text-xs font-medium transition xl:px-3 ${
                                        activeTab === 'cumulative' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Tren Kumulatif
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('platform')}
                                    className={`h-7 rounded-full px-2.5 text-xs font-medium transition xl:px-3 ${
                                        activeTab === 'platform' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Per Platform
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('table')}
                                    className={`h-7 rounded-full px-2.5 text-xs font-medium transition xl:px-3 ${
                                        activeTab === 'table' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Tabel Rincian
                                </button>
                            </div>

                            {/* Link to TV Platform Dashboard */}
                            <Link
                                href="/statistics"
                                className="flex h-9 items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/30"
                                title="Buka Statistik Platform TV"
                            >
                                <Tv className="h-3.5 w-3.5 text-sky-200" />
                                <span>Statistik Platform</span>
                            </Link>

                            {/* Fullscreen Button */}
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm transition hover:border-white/60 hover:bg-white/30"
                                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh TV'}
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </button>

                            {/* Update Badge */}
                            <p className="flex h-9 items-center rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium whitespace-nowrap text-white backdrop-blur-sm">
                                Update: {new Date(generatedAt).toLocaleString('id-ID')}
                            </p>
                        </div>
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
                        <ComparisonView data={comparisonData!} activeTab={activeTab} />
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
function ComparisonView({ data, activeTab }: { data: ComparisonData; activeTab: 'monthly' | 'cumulative' | 'platform' | 'table' }) {
    const summary = data.summary;

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Top 4 KPI Cards in White Frosted Glassmorphism matching /statistics */}
            <div className="mb-3 grid shrink-0 grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Total Omset 2026 */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/55 bg-white/88 p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur xl:p-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/80 text-white shadow-xs xl:h-12 xl:w-12">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">
                                Total Omset 2026 (YTD)
                            </p>
                            <span
                                className={`py-0.2 inline-flex items-center gap-0.5 rounded-full px-2 text-[10px] font-bold ${
                                    summary.growth_direction === 'up'
                                        ? 'border border-emerald-400/80 bg-emerald-100 text-emerald-800'
                                        : 'border border-rose-400/80 bg-rose-100 text-rose-800'
                                }`}
                            >
                                {summary.growth_direction === 'up' ? '↑ +' : '↓ -'}
                                {summary.growth_percentage}% YoY
                            </span>
                        </div>
                        <p
                            className="mt-0.5 truncate text-lg leading-tight font-black text-slate-900 xl:text-xl 2xl:text-2xl"
                            title={formatCurrency(summary.total_2026)}
                        >
                            {formatCurrency(summary.total_2026)}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                            Rata-rata: <span className="font-semibold text-slate-700">{formatCurrency(summary.monthly_avg_2026)}</span> / bln
                        </p>
                    </div>
                </div>

                {/* Card 2: Total Omset 2025 */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/55 bg-white/88 p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur xl:p-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-slate-500 to-slate-700 text-white shadow-xs xl:h-12 xl:w-12">
                        <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">Total Omset 2025</p>
                            <span className="py-0.2 rounded-full border border-slate-300 bg-slate-100 px-2 text-[10px] font-bold text-slate-700">
                                Full Year
                            </span>
                        </div>
                        <p
                            className="mt-0.5 truncate text-lg leading-tight font-black text-slate-900 xl:text-xl 2xl:text-2xl"
                            title={formatCurrency(summary.total_2025)}
                        >
                            {formatCurrency(summary.total_2025)}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                            Rata-rata: <span className="font-semibold text-slate-700">{formatCurrency(summary.monthly_avg_2025)}</span> / bln
                        </p>
                    </div>
                </div>

                {/* Card 3: Periode Setara (Jan - Bulan Berjalan) */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/55 bg-white/88 p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur xl:p-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-cyan-600 text-white shadow-xs xl:h-12 xl:w-12">
                        <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">
                                Setara (Jan - {summary.current_month_name.slice(0, 3)})
                            </p>
                            <span
                                className={`py-0.2 inline-flex items-center gap-0.5 rounded-full px-2 text-[10px] font-bold ${
                                    summary.ytd_growth_direction === 'up'
                                        ? 'border border-emerald-400/80 bg-emerald-100 text-emerald-800'
                                        : 'border border-rose-400/80 bg-rose-100 text-rose-800'
                                }`}
                            >
                                {summary.ytd_growth_direction === 'up' ? '↑ +' : '↓ -'}
                                {summary.ytd_growth_percentage}%
                            </span>
                        </div>
                        <p
                            className="mt-0.5 truncate text-lg leading-tight font-black text-slate-900 xl:text-xl 2xl:text-2xl"
                            title={formatCurrency(summary.ytd_2026)}
                        >
                            {formatCurrency(summary.ytd_2026)}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">
                            2025 periode sama: <span className="font-semibold text-slate-700">{formatCurrency(summary.ytd_2025)}</span>
                        </p>
                    </div>
                </div>

                {/* Card 4: Bulan Tertinggi */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-white/55 bg-white/88 p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur xl:p-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-xs xl:h-12 xl:w-12">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-xs">Rekor Bulan Tertinggi</p>
                            <span className="py-0.2 rounded-full border border-emerald-300 bg-emerald-50 px-2 text-[10px] font-bold text-emerald-800">
                                Peak Month
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                            <div>
                                <span className="text-[10px] font-bold text-slate-500">2026: </span>
                                <span className="text-sm font-black text-primary">{summary.best_month_2026.month}</span>
                                <p className="text-xs font-black text-primary">{formatCompactCurrency(summary.best_month_2026.value)}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-500">2025: </span>
                                <span className="text-sm font-bold text-slate-700">{summary.best_month_2025.month}</span>
                                <p className="text-xs font-bold text-slate-700">{formatCompactCurrency(summary.best_month_2025.value)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chart Container in White Glassmorphism matching Dialog/Cards */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/55 bg-white/88 p-3.5 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl xl:p-4">
                {/* Toolbar inside card */}
                <div className="mb-2 flex shrink-0 items-center justify-between border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            {activeTab === 'monthly' && <BarChart3 className="h-4 w-4" />}
                            {activeTab === 'cumulative' && <LineChartIcon className="h-4 w-4" />}
                            {activeTab === 'platform' && <Layers className="h-4 w-4" />}
                            {activeTab === 'table' && <TableIcon className="h-4 w-4" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 xl:text-base">
                                {activeTab === 'monthly' && 'Grafik Perbandingan Omset Bulanan (Januari - Desember)'}
                                {activeTab === 'cumulative' && 'Kurva Pertumbuhan Akumulatif Omset (YTD)'}
                                {activeTab === 'platform' && 'Rincian Performa Omset Tiap Platform'}
                                {activeTab === 'table' && 'Matriks Data Omset Bulanan 2025 vs 2026'}
                            </h2>
                            <p className="text-[11px] text-slate-500">
                                {activeTab === 'monthly' && 'Perbandingan omset aktual bulan demi bulan antara 2025 dan 2026'}
                                {activeTab === 'cumulative' && 'Progres akumulasi pendapatan group sepanjang tahun berjalan'}
                                {activeTab === 'platform' && 'Kontribusi omset 8 platform Biinspira Group'}
                                {activeTab === 'table' && 'Rincian angka nominal, selisih dan persentase pertumbuhan'}
                            </p>
                        </div>
                    </div>

                    {/* Chart Legend Badges */}
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs shadow-2xs">
                        <div className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-sm bg-slate-400" />
                            <span className="font-semibold text-slate-600">Tahun 2025</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-sm bg-primary" />
                            <span className="font-bold text-primary">Tahun 2026</span>
                        </div>
                    </div>
                </div>

                {/* Tab 1: Monthly Comparison Bar Chart */}
                {activeTab === 'monthly' && (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 w-full flex-1">
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

                {/* Tab 2: Cumulative Area / Line Chart */}
                {activeTab === 'cumulative' && (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 w-full flex-1">
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
                                        className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <h2 className="truncate text-base font-bold text-slate-800" title={platform.label}>
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
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tab 4: Tabular Details Matrix */}
                {activeTab === 'table' && (
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                        <table className="w-full text-left text-xs">
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
        </div>
    );
}
