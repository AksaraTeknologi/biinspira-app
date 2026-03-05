'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { CalendarIcon, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const schema = z.object({
    name: z.string().min(2, 'Nama event minimal 2 karakter'),
    batch: z.coerce.number().min(1, 'Batch wajib diisi'),
    end_date: z
        .string()
        .min(1, 'Tanggal wajib diisi')
        .refine((val) => new Date(val).toString() !== 'Invalid Date', 'Tanggal tidak valid'),
    user_id: z.string().min(1, 'User wajib dipilih'),
});

type FormData = z.infer<typeof schema>;
type User = {
    id: string;
    name: string;
    email: string;
};
type EventType = {
    id: string;
    name: string;
    batch: string;
    end_date: string;
    user: User;
};

interface EditEventModalProps {
    event: EventType;
    users: User[];
    authUserRole: string;
    authUserId: string;
    onSuccess?: () => void;
}

export function EditEventModal({ event, users, onSuccess, authUserRole, authUserId }: EditEventModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const initialDate = event.end_date ? new Date(event.end_date) : undefined;
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
    const currentUser = users.find(u => u.id === (authUserRole === 'admin' ? event.user.id : authUserId));
    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: event.name,
            batch: event.batch,
            end_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
            user_id: authUserRole === 'admin' ? String(event.user.id) : String(authUserId),
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        const isAdmin = authUserRole === 'admin';
        router.post(isAdmin ? route('admin.events.update', { id: event.id }) : route('user.events.update', { id: event.id }), data, {
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
                <Pencil className="h-4 w-4 cursor-pointer" />
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Event</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
                        {/* Nama Event */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Event</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Masukkan nama event"
                                            {...field}
                                        />
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
                                        <Input
                                            placeholder="Masukkan batch event (contoh: 1, 2, 3)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="user_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>User</FormLabel>
                                    {authUserRole === 'admin' ? (
                                        <>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="-- Pilih User --" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {users.map((u) => (
                                                        <SelectItem key={u.id} value={String(u.id)}>
                                                            {u.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Admin dapat mengubah user event
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <FormControl>
                                                <Input
                                                    value={currentUser?.name || "User tidak ditemukan"}
                                                    readOnly
                                                    className="bg-white dark:bg-black dark:text-white"
                                                />
                                            </FormControl>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Anda tidak dapat mengubah user event
                                            </p>
                                            <input
                                                type="hidden"
                                                {...field}
                                                value={String(authUserId)}
                                            />
                                        </>
                                    )}
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
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="w-full justify-start">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Pilih tanggal berakhir'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent align="start" side="bottom" sideOffset={4} forceMount className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate ?? null}
                                                onSelect={(date) => {
                                                    setSelectedDate(date ?? undefined);
                                                    field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                                                }}
                                                className={cn(
                                                    'pointer-events-auto rounded-xl p-2 text-sm',
                                                    '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
                                                    '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
                                                    '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
                                                    '[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white',
                                                    '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
                                                )}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-blue-600 text-white hover:bg-blue-700">
                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
