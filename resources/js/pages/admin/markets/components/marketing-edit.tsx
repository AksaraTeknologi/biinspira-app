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
import { ArrowLeft, ArrowRight, CalendarIcon, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MarketingEdit() {
    const { props } = usePage();
    const { adPlan, events, goals, platforms, isAdmin }: any = props;

    const planPlatforms = adPlan.plan_platforms || [];

    const genId = () => {
        if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
            return (crypto as any).randomUUID();
        }
        return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    };

    const mergedPlatforms = platforms.map((platform: any) => {
        const existing = planPlatforms.find((p: any) => p.platform_id === platform.id);
        let audienceDetails: any[] = [];

        if (existing) {
            const types = existing.type_audience_targeted
                ? existing.type_audience_targeted
                      .split(',')
                      .map((x: string) => x.trim())
                      .filter(Boolean)
                : [];

            const names = existing.name_audience_targeted
                ? existing.name_audience_targeted
                      .split(',')
                      .map((x: string) => x.trim())
                      .filter(Boolean)
                : [];

            const maxLength = Math.max(types.length, names.length);

            for (let i = 0; i < maxLength; i++) {
                audienceDetails.push({
                    id: genId(),
                    type: types[i] || '',
                    name: names[i] || '',
                });
            }

            if (Array.isArray(existing.audience_details) && existing.audience_details.length) {
                audienceDetails = existing.audience_details.map((a: any) => ({
                    id: a.id || genId(), // CHANGED
                    type: a.type || '',
                    name: a.name || '',
                }));
            }
        }

        return {
            ...existing,
            platform_id: existing?.platform_id || platform.id,
            audience_details: audienceDetails,
            platform,
        };
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
            audience_details: p.audience_details || [],
            age_targeted: p.age_targeted || '',
            location_targeted: p.location_targeted || '',
            age_broad: p.age_broad || '',
            location_broad: p.location_broad || '',
        })),
    });

    console.log(data.platforms.platform_id);

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

    const handleSubmit = (submitMode: 'draft' | 'next') => {
        const filteredPlatforms = data.platforms.filter((p) => {
            return (
                Boolean(p.platform_id) &&
                Boolean(p.start_date) &&
                Boolean(p.end_date) &&
                p.daily_budget !== '' &&
                p.daily_budget !== null &&
                p.audience_target !== '' &&
                p.audience_target !== null
            );
        });

        // const filteredPlatforms = data.platforms.filter((p) => {
        //     return (
        //         Boolean(p.start_date) &&
        //         Boolean(p.end_date) &&
        //         p.daily_budget !== '' &&
        //         p.daily_budget !== null &&
        //         p.audience_target !== '' &&
        //         p.audience_target !== null
        //     );
        // });
        const updateRoute = isAdmin
            ? route('admin.marketing.update.mode', [adPlan.id, submitMode])
            : route('user.marketing.update.mode', [adPlan.id, submitMode]);
        post(updateRoute, {
            data: {
                event_id: data.event_id,
                ad_plan_id: data.ad_plan_id,
                user_id: data.user_id,
                platforms: filteredPlatforms,
            },
            preserveScroll: true,
        });
    };

    const breadcrumbs = [
        { title: 'Marketing', href: route('admin.marketing.index') },
        { title: 'Edit Perencanaan Iklan', href: route('admin.marketing.edit', adPlan.id) },
    ];

    const addAudience = () => {
        const updatedPlatforms = data.platforms.map((p) => {
            if (p.platform_id === activePlatformId) {
                const currentAudience = p.audience_details || [];
                const newAudience = [...currentAudience, { id: genId(), type: '', name: '' }];

                return {
                    ...p,
                    audience_details: newAudience,
                    type_audience_targeted: newAudience
                        .map((a) => a.type)
                        .filter(Boolean)
                        .join(','),
                    name_audience_targeted: newAudience
                        .map((a) => a.name)
                        .filter(Boolean)
                        .join(','),
                };
            }
            return p;
        });

        setData('platforms', updatedPlatforms);
    };

    const handleAudienceChange = (index: number, field: 'type' | 'name', value: string) => {
        const updatedPlatforms = data.platforms.map((p) => {
            if (p.platform_id === activePlatformId) {
                const updatedAudience = [...(p.audience_details || [])];
                if (updatedAudience[index]) {
                    updatedAudience[index] = { ...updatedAudience[index], [field]: value };
                }
                return {
                    ...p,
                    audience_details: updatedAudience,
                    type_audience_targeted: updatedAudience
                        .map((a) => a.type)
                        .filter(Boolean)
                        .join(','),
                    name_audience_targeted: updatedAudience
                        .map((a) => a.name)
                        .filter(Boolean)
                        .join(','),
                };
            }
            return p;
        });

        setData('platforms', updatedPlatforms);
    };

    const removeAudience = (id: string) => {
        const updatedPlatforms = data.platforms.map((p) => {
            if (p.platform_id === activePlatformId) {
                const updatedAudience = (p.audience_details || []).filter((a) => a.id !== id);

                return {
                    ...p,
                    audience_details: updatedAudience,
                    type_audience_targeted: updatedAudience
                        .map((a) => a.type)
                        .filter(Boolean)
                        .join(','),
                    name_audience_targeted: updatedAudience
                        .map((a) => a.name)
                        .filter(Boolean)
                        .join(','),
                };
            }
            return p;
        });

        setData('platforms', updatedPlatforms);
    };

    const renderTargetingFields = () => {
        const targetType = activePlatform.audience_type;
        const showTargeting = targetType === 'targeted' || targetType === 'combined';
        const showBroad = targetType === 'broad' || targetType === 'combined';

        return (
            <div className="mt-6 space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {showTargeting && (
                        <div className="space-y-4">
                            <div>
                                <Label>Umur (Targeted)</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={activePlatform.age_targeted?.split('-')[0] || ''}
                                        onChange={(e) => {
                                            const max = activePlatform.age_targeted?.split('-')[1] || '';
                                            updateActivePlatformField('age_targeted', `${e.target.value}-${max}`);
                                        }}
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={activePlatform.age_targeted?.split('-')[1] || ''}
                                        onChange={(e) => {
                                            const min = activePlatform.age_targeted?.split('-')[0] || '';
                                            updateActivePlatformField('age_targeted', `${min}-${e.target.value}`);
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Lokasi</Label>
                                <Input
                                    value={activePlatform.location_targeted}
                                    onChange={(e) => updateActivePlatformField('location_targeted', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Detail Audiens</Label>
                                <div className="space-y-3">
                                    {activePlatform.audience_details?.map((audience: any, index: number) => (
                                        <div key={audience.id} className="grid grid-cols-[1fr,1fr,auto] gap-3">
                                            <Select value={audience.type} onValueChange={(value) => handleAudienceChange(index, 'type', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Jenis audiens" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['Industri', 'Pekerjaan', 'Bidang Studi', 'Tingkat Pendidikan', 'Minat', 'Lain - Lain'].map(
                                                        (item) => (
                                                            <SelectItem key={item} value={item}>
                                                                {item}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            <Input
                                                placeholder="Detail audiens"
                                                value={audience.name}
                                                onChange={(e) => handleAudienceChange(index, 'name', e.target.value)}
                                            />

                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeAudience(audience.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                        onClick={addAudience}
                                    >
                                        + Tambah Jenis Audiens
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showBroad && (
                        <div className="space-y-4">
                            <Label>Umur (broad)</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={activePlatform.age_broad?.split('-')[0] || ''}
                                    onChange={(e) => {
                                        const max = activePlatform.age_broad?.split('-')[1] || '';
                                        updateActivePlatformField('age_broad', `${e.target.value}-${max}`);
                                    }}
                                />
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={activePlatform.age_broad?.split('-')[1] || ''}
                                    onChange={(e) => {
                                        const min = activePlatform.age_broad?.split('-')[0] || '';
                                        updateActivePlatformField('age_broad', `${min}-${e.target.value}`);
                                    }}
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
            <div className="w-full space-y-6 p-6">
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
                                        {mergedPlatforms.map((p: any) => (
                                            // CHANGED: use stable key (platform id)
                                            <TabsTrigger key={p.platform?.id ?? p.platform_id} value={p.platform.name.toLowerCase()}>
                                                {p.platform.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    <TabsContent key={activePlatformId} value={tab}>
                                        {renderFormContent()}
                                    </TabsContent>
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
                                    <div className="flex gap-2">
                                        {/* Tombol Perbarui Data - type="button" dengan mode 'draft' */}
                                        <Button
                                            type="button"
                                            disabled={processing}
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                            onClick={() => handleSubmit('draft')}
                                        >
                                            {processing ? 'Menyimpan...' : 'Perbarui Data'}
                                        </Button>

                                        {/* Tombol Selanjutnya - type="button" dengan mode 'next' */}
                                        <Button
                                            type="button"
                                            disabled={!isButtonActive || processing}
                                            className={cn(
                                                'bg-green-600 text-white hover:bg-green-700',
                                                (!isButtonActive || processing) && 'cursor-not-allowed opacity-50',
                                            )}
                                            onClick={() => handleSubmit('next')}
                                        >
                                            {processing ? 'Menyimpan...' : 'Selanjutnya'}
                                            <ArrowRight className="ml-2 h-4 w-4" />
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
