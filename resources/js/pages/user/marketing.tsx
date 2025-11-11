import AppLayout from "@/layouts/app-layout";
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import TableCustom from "@/components/table-custom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Marketing', href: '#' }];

interface MarketingProps {
    title_pages: string;
    ad_plans: {
        id: string;
        status: string;
        event: {
            name: string;
            platform: string;
            event_date: string;
        };
    }[];
}

export default function marketing({ title_pages, ad_plans }: MarketingProps) {
    const tableColoms = [
        { header: 'Tanggal Iklan', accessor: 'event_date' },
        { header: 'Nama Iklan', accessor: 'ad_name' },
        { header: 'Platform', accessor: 'platform' },
        { header: 'Status', accessor: 'status' },
        { header: 'Aksi', accessor: 'actions' },
    ]
    const tableData = ad_plans.map((plan) => ({
        event_date: plan.event.event_date,
        ad_name: plan.event.name,
        platform: plan.event.platform,
        status: plan.status,
        actions: (
            <div className="flex justify-center gap-2">
                <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4 text-blue-600" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
            </div>
        ),
    }));
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title_pages} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            window.history.back();
                        }}
                        className="inline-flex items-center font-semibold"
                    >
                        <ArrowLeft className="inline mr-2 w-8" />
                        <span className="text-2xl">{title_pages}</span>
                    </a>
                </div>
                <Link href={route('user.adsForm')} className="ml-auto">
                    <Button className="w-fit">Tambah Iklan</Button>
                </Link>
                <TableCustom
                    columns={tableColoms}
                    data={tableData}
                    className="max-h-[64vh] w-full table-fixed"
                    body="max-h-[64vh] w-full overflow-y-auto"
                />
            </div>
        </AppLayout>
    );
}