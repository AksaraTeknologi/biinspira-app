'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type RequestTask = {
    id: number;
    title: string;
    description: string;
    related_url?: string | null;
    urgency: 'high' | 'medium' | 'low';
    target_role?: 'technician' | 'technician-intern';
    deadline?: string | null;
    attachments?: Array<{ file_path: string }>;
};

type RequestFormProps = {
    mode: 'create' | 'edit';
    task?: RequestTask;
};

type RequestPayload = {
    title: string;
    description: string;
    related_url: string;
    urgency: 'high' | 'medium' | 'low';
    target_role: 'technician' | 'technician-intern';
    deadline: string;
    attachments: File[];
    _method?: 'PUT';
};

const calendarClassName = cn(
    'rounded-xl p-2 text-sm',
    '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
    '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
    '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
    '[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white',
    '[&_.rdp-day_range_middle]:bg-blue-100 [&_.rdp-day_range_middle]:text-zinc-800',
    '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
);

function parseDeadline(value?: string | null) {
    if (!value) return undefined;
    const normalized = value.includes(' ') ? value.split(' ')[0] : value;
    return new Date(normalized);
}

function isImageFile(filePath: string) {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(filePath);
}

export default function RequestForm({ mode, task }: RequestFormProps) {
    const [date, setDate] = useState<Date | undefined>(parseDeadline(task?.deadline));
    const [newFilePreviews, setNewFilePreviews] = useState<Array<string | null>>([]);

    const { data, setData, post, processing, errors, reset, transform } = useForm<RequestPayload>({
        title: task?.title ?? '',
        description: task?.description ?? '',
        related_url: task?.related_url ?? '',
        urgency: task?.urgency ?? 'low',
        target_role: task?.target_role ?? 'technician',
        deadline: task?.deadline ? (task.deadline.includes(' ') ? task.deadline.split(' ')[0] : task.deadline) : '',
        attachments: [],
    });

    useEffect(() => {
        if (!task) return;

        const nextDate = parseDeadline(task.deadline);
        setDate(nextDate);

        setData({
            title: task.title ?? '',
            description: task.description ?? '',
            related_url: task.related_url ?? '',
            urgency: task.urgency ?? 'low',
            target_role: task.target_role ?? 'technician',
            deadline: task.deadline ? (task.deadline.includes(' ') ? task.deadline.split(' ')[0] : task.deadline) : '',
            attachments: [],
        });
    }, [task, setData]);

    useEffect(() => {
        return () => {
            newFilePreviews.forEach((url) => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [newFilePreviews]);

    const existingAttachments = useMemo(() => task?.attachments ?? [], [task]);
    const hasAttachmentValue = data.attachments.length > 0 || existingAttachments.length > 0;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;

        const files = Array.from(event.target.files);
        setData('attachments', files);

        newFilePreviews.forEach((url) => {
            if (url) URL.revokeObjectURL(url);
        });

        const previews = files.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : null));

        setNewFilePreviews(previews);
    };

    const removeNewFile = (index: number) => {
        const nextFiles = data.attachments.filter((_, fileIndex) => fileIndex !== index);
        const nextPreviews = newFilePreviews.filter((_, previewIndex) => previewIndex !== index);

        setData('attachments', nextFiles);
        setNewFilePreviews(nextPreviews);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!data.title.trim() || !data.description.trim() || !data.related_url.trim() || !data.urgency || !data.target_role || !data.deadline || !hasAttachmentValue) {
            toast.error('Semua input wajib diisi.');
            return;
        }

        transform((current) => ({
            ...current,
            ...(mode === 'edit' ? { _method: 'PUT' as const } : {}),
        }));

        post(mode === 'edit' && task ? route('requests.update', task.id) : route('requests.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (mode === 'create') {
                    reset('title', 'description', 'related_url', 'urgency', 'target_role', 'deadline', 'attachments');
                    setDate(undefined);
                    setNewFilePreviews([]);
                }
            },
            onError: () => {
                toast.error(mode === 'edit' ? 'Gagal memperbarui tiket' : 'Gagal membuat tiket');
            },
        });
    };

    return (
        <Card className="border-zinc-200 shadow-sm dark:border-zinc-800">
            <CardHeader>
                <CardTitle>{mode === 'edit' ? 'Edit Tiket' : 'Buat Tiket'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="title">Judul</Label>
                        <Input
                            id="title"
                            required
                            value={data.title}
                            onChange={(event) => setData('title', event.target.value)}
                            placeholder="Masukkan judul tiket"
                        />
                        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            required
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            placeholder="Jelaskan detail tiket"
                            className="min-h-32"
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="related-url">Link Website Terkait</Label>
                        <Input
                            id="related-url"
                            type="text"
                            required
                            value={data.related_url}
                            onChange={(event) => setData('related_url', event.target.value)}
                            placeholder="Masukan link website yang perlu diperbaiki"
                        />
                        {errors.related_url && <p className="text-sm text-red-500">{errors.related_url}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                            <Label>Target Role</Label>
                            <Select value={data.target_role} onValueChange={(value: 'technician' | 'technician-intern') => setData('target_role', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih target role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="technician">Technician</SelectItem>
                                    <SelectItem value="technician-intern">Intern</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.target_role && <p className="text-sm text-red-500">{errors.target_role}</p>}
                        </div>

                        <div className="space-y-3">
                            <Label>Urgensi</Label>
                            <Select value={data.urgency} onValueChange={(value: 'high' | 'medium' | 'low') => setData('urgency', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih urgensi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.urgency && <p className="text-sm text-red-500">{errors.urgency}</p>}
                        </div>

                        <div className="space-y-3">
                            <Label>Deadline</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        aria-required
                                        className={cn('h-10 w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, 'yyyy-MM-dd') : 'Pilih deadline'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        className={calendarClassName}
                                        onSelect={(selectedDate) => {
                                            setDate(selectedDate);
                                            setData('deadline', selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.deadline && <p className="text-sm text-red-500">{errors.deadline}</p>}
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="attachments">Lampiran</Label>
                            <Input
                                id="attachments"
                                type="file"
                                multiple
                                required={mode === 'create' || existingAttachments.length === 0}
                                onChange={handleFileChange}
                            />
                            {(mode === 'create' || existingAttachments.length === 0) && (
                                <p className="text-xs text-zinc-500">Minimal satu lampiran wajib diisi.</p>
                            )}
                            {errors.attachments && <p className="text-sm text-red-500">{errors.attachments}</p>}
                        </div>
                    </div>

                    {mode === 'edit' && existingAttachments.length > 0 && (
                        <div className="space-y-3">
                            <Label>Lampiran yang Ada</Label>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                {existingAttachments.map((attachment, index) => (
                                    <div key={`${attachment.file_path}-${index}`} className="rounded-md border p-2 dark:border-zinc-700">
                                        {isImageFile(attachment.file_path) ? (
                                            <a href={`/storage/${attachment.file_path}`} target="_blank" rel="noreferrer">
                                                <img
                                                    src={`/storage/${attachment.file_path}`}
                                                    alt={attachment.file_path.split('/').pop()}
                                                    className="h-28 w-full rounded-md object-cover"
                                                />
                                            </a>
                                        ) : (
                                            <a
                                                href={`/storage/${attachment.file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block rounded-md px-2 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800"
                                            >
                                                {attachment.file_path.split('/').pop()}
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.attachments.length > 0 && (
                        <div className="space-y-3">
                            <Label>Preview File Baru</Label>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {data.attachments.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="relative rounded-lg border p-2 dark:border-zinc-700">
                                        {newFilePreviews[index] ? (
                                            <img
                                                src={newFilePreviews[index] as string}
                                                alt={`preview-${index}`}
                                                className="h-24 w-full rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-24 items-center justify-center text-xs text-zinc-500 dark:text-zinc-300">
                                                {file.name}
                                            </div>
                                        )}
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-1 right-1 h-6 w-6"
                                            onClick={() => removeNewFile(index)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="submit" disabled={processing} className="min-w-36">
                            {processing ? 'Processing...' : mode === 'edit' ? 'Perbarui Tiket' : 'Buat Tiket'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
