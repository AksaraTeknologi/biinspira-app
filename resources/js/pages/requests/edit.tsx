'use client';

import AppLayout from '@/layouts/app-layout';
import RequestForm from '@/pages/requests/components/request-form';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

type Application = {
    id: number | string;
    name: string;
    color?: string | null;
};

type RequestTask = {
    id: number | string;
    title: string;
    description?: string | null;
    related_url?: string | null;
    urgency: 'high' | 'medium' | 'low';
    target_role?: 'technician' | 'technician-intern';
    deadline?: string | null;
    attachments?: Array<{ file_path: string }>;
    application_id?: number | string | null;
    work_type?: 'pengerjaan' | 'penambahan_fitur' | 'maintenance' | null;
};

type EditProps = {
    task: RequestTask;
    applications?: Application[];
};

export default function Edit({ task, applications = [] }: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Ticketing Website', href: route('requests.index') },
        { title: 'Edit Request', href: route('requests.edit', task.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Request" />

            <div className="p-6">
                <RequestForm mode="edit" task={task} applications={applications} />
            </div>
        </AppLayout>
    );
}
