'use client';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, LineChart, Timer } from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/admin/dashboard' }];

interface DashboardProps {
    dashboard_item: string;
    stats: {
        totalUser: number;
        totalEvent: number;
        totalIklan: number;
    };
    chartData?: {
        name: string;
        user: number;
        event: number;
        iklan: number;
    }[];
}

export default function Dashboard({ dashboard_item, stats, chartData = [] }: DashboardProps) {
    const { totalUser, totalEvent, totalIklan } = stats;
    const defaultChart = [
        { name: 'Jan', user: 2, event: 1, iklan: 1 },
        { name: 'Feb', user: 3, event: 2, iklan: 1 },
        { name: 'Mar', user: 4, event: 3, iklan: 2 },
        { name: 'Apr', user: 5, event: 4, iklan: 3 },
        { name: 'Mei', user: 6, event: 4, iklan: 4 },
        { name: 'Jun', user: 7, event: 5, iklan: 4 },
        { name: 'Jul', user: 7, event: 5, iklan: 4 },
        { name: 'Aug', user: 7, event: 5, iklan: 4 },
        { name: 'Sep', user: 7, event: 5, iklan: 4 },
        { name: 'Okt', user: 7, event: 5, iklan: 4 },
        { name: 'Nov', user: 7, event: 5, iklan: 4 },
        { name: 'Des', user: 7, event: 5, iklan: 4 },
    ];

    const chart = chartData.length ? chartData : defaultChart;

    const statsCard = [
        { title: 'Total User', value: totalUser, color: 'purple', icon: Users },
        { title: 'Total Event', value: totalEvent, color: 'green', icon: LineChart },
        { title: 'Total Iklan', value: totalIklan, color: 'orange', icon: Timer },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={dashboard_item} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Selamat Datang Admin</h1>
                    <p className="text-sm text-muted-foreground">Selamat datang di {dashboard_item}</p>
                </div>

                {/* === Stats Cards === */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* {statsCard.map(({ title, value, color, icon: Icon }) => (
                        <Card key={title} className="shadow-sm border border-border/40 h-45">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {title}
                                </CardTitle>
                                <div className={`rounded-full bg-${color}-100 p-2 text-${color}-600`}>
                                    <Icon size={18} />
                                </div>
                            </CardHeader>
                            <CardContent className='mt-auto'>
                                <div className="text-4xl font-bold">{value}</div>
                            </CardContent>
                        </Card>
                    ))} */}

                    {/* Marketing */}
                    <Card
                        className="relative overflow-hidden shadow-sm border border-border/40 h-40 w-73"
                        style={{
                            backgroundImage: `url('/icon/bg_imark.svg')`,
                            backgroundSize: "140%",
                            backgroundPosition: "center",
                        }}
                    >
                        <CardContent className="flex flex-row justify-between h-full">
                            <div className="flex flex-col h-full">
                                <div className="text-xl font-semibold text-gray-500">Marketing</div>
                                <Link href={route('user.adsForm')} className='mt-auto'>
                                    <Button className="w-fit">Iklan</Button>
                                </Link>
                            </div>
                            <img src="/icon/icon_a.svg" alt='marketing_icon' className='h-40' />
                        </CardContent>
                    </Card>
                </div>

                {/* === Area Chart Section === */}
                <Card className="shadow-sm border border-border/40">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Statistik Aktivitas</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chart}>
                                <defs>
                                    <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorEvent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorIklan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="name" stroke="#888" />
                                <YAxis />
                                <Tooltip cursor={false} />

                                {/* === Stacked Areas === */}
                                <Area
                                    type="monotone"
                                    dataKey="user"
                                    stackId="1"
                                    stroke="#a855f7"
                                    fill="url(#colorUser)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="event"
                                    stackId="1"
                                    stroke="#22c55e"
                                    fill="url(#colorEvent)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="iklan"
                                    stackId="1"
                                    stroke="#fb923c"
                                    fill="url(#colorIklan)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
