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
import { ArrowLeft, CalendarIcon } from 'lucide-react';
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
        boost: {},
        meta: {},
        business: {},
    });

    const platformMap: Record<string, string> = {
        boost: '1',
        meta: '2',
        business: '3',
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

    const handleSubmit = (e: React.FormEvent, mode: 'draft' | 'next') => {
        e.preventDefault();

        const filteredData = Object.entries(formState)
            .filter(([_, value]) => {
                const entries = Object.entries(value || {});
                const meaningfulFields = entries.filter(([key, val]) => {
                    return val !== null && val !== '' && !['platform_id', 'event_id', 'user_id', 'audience_type'].includes(key);
                });
                return meaningfulFields.length > 0 || value?.audience_type;
            })
            .reduce(
                (acc, [key, value]) => {
                    acc[key] = {
                        ...value,
                        audience_type: value?.audience_type || 'targeted',
                        event_id: selectedEvent || null,
                        platform_id: platformMap[key],
                        user_id: isAdmin ? value?.user_id : auth?.user?.id,
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

        console.log('Auth:', auth);
        console.log('Data akhir yang dikirim:', filteredData);

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
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {showTargeted && (
                        <div className="space-y-4">
                            <div>
                                <Label>Umur (Targeted)</Label>
                                <Input
                                    type="number"
                                    placeholder="Masukkan umur target"
                                    value={platformData?.age_targeted || ''}
                                    onChange={(e) => handleInputChange('age_targeted', e.target.value)}
                                />
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
                                <Label>Jenis Audiens</Label>
                                <Select
                                    value={platformData?.type_audience_targeted || ''}
                                    onValueChange={(val) => handleInputChange('type_audience_targeted', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih jenis audiens" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['Industri', 'Pekerjaan', 'Bidang Studi', 'Tingkat Pendidikan', 'Minat', 'Lain-lain'].map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {item}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Detail Audiens</Label>
                                <Input
                                    placeholder="Masukkan detail audiens"
                                    value={platformData?.name_audience_targeted || ''}
                                    onChange={(e) => handleInputChange('name_audience_targeted', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {showBroad && (
                        <div className="space-y-4">
                            <div>
                                <Label>Umur (Broad)</Label>
                                <Input
                                    type="number"
                                    value={platformData?.age_broad || ''}
                                    onChange={(e) => handleInputChange('age_broad', e.target.value)}
                                />
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
            <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-2">
                {/* Kolom kiri: periode dan tujuan */}
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

                    <div className="mt-4">
                        <Label>Tujuan Iklan</Label>
                        <Select value={currentData.goals_id || ''} onValueChange={(val) => handleInputChange('goals_id', val)}>
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

                    <div className="mt-4">
                        <Label>Jenis Target Audiens</Label>
                        <Select value={currentData.audience_type || 'targeted'} onValueChange={(val) => handleInputChange('audience_type', val)}>
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

                {/* Kolom kanan: budget */}
                <div className="space-y-4">
                    <div>
                        <Label>Budget Harian</Label>
                        <Input
                            type="number"
                            placeholder="Rp. 0"
                            value={currentData.daily_budget || ''}
                            onChange={(e) => handleInputChange('daily_budget', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Target Audiens (jumlah)</Label>
                        <Input
                            type="number"
                            placeholder="Masukkan jumlah target audiens"
                            value={currentData.audience_target || ''}
                            onChange={(e) => handleInputChange('audience_target', e.target.value)}
                        />
                    </div>
                </div>

                <div className="col-span-2">{renderTargetingFields(currentData)}</div>
            </div>
        );
    };

    return (
        <AppLayout>
            <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
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
                                    <Select value={selectedEvent} onValueChange={(val) => setSelectedEvent(val)}>
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
                                    <TabsList className="mb-4 grid w-full grid-cols-3">
                                        <TabsTrigger value="boost">Boost Post</TabsTrigger>
                                        <TabsTrigger value="meta">Meta Ads</TabsTrigger>
                                        <TabsTrigger value="business">Business Suite</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="boost">{renderFormContent()}</TabsContent>
                                    <TabsContent value="meta">{renderFormContent()}</TabsContent>
                                    <TabsContent value="business">{renderFormContent()}</TabsContent>
                                </Tabs>

                                <div className="flex justify-between pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="border-gray-400 text-gray-700 hover:bg-gray-100"
                                        onClick={() => window.history.back()}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            disabled={processing}
                                            className="bg-gray-500 text-white hover:bg-gray-600"
                                            onClick={(e) => handleSubmit(e, 'draft')}
                                        >
                                            {processing ? 'Menyimpan...' : 'Simpan Draft'}
                                        </Button>
                                        <Button
                                            type="button"
                                            disabled={processing}
                                            className="bg-blue-600 text-white hover:bg-blue-700"
                                            onClick={(e) => handleSubmit(e, 'next')}
                                        >
                                            {processing ? 'Menyimpan...' : 'Selanjutnya'}
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
