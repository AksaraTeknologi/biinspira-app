'use client';

import { Button } from '@/components/ui/button';
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
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

interface DeleteButtonProps {
  id: any;
  name?: string;
  routeTable: string;
}

export default function DeleteButton({ id, name, routeTable }: DeleteButtonProps) {
  const handleDelete = () => {
    router.delete(route(`admin.${routeTable}.destroy`, { id }), {
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
            Apakah Anda yakin ingin menghapus {' '}
            <span className="font-semibold text-gray-900">{name ?? 'ini'}</span>?<br />
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
