'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { Eye, EyeOff, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z
    .object({
        name: z.string().min(2, 'Nama minimal 2 karakter'),
        email: z.string().email('Format email tidak valid'),
        phone: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
        password: z.string().optional(),
        password_confirmation: z.string().optional(),
    })
    .refine(
        (data) => {
            if (!data.password) {
                return true;
            }

            return data.password.length >= 6;
        },
        {
            message: 'Password minimal 6 karakter',
            path: ['password'],
        },
    )
    .refine(
        (data) => {
            if (!data.password) {
                return true;
            }

            return data.password === (data.password_confirmation ?? '');
        },
        {
            message: 'Konfirmasi password tidak cocok',
            path: ['password_confirmation'],
        },
    );

type FormData = z.infer<typeof schema>;

interface Technician {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
}

interface EditTechnicianModalProps {
    user: Technician;
    onSuccess?: () => void;
}

export function EditTechnicianModal({ user, onSuccess }: EditTechnicianModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            password: '',
            password_confirmation: '',
        },
    });

    const onSubmit = (data: FormData) => {
        setIsLoading(true);

        const payload: Record<string, string> = {
            name: data.name,
            email: data.email,
            phone: data.phone ?? '',
        };

        if (data.password) {
            payload.password = data.password;
            payload.password_confirmation = data.password_confirmation ?? '';
        }

        router.patch(route('technicians.update', { id: user.id }), payload, {
            onSuccess: () => {
                toast.success('Technician berhasil diperbarui');
                setOpen(false);
                setIsLoading(false);
                onSuccess?.();
            },
            onError: (errors) => {
                toast.error(errors.name || errors.email || errors.password || 'Gagal memperbarui technician');
                setIsLoading(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Pencil className="h-4 w-4 cursor-pointer" />
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]" aria-describedby={undefined}>
                <DialogHeader>
                    <DialogTitle>Edit Technician</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan nama technician" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="Masukkan email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Masukkan nomor telepon" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password Baru (Optional)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showPassword ? 'text' : 'password'} placeholder="Masukkan password baru" {...field} />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-black"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password_confirmation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Konfirmasi Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="Ulangi password" {...field} />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-black"
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
