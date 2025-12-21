import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

export interface AdPlanData {
    id: string | null;
    user_name: string | null;
    ad_schedule_time: string | null;
    title_flayer: string | null;
    image_flayer: string | null;
    name_event: string | null;
    status: string | null;
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
    checkout_count: number;
    revenue: number;
    result_platforms: ResultPlatformData[] | ResultPlatformData | null;
}

export interface ResultPlatformData {
    result: number;
    total_cost: number;
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

export interface AdPlanProps {
    data?: AdPlanData;
}

export default function MarketingShow({ data }: AdPlanProps) {
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
        const name = platformName ?? `platform-${index + 1}`;
        return name.toString().toLowerCase().replace(/\s+/g, '-');
    };

    const [planTab, setPlanTab] = useState<string>(() => {
        return platformList.length ? getPlatformKey(platformList[0].platform_name ?? platformList[0].name ?? undefined, 0) : 'platforms';
    });

    const [resultTab, setResultTab] = useState<string>(() => {
        return resultList.length ? getPlatformKey(resultPlatformList[0].platform_name ?? undefined, 0) : 'platforms';
    });

    function renderAlphabetList(value: string | null | undefined) {
        if (!value) return <div className="mt-1">-</div>;

        const parts = value.split(';').map((v) => v.trim());

        if (parts.length <= 1) {
            return <div className="mt-1">- {parts[0]}</div>;
        }

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
                                                className="max-h-[300px] w-auto rounded-md border border-zinc-300 object-contain shadow transition hover:opacity-90"
                                            />
                                        </a>

                                        {/* ACTIONS */}
                                        <div className="flex gap-2">
                                            <Button asChild variant="outline" size="sm">
                                                <a href={data.image_flayer} target="_blank" rel="noopener noreferrer">
                                                    Preview
                                                </a>
                                            </Button>

                                            <Button asChild size="sm">
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
                                                const name = p.platform_name ?? p.name ?? `Platform ${idx + 1}`;
                                                const key = getPlatformKey(name, idx);
                                                return (
                                                    <TabsTrigger key={key} value={key}>
                                                        {name}
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
                                                            <Label>Taget Audiens (Value)</Label>
                                                            <div className="mt-1">{p.targetValue ?? '-'}</div>
                                                        </div>
                                                        <div>
                                                            <Label>Taget Audiens (Type)</Label>
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
                                                                <Label>Type Audiens (targeted)</Label>
                                                                {renderAlphabetList(p.type_targeted)}
                                                            </div>

                                                            <div>
                                                                <Label>Detail Audiens (targeted)</Label>
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
                                                <div className="mt-1">{firstResult?.checkout_count ?? '-'}</div>
                                            </div>
                                            <div>
                                                <Label>Omset Per Event</Label>
                                                <div className="mt-1">Rp {firstResult?.revenue ?? '-'}</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="w-full border-zinc-200 shadow-md">
                                    <CardContent>
                                        <Tabs value={resultTab} onValueChange={setResultTab}>
                                            <TabsList
                                                className="mb-4 grid w-full"
                                                style={{
                                                    gridTemplateColumns: `repeat(${Math.max(1, resultPlatformList.length)}, minmax(0, 1fr))`,
                                                }}
                                            >
                                                {resultPlatformList.map((p, idx) => {
                                                    const name = p.platform_name ?? `Platform ${idx + 1}`;
                                                    const key = getPlatformKey(name, idx);
                                                    return (
                                                        <TabsTrigger key={key} value={key}>
                                                            {name}
                                                        </TabsTrigger>
                                                    );
                                                })}
                                            </TabsList>

                                            {resultPlatformList.map((p, idx) => {
                                                const name = p.platform_name ?? `Platform ${idx + 1}`;
                                                const key = getPlatformKey(name, idx);

                                                // find the corresponding result platform by name, fallback to index
                                                const rp =
                                                    resultPlatformList.find(
                                                        (r) =>
                                                            (r.platform_name ?? '').toString().toLowerCase() ===
                                                            (name ?? '').toString().toLowerCase(),
                                                    ) ?? resultPlatformList?.[idx];

                                                // metrics can be an array; take first metrics entry if present
                                                const metrics = rp?.metrics ? (Array.isArray(rp.metrics) ? rp.metrics[0] : rp.metrics) : undefined;

                                                return (
                                                    <TabsContent key={key} value={key}>
                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            {(() => {
                                                                const isBoost = (rp?.platform_name ?? '')
                                                                    .toString()
                                                                    .toLowerCase()
                                                                    .includes('boost post');
                                                                return (
                                                                    <div className={isBoost ? 'hidden' : ''}>
                                                                        <Label>Hasil Iklan</Label>
                                                                        <div className="mt-1">{metrics?.result_ads ?? rp?.result ?? '-'}</div>
                                                                    </div>
                                                                );
                                                            })()}
                                                            <div>
                                                                <Label>Total Biaya Iklan</Label>
                                                                <div className="mt-1">Rp {rp?.total_cost ?? '-'}</div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            <div>
                                                                <Label>Reach</Label>
                                                                <div className="mt-1">{metrics?.reach ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Impression</Label>
                                                                <div className="mt-1">{metrics?.impressions ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>CPR</Label>
                                                                <div className="mt-1">{metrics?.cpr ?? '-'}</div>
                                                            </div>
                                                        </div>
                                                        <h2 className="mt-3 text-lg font-semibold">Metrics tambahan</h2>
                                                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            <div>
                                                                <Label>Clicks</Label>
                                                                <div className="mt-1">{metrics?.clicks ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Likes</Label>
                                                                <div className="mt-1">{metrics?.likes ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Saves</Label>
                                                                <div className="mt-1">{metrics?.saves ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Shares</Label>
                                                                <div className="mt-1">{metrics?.shares ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Profile Visits</Label>
                                                                <div className="mt-1">{metrics?.profile_visits ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Follows</Label>
                                                                <div className="mt-1">{metrics?.follows ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Direct Messages</Label>
                                                                <div className="mt-1">{metrics?.direct_messages ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>External Link Clicks</Label>
                                                                <div className="mt-1">{metrics?.external_link_clicks ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Click WhatsApp</Label>
                                                                <div className="mt-1">{metrics?.click_whatsapp ?? '-'}</div>
                                                            </div>
                                                            <div>
                                                                <Label>Chat Admin</Label>
                                                                <div className="mt-1">{metrics?.chat_admin ?? '-'}</div>
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
            </div>
        </AppLayout>
    );
}
