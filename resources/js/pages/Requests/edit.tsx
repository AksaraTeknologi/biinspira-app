'use client';

import AppLayout from '@/layouts/app-layout';
import RequestForm from '@/pages/requests/components/request-form';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

type RequestTask = {
    id: number;
    title: string;
    description: string;
    related_url?: string | null;
    urgency: 'high' | 'medium' | 'low';
    deadline?: string | null;
    attachments?: Array<{ file_path: string }>;
};

export default function Edit({ task }: { task: RequestTask }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Ticketing Website', href: route('requests.index') },
        { title: 'Edit Request', href: route('requests.edit', task.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Request" />

            <div className="p-6">
                <RequestForm mode="edit" task={task} />
            </div>
        </AppLayout>
    );
}
