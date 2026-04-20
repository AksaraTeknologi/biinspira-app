import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';

type ChangeBadgeProps = {
    percentage: number;
    direction: 'up' | 'down' | 'flat';
    label: string;
};

export default function ChangeBadge({ percentage, direction, label }: ChangeBadgeProps) {
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
