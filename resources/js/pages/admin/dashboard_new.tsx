import FinancialDataTable from '@/components/custom/financial-data-table';
import GraphCustom from '@/components/custom/graph';
import History from '@/components/custom/history';
import ReportCard from '@/components/custom/report';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

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
        cost: string;
        omset: string;
    }[];
    dataHistoris: {
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

export default function Dashboard({ dashboard_item, rawDataGraphic = [], tableData = [], dataHistoris = [] }: DashboardProps) {
    const { auth } = usePage<{ auth?: { user?: { name?: string } } }>().props;
    const user = auth?.user;

    const today = new Date();

    const toTitleCase = (str: string) =>
        str
            .split(' ')
            .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
            .join(' ');

    const weekday = toTitleCase(today.toLocaleDateString('id-ID', { weekday: 'long' }));
    const date = toTitleCase(
        today.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }),
    );
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={dashboard_item} />

            <div className="flex flex-col gap-x-6 gap-y-4 p-4 md:p-6">
                <div className="flex flex-row justify-between">
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
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-24">
                    <div className="flex flex-col gap-y-6 lg:col-span-15">
                        <GraphCustom RawData={rawDataGraphic} />
                        <FinancialDataTable tableData={tableData} />
                    </div>
                    <div className="flex flex-col gap-y-6 lg:col-span-9">
                        <History dataHistoris={dataHistoris} />
                        <ReportCard />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
