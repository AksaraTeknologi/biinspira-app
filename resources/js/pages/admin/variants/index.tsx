import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import CreateVariant from '@/pages/admin/variants/create';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Variant, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Varian',
        href: '/admin/variants',
    },
];

interface VariantsProps {
    variants: Variant[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Variants({ variants, flash }: VariantsProps) {
    const [open, setOpen] = useState(false);

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
            <Head title="Varian" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Varian</h1>
                        <p className="text-sm text-muted-foreground">Daftar semua varian yang tersedia.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover:cursor-pointer">
                                Tambah Varian
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateVariant setOpen={setOpen} />
                    </Dialog>
                </div>
                <DataTable columns={columns} data={variants} />
            </div>
        </AppLayout>
    );
}
