'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
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

    // !! beberapa masih di pakai
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
        revenue_month: adResultData?.adResult?.revenue_month || adPlan?.revenue_month || '',
    });

    const [platformData, setPlatformData] = useState<Record<number, any>>({});
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
        const newPlatformData: Record<number, any> = {};

        platformList.forEach((p) => {
            const existingData = adResultData?.adResultsByPlatform?.[p.id] || {};
            const m = existingData.adMetric || {};
            const r = existingData.adResultPlatform || {};

            newPlatformData[p.id] = {
                total_cost: r.total_cost || 0,
                reach: m.reach || 0,
                impressions: m.impressions || 0,
                media_partner: r.media_partner || '',
                cost_per_result: m.cost_per_result || 0,
                result_ads: m.result_ads,
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
        });

        setPlatformData(newPlatformData);
    }, [platformList, adResultData]);

    useEffect(() => {
        if (Object.keys(platformData).length > 0) {
            const mapped = Object.keys(platformData).map((pid) => ({
                platform_id: Number(pid),
                ...platformData[Number(pid)],
            }));

            setData('platforms', mapped);
        }
    }, [platformData]);

    const handleFieldChange = (platformId: number, field: string, value: string) => {
        setPlatformData((prev) => ({
            ...prev,
            [platformId]: {
                ...(prev[platformId] || {}),
                [field]: value,
            },
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mergedPlatforms = platformList.map((p) => ({
            platform_id: p.id,
            ...(platformData[p.id] || {}),
        }));

        const finalCheckout = isBrevet
            ? (Number(data.checkout_weekend) || 0) + (Number(data.checkout_weekday) || 0)
            : Number(data.checkout_count) || 0;

        transform((curr) => ({
            ...curr,
            checkout_count: finalCheckout,
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
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span>Alokasi bulan pelaporan</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                            <span>Biaya iklan masuk bulan</span>
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
                                {data.cost_month && data.revenue_month && data.cost_month === data.revenue_month ? (
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
                                    {platformList.map((p) => (
                                        <TabsTrigger key={p.id} value={getPlatformKey(p.name)} className="px-20">
                                            {p.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {platformList.map((p) => (
                                    <TabsContent key={p.id} value={getPlatformKey(p.name)}>
                                        <div className="space-y-6">
                                            {/* BIAYA & HASIL IKLAN */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                {!isHidden('result_ads') && (
                                                    <div>
                                                        <Label>Hasil Iklan</Label>
                                                        <Input
                                                            type="text"
                                                            inputMode="text"
                                                            placeholder="Masukkan hasil iklan"
                                                            value={formatNol(platformData[p.id]?.result_ads)}
                                                            onChange={(e) => handleFieldChange(p.id, 'result_ads', toPlainNumber(e.target.value))}
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <Label>Total Biaya Iklan</Label>
                                                    <Input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder="Rp. 0"
                                                        maxLength={13}
                                                        value={formatRupiah1(platformData[p.id]?.total_cost)}
                                                        onChange={(e) => handleFieldChange(p.id, 'total_cost', toPlainNumber(e.target.value))}
                                                    />
                                                </div>
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
                                                        value={formatNol(platformData[p.id]?.reach) || ''}
                                                        onChange={(e) => handleFieldChange(p.id, 'reach', toPlainNumber(e.target.value))}
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
                                                        value={formatRupiah1(platformData[p.id]?.cost_per_result) || ''}
                                                        onChange={(e) => handleFieldChange(p.id, 'cost_per_result', toPlainNumber(e.target.value))}
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
                                                        value={formatNol(platformData[p.id]?.impressions) || ''}
                                                        onChange={(e) => handleFieldChange(p.id, 'impressions', toPlainNumber(e.target.value))}
                                                    />
                                                </div>
                                                {!isHidden('media_partner') && (
                                                    <div>
                                                        <Label>Media Partner</Label>
                                                        <Textarea
                                                            inputMode="text"
                                                            placeholder="Masukkan media partner"
                                                            value={platformData[p.id]?.media_partner || ''}
                                                            onChange={(e) => handleFieldChange(p.id, 'media_partner', e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* METRIC TAMBAHAN */}
                                            <div className="mt-6 border-t pt-6">
                                                <h3 className="mb-4 text-lg font-semibold">Metrics Tambahan</h3>

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
                                                    ]
                                                        .filter((f) => !isHidden(f))
                                                        .map((field) => (
                                                            <div key={field}>
                                                                <Label>{capitalizeWords(field)}</Label>
                                                                <Input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    maxLength={10}
                                                                    placeholder={'Masukkan ' + capitalizeWords(field)}
                                                                    value={formatNol(platformData[p.id]?.[field]) || ''}
                                                                    onChange={(e) => handleFieldChange(p.id, field, toPlainNumber(e.target.value))}
                                                                />
                                                            </div>
                                                        ))}
                                                    {!isHidden('click_whatsapp') && (
                                                        <div>
                                                            <Label>Chat Whatsapp</Label>
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                maxLength={10}
                                                                placeholder={'Masukkan jumlah Chat whatsapp'}
                                                                value={formatNol(platformData[p.id]?.click_whatsapp) || ''}
                                                                onChange={(e) =>
                                                                    handleFieldChange(p.id, 'click_whatsapp', toPlainNumber(e.target.value))
                                                                }
                                                            />
                                                        </div>
                                                    )}
                                                    {!isHidden('chat_admin') && (
                                                        <div>
                                                            <Label>Chat Whatsapp Admin</Label>
                                                            <Input
                                                                type="text"
                                                                inputMode="numeric"
                                                                maxLength={10}
                                                                placeholder={'Masukkan jumlah Chat whatsapp admin'}
                                                                value={formatNol(platformData[p.id]?.chat_admin) || ''}
                                                                onChange={(e) => handleFieldChange(p.id, 'chat_admin', toPlainNumber(e.target.value))}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
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
