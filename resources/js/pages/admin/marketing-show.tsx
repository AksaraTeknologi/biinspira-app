import GraphShow from '@/components/custom/graphshow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { SharedData } from '@/types';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { usePage } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface AdPlanData {
    id: string | null;
    user_name: string | null;
    ad_schedule_time: string | null;
    title_flayer: string | null;
    image_flayer: string | null;
    name_event: string | null;
    status: string | null;

    batch?: number | string | null;
    previous_batch?: number | string | null;
    event_batch?: number | string | null;
    cost_month?: string | null;
    cost_month_2?: string | null;
    revenue_month?: string | null;

    platforms: PlatformData[] | PlatformData | null;
    result: ResultData[] | null;
    evaluation: EvaluationData[] | null;
}

export interface PlatformData {
    start_date?: string;
    end_date?: string;
    platform_name?: string | null;
    goal_name?: string | null;
    targetType?: string;
    targetValue?: number;
    daily_budget?: number;

    // broad
    age_broad?: string | null;
    location_broad?: string | null;

    // targeted
    age_targeted?: string | null;
    location_targeted?: string | null;
    type_targeted?: string | null;
    name_targeted?: string | null;

    // optional extras (some payloads use id/name)
    id?: number | string;
    name?: string | null;
}

export interface ResultData {
    checkout_count: number | string;
    checkout_weekend?: number | string | null;
    checkout_weekday?: number | string | null;
    cost_month?: string | null;
    cost_month_2?: string | null;
    revenue_month?: string | null;
    revenue: number | string;
    result_platforms: ResultPlatformData[] | ResultPlatformData | null;
}

export interface ResultPlatformData {
    id?: string;
    ad_plan_platform_id?: string | null;
    setting_name?: string | null;
    result: number;
    total_cost: number;
    cost_month_1_amount?: string | number | null;
    cost_month_2_amount?: string | number | null;
    platform_name?: string | null;
    metrics: MetricsData[] | null;
}

export interface MetricsData {
    reach: number;
    impressions: number;
    cpr: number;
    clicks: number;
    likes: number;
    saves: number;
    shares: number;
    profile_visits: number;
    follows: number;
    direct_messages: number;
    external_link_clicks: number;
    result_ads: number;
    click_whatsapp: number;
    chat_admin: number;
}

export interface EvaluationData {
    previous_event: string | null;
    previous_checkout: number;
    previous_ad_performance: string | null;
    previous_other_performance: string | null;
    current_checkout: number;
    current_ad_performance: string | null;
    current_other_performance: string | null;
    next_ad_strategy: string | null;
}

export interface AdPlanProps extends InertiaPageProps {
    data?: AdPlanData;
    graphData?: {
        bulanan: RawDataMonthly[];
        mingguan: RawDataWeekly[];
        event: RawDataEvent[];
    };
}

interface RawDataMonthly {
    month: string;
    pendapatan: number;
    pengeluaran: number;
    audience: number;
}

interface RawDataWeekly {
    week: string;
    pendapatan: number;
    pengeluaran: number;
    audience: number;
}

interface RawDataEvent {
    event_name: string;
    event_label: string;
    pendapatan: number;
    pengeluaran: number;
    audience: number;
}

