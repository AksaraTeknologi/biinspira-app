'use client';

import { AudienceAutocompleteInput } from '@/components/ui/audienceautocompleteinput';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationAutocompleteInput } from '@/components/ui/locationautocompleteinput';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { useForm, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ArrowRight, CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

interface MonthOption {
    value: string;
    label: string;
}

export default function MarketingEdit() {
    const { props } = usePage();
    const { adPlan, events, goals, platforms, isAdmin, history }: any = props;
    const planPlatforms = adPlan.plan_platforms || [];

    const locationTargetedHistory = (history?.location_targeted || []).map(String);
    const locationBroadHistory = (history?.location_broad || []).map(String);
    const audienceHistory = (history?.audience_names || []).map(String);

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

    const formatDate = (isoDate?: string) => (isoDate ? format(parseISO(isoDate), 'yyyy-MM-dd') : '');

    // Inisialisasi daftar setting per platform dari database
    const initialPlatformSettings: any[] = [];
    platforms.forEach((platform: any) => {
        const existingList = planPlatforms.filter((p: any) => Number(p.platform_id) === Number(platform.id));
        if (existingList.length === 0) {
            initialPlatformSettings.push({
                id: undefined,
                temp_id: genId(),
                platform_id: platform.id,
                goals_id: '',
                start_date: '',
                end_date: '',
                daily_budget: '',
                audience_target: '',
                audience_type: 'targeted',
                type_audience_targeted: '',
                name_audience_targeted: '',
                audience_details: [],
                age_targeted: '',
                location_targeted: '',
                age_broad: '',
                location_broad: '',
            });
        } else {
            existingList.forEach((p: any) => {
                initialPlatformSettings.push({
                    id: p.id,
                    temp_id: p.id || genId(),
                    platform_id: p.platform_id ?? platform.id,
                    goals_id: p.goal?.id || p.goals_id || '',
                    start_date: formatDate(p.start_date),
                    end_date: formatDate(p.end_date),
                    daily_budget: toNumberOnly(p.daily_budget) || '',
                    audience_target: p.audience_target || '',
                    audience_type: p.audience_type || 'targeted',
                    type_audience_targeted: p.type_audience_targeted || '',
                    name_audience_targeted: p.name_audience_targeted || '',
                    audience_details: parseAudienceFromDb(p.type_audience_targeted, p.name_audience_targeted, p.audience_details),
                    age_targeted: p.age_targeted || '',
                    location_targeted: p.location_targeted || '',
                    age_broad: p.age_broad || '',
                    location_broad: p.location_broad || '',
                });
            });
        }
    });

    const [activePlatformId, setActivePlatformId] = useState<number | string>(
        platforms.find((pl: any) => planPlatforms.some((p: any) => Number(p.platform_id) === Number(pl.id)))?.id ||
            platforms[0]?.id ||
            '',
    );

    // Indeks setting aktif per platform
    const [activeSettingIndex, setActiveSettingIndex] = useState<Record<string | number, number>>({});
    const [isButtonActive, setIsButtonActive] = useState(false);

    const getMonthOptions = () => {
        const options: { value: string; label: string }[] = [];
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

    const { data, setData, post, processing } = useForm({
        event_id: adPlan.event?.id || '',
        batch: adPlan.batch ?? '',
        cost_month: adPlan.cost_month ?? '',
        revenue_month: adPlan.revenue_month ?? '',
        title_flayer: adPlan.title_flayer,
        image_flayer: adPlan.image_flayer,
        ad_plan_id: adPlan.id,
        user_id: adPlan.user_id,
        ad_schedule_time: adPlan.ad_schedule_time,
        platforms: initialPlatformSettings,
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

    // Setting untuk platform aktif
    const currentPlatformSettings = data.platforms.filter((p: any) => Number(p.platform_id) === Number(activePlatformId));
    const currentSettingIdx = activeSettingIndex[activePlatformId] ?? 0;
    const activeSetting = currentPlatformSettings[currentSettingIdx] || currentPlatformSettings[0];

    const activePlatformObj = platforms.find((p: any) => Number(p.id) === Number(activePlatformId));
    const tab = activePlatformObj?.name.toLowerCase() || '';

    const [range, setRange] = useState<DateRange | undefined>({
        from: activeSetting?.start_date ? parseISO(activeSetting.start_date) : undefined,
        to: activeSetting?.end_date ? parseISO(activeSetting.end_date) : undefined,
    });

    useEffect(() => {
        setRange({
            from: activeSetting?.start_date ? parseISO(activeSetting.start_date) : undefined,
            to: activeSetting?.end_date ? parseISO(activeSetting.end_date) : undefined,
        });
    }, [activeSetting?.start_date, activeSetting?.end_date, activePlatformId, currentSettingIdx]);

    useEffect(() => {
        if (!activeSetting?.end_date) {
            setIsButtonActive(false);
            return;
        }
        const now = new Date();
        const end = new Date(activeSetting.end_date);
        setIsButtonActive(now >= end);
    }, [activeSetting?.end_date]);

    const handleTabChange = (val: string) => {
        const selected = platforms.find((p: any) => p.name.toLowerCase() === val);
        if (selected) setActivePlatformId(selected.id);
    };

    const updateActiveSettingField = (field: string, value: any) => {
        if (!activeSetting) return;
        setData(
            'platforms',
            data.platforms.map((p: any) => (p.temp_id === activeSetting.temp_id ? { ...p, [field]: value } : p)),
        );
    };

    const handleDateChange = (rangeValue: DateRange | undefined) => {
        setRange(rangeValue ?? undefined);
        if (rangeValue?.from) {
            const defaultM = format(rangeValue.from, 'yyyy-MM');
            if (!data.cost_month) setData('cost_month', defaultM);
            if (!data.revenue_month) setData('revenue_month', defaultM);
        }
        if (!activeSetting) return;
        setData(
            'platforms',
            data.platforms.map((p: any) =>
                p.temp_id === activeSetting.temp_id
                    ? {
                          ...p,
                          start_date: rangeValue?.from ? format(rangeValue.from, 'yyyy-MM-dd') : p.start_date,
                          end_date: rangeValue?.to ? format(rangeValue.to, 'yyyy-MM-dd') : p.end_date,
                      }
                    : p,
            ),
        );
    };

    // Tambah setting baru untuk platform ini
    const addSetting = () => {
        const newSetting = {
            id: undefined,
            temp_id: genId(),
            platform_id: activePlatformId,
            goals_id: '',
            start_date: activeSetting?.start_date || '',
            end_date: activeSetting?.end_date || '',
            daily_budget: '',
            audience_target: '',
            audience_type: 'targeted',
            type_audience_targeted: '',
            name_audience_targeted: '',
            audience_details: [],
            age_targeted: '',
            location_targeted: '',
            age_broad: '',
            location_broad: '',
        };
        setData('platforms', [...data.platforms, newSetting]);
        setActiveSettingIndex((prev) => ({
            ...prev,
            [activePlatformId]: currentPlatformSettings.length,
        }));
        toast.success('Setting baru berhasil ditambahkan untuk platform ini');
    };

    // Hapus setting dari platform ini
    const removeSetting = (settingToRemove: any) => {
        if (currentPlatformSettings.length <= 1) {
            toast.error('Minimal harus ada 1 setting untuk platform ini');
            return;
        }
        setData(
            'platforms',
            data.platforms.filter((p: any) => p.temp_id !== settingToRemove.temp_id),
        );
        setActiveSettingIndex((prev) => ({
            ...prev,
            [activePlatformId]: Math.max(0, currentSettingIdx - 1),
        }));
        toast.info('Setting berhasil dihapus');
    };

    const addAudience = () => {
        if (!activeSetting) return;
        const newItem = { id: genId(), type: '', names: [] as string[] };
        setData(
            'platforms',
            data.platforms.map((p: any) =>
                p.temp_id === activeSetting.temp_id
                    ? {
                          ...p,
                          audience_details: [...(p.audience_details || []), newItem],
                      }
                    : p,
            ),
        );
    };

    const handleAudienceChange = (audienceId: string, field: 'type' | 'names', value: string) => {
        if (!activeSetting) return;
        setData(
            'platforms',
            data.platforms.map((p: any) => {
                if (p.temp_id !== activeSetting.temp_id) return p;
                const audience = (p.audience_details || []).map((a: any) => {
                    if (a.id !== audienceId) return a;
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
                    .map((x: any) => (x.names || []).join(', '))
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

    const removeAudience = (audienceId: string) => {
        if (!activeSetting) return;
        setData(
            'platforms',
            data.platforms.map((p: any) => {
                if (p.temp_id !== activeSetting.temp_id) return p;
                const audience = (p.audience_details || []).filter((a: any) => a.id !== audienceId);
                const typeString = audience
                    .map((x: any) => x.type || '')
                    .filter(Boolean)
                    .join(';');
                const nameString = audience
                    .map((x: any) => (x.names || []).join(', '))
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
        // Ambil platform yang memiliki data terisi
        const filledPlatforms = data.platforms.filter((p: any) => {
            return (
                Boolean(p.platform_id) &&
                Boolean(p.goals_id) &&
                Boolean(p.start_date) &&
                Boolean(p.end_date) &&
                p.daily_budget !== '' &&
                p.daily_budget !== null &&
                p.daily_budget !== undefined
            );
        });

        if (filledPlatforms.length === 0 && submitMode !== 'draft') {
            toast.error('Isi minimal satu setting platform dengan tujuan, periode, dan budget harian.');
            return;
        }

        const updateRoute = isAdmin
            ? route('admin.marketing.update.mode', [adPlan.id, submitMode])
            : route('user.marketing.update.mode', [adPlan.id, submitMode]);

        // Kirim hanya platform yang valid
        setData('platforms', filledPlatforms);

        post(updateRoute, {
            preserveScroll: true,
            onSuccess: () => toast.success('Data berhasil diperbarui!'),
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                toast.error((firstError as string) ?? 'Gagal memperbarui data');
            },
        });
    };

    const renderTargetingFields = () => {
        const targetType = activeSetting?.audience_type || 'targeted';
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
                                        value={activeSetting?.age_targeted?.split('-')[0] || ''}
                                        onChange={(e) => {
                                            const max = activeSetting?.age_targeted?.split('-')[1] || '';
                                            updateActiveSettingField('age_targeted', `${toPlainNumber(e.target.value)}-${max}`);
                                        }}
                                    />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Max"
                                        maxLength={3}
                                        value={activeSetting?.age_targeted?.split('-')[1] || ''}
                                        onChange={(e) => {
                                            const min = activeSetting?.age_targeted?.split('-')[0] || '';
                                            updateActiveSettingField('age_targeted', `${min}-${toPlainNumber(e.target.value)}`);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* REVISI 1: Lokasi Targeted dengan autocomplete & history */}
                            <div>
                                <Label>Lokasi (Targeted)</Label>
                                <LocationAutocompleteInput
                                    value={activeSetting?.location_targeted || ''}
                                    onChange={(value) => updateActiveSettingField('location_targeted', value)}
                                    historySuggestions={locationTargetedHistory}
                                />
                            </div>

                            {/* TAMBAHAN 1: Detail Target Peserta dengan AudienceAutocompleteInput */}
                            <div>
                                <Label>Detail Target Peserta</Label>
                                <div className="space-y-3">
                                    {(activeSetting?.audience_details || []).map((audience: any) => (
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

                                            <AudienceAutocompleteInput
                                                value={Array.isArray(audience.names) ? audience.names.join(', ') : (audience.names || '')}
                                                onChange={(value) => handleAudienceChange(audience.id, 'names', value)}
                                                historySuggestions={audienceHistory}
                                            />

                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeAudience(audience.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full bg-primary text-white hover:bg-blue-700"
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
                            <div>
                                <Label>Umur (Broad)</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Min"
                                        maxLength={3}
                                        value={activeSetting?.age_broad?.split('-')[0] || ''}
                                        onChange={(e) => {
                                            const max = activeSetting?.age_broad?.split('-')[1] || '';
                                            updateActiveSettingField('age_broad', `${toPlainNumber(e.target.value)}-${max}`);
                                        }}
                                    />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Max"
                                        maxLength={3}
                                        value={activeSetting?.age_broad?.split('-')[1] || ''}
                                        onChange={(e) => {
                                            const min = activeSetting?.age_broad?.split('-')[0] || '';
                                            updateActiveSettingField('age_broad', `${min}-${toPlainNumber(e.target.value)}`);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* REVISI 1: Lokasi Broad dengan autocomplete & history */}
                            <div>
                                <Label>Lokasi Broad</Label>
                                <LocationAutocompleteInput
                                    value={activeSetting?.location_broad || ''}
                                    onChange={(value) => updateActiveSettingField('location_broad', value)}
                                    historySuggestions={locationBroadHistory}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFormContent = () => (
        <div className="mt-4">
            {/* TAMBAHAN 2: Setting Switcher Bar (Multiple Settings per Platform) */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground mr-1">Setting Iklan:</span>
                    {currentPlatformSettings.map((s: any, idx: number) => {
                        const goalName = goals.find((g: any) => Number(g.id) === Number(s.goals_id))?.name;
                        return (
                            <Button
                                key={s.temp_id || idx}
                                type="button"
                                size="sm"
                                variant={idx === currentSettingIdx ? 'default' : 'outline'}
                                className={cn(
                                    'h-7 px-3 text-xs',
                                    idx === currentSettingIdx ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground',
                                )}
                                onClick={() => setActiveSettingIndex((prev) => ({ ...prev, [activePlatformId]: idx }))}
                            >
                                Setting {idx + 1}
                                {goalName ? ` (${goalName})` : ''}
                            </Button>
                        );
                    })}
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-zinc-800"
                        onClick={addSetting}
                    >
                        <Plus className="h-3 w-3 mr-1" /> Tambah Setting
                    </Button>
                </div>

                {currentPlatformSettings.length > 1 && (
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => removeSetting(activeSetting)}
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus Setting {currentSettingIdx + 1}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label>Periode Iklan</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn('w-full justify-start', !range?.from && 'text-muted-foreground')}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {activeSetting?.start_date && activeSetting?.end_date
                                        ? `${format(new Date(activeSetting.start_date), 'dd MMM yyyy')} - ${format(new Date(activeSetting.end_date), 'dd MMM yyyy')}`
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
                                        '[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-white',
                                        '[&_.rdp-day_range_middle]:bg-blue-100 [&_.rdp-day_range_middle]:text-zinc-800',
                                        '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
                                    )}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* ALOKASI BULAN PELAPORAN */}
                    <div className="rounded-lg border p-4 space-y-3 bg-card">
                        <div className="flex items-center gap-2 font-medium text-sm">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <span>Alokasi bulan pelaporan</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                    <div className="space-y-3">
                        <Label>Tujuan Iklan</Label>
                        <Select
                            required
                            value={activeSetting?.goals_id ? String(activeSetting.goals_id) : ''}
                            onValueChange={(value) => updateActiveSettingField('goals_id', Number(value))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih tujuan iklan" />
                            </SelectTrigger>
                            <SelectContent>
                                {goals?.map((goal: any) => (
                                    <SelectItem key={goal.id} value={String(goal.id)}>
                                        {goal.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3">
                        <Label>Jenis Target Peserta</Label>
                        <Select
                            value={activeSetting?.audience_type || 'targeted'}
                            onValueChange={(value) => updateActiveSettingField('audience_type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih jenis target" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="targeted">Targeted</SelectItem>
                                <SelectItem value="broad">Broad</SelectItem>
                                <SelectItem value="combined">Combined</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label>Budget Harian</Label>
                        <Input
                            placeholder="Rp. 0"
                            inputMode="numeric"
                            maxLength={13}
                            value={formatRupiah(activeSetting?.daily_budget || '')}
                            onChange={(e) => updateActiveSettingField('daily_budget', toPlainNumber(e.target.value))}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Target Peserta (jumlah)</Label>
                        <Input
                            placeholder="Masukkan jumlah target audiens"
                            inputMode="numeric"
                            maxLength={10}
                            value={formatNol(activeSetting?.audience_target || '')}
                            onChange={(e) => updateActiveSettingField('audience_target', toPlainNumber(e.target.value))}
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

                <form onSubmit={(e) => e.preventDefault()}>
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

                                    {/* REVISI 2: Nama Event dan Batch Iklan bersebelahan */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <div>
                                            <Label>Batch Iklan</Label>
                                            <Input
                                                type="text"
                                                name="batch"
                                                value={data.batch ?? ''}
                                                onChange={(e) => setData('batch', e.target.value)}
                                                placeholder="Masukkan batch iklan"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Versi/nomor rencana iklan untuk event ini</p>
                                        </div>
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

                                <Tabs value={String(tab)} onValueChange={handleTabChange}>
                                    <TabsList className="flex w-full flex-row justify-start gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                                        {platforms.map((p: any) => (
                                            <TabsTrigger
                                                key={p.id}
                                                value={p.name.toLowerCase()}
                                                className="px-20"
                                            >
                                                {p.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>

                                    {platforms.map((p: any) => (
                                        <TabsContent key={p.id} value={p.name.toLowerCase()}>
                                            {renderFormContent()}
                                        </TabsContent>
                                    ))}
                                </Tabs>

                                <div className="flex flex-col gap-3 pt-4 md:flex-row md:justify-between">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-gray-400 text-gray-700 hover:bg-gray-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                        onClick={() => window.history.back()}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                    </Button>
                                    <div className="flex flex-row justify-between gap-2 md:justify-end">
                                        <Button
                                            type="button"
                                            disabled={processing || !activeSetting?.goals_id}
                                            className="bg-gray-500 text-white hover:bg-gray-600"
                                            onClick={() => handleSubmit('draft')}
                                        >
                                            {processing ? 'Menyimpan...' : 'Perbarui Data'}
                                        </Button>

                                        <Button
                                            type="button"
                                            disabled={!isButtonActive || processing || !activeSetting?.goals_id}
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
