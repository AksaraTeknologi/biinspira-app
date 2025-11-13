'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ArrowRight, CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MarketingEdit() {
    const { props } = usePage();
    const { adPlan, events, goals, platforms, isAdmin }: any = props;

    const planPlatforms = adPlan.plan_platforms || [];
    const mergedPlatforms = platforms.map((platform: any) => {
        const existing = planPlatforms.find((p: any) => p.platform_id === platform.id);
        return (
            existing || {
                id: null,
                platform_id: platform.id,
                platform,
                goals_id: '',
                start_date: '',
                end_date: '',
                daily_budget: '',
                audience_target: '',
                audience_type: 'targeted',
                type_audience_targeted: '',
                name_audience_targeted: '',
                age_targeted: '',
                location_targeted: '',
                age_broad: '',
                location_broad: '',
            }
        );
    });

    const [activePlatformId, setActivePlatformId] = useState(mergedPlatforms[0]?.platform_id || '');

    const formatDate = (isoDate?: string) => (isoDate ? format(parseISO(isoDate), 'yyyy-MM-dd') : '');

    const { data, setData, post, processing } = useForm({
        event_id: adPlan.event?.id || '',
        ad_plan_id: adPlan.id,
        user_id: adPlan.user_id,
        platforms: mergedPlatforms.map((p: any) => ({
            id: p.id,
            platform_id: p.platform_id,
            goals_id: p.goal?.id || '',
            start_date: formatDate(p.start_date),
            end_date: formatDate(p.end_date),
            daily_budget: p.daily_budget || '',
            audience_target: p.audience_target || '',
            audience_type: p.audience_type || 'targeted',
            type_audience_targeted: p.type_audience_targeted || '',
            name_audience_targeted: p.name_audience_targeted || '',
            age_targeted: p.age_targeted || '',
            location_targeted: p.location_targeted || '',
            age_broad: p.age_broad || '',
            location_broad: p.location_broad || '',
        })),
    });

    const activePlatform = data.platforms.find((p) => p.platform_id === activePlatformId) || data.platforms[0];
    const tab = mergedPlatforms.find((p) => p.platform_id === activePlatformId)?.platform?.name.toLowerCase() || 'boost';

    const [range, setRange] = useState<{ from?: Date; to?: Date }>({
        from: activePlatform.start_date ? parseISO(activePlatform.start_date) : undefined,
        to: activePlatform.end_date ? parseISO(activePlatform.end_date) : undefined,
    });

    const [isButtonActive, setIsButtonActive] = useState(false);
    useEffect(() => {
        setRange({
            from: activePlatform.start_date ? parseISO(activePlatform.start_date) : undefined,
            to: activePlatform.end_date ? parseISO(activePlatform.end_date) : undefined,
        });
    }, [activePlatform.start_date, activePlatform.end_date]);
    useEffect(() => {
        if (!activePlatform.end_date) {
            setIsButtonActive(false);
            return;
        }
        const now = new Date();
        const end = new Date(activePlatform.end_date);
        setIsButtonActive(now >= end);
    }, [activePlatform.end_date]);

    const handleTabChange = (val: string) => {
        const selected = mergedPlatforms.find((p) => p.platform.name.toLowerCase() === val);
        if (selected) setActivePlatformId(selected.platform_id);
    };

    const handleDateChange = (rangeValue: { from?: Date; to?: Date } | undefined) => {
        setRange(rangeValue || {});
        setData(
            'platforms',
            data.platforms.map((p) =>
                p.platform_id === activePlatformId
                    ? {
                          ...p,
                          start_date: rangeValue?.from ? format(rangeValue.from, 'yyyy-MM-dd') : p.start_date,
                          end_date: rangeValue?.to ? format(rangeValue.to, 'yyyy-MM-dd') : p.end_date,
                      }
                    : p,
            ),
        );
    };

    const updateActivePlatformField = (field: string, value: any) => {
        setData(
            'platforms',
            data.platforms.map((p) => (p.platform_id === activePlatformId ? { ...p, [field]: value } : p)),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const filteredPlatforms = data.platforms.filter((p) => {
            return (
                Boolean(p.start_date) &&
                Boolean(p.end_date) &&
                p.daily_budget !== '' &&
                p.daily_budget !== null &&
                p.audience_target !== '' &&
                p.audience_target !== null
            );
        });
        const updateRoute = isAdmin ? route('admin.marketing.update', adPlan.id) : route('user.marketing.update', adPlan.id);
        post(updateRoute, {
            data: { ...data, platforms: filteredPlatforms },
            preserveScroll: true,
        });
    };

    const breadcrumbs = [
        { title: 'Marketing', href: route('admin.marketing.index') },
        { title: 'Edit Perencanaan Iklan', href: route('admin.marketing.edit', adPlan.id) },
    ];

    const renderTargetingFields = () => {
        const targetType = activePlatform.audience_type;
        const typeAudiens = activePlatform.type_audience_targeted;
        const detailAudiens = activePlatform.name_audience_targeted;

        const showTargeting = targetType === 'targeted' || targetType === 'combined';
        const showBroad = targetType === 'broad' || targetType === 'combined';

        return (
            <div className="mt-6 space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {showTargeting && (
                        <div className="space-y-4">
                            <div>
                                <Label>Umur (Targeted)</Label>
                                <Input
                                    type="number"
                                    value={activePlatform.age_targeted}
                                    onChange={(e) => updateActivePlatformField('age_targeted', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Lokasi</Label>
                                <Input
                                    value={activePlatform.location_targeted}
                                    onChange={(e) => updateActivePlatformField('location_targeted', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Jenis Audiens</Label>
                                <Select value={typeAudiens} onValueChange={(val) => updateActivePlatformField('type_audience_targeted', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis audiens" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Industri', 'Pekerjaan', 'Bidang Studi', 'Tingkat Pendidikan', 'Minat', 'Lain - Lain'].map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {item}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {typeAudiens && (
                                <div>
                                    <Label>Detail Audiens ({typeAudiens})</Label>
                                    <Input
                                        value={detailAudiens}
                                        onChange={(e) => updateActivePlatformField('name_audience_targeted', e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {showBroad && (
                        <div className="space-y-4">
                            <div>
                                <Label>Umur (Broad)</Label>
                                <Input
                                    type="number"
                                    value={activePlatform.age_broad}
                                    onChange={(e) => updateActivePlatformField('age_broad', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Lokasi Broad</Label>
                                <Input
                                    value={activePlatform.location_broad}
                                    onChange={(e) => updateActivePlatformField('location_broad', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFormContent = () => (
        <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="space-y-3">
                <Label>Periode Iklan</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                            {activePlatform.start_date && activePlatform.end_date
                                ? `${format(parseISO(activePlatform.start_date), 'dd MMM yyyy')} - ${format(parseISO(activePlatform.end_date), 'dd MMM yyyy')}`
                                : 'Pilih tanggal mulai dan selesai'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg" align="start">
                        <Calendar
                            mode="range"
                            numberOfMonths={2}
                            selected={range}
                            onSelect={handleDateChange}
                            className={cn(
                                'rounded-xl p-2 text-sm',
                                '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
                                '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
                                '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
                                '[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white',
                                '[&_.rdp-day_range_middle]:bg-blue-100 [&_.rdp-day_range_middle]:text-zinc-800',
                                '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
                            )}
                        />
                    </PopoverContent>
                </Popover>

                <div className="mt-4">
                    <Label>Tujuan Iklan</Label>
                    <Select value={String(activePlatform.goals_id)} onValueChange={(val) => updateActivePlatformField('goals_id', val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih tujuan iklan" />
                        </SelectTrigger>
                        <SelectContent>
                            {goals.map((goal: any) => (
                                <SelectItem key={goal.id} value={String(goal.id)}>
                                    {goal.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-4">
                    <Label>Jenis Target Audiens</Label>
                    <Select value={activePlatform.audience_type} onValueChange={(val) => updateActivePlatformField('audience_type', val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis audiens" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="targeted">Targeted</SelectItem>
                            <SelectItem value="broad">Broad</SelectItem>
                            <SelectItem value="combined">Combined</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <Label>Budget Harian</Label>
                    <Input
                        type="number"
                        value={activePlatform.daily_budget || ''}
                        onChange={(e) => updateActivePlatformField('daily_budget', e.target.value)}
                    />
                </div>

                <div>
                    <Label>Target Audiens (jumlah)</Label>
                    <Input
                        type="number"
                        value={activePlatform.audience_target}
                        onChange={(e) => updateActivePlatformField('audience_target', e.target.value)}
                    />
                </div>
            </div>

            <div className="col-span-2">{renderTargetingFields()}</div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
                <h2 className="text-2xl font-semibold">Edit Perencanaan Iklan</h2>

                <form onSubmit={handleSubmit}>
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader>
                            <CardTitle>Edit Perencanaan Iklan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                <div>
                                    <Label>Nama Event</Label>
                                    <Select value={String(data.event_id)} onValueChange={(val) => setData('event_id', Number(val))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih nama event" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {events.map((event: any) => (
                                                <SelectItem key={event.id} value={String(event.id)}>
                                                    {event.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Tabs value={tab} onValueChange={handleTabChange}>
                                    <TabsList className="mb-4 grid w-full grid-cols-3">
                                        {mergedPlatforms.map((p) => (
                                            <TabsTrigger key={p.platform_id} value={p.platform.name.toLowerCase()}>
                                                {p.platform.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {mergedPlatforms.map((p) => (
                                        <TabsContent key={p.platform_id} value={p.platform.name.toLowerCase()}>
                                            {renderFormContent()}
                                        </TabsContent>
                                    ))}
                                </Tabs>

                                <div className="flex justify-between gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-gray-400 text-gray-700 hover:bg-gray-100"
                                        onClick={() => window.history.back()}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                    </Button>
                                    <div>
                                        <Button type="submit" disabled={processing} className="bg-blue-600 text-white hover:bg-blue-700">
                                            {processing ? 'Menyimpan...' : 'Perbarui Data'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={!isButtonActive || processing}
                                            className={cn(
                                                'bg-blue-600 text-white hover:bg-blue-700 ml-2',
                                                (!isButtonActive || processing) && 'cursor-not-allowed opacity-50',
                                            )}
                                            onClick={() => {
                                                console.log(isAdmin);
                                                const routeName = isAdmin ? 'admin.marketing.result' : 'user.marketing.result';
                                                window.location.href = route(routeName, {
                                                    id_event: data.event_id,
                                                    id_ad_plan: data.ad_plan_id,
                                                });
                                            }}
                                        >
                                            Selanjutnya
                                            <ArrowRight />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
