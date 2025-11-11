'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function HasilIklanCreate() {
  const { props } = usePage();
  const { events, platforms, selectedPlatform, adPlan, adResultData }: any = props;

  const event = events || {};
  const platformList = Array.isArray(platforms) ? platforms : [];

  const getPlatformKey = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('boost')) return 'boost';
    if (lower.includes('meta')) return 'meta';
    if (lower.includes('business')) return 'business';
    return 'meta';
  };

  const [tab, setTab] = useState(getPlatformKey(selectedPlatform?.name || ''));
  const { data, setData, post, processing } = useForm({
    ad_result_id: adResultData?.adResult?.id || '',
    event_id: event?.id || '',
    platform_id: selectedPlatform?.id || '',
    ad_plan_id: adPlan.id || '',
    total_cost: '',
    reach: '',
    impressions: '',
    cost_per_result: '',
    result_ads: '',
    checkout_count: '',
    revenue: '',
    clicks: '',
    likes: '',
    saves: '',
    shares: '',
    profile_visits: '',
    folows: '',
    direct_messages: '',
    external_link_clicks: '',
  });

  const hiddenFieldsByPlatform: Record<string, string[]> = {
    boost: ['result_ads'],
    business: ['result_ads'],
    meta: [
      'clicks',
      'likes',
      'saves',
      'shares',
      'profile_visits',
      'folows',
      'direct_messages',
      'external_link_clicks',
    ],
  };

  const isHidden = (field: string) => hiddenFieldsByPlatform[tab]?.includes(field);

  // Set platform_id saat tab berubah
  useEffect(() => {
    const selected = platformList.find((p) => getPlatformKey(p.name) === tab);
    if (selected) setData('platform_id', selected.id);
  }, [tab]);

  // **Tambahan: jika ada data hasil iklan, set form value**
  useEffect(() => {
    if (adResultData) {
      const { adResult, adResultPlatform, adMetric } = adResultData;
      if (adResult) {
        setData('checkout_count', adResult.checkout_count || '');
        setData('revenue', adResult.revenue || '');
      }
      if (adResultPlatform) {
        setData('total_cost', adResultPlatform.total_cost || '');
        setData('result_ads', adResultPlatform.result || '');
      }
      if (adMetric) {
        setData('reach', adMetric.reach || '');
        setData('impressions', adMetric.impressions || '');
        setData('cost_per_result', adMetric.cost_per_result || '');
        setData('clicks', adMetric.clicks || '');
        setData('likes', adMetric.likes || '');
        setData('saves', adMetric.saves || '');
        setData('shares', adMetric.shares || '');
        setData('profile_visits', adMetric.profile_visits || '');
        setData('folows', adMetric.folows || '');
        setData('direct_messages', adMetric.direct_messages || '');
        setData('external_link_clicks', adMetric.external_link_clicks || '');
        setData('result_ads', adMetric.result_ads || adResultPlatform.result || '');
      }
    }
  }, [adResultData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.marketing.result.store'));
  };

  const renderFormContent = () => (
    <div className="space-y-8">
      {/* === Bagian Utama === */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isHidden('result_ads') && (
            <div>
              <Label>Hasil Iklan (Platform Iklan)</Label>
              <Input
                type="number"
                placeholder="Rp. 0"
                value={data.result_ads}
                onChange={(e) => setData('result_ads', e.target.value)}
              />
            </div>
          )}
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
              value={data.impressions}
              onChange={(e) => setData('impressions', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* === Metrics === */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Data Metrics Tambahan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isHidden('clicks') && (
            <div>
              <Label>Clicks</Label>
              <Input
                type="number"
                placeholder="Jumlah klik"
                value={data.clicks}
                onChange={(e) => setData('clicks', e.target.value)}
              />
            </div>
          )}
          {!isHidden('likes') && (
            <div>
              <Label>Likes</Label>
              <Input
                type="number"
                placeholder="Jumlah suka"
                value={data.likes}
                onChange={(e) => setData('likes', e.target.value)}
              />
            </div>
          )}
          {!isHidden('saves') && (
            <div>
              <Label>Saves</Label>
              <Input
                type="number"
                placeholder="Jumlah disimpan"
                value={data.saves}
                onChange={(e) => setData('saves', e.target.value)}
              />
            </div>
          )}
          {!isHidden('shares') && (
            <div>
              <Label>Shares</Label>
              <Input
                type="number"
                placeholder="Jumlah dibagikan"
                value={data.shares}
                onChange={(e) => setData('shares', e.target.value)}
              />
            </div>
          )}
          {!isHidden('profile_visits') && (
            <div>
              <Label>Profile Visits</Label>
              <Input
                type="number"
                placeholder="Kunjungan profil"
                value={data.profile_visits}
                onChange={(e) => setData('profile_visits', e.target.value)}
              />
            </div>
          )}
          {!isHidden('folows') && (
            <div>
              <Label>Follows</Label>
              <Input
                type="number"
                placeholder="Jumlah pengikut"
                value={data.folows}
                onChange={(e) => setData('folows', e.target.value)}
              />
            </div>
          )}
          {!isHidden('direct_messages') && (
            <div>
              <Label>Direct Messages</Label>
              <Input
                type="number"
                placeholder="Pesan langsung"
                value={data.direct_messages}
                onChange={(e) => setData('direct_messages', e.target.value)}
              />
            </div>
          )}
          {!isHidden('external_link_clicks') && (
            <div>
              <Label>External Link Clicks</Label>
              <Input
                type="number"
                placeholder="Jumlah tautan Link"
                value={data.external_link_clicks}
                onChange={(e) => setData('external_link_clicks', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const breadcrumbs = [
    { title: 'Marketing', href: route('admin.marketing.index') },
    { title: 'Hasil Iklan', href: '' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <h2 className="text-2xl font-semibold">Hasil Iklan</h2>

        <form onSubmit={handleSubmit}>
          <Card className="w-full border-zinc-200 shadow-md">
            <CardHeader>
              <CardTitle>Data Hasil Iklan</CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Nama Event */}
              <div>
                <Label>Nama Event</Label>
                <Input value={event.name || ''} disabled />
              </div>

              {/* Omset & Checkout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Omset per Event</Label>
                  <Input
                    type="number"
                    placeholder="Rp. 0"
                    value={data.revenue}
                    onChange={(e) => setData('revenue', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Jumlah Checkout</Label>
                  <Input
                    type="number"
                    placeholder="Masukkan jumlah checkout"
                    value={data.checkout_count}
                    onChange={(e) => setData('checkout_count', e.target.value)}
                  />
                </div>
              </div>

              {/* Tabs Platform */}
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-4 grid w-full grid-cols-3">
                  {platformList.map((p) => (
                    <TabsTrigger key={p.id} value={getPlatformKey(p.name)}>
                      {p.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {platformList.map((p) => (
                  <TabsContent key={p.id} value={getPlatformKey(p.name)}>
                    {renderFormContent()}
                  </TabsContent>
                ))}
              </Tabs>

              {/* Tombol Navigasi */}
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
