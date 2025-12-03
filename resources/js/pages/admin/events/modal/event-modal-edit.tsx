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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
    name: z.string().min(2, 'Nama event minimal 2 karakter'),
    batch: z.string().min(1, 'Batch wajib diisi'),
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
    onSuccess?: () => void;
}

export function EditEventModal({ event, users, onSuccess }: EditEventModalProps) {
    const [open, setOpen] = useState(false);
    console.log('Event in EditEventModal:', event);
    const [isLoading, setIsLoading] = useState(false);
    const initialDate = event.end_date ? new Date(event.end_date) : undefined;
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: event.name,
            batch: event.batch,
            end_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
            user_id: event.user.id,
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
                                        <input type="text" placeholder="Masukkan nama event" {...field} className="input w-full" />
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
                                        <input type="text" placeholder="Masukkan batch event (contoh: 1, 2, 3)" {...field} className="input w-full" />
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
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="-- Pilih User --" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {users?.length > 0 ? (
                                                users.map((u) => (
                                                    <SelectItem key={u.id} value={u.id}>
                                                        <div className="flex items-center gap-2">{u.name}</div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-data" disabled>
                                                    Tidak ada user tersedia
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
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
