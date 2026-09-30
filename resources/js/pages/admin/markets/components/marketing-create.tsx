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
import { router, useForm, usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ArrowRight, CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

// ============================================================
// TIPE
// ============================================================
interface Platform {
    id: number;
    name: string;
    slug?: string;
}

interface MonthOption {
    value: string;
    label: string;
}

type PlatformSetting = {
    goals_id?: number | string;
    start_date?: string;
    end_date?: string;
    daily_budget?: string | number;
    audience_target?: string | number;
    audience_type?: 'targeted' | 'broad' | 'combined';
    age_targeted?: string;
    location_targeted?: string;
    audience_details?: Array<{ type: string; name: string }>;
    age_broad?: string;
    location_broad?: string;
    user_id?: string | number;
};

// ============================================================
// KOMPONEN UTAMA
// ============================================================
export default function PerencanaanIklan() {
    const { props } = usePage();
    const { events, goals, users, auth, platforms, history } = props as unknown as {
        events: { id: number; name: string; date?: string; user: { id: number; name: string } }[];
        platforms: { id: number; name: string }[];
        goals: { id: number; name: string }[];
        users: { id: number; name: string }[];
        auth: { user: { id: number; name: string; role: string } };
        history: {
            location_targeted: string[];
            location_broad: string[];
            audience_names: string[];
        };
    };

    const locationTargetedHistory = (history?.location_targeted || []).map(String);
    const locationBroadHistory = (history?.location_broad || []).map(String);
    const audienceHistory = (history?.audience_names || []).map(String);

    const isAdmin = Array.isArray(auth?.user?.role) ? auth.user.role.includes('admin') : auth?.user?.role === 'admin';

    // State form menyimpan array setting per platform_id
    const [formState, setFormState] = useState<Record<number, PlatformSetting[]>>(() =>
        platforms.reduce(
            (acc, platform) => {
                acc[platform.id] = [{ audience_details: [], audience_type: 'targeted' }];
                return acc;
            },
            {} as Record<number, PlatformSetting[]>,
        ),
    );

    // Indeks setting yang aktif per platform
    const [activeSettingIndex, setActiveSettingIndex] = useState<Record<number, number>>({});

    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [filteredEvents, setFilteredEvents] = useState(events);
    const [adScheduleTime, setAdScheduleTime] = useState('00:00');
    const [imageFlayer, setImageFlayer] = useState<File | null>(null);
    const [batchValue, setBatchValue] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('');
    const [tab, setTab] = useState<number>(() => platforms[0]?.id ?? 0);
    const [range, setRange] = useState<DateRange | undefined>(undefined);
    const [costMonth, setCostMonth] = useState('');
    const [costMonth2, setCostMonth2] = useState('');
    const [showSecondCostMonth, setShowSecondCostMonth] = useState(false);
    const [revenueMonth, setRevenueMonth] = useState('');
    const { processing } = useForm({});

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

    const currentSettings = formState[tab] || [{ audience_details: [], audience_type: 'targeted' }];
    const currentSettingIdx = activeSettingIndex[tab] ?? 0;
    const currentSettingData = currentSettings[currentSettingIdx] || currentSettings[0];

    // Sinkronisasi rentang tanggal dengan setting aktif saat ini
    useEffect(() => {
        const from = currentSettingData?.start_date ? parseISO(currentSettingData.start_date) : undefined;
        const to = currentSettingData?.end_date ? parseISO(currentSettingData.end_date) : undefined;
        setRange(from || to ? { from, to } : undefined);
    }, [tab, currentSettingIdx, currentSettingData?.start_date, currentSettingData?.end_date]);

    const formatRupiah = (value: string | number) => {
        if (!value) return '';
        const numberString = value.toString().replace(/[^,\d]/g, '');
        const remainder = numberString.length % 3;
        let rupiah = numberString.substr(0, remainder);
        const thousands = numberString.substr(remainder).match(/\d{3}/g);
        if (thousands) rupiah += (remainder ? '.' : '') + thousands.join('.');
        return rupiah ? 'Rp ' + rupiah : '';
    };

    const toPlainNumber = (value: string) => value.replace(/[^0-9]/g, '');

    const formatNol = (value: string | number) => {
        if (!value) return '';
        const s = value.toString().replace(/[^0-9]/g, '');
        const r = s.length % 3;
        let f = s.substr(0, r);
        const t = s.substr(r).match(/\d{3}/g);
        if (t) f += (r ? '.' : '') + t.join('.');
        return f;
    };

    const handleTabChange = (val: string) => {
        setTab(Number(val));
    };

    const handleInputChange = (field: string, value: any) => {
        setFormState((prev) => {
            const list = [...(prev[tab] || [{ audience_details: [], audience_type: 'targeted' }])];
            const idx = activeSettingIndex[tab] || 0;
            list[idx] = { ...list[idx], [field]: value };
            return {
                ...prev,
                [tab]: list,
            };
        });
    };

    const handleDateChange = (rangeValue: DateRange | undefined) => {
        setRange(rangeValue || undefined);
        if (rangeValue?.from) {
            handleInputChange('start_date', format(rangeValue.from, 'yyyy-MM-dd'));
            const defaultM = format(rangeValue.from, 'yyyy-MM');
            if (!costMonth) setCostMonth(defaultM);
            if (!revenueMonth) setRevenueMonth(defaultM);

            if (rangeValue.to) {
                const endM = format(rangeValue.to, 'yyyy-MM');
                if (endM !== defaultM && !costMonth2) {
                    setCostMonth(costMonth || defaultM);
                    setCostMonth2(endM);
                    setShowSecondCostMonth(true);
                }
            }
        }
        if (rangeValue?.to) handleInputChange('end_date', format(rangeValue.to, 'yyyy-MM-dd'));
    };

    // Tambah setting baru untuk platform aktif saat ini
    const addSetting = () => {
        setFormState((prev) => {
            const list = [...(prev[tab] || [])];
            const last = list[list.length - 1];
            const newSetting: PlatformSetting = {
                audience_details: [],
                audience_type: 'targeted',
                start_date: last?.start_date || '',
                end_date: last?.end_date || '',
            };
            const nextList = [...list, newSetting];
            setActiveSettingIndex((idxMap) => ({ ...idxMap, [tab]: nextList.length - 1 }));
            return {
                ...prev,
                [tab]: nextList,
            };
        });
        toast.success('Setting baru berhasil ditambahkan untuk platform ini');
    };

    // Hapus setting dari platform aktif
    const removeSetting = (indexToRemove: number) => {
        setFormState((prev) => {
            const list = [...(prev[tab] || [])];
            if (list.length <= 1) {
                toast.error('Minimal harus ada 1 setting untuk platform ini');
                return prev;
            }
            list.splice(indexToRemove, 1);
            setActiveSettingIndex((idxMap) => ({
                ...idxMap,
                [tab]: Math.max(0, indexToRemove - 1),
            }));
            return {
                ...prev,
                [tab]: list,
            };
        });
        toast.info('Setting berhasil dihapus');
    };

    const addAudienceRow = () => {
        const currentAudiences = currentSettingData?.audience_details || [];
        handleInputChange('audience_details', [...currentAudiences, { type: '', name: '' }]);
    };

    const handleAudienceRowChange = (index: number, field: 'type' | 'name', value: string) => {
        const currentAudiences = [...(currentSettingData?.audience_details || [])];
        currentAudiences[index] = { ...currentAudiences[index], [field]: value };
        handleInputChange('audience_details', currentAudiences);
    };

    const removeAudienceRow = (index: number) => {
        const currentAudiences = [...(currentSettingData?.audience_details || [])];
        currentAudiences.splice(index, 1);
        handleInputChange('audience_details', currentAudiences);
    };

    const handleSubmit = (e: React.FormEvent, mode: 'draft' | 'next') => {
        e.preventDefault();

        if (!selectedEvent) {
            toast.error('Pilih event terlebih dahulu!');
            return;
        }

        const allPlatformSettings: any[] = [];

        Object.entries(formState).forEach(([platformIdStr, settingsList]) => {
            const platformId = Number(platformIdStr);
            settingsList.forEach((setting) => {
                const audienceDetails = setting.audience_details || [];
                const type_audience_targeted = audienceDetails
                    .map((ad: any) => ad.type)
                    .filter(Boolean)
                    .join(';');
                const name_audience_targeted = audienceDetails
                    .map((ad: any) => ad.name)
                    .filter(Boolean)
                    .join(';');
                const { audience_details, ...restOfValue } = setting;

                const hasGoals = Boolean(setting.goals_id);
                const hasBudget = setting.daily_budget !== '' && setting.daily_budget !== null && setting.daily_budget !== undefined;
                const hasDates = Boolean(setting.start_date && setting.end_date);

                if (hasGoals || hasBudget || hasDates || audienceDetails.length > 0) {
                    allPlatformSettings.push({
                        ...restOfValue,
                        platform_id: platformId,
                        event_id: selectedEvent,
                        user_id: isAdmin ? setting.user_id : auth?.user?.id,
                        daily_budget: parseInt(String(setting.daily_budget || 0)),
                        audience_target: parseInt(String(setting.audience_target || 0)),
                        audience_type: setting?.audience_type || 'targeted',
                        type_audience_targeted,
                        name_audience_targeted,
                    });
                }
            });
        });

        if (allPlatformSettings.length === 0) {
            toast.error('Isi minimal satu setting platform sebelum menyimpan!');
            return;
        }

        if (mode !== 'draft') {
            const missingGoal = allPlatformSettings.find((s) => !s.goals_id);
            if (missingGoal) {
                toast.error('Tujuan iklan wajib dipilih untuk setiap setting yang diisi!');
                return;
            }
        }

        const routeName = isAdmin ? 'admin.marketing.store' : 'user.marketing.store';
        router.post(
            route(routeName),
            {
                platforms: allPlatformSettings,
                ad_schedule_time: adScheduleTime,
                batch: batchValue,
                cost_month: costMonth,
                cost_month_2: costMonth2 || null,
                revenue_month: revenueMonth,
                image_flayer: imageFlayer,
                mode,
            },
            {
                onSuccess: () => toast.success('Data berhasil disimpan!'),
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(firstError ?? 'Gagal menyimpan data');
                },
            },
        );
    };

    // ============================================================
    // RENDER TARGETING
    // ============================================================
    const renderTargetingFields = (platformData: PlatformSetting) => {
        const targetType = platformData?.audience_type || 'targeted';
        const showTargeted = targetType === 'targeted' || targetType === 'combined';
        const showBroad = targetType === 'broad' || targetType === 'combined';

        return (
            <div className="mt-6 space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* TARGETED */}
                    {showTargeted && (
                        <div className="space-y-4">
                            <div>
                                <Label>Umur (Targeted)</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Min"
                                        maxLength={3}
                                        value={platformData?.age_targeted?.split('-')[0] || ''}
                                        onChange={(e) => {
                                            const min = e.target.value;
                                            const max = platformData?.age_targeted?.split('-')[1] || '';
                                            handleInputChange('age_targeted', `${min}-${max}`);
                                        }}
                                    />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Max"
                                        maxLength={3}
                                        value={platformData?.age_targeted?.split('-')[1] || ''}
                                        onChange={(e) => {
                                            const max = e.target.value;
                                            const min = platformData?.age_targeted?.split('-')[0] || '';
                                            handleInputChange('age_targeted', `${min}-${max}`);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Lokasi Targeted — dengan history suggestion */}
                            <div>
                                <Label>Lokasi (Targeted)</Label>
                                <LocationAutocompleteInput
                                    value={platformData?.location_targeted || ''}
                                    onChange={(val) => handleInputChange('location_targeted', val)}
                                    historySuggestions={locationTargetedHistory}
                                />
                            </div>

                            <div>
                                <Label>Detail Target Peserta</Label>
                                <div className="space-y-3">
                                    {(platformData?.audience_details || []).map((audience: any, index: number) => (
                                        <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,1fr,auto]">
                                            <Select value={audience.type} onValueChange={(val) => handleAudienceRowChange(index, 'type', val)}>
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

                                            {/* Detail audiens — dengan autocomplete history */}
                                            <AudienceAutocompleteInput
                                                value={audience.name || ''}
                                                onChange={(val) => handleAudienceRowChange(index, 'name', val)}
                                                historySuggestions={audienceHistory}
                                            />

                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeAudienceRow(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full bg-primary text-white hover:bg-blue-700"
                                        onClick={addAudienceRow}
                                    >
                                        + Tambah Jenis Target Peserta
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BROAD */}
                    {showBroad && (
                        <div className="space-y-4">
                            <div>
                                <Label>Umur (Broad)</Label>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Min"
                                        maxLength={3}
                                        value={platformData?.age_broad?.split('-')[0] || ''}
                                        onChange={(e) => {
                                            const min = e.target.value;
                                            const max = platformData?.age_broad?.split('-')[1] || '';
                                            handleInputChange('age_broad', `${min}-${max}`);
                                        }}
                                    />
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Max"
                                        maxLength={3}
                                        value={platformData?.age_broad?.split('-')[1] || ''}
                                        onChange={(e) => {
                                            const max = e.target.value;
                                            const min = platformData?.age_broad?.split('-')[0] || '';
                                            handleInputChange('age_broad', `${min}-${max}`);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Lokasi Broad — dengan history suggestion */}
                            <div>
                                <Label>Lokasi (Broad)</Label>
                                <LocationAutocompleteInput
                                    value={platformData?.location_broad || ''}
                                    onChange={(val) => handleInputChange('location_broad', val)}
                                    historySuggestions={locationBroadHistory}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ============================================================
    // RENDER FORM CONTENT PER PLATFORM
    // ============================================================
    const renderFormContent = () => {
        return (
            <div className="mt-4">
                {/* Setting Switcher Tabs (Multiple Settings per Platform) */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-muted-foreground mr-1">Setting Iklan:</span>
                        {currentSettings.map((s, idx) => {
                            const goalName = goals.find((g) => Number(g.id) === Number(s.goals_id))?.name;
                            return (
                                <Button
                                    key={idx}
                                    type="button"
                                    size="sm"
                                    variant={idx === currentSettingIdx ? 'default' : 'outline'}
                                    className={cn(
                                        'h-7 px-3 text-xs',
                                        idx === currentSettingIdx ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground',
                                    )}
                                    onClick={() => setActiveSettingIndex((prev) => ({ ...prev, [tab]: idx }))}
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

                    {currentSettings.length > 1 && (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => removeSetting(currentSettingIdx)}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus Setting {currentSettingIdx + 1}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>Periode Iklan</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn('w-full justify-start', !range?.from && 'text-muted-foreground')}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {currentSettingData.start_date && currentSettingData.end_date
                                            ? `${format(new Date(currentSettingData.start_date), 'dd MMM yyyy')} - ${format(new Date(currentSettingData.end_date), 'dd MMM yyyy')}`
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                    <span>Alokasi bulan pelaporan</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    onClick={() => {
                                        if (showSecondCostMonth) {
                                            setCostMonth2('');
                                            setShowSecondCostMonth(false);
                                        } else {
                                            setShowSecondCostMonth(true);
                                        }
                                    }}
                                >
                                    {showSecondCostMonth ? '- Hapus Bulan Biaya ke-2' : '+ Tambah Bulan Biaya Iklan (Spend 2 Bulan)'}
                                </Button>
                            </div>
                            <div className={cn('grid grid-cols-1 gap-4', showSecondCostMonth ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                                <div>
                                    <Label className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                        <span>Biaya iklan masuk bulan {showSecondCostMonth ? '(Bulan 1)' : ''}</span>
                                    </Label>
                                    <Select value={costMonth} onValueChange={setCostMonth}>
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
                                        <Select value={costMonth2} onValueChange={setCostMonth2}>
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
                                    <Select value={revenueMonth} onValueChange={setRevenueMonth}>
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
                            {showSecondCostMonth && costMonth && costMonth2 ? (
                                <p className="text-xs text-blue-500 flex items-center gap-1 font-medium">
                                    <span>ℹ</span> Biaya iklan dialokasikan ke 2 bulan: {monthOptions.find(o => o.value === costMonth)?.label || costMonth} & {monthOptions.find(o => o.value === costMonth2)?.label || costMonth2}.
                                </p>
                            ) : costMonth && revenueMonth && costMonth === revenueMonth ? (
                                <p className="text-xs text-green-500 flex items-center gap-1 font-medium">
                                    <span>✓</span> Biaya iklan dan omset sinkron di bulan yang sama.
                                </p>
                            ) : costMonth && revenueMonth ? (
                                <p className="text-xs text-amber-500 flex items-center gap-1 font-medium">
                                    <span>ℹ</span> Biaya iklan dan omset dialokasikan pada bulan yang berbeda.
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-3">
                            <Label>Tujuan Iklan</Label>
                            <Select
                                required
                                value={currentSettingData.goals_id ? String(currentSettingData.goals_id) : ''}
                                onValueChange={(val) => handleInputChange('goals_id', Number(val))}
                            >
                                <SelectTrigger>
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

                        <div className="space-y-3">
                            <Label>Jenis Target Peserta</Label>
                            <Select
                                required
                                value={currentSettingData.audience_type || 'targeted'}
                                onValueChange={(val) => handleInputChange('audience_type', val)}
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

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>Budget Harian</Label>
                            <Input
                                placeholder="Rp. 0"
                                inputMode="numeric"
                                maxLength={13}
                                value={formatRupiah(currentSettingData.daily_budget || '')}
                                onChange={(e) => handleInputChange('daily_budget', toPlainNumber(e.target.value))}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Target Peserta (jumlah)</Label>
                            <Input
                                placeholder="Masukkan jumlah target audiens"
                                inputMode="numeric"
                                maxLength={10}
                                value={formatNol(currentSettingData.audience_target || '')}
                                onChange={(e) => handleInputChange('audience_target', toPlainNumber(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-span-2">{renderTargetingFields(currentSettingData)}</div>
            </div>
        );
    };

    const breadcrumbs = [
        { title: 'Marketing', href: route('admin.marketing.index') },
        { title: 'Perencanaan Iklan', href: route('admin.marketing.create') },
    ];

    const hasAnyValidSetting = Object.values(formState).some((settings) =>
        settings.some((s) => Boolean(s.goals_id)),
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full space-y-6 p-4 md:p-6">
                <h2 className="text-2xl font-semibold">Perencanaan Iklan</h2>

                <form onSubmit={(e) => e.preventDefault()}>
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader>
                            <CardTitle>Perencanaan Iklan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                <div>
                                    {isAdmin && (
                                        <div className="mb-4">
                                            <Label>User</Label>
                                            <Select
                                                value={selectedUser || ''}
                                                onValueChange={(val) => {
                                                    setFormState((prev) => {
                                                        const updated = { ...prev };
                                                        Object.keys(updated).forEach((key) => {
                                                            updated[Number(key)] = (updated[Number(key)] || []).map((s) => ({
                                                                ...s,
                                                                user_id: val,
                                                            }));
                                                        });
                                                        return updated;
                                                    });
                                                    setSelectedUser(val);
                                                    const filtered = events.filter((event) => String(event.user.id) === val);
                                                    setFilteredEvents(filtered);
                                                    setSelectedEvent('');
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih user" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {users?.map((user) => (
                                                        <SelectItem key={user.id} value={String(user.id)}>
                                                            {user.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Nama Event</Label>
                                            <Select value={selectedEvent} onValueChange={(val) => setSelectedEvent(val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih event" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {filteredEvents.length > 0 ? (
                                                        filteredEvents.map((event) => (
                                                            <SelectItem key={event.id} value={String(event.id)}>
                                                                {event.name}
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="none" disabled>
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
                                                value={batchValue}
                                                onChange={(e) => setBatchValue(e.target.value)}
                                                placeholder="Masukkan batch iklan"
                                                required
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
                                            step={60}
                                            onChange={(e) => setAdScheduleTime(e.target.value)}
                                            defaultValue={'00:00:00'}
                                            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                        />
                                    </div>
                                    <div className="mt-4">
                                        <Label>Gambar Flayer</Label>
                                        <Input
                                            type="file"
                                            className="appearance-none bg-background"
                                            onChange={(e) => setImageFlayer(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                </div>

                                <Tabs value={String(tab)} onValueChange={handleTabChange}>
                                    <TabsList className="flex w-full flex-row justify-start gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                                        {platforms.map((platform) => (
                                            <TabsTrigger key={platform.id} value={String(platform.id)} className="px-20">
                                                {platform.name}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {platforms.map((platform) => (
                                        <TabsContent key={platform.id} value={String(platform.id)}>
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
                                            type="submit"
                                            disabled={processing || !hasAnyValidSetting}
                                            className="bg-gray-500 text-white hover:bg-gray-600"
                                            onClick={(e) => handleSubmit(e, 'draft')}
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan Draft'}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing || !hasAnyValidSetting}
                                            className="bg-primary text-white hover:bg-blue-700"
                                            onClick={(e) => handleSubmit(e, 'next')}
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
