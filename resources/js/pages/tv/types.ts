export type PlatformStat = {
    key: string;
    label: string;
    logo?: string | null;
    total: number;
    this_month: number;
    last_month?: number;
    today: number;
    yesterday?: number;
    month_change_percentage: number;
    month_change_direction: 'up' | 'down' | 'flat';
    day_change_percentage: number;
    day_change_direction: 'up' | 'down' | 'flat';
    avg_change_percentage: number;
    avg_change_direction: 'up' | 'down' | 'flat';
    monthly_avg: number;
};

export interface TvDashboardProps {
    platformStats?: PlatformStat[];
    generatedAt: string;
}

export type DashboardViewMode = 'grid' | 'carousel';
export type DrilldownMetric = 'month' | 'day';

export type GroupPlatformInfo = {
    key: string;
    label: string;
    logo?: string | null;
};

export type DrilldownPoint = {
    key: string;
    label: string;
    value: number;
    change_percentage?: number;
    change_direction?: 'up' | 'down' | 'flat';
    avg_change_percentage?: number;
    avg_change_direction?: 'up' | 'down' | 'flat';
    avg_value?: number;
    platforms?: Record<string, number>;
};

export type DrilldownData = {
    platform: string;
    platform_label: string;
    metric: DrilldownMetric;
    title: string;
    subtitle: string;
    points: DrilldownPoint[];
    platforms?: GroupPlatformInfo[];
    total: number;
    generated_at: string;
};

export type TimeBasedMessage = {
    emoji: string;
    title: string;
    message: string;
};

export type MonthlyComparisonItem = {
    month: number;
    month_key: string;
    month_name: string;
    short_name: string;
    omset_2025: number;
    omset_2026: number;
    difference: number;
    growth_percentage: number;
    growth_direction: 'up' | 'down' | 'flat';
    cumulative_2025: number;
    cumulative_2026: number;
    platforms_2025: Record<string, number>;
    platforms_2026: Record<string, number>;
    is_current_or_past: boolean;
};

export type PlatformComparisonItem = {
    key: string;
    label: string;
    logo: string | null;
    total_2025: number;
    total_2026: number;
    difference: number;
    growth_percentage: number;
    growth_direction: 'up' | 'down' | 'flat';
    share_2025: number;
    share_2026: number;
};

export type OmsetSummary = {
    total_2025: number;
    total_2026: number;
    difference: number;
    growth_percentage: number;
    growth_direction: 'up' | 'down' | 'flat';
    ytd_2025: number;
    ytd_2026: number;
    ytd_difference: number;
    ytd_growth_percentage: number;
    ytd_growth_direction: 'up' | 'down' | 'flat';
    current_month_name: string;
    monthly_avg_2025: number;
    monthly_avg_2026: number;
    best_month_2025: { month: string; value: number };
    best_month_2026: { month: string; value: number };
};

export type ComparisonData = {
    summary: OmsetSummary;
    monthly_comparison: MonthlyComparisonItem[];
    platform_comparison: PlatformComparisonItem[];
    platforms: { key: string; label: string; logo: string | null }[];
    generated_at: string;
};

export interface StatisticsOmsetProps {
    comparisonData?: ComparisonData;
    generatedAt: string;
}