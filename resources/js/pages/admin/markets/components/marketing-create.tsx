'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useForm, usePage } from '@inertiajs/react';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

export default function PerencanaanIklan() {
    const { props } = usePage();
    const { events, goals } = props as {
        events: any[];
        goals: any[];
    };

    // State tambahan
    const [tab, setTab] = useState('boost');
    const [typeAudiens, setTypeAudiens] = useState<string | null>(null);
    const [detailAudiens, setDetailAudiens] = useState<string>('');
    const [targetType, setTargetType] = useState('targeted');
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

    // Form utama
    const { data, setData, post, processing } = useForm({
        ad_plan_id: '',
        platform_id: '1', // default platform pertama (Boost Post)
        goals_id: '',
        start_date: '',
        end_date: '',
        daily_budget: '',
        audience_target: '',
        audience_type: 'targeted',
        age_targeted: '',
        location_targeted: '',
        type_audience_targeted: '',
        name_audience_targeted: '',
        age_broad: '',
        location_broad: '',
        name_event: '',
    });

    // mapping tab ke platform_id
    const platformMap: Record<string, string> = {
        boost: '1',
        meta: '2',
        business: '3',
    };

    const handleTabChange = (val: string) => {
        setTab(val);
        setData('platform_id', platformMap[val]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.table(data); // debugging
        post(route('admin.marketing.store'));
    };

    const breadcrumbs = [
        { title: 'Marketing', href: route('admin.marketing.index') },
        { title: 'Perencanaan Iklan', href: route('admin.marketing.create') },
    ];

    const renderTargetingFields = () => {
        const showTargetting = targetType === 'targeted' || targetType === 'combined';
        const showBroad = targetType === 'broad' || targetType === 'combined';

        return (
            <div className="mt-4 space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {showTargetting && (
                        <div className="space-y-3">
                            <Label>Umur (Targetting)</Label>
                            <Input
                                type="number"
                                placeholder="Masukkan umur target"
                                min={0}
                                value={data.age_targeted}
                                onChange={(e) => setData('age_targeted', e.target.value)}
                            />

                            <Label>Lokasi</Label>
                            <Input
                                placeholder="Masukkan lokasi audiens"
                                value={data.location_targeted}
                                onChange={(e) => setData('location_targeted', e.target.value)}
                            />

                            <Label>Type Audiens</Label>
                            <Select
                                value={typeAudiens ?? ''}
                                onValueChange={(val) => {
                                    setTypeAudiens(val);
                                    setData('type_audience_targeted', val);
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih type audiens" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Industri">Industri</SelectItem>
                                    <SelectItem value="Pekerjaan">Pekerjaan</SelectItem>
                                    <SelectItem value="Bidang Studi">Bidang Studi</SelectItem>
                                    <SelectItem value="Tingkat Pendidikan">Tingkat Pendidikan</SelectItem>
                                    <SelectItem value="Minat">Minat</SelectItem>
                                    <SelectItem value="Lain - Lain">Lain - Lain</SelectItem>
                                </SelectContent>
                            </Select>

                            {typeAudiens && (
                                <div className="mt-3">
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
                        <div className="space-y-3">
                            <Label>Umur (Broad)</Label>
                            <Input
                                type="number"
                                placeholder="Masukkan umur target broad"
                                min={0}
                                value={data.age_broad}
                                onChange={(e) => setData('age_broad', e.target.value)}
                            />

                            <Label>Lokasi</Label>
                            <Input
                                placeholder="Masukkan lokasi broad"
                                value={data.location_broad}
                                onChange={(e) => setData('location_broad', e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFormContent = () => (
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Kiri */}
            <div className="space-y-4">
                <div>
                    <Label>Tanggal Mulai Iklan</Label>
                    <div className="relative">
                        <Input
                            type="date"
                            value={data.start_date}
                            onChange={(e) => setData('start_date', e.target.value)}
                            className="w-full"
                        />
                        <CalendarIcon className="absolute top-2.5 right-3 h-4 w-4 text-gray-400" />
                    </div>
                </div>

                <div>
                    <Label>Tujuan Iklan</Label>
                    <Select
                        value={data.goals_id || ''}
                        onValueChange={(val) => setData('goals_id', val)}
                    >
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

                <div>
                    <Label>Target Iklan</Label>
                    <Select
                        value={targetType}
                        onValueChange={(val) => {
                            setTargetType(val);
                            setData('audience_type', val);
                        }}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih jenis target iklan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="targeted">Targetting Audiens</SelectItem>
                            <SelectItem value="broad">Broad</SelectItem>
                            <SelectItem value="combined">Combined</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Kanan */}
            <div className="space-y-4">
                <div>
                    <Label>Tanggal Selesai Iklan</Label>
                    <div className="relative">
                        <Input
                            type="date"
                            value={data.end_date}
                            onChange={(e) => setData('end_date', e.target.value)}
                            className="w-full"
                        />
                        <CalendarIcon className="absolute top-2.5 right-3 h-4 w-4 text-gray-400" />
                    </div>
                </div>

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
                    <Label>Target Audiens</Label>
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
                <h2 className="text-2xl font-semibold">Perencanaan Iklan</h2>

                <form onSubmit={handleSubmit}>
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Perencanaan Iklan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Nama Event */}
                                <div>
                                    <Label>Nama Event</Label>
                                    <Select
                                        value={selectedEvent ?? ''}
                                        onValueChange={(val) => {
                                            setSelectedEvent(val);
                                            setData('name_event', val);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih nama event" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {events?.map((event) => (
                                                <SelectItem key={event.id} value={event.name}>
                                                    {event.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="mt-2">
                                        <Input
                                            placeholder="Atau tulis nama event baru"
                                            value={data.name_event}
                                            onChange={(e) => {
                                                setSelectedEvent(null);
                                                setData('name_event', e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Tabs */}
                                <Tabs value={tab} onValueChange={handleTabChange}>
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="boost">Boost Post</TabsTrigger>
                                        <TabsTrigger value="meta">Meta Ads</TabsTrigger>
                                        <TabsTrigger value="business">Business Suite</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="boost">{renderFormContent()}</TabsContent>
                                    <TabsContent value="meta">{renderFormContent()}</TabsContent>
                                    <TabsContent value="business">{renderFormContent()}</TabsContent>
                                </Tabs>

                                <div className="flex justify-end pt-6">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Draft'}
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
