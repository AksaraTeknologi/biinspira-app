'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteButtonProps {
    id: string | number;
    name?: string;
    role?: string;
    routeTable?: string;
    routeName?: string;
}

export default function DeleteButton({ id, name, routeTable, role, routeName }: DeleteButtonProps) {
    const handleDelete = () => {
        const resolvedRouteName = routeName ?? (role && routeTable ? `${role}.${routeTable}.destroy` : null);

        if (!resolvedRouteName) {
            toast.error('Route delete tidak valid');
            return;
        }

        router.delete(route(resolvedRouteName, { id }), {
            onSuccess: () => {
                toast.success(`${name ?? id} berhasil dihapus`);
            },
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus ?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus <span className="font-semibold text-gray-900">{name ?? 'ini'}</span>?<br />
                        Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                        Hapus
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
