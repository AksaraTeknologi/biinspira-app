import { cn } from '@/lib/utils';
import type { DrilldownMetric, PlatformStat } from '../types';
import { formatCurrency } from '../utils';
import ChangeBadge from './change-badge';

type CardProps = {
    item: PlatformStat;
    className?: string;
    onOpenDetail: (platformKey: string, metric: DrilldownMetric) => void;
};

function PlatformLogo({ item }: { item: PlatformStat }) {
    if (item.logo) {
        return <img src={item.logo} alt={item.label} className="max-h-9 w-auto max-w-28 object-contain" />;
    }

    return (
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white">
            <span className="text-xs font-bold text-slate-600">{item.label.slice(0, 2).toUpperCase()}</span>
        </div>
    );
}

export function PlatformStatCardGrid({ item, className, onOpenDetail }: CardProps) {
    return (
        <div
            className={cn(
                'flex min-h-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/55 bg-white/88 p-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur xl:p-3',
                className,
            )}
        >
            <div className="mb-1.5 flex items-center justify-between gap-2 shrink-0">
                <h2 className="truncate text-lg font-bold text-slate-800 xl:text-xl" title={item.label}>
                    {item.label}
                </h2>
                <div className="flex min-h-7 shrink-0 items-center justify-end">
                    <PlatformLogo item={item} />
                </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-2 min-h-0 overflow-hidden sm:grid-cols-3">
                <div className="flex min-w-0 min-h-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 xl:p-2.5">
                    <p className="mb-0.5 truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-sm">otal Tahun Ini</p>
                    <p
                        className="my-auto truncate text-base font-bold tracking-tight text-slate-800 sm:text-lg xl:text-xl 2xl:text-2xl"
                        title={formatCurrency(item.total)}
                    >
                        {formatCurrency(item.total)}
                    </p>
                    <div className="invisible mt-0.5 shrink-0" aria-hidden="true">
                        <ChangeBadge percentage={0} direction="flat" />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onOpenDetail(item.key, 'month')}
                    className="flex min-w-0 min-h-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:cursor-pointer hover:border-sky-300 hover:bg-sky-50 xl:p-2.5"
                >
                    <p className="mb-0.5 truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-sm">Bulan Ini</p>
                    <p
                        className="my-auto truncate text-base font-bold tracking-tight text-slate-800 sm:text-lg xl:text-xl 2xl:text-2xl"
                        title={formatCurrency(item.this_month)}
                    >
                        {formatCurrency(item.this_month)}
                    </p>
                    <div className="mt-0.5 shrink-0">
                        <ChangeBadge percentage={item.month_change_percentage} direction={item.month_change_direction} />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onOpenDetail(item.key, 'day')}
                    className="flex min-w-0 min-h-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 text-left transition hover:cursor-pointer hover:border-sky-300 hover:bg-sky-50 xl:p-2.5"
                >
                    <p className="mb-0.5 truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-sm">Hari Ini</p>
                    <p
                        className="my-auto truncate text-base font-bold tracking-tight text-slate-800 sm:text-lg xl:text-xl 2xl:text-2xl"
                        title={formatCurrency(item.today)}
                    >
                        {formatCurrency(item.today)}
                    </p>
                    <div className="mt-0.5 shrink-0">
                        <ChangeBadge percentage={item.day_change_percentage} direction={item.day_change_direction} />
                    </div>
                </button>
            </div>
        </div>
    );
}

export function PlatformStatCardCarousel({ item, className, onOpenDetail }: CardProps) {
    return (
        <div
            className={cn(
                'flex h-full min-h-0 flex-col rounded-2xl border border-white/55 bg-white/88 p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur',
                className,
            )}
        >
            <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-800">{item.label}</h2>
                <div className="flex min-h-9 items-center justify-end">
                    <PlatformLogo item={item} />
                </div>
            </div>

            <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2.5">
                <div className="col-span-2 flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total Tahun Ini</p>
                    <p className="text-[clamp(1.5rem,2.1vw,2.4rem)] leading-tight font-bold tracking-tight text-slate-800">
                        {formatCurrency(item.total)}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onOpenDetail(item.key, 'month')}
                    className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
                >
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Bulan Ini</p>
                    <p className="text-[clamp(1.3rem,1.6vw,2rem)] leading-tight font-bold tracking-tight text-slate-800">
                        {formatCurrency(item.this_month)}
                    </p>
                    <div className="mt-auto pt-2">
                        <ChangeBadge percentage={item.month_change_percentage} direction={item.month_change_direction} />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">Rincian per bulan</p>
                </button>

                <button
                    type="button"
                    onClick={() => onOpenDetail(item.key, 'day')}
                    className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
                >
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Hari Ini</p>
                    <p className="text-[clamp(1.3rem,1.6vw,2rem)] leading-tight font-bold tracking-tight text-slate-800">
                        {formatCurrency(item.today)}
                    </p>
                    <div className="mt-auto pt-2">
                        <ChangeBadge percentage={item.day_change_percentage} direction={item.day_change_direction} />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">Rincian per hari</p>
                </button>
            </div>
        </div>
    );
}
