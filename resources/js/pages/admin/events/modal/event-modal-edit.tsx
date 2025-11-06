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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  name: z.string().min(2, 'Nama event minimal 2 karakter'),
  batch: z.string().min(1, 'Batch wajib diisi'),
  end_date: z.string().min(1, 'Tanggal wajib diisi')
  .refine(val => new Date(val).toString() !== 'Invalid Date', 'Tanggal tidak valid'),
});

type FormData = z.infer<typeof schema>;
type EventType = {
  id: string;
  name: string;
  batch: string;
  end_date: string;
};

interface EditEventModalProps {
  event: EventType;
  onSuccess?: () => void;
}

export function EditEventModal({ event, onSuccess }: EditEventModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const formattedDate = event.end_date ? new Date(event.end_date).toISOString().split('T')[0] : '';
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: event.name,
      batch: event.batch,
      end_date: formattedDate,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    router.post(route('admin.events.update', { id: event.id }), data, {
      onSuccess: () => {
        toast.success('Event berhasil diperbarui');
        setOpen(false);
        setIsLoading(false);
        onSuccess?.();
        form.reset(data);
      },
      onError: (errors) => {
        toast.error(errors.name || 'Gagal memperbarui event');
        setIsLoading(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Event Baru</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Nama Event */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Event</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama event" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Batch */}
            <FormField
              control={form.control}
              name="batch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan batch event (contoh: 1, 2, 3)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tanggal Berakhir */}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Berakhir</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
