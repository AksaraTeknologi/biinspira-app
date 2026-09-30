import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Banknote,
    BarChart3,
    GraduationCap,
    KanbanSquareIcon,
    Lock,
    Maximize2,
    Minimize2,
    Radio,
    Sparkles,
    Tv,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { TvNavMenu } from './components/tv-nav-menu';

interface StatsDashboardProps {
    overview: {
        active_platforms_count: number;
        active_tickets_count: number;
        in_progress_tickets_count: number;
        brevet_total_year: number;
        ad_spend_this_month: number;
        ad_spend_this_year: number;
        year: number;
    };
    generatedAt: string;
}

export default function StatsDashboard({ overview, generatedAt }: StatsDashboardProps) {
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    const modules = [
        {
            key: 'platform',
            title: 'Pendapatan Platform',
            subtitle: 'Monitoring omset real-time seluruh entitas platform grup Biinspira',
            href: '/stats',
            icon: Tv,
            colorTheme: 'from-sky-500/20 via-sky-500/10 to-transparent text-sky-600',
            badgeBg: 'bg-sky-100 text-sky-700 border-sky-200',
            iconBg: 'bg-sky-500 text-white',
            statLabel: 'Integrasi Aktif',
            statValue: `${overview.active_platforms_count} Platform`,
            statSub: 'Sinkronisasi Realtime API',
        },
        {
            key: 'omset',
            title: "Omset '25 vs '26",
            subtitle: 'Perbandingan omset tahunan, performa bulanan, tren kumulatif & kontribusi platform',
            href: '/stats-omset',
            icon: BarChart3,
            colorTheme: 'from-emerald-500/20 via-emerald-500/10 to-transparent text-emerald-600',
            badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            iconBg: 'bg-emerald-500 text-white',
            statLabel: 'Periode Analisis',
            statValue: '2025 vs 2026',
            statSub: 'Tren & Evaluasi Bulanan',
        },
        {
            key: 'ad_spend',
            title: 'Biaya Iklan (Ad Spend)',
            subtitle: 'Monitoring pengeluaran kampanye iklan Meta Ads, TikTok Ads, dan Google Ads',
            href: '/stats-iklan',
            icon: Banknote,
            colorTheme: 'from-blue-500/20 via-blue-500/10 to-transparent text-blue-600',
            badgeBg: 'bg-blue-100 text-blue-700 border-blue-200',
            iconBg: 'bg-blue-500 text-white',
            statLabel: 'Total Iklan Bulan Ini',
            statValue: `Rp ${new Intl.NumberFormat('id-ID').format(overview.ad_spend_this_month)}`,
            statSub: `Tahun ${overview.year}: Rp ${new Intl.NumberFormat('id-ID').format(overview.ad_spend_this_year)}`,
        },
        {
            key: 'brevet',
            title: 'Peserta Brevet',
            subtitle: 'Rekapitulasi peserta kelas pajak & sertifikasi (Weekend, Weekday, Beasiswa)',
            href: '/stats-brevet',
            icon: GraduationCap,
            colorTheme: 'from-amber-500/20 via-amber-500/10 to-transparent text-amber-600',
            badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
            iconBg: 'bg-amber-500 text-white',
            statLabel: `Total Peserta ${overview.year}`,
            statValue: `${overview.brevet_total_year.toLocaleString('id-ID')} Peserta`,
            statSub: 'Kelas Pajak & Sertifikasi',
        },
        {
            key: 'ticket',
            title: 'Tiket Aplikasi & IT',
            subtitle: 'Live monitoring tiket kendala, penambahan fitur, serta beban kerja tim programmer',
            href: '/stats-ticket',
            icon: KanbanSquareIcon,
            colorTheme: 'from-purple-500/20 via-purple-500/10 to-transparent text-purple-600',
            badgeBg: 'bg-purple-100 text-purple-700 border-purple-200',
            iconBg: 'bg-purple-500 text-white',
            statLabel: 'Tiket Aktif Berjalan',
            statValue: `${overview.active_tickets_count} Tiket Aktif`,
            statSub: `${overview.in_progress_tickets_count} Sedang Dikerjakan`,
        },
    ];

    const formattedDate = currentTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const formattedTime = currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return (
        <div className="relative min-h-screen w-full select-none overflow-x-hidden bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center bg-no-repeat font-sans">
            <Head title="Pusat Statistik TV | Biinspira Group" />

            {/* Frosted Glass Base Overlay */}
            <div className="relative z-10 flex min-h-screen flex-col bg-slate-900/18 backdrop-blur-[1px] p-3 sm:p-5 lg:p-6 text-slate-800">
                {/* Header Bar */}
                <header className="mb-4 sm:mb-6 rounded-2xl border border-white/55 bg-white/88 p-3.5 sm:p-4 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Title & Live Status */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/25">
                                <Radio className="h-5 w-5 animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
                                        Pusat Statistik TV
                                    </span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                        Live
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                                    Dashboard Utama Statistik
                                </h1>
                            </div>
                        </div>

                        {/* Top Right Controls: Single Dropdown Navigation, Fullscreen, Lock, Clock */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Single Popup Menu Navigation */}
                            <TvNavMenu
                                currentKey="dashboard"
                                className="border-slate-200/90! bg-slate-100/90! text-slate-800! hover:bg-slate-200/90! hover:border-slate-300! shadow-xs"
                            />

                            {/* Fullscreen Button */}
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-xs transition hover:bg-slate-100 active:scale-95"
                                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh TV'}
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </button>

                            {/* Lock Screen Button */}
                            <button
                                type="button"
                                onClick={() => router.post('/stats/lock')}
                                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/90 px-3 text-xs font-semibold text-rose-700 shadow-xs transition hover:bg-rose-100 active:scale-95"
                                title="Kunci Tampilan Statistik"
                            >
                                <Lock className="h-3.5 w-3.5 text-rose-600" />
                                <span className="hidden sm:inline">Kunci</span>
                            </button>

                            {/* Live Clock Card */}
                            <div className="flex h-9 items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 text-xs font-semibold text-slate-700 shadow-xs">
                                <span className="hidden md:inline text-slate-500">{formattedDate}</span>
                                <span className="hidden md:inline text-slate-300">|</span>
                                <span className="font-mono font-bold text-slate-900">{formattedTime}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content: Hub Grid of 5 Modules */}
                <main className="flex-1 flex flex-col justify-center">
                    <div className="mb-3 flex items-center justify-between px-1">
                        <div>
                            <h2 className="text-sm sm:text-base font-bold text-white drop-shadow-sm flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-amber-300" />
                                Pilih Modul Statistik
                            </h2>
                            <p className="text-xs text-slate-200 drop-shadow-xs">
                                Akses cepat ke 5 modul statistik visualisasi TV Biinspira Group
                            </p>
                        </div>
                        <span className="text-[11px] font-semibold text-white/90 bg-white/20 px-2.5 py-1 rounded-full border border-white/30 backdrop-blur-xs">
                            5 Modul Tersedia
                        </span>
                    </div>

                    {/* Responsive Grid: 3 columns on desktop, 2 on tablet, 1 on mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
                        {modules.map((item, index) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/60 bg-white/92 p-5 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(15,23,42,0.22)] hover:border-blue-300/80 ${
                                        index === 4 ? 'md:col-span-2 lg:col-span-1' : ''
                                    }`}
                                >
                                    {/* Subtle Top Gradient Accent */}
                                    <div
                                        className={`absolute inset-x-0 top-0 h-1.5 bg-linear-to-r ${item.colorTheme}`}
                                    />

                                    <div>
                                        {/* Card Header: Icon, Number, Badge */}
                                        <div className="flex items-center justify-between">
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md transition-transform duration-200 group-hover:scale-110 ${item.iconBg}`}
                                            >
                                                <Icon className="h-6 w-6" />
                                            </div>

                                            <span
                                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${item.badgeBg}`}
                                            >
                                                Modul {index + 1}
                                            </span>
                                        </div>

                                        {/* Title & Description */}
                                        <div className="mt-4">
                                            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition">
                                                {item.title}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
                                                {item.subtitle}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bottom Highlights & Action CTA */}
                                    <div className="mt-5 border-t border-slate-100 pt-4">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {item.statLabel}
                                                </p>
                                                <p className="text-base sm:text-lg font-black text-slate-900">
                                                    {item.statValue}
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium truncate">
                                                    {item.statSub}
                                                </p>
                                            </div>

                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-xs">
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </main>

                {/* Footer Info */}
                <footer className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/80 drop-shadow-xs px-1">
                    <p>© {new Date().getFullYear()} Biinspira Group — Sistem Live Monitoring Layar TV</p>
                    <p className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Terakhir diperbarui: {new Date(generatedAt).toLocaleString('id-ID')}
                    </p>
                </footer>
            </div>
        </div>
    );
}
