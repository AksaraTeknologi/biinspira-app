'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MarketingForm2() {
    const { props } = usePage();
    const { events, platforms, adPlan, adResultData, isAdmin }: any = props;

    const formatRupiah = (value: string | number) => {
        if (!value) return '';
        const numberString = value.toString().replace(/[^,\d]/g, '');
        const integerPart = numberString;
        const remainder = integerPart.length % 3;

        let rupiah = integerPart.substr(0, remainder);
        const thousands = integerPart.substr(remainder).match(/\d{3}/g);

        if (thousands) {
            rupiah += (remainder ? '.' : '') + thousands.join('.');
        }

        return rupiah ? 'Rp ' + rupiah : '';
    };

    const toPlainNumber = (value: string) => {
        if (!value) return '';
        return value.replace(/[^0-9]/g, '');
    };

    const formatNol = (value: string | number) => {
        if (!value) return '';

        let numberString = value.toString().replace(/[^0-9]/g, '');
        numberString = numberString.split(',')[0].split('.')[0];

        const remainder = numberString.length % 3;
        let formatted = numberString.substr(0, remainder);
        const thousands = numberString.substr(remainder).match(/\d{3}/g);

        if (thousands) {
            formatted += (remainder ? '.' : '') + thousands.join('.');
        }

        return formatted;
    };

    // !! beberapa masih di pakai
    const toNumberOnly = (value: string) => {
        if (!value) return '';
        value = value.split('.')[0].split(',')[0];
        return value.replace(/[^0-9]/g, '');
    };
    const event = events || {};
    const platformList = Array.isArray(platforms) ? platforms : [];

    const getPlatformKey = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('boost')) return 'boost';
        if (lower.includes('meta')) return 'meta';
        if (lower.includes('business')) return 'business';
        return lower;
    };
    const [tab, setTab] = useState(getPlatformKey(platformList[0]?.name || ''));
    const { data, setData, post, processing } = useForm({
        ad_result_id: adResultData?.adResult?.id || '',
        ad_plan_id: adPlan?.id || '',
        event_id: event?.id || '',
        platforms: [],
        checkout_count: adResultData?.adResult?.checkout_count || '',
        revenue: toNumberOnly(adResultData?.adResult?.revenue?.toString() || ''),
    });

    const [platformData, setPlatformData] = useState<Record<number, any>>({});
    const hiddenFieldsByPlatform: Record<string, string[]> = {
        boost: ['result_ads'],
        business: ['result_ads'],
        meta: ['clicks', 'likes', 'saves', 'shares', 'profile_visits', 'folows', 'direct_messages', 'external_link_clicks'],
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
                total_cost: r.total_cost || '',
                reach: m.reach || '',
                impressions: m.impressions || '',
                cost_per_result: m.cost_per_result || '',
                result_ads: m.result_ads || '',
                clicks: m.clicks || '',
                likes: m.likes || '',
                saves: m.saves || '',
                shares: m.shares || '',
                profile_visits: m.profile_visits || '',
                folows: m.folows || '',
                direct_messages: m.direct_messages || '',
                external_link_clicks: m.external_link_clicks || '',
            };
        });

        setPlatformData(newPlatformData);
    }, [platformList, adResultData]);

    useEffect(() => {
        if (Object.keys(platformData).length > 0) {
            const mapped = Object.keys(platformData).map((pid) => ({
                platform_id: Number(pid),
                ...platformData[pid],
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const mergedPlatforms = data.platforms.map((p) => ({
            ...p,
            ...platformData[p.platform_id],
        }));
        setData('platforms', mergedPlatforms);
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
                                <Input value={event.name || ''} disabled />
                            </div>

                            {/* CHECKOUT & REVENUE */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label>Omset per Event</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={13}
                                        required
                                        placeholder="Rp 0"
                                        value={formatRupiah(data.revenue)}
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
                                        value={formatNol(data.checkout_count)}
                                        onChange={(e) => setData('checkout_count', toPlainNumber(e.target.value))}
                                    />
                                </div>
                            </div>

                            {/* PLATFORM TABS */}
                            <Tabs value={tab} onValueChange={setTab}>
                                <TabsList className={`mb-4 grid w-full grid-cols-${platformList.length}`}>
                                    {platformList.map((p) => (
                                        <TabsTrigger key={p.id} value={getPlatformKey(p.name)}>
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
                                                            inputMode="numeric"
                                                            placeholder="Rp.0"
                                                            value={formatRupiah(platformData[p.id]?.result_ads) || ''}
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
                                                        value={formatRupiah(platformData[p.id]?.total_cost) || ''}
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
                                                        value={formatRupiah(platformData[p.id]?.cost_per_result) || ''}
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

                                <Button type="submit" disabled={processing} className="bg-blue-600 text-white hover:bg-blue-700">
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
