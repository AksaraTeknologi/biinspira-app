'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useEffect } from 'react';

export default function MarketingEval() {
    const { props }: any = usePage();
    const { isAdmin } = props;
    const { currentPlan, prevEvaluation, previousPlan, adResult, previousAdResult, adEvaluation } = props;

    const currentCheckout = adResult?.checkout_count || 0;
    const previousCheckoutFromResult = previousAdResult?.checkout_count || 0;

    // === Determine CASE ===
    const isFirstBatch = prevEvaluation === null;
    const cleanNumberFromDB = (value: string | number) => {
        if (value === null || value === undefined) return '';
        let num = parseFloat(value.toString());
        if (isNaN(num)) return '';
        num = Math.floor(num);
        return num.toString();
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
    const buildCurrentAdPerformance = () => {
        if (!adResult) return '';

        const revenue = adResult.revenue ?? 0;
        const checkout = adResult.checkout_count ?? 0;
        const platforms = adResult.result_platforms ?? [];

        const platformTotals: string[] = [];

        platforms.forEach((platform: any) => {
            const platformName = platform.platform?.name ?? '-';
            const platformCost = platform.total_cost ?? 0;

            let reach = 0;
            let impression = 0;

            platform.metrics?.forEach((metric: any) => {
                reach += Number(metric.reach ?? 0);
                impression += Number(metric.impressions ?? 0);
            });

            platformTotals.push(
                `Total Biaya Iklan (${platformName}) : ${formatNol(cleanNumberFromDB(platformCost))}
Total Reach (${platformName}) : ${formatNol(cleanNumberFromDB(reach))}
Total Impression (${platformName}) : ${formatNol(cleanNumberFromDB(impression))}`,
            );
        });

        return `Omset per Event : ${formatNol(cleanNumberFromDB(revenue))}
Jumlah Checkout : ${formatNol(cleanNumberFromDB(checkout))}

${platformTotals.join('\n\n')}`;
    };

    const previousEventName = isFirstBatch ? prevEvaluation?.plan?.event?.name : previousPlan?.event?.name;
    const previousCheckoutValue = isFirstBatch ? (adEvaluation?.previous_checkout ?? previousCheckoutFromResult) : previousCheckoutFromResult;

    const previousAdPerfValue = isFirstBatch ? adEvaluation?.previous_ad_performance : prevEvaluation?.current_ad_performance;
    const previousOtherPerfValue = isFirstBatch ? adEvaluation?.previous_other_performance : prevEvaluation?.current_other_performance;

    const { data, setData, post, processing } = useForm({
        ad_plan_id: currentPlan.id,
        current_event_name: currentPlan.event.name,
        previous_event_name: previousEventName || currentPlan.event.name || '-',
        current_checkout: adEvaluation?.current_checkout ?? currentCheckout,
        previous_checkout: previousCheckoutValue,
        previous_ad_performance: previousAdPerfValue,
        current_ad_performance: adEvaluation?.current_ad_performance || '',
        previous_other_performance: previousOtherPerfValue,
        current_other_performance: adEvaluation?.current_other_performance || '',
        next_ad_strategy: adEvaluation?.next_ad_strategy || '',
    });
    useEffect(() => {
        if (!adResult) return;
        const generatedText = buildCurrentAdPerformance();
        const currentValue = data.current_ad_performance?.trim() ?? '';
        const hasAutoText = currentValue.includes('Omset per Event') || currentValue.includes('Jumlah Checkout');
        if (!currentValue) {
            setData('current_ad_performance', generatedText);
            return;
        }
        if (!hasAutoText) {
            setData('current_ad_performance', `${generatedText}\n\n${currentValue}`);
        }
    }, [adResult]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitRoute = isAdmin ? route('admin.marketing.evaluation.storeOrUpdate') : route('user.marketing.evaluation.storeOrUpdate');

        post(submitRoute);
    };

    const breadcrumbs = [
        { title: 'Marketing', href: route('admin.marketing.index') },
        { title: 'Evaluasi Iklan', href: '' },
    ];
    const isPrevLocked = !isFirstBatch;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full space-y-6 p-6">
                <h2 className="text-2xl font-semibold">Evaluasi Iklan</h2>

                <form onSubmit={handleSubmit}>
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader>
                            <CardTitle>Form Evaluasi Iklan</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            {/* === Event Sekarang & Sebelumnya === */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {/* === Event Sekarang === */}
                                <div>
                                    <h3 className="mb-2 font-semibold text-foreground">Event Sekarang</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Nama Event</Label>
                                            <Input value={data.current_event_name} readOnly />
                                        </div>

                                        <div>
                                            <Label>Checkout</Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                required
                                                maxLength={13}
                                                value={formatNol(data.current_checkout)}
                                                onChange={(e) => setData('current_checkout', formatNol(e.target.value))}
                                            />
                                        </div>

                                        <div>
                                            <Label>Kinerja Iklan</Label>
                                            <Textarea
                                                placeholder="Tuliskan performa iklan saat ini"
                                                rows={3}
                                                required
                                                value={data.current_ad_performance}
                                                onChange={(e) => setData('current_ad_performance', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label>Performa Lain</Label>
                                            <Textarea
                                                placeholder="Tuliskan performa lain"
                                                rows={3}
                                                required
                                                value={data.current_other_performance}
                                                onChange={(e) => setData('current_other_performance', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* === Event Sebelumnya === */}
                                <div>
                                    <h3 className="mb-2 font-semibold text-foreground">Event Sebelumnya</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <Label>Nama Event</Label>
                                            <Input
                                                value={data.previous_event_name}
                                                readOnly={isPrevLocked}
                                                onChange={(e) => !isPrevLocked && setData('previous_event_name', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label>Checkout Sebelumnya</Label>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={13}
                                                value={formatNol(data.previous_checkout)}
                                                readOnly={isPrevLocked}
                                                required
                                                onChange={(e) => setData('previous_checkout', formatNol(e.target.value))}
                                            />
                                        </div>

                                        <div>
                                            <Label>Kinerja Iklan Sebelumnya</Label>
                                            <Textarea
                                                readOnly={isPrevLocked}
                                                rows={3}
                                                required
                                                value={data.previous_ad_performance}
                                                onChange={(e) => setData('previous_ad_performance', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <Label>Performa Lain Sebelumnya</Label>
                                            <Textarea
                                                readOnly={isPrevLocked}
                                                rows={3}
                                                required
                                                value={data.previous_other_performance}
                                                onChange={(e) => setData('previous_other_performance', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* === Strategi Berikutnya === */}
                            <div className="mt-6 border-t pt-4">
                                <Label>Strategi Iklan Berikutnya</Label>
                                <Textarea
                                    rows={4}
                                    value={data.next_ad_strategy}
                                    required
                                    onChange={(e) => setData('next_ad_strategy', e.target.value)}
                                />
                            </div>

                            {/* === Tombol === */}
                            <div className="flex justify-between pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-gray-400 text-gray-700 hover:bg-gray-100"
                                    onClick={() => window.history.back()}
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                </Button>

                                <Button type="submit" disabled={processing} className="bg-blue-600 text-white hover:bg-blue-700">
                                    {processing ? 'Menyimpan...' : 'Simpan Evaluasi'}
                                    <Save className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
