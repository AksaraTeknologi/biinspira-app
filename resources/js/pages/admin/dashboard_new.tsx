import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import GraphCustom from '@/components/custom/graph';
import ReportCard from '@/components/custom/report';
import FinancialDataTable from '@/components/custom/financial-data-table';
import History from '@/components/custom/history';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/admin/dashboard' }];

interface DashboardProps {
    dashboard_item: string;
    rawDataGraphic?: {
        month: string;
        pengeluaran: number;
        pendapatan: number;
    }[];
    tableData: {
        no: number;
        user: string;
        status: string;
        cost: number;
    }[];
    dataEvents: {
        id: number;
        date: string;
        user_name: string;
        event_name: string;
        amount: string;
        avatar: string;
        time: string;
        color: string;
    }[];
}

export default function Dashboard({
    dashboard_item,
    rawDataGraphic = [],
    tableData = [],
    dataEvents = [],
}: DashboardProps) {

    const { auth } = usePage<{ auth?: { user?: { name?: string } } }>().props;
    const user = auth?.user;

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
        // { header: 'Top Up Dana', accessor: 'top_up_dana' },
        { header: 'Tipe Iklan', accessor: 'status' },
        { header: 'Pengeluaran Iklan', accessor: 'cost' },
    ]
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={dashboard_item} />

            <div className="flex flex-col gap-x-6 gap-y-4 p-4 md:p-6">
                <div className='flex flex-row justify-between'>
                    <div>
                        <p className="text-sm font-extralight">Selamat Datang</p>
                        <h1 className="text-2xl font-semibold">{user?.name}</h1>
                    </div>
                    {/* tanggal */}
                    <div>
                        <div className="mt-2 text-right">
                            <p className="text-md font-semibold">{weekday}</p>
                            <p className="text-xl font-semibold">{date}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-24 gap-y-4">
                    <div className="col-span-14 flex flex-col gap-y-5">
                        <GraphCustom RawData={rawDataGraphic} />
                        <FinancialDataTable
                            tableColoms={tableColoms}
                            tableData={tableData}
                        />
                    </div>
                    <div className="md:col-start-16 md:col-span-9 flex flex-col gap-y-5">
                        <History dataEvents={dataEvents} />
                        <ReportCard />
                    </div>
                </div>
            </div>
        </AppLayout >
    );
}
