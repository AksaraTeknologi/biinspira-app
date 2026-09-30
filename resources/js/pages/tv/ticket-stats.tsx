'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    Banknote,
    BarChart3,
    CheckCircle2,
    Clock,
    Cpu,
    ExternalLink,
    Filter,
    Flame,
    GraduationCap,
    Hammer,
    KanbanSquareIcon,
    Layers,
    ListTodo,
    Lock,
    Maximize2,
    Minimize2,
    RotateCcw,
    Search,
    ShieldAlert,
    Sparkles,
    Tv,
    UserCheck,
    Users,
    Wrench,
    Zap,
} from 'lucide-react';
import * as React from 'react';
import { TvNavMenu } from './components/tv-nav-menu';

interface TaskItem {
    id: number;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'in_review' | 'complete';
    urgency: 'high' | 'medium' | 'low';
    target_role: 'technician' | 'technician-intern';
    work_type: 'pengerjaan' | 'penambahan_fitur' | 'maintenance' | null;
    deadline: string | null;
    deadline_label: string;
    is_overdue: boolean;
    estimation_start: string | null;
    estimation_end: string | null;
    application: {
        id: number;
        name: string;
        color: string | null;
    } | null;
    assignees: Array<{ id: string | number; name: string }>;
    assignees_name: string;
    creator_name: string;
}

interface ApplicationGroup {
    id: string;
    name: string;
    color: string;
    description: string | null;
    total_tasks: number;
    in_progress_count: number;
    todo_count: number;
    in_review_count: number;
    pengerjaan_count: number;
    fitur_count: number;
    maintenance_count: number;
    tasks: TaskItem[];
}

interface ProgrammerStat {
    id: string;
    name: string;
    role: string;
    is_intern: boolean;
    total_assigned: number;
    in_progress_count: number;
    tasks: TaskItem[];
}

interface TicketSummary {
    total_active: number;
    in_progress: number;
    todo: number;
    in_review: number;
    pengerjaan: number;
    penambahan_fitur: number;
    maintenance: number;
    unassigned_type: number;
    completed_week: number;
}

interface TicketPayload {
    summary: TicketSummary;
    in_progress_tasks: TaskItem[];
    applications: ApplicationGroup[];
    programmers: ProgrammerStat[];
    all_tasks: TaskItem[];
}

interface PageProps {
    ticketData?: TicketPayload;
    generatedAt: string;
}

const formatIdDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    // Format YYYY-MM-DD HH:mm:ss or YYYY-MM-DD
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const year = match[1];
        const monthNum = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
        ];
        const monthName = months[monthNum - 1] || '';
        return `${day} ${monthName} ${year}`.trim();
    }
    const d = new Date(dateStr.replace(' ', 'T'));
    if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(d);
    }
    return dateStr;
};

const formatEstimationRange = (start?: string | null, end?: string | null): string | null => {
    const formattedStart = formatIdDate(start);
    const formattedEnd = formatIdDate(end);
    if (formattedStart && formattedEnd) {
        if (formattedStart === formattedEnd) {
            return `Est: ${formattedStart}`;
        }
        return `Est: ${formattedStart} s/d ${formattedEnd}`;
    }
    if (formattedStart) return `Est: ${formattedStart}`;
    if (formattedEnd) return `Est: s/d ${formattedEnd}`;
    return null;
};

const WORK_TYPE_META: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
    pengerjaan: {
        label: 'Pengerjaan',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Wrench className="h-3 w-3 inline mr-1" />,
    },
    penambahan_fitur: {
        label: 'Fitur Baru',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <Sparkles className="h-3 w-3 inline mr-1" />,
    },
    maintenance: {
        label: 'Maintenance',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Hammer className="h-3 w-3 inline mr-1" />,
    },
};

