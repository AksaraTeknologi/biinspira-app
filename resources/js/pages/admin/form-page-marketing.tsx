'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { usePage } from '@inertiajs/react';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

export default function PerencanaanIklan() {
    const { props } = usePage();
    const { events } = props as { events: any[] };

    const [tab, setTab] = useState('boost');
    const [targetType, setTargetType] = useState('targetting');
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

    const breadcrumbs = [
        { title: 'Marketing', href: route('admin.marketing.index') },
        { title: 'Perencanaan Iklan', href: route('admin.marketing.create') },
    ];

    const renderTargetingFields = () => {
        const showTargetting = targetType === 'targetting' || targetType === 'combined';
        const showBroad = targetType === 'broad' || targetType === 'combined';

        return (
            <div className="mt-4 space-y-4 border-t pt-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {showTargetting && (
                        <div className="space-y-3">
                            <Label>Umur (Targetting)</Label>
                            <Input type="number" placeholder="Masukkan umur target" />

                            <Label>Lokasi</Label>
                            <Input placeholder="Masukkan lokasi audiens" />

                            <Label>Type Peserta</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih type audiens" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pendidikan">Pendidikan</SelectItem>
                                    <SelectItem value="mahasiswa">Mahasiswa</SelectItem>
                                    <SelectItem value="profesional">Profesional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {showBroad && (
                        <div className="space-y-3">
                            <Label>Umur (Broad)</Label>
                            <Input type="number" placeholder="Masukkan umur target broad" />

                            <Label>Lokasi</Label>
                            <Input placeholder="Masukkan lokasi broad" />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFormContent = () => (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Kiri */}
            <div className="space-y-4">
                <div>
                    <Label>Tanggal Mulai Iklan</Label>
                    <div className="relative">
                        <Input type="date" />
                        <CalendarIcon className="absolute top-2.5 right-3 h-4 w-4 text-gray-400" />
                    </div>
                </div>

                <div>
                    <Label>Tujuan Iklan</Label>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih tujuan iklan" />
                        </SelectTrigger>
                        <SelectContent>
                            {events?.map((item) => (
                                <SelectItem key={item.id} value={item.goal?.id}>
                                    {item.goal?.name || 'Tanpa Goal'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label>Target Iklan</Label>
                    <Select onValueChange={setTargetType} value={targetType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis target iklan" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="targetting">Targetting Audiens</SelectItem>
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
                        <Input type="date" />
                        <CalendarIcon className="absolute top-2.5 right-3 h-4 w-4 text-gray-400" />
                    </div>
                </div>

                <div>
                    <Label>Budget Harian</Label>
                    <Input type="number" placeholder="Rp. 0" />
                </div>

                <div>
                    <Label>Target Peserta</Label>
                    <Input type="number" placeholder="Masukkan jumlah target audiens" />
                </div>
            </div>

            {/* Targetting Section */}
            <div className="col-span-2">{renderTargetingFields()}</div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full space-y-6 p-6">
                <h2 className="text-2xl font-semibold">Perencanaan Iklan</h2>

                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Perencanaan Iklan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {/* Nama Event */}
                            <div>
                                <Label>Nama Event</Label>
                                <Select onValueChange={setSelectedEvent}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih atau tulis nama event" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events?.map((item) => (
                                            <SelectItem key={item.id} value={item.plan?.event?.id}>
                                                {item.plan?.event?.name || 'Event Tidak Diketahui'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Jika user ingin menulis manual */}
                                <div className="mt-2">
                                    <Input placeholder="Atau tulis nama event baru" />
                                </div>
                            </div>

                            {/* Tabs */}
                            <Tabs value={tab} onValueChange={setTab}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="boost">Boost Post</TabsTrigger>
                                    <TabsTrigger value="meta">Meta Ads</TabsTrigger>
                                    <TabsTrigger value="business">Business Suite</TabsTrigger>
                                </TabsList>

                                <TabsContent value="boost">{renderFormContent()}</TabsContent>
                                <TabsContent value="meta">{renderFormContent()}</TabsContent>
                                <TabsContent value="business">{renderFormContent()}</TabsContent>
                            </Tabs>

                            {/* Simpan Draft */}
                            <div className="flex justify-end pt-6">
                                <Button className="bg-primary text-white hover:bg-blue-700">Simpan Draft</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
