'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, BarChart2, ChevronDown, ChevronRight, ChevronUp, TrendingUp, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/marketing/dashboard' },
    { title: 'Grafik Peserta Per Event', href: '#' },
];

interface BatchItem {
    batch_number: number;
    audience: number;
    has_result: boolean;
}

interface EventGroup {
    event_id: number;
    event_name: string;
    total: number;
    batches: BatchItem[];
}

interface AudiencePerUser {
    user_id: string;
    user_name: string;
    total: number;
    events: EventGroup[];
}

interface AudiencePerBatch {
    ad_plan_id: string;
    event_id: number;
    event_name: string;
    user_id: string;
    user_name: string;
    batch_number: number;
    label: string;
    short_label: string;
    audience: number;
    has_result: boolean;
}

interface Event {
    id: number;
    name: string;
}

const EVENT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];

const USER_COLORS = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-yellow-100 text-yellow-700 border-yellow-200',
    'bg-green-100 text-green-700 border-green-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-red-100 text-red-700 border-red-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
];

// ─────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────
function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="rounded-md border bg-background p-2 text-sm shadow-md">
            <p className="mb-1 font-semibold">{d.label}</p>
            <p className="text-xs text-gray-400">{d.user_name}</p>
            <p className="mt-1">
                Jumlah Peserta: <strong>{d.audience.toLocaleString('id-ID')}</strong>
            </p>
            {!d.has_result && <p className="mt-1 text-xs text-gray-400">Belum ada hasil</p>}
        </div>
    );
}

