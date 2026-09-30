'use client';

import AppLayout from '@/layouts/app-layout';
import RequestForm from '@/pages/requests/components/request-form';
import type { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

type Application = {
    id: number | string;
    name: string;
    color?: string | null;
};

type PageProps = {
    applications?: Application[];
};

export default function Create() {
    const { applications = [] } = usePage<PageProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Ticketing Website', href: route('requests.index') },
        { title: 'Buat Tiket Baru', href: route('requests.create') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Tiket Baru" />

            <div className="p-6">
                <RequestForm mode="create" applications={applications} />
            </div>
        </AppLayout>
    );
}
