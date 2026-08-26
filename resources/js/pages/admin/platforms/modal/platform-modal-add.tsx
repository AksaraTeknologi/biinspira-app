'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z.object({
    name: z.string().min(2, 'Nama event minimal 2 karakter'),
});

type FormData = z.infer<typeof schema>;

interface AddPlatformModalProps {
    onSuccess?: () => void;
}

export function AddPlatformModal({ onSuccess }: AddPlatformModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);

        router.post(route('admin.platforms.store'), data, {
            onSuccess: () => {
                toast.success('Platform berhasil ditambahkan');
                setOpen(false);
                form.reset();
                setIsLoading(false);
                onSuccess?.();
            },
            onError: (errors) => {
                toast.error(errors.name || 'Gagal menambahkan platform');
                setIsLoading(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-blue-700 dark:border dark:border-primary dark:bg-background dark:hover:bg-blue-900">
                    <Plus className="h-4 w-4" />
                    Tambah Platform
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Tambah Platfom Baru</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                        {/* Nama Platform */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Platform</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan nama platform" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-primary text-white hover:bg-blue-700">
                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
