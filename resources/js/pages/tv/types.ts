export type PlatformStat = {
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

export interface TvDashboardProps {
    platformStats?: PlatformStat[];
    generatedAt: string;
}

export type DashboardViewMode = 'grid' | 'carousel';
export type DrilldownMetric = 'month' | 'day';

export type DrilldownPoint = {
    key: string;
    label: string;
    value: number;
};

export type DrilldownData = {
    platform: string;
    platform_label: string;
    metric: DrilldownMetric;
    title: string;
    subtitle: string;
    points: DrilldownPoint[];
    total: number;
    generated_at: string;
};

export type TimeBasedMessage = {
    emoji: string;
    title: string;
    message: string;
};
