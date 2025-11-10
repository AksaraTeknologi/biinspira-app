import AppLayout from "@/layouts/app-layout";
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Minus } from "lucide-react";

import StepperForm from "@/pages/user/form/stepper";

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Advertise Form', href: '#' }];

interface adsForm {
    title_pages: string;
    events: Array<{ id: any; name: string }>;
    platforms: Array<{ id: any; name: string }>;
    goals: Array<{ id: any; name: string }>;
}

export default function adsForm({
    title_pages,
    events,
    platforms,
    goals
}: adsForm ) {

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

                {/* Stepper Navigation */}
                <StepperForm
                    events={events}
                    platforms={platforms}
                    goals={goals}
                />
            </div>
        </AppLayout>
    );
}