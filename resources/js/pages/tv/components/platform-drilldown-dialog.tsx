import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';
import type { DrilldownData } from '../types';
import { formatCompactCurrency, formatCurrency } from '../utils';

type PlatformDrilldownDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading: boolean;
    error: string | null;
    data: DrilldownData | null;
    platformLogo?: string | null;
};

function getPlatformInitials(label?: string) {
    if (!label) {
        return 'NA';
    }

    return label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

export default function PlatformDrilldownDialog({ open, onOpenChange, loading, error, data, platformLogo }: PlatformDrilldownDialogProps) {
    const chartConfig = {
        value: {
            label: 'Nominal',
            color: 'var(--chart-2)',
        },
    } satisfies ChartConfig;

    const chartData = useMemo(() => {
        if (!data) {
            return [];
        }

        return data.points.map((point) => ({
            period: point.label,
            value: point.value,
        }));
    }, [data]);

    const chartWidth = useMemo(() => {
        const minWidth = 620;
        const maxWidth = 1600;
        const calculatedWidth = chartData.length * 52;

        return Math.min(maxWidth, Math.max(minWidth, calculatedWidth));
    }, [chartData]);

    const monthlyMinChartWidth = useMemo(() => {
        const minWidth = 620;
        const calculatedWidth = chartData.length * 52;

        return Math.max(minWidth, calculatedWidth);
    }, [chartData]);

    const isMonthlyMetric = data?.metric === 'month';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] overflow-hidden sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{data?.title ?? 'Rincian Statistik'}</DialogTitle>
                    <DialogDescription>{data ? data.subtitle : 'Memuat data rincian...'}</DialogDescription>
                </DialogHeader>

                {data ? (
                    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        {platformLogo ? (
                            <img src={platformLogo} alt={data.platform_label} className="h-8 w-auto max-w-16 object-contain" />
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-600">
                                {getPlatformInitials(data.platform_label)}
                            </div>
                        )}
                        <div className="min-w-0 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">{data.platform_label}</span>
                            <span className="truncate text-slate-500"> • {data.subtitle}</span>
                        </div>
                    </div>
                ) : null}

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <Skeleton key={item} className="h-9 w-full" />
                        ))}
                    </div>
                ) : null}

                {!loading && error ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
                ) : null}

                {!loading && !error && data ? (
                    <div className="min-w-0 space-y-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            Total Periode: <span className="font-semibold text-slate-900">{formatCurrency(data.total)}</span>
                        </div>

                        <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
                            <ChartContainer
                                config={chartConfig}
                                className="aspect-auto w-full"
                                style={{
                                    width: isMonthlyMetric ? `max(100%, ${monthlyMinChartWidth}px)` : `${chartWidth}px`,
                                    height: '360px',
                                }}
                            >
                                <BarChart
                                    accessibilityLayer
                                    data={chartData}
                                    margin={{
                                        top: 20,
                                        left: 8,
                                        right: 8,
                                        bottom: 8,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        interval={0}
                                        tickFormatter={(value) => {
                                            const period = String(value);

                                            if (isMonthlyMetric) {
                                                return period.slice(0, 3);
                                            }

                                            return period.length > 7 ? `${period.slice(0, 7)}...` : period;
                                        }}
                                        angle={!isMonthlyMetric && chartData.length > 16 ? -35 : 0}
                                        textAnchor={!isMonthlyMetric && chartData.length > 16 ? 'end' : 'middle'}
                                        height={!isMonthlyMetric && chartData.length > 16 ? 62 : 34}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent
                                                indicator="line"
                                                formatter={(value, _name, item) => (
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-muted-foreground">{item.payload.period}</span>
                                                        <span className="font-medium text-foreground">{formatCurrency(Number(value) || 0)}</span>
                                                    </div>
                                                )}
                                            />
                                        }
                                    />
                                    <Bar dataKey="value" fill="var(--color-value)" radius={8}>
                                        <LabelList
                                            dataKey="value"
                                            position="top"
                                            offset={12}
                                            className="fill-foreground"
                                            fontSize={11}
                                            formatter={(value: number) => formatCompactCurrency(value)}
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
