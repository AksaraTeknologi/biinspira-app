'use client';

import AppLayout from '@/layouts/app-layout';
import RequestForm from '@/pages/requests/components/request-form';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

export default function Create() {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Ticketing Website', href: route('requests.index') },
        { title: 'Buat Tiket Baru', href: route('requests.create') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Tiket Baru" />

            <div className="p-6">
                <RequestForm mode="create" />
            </div>
        </AppLayout>
    );
}
