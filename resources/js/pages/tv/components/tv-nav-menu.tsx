import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@inertiajs/react';
import {
    Banknote,
    BarChart3,
    Check,
    ChevronDown,
    ChevronRight,
    GraduationCap,
    KanbanSquareIcon,
    LayoutDashboard,
    Layers,
    Sparkles,
    Tv,
} from 'lucide-react';
import React from 'react';

export type TvStatKey = 'dashboard' | 'platform' | 'omset' | 'ad_spend' | 'brevet' | 'ticket';

export interface TvStatMenuItem {
    key: TvStatKey;
    label: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    // Themed styling for distinct, high-contrast visibility
    iconBg: string;
    activeIconBg: string;
    activeCard: string;
    activeBadge: string;
    hoverBorder: string;
}

export const TV_STAT_NAV_ITEMS: TvStatMenuItem[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        description: 'Halaman awal & pusat navigasi statistik',
        href: '/stats-dashboard',
        icon: LayoutDashboard,
        iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/90 shadow-xs',
        activeIconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/30 border-transparent',
        activeCard: 'bg-gradient-to-r from-indigo-50/95 to-blue-50/70 border-indigo-200/90 text-indigo-950 shadow-xs',
        activeBadge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        hoverBorder: 'hover:border-indigo-200/80 hover:bg-indigo-50/40',
    },
    {
        key: 'platform',
        label: 'Platform',
        description: 'Pendapatan real-time tiap platform grup',
        href: '/stats',
        icon: Tv,
        iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/90 shadow-xs',
        activeIconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 border-transparent',
        activeCard: 'bg-gradient-to-r from-sky-50/95 to-blue-50/70 border-sky-200/90 text-sky-950 shadow-xs',
        activeBadge: 'bg-sky-100 text-sky-700 border-sky-200',
        hoverBorder: 'hover:border-sky-200/80 hover:bg-sky-50/40',
    },
    {
        key: 'omset',
        label: "Omset '25 vs '26",
        description: 'Perbandingan omset tahunan & tren',
        href: '/stats-omset',
        icon: BarChart3,
        iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/90 shadow-xs',
        activeIconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 border-transparent',
        activeCard: 'bg-gradient-to-r from-emerald-50/95 to-teal-50/70 border-emerald-200/90 text-emerald-950 shadow-xs',
        activeBadge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        hoverBorder: 'hover:border-emerald-200/80 hover:bg-emerald-50/40',
    },
    {
        key: 'ad_spend',
        label: 'Biaya Iklan',
        description: 'Pengeluaran iklan Meta, Google & TikTok',
        href: '/stats-iklan',
        icon: Banknote,
        iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/90 shadow-xs',
        activeIconBg: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-500/30 border-transparent',
        activeCard: 'bg-gradient-to-r from-blue-50/95 to-indigo-50/70 border-blue-200/90 text-blue-950 shadow-xs',
        activeBadge: 'bg-blue-100 text-blue-700 border-blue-200',
        hoverBorder: 'hover:border-blue-200/80 hover:bg-blue-50/40',
    },
    {
        key: 'brevet',
        label: 'Peserta Brevet',
        description: 'Pendaftar kelas pajak & sertifikasi',
        href: '/stats-brevet',
        icon: GraduationCap,
        iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/90 shadow-xs',
        activeIconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30 border-transparent',
        activeCard: 'bg-gradient-to-r from-amber-50/95 to-orange-50/70 border-amber-200/90 text-amber-950 shadow-xs',
        activeBadge: 'bg-amber-100 text-amber-700 border-amber-200',
        hoverBorder: 'hover:border-amber-200/80 hover:bg-amber-50/40',
    },
    {
        key: 'ticket',
        label: 'Tiket Aplikasi',
        description: 'Monitoring pengerjaan tiket & fitur baru',
        href: '/stats-ticket',
        icon: KanbanSquareIcon,
        iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/90 shadow-xs',
        activeIconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-md shadow-purple-500/30 border-transparent',
        activeCard: 'bg-gradient-to-r from-purple-50/95 to-fuchsia-50/70 border-purple-200/90 text-purple-950 shadow-xs',
        activeBadge: 'bg-purple-100 text-purple-700 border-purple-200',
        hoverBorder: 'hover:border-purple-200/80 hover:bg-purple-50/40',
    },
];

interface TvNavMenuProps {
    currentKey: TvStatKey;
    className?: string;
}

export function TvNavMenu({ currentKey, className = '' }: TvNavMenuProps) {
    const activeItem =
        TV_STAT_NAV_ITEMS.find((item) => item.key === currentKey) ?? TV_STAT_NAV_ITEMS[0];
    const ActiveIcon = activeItem.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={`flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:border-white/60 hover:bg-white/30 active:scale-95 shadow-xs ${className}`}
                    title="Pilih Modul Statistik"
                >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                        <ActiveIcon className="h-3.5 w-3.5 text-white drop-shadow-xs stroke-[2.4]" />
                    </span>
                    <span className="tracking-tight">{activeItem.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-84 overflow-hidden rounded-2xl border border-white/80 bg-white/96 p-2 shadow-[0_20px_50px_rgba(15,23,42,0.22)] backdrop-blur-2xl ring-1 ring-slate-900/5 animate-in fade-in-0 zoom-in-95"
            >
                {/* Header Title & Count Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 px-2.5 pb-2.5 pt-1">
                    <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                            <Layers className="h-3.5 w-3.5 stroke-[2.2]" />
                        </div>
                        <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                            Menu Statistik TV
                        </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {TV_STAT_NAV_ITEMS.length} Modul
                    </span>
                </div>

                {/* Module List Items */}
                <div className="mt-1.5 space-y-1">
                    {TV_STAT_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.key === currentKey;

                        return (
                            <DropdownMenuItem key={item.key} asChild className="cursor-pointer p-0 focus:bg-transparent">
                                <Link
                                    href={item.href}
                                    className={`group flex w-full items-center justify-between rounded-xl px-2.5 py-2.5 transition-all duration-150 ${
                                        isActive
                                            ? item.activeCard
                                            : `border border-transparent text-slate-700 ${item.hoverBorder}`
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Icon Container with vibrant distinctive color */}
                                        <div
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
                                                isActive ? item.activeIconBg : item.iconBg
                                            }`}
                                        >
                                            <Icon className="h-4.5 w-4.5 stroke-[2.3]" />
                                        </div>

                                        <div className="min-w-0 text-left">
                                            <p
                                                className={`truncate text-[12.5px] leading-tight ${
                                                    isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                                                }`}
                                            >
                                                {item.label}
                                            </p>
                                            <p className="truncate text-[10.5px] text-slate-500 font-normal mt-0.5">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Status Badge / Arrow */}
                                    {isActive ? (
                                        <span
                                            className={`ml-2 inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-bold shadow-2xs ${item.activeBadge}`}
                                        >
                                            <Check className="h-2.5 w-2.5 stroke-[3.5]" />
                                            Aktif
                                        </span>
                                    ) : (
                                        <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-slate-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-slate-600" />
                                    )}
                                </Link>
                            </DropdownMenuItem>
                        );
                    })}
                </div>

                {/* Subtle Footer */}
                <div className="mt-2 border-t border-slate-100 px-2.5 pt-2 pb-0.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        Live TV Display Portal
                    </span>
                    <span className="font-semibold text-slate-400">Biinspira Group</span>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
