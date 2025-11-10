'use client';
// * For Edit form
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function HasilIklan() {
  const { props } = usePage();
  const { events, adResultPlatform } = props;

  const [tab, setTab] = useState('meta');

  const { data, setData, post, processing } = useForm({
    event_id: adResultPlatform?.event_id || '',
    platform_id: adResultPlatform?.platform_id || '',
    total_cost: adResultPlatform?.total_cost || '',
    reach: adResultPlatform?.metrics?.reach || '',
    impression: adResultPlatform?.metrics?.impression || '',
    cost_per_result: adResultPlatform?.metrics?.cost_per_result || '',
    result_ads: adResultPlatform?.metrics?.result_ads || '',
    total_checkout: adResultPlatform?.total_checkout || '',
    total_revenue: adResultPlatform?.total_revenue || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // post(route('admin.marketing.result.store'));
  };

  const handleTabChange = (val) => {
    setTab(val);
    const reverseMap = {
      boost: '1',
      meta: '2',
      business: '3',
    };
    setData('platform_id', reverseMap[val]);
  };

  const renderFormContent = () => (
    <div className="space-y-6">
      {/* Baris pertama: hasil iklan & total biaya */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Hasil Iklan (Platform Iklan Website)</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih hasil iklan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="traffic">Kunjungan Website</SelectItem>
              <SelectItem value="leads">Leads</SelectItem>
              <SelectItem value="conversion">Konversi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Total Biaya Iklan</Label>
          <Input
            type="number"
            placeholder="Rp. 0"
            value={data.total_cost}
            onChange={(e) => setData('total_cost', e.target.value)}
          />
        </div>
      </div>

      {/* Baris kedua: sekarang jadi 2 kolom saja */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Reach</Label>
          <Input
            type="number"
            placeholder="Jumlah reach"
            value={data.reach}
            onChange={(e) => setData('reach', e.target.value)}
          />
        </div>

        <div>
          <Label>Biaya / Hasil (CPR)</Label>
          <Input
            type="number"
            placeholder="Rp. 0"
            value={data.cost_per_result}
            onChange={(e) => setData('cost_per_result', e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <Label>Impression</Label>
          <Input
            type="number"
            placeholder="Jumlah impression"
            value={data.impression}
            onChange={(e) => setData('impression', e.target.value)}
          />
        </div>
      </div>

      {/* Baris ketiga: full width */}
      <div>
        <Label>Hasil Iklan</Label>
        <Input
          type="text"
          placeholder="Masukkan hasil iklan"
          value={data.result_ads}
          onChange={(e) => setData('result_ads', e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <AppLayout breadcrumbs={[{ title: 'Marketing', href: route('admin.marketing.index') }]}>
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <h2 className="text-2xl font-semibold">Hasil Iklan</h2>

        <form onSubmit={handleSubmit}>
          <Card className="w-full border-zinc-200 shadow-md">
            <CardHeader>
              <CardTitle>Data Hasil Iklan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Nama Event - full width */}
              <div>
                <Label>Nama Event</Label>
                <Select
                  value={String(data.event_id)}
                  onValueChange={(val) => setData('event_id', Number(val))}
                >
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

              {/* Omset & Checkout - 2 kolom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Omset per Event</Label>
                  <Input
                    type="number"
                    placeholder="Rp. 0"
                    value={data.total_revenue}
                    onChange={(e) => setData('total_revenue', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Jumlah Checkout</Label>
                  <Input
                    type="number"
                    placeholder="Masukkan jumlah checkout"
                    value={data.total_checkout}
                    onChange={(e) => setData('total_checkout', e.target.value)}
                  />
                </div>
              </div>

              {/* Tabs Platform */}
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

              {/* Tombol navigasi */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-400 text-gray-700 hover:bg-gray-100"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>

                <Button
                  type="submit"
                  disabled={processing}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  {processing ? 'Menyimpan...' : 'Selanjutnya'}{' '}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
