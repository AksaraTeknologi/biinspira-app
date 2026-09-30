'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface MonthOption {
    value: string;
    label: string;
}

interface Form2Payload {
    ad_result_id: string;
    ad_plan_id: string;
    event_id: string;
    platforms: any[];
    checkout_count: number | string;
    checkout_weekend: number | string;
    checkout_weekday: number | string;
    revenue: string;
    cost_month: string;
    cost_month_2: string;
    revenue_month: string;
}

export default function MarketingForm2() {
    const { props } = usePage();
    const { events, platforms, adPlan, adResultData, isAdmin }: any = props;

    const formatRupiah1 = (value?: string | number) => {
        if (value === null || value === undefined || value === '') return '';
        const clean = Math.floor(Number(value)).toString();
        if (clean === 'NaN') return '';
        return 'Rp ' + clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const toPlainNumber = (value: string) => {
        const clean = value.replace(/\D/g, '');
        return clean.replace(/^0+(?!$)/, '');
    };

    const formatNol = (value?: string | number) => {
        if (value === null || value === undefined || value === '') return '';
        const clean = value.toString().replace(/\D/g, '');
        return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const toNumberOnly = (value: string) => {
        if (value === null || value === undefined) return '';
        value = value.split('.')[0].split(',')[0];
        return value.replace(/[^0-9]/g, '');
    };

    const event = events || {};
    const platformList = Array.isArray(platforms) ? platforms : [];
    const isBrevet = Boolean(event?.name && /brevet/i.test(event.name));

    const getMonthOptions = (): MonthOption[] => {
        const options: MonthOption[] = [];
        const date = new Date();
        const start = new Date(date.getFullYear(), date.getMonth() - 12, 1);
        for (let i = 0; i <= 24; i++) {
            const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const val = `${y}-${m}`;
            const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            options.push({ value: val, label });
        }
        return options;
    };
    const monthOptions = useMemo(() => getMonthOptions(), []);

    const getPlatformKey = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('boost')) return 'boost';
        if (lower.includes('meta')) return 'meta';
        if (lower.includes('business')) return 'business';
        if (lower.includes('google ads')) return 'google_ads';
        if (lower.includes('media partner')) return 'media_partner';
        return lower;
    };

    const [tab, setTab] = useState(getPlatformKey(platformList[0]?.name || ''));
    const [showSecondCostMonth, setShowSecondCostMonth] = useState<boolean>(
        Boolean(adResultData?.adResult?.cost_month_2 || adPlan?.cost_month_2),
    );

    const { data, setData, post, processing, transform } = useForm<Form2Payload>({
        ad_result_id: adResultData?.adResult?.id || '',
        ad_plan_id: adPlan?.id || '',
        event_id: event?.id || '',
        platforms: [],
        checkout_count: adResultData?.adResult?.checkout_count || 0,
        checkout_weekend: adResultData?.adResult?.checkout_weekend ?? '',
        checkout_weekday: adResultData?.adResult?.checkout_weekday ?? '',
        revenue: toNumberOnly(adResultData?.adResult?.revenue?.toString() || ''),
        cost_month: adResultData?.adResult?.cost_month || adPlan?.cost_month || '',
        cost_month_2: adResultData?.adResult?.cost_month_2 || adPlan?.cost_month_2 || '',
        revenue_month: adResultData?.adResult?.revenue_month || adPlan?.revenue_month || '',
    });

    const [settingsState, setSettingsState] = useState<Record<string, any>>({});
    const [activeSettingIndex, setActiveSettingIndex] = useState<Record<number, number>>({});

    const hiddenFieldsByPlatform: Record<string, string[]> = {
        boost: ['result_ads', 'media_partner'],
        business: ['result_ads', 'media_partner'],
        meta: ['clicks', 'likes', 'saves', 'shares', 'profile_visits', 'folows', 'direct_messages', 'external_link_clicks', 'media_partner'],
        media_partner: ['result_ads'],
        google_ads: [
            'result_ads',
            'media_partner',
            'clicks',
            'likes',
            'saves',
            'shares',
            'profile_visits',
            'folows',
            'direct_messages',
            'external_link_clicks',
            'click_whatsapp',
            'chat_admin',
        ],
    };

    const capitalizeWords = (str: string) => {
        return str
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    };

    const isHidden = (field: string) => hiddenFieldsByPlatform[tab]?.includes(field);

    useEffect(() => {
        const newSettingsState: Record<string, any> = {};

        platformList.forEach((p: any) => {
            const settings = adResultData?.settingsByPlatform?.[p.id] || [];
            if (settings.length > 0) {
                settings.forEach((s: any, idx: number) => {
                    const key = s.ad_plan_platform_id || `${p.id}_${idx}`;
                    newSettingsState[key] = {
                        ad_plan_platform_id: s.ad_plan_platform_id,
                        platform_id: p.id,
                        setting_index: s.setting_index || idx + 1,
                        setting_name: s.setting_name || `Setting ${idx + 1}`,
                        total_cost: s.total_cost ?? 0,
                        cost_month_1_amount: s.cost_month_1_amount ?? '',
                        cost_month_2_amount: s.cost_month_2_amount ?? '',
                        reach: s.reach ?? 0,
                        impressions: s.impressions ?? 0,
                        media_partner: s.media_partner ?? '',
                        cost_per_result: s.cost_per_result ?? 0,
                        result_ads: s.result_ads ?? '',
                        clicks: s.clicks ?? 0,
                        likes: s.likes ?? 0,
                        saves: s.saves ?? 0,
                        shares: s.shares ?? 0,
                        profile_visits: s.profile_visits ?? 0,
                        folows: s.folows ?? 0,
                        direct_messages: s.direct_messages ?? 0,
                        external_link_clicks: s.external_link_clicks ?? 0,
                        click_whatsapp: s.click_whatsapp ?? 0,
                        chat_admin: s.chat_admin ?? 0,
                    };
                });
            } else {
                // Fallback from legacy adResultsByPlatform
                const existingData = adResultData?.adResultsByPlatform?.[p.id] || {};
                const m = existingData.adMetric || {};
                const r = existingData.adResultPlatform || {};
                const key = `${p.id}_0`;
                newSettingsState[key] = {
                    ad_plan_platform_id: null,
                    platform_id: p.id,
                    setting_index: 1,
                    setting_name: 'Setting 1',
                    total_cost: r.total_cost || 0,
                    cost_month_1_amount: r.cost_month_1_amount ?? '',
                    cost_month_2_amount: r.cost_month_2_amount ?? '',
                    reach: m.reach || 0,
                    impressions: m.impressions || 0,
                    media_partner: r.media_partner || '',
                    cost_per_result: m.cost_per_result || 0,
                    result_ads: m.result_ads ?? '',
                    clicks: m.clicks || 0,
                    likes: m.likes || 0,
                    saves: m.saves || 0,
                    shares: m.shares || 0,
                    profile_visits: m.profile_visits || 0,
                    folows: m.folows || 0,
                    direct_messages: m.direct_messages || 0,
                    external_link_clicks: m.external_link_clicks || 0,
                    click_whatsapp: m.click_whatsapp || 0,
                    chat_admin: m.chat_admin || 0,
                };
            }
        });

        setSettingsState(newSettingsState);
    }, [platformList, adResultData]);

    const handleSettingFieldChange = (key: string, field: string, value: any) => {
        setSettingsState((prev) => {
            const currentSetting = prev[key] || {};
            const updated = { ...currentSetting, [field]: value };

            if (field === 'cost_month_1_amount' || field === 'cost_month_2_amount') {
                const c1 = field === 'cost_month_1_amount' ? (Number(value) || 0) : (Number(currentSetting.cost_month_1_amount) || 0);
                const c2 = field === 'cost_month_2_amount' ? (Number(value) || 0) : (Number(currentSetting.cost_month_2_amount) || 0);
                updated.total_cost = c1 + c2;
            }

            return {
                ...prev,
                [key]: updated,
            };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const mergedPlatforms = Object.values(settingsState).map((s: any) => ({
            platform_id: s.platform_id,
            ad_plan_platform_id: s.ad_plan_platform_id || null,
            total_cost: Number(s.total_cost) || 0,
            cost_month_1_amount: showSecondCostMonth && s.cost_month_1_amount !== '' ? Number(s.cost_month_1_amount) : null,
            cost_month_2_amount: showSecondCostMonth && s.cost_month_2_amount !== '' ? Number(s.cost_month_2_amount) : null,
            reach: Number(s.reach) || 0,
            impressions: Number(s.impressions) || 0,
            cost_per_result: Number(s.cost_per_result) || 0,
            result_ads: s.result_ads !== '' ? Number(s.result_ads) : null,
            clicks: Number(s.clicks) || 0,
            likes: Number(s.likes) || 0,
            saves: Number(s.saves) || 0,
            shares: Number(s.shares) || 0,
            profile_visits: Number(s.profile_visits) || 0,
            folows: Number(s.folows) || 0,
            direct_messages: Number(s.direct_messages) || 0,
            external_link_clicks: Number(s.external_link_clicks) || 0,
            click_whatsapp: Number(s.click_whatsapp) || 0,
            chat_admin: Number(s.chat_admin) || 0,
            media_partner: s.media_partner || null,
        }));

        const finalCheckout = isBrevet
            ? (Number(data.checkout_weekend) || 0) + (Number(data.checkout_weekday) || 0)
            : Number(data.checkout_count) || 0;

        transform((curr) => ({
            ...curr,
            checkout_count: finalCheckout,
            cost_month: data.cost_month || null,
            cost_month_2: showSecondCostMonth ? (data.cost_month_2 || null) : null,
            revenue_month: data.revenue_month || null,
            platforms: mergedPlatforms,
        }));

        const submitRoute = isAdmin ? route('admin.marketing.result.store') : route('user.marketing.result.store');
        post(submitRoute);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Marketing', href: route('admin.marketing.index') }]}>
            <div className="w-full space-y-6 p-6">
                <h2 className="text-2xl font-semibold">Hasil Iklan</h2>

                <form onSubmit={handleSubmit}>
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader>
                            <CardTitle>Data Hasil Iklan</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            {/* EVENT */}
                            <div>
                                <Label>Nama Event</Label>
                                <Input value={event.name || ''} readOnly />
                            </div>

                            {/* CHECKOUT & REVENUE */}
                            {isBrevet ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Omset per Event</Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={13}
                                                required
                                                placeholder="Rp 0"
                                                value={formatRupiah1(data.revenue)}
                                                onChange={(e) => setData('revenue', toPlainNumber(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <Label>Total Checkout</Label>
                                            <Input
                                                type="text"
                                                readOnly
                                                className="bg-muted cursor-not-allowed font-semibold"
                                                value={formatNol(data.checkout_count) || '0'}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <Label>Hasil Brevet Weekend</Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={10}
                                                placeholder="Masukkan hasil checkout weekend"
                                                value={formatNol(data.checkout_weekend) || ''}
                                                onChange={(e) => {
                                                    const val = toPlainNumber(e.target.value);
                                                    const weekendNum = Number(val) || 0;
                                                    const weekdayNum = Number(data.checkout_weekday) || 0;
                                                    setData((prev) => ({
                                                        ...prev,
                                                        checkout_weekend: val,
                                                        checkout_count: weekendNum + weekdayNum,
                                                    }));
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label>Hasil Brevet Weekday</Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={10}
                                                placeholder="Masukkan hasil checkout weekday"
                                                value={formatNol(data.checkout_weekday) || ''}
                                                onChange={(e) => {
                                                    const val = toPlainNumber(e.target.value);
                                                    const weekdayNum = Number(val) || 0;
                                                    const weekendNum = Number(data.checkout_weekend) || 0;
                                                    setData((prev) => ({
                                                        ...prev,
                                                        checkout_weekday: val,
                                                        checkout_count: weekendNum + weekdayNum,
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label>Omset per Event</Label>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={13}
                                            required
                                            placeholder="Rp 0"
                                            value={formatRupiah1(data.revenue)}
                                            onChange={(e) => setData('revenue', toPlainNumber(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label>Jumlah Checkout</Label>
                                        <Input
                                            type="text"
                                            required
                                            inputMode="numeric"
                                            maxLength={10}
                                            placeholder="Masukkan jumlah checkout"
                                            value={formatNol(data.checkout_count) || ''}
                                            onChange={(e) => setData('checkout_count', toPlainNumber(e.target.value))}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ALOKASI BULAN PELAPORAN */}
                            <div className="rounded-lg border p-4 space-y-3 bg-card">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-medium text-sm">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span>Alokasi bulan pelaporan</span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                        onClick={() => {
                                            if (showSecondCostMonth) {
                                                setData('cost_month_2', '');
                                                setShowSecondCostMonth(false);
                                            } else {
                                                setShowSecondCostMonth(true);
                                            }
                                        }}
                                    >
                                        {showSecondCostMonth ? '- Hapus Bulan Biaya ke-2' : '+ Tambah Bulan Biaya Iklan (Spend 2 Bulan)'}
                                    </Button>
                                </div>
                                <div className={cn('grid grid-cols-1 gap-4', showSecondCostMonth ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
                                    <div>
                                        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                            <span>Biaya iklan masuk bulan {showSecondCostMonth ? '(Bulan 1)' : ''}</span>
                                        </Label>
                                        <Select value={data.cost_month || ''} onValueChange={(val) => setData('cost_month', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih bulan biaya iklan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {monthOptions.map((opt: MonthOption) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {showSecondCostMonth && (
                                        <div>
                                            <Label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                                <span>Biaya iklan masuk bulan (Bulan 2)</span>
                                            </Label>
                                            <Select value={data.cost_month_2 || ''} onValueChange={(val) => setData('cost_month_2', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih bulan biaya iklan ke-2" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {monthOptions.map((opt: MonthOption) => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div>
                                        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                            <span>Omset masuk bulan</span>
                                        </Label>
                                        <Select value={data.revenue_month || ''} onValueChange={(val) => setData('revenue_month', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih bulan omset" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {monthOptions.map((opt: MonthOption) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {showSecondCostMonth && data.cost_month && data.cost_month_2 ? (
                                    <p className="text-xs text-blue-500 flex items-center gap-1 font-medium">
                                        <span>ℹ</span> Biaya iklan dialokasikan ke 2 bulan: {monthOptions.find(o => o.value === data.cost_month)?.label || data.cost_month} & {monthOptions.find(o => o.value === data.cost_month_2)?.label || data.cost_month_2}.
                                    </p>
                                ) : data.cost_month && data.revenue_month && data.cost_month === data.revenue_month ? (
                                    <p className="text-xs text-green-500 flex items-center gap-1 font-medium">
                                        <span>✓</span> Biaya iklan dan omset sinkron di bulan yang sama.
                                    </p>
                                ) : data.cost_month && data.revenue_month ? (
                                    <p className="text-xs text-amber-500 flex items-center gap-1 font-medium">
                                        <span>ℹ</span> Biaya iklan dan omset dialokasikan pada bulan yang berbeda.
                                    </p>
                                ) : null}
                            </div>

                            {/* PLATFORM TABS */}
                            <Tabs value={tab} onValueChange={setTab}>
                                <TabsList
                                    className={`mb-4 flex w-full flex-row justify-start gap-3 overflow-x-auto`}
                                    style={{ scrollbarWidth: 'none' }}
                                >
                                    {platformList.map((p: any) => (
                                        <TabsTrigger key={p.id} value={getPlatformKey(p.name)} className="px-12">
                                            {p.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {platformList.map((p: any) => {
                                    const platformKey = getPlatformKey(p.name);
                                    const settingsList = adResultData?.settingsByPlatform?.[p.id] || [
                                        { ad_plan_platform_id: null, platform_id: p.id, setting_index: 1, setting_name: 'Setting 1' },
                                    ];
                                    const currentIdx = activeSettingIndex[p.id] ?? 0;
                                    const safeIdx = currentIdx < settingsList.length ? currentIdx : 0;
                                    const currentSettingMeta = settingsList[safeIdx];
                                    const currentKey = currentSettingMeta?.ad_plan_platform_id || `${p.id}_${safeIdx}`;
                                    const currentSettingValues = settingsState[currentKey] || {};

                                    // Calculate platform totals across all its settings:
                                    let platformTotalCost = 0;
                                    let platformTotalReach = 0;
                                    let platformTotalImpressions = 0;
                                    settingsList.forEach((s: any, idx: number) => {
                                        const k = s.ad_plan_platform_id || `${p.id}_${idx}`;
                                        const val = settingsState[k];
                                        if (val) {
                                            platformTotalCost += Number(val.total_cost) || 0;
                                            platformTotalReach += Number(val.reach) || 0;
                                            platformTotalImpressions += Number(val.impressions) || 0;
                                        }
                                    });

                                    const month1Label = monthOptions.find((o) => o.value === data.cost_month)?.label || data.cost_month || 'Bulan 1';
                                    const month2Label = monthOptions.find((o) => o.value === data.cost_month_2)?.label || data.cost_month_2 || 'Bulan 2';

                                    return (
                                        <TabsContent key={p.id} value={platformKey}>
                                            <div className="space-y-6">
                                                {/* SETTING PILLS (TABS) */}
                                                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-semibold text-muted-foreground mr-1">Setting Iklan:</span>
                                                        {settingsList.map((s: any, idx: number) => {
                                                            const isActive = idx === safeIdx;
                                                            return (
                                                                <button
                                                                    key={s.ad_plan_platform_id || idx}
                                                                    type="button"
                                                                    onClick={() => setActiveSettingIndex((prev) => ({ ...prev, [p.id]: idx }))}
                                                                    className={cn(
                                                                        'px-4 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm',
                                                                        isActive
                                                                            ? 'bg-blue-600 text-white font-semibold shadow'
                                                                            : 'bg-background hover:bg-muted text-muted-foreground border border-zinc-200 dark:border-zinc-700',
                                                                    )}
                                                                >
                                                                    {s.setting_name || `Setting ${idx + 1}`}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Platform Total Summary Pill */}
                                                    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground bg-background px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                                        <span>
                                                            Total Biaya {p.name}: <strong className="text-foreground">{formatRupiah1(platformTotalCost)}</strong>
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            Total Reach: <strong className="text-foreground">{formatNol(platformTotalReach)}</strong>
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            Total Impression: <strong className="text-foreground">{formatNol(platformTotalImpressions)}</strong>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* CURRENT SETTING HEADER & INPUTS */}
                                                <div className="border rounded-xl p-5 space-y-6 bg-card">
                                                    <div className="flex items-center justify-between border-b pb-3">
                                                        <h4 className="font-semibold text-base flex items-center gap-2">
                                                            <span>Input Metriks untuk:</span>
                                                            <span className="text-blue-600 dark:text-blue-400">
                                                                {currentSettingMeta?.setting_name || `Setting ${safeIdx + 1}`}
                                                            </span>
                                                        </h4>
                                                        {currentSettingMeta?.start_date && currentSettingMeta?.end_date && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Periode: {currentSettingMeta.start_date} s/d {currentSettingMeta.end_date}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* BIAYA & HASIL IKLAN */}
                                                    <div className="space-y-4">
                                                        {showSecondCostMonth && data.cost_month && data.cost_month_2 ? (
                                                            <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-3">
                                                                <Label className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                                                    Alokasi Biaya Iklan per Bulan ({currentSettingMeta?.setting_name || `Setting ${safeIdx + 1}`})
                                                                </Label>
                                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground mb-1">
                                                                            Biaya Masuk {month1Label}
                                                                        </Label>
                                                                        <Input
                                                                            type="text"
                                                                            inputMode="numeric"
                                                                            placeholder="Rp 0"
                                                                            maxLength={13}
                                                                            value={formatRupiah1(currentSettingValues.cost_month_1_amount)}
                                                                            onChange={(e) =>
                                                                                handleSettingFieldChange(
                                                                                    currentKey,
                                                                                    'cost_month_1_amount',
                                                                                    toPlainNumber(e.target.value),
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground mb-1">
                                                                            Biaya Masuk {month2Label}
                                                                        </Label>
                                                                        <Input
                                                                            type="text"
                                                                            inputMode="numeric"
                                                                            placeholder="Rp 0"
                                                                            maxLength={13}
                                                                            value={formatRupiah1(currentSettingValues.cost_month_2_amount)}
                                                                            onChange={(e) =>
                                                                                handleSettingFieldChange(
                                                                                    currentKey,
                                                                                    'cost_month_2_amount',
                                                                                    toPlainNumber(e.target.value),
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs font-semibold mb-1">
                                                                            Total Biaya Setting
                                                                        </Label>
                                                                        <Input
                                                                            type="text"
                                                                            readOnly
                                                                            className="bg-muted cursor-not-allowed font-semibold text-foreground"
                                                                            placeholder="Rp 0"
                                                                            value={formatRupiah1(currentSettingValues.total_cost)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                <div>
                                                                    <Label>
                                                                        Total Biaya Iklan ({currentSettingMeta?.setting_name || `Setting ${safeIdx + 1}`})
                                                                    </Label>
                                                                    <Input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        placeholder="Rp. 0"
                                                                        maxLength={13}
                                                                        value={formatRupiah1(currentSettingValues.total_cost)}
                                                                        onChange={(e) =>
                                                                            handleSettingFieldChange(currentKey, 'total_cost', toPlainNumber(e.target.value))
                                                                        }
                                                                    />
                                                                </div>
                                                                {!isHidden('result_ads') && (
                                                                    <div>
                                                                        <Label>Hasil Iklan</Label>
                                                                        <Input
                                                                            type="text"
                                                                            inputMode="text"
                                                                            placeholder="Masukkan hasil iklan"
                                                                            value={formatNol(currentSettingValues.result_ads)}
                                                                            onChange={(e) =>
                                                                                handleSettingFieldChange(currentKey, 'result_ads', toPlainNumber(e.target.value))
                                                                            }
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {showSecondCostMonth && data.cost_month && data.cost_month_2 && !isHidden('result_ads') && (
                                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                                <div>
                                                                    <Label>Hasil Iklan</Label>
                                                                    <Input
                                                                        type="text"
                                                                        inputMode="text"
                                                                        placeholder="Masukkan hasil iklan"
                                                                        value={formatNol(currentSettingValues.result_ads)}
                                                                        onChange={(e) =>
                                                                            handleSettingFieldChange(currentKey, 'result_ads', toPlainNumber(e.target.value))
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* METRIC UTAMA */}
                                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                        <div>
                                                            <Label>Reach</Label>
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                required
                                                                placeholder="Masukkan reach"
                                                                maxLength={10}
                                                                value={formatNol(currentSettingValues.reach) || ''}
                                                                onChange={(e) =>
                                                                    handleSettingFieldChange(currentKey, 'reach', toPlainNumber(e.target.value))
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Cost Per Result</Label>
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                required
                                                                placeholder="Rp. 0"
                                                                maxLength={13}
                                                                value={formatRupiah1(currentSettingValues.cost_per_result) || ''}
                                                                onChange={(e) =>
                                                                    handleSettingFieldChange(currentKey, 'cost_per_result', toPlainNumber(e.target.value))
                                                                }
                                                            />
                                                        </div>

                                                        <div className="md:col-span-2">
                                                            <Label>Impression</Label>
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                required
                                                                maxLength={10}
                                                                placeholder="Masukkan Impression"
                                                                value={formatNol(currentSettingValues.impressions) || ''}
                                                                onChange={(e) =>
                                                                    handleSettingFieldChange(currentKey, 'impressions', toPlainNumber(e.target.value))
                                                                }
                                                            />
                                                        </div>
                                                        {!isHidden('media_partner') && (
                                                            <div className="md:col-span-2">
                                                                <Label>Media Partner</Label>
                                                                <Textarea
                                                                    inputMode="text"
                                                                    placeholder="Masukkan media partner"
                                                                    value={currentSettingValues.media_partner || ''}
                                                                    onChange={(e) =>
                                                                        handleSettingFieldChange(currentKey, 'media_partner', e.target.value)
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* METRIC TAMBAHAN */}
                                                    <div className="mt-6 border-t pt-6">
                                                        <h3 className="mb-4 text-base font-semibold">
                                                            Metrics Tambahan ({currentSettingMeta?.setting_name || `Setting ${safeIdx + 1}`})
                                                        </h3>

                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            {[
                                                                'clicks',
                                                                'likes',
                                                                'saves',
                                                                'shares',
                                                                'profile_visits',
                                                                'folows',
                                                                'direct_messages',
                                                                'external_link_clicks',
                                                                'click_whatsapp',
                                                                'chat_admin',
                                                            ]
                                                                .filter((m) => !isHidden(m))
                                                                .map((metric) => (
                                                                    <div key={metric}>
                                                                        <Label>{capitalizeWords(metric)}</Label>
                                                                        <Input
                                                                            type="text"
                                                                            inputMode="numeric"
                                                                            maxLength={10}
                                                                            placeholder={`Masukkan ${capitalizeWords(metric)}`}
                                                                            value={formatNol(currentSettingValues[metric]) || ''}
                                                                            onChange={(e) =>
                                                                                handleSettingFieldChange(
                                                                                    currentKey,
                                                                                    metric,
                                                                                    toPlainNumber(e.target.value),
                                                                                )
                                                                            }
                                                                        />
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>

                            {/* BUTTONS */}
                            <div className="flex justify-between pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-gray-400 text-gray-700 hover:bg-gray-100"
                                    onClick={() => window.history.back()}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                </Button>

                                <Button type="submit" disabled={processing} className="bg-primary text-white hover:bg-blue-700">
                                    {processing ? 'Menyimpan...' : data.ad_result_id ? 'Perbarui' : 'Simpan'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