export default function MarketingShow({}: AdPlanProps) {
    const { data, graphData } = usePage<PageProps>().props;
    console.log('PAGE PROPS:', data, graphData);
    const [openPlan, setOpenPlan] = useState(true);
    const [openResult, setOpenResult] = useState(true);
    const [openEvaluation, setOpenEvaluation] = useState(true);

    const platformList: PlatformData[] = data?.platforms ? (Array.isArray(data.platforms) ? data.platforms : [data.platforms]) : [];
    const resultList: ResultData[] = data?.result ? (Array.isArray(data.result) ? data.result : [data.result]) : [];

    const resultPlatformList: ResultPlatformData[] = resultList?.[0]?.result_platforms
        ? Array.isArray(resultList[0].result_platforms)
            ? resultList[0].result_platforms
            : [resultList[0].result_platforms]
        : [];

    const evaluationList: EvaluationData[] = data?.evaluation ? (Array.isArray(data.evaluation) ? data.evaluation : [data.evaluation]) : [];

    const firstResult = resultList[0];
    const firstEvaluation = evaluationList[0];

    const getPlatformKey = (platformName: string | undefined | null, index = 0) => {
        const name = platformName ?? `platform`;
        return `${name.toString().toLowerCase().replace(/\s+/g, '-')}-${index}`;
    };

    const [planTab, setPlanTab] = useState<string>(() => {
        return platformList.length ? getPlatformKey(platformList[0].platform_name ?? platformList[0].name ?? undefined, 0) : 'platforms-0';
    });

    const platformGroupMap = useMemo(() => {
        const map: Record<string, ResultPlatformData[]> = {};
        resultPlatformList.forEach((rp, idx) => {
            const pName = rp.platform_name || `Platform ${idx + 1}`;
            if (!map[pName]) map[pName] = [];
            map[pName].push(rp);
        });
        return map;
    }, [resultPlatformList]);

    const uniquePlatformNames = Object.keys(platformGroupMap);
    const [selectedSettingByPlatform, setSelectedSettingByPlatform] = useState<Record<string, number>>({});

    const [resultTab, setResultTab] = useState<string>(() => {
        return uniquePlatformNames.length ? uniquePlatformNames[0] : 'platforms';
    });

    function renderAlphabetList(value: string | null | undefined) {
        if (!value) return <div className="mt-1">-</div>;

        const parts = value.split(';').map((v) => v.trim());

        if (parts.length <= 1) {
            return <div className="mt-1">- {parts[0]}</div>;
        }

        console.log(data);

        return (
            <ul className="mt-1 space-y-1">
                {parts.map((item, idx) => {
                    const label = String.fromCharCode(97 + idx); // 97 = 'a'
                    return (
                        <li key={idx} className="flex gap-2">
                            <span>{label}.</span>
                            <span>{item}</span>
                        </li>
                    );
                })}
            </ul>
        );
    }

    const { auth } = usePage<SharedData>().props;
    const userRole = auth.role[0];

    const breadcrumbs = [{ title: 'Marketing', href: route('admin.marketing.index') }];

    interface PageProps extends InertiaPageProps {
        data: AdPlanData;
        graphData: {
            bulanan: RawDataMonthly[];
            mingguan: RawDataWeekly[];
            event: RawDataEvent[];
        };
    }

    interface RawDataMonthly {
        month: string;
        pengeluaran: number;
        pendapatan: number;
        audience: number;
    }

    interface RawDataWeekly {
        week: string;
        pendapatan: number;
        pengeluaran: number;
        audience: number;
    }

    interface RawDataEvent {
        event_name: string;
        event_label: string;
        pendapatan: number;
        pengeluaran: number;
        audience: number;
    }

    console.log('GRAPH DATA BULANAN:', graphData?.bulanan);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full space-y-6 p-6">
                <div className="flex flex-row justify-between">
                    <h2 className="text-2xl font-semibold">Detail Marketing</h2>
                    <Button
                        onClick={() => {
                            const id = data?.id;
                            if (!id) return;
                            const url = userRole === 'admin' ? route('admin.marketing.print', id) : route('user.marketing.print', id);
                            window.open(url, '_blank');
                        }}
                        className="dark:bg-blue-700 dark:hover:bg-primary"
                    >
                        Print PDF
                    </Button>
                </div>
                <Card className="w-full border-zinc-200 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>Persiapan Iklan</div>
                        <Button onClick={() => setOpenPlan(!openPlan)} variant="outline">
                            {openPlan ? <Minus size={10} /> : <Plus size={10} />}
                        </Button>
                    </CardHeader>
                    {openPlan && (
                        <CardContent className="flex flex-col gap-y-3">
                            <Card className="w-full border-zinc-200 shadow-md">
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div>
                                            <Label>Nama Event</Label>
                                            <div className="mt-1">{data?.name_event || '-'}</div>
                                        </div>
                                        <div>
                                            <Label>Pemilik Rencana</Label>
                                            <div className="mt-1">{data?.user_name || '-'}</div>
                                        </div>
                                        <div>
                                            <Label>Status</Label>
                                            <div className="mt-1">{data?.status || '-'}</div>
                                        </div>
                                        <div>
                                            <Label>Batch</Label>
                                            <div className="mt-1">{data?.batch || '-'}</div>
                                        </div>
                                        <div>
                                            <Label>Jadwal Tayang Iklan</Label>
                                            <div className="mt-1">{data?.ad_schedule_time || '-'}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            {data?.image_flayer && (
                                <Card className="w-full border-zinc-200 shadow-md">
                                    <CardHeader>
                                        <Label>Gambar Flayer</Label>
                                    </CardHeader>

                                    <CardContent className="flex flex-col items-center gap-3">
                                        <a href={data.image_flayer} target="_blank" rel="noopener noreferrer" className="block">
                                            <img
                                                src={data.image_flayer}
                                                alt={data.title_flayer ?? 'Flayer Image'}
                                                className="max-h-75 w-auto rounded-md border border-zinc-300 object-contain shadow transition hover:opacity-90"
                                            />
                                        </a>

                                        {/* ACTIONS */}
                                        <div className="flex gap-2">
                                            <Button asChild variant="outline" size="sm">
                                                <a href={data.image_flayer} target="_blank" rel="noopener noreferrer">
                                                    Preview
                                                </a>
                                            </Button>

                                            <Button asChild size="sm" className="dark:bg-blue-700 dark:hover:bg-primary">
                                                <a href={data.image_flayer} download>
                                                    Download
                                                </a>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            <Card className="w-full border-zinc-200 shadow-md">
                                <CardContent>
                                    <Tabs value={planTab} onValueChange={setPlanTab}>
                                        <TabsList
                                            className="mb-4 grid w-full"
                                            style={{
                                                gridTemplateColumns: `repeat(${Math.max(1, platformList.length)}, minmax(0, 1fr))`,
                                            }}
                                        >
                                            {platformList.map((p, idx) => {
                                                const baseName = p.platform_name ?? p.name ?? `Platform ${idx + 1}`;
                                                const samePlatformSettings = platformList.filter(
                                                    (item) => (item.platform_name ?? item.name) === baseName,
                                                );
                                                let displayName = baseName;
                                                if (samePlatformSettings.length > 1) {
                                                    const settingNum = samePlatformSettings.findIndex((item) => item === p) + 1;
                                                    displayName = `${baseName} (Setting ${settingNum})`;
                                                }
                                                const key = getPlatformKey(baseName, idx);
                                                return (
                                                    <TabsTrigger key={key} value={key}>
                                                        {displayName}
                                                    </TabsTrigger>
                                                );
                                            })}
                                        </TabsList>

                                        {platformList.map((p, idx) => {
                                            const name = p.platform_name ?? p.name ?? `Platform ${idx + 1}`;
                                            const key = getPlatformKey(name, idx);
                                            return (
                                                <TabsContent key={key} value={key}>
                                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                        <div>
                                                            <Label>Periode</Label>
                                                            <div className="mt-1">
                                                                {p.start_date || '-'} — {p.end_date || '-'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label>Goal</Label>
                                                            <div className="mt-1">{p.goal_name || '-'}</div>
                                                        </div>
                                                        <div>
                                                            <Label>Budget Harian</Label>
                                                            <div className="mt-1">Rp {p.daily_budget ?? '-'}</div>
                                                        </div>
                                                        <div>
                                                            <Label>Jumlah Target Peserta (Value)</Label>
                                                            <div className="mt-1">{p.targetValue ?? '-'}</div>
                                                        </div>
                                                        <div>
                                                            <Label>Tipe Target Peserta (Type)</Label>
                                                            <div className="mt-1">{p.targetType || '-'}</div>
                                                        </div>
                                                    </div>
                                                    {(p.targetType === 'broad' || p.targetType === 'combined') && (
                                                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            <div>
                                                                <Label>Age (broad)</Label>
                                                                <div className="mt-1">{p.age_broad || '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Location (broad)</Label>
                                                                <div className="mt-1">{p.location_broad || '-'}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(p.targetType === 'targeted' || p.targetType === 'combined') && (
                                                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            <div>
                                                                <Label>Age (targeted)</Label>
                                                                <div className="mt-1">{p.age_targeted || '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Location (targeted)</Label>
                                                                <div className="mt-1">{p.location_targeted || '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Type Peserta (targeted)</Label>
                                                                {renderAlphabetList(p.type_targeted)}
                                                            </div>

                                                            <div>
                                                                <Label>Detail Peserta (targeted)</Label>
                                                                {renderAlphabetList(p.name_targeted)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </CardContent>
                    )}
                </Card>

                {resultList && resultList.length ? (
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>Hasil Iklan</div>
                            <Button onClick={() => setOpenResult(!openResult)} variant="outline">
                                {openResult ? <Minus size={10} /> : <Plus size={10} />}
                            </Button>
                        </CardHeader>
                        {openResult && (
                            <CardContent className="flex flex-col gap-y-3">
                                <Card className="w-full border-zinc-200 shadow-md">
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                            <div>
                                                <Label>Nama Event</Label>
                                                <div className="mt-1">{data?.name_event || '-'}</div>
                                            </div>
                                            <div>
                                                <Label>Jumlah Checkout</Label>
                                                <div className="mt-1 font-semibold">{firstResult?.checkout_count ?? '-'}</div>
                                                {(firstResult?.checkout_weekend != null || firstResult?.checkout_weekday != null) && (
                                                    <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                                        <span>Weekend: <strong className="text-foreground">{firstResult?.checkout_weekend ?? 0}</strong></span>
                                                        <span>•</span>
                                                        <span>Weekday: <strong className="text-foreground">{firstResult?.checkout_weekday ?? 0}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <Label>Omset Per Event</Label>
                                                <div className="mt-1">Rp {firstResult?.revenue ?? '-'}</div>
                                            </div>
                                        </div>
                                        {(data?.cost_month || data?.revenue_month || firstResult?.cost_month || firstResult?.revenue_month) && (
                                            <div className="mt-4 pt-3 border-t grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                                                <div>
                                                    <span className="text-muted-foreground">Alokasi Biaya Iklan Masuk Bulan:</span>{' '}
                                                    <span className="font-semibold text-foreground">
                                                        {firstResult?.cost_month || data?.cost_month || '-'}
                                                        {(firstResult?.cost_month_2 || data?.cost_month_2) ? ` & ${firstResult?.cost_month_2 || data?.cost_month_2}` : ''}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Alokasi Omset Masuk Bulan:</span>{' '}
                                                    <span className="font-semibold text-foreground">{firstResult?.revenue_month || data?.revenue_month || '-'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="w-full border-zinc-200 shadow-md">
                                    <CardContent>
                                        <Tabs value={resultTab} onValueChange={setResultTab}>
                                            <TabsList
                                                className="mb-4 grid w-full"
                                                style={{
                                                    gridTemplateColumns: `repeat(${Math.max(1, uniquePlatformNames.length)}, minmax(0, 1fr))`,
                                                }}
                                            >
                                                {uniquePlatformNames.map((name) => (
                                                    <TabsTrigger key={name} value={name}>
                                                        {name}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>

                                            {uniquePlatformNames.map((pName) => {
                                                const settingsForPlatform = platformGroupMap[pName] || [];
                                                const currentSettingIdx = selectedSettingByPlatform[pName] ?? 0;
                                                const isTotalView = currentSettingIdx === -1;
                                                const activeSetting = !isTotalView
                                                    ? settingsForPlatform[currentSettingIdx] || settingsForPlatform[0]
                                                    : null;

                                                // Calculate platform total
                                                let totalCost = 0;
                                                let totalReach = 0;
                                                let totalImpressions = 0;
                                                let totalCPR = 0;
                                                let totalClicks = 0;
                                                let totalLikes = 0;
                                                let totalSaves = 0;
                                                let totalShares = 0;
                                                let totalProfileVisits = 0;
                                                let totalFollows = 0;
                                                let totalDirectMessages = 0;
                                                let totalExternalLinkClicks = 0;
                                                let totalClickWhatsapp = 0;
                                                let totalChatAdmin = 0;
                                                let totalResultAds = 0;

                                                settingsForPlatform.forEach((item: ResultPlatformData) => {
                                                    const m = item.metrics ? (Array.isArray(item.metrics) ? item.metrics[0] : item.metrics) : undefined;
                                                    totalCost += Number(String(item.total_cost || 0).replace(/\D/g, '')) || 0;
                                                    totalReach += Number(String(m?.reach || 0).replace(/\D/g, '')) || 0;
                                                    totalImpressions += Number(String(m?.impressions || 0).replace(/\D/g, '')) || 0;
                                                    totalClicks += Number(String(m?.clicks || 0).replace(/\D/g, '')) || 0;
                                                    totalLikes += Number(String(m?.likes || 0).replace(/\D/g, '')) || 0;
                                                    totalSaves += Number(String(m?.saves || 0).replace(/\D/g, '')) || 0;
                                                    totalShares += Number(String(m?.shares || 0).replace(/\D/g, '')) || 0;
                                                    totalProfileVisits += Number(String(m?.profile_visits || 0).replace(/\D/g, '')) || 0;
                                                    totalFollows += Number(String(m?.follows || 0).replace(/\D/g, '')) || 0;
                                                    totalDirectMessages += Number(String(m?.direct_messages || 0).replace(/\D/g, '')) || 0;
                                                    totalExternalLinkClicks += Number(String(m?.external_link_clicks || 0).replace(/\D/g, '')) || 0;
                                                    totalClickWhatsapp += Number(String(m?.click_whatsapp || 0).replace(/\D/g, '')) || 0;
                                                    totalChatAdmin += Number(String(m?.chat_admin || 0).replace(/\D/g, '')) || 0;
                                                    totalResultAds += Number(String(m?.result_ads || item.result || 0).replace(/\D/g, '')) || 0;
                                                });
                                                totalCPR = totalResultAds > 0 ? Math.round(totalCost / totalResultAds) : (settingsForPlatform.length > 0 ? Math.round(totalCost / settingsForPlatform.length) : 0);

                                                const activeMetrics = activeSetting?.metrics
                                                    ? (Array.isArray(activeSetting.metrics) ? activeSetting.metrics[0] : activeSetting.metrics)
                                                    : undefined;

                                                const isBoost = pName.toLowerCase().includes('boost post');

                                                return (
                                                    <TabsContent key={pName} value={pName}>
                                                        {/* Setting pills if platform has multiple settings */}
                                                        {settingsForPlatform.length > 1 && (
                                                            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                                <span className="text-xs font-semibold text-muted-foreground mr-1">Setting Iklan:</span>
                                                                {settingsForPlatform.map((s: ResultPlatformData, idx: number) => (
                                                                    <button
                                                                        key={s.id || idx}
                                                                        type="button"
                                                                        onClick={() => setSelectedSettingByPlatform((prev) => ({ ...prev, [pName]: idx }))}
                                                                        className={cn(
                                                                            'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm',
                                                                            currentSettingIdx === idx
                                                                                ? 'bg-blue-600 text-white font-semibold'
                                                                                : 'bg-background hover:bg-muted text-muted-foreground border border-zinc-200 dark:border-zinc-700',
                                                                        )}
                                                                    >
                                                                        {s.setting_name || `Setting ${idx + 1}`}
                                                                    </button>
                                                                ))}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedSettingByPlatform((prev) => ({ ...prev, [pName]: -1 }))}
                                                                    className={cn(
                                                                        'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ml-auto',
                                                                        isTotalView
                                                                            ? 'bg-blue-600 text-white font-semibold'
                                                                            : 'bg-background hover:bg-muted text-muted-foreground border border-zinc-200 dark:border-zinc-700',
                                                                    )}
                                                                >
                                                                    Total ({pName})
                                                                </button>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            {!isBoost && (
                                                                <div>
                                                                    <Label>Hasil Iklan {!isTotalView && activeSetting?.setting_name ? `(${activeSetting.setting_name})` : '(Total)'}</Label>
                                                                    <div className="mt-1 font-medium">
                                                                        {!isTotalView
                                                                            ? (activeMetrics?.result_ads ?? activeSetting?.result ?? '-')
                                                                            : totalResultAds.toLocaleString('id-ID')}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <Label>Total Biaya Iklan {!isTotalView && activeSetting?.setting_name ? `(${activeSetting.setting_name})` : '(Total)'}</Label>
                                                                <div className="mt-1 font-medium">
                                                                    Rp {!isTotalView
                                                                        ? (activeSetting?.total_cost ?? '-')
                                                                        : totalCost.toLocaleString('id-ID')}
                                                                </div>
                                                                {!isTotalView && (activeSetting?.cost_month_1_amount || activeSetting?.cost_month_2_amount) && (
                                                                    <div className="text-xs text-muted-foreground mt-1 space-x-2">
                                                                        {activeSetting.cost_month_1_amount && <span>Bulan 1: <strong>Rp {activeSetting.cost_month_1_amount}</strong></span>}
                                                                        {activeSetting.cost_month_1_amount && activeSetting.cost_month_2_amount && <span>•</span>}
                                                                        {activeSetting.cost_month_2_amount && <span>Bulan 2: <strong>Rp {activeSetting.cost_month_2_amount}</strong></span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            <div>
                                                                <Label>Reach</Label>
                                                                <div className="mt-1">
                                                                    {!isTotalView ? (activeMetrics?.reach ?? '-') : totalReach.toLocaleString('id-ID')}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label>Impression</Label>
                                                                <div className="mt-1">
                                                                    {!isTotalView ? (activeMetrics?.impressions ?? '-') : totalImpressions.toLocaleString('id-ID')}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label>CPR</Label>
                                                                <div className="mt-1">
                                                                    {!isTotalView ? (activeMetrics?.cpr ?? '-') : `Rp ${totalCPR.toLocaleString('id-ID')}`}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <h2 className="mt-3 text-lg font-semibold">
                                                            Metrics Tambahan {!isTotalView && activeSetting?.setting_name ? `(${activeSetting.setting_name})` : '(Total)'}
                                                        </h2>
                                                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            <div>
                                                                <Label>Clicks</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.clicks ?? '-') : totalClicks.toLocaleString('id-ID')}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Likes</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.likes ?? '-') : totalLikes.toLocaleString('id-ID')}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Saves</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.saves ?? '-') : totalSaves.toLocaleString('id-ID')}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Shares</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.shares ?? '-') : totalShares.toLocaleString('id-ID')}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Profile Visits</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.profile_visits ?? '-') : totalProfileVisits.toLocaleString('id-ID')}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Follows</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.follows ?? '-') : totalFollows.toLocaleString('id-ID')}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Direct Messages</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.direct_messages ?? '-') : totalDirectMessages.toLocaleString('id-ID')}</div>
                                                            </div>
                                                            <div>
                                                                <Label>External Link Clicks</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.external_link_clicks ?? '-') : totalExternalLinkClicks.toLocaleString('id-ID')}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Click WhatsApp</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.click_whatsapp ?? '-') : totalClickWhatsapp.toLocaleString('id-ID')}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Chat Admin</Label>
                                                                <div className="mt-1">{!isTotalView ? (activeMetrics?.chat_admin ?? '-') : totalChatAdmin.toLocaleString('id-ID')}</div>
                                                            </div>
                                                        </div>
                                                    </TabsContent>
                                                );
                                            })}
                                        </Tabs>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        )}
                    </Card>
                ) : (
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader>Hasil Iklan Belum Dibuat</CardHeader>
                    </Card>
                )}

                {evaluationList && evaluationList.length ? (
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>Evaluasi Iklan</div>
                            <Button onClick={() => setOpenEvaluation(!openEvaluation)} variant="outline">
                                {openEvaluation ? <Minus size={10} /> : <Plus size={10} />}
                            </Button>
                        </CardHeader>
                        {openEvaluation && (
                            <CardContent className="flex flex-col gap-y-3">
                                <Card className="w-full border-zinc-200 shadow-md">
                                    <CardContent className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Nama Event</Label>
                                            <div className="mt-1">{data?.name_event || '-'}</div>
                                        </div>
                                        <div>
                                            <Label>Nama Event Sebelumnya</Label>
                                            <div className="mt-1">{firstEvaluation?.previous_event || '-'}</div>
                                        </div>
                                        <div>
                                            <Label>Batch Iklan</Label>
                                            <div>{data?.batch || '-'}</div>
                                        </div>

                                        <div>
                                            <Label>Batch Event</Label>
                                            <div>{data?.event_batch || '-'}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="w-full border-zinc-200 shadow-md">
                                    <CardHeader>Kinerja Events</CardHeader>
                                    <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="flex flex-col gap-y-3">
                                            <div>
                                                <Label>Checkout Event Sekarang</Label>
                                                <div className="mt-1">{firstEvaluation?.current_checkout ?? '-'}</div>
                                            </div>
                                            <div>
                                                <Label>Kinerja Iklan Sekarang</Label>
                                                <div className="mt-1">{firstEvaluation?.current_ad_performance || '-'}</div>
                                            </div>
                                            <div>
                                                <Label>Kinerja Lain Sekarang</Label>
                                                <div className="mt-1">{firstEvaluation?.current_other_performance || '-'}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-y-3">
                                            <div>
                                                <Label>Checkout Event Sebelumnya</Label>
                                                <div className="mt-1">{firstEvaluation?.previous_checkout ?? '-'}</div>
                                            </div>
                                            <div>
                                                <Label>Kinerja Iklan Sebelumnya</Label>
                                                <div className="mt-1">{firstEvaluation?.previous_ad_performance || '-'}</div>
                                            </div>
                                            <div>
                                                <Label>Kinerja Lain Sebelumnya</Label>
                                                <div className="mt-1">{firstEvaluation?.previous_other_performance || '-'}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="w-full border-zinc-200 shadow-md">
                                    <CardContent>
                                        <Label>Strategi Iklan Selanjutnya</Label>
                                        <div className="mt-1">{firstEvaluation?.next_ad_strategy || '-'}</div>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        )}
                    </Card>
                ) : (
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader>Evaluasi Iklan Belum Dibuat</CardHeader>
                    </Card>
                )}

                {/* ================= GRAPH SECTION ================= */}

                <Card className="w-full border-zinc-200 shadow-md">
                    <CardHeader>
                        <div>Grafik Performa Iklan {data?.name_event || '-'} </div>
                    </CardHeader>
                    <CardContent>
                        {graphData ? (
                            <div className="h-100 w-full">
                                <GraphShow RawData={graphData} />
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">Tidak ada data grafik</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
