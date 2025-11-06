import AppLayout from "@/layouts/app-layout";
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Advertise Form', href: '#' }];

interface adsForm {
    title_pages : string;
}

export default function adsForm({ title_pages }: adsForm) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title_pages} />

            <div className="flex flex-col gap-6 p-4 md:p-6">
            </div>
        </AppLayout>
    );
}