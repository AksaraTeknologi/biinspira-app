import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Users, LineChart, Timer } from 'lucide-react';
import GraphCustom from '@/components/custom/graph';
import ReportCard from '@/components/custom/report';
import FinancialDataTable from '@/components/custom/financial-data-table';
import Events from '@/components/custom/events';

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

    const today = new Date();
    const toTitleCase = (str: string) =>
        str
            .split(' ')
            .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
            .join(' ');

    const weekday = toTitleCase(
        today.toLocaleDateString('id-ID', { weekday: 'long' })
    );
    const date = toTitleCase(
        today.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    );
    const tableColoms = [
        { header: "No", accessor: "no" },
        { header: 'User', accessor: 'user' },
        { header: 'Top Up Dana', accessor: 'top_up_dana' },
        { header: 'Tipe Iklan', accessor: 'status' },
        { header: 'Pengeluaran Iklan', accessor: 'advertising_expenditure' },
    ]
    const tableData = [
        { no: 1, user: "User A", top_up_dana: 1000000, status: "Business Suite", advertising_expenditure: 500000 },
        { no: 2, user: "User B", top_up_dana: 2000000, status: "Boost Post", advertising_expenditure: 1500000 },
        { no: 3, user: "User C", top_up_dana: 1500000, status: "Meta Ads", advertising_expenditure: 1000000 },
        { no: 4, user: "User D", top_up_dana: 1800000, status: "Business Suite", advertising_expenditure: 1200000 },
        { no: 5, user: "User E", top_up_dana: 2200000, status: "Business Suite", advertising_expenditure: 1700000 },
        { no: 6, user: "User A", top_up_dana: 1000000, status: "Business Suite", advertising_expenditure: 500000 },
        { no: 7, user: "User B", top_up_dana: 2000000, status: "Boost Post", advertising_expenditure: 1500000 },
        { no: 8, user: "User C", top_up_dana: 1500000, status: "Meta Ads", advertising_expenditure: 1000000 },
        { no: 9, user: "User D", top_up_dana: 1800000, status: "Business Suite", advertising_expenditure: 1200000 },
        { no: 10, user: "User E", top_up_dana: 2200000, status: "Business Suite", advertising_expenditure: 1700000 },
    ];
    const rawData = [
        { name: "JAN", pengeluaran: 60, pendapatan: 80 },
        { name: "FEB", pengeluaran: 90, pendapatan: 60 },
        { name: "MAR", pengeluaran: 70, pendapatan: 110 },
        { name: "APR", pengeluaran: 100, pendapatan: 120 },
        { name: "MEI", pengeluaran: 100, pendapatan: 50 },
        { name: "JUN", pengeluaran: 50, pendapatan: 95 },
        { name: "JUL", pengeluaran: 85, pendapatan: 110 },
        { name: "AGU", pengeluaran: 90, pendapatan: 120 },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={dashboard_item} />

            <div className="flex flex-col gap-x-6 gap-y-4 p-4 md:p-6">
                <div className='flex flex-row justify-between'>
                    <div>
                        <p className="text-sm font-extralight">Selamat Datang</p>
                        <h1 className="text-2xl font-semibold">Admin</h1>
                    </div>
                    {/* tanggal */}
                    <div>
                        <div className="mt-2 text-right">
                            <p className="text-md font-semibold">{weekday}</p>
                            <p className="text-xl font-semibold">{date}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-x-10 gap-y-4">
                    <div className="col-span-3 flex flex-col gap-y-5">
                        <GraphCustom
                            className=''
                            RawData={rawData}
                        />
                        <FinancialDataTable
                            tableColoms={tableColoms}
                            tableData={tableData}
                        />
                    </div>
                    <div className="col-span-3 md:col-span-2 flex flex-col gap-y-5">
                        <Events />
                        <ReportCard />
                    </div>
                </div>
            </div>
        </AppLayout >
    );
}
