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
import { router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, CalendarIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { LocationAutocompleteInput } from '@/components/ui/locationautocompleteinput';

// ============================================================
// TIPE
// ============================================================
interface Platform {
    id: number;
    name: string;
    slug: string;
}

type Event = {
    id: number;
    name: string;
    batch: string;
};

// ============================================================
// KOMPONEN UTAMA
// ============================================================
export default function PerencanaanIklan() {
    const { props } = usePage();
    const { events, goals, users, auth, platforms, history } = props as unknown as {
        events: { id: number; name: string; date?: string }[];
        platforms: { id: number; name: string }[];
        goals: { id: number; name: string }[];
        users: { id: number; name: string }[];
        auth: { user: { id: number; name: string; role: string } };
        history: {
            location_targeted: string[];
            location_broad: string[];
            // field lain tidak dipakai lagi untuk suggestion
        };
    };

    // ✅ Hanya suggestion lokasi yang dipakai
    const locationTargetedHistory = (history?.location_targeted || []).map(String);
    const locationBroadHistory    = (history?.location_broad    || []).map(String);

    const isAdmin = Array.isArray(auth?.role) ? auth.role.includes('admin') : auth?.role === 'admin';
    const [formState, setFormState] = useState<Record<number, any>>(() =>
        platforms.reduce(
            (acc, platform) => {
                acc[platform.id] = { audience_details: [] };
                return acc;
            },
            {} as Record<number, any>,
        ),
    );

    const [selectedUser,    setSelectedUser]    = useState<string | null>(null);
    const [filteredEvents,  setFilteredEvents]  = useState(events);
    const [adScheduleTime,  setAdScheduleTime]  = useState('00:00');
    const [imageFlayer,     setImageFlayer]     = useState<File | null>(null);
    const [selectedEvent,   setSelectedEvent]   = useState('');
    const [tab,             setTab]             = useState<number>(() => platforms[0]?.id ?? 0);
    const [range,           setRange]           = useState<{ from?: Date; to?: Date }>({});
    const { post, processing } = useForm({});

    const formatRupiah = (value: string | number) => {
        if (!value) return '';
        const numberString = value.toString().replace(/[^,\d]/g, '');
        const remainder    = numberString.length % 3;
        let rupiah         = numberString.substr(0, remainder);
        const thousands    = numberString.substr(remainder).match(/\d{3}/g);
        if (thousands) rupiah += (remainder ? '.' : '') + thousands.join('.');
        return rupiah ? 'Rp ' + rupiah : '';
    };

    const toPlainNumber = (value: string) => value.replace(/[^0-9]/g, '');

    const formatNol = (value: string | number) => {
        if (!value) return '';
        let s = value.toString().replace(/[^0-9]/g, '');
        const r = s.length % 3;
        let f = s.substr(0, r);
        const t = s.substr(r).match(/\d{3}/g);
        if (t) f += (r ? '.' : '') + t.join('.');
        return f;
    };

    const handleTabChange = (val: string) => setTab(Number(val));

    const handleInputChange = (field: string, value: any) => {
        setFormState((prev) => ({
            ...prev,
            [tab]: { ...prev[tab], [field]: value },
        }));
    };

    const handleDateChange = (rangeValue: { from?: Date; to?: Date } | undefined) => {
        setRange(rangeValue || {});
        if (rangeValue?.from) handleInputChange('start_date', format(rangeValue.from, 'yyyy-MM-dd'));
        if (rangeValue?.to)   handleInputChange('end_date',   format(rangeValue.to,   'yyyy-MM-dd'));
    };

    const addAudienceRow = () => {
        const currentAudiences = formState[tab]?.audience_details || [];
        handleInputChange('audience_details', [...currentAudiences, { type: '', name: '' }]);
    };

    const handleAudienceRowChange = (index: number, field: 'type' | 'name', value: string) => {
        const currentAudiences = [...(formState[tab]?.audience_details || [])];
        currentAudiences[index] = { ...currentAudiences[index], [field]: value };
        handleInputChange('audience_details', currentAudiences);
    };

    const removeAudienceRow = (index: number) => {
        const currentAudiences = [...(formState[tab]?.audience_details || [])];
        currentAudiences.splice(index, 1);
        handleInputChange('audience_details', currentAudiences);
    };

    const handleSubmit = (e: React.FormEvent, mode: 'draft' | 'next') => {
        e.preventDefault();

        const current = formState[tab];
        if (!current?.goals_id) { toast.error('Tujuan iklan wajib dipilih!'); return; }

        const filteredData = Object.entries(formState)
            .filter(([_, value]) => {
                const entries = Object.entries(value || {});
                const meaningfulFields = entries.filter(([key, val]) => {
                    return val !== null && val !== '' && !['platform_id', 'event_id', 'user_id', 'audience_type', 'audience_details'].includes(key);
                });
                const hasAudienceDetails = value.audience_details && value.audience_details.length > 0;
                return meaningfulFields.length > 0 || hasAudienceDetails;
            })
            .reduce((acc, [key, value]) => {
                const audienceDetails            = value.audience_details || [];
                const type_audience_targeted     = audienceDetails.map((ad: any) => ad.type).filter(Boolean).join(';');
                const name_audience_targeted     = audienceDetails.map((ad: any) => ad.name).filter(Boolean).join(';');
                const { audience_details, ...restOfValue } = value;
                acc[key] = {
                    ...restOfValue,
                    daily_budget:    parseInt(value.daily_budget || 0),
                    audience_type:   value?.audience_type || 'targeted',
                    event_id:        selectedEvent || null,
                    platform_id:     Number(key),
                    user_id:         isAdmin ? value?.user_id : auth?.user?.id,
                    type_audience_targeted,
                    name_audience_targeted,
                };
                return acc;
            }, {} as Record<string, any>);

        if (!selectedEvent)                     { toast.error('Pilih event terlebih dahulu!'); return; }
        if (Object.keys(filteredData).length === 0) { toast.error('Isi minimal satu tab sebelum menyimpan!'); return; }

        const routeName = isAdmin ? 'admin.marketing.store' : 'user.marketing.store';
        router.post(
            route(routeName),
            { ...filteredData, ad_schedule_time: adScheduleTime, image_flayer: imageFlayer, mode },
            {
                onSuccess: () => toast.success('Data berhasil disimpan!'),
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    toast.error(firstError ?? 'Gagal menyimpan data');
                },
            },
        );
    };

    const selectedEventData = filteredEvents.find((event) => String(event.id) === selectedEvent);

    // ============================================================
    // RENDER TARGETING — hanya lokasi pakai LocationAutocompleteInput
    // ============================================================
    const renderTargetingFields = (platformData: any) => {
        const targetType  = platformData?.audience_type || 'targeted';
        const showTargeted = targetType === 'targeted' || targetType === 'combined';
        const showBroad    = targetType === 'broad'    || targetType === 'combined';

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

                            {/* ✅ Lokasi Targeted — dengan history suggestion */}
                            <div>
                                <Label>Lokasi (Targeted)</Label>
                                <LocationAutocompleteInput
                                    value={platformData?.location_targeted || ''}
                                    onChange={(val) => handleInputChange('location_targeted', val)}
                                    historySuggestions={locationTargetedHistory}
                                />
                            </div>

                            <div>
                                <Label>Detail Peserta</Label>
                                <div className="space-y-3">
                                    {(platformData?.audience_details || []).map((audience: any, index: number) => (
                                        <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,1fr,auto]">
                                            <Select value={audience.type} onValueChange={(val) => handleAudienceRowChange(index, 'type', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Jenis audiens" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['Industri', 'Pekerjaan', 'Bidang Studi', 'Tingkat Pendidikan', 'Minat', 'Lain - lain'].map((item) => (
                                                        <SelectItem key={item} value={item}>{item}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            {/* ✅ Detail audiens — Input biasa (tidak ada suggestion) */}
                                            <Input
                                                placeholder="Detail audiens"
                                                value={audience.name}
                                                onChange={(e) => handleAudienceRowChange(index, 'name', e.target.value)}
                                            />

                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeAudienceRow(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
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

                            {/* ✅ Lokasi Broad — dengan history suggestion */}
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
    // RENDER FORM CONTENT — budget & target pakai Input biasa
    // ============================================================
    const renderFormContent = () => {
        const currentData = formState[tab] || {};

        return (
            <div className="mt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>Periode Iklan</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn('w-full justify-start', !range?.from && 'text-muted-foreground')}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {currentData.start_date && currentData.end_date
                                            ? `${format(new Date(currentData.start_date), 'dd MMM yyyy')} - ${format(new Date(currentData.end_date), 'dd MMM yyyy')}`
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
                        </div>

                        <div className="space-y-3">
                            <Label>Tujuan Iklan</Label>
                            <Select required value={currentData.goals_id || ''} onValueChange={(val) => handleInputChange('goals_id', val)}>
                                <SelectTrigger><SelectValue placeholder="Pilih tujuan iklan" /></SelectTrigger>
                                <SelectContent>
                                    {goals?.map((goal) => (
                                        <SelectItem key={goal.id} value={String(goal.id)}>{goal.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label>Jenis Target Peserta</Label>
                            <Select
                                required
                                value={currentData.audience_type || 'targeted'}
                                onValueChange={(val) => handleInputChange('audience_type', val)}
                            >
                                <SelectTrigger><SelectValue placeholder="Pilih jenis audiens" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="targeted">Targeted</SelectItem>
                                    <SelectItem value="broad">Broad</SelectItem>
                                    <SelectItem value="combined">Combined</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* ✅ Budget Harian — Input biasa */}
                        <div className="space-y-3">
                            <Label>Budget Harian</Label>
                            <Input
                                placeholder="Rp. 0"
                                inputMode="numeric"
                                maxLength={13}
                                value={formatRupiah(currentData.daily_budget) || ''}
                                onChange={(e) => handleInputChange('daily_budget', toPlainNumber(e.target.value))}
                            />
                        </div>

                        {/* ✅ Target Peserta — Input biasa */}
                        <div className="space-y-3">
                            <Label>Target Peserta (jumlah)</Label>
                            <Input
                                placeholder="Masukkan jumlah target audiens"
                                inputMode="numeric"
                                maxLength={10}
                                value={formatNol(currentData.audience_target) || ''}
                                onChange={(e) => handleInputChange('audience_target', toPlainNumber(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                <div className="col-span-2">{renderTargetingFields(currentData)}</div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="w-full space-y-6 p-4 md:p-6">
                <h2 className="text-2xl font-semibold">Perencanaan Iklan</h2>

                <form onSubmit={handleSubmit}>
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
                                                value={formState[tab]?.user_id || ''}
                                                onValueChange={(val) => {
                                                    setFormState((prev) => {
                                                        const updated = { ...prev };
                                                        Object.keys(updated).forEach((key) => {
                                                            updated[Number(key)] = { ...updated[Number(key)], user_id: val };
                                                        });
                                                        return updated;
                                                    });
                                                    setSelectedUser(val);
                                                    const filtered = events.filter((event) => String(event.user.id) === val);
                                                    setFilteredEvents(filtered);
                                                    setSelectedEvent('');
                                                }}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Pilih user" /></SelectTrigger>
                                                <SelectContent>
                                                    {users?.map((user) => (
                                                        <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Nama Event</Label>
                                            <Select value={selectedEvent} onValueChange={(val) => setSelectedEvent(val)}>
                                                <SelectTrigger><SelectValue placeholder="Pilih event" /></SelectTrigger>
                                                <SelectContent>
                                                    {filteredEvents.length > 0 ? (
                                                        filteredEvents.map((event) => (
                                                            <SelectItem key={event.id} value={String(event.id)}>{event.name}</SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="none" disabled>Tidak ada event</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Batch</Label>
                                            <Input
                                                type="text"
                                                value={selectedEventData?.batch ? `Batch ${Number(selectedEventData.batch)}` : '-'}
                                                readOnly
                                                className="bg-muted"
                                            />
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
                                    <TabsList className="w-full flex flex-row gap-3 overflow-x-auto justify-start" style={{ scrollbarWidth: 'none' }}>
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
                                        className="border-gray-400 text-gray-700 hover:bg-gray-100"
                                        onClick={() => window.history.back()}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                    </Button>
                                    <div className="flex flex-row justify-between gap-2 md:justify-end">
                                        <Button
                                            type="submit"
                                            disabled={processing || !formState[tab]?.goals_id}
                                            className="bg-gray-500 text-white hover:bg-gray-600"
                                            onClick={(e) => handleSubmit(e, 'draft')}
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan Draft'}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing || !formState[tab]?.goals_id}
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