import { Skeleton } from '@/components/ui/skeleton';
import { Deferred, Head, router } from '@inertiajs/react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect } from 'react';

type PlatformStat = {
    key: string;
    label: string;
    logo?: string | null;
    total: number;
    this_month: number;
    today: number;
    month_change_percentage: number;
    month_change_direction: 'up' | 'down' | 'flat';
    day_change_percentage: number;
    day_change_direction: 'up' | 'down' | 'flat';
};

interface TvDashboardProps {
    platformStats?: PlatformStat[];
    generatedAt: string;
}

function StatsSkeletonGrid() {
    return (
        <div className="grid grid-cols-1 gap-3 pb-3 md:grid-cols-2 lg:h-[calc(100%-84px)] lg:overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((card) => (
                <div key={card} className="flex min-h-0 flex-col rounded-2xl border border-white/55 bg-white/88 p-3.5 md:h-full">
                    <div className="mb-2.5 flex items-center justify-between">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                    <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-3">
                        {[1, 2, 3].map((box) => (
                            <div key={box} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                                <Skeleton className="mb-2 h-3 w-16" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="mt-2 h-6 w-28 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function ChangeBadge({ percentage, direction, label }: { percentage: number; direction: 'up' | 'down' | 'flat'; label: string }) {
    const styles =
        direction === 'up'
            ? 'border-emerald-300/60 bg-emerald-100 text-emerald-700'
            : direction === 'down'
              ? 'border-rose-300/60 bg-rose-100 text-rose-700'
              : 'border-slate-300/70 bg-slate-100 text-slate-700';

    const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : ArrowRight;
    const text = direction === 'flat' ? 'Stabil' : `${percentage.toFixed(2)}%`;

    return (
        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${styles}`}>
            <Icon className="h-3 w-3" />
            <span>
                {label}: {text}
            </span>
        </div>
    );
}

export default function TvDashboard({ platformStats, generatedAt }: TvDashboardProps) {
    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({
                only: ['platformStats', 'generatedAt'],
            });
        }, 300000);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <>
            <Head title="Statistik TV" />
            <div className="min-h-screen overflow-y-auto bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center md:h-screen md:overflow-hidden">
                <div className="min-h-screen w-full bg-slate-900/18 px-4 py-4 backdrop-blur-[1px] sm:px-6 sm:py-5 lg:h-full lg:px-8 lg:py-6">
                    <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                            <p className="text-xs tracking-[0.28em] text-slate-100/90 uppercase">LIVE MONITORING BIINSPIRA GROUP</p>
                            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-5xl">
                                Pendapatan Tiap Platform
                            </h1>
                        </div>
                        <p className="rounded-full border border-white/45 bg-white/20 px-3 py-1.5 text-xs font-medium text-white sm:text-sm">
                            Update: {new Date(generatedAt).toLocaleString('id-ID')}
                        </p>
                    </div>

                    <Deferred data="platformStats" fallback={<StatsSkeletonGrid />}>
                        <div className="grid grid-cols-1 gap-3 pb-3 md:grid-cols-2 lg:h-[calc(100%-84px)] lg:overflow-hidden">
                            {(platformStats ?? []).map((item) => (
                                <div
                                    key={item.key}
                                    className="flex min-h-0 flex-col rounded-2xl border border-white/55 bg-white/88 p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur md:h-full"
                                >
                                    <div className="mb-2.5 flex items-center justify-between">
                                        <h2 className="text-2xl font-semibold text-slate-800">{item.label}</h2>
                                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-slate-300 bg-white">
                                            {item.logo ? (
                                                <img src={item.logo} alt={item.label} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-slate-600">{item.label.slice(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-3">
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                                            <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total</p>
                                            <p className="text-xl leading-tight font-bold text-slate-800 lg:text-2xl">{formatCurrency(item.total)}</p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                                            <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Bulan Ini</p>
                                            <p className="text-xl leading-tight font-bold text-slate-800 lg:text-2xl">
                                                {formatCurrency(item.this_month)}
                                            </p>
                                            <div className="mt-1.5">
                                                <ChangeBadge
                                                    percentage={item.month_change_percentage}
                                                    direction={item.month_change_direction}
                                                    label="vs bulan lalu"
                                                />
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                                            <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Hari Ini</p>
                                            <p className="text-xl leading-tight font-bold text-slate-800 lg:text-2xl">{formatCurrency(item.today)}</p>
                                            <div className="mt-1.5">
                                                <ChangeBadge
                                                    percentage={item.day_change_percentage}
                                                    direction={item.day_change_direction}
                                                    label="vs kemarin"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Deferred>
                </div>
            </div>
        </>
    );
}
