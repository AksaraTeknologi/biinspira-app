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
import { useState } from 'react';
import { toast } from 'sonner';

export default function PerencanaanIklan() {
    const { props } = usePage();
    const { events, goals, users, auth } = props as {
        events: { id: number; name: string; date?: string }[];
        goals: { id: number; name: string }[];
        users: { id: number; name: string }[];
        auth: { user: { id: number; name: string; role: string } };
    };
    const isAdmin = Array.isArray(auth?.role) ? auth.role.includes('admin') : auth?.role === 'admin';
    const [formState, setFormState] = useState<Record<string, any>>({
        boost: { audience_details: [] },
        meta: { audience_details: [] },
        business: { audience_details: [] },
    });

    const platformMap: Record<string, string> = {
        boost: '1',
        meta: '2',
        business: '3',
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

    const [tab, setTab] = useState<'boost' | 'meta' | 'business'>('boost');
    const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
    const [selectedEvent, setSelectedEvent] = useState('');
    const { post, processing } = useForm({});

    const handleTabChange = (val: 'boost' | 'meta' | 'business') => {
        setTab(val);
    };

    const handleInputChange = (field: string, value: any) => {
        setFormState((prev) => ({
            ...prev,
            [tab]: {
                ...prev[tab],
                [field]: value,
            },
        }));
    };

    const handleDateChange = (rangeValue: { from?: Date; to?: Date } | undefined) => {
        setRange(rangeValue || {});
        if (rangeValue?.from) handleInputChange('start_date', format(rangeValue.from, 'yyyy-MM-dd'));
        if (rangeValue?.to) handleInputChange('end_date', format(rangeValue.to, 'yyyy-MM-dd'));
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

        const filteredData = Object.entries(formState)
            .filter(([_, value]) => {
                const entries = Object.entries(value || {});
                const meaningfulFields = entries.filter(([key, val]) => {
                    return val !== null && val !== '' && !['platform_id', 'event_id', 'user_id', 'audience_type', 'audience_details'].includes(key);
                });
                const hasAudienceDetails = value.audience_details && value.audience_details.length > 0;
                return meaningfulFields.length > 0 || hasAudienceDetails;
            })
            .reduce(
                (acc, [key, value]) => {
                    const audienceDetails = value.audience_details || [];

                    // Perbaikan: ambil type dan name dari setiap audience detail
                    const type_audience_targeted = audienceDetails
                        .map((ad: any) => ad.type) // Langsung ambil string type
                        .filter(Boolean)
                        .join(';');

                    const name_audience_targeted = audienceDetails
                        .map((ad: any) => ad.name) // Langsung ambil string name
                        .filter(Boolean)
                        .join(';');

                    const { audience_details, ...restOfValue } = value;
                    acc[key] = {
                        ...restOfValue,
                        daily_budget: parseInt(value.daily_budget || 0),
                        audience_type: value?.audience_type || 'targeted',
                        event_id: selectedEvent || null,
                        platform_id: platformMap[key],
                        user_id: isAdmin ? value?.user_id : auth?.user?.id,
                        type_audience_targeted: type_audience_targeted,
                        name_audience_targeted: name_audience_targeted,
                    };
                    return acc;
                },
                {} as Record<string, any>,
            );

        if (!selectedEvent) {
            toast.error('Pilih event terlebih dahulu!');
            return;
        }

        if (Object.keys(filteredData).length === 0) {
            toast.error('Isi minimal satu tab sebelum menyimpan!');
            return;
        }

        const routeName = isAdmin ? 'admin.marketing.store' : 'user.marketing.store';
        router.post(
            route(routeName),
            { ...filteredData, mode },
            {
                onSuccess: () => toast.success('Data berhasil disimpan!'),
                onError: () => toast.error('Gagal menyimpan data.'),
            },
        );
    };

    const renderTargetingFields = (platformData: any) => {
        const targetType = platformData?.audience_type || 'targeted';
        const showTargeted = targetType === 'targeted' || targetType === 'combined';
        const showBroad = targetType === 'broad' || targetType === 'combined';

        return (
            <div className="mt-6 space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* AGE TARGETED */}
                    {showTargeted && (
                        <div className="space-y-4">
                            <div>
                                <Label>Umur (Targeted)</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="number"
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
                                        type="number"
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

                            <div>
                                <Label>Lokasi (Targeted)</Label>
                                <Input
                                    placeholder="Masukkan lokasi audiens"
                                    value={platformData?.location_targeted || ''}
                                    onChange={(e) => handleInputChange('location_targeted', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label>Detail Audiens</Label>
                                <div className="space-y-3">
                                    {/* 1. Ambil array 'audience_details' dari platformData */}
                                    {(platformData?.audience_details || []).map((audience: any, index: number) => (
                                        <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr,1fr,auto]">
                                            {/* Input Select untuk Tipe */}
                                            <Select value={audience.type} onValueChange={(val) => handleAudienceRowChange(index, 'type', val)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Jenis audiens" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['Industri', 'Pekerjaan', 'Bidang Studi', 'Tingkat Pendidikan', 'Minat', 'Lain-lain'].map(
                                                        (item) => (
                                                            <SelectItem key={item} value={item}>
                                                                {item}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>

                                            {/* Input Teks untuk Nama/Detail */}
                                            <Input
                                                placeholder="Detail audiens"
                                                value={audience.name}
                                                onChange={(e) => handleAudienceRowChange(index, 'name', e.target.value)}
                                            />

                                            {/* Tombol Hapus Baris (perlu import Trash2) */}
                                            <Button type="button" variant="destructive" size="icon" onClick={() => removeAudienceRow(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {/* 2. Tombol untuk menambah baris baru */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                        onClick={addAudienceRow}
                                    >
                                        + Tambah Jenis Audiens
                                    </Button>
                                </div>
                            </div>
                            {/* --- AKHIR BLOK DINAMIS --- */}
                        </div>
                    )}

                    {/* AGE BROAD */}
                    {showBroad && (
                        <div className="space-y-4">
                            <div>
                                <Label>Umur (Broad)</Label>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <Input
                                        type="number"
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
                                        type="number"
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

                            <div>
                                <Label>Lokasi (Broad)</Label>
                                <Input
                                    value={platformData?.location_broad || ''}
                                    onChange={(e) => handleInputChange('location_broad', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFormContent = () => {
        const currentData = formState[tab] || {};

        return (
            <div className="mt-6">
                {/* Kolom kiri (di mobile menjadi 1 kolom penuh) */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>Periode Iklan</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn('w-full justify-start', !range?.from && 'text-muted-foreground')}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {currentData.start_date && currentData.end_date
                                            ? `${format(new Date(currentData.start_date), 'dd MMM yyyy')} - ${format(
                                                  new Date(currentData.end_date),
                                                  'dd MMM yyyy',
                                              )}`
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
                        </div>

                        <div className="space-y-3">
                            <Label>Tujuan Iklan</Label>
                            <Select required value={currentData.goals_id || ''} onValueChange={(val) => handleInputChange('goals_id', val)}>
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
                            <Label>Jenis Target Audiens</Label>
                            <Select
                                required
                                value={currentData.audience_type || 'targeted'}
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

                    {/* Kolom kanan (di mobile turun ke bawah jadi 1 kolom juga) */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>Budget Harian</Label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="Rp. 0"
                                maxLength={13}
                                required
                                value={formatRupiah(currentData.daily_budget) || ''}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    handleInputChange('daily_budget', raw);
                                }}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Target Audiens (jumlah)</Label>
                            <Input
                                type="text"
                                inputMode="numeric"
                                maxLength={10}
                                required
                                placeholder="Masukkan jumlah target audiens"
                                value={formatNol(currentData.audience_target) || ''}
                                onChange={(e) => handleInputChange('audience_target', toPlainNumber(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* Targeting fields full width */}
                <div className="col-span-2">{renderTargetingFields(currentData)}</div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6">
                <h2 className="text-2xl font-semibold">Perencanaan Iklan</h2>

                <form onSubmit={handleSubmit}>
                    <Card className="w-full border-zinc-200 shadow-md">
                        <CardHeader>
                            <CardTitle>Perencanaan Iklan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {/* Pilihan user & event */}
                                <div>
                                    {isAdmin && (
                                        <div className="mb-4">
                                            <Label>User</Label>
                                            <Select
                                                value={formState[tab]?.user_id || ''}
                                                onValueChange={(val) => {
                                                    setFormState((prev) => ({
                                                        boost: { ...prev.boost, user_id: val },
                                                        meta: { ...prev.meta, user_id: val },
                                                        business: { ...prev.business, user_id: val },
                                                    }));
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

                                    <Label>Nama Event</Label>
                                    <Select required value={selectedEvent} onValueChange={(val) => setSelectedEvent(val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih nama event" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {events?.map((event) => (
                                                <SelectItem key={event.id} value={String(event.id)}>
                                                    {event.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Tabs */}
                                <Tabs value={tab} onValueChange={handleTabChange}>
                                    <TabsList className="mb-4 grid w-full grid-cols-3 text-sm md:text-base">
                                        <TabsTrigger value="boost">Boost Post</TabsTrigger>
                                        <TabsTrigger value="meta">Meta Ads</TabsTrigger>
                                        <TabsTrigger value="business">Business Suite</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="boost">{renderFormContent()}</TabsContent>
                                    <TabsContent value="meta">{renderFormContent()}</TabsContent>
                                    <TabsContent value="business">{renderFormContent()}</TabsContent>
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
                                            disabled={processing}
                                            className="bg-gray-500 text-white hover:bg-gray-600"
                                            onClick={(e) => handleSubmit(e, 'draft')}
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan Draft'}
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
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
