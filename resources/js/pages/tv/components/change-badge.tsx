import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

type ChangeBadgeProps = {
    percentage: number;
    direction: 'up' | 'down' | 'flat';
};

export default function ChangeBadge({ percentage, direction }: ChangeBadgeProps) {
    const styles =
        direction === 'up'
            ? 'border-emerald-400/80 bg-emerald-100 text-emerald-800'
            : direction === 'down'
              ? 'border-rose-400/80 bg-rose-100 text-rose-800'
              : 'border-slate-300/80 bg-slate-100 text-slate-700';

    const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : ArrowRight;
    const valueText = direction === 'up' ? `+${percentage.toFixed(2)}%` : direction === 'down' ? `-${percentage.toFixed(2)}%` : '0%';

    return (
        <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold sm:text-base xl:text-lg ${styles}`}>
            <Icon className="h-3 w-3 shrink-0 stroke-[2.5]" />
            <span>{valueText}</span>
        </span>
    );
}
