'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PRESET_APPLICATION_COLORS } from '@/types/application';

const schema = z.object({
    name: z.string().min(1, 'Nama aplikasi wajib diisi').max(255, 'Nama maksimal 255 karakter'),
    description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format warna harus hex (contoh: #3B82F6)'),
    is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function AddApplicationModal({ onSuccess }: { onSuccess?: () => void }) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            description: '',
            color: '#3B82F6',
            is_active: true,
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);

        router.post(route('applications.store'), data, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Aplikasi berhasil ditambahkan');
                setOpen(false);
                form.reset({
                    name: '',
                    description: '',
                    color: '#3B82F6',
                    is_active: true,
                });
                setIsLoading(false);
                onSuccess?.();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0] as string | undefined;
                toast.error(firstError || 'Gagal menambahkan aplikasi');
                if (errors.name) {
                    form.setError('name', { message: errors.name });
                }
                if (errors.description) {
                    form.setError('description', { message: errors.description });
                }
                if (errors.color) {
                    form.setError('color', { message: errors.color });
                }
                setIsLoading(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-blue-700 dark:border dark:border-primary dark:bg-background dark:hover:bg-blue-900">
                    <Plus className="h-4 w-4" /> Tambah Aplikasi
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-125">
                <DialogHeader>
                    <DialogTitle>Tambah Aplikasi Baru</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                        {/* NAMA APLIKASI */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Nama Aplikasi <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="contoh: Biinspira, Biinsight" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* DESKRIPSI */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deskripsi (opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={3}
                                            placeholder="Deskripsi singkat tentang aplikasi ini..."
                                            {...field}
                                            value={field.value ?? ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* WARNA BADGE */}
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel>Warna Badge</FormLabel>
                                    <FormControl>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {PRESET_APPLICATION_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => field.onChange(color)}
                                                    className="h-7 w-7 rounded-full ring-offset-2 transition hover:scale-110 focus:outline-none"
                                                    style={{
                                                        backgroundColor: color,
                                                        outline: field.value === color ? `3px solid ${color}` : '2px solid transparent',
                                                        outlineOffset: field.value === color ? '2px' : '0',
                                                    }}
                                                    title={color}
                                                />
                                            ))}
                                            <input
                                                type="color"
                                                value={field.value || '#3B82F6'}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                                                title="Pilih warna kustom"
                                            />
                                        </div>
                                    </FormControl>
                                    <div className="pt-1">
                                        <span
                                            className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white shadow-xs"
                                            style={{ backgroundColor: field.value || '#3B82F6' }}
                                        >
                                            {form.watch('name') || 'Preview'}
                                        </span>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* STATUS AKTIF */}
                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-2">
                                    <FormControl>
                                        <Checkbox
                                            id="is_active_add"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormLabel htmlFor="is_active_add" className="text-sm font-normal cursor-pointer">
                                        Aktif (tampil di dropdown form tiket)
                                    </FormLabel>
                                </FormItem>
                            )}
                        />

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-zinc-800">
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
