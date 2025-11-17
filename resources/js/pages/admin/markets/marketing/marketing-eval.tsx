'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

export default function MarketingEval() {
    const { props }: any = usePage();
    const { isAdmin } = props;
    const { currentPlan, previousPlan, adResult, previousAdResult, adEvaluation } = props;

    const currentCheckout = adResult?.checkout_count || 0;
    const previousCheckout = previousAdResult?.checkout_count || 0;

    const { data, setData, post, processing } = useForm({
        ad_plan_id: currentPlan.id,
        current_event_name: currentPlan.event.name,
        previous_event_name: previousPlan?.event?.name || '-',
        current_checkout: currentCheckout,
        previous_checkout: previousCheckout,
        previous_ad_performance: adEvaluation?.previous_ad_performance || '',
        current_ad_performance: adEvaluation?.current_ad_performance || '',
        previous_other_performance: adEvaluation?.previous_other_performance || '',
        current_other_performance: adEvaluation?.current_other_performance || '',
        next_ad_strategy: adEvaluation?.next_ad_strategy || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitRoute = isAdmin ? route('admin.marketing.evaluation.storeOrUpdate') : route('user.marketing.evaluation.storeOrUpdate')
        post(submitRoute);
    };

    const breadcrumbs = [
        { title: 'Marketing', href: route('admin.marketing.index') },
        { title: 'Evaluasi Iklan', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
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
                                            <Input value={data.current_checkout} readOnly />
                                        </div>
                                        <div>
                                            <Label>Kinerja Iklan</Label>
                                            <Textarea
                                                placeholder="Tuliskan performa iklan saat ini"
                                                rows={3}
                                                value={data.current_ad_performance}
                                                onChange={(e) => setData('current_ad_performance', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Performa Lain</Label>
                                            <Textarea
                                                placeholder="Tuliskan performa lain (engagement, CTR, dsb)"
                                                rows={3}
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
                                            <Input value={data.previous_event_name} readOnly />
                                        </div>
                                        <div>
                                            <Label>Checkout Sebelumnya</Label>
                                            <Input value={data.previous_checkout} readOnly />
                                        </div>
                                        <div>
                                            <Label>Kinerja Iklan Sebelumnya</Label>
                                            <Textarea
                                                readOnly
                                                placeholder="Tuliskan performa iklan sebelumnya"
                                                rows={3}
                                                value={data.previous_ad_performance}
                                                onChange={(e) => setData('previous_ad_performance', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Performa Lain Sebelumnya</Label>
                                            <Textarea
                                                readOnly
                                                placeholder="Tuliskan performa lainnya sebelumnya"
                                                rows={3}
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
                                    placeholder="Tuliskan strategi untuk batch berikutnya..."
                                    rows={4}
                                    value={data.next_ad_strategy}
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