const STATUS_META = {
    in_progress: {
        label: 'Sedang Dikerjakan',
        badge: 'bg-blue-500 text-white shadow-xs shadow-blue-500/30',
        dot: 'bg-emerald-500 animate-pulse',
    },
    todo: {
        label: 'Akan Dikerjakan',
        badge: 'bg-purple-100 text-purple-700 border border-purple-200',
        dot: 'bg-purple-500',
    },
    in_review: {
        label: 'Sedang Ditinjau',
        badge: 'bg-amber-100 text-amber-700 border border-amber-200',
        dot: 'bg-amber-500 animate-bounce',
    },
    complete: {
        label: 'Selesai',
        badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        dot: 'bg-emerald-500',
    },
};

export default function TvTicketStatsPage({ ticketData, generatedAt }: PageProps) {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [selectedAppId, setSelectedAppId] = React.useState<string>('all');
    const [selectedWorkType, setSelectedWorkType] = React.useState<string>('all');
    const [selectedRole, setSelectedRole] = React.useState<string>('all');
    const [viewTab, setViewTab] = React.useState<'overview' | 'in_progress' | 'applications' | 'team'>('overview');
    const [searchQuery, setSearchQuery] = React.useState('');

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
        }
    };

    const formattedFullDate = React.useMemo(() => {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, []);

    // Filter tasks dynamically based on selected tabs
    const filteredTasks = React.useMemo(() => {
        if (!ticketData?.all_tasks) return [];
        return ticketData.all_tasks.filter((task) => {
            if (selectedAppId !== 'all') {
                if (selectedAppId === 'general' && task.application !== null) return false;
                if (selectedAppId !== 'general' && String(task.application?.id) !== selectedAppId) return false;
            }
            if (selectedWorkType !== 'all' && task.work_type !== selectedWorkType) return false;
            if (selectedRole !== 'all' && task.target_role !== selectedRole) return false;
            if (searchQuery.trim() && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [ticketData, selectedAppId, selectedWorkType, selectedRole, searchQuery]);

    const activeApplications = ticketData?.applications ?? [];
    const activeProgrammers = ticketData?.programmers ?? [];
    const inProgressList = React.useMemo(() => {
        return filteredTasks.filter((t) => t.status === 'in_progress');
    }, [filteredTasks]);

    return (
        <>
            <Head title="Live Monitoring Tiket & Progres Aplikasi - Biinspira Group" />
            <div className="flex min-h-screen w-screen flex-col bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center lg:h-screen lg:overflow-hidden">
                {/* Main Light Glassmorphic Container matching other TV pages */}
                <div className="flex flex-1 flex-col overflow-y-auto bg-slate-900/18 px-3 py-2.5 backdrop-blur-[1px] sm:px-6 sm:py-4 lg:px-8 lg:overflow-hidden">
                    {/* Header Bar */}
                    <div className="mb-2.5 flex shrink-0 flex-col gap-2 sm:mb-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                                    <p className="text-[10px] tracking-[0.2em] text-emerald-300 font-semibold uppercase sm:text-xs sm:tracking-[0.28em]">
                                        LIVE MONITORING SISTEM & APLIKASI
                                    </p>
                                </div>
                                <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
                                    Progres Pengerjaan Tiket & Aplikasi
                                </h1>
                            </div>

                            {/* Mobile Navigation Links */}
                            <div className="flex items-center gap-1.5 sm:hidden">
                                <TvNavMenu currentKey="ticket" />
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm"
                                >
                                    {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.post('/stats/lock')}
                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm transition active:scale-95 hover:bg-rose-500/30 shadow-xs"
                                    title="Kunci Layar Statistik"
                                >
                                    <Lock className="h-3.5 w-3.5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Top Controls & Navigation Suite */}
                        <div className="flex shrink-0 items-center justify-between gap-1.5 sm:justify-end xl:gap-2">
                            {/* View Switcher Tabs */}
                            <div className="flex items-center rounded-full border border-white/45 bg-white/20 p-1 text-white backdrop-blur-sm">
                                <button
                                    type="button"
                                    onClick={() => setViewTab('overview')}
                                    className={`h-7 rounded-full px-2.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        viewTab === 'overview' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Dashboard
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewTab('in_progress')}
                                    className={`h-7 rounded-full px-2.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        viewTab === 'in_progress' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Sedang Berjalan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewTab('applications')}
                                    className={`h-7 rounded-full px-2.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        viewTab === 'applications' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Per Aplikasi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewTab('team')}
                                    className={`h-7 rounded-full px-2.5 text-[11px] font-medium transition sm:px-3 sm:text-xs ${
                                        viewTab === 'team' ? 'bg-white/35 font-bold text-white shadow-xs' : 'text-white/85 hover:text-white'
                                    }`}
                                >
                                    Tim Programmer
                                </button>
                            </div>

                            {/* Desktop Unified Navigation Suite */}
                            <div className="hidden sm:flex sm:items-center sm:gap-1.5 xl:gap-2">
                                <TvNavMenu currentKey="ticket" />

                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 active:scale-95 shadow-xs"
                                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh TV'}
                                >
                                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => router.post('/stats/lock')}
                                    className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-rose-500/30 hover:border-rose-400/60 active:scale-95 shadow-xs"
                                    title="Kunci Tampilan Statistik"
                                >
                                    <Lock className="h-3.5 w-3.5 text-white" />
                                    <span>Kunci</span>
                                </button>

                                <p className="flex h-9 items-center rounded-full border border-white/45 bg-white/20 px-3 text-xs font-medium text-white backdrop-blur-sm">
                                    {new Date(generatedAt).toLocaleTimeString('id-ID')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter Tabs Bar (Aplikasi Tabs & Tipe Pekerjaan) */}
                    <Deferred
                        data="ticketData"
                        fallback={<Skeleton className="mb-2 h-11 w-full rounded-2xl bg-white/20" />}
                    >
                        {ticketData && (
                            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/45 bg-white/20 p-1.5 backdrop-blur-sm sm:gap-2">
                                {/* Aplikasi Tabs */}
                                <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAppId('all')}
                                        className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                            selectedAppId === 'all'
                                                ? 'bg-white text-slate-900 shadow-md font-bold'
                                                : 'text-white/85 hover:bg-white/20'
                                        }`}
                                    >
                                        <Layers className="h-3.5 w-3.5" />
                                        <span>Semua Aplikasi</span>
                                        <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedAppId === 'all' ? 'bg-slate-900 text-white' : 'bg-white/25 text-white'}`}>
                                            {ticketData.summary.total_active}
                                        </span>
                                    </button>

                                    {activeApplications.map((app) => (
                                        <button
                                            key={app.id}
                                            type="button"
                                            onClick={() => setSelectedAppId(app.id)}
                                            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                                selectedAppId === app.id
                                                    ? 'bg-white text-slate-900 shadow-md font-bold'
                                                    : 'text-white/85 hover:bg-white/20'
                                            }`}
                                        >
                                            <span
                                                className="inline-block h-2.5 w-2.5 rounded-full shadow-xs"
                                                style={{ backgroundColor: app.color }}
                                            />
                                            <span>{app.name}</span>
                                            <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedAppId === app.id ? 'bg-slate-900 text-white' : 'bg-white/25 text-white'}`}>
                                                {app.total_tasks}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Work Type Filter Pills */}
                                <div className="flex shrink-0 items-center gap-1 border-t border-white/20 pt-1.5 sm:border-t-0 sm:border-l sm:pl-2.5 sm:pt-0">
                                    {(
                                        [
                                            { id: 'all', label: 'Semua Tipe', icon: null },
                                            { id: 'pengerjaan', label: 'Pengerjaan', icon: <Wrench className="mr-1 h-3 w-3" /> },
                                            { id: 'penambahan_fitur', label: 'Fitur Baru', icon: <Sparkles className="mr-1 h-3 w-3" /> },
                                            { id: 'maintenance', label: 'Maintenance', icon: <Hammer className="mr-1 h-3 w-3" /> },
                                        ] as const
                                    ).map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedWorkType(item.id)}
                                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                                                selectedWorkType === item.id
                                                    ? 'bg-white text-indigo-700 font-bold shadow-md'
                                                    : 'text-white/85 hover:bg-white/20'
                                            }`}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Deferred>

                    {/* Main Content Area */}
                    <Deferred
                        data="ticketData"
                        fallback={
                            <div className="flex flex-1 flex-col gap-3">
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/20" />
                                    ))}
                                </div>
                                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/20" />
                                    ))}
                                </div>
                            </div>
                        }
                    >
                        {ticketData && (
                            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1 no-scrollbar lg:overflow-hidden">
                                {/* Top KPI Metric Cards */}
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
                                    {/* Card 1: Total Tiket Aktif */}
                                    <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/90 p-3 shadow-lg backdrop-blur-md">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white shadow-md">
                                            <Layers className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                Total Tiket Aktif
                                            </p>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-2xl font-black text-slate-900">
                                                    {ticketData.summary.total_active}
                                                </span>
                                                <span className="text-[11px] font-semibold text-slate-500">tiket</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: Sedang Dikerjakan (In-Progress Live) */}
                                    <div className="relative flex items-center gap-3 rounded-2xl border border-white/50 bg-white/90 p-3 shadow-lg backdrop-blur-md">
                                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full border border-emerald-300/80 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            LIVE
                                        </div>
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                                            <Activity className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                Sedang Dikerjakan
                                            </p>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-2xl font-black text-blue-600">
                                                    {ticketData.summary.in_progress}
                                                </span>
                                                <span className="text-[11px] font-semibold text-blue-500">running</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 3: Pengerjaan Aplikasi Baru */}
                                    <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/90 p-3 shadow-lg backdrop-blur-md">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-md">
                                            <Hammer className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                Pengerjaan Baru
                                            </p>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-2xl font-black text-slate-900">
                                                    {ticketData.summary.pengerjaan}
                                                </span>
                                                <span className="text-[11px] font-semibold text-sky-600">tiket</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 4: Penambahan Fitur */}
                                    <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/90 p-3 shadow-lg backdrop-blur-md">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-violet-600 text-white shadow-md">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                Fitur Baru
                                            </p>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-2xl font-black text-slate-900">
                                                    {ticketData.summary.penambahan_fitur}
                                                </span>
                                                <span className="text-[11px] font-semibold text-purple-600">tiket</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 5: Maintenance & Bugfix */}
                                    <div className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/90 p-3 shadow-lg backdrop-blur-md">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-md">
                                            <Wrench className="h-6 w-6" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                                Maintenance
                                            </p>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-2xl font-black text-slate-900">
                                                    {ticketData.summary.maintenance}
                                                </span>
                                                <span className="text-[11px] font-semibold text-amber-600">tiket</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Views (Dashboard / Sedang Berjalan / Per Aplikasi / Tim) */}
                                {viewTab === 'overview' && (
                                    <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:overflow-hidden">
                                        {/* Left Side (7 cols): Sedang Dikerjakan Live Activity */}
                                        <div className="flex flex-col rounded-3xl border border-white/55 bg-white/88 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:col-span-7 lg:overflow-hidden">
                                            <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-3 w-3 rounded-full bg-blue-500 animate-ping" />
                                                    <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                                                        Sedang Berjalan Sekarang (In-Progress)
                                                    </h2>
                                                </div>
                                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                                    {inProgressList.length} tiket aktif
                                                </span>
                                            </div>

                                            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 no-scrollbar">
                                                {inProgressList.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                                                        <Clock className="mb-2 h-9 w-9 opacity-40" />
                                                        <p className="text-sm font-medium">Tidak ada tiket yang sedang dikerjakan saat ini</p>
                                                    </div>
                                                ) : (
                                                    inProgressList.map((task) => (
                                                        <div
                                                            key={task.id}
                                                            className="group relative rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                                                        {task.application && (
                                                                            <span
                                                                                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
                                                                                style={{ backgroundColor: task.application.color ?? '#3B82F6' }}
                                                                            >
                                                                                {task.application.name}
                                                                            </span>
                                                                        )}
                                                                        {task.work_type && (
                                                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${WORK_TYPE_META[task.work_type]?.badge}`}>
                                                                                {WORK_TYPE_META[task.work_type]?.icon} {WORK_TYPE_META[task.work_type]?.label}
                                                                            </span>
                                                                        )}
                                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                            task.urgency === 'high'
                                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                                : task.urgency === 'medium'
                                                                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        }`}>
                                                                            Urgensi {task.urgency.toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                                        #{task.id} {task.title}
                                                                    </h3>
                                                                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                                                                        {task.description}
                                                                    </p>
                                                                </div>

                                                                <div className="shrink-0 text-right">
                                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                        task.is_overdue
                                                                            ? 'bg-rose-600 text-white animate-pulse'
                                                                            : 'border border-slate-200 bg-slate-100 text-slate-700'
                                                                    }`}>
                                                                        <Clock className="h-3 w-3" />
                                                                        {task.deadline_label}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Footer Bar of Task Card */}
                                                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                                                                <div className="flex items-center gap-1.5">
                                                                    <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                                                                    <span className="font-semibold text-slate-800">
                                                                        {task.assignees_name || 'Belum ditugaskan'}
                                                                    </span>
                                                                    <span className="text-slate-300">•</span>
                                                                    <span className="text-slate-500">
                                                                        {task.target_role === 'technician' ? 'Programmer' : 'Magang'}
                                                                    </span>
                                                                </div>

                                                                {formatEstimationRange(task.estimation_start, task.estimation_end) && (
                                                                    <span className="font-medium text-slate-500">
                                                                        {formatEstimationRange(task.estimation_start, task.estimation_end)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Side (5 cols): Ringkasan Aplikasi & Tim */}
                                        <div className="flex flex-col gap-3 lg:col-span-5 lg:overflow-hidden">
                                            {/* Aplikasi Aktif Cards */}
                                            <div className="flex flex-1 flex-col rounded-3xl border border-white/55 bg-white/88 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:overflow-hidden">
                                                <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/80 pb-2">
                                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                                        <Cpu className="h-4 w-4 text-purple-600" />
                                                        Aplikasi Yang Sedang Dikerjakan
                                                    </h3>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {activeApplications.length} aplikasi
                                                    </span>
                                                </div>

                                                <div className="flex-1 space-y-2 overflow-y-auto pr-1 no-scrollbar">
                                                    {activeApplications.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                                                            <p className="text-xs font-medium">Tidak ada aplikasi yang sedang aktif</p>
                                                        </div>
                                                    ) : (
                                                        activeApplications.map((app) => (
                                                            <div
                                                                key={app.id}
                                                                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 p-2.5 transition hover:bg-white hover:shadow-xs"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <div
                                                                        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white shadow-xs"
                                                                        style={{ backgroundColor: app.color }}
                                                                    >
                                                                        {app.name.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-slate-900">
                                                                            {app.name}
                                                                        </h4>
                                                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                                                            <span className="text-blue-600 font-semibold">{app.in_progress_count} running</span>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span>{app.todo_count} todo</span>
                                                                            <span className="text-slate-300">•</span>
                                                                            <span>{app.in_review_count} review</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right">
                                                                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                                                                        {app.total_tasks} tiket
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tim Programmer Workload */}
                                            <div className="flex flex-1 flex-col rounded-3xl border border-white/55 bg-white/88 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:overflow-hidden">
                                                <div className="mb-2.5 flex items-center justify-between border-b border-slate-200/80 pb-2">
                                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                                        <Users className="h-4 w-4 text-emerald-600" />
                                                        Beban Kerja Tim Programmer
                                                    </h3>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {activeProgrammers.length} orang
                                                    </span>
                                                </div>

                                                <div className="flex-1 space-y-2 overflow-y-auto pr-1 no-scrollbar">
                                                    {activeProgrammers.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                                                            <p className="text-xs font-medium">Tidak ada programmer yang aktif</p>
                                                        </div>
                                                    ) : (
                                                        activeProgrammers.map((prog) => (
                                                            <div
                                                                key={prog.id}
                                                                className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 p-2.5 transition hover:bg-white hover:shadow-xs"
                                                            >
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-xs">
                                                                        {prog.name.slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-xs font-bold text-slate-900">
                                                                            {prog.name}
                                                                        </h4>
                                                                        <p className="text-[10px] text-slate-500">
                                                                            {prog.role}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                                                        {prog.in_progress_count} aktif
                                                                    </span>
                                                                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                                                        Total {prog.total_assigned}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* View Tab 2: Sedang Berjalan Saja (Expanded In-Progress Grid) */}
                                {viewTab === 'in_progress' && (
                                    <div className="flex flex-1 flex-col rounded-3xl border border-white/55 bg-white/88 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:overflow-hidden">
                                        <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                                            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
                                                <Activity className="h-5 w-5 text-blue-600 animate-spin" />
                                                Daftar Lengkap Tiket Yang Sedang Berjalan ({inProgressList.length})
                                            </h2>
                                        </div>

                                        <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 no-scrollbar pr-1">
                                            {inProgressList.map((task) => (
                                                <div
                                                    key={task.id}
                                                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-sm transition hover:scale-[1.01] hover:border-blue-300 hover:shadow-md"
                                                >
                                                    <div>
                                                        <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                                                            {task.application && (
                                                                <span
                                                                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs"
                                                                    style={{ backgroundColor: task.application.color ?? '#3B82F6' }}
                                                                >
                                                                    {task.application.name}
                                                                </span>
                                                            )}
                                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                                task.is_overdue
                                                                    ? 'bg-rose-600 text-white animate-pulse'
                                                                    : 'border border-slate-200 bg-slate-100 text-slate-700'
                                                            }`}>
                                                                {task.deadline_label}
                                                            </span>
                                                        </div>

                                                        <h3 className="text-sm font-bold text-slate-900">
                                                            #{task.id} {task.title}
                                                        </h3>
                                                        <p className="mt-1 line-clamp-3 text-xs text-slate-600">
                                                            {task.description}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 border-t border-slate-100 pt-2.5 space-y-1.5">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                                <UserCheck className="h-4 w-4 text-emerald-600" />
                                                                <span>{task.assignees_name || 'Belum ada programmer'}</span>
                                                            </div>
                                                            {task.work_type && (
                                                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${WORK_TYPE_META[task.work_type]?.badge}`}>
                                                                    {WORK_TYPE_META[task.work_type]?.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {formatEstimationRange(task.estimation_start, task.estimation_end) && (
                                                            <div className="text-[11px] text-slate-500 font-medium">
                                                                {formatEstimationRange(task.estimation_start, task.estimation_end)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* View Tab 3: Per Aplikasi */}
                                {viewTab === 'applications' && (
                                    <div className="flex flex-1 flex-col rounded-3xl border border-white/55 bg-white/88 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:overflow-hidden">
                                        <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                                            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
                                                <Cpu className="h-5 w-5 text-purple-600" />
                                                Distribusi Pengerjaan per Aplikasi ({activeApplications.length})
                                            </h2>
                                        </div>

                                        <div className="grid flex-1 grid-cols-1 gap-3.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 no-scrollbar pr-1">
                                            {activeApplications.map((app) => (
                                                <div
                                                    key={app.id}
                                                    className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-sm transition hover:border-purple-300 hover:shadow-md"
                                                >
                                                    <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black text-white shadow-md"
                                                                style={{ backgroundColor: app.color }}
                                                            >
                                                                {app.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-bold text-slate-900">{app.name}</h3>
                                                                <p className="text-xs text-slate-500 line-clamp-1">{app.description || 'Tidak ada deskripsi'}</p>
                                                            </div>
                                                        </div>
                                                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                                                            {app.total_tasks}
                                                        </span>
                                                    </div>

                                                    <div className="my-3 grid grid-cols-3 gap-2 text-center text-xs">
                                                        <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-2">
                                                            <p className="text-[10px] font-semibold uppercase text-blue-700">Running</p>
                                                            <p className="text-base font-black text-blue-900">{app.in_progress_count}</p>
                                                        </div>
                                                        <div className="rounded-xl border border-purple-200 bg-purple-50/80 p-2">
                                                            <p className="text-[10px] font-semibold uppercase text-purple-700">Todo</p>
                                                            <p className="text-base font-black text-purple-900">{app.todo_count}</p>
                                                        </div>
                                                        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-2">
                                                            <p className="text-[10px] font-semibold uppercase text-amber-700">Review</p>
                                                            <p className="text-base font-black text-amber-900">{app.in_review_count}</p>
                                                        </div>
                                                    </div>

                                                    {/* Mini list of tasks inside app */}
                                                    <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                                                        {app.tasks.slice(0, 3).map((t) => (
                                                            <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
                                                                <span className="truncate pr-2 font-medium">{t.title}</span>
                                                                <span className={`shrink-0 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                                                                    t.status === 'in_progress' ? 'bg-blue-500 text-white' : 'border border-slate-200 bg-slate-200/80 text-slate-700'
                                                                }`}>
                                                                    {t.status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {app.tasks.length > 3 && (
                                                            <p className="pt-1 text-center text-[10px] text-slate-400">
                                                                +{app.tasks.length - 3} tiket lainnya
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* View Tab 4: Tim Programmer */}
                                {viewTab === 'team' && (
                                    <div className="flex flex-1 flex-col rounded-3xl border border-white/55 bg-white/88 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl lg:overflow-hidden">
                                        <div className="mb-3 flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                                            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 sm:text-lg">
                                                <Users className="h-5 w-5 text-emerald-600" />
                                                Aktivitas Tim Programmer ({activeProgrammers.length})
                                            </h2>
                                        </div>

                                        <div className="grid flex-1 grid-cols-1 gap-3.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 no-scrollbar pr-1">
                                            {activeProgrammers.map((prog) => (
                                                <div
                                                    key={prog.id}
                                                    className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-sm transition hover:border-emerald-300 hover:shadow-md"
                                                >
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 text-base font-bold text-white shadow-md">
                                                                {prog.name.slice(0, 2).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-bold text-slate-900">{prog.name}</h3>
                                                                <span className={`inline-block rounded-full px-2 py-0.2 text-[10px] font-semibold border ${
                                                                    prog.is_intern ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                }`}>
                                                                    {prog.role}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <span className="block text-lg font-black text-slate-900">{prog.total_assigned}</span>
                                                            <span className="text-[10px] text-slate-500">tiket</span>
                                                        </div>
                                                    </div>

                                                    <div className="my-2.5 flex items-center justify-between text-xs text-slate-600">
                                                        <span className="font-semibold text-blue-600">
                                                            {prog.in_progress_count} tiket sedang aktif
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
                                                        {prog.tasks.length === 0 ? (
                                                            <p className="py-4 text-center text-xs text-slate-400">Tidak ada tiket aktif</p>
                                                        ) : (
                                                            prog.tasks.map((t) => (
                                                                <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-200/60 bg-slate-50 p-2 text-xs text-slate-700">
                                                                    <div className="min-w-0 flex-1 pr-2">
                                                                        <p className="truncate font-medium text-slate-800">{t.title}</p>
                                                                        <span className="text-[10px] text-slate-500">{t.application?.name || 'Umum'}</span>
                                                                    </div>
                                                                    <span className={`shrink-0 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                                                                        t.status === 'in_progress' ? 'bg-blue-500 text-white' : 'border border-slate-200 bg-slate-200/80 text-slate-700'
                                                                    }`}>
                                                                        {t.status}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Deferred>
                </div>
            </div>
        </>
    );
}
