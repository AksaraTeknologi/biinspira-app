import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Agent, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Agen',
        href: '/admin/agents',
    },
];

interface AgentsProps {
    agents: Agent[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Agents({ agents, flash }: AgentsProps) {
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agen" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Agen</h1>
                        <p className="text-sm text-muted-foreground">Daftar semua agen yang tersedia.</p>
                    </div>
                    <Link href={route('agents.create')}>
                        <Button className="hover:cursor-pointer">
                            Tambah Agen
                            <Plus />
                        </Button>
                    </Link>
                </div>
                <DataTable columns={columns} data={agents} />
            </div>
        </AppLayout>
    );
}
