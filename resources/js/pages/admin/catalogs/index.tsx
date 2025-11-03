import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Catalog, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Katalog',
        href: '/admin/catalogs',
    },
];

interface CatalogsProps {
    catalogs: Catalog[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Catalogs({ catalogs, flash }: CatalogsProps) {
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
            <Head title="Katalog" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Katalog</h1>
                        <p className="text-sm text-muted-foreground">Daftar semua katalog yang tersedia.</p>
                    </div>
                    <Link href={route('catalogs.create')}>
                        <Button className="hover:cursor-pointer">
                            Tambah Katalog
                            <Plus />
                        </Button>
                    </Link>
                </div>
                <DataTable columns={columns} data={catalogs} />
            </div>
        </AppLayout>
    );
}
