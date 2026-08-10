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
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

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

    const formatNol = (value: string | number) => {
        if (value === null || value === undefined || value === '') return '';

        const clean = value.toString().replace(/\D/g, '');
        return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatRupiah = (value: string | number) => {
        if (value === null || value === undefined || value === '') return '';
        const clean = Math.floor(Number(value)).toString();
        if (clean === 'NaN') return '';
        return 'Rp ' + clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const toPlainNumber = (value: string) => {
        if (value === null || value === undefined || value === '') return '';
        return value.replace(/[^0-9]/g, '');
    };

    const toNumberOnly = (value: string) => {
        if (value === null || value === undefined || value === '') return '';
        value = value.split('.')[0].split(',')[0];
        return value.replace(/[^0-9]/g, '');
    };

    function parseAudienceFromDb(typeStr?: string, nameStr?: string, existingDetails?: any[]) {
        if (Array.isArray(existingDetails) && existingDetails.length > 0) {
            return existingDetails.map((a: any) => ({
                id: a.id || genId(),
                type: a.type || '',
                names: Array.isArray(a.names)
                    ? a.names
                    : a.name
                        ? String(a.name)
                            .split(',')
                            .map((s: string) => s.trim())
                            .filter(Boolean)
                        : [],
            }));
        }

        const types = typeStr
            ? typeStr
                .split(';')
                .map((s) => s.trim())
                .filter(Boolean)
            : [];
        const groups = nameStr ? nameStr.split(';').map((g) => g.trim()) : [];

        const maxLen = Math.max(types.length, groups.length);
        const result: any[] = [];

        for (let i = 0; i < maxLen; i++) {
            const t = types[i] || '';
            const g = groups[i] || '';
            const names = g
                ? g
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];
            result.push({ id: genId(), type: t, names });
        }

        return result;
    }

    const mergedPlatforms = platforms.map((platform: any) => {
        const existing = planPlatforms.find((p: any) => Number(p.platform_id) === Number(platform.id)) || {};
        const audience_details = parseAudienceFromDb(existing.type_audience_targeted, existing.name_audience_targeted, existing.audience_details);

        return {
            ...existing,
            platform_id: existing.platform_id ?? platform.id,
            platform: platform,
            audience_details,
        };
    });

    const [activePlatformId, setActivePlatformId] = useState(
        mergedPlatforms.find((p: any) => p.id)?.platform_id || mergedPlatforms[0]?.platform_id || '',
    );
    const [isButtonActive, setIsButtonActive] = useState(false);

    const formatDate = (isoDate?: string) => (isoDate ? format(parseISO(isoDate), 'yyyy-MM-dd') : '');
    const { data, setData, post, processing } = useForm({
        event_id: adPlan.event?.id || '',
        title_flayer: adPlan.title_flayer,
        image_flayer: adPlan.image_flayer,
        ad_plan_id: adPlan.id,
        user_id: adPlan.user_id,
        ad_schedule_time: adPlan.ad_schedule_time,
        platforms: mergedPlatforms.map((p: any) => ({
            id: p.id,
            platform_id: p.platform_id,
            goals_id: p.goal?.id || p.goals_id || '',
            start_date: formatDate(p.start_date),
            end_date: formatDate(p.end_date),
            daily_budget: toNumberOnly(p.daily_budget) || '',
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

    const [filteredEvents, setFilteredEvents] = useState(events);

    useEffect(() => {
        if (data.user_id && data.user_id !== '') {
            const filtered = events.filter((event: any) => String(event.user_id) === String(data.user_id));
            setFilteredEvents(filtered);

            if (data.event_id) {
                const currentEventExists = filtered.some((event: any) => String(event.id) === String(data.event_id));
                if (!currentEventExists) {
                    setData('event_id', '');
                }
            }
        } else {
            setFilteredEvents(events);
        }
    }, [data.user_id, events, data.event_id]);

    const activePlatform = data.platforms.find((p: { platform_id: number | string }) => Number(p.platform_id) === Number(activePlatformId)) || data.platforms[0];
    const tab = mergedPlatforms.find((p: { platform_id: number | string; platform: { name: string } }) => Number(p.platform_id) === Number(activePlatformId))?.platform?.name.toLowerCase() || '';
    const [range, setRange] = useState<DateRange | undefined>({
        from: activePlatform?.start_date ? parseISO(activePlatform.start_date) : undefined,
        to: activePlatform?.end_date ? parseISO(activePlatform.end_date) : undefined,
    });

    useEffect(() => {
        setRange({
            from: activePlatform?.start_date ? parseISO(activePlatform.start_date) : undefined,
            to: activePlatform?.end_date ? parseISO(activePlatform.end_date) : undefined,
        });
    }, [activePlatform?.start_date, activePlatform?.end_date, activePlatformId]);

    useEffect(() => {
        if (!activePlatform?.end_date) {
            setIsButtonActive(false);
            return;
        }
        const now = new Date();
        const end = new Date(activePlatform.end_date);
        setIsButtonActive(now >= end);
    }, [activePlatform?.end_date]);

    const handleTabChange = (val: string) => {
        const selected = mergedPlatforms.find((p: { platform: { name: string }; platform_id: number | string }) => p.platform.name.toLowerCase() === val);
        if (selected) setActivePlatformId(selected.platform_id);
    };

    const updateActivePlatformField = (field: string, value: any) => {
        setData(
            'platforms',
            data.platforms.map((p: any) => (Number(p.platform_id) === Number(activePlatformId) ? { ...p, [field]: value } : p)),
        );
    };

    const handleDateChange = (rangeValue: DateRange | undefined) => {
        setRange(rangeValue ?? undefined);
        setData(
            'platforms',
            data.platforms.map((p: any) =>
                Number(p.platform_id) === Number(activePlatformId)
                    ? {
                        ...p,
                        start_date: rangeValue?.from ? format(rangeValue.from, 'yyyy-MM-dd') : p.start_date,
                        end_date: rangeValue?.to ? format(rangeValue.to, 'yyyy-MM-dd') : p.end_date,
                    }
                    : p,
            ),
        );
    };

    const addAudience = () => {
        const newItem = { id: genId(), type: '', names: [] as string[] };
        setData(
            'platforms',
            data.platforms.map((p: any) =>
                Number(p.platform_id) === Number(activePlatformId)
                    ? {
                        ...p,
                        audience_details: [...(p.audience_details || []), newItem],
                    }
                    : p,
            ),
        );
    };

    const handleAudienceChange = (id: string, field: 'type' | 'names', value: string) => {
        setData(
            'platforms',
            data.platforms.map((p: any) => {
                if (Number(p.platform_id) !== Number(activePlatformId)) return p;
                const audience = (p.audience_details || []).map((a: any) => {
                    if (a.id !== id) return a;
                    if (field === 'type') {
                        return { ...a, type: value };
                    } else {
                        const names = String(value)
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                        return { ...a, names };
                    }
                });

                const typeString = audience
                    .map((x: any) => x.type || '')
                    .filter(Boolean)
                    .join(';');
                const nameString = audience
                    .map((x: any) => (x.names || []).join(',') || '')
                    .filter(Boolean)
                    .join(';');

                return {
                    ...p,
                    audience_details: audience,
                    type_audience_targeted: typeString,
                    name_audience_targeted: nameString,
                };
            }),
        );
    };

    const removeAudience = (id: string) => {
        setData(
            'platforms',
            data.platforms.map((p: any) => {
                if (Number(p.platform_id) !== Number(activePlatformId)) return p;
                const audience = (p.audience_details || []).filter((a: any) => a.id !== id);
                const typeString = audience
                    .map((x: any) => x.type || '')
                    .filter(Boolean)
                    .join(';');
                const nameString = audience
                    .map((x: any) => (x.names || []).join(','))
                    .filter(Boolean)
                    .join(';');
                return {
                    ...p,
                    audience_details: audience,
                    type_audience_targeted: typeString,
                    name_audience_targeted: nameString,
                };
            }),
        );
    };

    const handleSubmit = (submitMode: 'draft' | 'next') => {
        if (!activePlatform?.goals_id) {
            toast.error('Tujuan iklan wajib dipilih');
            return;
        }
        const filteredPlatforms = data.platforms.filter((p: any) => {
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

        const updateRoute = isAdmin
            ? route('admin.marketing.update.mode', [adPlan.id, submitMode])
            : route('user.marketing.update.mode', [adPlan.id, submitMode]);

        setData('platforms', filteredPlatforms as any);

        post(updateRoute, {
            preserveScroll: true,
        });
    };

    const renderTargetingFields = () => {
        const targetType = activePlatform?.audience_type || 'targeted';
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
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Min"
                                        maxLength={3}
                                        value={activePlatform?.age_targeted?.split('-')[0] || ''}
                                        onChange={(e) => {
                                            const max = activePlatform?.age_targeted?.split('-')[1] || '';
                                            updateActivePlatformField('age_targeted', `${toPlainNumber(e.target.value)}-${max}`);
                                        }}
                                    />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Max"
                                        maxLength={3}
                                        value={activePlatform?.age_targeted?.split('-')[1] || ''}
                                        onChange={(e) => {
                                            const min = activePlatform?.age_targeted?.split('-')[0] || '';
                                            updateActivePlatformField('age_targeted', `${min}-${toPlainNumber(e.target.value)}`);
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Lokasi</Label>
                                <Input
                                    value={activePlatform?.location_targeted || ''}
                                    onChange={(e) => updateActivePlatformField('location_targeted', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Detail Target Peserta</Label>
                                <div className="space-y-3">
                                    {(activePlatform?.audience_details || []).map((audience: any) => (
                                        <div key={audience.id} className="grid grid-cols-[1fr,1fr,auto] gap-3">
                                            <Select
                                                value={audience.type || ''}
                                                onValueChange={(value) => {
                                                    handleAudienceChange(audience.id, 'type', value);
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Jenis audiens" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['Industri', 'Pekerjaan', 'Bidang Studi', 'Tingkat Pendidikan', 'Minat', 'Lain - lain'].map(
                                                        (item) => (
                                                            <SelectItem key={item} value={item}>
                                                                {item}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            <Input
                                                placeholder="Detail audiens (pisah koma: A,B,C)"
                                                value={Array.isArray(audience.names) ? audience.names.join(', ') : ''}
                                                onChange={(e) => handleAudienceChange(audience.id, 'names', e.target.value)}
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
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Min"
                                    maxLength={3}
                                    value={activePlatform?.age_broad?.split('-')[0] || ''}
                                    onChange={(e) => {
                                        const max = activePlatform?.age_broad?.split('-')[1] || '';
                                        updateActivePlatformField('age_broad', `${toPlainNumber(e.target.value)}-${max}`);
                                    }}
                                />
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Max"
                                    maxLength={3}
                                    value={activePlatform?.age_broad?.split('-')[1] || ''}
                                    onChange={(e) => {
                                        const min = activePlatform?.age_broad?.split('-')[0] || '';
                                        updateActivePlatformField('age_broad', `${min}-${toPlainNumber(e.target.value)}`);
                                    }}
                                />
                            </div>
                            <div>
                                <Label>Lokasi Broad</Label>
                                <Input
                                    value={activePlatform?.location_broad || ''}
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
        <div className="mt-6">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                <div className="space-y-3">
                    <Label>Periode Iklan</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                                <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                                {activePlatform?.start_date && activePlatform?.end_date
                                    ? `${format(parseISO(activePlatform.start_date), 'dd MMM yyyy')} - ${format(parseISO(activePlatform.end_date), 'dd MMM yyyy')}`
                                    : 'Pilih tanggal mulai dan selesai'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg" align="start">
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
                        <Select
                            required
                            value={String(activePlatform?.goals_id || '')}
                            onValueChange={(val) => updateActivePlatformField('goals_id', val)}
                        >
                            <SelectTrigger className={!activePlatform?.goals_id ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Pilih tujuan iklan" />
                            </SelectTrigger>
                            <SelectContent>
                                {goals.map((goal: any) => (
                                    <SelectItem key={goal.id} value={String(goal.id)}>
                                        {goal.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                            {!activePlatform?.goals_id && <p className="mt-1 text-sm text-red-500">Tujuan iklan wajib dipilih</p>}
                        </Select>
                    </div>

                    <div className="mt-4">
                        <Label>Jenis Target Peserta</Label>
                        <Select
                            value={activePlatform?.audience_type || 'targeted'}
                            onValueChange={(val) => updateActivePlatformField('audience_type', val)}
                        >
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
                            type="text"
                            inputMode="numeric"
                            maxLength={13}
                            value={formatRupiah(activePlatform?.daily_budget) || ''}
                            onChange={(e) => updateActivePlatformField('daily_budget', toPlainNumber(e.target.value))}
                        />
                    </div>

                    <div>
                        <Label>Target Peserta (jumlah)</Label>
                        <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            value={formatNol(activePlatform?.audience_target) || ''}
                            onChange={(e) => updateActivePlatformField('audience_target', toPlainNumber(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            <div className="col-span-2">{renderTargetingFields()}</div>
        </div>
    );

    const breadcrumbs = [
        { title: 'Marketing', href: route('admin.marketing.index') },
        { title: 'Edit Perencanaan Iklan', href: route('admin.marketing.edit', adPlan.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full space-y-6 p-6">
                <h2 className="text-2xl font-semibold">Edit Perencanaan Iklan</h2>

                <form>
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader>
                            <CardTitle>Edit Perencanaan Iklan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                <div>
                                    {isAdmin && (
                                        <div className="mb-4">
                                            <Label>User</Label>
                                            <Select value={String(data.user_id)} onValueChange={(value) => setData('user_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={'Pilih User'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(props.users as any[])?.map((u) => (
                                                        <SelectItem key={u.id} value={String(u.id)}>
                                                            {u.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div>
                                        <Label>Nama Event</Label>
                                        <Select value={String(data.event_id)} onValueChange={(val) => setData('event_id', Number(val))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih nama event" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredEvents.length > 0 ? (
                                                    filteredEvents.map((event: any) => (
                                                        <SelectItem key={event.id} value={String(event.id)}>
                                                            {event.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-event" disabled>
                                                        Tidak ada event
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="mt-4">
                                        <Label>Jam Tayang Iklan</Label>
                                        <Input
                                            type="time"
                                            required
                                            id="time-picker"
                                            onChange={(e) => setData('ad_schedule_time', e.target.value)}
                                            value={data.ad_schedule_time}
                                            step={60}
                                            defaultValue={'00:00:00'}
                                            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <Label>Gambar Flayer</Label>
                                        <Input
                                            type="file"
                                            placeholder="Masukkan Flayer Gambar"
                                            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                            onChange={(e) => setData('image_flayer', e.target.files?.[0])}
                                        />
                                    </div>
                                </div>

                                <Tabs
                                    value={String(tab)}
                                    onValueChange={handleTabChange}
                                >
                                    <TabsList
                                        className="w-full flex flex-row gap-3 overflow-x-auto justify-start"
                                        style={{ scrollbarWidth: "none" }}
                                    >
                                        {mergedPlatforms.map((p: any) => (
                                            <TabsTrigger
                                                key={p.platform?.id ?? p.platform_id}
                                                value={p.platform.name.toLowerCase()}
                                                className='px-20'
                                            >
                                                {p.platform.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    <TabsContent key={activePlatformId} value={tab}>
                                        {renderFormContent()}
                                    </TabsContent>
                                </Tabs>

                                <div className="flex flex-col gap-3 pt-4 md:flex-row md:justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-gray-400 text-gray-700 hover:bg-gray-100"
                                        onClick={() => window.history.back()}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                    </Button>
                                    <div className="flex flex-row justify-between gap-2 md:justify-end">
                                        <Button
                                            type="button"
                                            disabled={processing || !activePlatform?.goals_id}
                                            className="bg-gray-500 text-white hover:bg-gray-600"
                                            onClick={() => handleSubmit('draft')}
                                        >
                                            {processing ? 'Menyimpan...' : 'Perbarui Data'}
                                        </Button>

                                        <Button
                                            type="button"
                                            disabled={!isButtonActive || processing || !activePlatform?.goals_id}
                                            className={cn(
                                                'bg-primary text-white hover:bg-blue-700',
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
