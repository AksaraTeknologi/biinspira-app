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
import { ArrowRight, CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MarketingEdit() {
    const { props } = usePage();
    const { events, goals, platforms, adPlanPlatform }: any = props;

    const [tab, setTab] = useState('boost');
    const [typeAudiens, setTypeAudiens] = useState<string | null>(adPlanPlatform.type_audience_targeted || null);
    const [detailAudiens, setDetailAudiens] = useState(adPlanPlatform.name_audience_targeted || '');
    const [targetType, setTargetType] = useState(adPlanPlatform.audience_type || 'targeted');
    const [range, setRange] = useState<{ from?: Date; to?: Date }>({
        from: adPlanPlatform.start_date ? parseISO(adPlanPlatform.start_date) : undefined,
        to: adPlanPlatform.end_date ? parseISO(adPlanPlatform.end_date) : undefined,
    });
    const [isButtonActive, setIsButtonActive] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        event_id: adPlanPlatform.plan?.event_id || '',
        ad_plan_id: adPlanPlatform.plan,
        platform_id: adPlanPlatform.platform_id || '',
        goals_id: adPlanPlatform.goals_id || '',
        start_date: adPlanPlatform.start_date || '',
        end_date: adPlanPlatform.end_date || '',
        daily_budget: adPlanPlatform.daily_budget || '',
        audience_target: adPlanPlatform.audience_target || '',
        audience_type: adPlanPlatform.audience_type || 'targeted',
        age_targeted: adPlanPlatform.age_targeted || '',
        location_targeted: adPlanPlatform.location_targeted || '',
        type_audience_targeted: adPlanPlatform.type_audience_targeted || '',
        name_audience_targeted: adPlanPlatform.name_audience_targeted || '',
        age_broad: adPlanPlatform.age_broad || '',
        location_broad: adPlanPlatform.location_broad || '',
    });
    useEffect(() => {
        if (!data.end_date) {
            setIsButtonActive(false);
            return;
        }

        const now = new Date();
        const end = new Date(data.end_date);

        // Tombol aktif jika hari ini >= end_date
        setIsButtonActive(now >= end);
    }, [data.end_date]);
    useEffect(() => {
        const platformMap: Record<string, string> = {
            '1': 'boost',
            '2': 'meta',
            '3': 'business',
        };
        setTab(platformMap[data.platform_id] || 'boost');
    }, [data.platform_id]);

    const handleTabChange = (val: string) => {
        setTab(val);
        const reverseMap: Record<string, string> = {
            boost: '1',
            meta: '2',
            business: '3',
        };
        setData('platform_id', reverseMap[val]);
    };

    const handleDateChange = (rangeValue: { from?: Date; to?: Date } | undefined) => {
        setRange(rangeValue || {});
        if (rangeValue?.from) setData('start_date', format(rangeValue.from, 'yyyy-MM-dd'));
        if (rangeValue?.to) setData('end_date', format(rangeValue.to, 'yyyy-MM-dd'));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.marketing.update', adPlanPlatform.id));
    };

    const breadcrumbs = [
        { title: 'Marketing', href: route('admin.marketing.index') },
        { title: 'Edit Market Iklan', href: route('admin.marketing.edit', adPlanPlatform.id) },
    ];

    const renderTargetingFields = () => {
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
                                    placeholder="Masukkan umur target"
                                    value={data.age_targeted}
                                    onChange={(e) => setData('age_targeted', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Lokasi</Label>
                                <Input
                                    placeholder="Masukkan lokasi audiens"
                                    value={data.location_targeted}
                                    onChange={(e) => setData('location_targeted', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Jenis Audiens</Label>
                                <Select
                                    value={typeAudiens ?? ''}
                                    onValueChange={(val) => {
                                        setTypeAudiens(val);
                                        setData('type_audience_targeted', val);
                                    }}
                                >
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
                                        placeholder={`Masukkan detail untuk ${typeAudiens}`}
                                        value={detailAudiens}
                                        onChange={(e) => {
                                            setDetailAudiens(e.target.value);
                                            setData('name_audience_targeted', e.target.value);
                                        }}
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
                                    placeholder="Masukkan umur broad"
                                    value={data.age_broad}
                                    onChange={(e) => setData('age_broad', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Lokasi Broad</Label>
                                <Input
                                    placeholder="Masukkan lokasi broad"
                                    value={data.location_broad}
                                    onChange={(e) => setData('location_broad', e.target.value)}
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
                        <Button
                            variant="outline"
                            className={cn(
                                'w-full justify-start rounded-lg border-zinc-300 text-left font-normal shadow-sm transition-all duration-200 hover:border-blue-400',
                                !range?.from && 'text-muted-foreground',
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                            {range?.from && range?.to
                                ? `${format(range.from, 'dd MMM yyyy')} - ${format(range.to, 'dd MMM yyyy')}`
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

                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col rounded-md border bg-muted/30 p-2">
                        <span className="text-xs text-muted-foreground">Tanggal Mulai</span>
                        <span>{data.start_date ? format(parseISO(data.start_date), 'dd MMM yyyy') : '—'}</span>
                    </div>
                    <div className="flex flex-col rounded-md border bg-muted/30 p-2">
                        <span className="text-xs text-muted-foreground">Tanggal Selesai</span>
                        <span>{data.end_date ? format(parseISO(data.end_date), 'dd MMM yyyy') : '—'}</span>
                    </div>
                </div>

                <div className="mt-4">
                    <Label>Tujuan Iklan</Label>
                    <Select value={String(data.goals_id)} onValueChange={(val) => setData('goals_id', val)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih tujuan iklan" />
                        </SelectTrigger>
                        <SelectContent>
                            {goals?.map((goal) => (
                                <SelectItem key={goal.id} value={String(goal.id)}>
                                    {goal.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-4">
                    <Label>Jenis Target Audiens</Label>
                    <Select
                        value={targetType}
                        onValueChange={(val) => {
                            setTargetType(val);
                            setData('audience_type', val);
                        }}
                    >
                        <SelectTrigger className="w-full">
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
                        placeholder="Rp. 0"
                        min={0}
                        value={data.daily_budget}
                        onChange={(e) => setData('daily_budget', e.target.value)}
                    />
                </div>

                <div>
                    <Label>Target Audiens (jumlah)</Label>
                    <Input
                        type="number"
                        placeholder="Masukkan jumlah target audiens"
                        min={0}
                        value={data.audience_target}
                        onChange={(e) => setData('audience_target', e.target.value)}
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
                                {/* === EVENT === */}
                                <div>
                                    <Label>Nama Event</Label>
                                    <Select
                                        value={data.event_id ? String(data.event_id) : ''}
                                        onValueChange={(val) => setData('event_id', Number(val))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih nama event" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {events && events.length > 0 ? (
                                                events.map((event: any) => (
                                                    <SelectItem key={event.id} value={String(event.id)}>
                                                        <div className="flex w-full items-center justify-between">
                                                            <span>{event.name}</span>
                                                            {event.date && (
                                                                <span className="ml-2 text-xs text-muted-foreground">
                                                                    ({format(parseISO(event.date), 'dd MMM yyyy')})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>
                                                    Tidak ada event tersedia
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {errors.event_id && <p className="mt-1 text-sm text-red-500">{errors.event_id}</p>}
                                </div>

                                {/* === PLATFORM TABS === */}
                                <Tabs value={tab} onValueChange={handleTabChange}>
                                    <TabsList className="mb-4 grid w-full grid-cols-3">
                                        <TabsTrigger value="boost">Boost Post</TabsTrigger>
                                        <TabsTrigger value="meta">Meta Ads</TabsTrigger>
                                        <TabsTrigger value="business">Business Suite</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="boost">{renderFormContent()}</TabsContent>
                                    <TabsContent value="meta">{renderFormContent()}</TabsContent>
                                    <TabsContent value="business">{renderFormContent()}</TabsContent>
                                </Tabs>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="submit" disabled={processing} className="bg-blue-600 text-white hover:bg-blue-700">
                                        {processing ? 'Menyimpan...' : 'Perbarui Data'}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={!isButtonActive || processing}
                                        className={cn(
                                            'bg-blue-600 text-white hover:bg-blue-700',
                                            (!isButtonActive || processing) && 'cursor-not-allowed opacity-50',
                                        )}
                                        onClick={() =>
                                            (window.location.href = route('admin.marketing.result', {
                                                id_event: data.event_id,
                                                id_platform: data.platform_id,
                                                id_ad_plan: data.ad_plan_id,
                                            }))
                                        }
                                    >
                                        Selanjutnya
                                        <ArrowRight />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