// ─────────────────────────────────────────────
// Card per User (bawah)
// ─────────────────────────────────────────────
function UserCard({ userData, colorClass, rank }: { userData: AudiencePerUser; colorClass: string; rank: number }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <Card className={`border ${colorClass.split(' ')[2]} transition-all`}>
            <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${colorClass}`}>
                            {rank}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{userData.user_name}</p>
                            <p className="text-xs text-gray-400">
                                {userData.events.length} event · {userData.events.reduce((s, e) => s + e.batches.length, 0)} batch
                            </p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                        <p className="text-lg font-bold">{userData.total.toLocaleString('id-ID')}</p>
                        <p className="text-xs text-gray-400">total peserta</p>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="h-3 w-3" /> Sembunyikan detail
                        </>
                    ) : (
                        <>
                            <ChevronDown className="h-3 w-3" /> Lihat detail event & batch
                        </>
                    )}
                </button>
                {expanded && (
                    <div className="mt-3 flex flex-col gap-3 border-t pt-3">
                        {userData.events.map((ev) => (
                            <div key={ev.event_id}>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <p className="max-w-[60%] truncate text-xs font-semibold" title={ev.event_name}>
                                        {ev.event_name}
                                    </p>
                                    <span className="text-xs font-medium text-gray-500">{ev.total.toLocaleString('id-ID')} peserta</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {ev.batches.map((batch) => (
                                        <div
                                            key={batch.batch_number}
                                            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                                                batch.has_result
                                                    ? 'border-gray-200 bg-gray-50'
                                                    : 'border-dashed border-gray-200 bg-gray-50 text-gray-400'
                                            }`}
                                        >
                                            <span className="font-medium">Batch {batch.batch_number}</span>
                                            <span className="text-gray-400">·</span>
                                            <span className={batch.has_result ? 'font-semibold' : 'text-gray-400'}>
                                                {batch.has_result ? batch.audience.toLocaleString('id-ID') : '-'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AudienceChartPage() {
    const { props } = usePage();
    const { events, audiencePerBatch, audiencePerUser, dashboard_item } = props as unknown as {
        events: Event[];
        audiencePerBatch: AudiencePerBatch[];
        audiencePerUser: AudiencePerUser[];
        isAdmin: boolean;
        dashboard_item: string;
    };

    const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    // User yang sedang di-expand di panel filter
    const [activeUserId, setActiveUserId] = useState<string | null>(null);

    const toggleEvent = (id: number) => {
        setSelectedEventIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
        setSelectedIndex(null);
    };

    const clearFilter = () => {
        setSelectedEventIds([]);
        setSelectedIndex(null);
        setActiveUserId(null);
    };

    const eventColorMap = useMemo(() => {
        const map: Record<number, string> = {};
        events.forEach((e, i) => {
            map[e.id] = EVENT_COLORS[i % EVENT_COLORS.length];
        });
        return map;
    }, [events]);

    const filteredData = useMemo(() => {
        if (selectedEventIds.length === 0) return audiencePerBatch;
        return audiencePerBatch.filter((d) => selectedEventIds.includes(d.event_id));
    }, [selectedEventIds, audiencePerBatch]);

    const filteredUserData = useMemo(() => {
        if (selectedEventIds.length === 0) return audiencePerUser;
        return audiencePerUser
            .map((u) => ({
                ...u,
                events: u.events.filter((e) => selectedEventIds.includes(e.event_id)),
                total: u.events.filter((e) => selectedEventIds.includes(e.event_id)).reduce((s, e) => s + e.total, 0),
            }))
            .filter((u) => u.events.length > 0)
            .sort((a, b) => b.total - a.total);
    }, [selectedEventIds, audiencePerUser]);

    // Event milik user yang sedang aktif di panel slide
    const activeUserData = useMemo(() => audiencePerUser.find((u) => u.user_id === activeUserId) ?? null, [activeUserId, audiencePerUser]);

    // Summary
    const totalAudience = filteredData.reduce((s, d) => s + d.audience, 0);
    const topBatch = [...filteredData].sort((a, b) => b.audience - a.audience)[0] ?? null;
    const avgAudience = filteredData.length ? Math.round(totalAudience / filteredData.length) : 0;

    const defaultIncrease =
        filteredData.length > 1
            ? parseFloat(
                  (
                      ((filteredData[filteredData.length - 1].audience - filteredData[filteredData.length - 2].audience) /
                          (filteredData[filteredData.length - 2].audience || 1)) *
                      100
                  ).toFixed(2),
              )
            : 0;

    const selectedBatch =
        selectedIndex !== null && selectedIndex > 0 ? { current: filteredData[selectedIndex], previous: filteredData[selectedIndex - 1] } : null;

    const percentageIncrease = selectedBatch
        ? parseFloat((((selectedBatch.current.audience - selectedBatch.previous.audience) / (selectedBatch.previous.audience || 1)) * 100).toFixed(2))
        : defaultIncrease;

    const currentLabel = selectedBatch ? selectedBatch.current.label : (filteredData[filteredData.length - 1]?.label ?? '');

    const chartData = useMemo(
        () =>
            filteredData.map((d) => ({
                ...d,
                color: eventColorMap[d.event_id] ?? '#6BAED6',
                PendapatanHeight: d.audience,
                EfisiensiH: d.audience,
                Audience: d.audience,
            })),
        [filteredData, eventColorMap],
    );

    const handleBarClick = useCallback((_: any, index: number) => {
        if (index <= 0) return;
        setSelectedIndex(index);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const [barSize, setBarSize] = useState(35);
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(() => {
            const w = containerRef.current!.offsetWidth;
            setBarSize(Math.max(15, Math.min(35, Math.floor(w / ((chartData.length || 1) * 2)))));
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [chartData]);

    const CustomBar = (props: any) => {
        const { x, y, width, height, color } = props;
        if (!height || height <= 0) return null;
        return <rect x={x} y={y} width={width} height={height} fill={color} rx={width / 2} ry={width / 2} />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={dashboard_item} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Grafik Peserta Per Event</h1>
                    <p className="text-xs text-gray-900">Setiap batch merupakan satu rencana iklan. Gunakan filter untuk mempersempit tampilan.</p>
                </div>

                {/* ── Summary Cards ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-5">
                            <div className="rounded-full bg-blue-100 p-2">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Total Peserta</p>
                                <p className="text-xl font-semibold">{totalAudience.toLocaleString('id-ID')}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-5">
                            <div className="rounded-full bg-green-100 p-2">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Batch Terbanyak</p>
                                <p className="max-w-[160px] truncate text-sm font-semibold" title={topBatch?.label}>
                                    {topBatch?.label ?? '-'}
                                </p>
                                <p className="text-xs text-gray-500">{topBatch?.audience.toLocaleString('id-ID') ?? 0} peserta</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-3 pt-5">
                            <div className="rounded-full bg-purple-100 p-2">
                                <BarChart2 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Rata-rata Peserta</p>
                                <p className="text-xl font-semibold">{avgAudience.toLocaleString('id-ID')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Filter + Grafik ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* ── Panel Filter (dengan slide user) ── */}
                    {/* ── Panel Filter ── */}
                    <div className="flex flex-col gap-3 lg:col-span-1">
                        {/* Card Filter utama */}
                        <Card className="h-fit w-full">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold">Filter</CardTitle>

                                    {(selectedEventIds.length > 0 || activeUserId) && (
                                        <button onClick={clearFilter} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
                                            <X className="h-3 w-3" /> Reset
                                        </button>
                                    )}
                                </div>

                                {selectedEventIds.length > 0 && <p className="text-xs text-gray-400">{selectedEventIds.length} event dipilih</p>}
                            </CardHeader>

                            <CardContent className="flex flex-col gap-4">
                                <div className="border-t" />

                                {/* USER LIST */}
                                <div>
                                    <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">User</p>

                                    <div className="flex max-h-[200px] flex-col gap-1.5 overflow-y-auto pr-1">
                                        {audiencePerUser.map((u, i) => {
                                            const isActive = activeUserId === u.user_id;

                                            return (
                                                <button
                                                    key={u.user_id}
                                                    onClick={() => setActiveUserId(isActive ? null : u.user_id)}
                                                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                                                        isActive
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        <div
                                                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${USER_COLORS[i % USER_COLORS.length]}`}
                                                        >
                                                            {u.user_name.charAt(0).toUpperCase()}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium">{u.user_name}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {u.events.length} event · {u.total.toLocaleString('id-ID')} peserta
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <ChevronRight
                                                        className={`h-4 w-4 flex-shrink-0 transition-transform ${
                                                            isActive ? 'rotate-90 text-blue-500' : 'text-gray-300'
                                                        }`}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* PANEL EVENT (muncul di bawah filter, bukan di samping) */}
                        {activeUserId && activeUserData && (
                            <Card className="w-full border-gray-200 bg-white duration-200 animate-in slide-in-from-top-2">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-sm font-semibold">{activeUserData.user_name}</CardTitle>

                                            <p className="text-xs text-gray-900">Pilih event untuk filter grafik</p>
                                        </div>

                                        <button onClick={() => setActiveUserId(null)} className="text-gray-400 hover:text-gray-600">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto pr-1">
                                        {activeUserData.events.map((ev) => {
                                            const isSelected = selectedEventIds.includes(ev.event_id);

                                            return (
                                                <button
                                                    key={ev.event_id}
                                                    onClick={() => toggleEvent(ev.event_id)}
                                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                                                        isSelected
                                                            ? 'border-blue-500 bg-blue-100 text-blue-700'
                                                            : 'border-blue-100 bg-white hover:border-blue-300 hover:bg-blue-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                                            style={{ backgroundColor: eventColorMap[ev.event_id] }}
                                                        />

                                                        <p className="truncate font-medium">{ev.event_name}</p>

                                                        {isSelected && <Badge className="ml-auto h-4 bg-blue-500 py-0 text-[10px]">aktif</Badge>}
                                                    </div>

                                                    <p className="mt-0.5 pl-4 text-xs text-gray-400">
                                                        {ev.batches.length} batch · {ev.total.toLocaleString('id-ID')} peserta
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── Grafik ── */}
                    <Card className={`transition-all duration-300 ${activeUserId ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                        <CardHeader>
                            <div className="flex flex-row items-center justify-between">
                                <div className="flex flex-col">
                                    <h2 className="text-lg font-semibold">Data Peserta Per Batch</h2>
                                    <p className="text-[11px] font-extralight text-gray-400">Analisis jumlah peserta setiap batch iklan per event</p>
                                </div>
                                {selectedEventIds.length > 0 && (
                                    <div className="flex max-w-[300px] flex-wrap justify-end gap-1">
                                        {selectedEventIds.slice(0, 3).map((id) => {
                                            const ev = events.find((e) => e.id === id);
                                            return (
                                                <Badge
                                                    key={id}
                                                    variant="secondary"
                                                    className="cursor-pointer text-xs"
                                                    onClick={() => toggleEvent(id)}
                                                >
                                                    {ev?.name.slice(0, 10)}…<X className="ml-1 h-2.5 w-2.5" />
                                                </Badge>
                                            );
                                        })}
                                        {selectedEventIds.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{selectedEventIds.length - 3} lainnya
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {filteredData.length === 0 ? (
                                <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                                    <BarChart2 className="mb-3 h-12 w-12 opacity-30" />
                                    <p className="text-sm">Belum ada data untuk ditampilkan</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3">
                                    <div className="col-span-1 flex h-full flex-col py-4">
                                        <div className="flex items-center gap-2">
                                            <h2
                                                className={`text-4xl font-semibold ${percentageIncrease < 0 ? 'text-orange-500' : 'text-primary'} mb-1`}
                                            >
                                                {percentageIncrease}%
                                            </h2>
                                            <div className={`${percentageIncrease < 0 ? 'bg-orange-500' : 'bg-primary'} rounded-full p-1`}>
                                                {percentageIncrease < 0 ? (
                                                    <ArrowDownRight className="text-white" />
                                                ) : (
                                                    <ArrowUpRight className="text-white" />
                                                )}
                                            </div>
                                        </div>
                                        <p className="mb-9 flex flex-col text-sm text-gray-500">
                                            <span>
                                                Total{' '}
                                                <strong className={percentageIncrease < 0 ? 'text-orange-500' : 'text-blue-500'}>
                                                    {percentageIncrease < 0 ? 'penurunan' : 'kenaikan'}
                                                </strong>
                                            </span>
                                            <span>peserta pada</span>
                                            <span>
                                                <strong>{currentLabel}</strong>
                                            </span>
                                        </p>
                                        <div className="mt-auto flex flex-col gap-1 text-sm">
                                            {events
                                                .filter((e) => selectedEventIds.length === 0 || selectedEventIds.includes(e.id))
                                                .map((e) => (
                                                    <div key={e.id} className="flex flex-row items-center gap-2">
                                                        <span
                                                            className="h-3 w-3 flex-shrink-0 rounded-full"
                                                            style={{ backgroundColor: eventColorMap[e.id] }}
                                                        />
                                                        <span className="max-w-[100px] truncate" title={e.name}>
                                                            {e.name}
                                                        </span>
                                                    </div>
                                                ))}
                                            <div className="mt-1 flex flex-row items-center gap-2">
                                                <span className="h-3 w-3 rounded-full bg-[#6BAED6]" />
                                                <span>Jumlah Peserta</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2 flex h-full flex-col">
                                        <div ref={containerRef} className="mt-auto h-55">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ComposedChart data={chartData} barCategoryGap="12%" barGap={8} style={{ minHeight: 50 }}>
                                                    <defs>
                                                        <filter id="barShadow" x="-20%" y="-20%" width="200%" height="140%">
                                                            <feDropShadow dx="0" dy="-2" stdDeviation="5" floodColor="rgba(0,0,0,0.25)" />
                                                        </filter>
                                                        <filter id="barLittleShadow" x="-20%" y="-20%" width="200%" height="140%">
                                                            <feDropShadow dx="0" dy="-2" stdDeviation="5" floodColor="rgba(0,0,0,0.25)" />
                                                        </filter>
                                                        <filter id="lineShadow" x="0%" y="-60%" width="140%" height="300%">
                                                            <feDropShadow dx="0" dy="-4" stdDeviation="3" floodColor="rgba(0,0,0,0.25)" />
                                                        </filter>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                                    <XAxis
                                                        dataKey="short_label"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                    />
                                                    <YAxis yAxisId="left" hide />
                                                    <YAxis yAxisId="right" hide />
                                                    <Tooltip
                                                        content={<CustomTooltip />}
                                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none' }}
                                                    />
                                                    <Bar
                                                        dataKey="PendapatanHeight"
                                                        yAxisId="left"
                                                        radius={[50, 50, 50, 50]}
                                                        barSize={barSize}
                                                        filter="url(#barShadow)"
                                                        shape={<CustomBar />}
                                                        onClick={handleBarClick}
                                                    />
                                                    <Bar
                                                        dataKey="Audience"
                                                        yAxisId="right"
                                                        fill="#6BAED6"
                                                        radius={[50, 50, 50, 50]}
                                                        barSize={1.8}
                                                        filter="url(#barLittleShadow)"
                                                        onClick={handleBarClick}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="EfisiensiH"
                                                        yAxisId="left"
                                                        stroke="#9ca3af"
                                                        strokeWidth={2}
                                                        dot={false}
                                                        filter="url(#lineShadow)"
                                                        strokeDasharray="5 5"
                                                    />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
