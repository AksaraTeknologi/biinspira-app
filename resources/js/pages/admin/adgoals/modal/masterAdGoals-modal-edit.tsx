'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ✅ Validasi form
const schema = z.object({
  name: z.string().min(2, 'Nama Ad Goal minimal 2 karakter'),
});

type FormData = z.infer<typeof schema>;

type MasterAdGoalType = {
  id: number;
  name: string;
};

interface EditMasterAdGoalsModalProps {
  masterAdGoals: MasterAdGoalType;
  onSuccess?: () => void;
}

export function EditMasterAdGoalsModal({
  masterAdGoals,
  onSuccess,
}: EditMasterAdGoalsModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: masterAdGoals.name,
    },
  });

  // ✅ Gunakan PUT (karena di controller kamu pakai update)
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    router.post(route('admin.adgoals.update', masterAdGoals.id), data, {
      onSuccess: () => {
        toast.success('Ad Goal berhasil diperbarui');
        setOpen(false);
        setIsLoading(false);
        onSuccess?.();
        form.reset(data);
      },
      onError: (errors: Record<string, string>) => {
        toast.error(errors.name || 'Gagal memperbarui Ad Goal');
        setIsLoading(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-muted"
          title="Edit Ad Goal"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Nama Target</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Input Nama Ad Goal */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Target</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama Ad Goal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
