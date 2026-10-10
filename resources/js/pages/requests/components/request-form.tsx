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
import { useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, Check, Hammer, Pencil, Plus, Sparkles, Trash2, Wrench, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Application = {
    id: number | string;
    name: string;
    color?: string | null;
};

type SubtaskItem = {
    id?: number | string;
    title: string;
};

type RequestTask = {
    id: number | string;
    title: string;
    description?: string | null;
    created_by?: number | string;
    created_by_name?: string | null;
    related_url?: string | null;
    urgency: 'high' | 'medium' | 'low';
    target_role?: 'technician' | 'technician-intern';
    deadline?: string | null;
    attachments?: Array<{ file_path: string }>;
    application_id?: number | string | null;
    work_type?: 'pengerjaan' | 'penambahan_fitur' | 'maintenance' | null;
    subtasks?: Array<{ id?: number | string; title: string; is_completed?: boolean }>;
};

type RequestFormProps = {
    mode: 'create' | 'edit';
    task?: RequestTask;
    applications?: Application[];
};

type RequestPayload = {
    title: string;
    description: string;
    related_url: string;
    urgency: 'high' | 'medium' | 'low';
    target_role: 'technician' | 'technician-intern';
    deadline: string;
    attachments: File[];
    application_id: string;
    work_type: string;
    subtasks: SubtaskItem[];
    _method?: 'PUT';
};

const calendarClassName = cn(
    'rounded-xl p-2 text-sm',
    '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
    '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
    '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
    '[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-white',
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

export default function RequestForm({ mode, task, applications = [] }: RequestFormProps) {
    const { auth } = usePage<any>().props;
    const userRoles = (auth?.user?.roles ?? []).map((role: any) => (typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase() ?? ''));
    const isAdmin = userRoles.includes('admin');
    const isCreator =
        mode === 'create' ||
        Boolean(
            (task?.created_by != null && auth?.user?.id != null && String(task.created_by) === String(auth.user.id)) ||
            (task?.created_by_name && auth?.user?.name && task.created_by_name.trim().toLowerCase() === auth.user.name.trim().toLowerCase()),
        );
    const canManageSubtasks = isAdmin || isCreator;

    const [date, setDate] = useState<Date | undefined>(parseDeadline(task?.deadline));
    const [newFilePreviews, setNewFilePreviews] = useState<Array<string | null>>([]);
    const [subtaskInput, setSubtaskInput] = useState('');
    const [editingSubtaskIndex, setEditingSubtaskIndex] = useState<number | null>(null);
    const [editingSubtaskValue, setEditingSubtaskValue] = useState('');

    const { data, setData, post, processing, errors, reset, transform } = useForm<RequestPayload>({
        title: task?.title ?? '',
        description: task?.description ?? '',
        related_url: task?.related_url ?? '',
        urgency: task?.urgency ?? 'low',
        target_role: task?.target_role ?? 'technician',
        deadline: task?.deadline ? (task.deadline.includes(' ') ? task.deadline.split(' ')[0] : task.deadline) : '',
        attachments: [],
        application_id: task?.application_id ? String(task.application_id) : '',
        work_type: task?.work_type ?? '',
        subtasks: (task?.subtasks ?? []).map((s) => ({
            id: s.id,
            title: s.title,
        })),
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
            application_id: task.application_id ? String(task.application_id) : '',
            work_type: task.work_type ?? '',
            subtasks: (task.subtasks ?? []).map((s) => ({
                id: s.id,
                title: s.title,
            })),
        });
    }, [task, setData]);

    const addSubtaskItem = () => {
        if (!subtaskInput.trim()) return;
        setData('subtasks', [...(data.subtasks || []), { title: subtaskInput.trim() }]);
        setSubtaskInput('');
    };

    const startEditSubtask = (index: number, currentTitle: string) => {
        setEditingSubtaskIndex(index);
        setEditingSubtaskValue(currentTitle);
    };

    const saveEditSubtask = (index: number) => {
        if (!editingSubtaskValue.trim()) return;
        const nextList = [...(data.subtasks || [])];
        nextList[index] = {
            ...nextList[index],
            title: editingSubtaskValue.trim(),
        };
        setData('subtasks', nextList);
        setEditingSubtaskIndex(null);
        setEditingSubtaskValue('');
    };

    const cancelEditSubtask = () => {
        setEditingSubtaskIndex(null);
        setEditingSubtaskValue('');
    };

    const removeSubtaskItem = (index: number) => {
        if (editingSubtaskIndex === index) {
            cancelEditSubtask();
        }
        setData(
            'subtasks',
            (data.subtasks || []).filter((_, i) => i !== index),
        );
    };

    useEffect(() => {
        return () => {
            newFilePreviews.forEach((url) => {
                if (url) URL.revokeObjectURL(url);
            });
        };
    }, [newFilePreviews]);

    const existingAttachments = useMemo(() => task?.attachments ?? [], [task]);

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

        if (!data.title.trim() || !data.urgency || !data.target_role || !data.deadline) {
            toast.error('Mohon lengkapi semua kolom yang wajib diisi.');
            return;
        }

        transform((current) => ({
            ...current,
            description: current.description ? current.description.trim() : '',
            related_url: current.related_url && current.related_url.trim() ? current.related_url.trim() : null,
            application_id: current.application_id && current.application_id !== 'none' ? current.application_id : null,
            work_type: current.work_type && current.work_type !== 'none' ? current.work_type : null,
            ...(mode === 'edit' ? { _method: 'PUT' as const } : {}),
        }));

        post(mode === 'edit' && task ? route('requests.update', task.id) : route('requests.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                if (mode === 'create') {
                    reset('title', 'description', 'related_url', 'urgency', 'target_role', 'deadline', 'attachments', 'application_id', 'work_type');
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
                        <Label htmlFor="description">Deskripsi (Opsional)</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(event) => setData('description', event.target.value)}
                            placeholder="Jelaskan detail tiket (opsional jika sudah dipecah ke subtask)"
                            className="min-h-32"
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                    </div>

                    {/* Subtask Section */}
                    <div className="space-y-3">
                        <Label className="font-semibold text-zinc-900 dark:text-zinc-100">Subtask / Rincian Pekerjaan (Opsional)</Label>
                        <p className="mb-2 text-xs text-muted-foreground">
                            Pecah tiket ini menjadi beberapa langkah pekerjaan yang harus diselesaikan oleh tim.
                        </p>

                        {canManageSubtasks && (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Contoh: Buat endpoint API, Desain form input..."
                                    value={subtaskInput}
                                    onChange={(e) => setSubtaskInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addSubtaskItem();
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={addSubtaskItem}
                                    disabled={!subtaskInput.trim()}
                                    className="shrink-0 gap-1.5 text-xs"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Tambah
                                </Button>
                            </div>
                        )}

                        {data.subtasks && data.subtasks.length > 0 ? (
                            <div className="space-y-2 pt-1">
                                {data.subtasks.map((stItem, idx) =>
                                    editingSubtaskIndex === idx ? (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 rounded-lg border border-primary/50 bg-blue-50/30 p-1.5 text-xs dark:border-blue-700 dark:bg-blue-950/20"
                                        >
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10.5px] font-bold text-primary dark:bg-blue-900/60 dark:text-blue-300">
                                                {idx + 1}
                                            </span>
                                            <Input
                                                value={editingSubtaskValue}
                                                onChange={(e) => setEditingSubtaskValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        saveEditSubtask(idx);
                                                    }
                                                    if (e.key === 'Escape') {
                                                        e.preventDefault();
                                                        cancelEditSubtask();
                                                    }
                                                }}
                                                autoFocus
                                                placeholder="Nama subtask..."
                                                className="h-8 flex-1 text-xs bg-white dark:bg-zinc-900"
                                            />
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => saveEditSubtask(idx)}
                                                className="h-8 gap-1 px-3 text-xs"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                                Simpan
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={cancelEditSubtask}
                                                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                Batal
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            key={idx}
                                            className="group flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-zinc-800 transition-colors hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                                        >
                                            <div
                                                className={cn(
                                                    'flex min-w-0 flex-1 items-center gap-2',
                                                    canManageSubtasks && 'cursor-pointer hover:text-primary transition-colors',
                                                )}
                                                onClick={() => {
                                                    if (canManageSubtasks) {
                                                        startEditSubtask(idx, stItem.title);
                                                    }
                                                }}
                                                title={canManageSubtasks ? 'Klik untuk mengedit subtask' : undefined}
                                            >
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10.5px] font-bold text-primary dark:bg-blue-900/60 dark:text-blue-300">
                                                    {idx + 1}
                                                </span>
                                                <span className="truncate">{stItem.title}</span>
                                            </div>
                                            {canManageSubtasks && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditSubtask(idx, stItem.title)}
                                                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                                                        title="Edit subtask"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSubtaskItem(idx)}
                                                        className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-zinc-800"
                                                        title="Hapus subtask"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ),
                                )}
                            </div>
                        ) : (
                            !canManageSubtasks && (
                                <p className="text-xs text-muted-foreground italic">Tidak ada subtask yang ditambahkan oleh pembuat tiket.</p>
                            )
                        )}
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="related-url">Link Website Terkait (Opsional)</Label>
                        <Input
                            id="related-url"
                            type="text"
                            value={data.related_url}
                            onChange={(event) => setData('related_url', event.target.value)}
                            placeholder="Masukan link website yang perlu diperbaiki (opsional)"
                        />
                        {errors.related_url && <p className="text-sm text-red-500">{errors.related_url}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                            <Label>Target Role</Label>
                            <Select
                                value={data.target_role}
                                onValueChange={(value: 'technician' | 'technician-intern') => setData('target_role', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih target role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="technician">Programmer</SelectItem>
                                    <SelectItem value="technician-intern">Programmer Magang</SelectItem>
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

                        {/* Aplikasi (opsional) */}
                        {applications.length > 0 && (
                            <div className="space-y-3">
                                <Label>
                                    Aplikasi <span className="text-xs text-gray-400">(opsional)</span>
                                </Label>
                                <Select
                                    value={data.application_id ? data.application_id : 'none'}
                                    onValueChange={(value) => setData('application_id', value === 'none' ? '' : value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih aplikasi terkait" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">— Tidak ada —</SelectItem>
                                        {applications.map((app) => (
                                            <SelectItem key={app.id} value={String(app.id)}>
                                                {app.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.application_id && <p className="text-sm text-red-500">{errors.application_id}</p>}
                            </div>
                        )}

                        {/* Work Type (opsional) */}
                        <div className="space-y-3">
                            <Label>
                                Jenis Pekerjaan <span className="text-xs text-gray-400">(opsional)</span>
                            </Label>
                            <Select
                                value={data.work_type ? data.work_type : 'none'}
                                onValueChange={(value) => setData('work_type', value === 'none' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih jenis pekerjaan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— Tidak ada —</SelectItem>
                                    <SelectItem value="pengerjaan">
                                        <div className="flex items-center gap-2">
                                            <Wrench className="h-4 w-4 text-blue-500" />
                                            <span>Pengerjaan</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="penambahan_fitur">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-violet-500" />
                                            <span>Penambahan Fitur</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="maintenance">
                                        <div className="flex items-center gap-2">
                                            <Hammer className="h-4 w-4 text-amber-500" />
                                            <span>Maintenance</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.work_type && <p className="text-sm text-red-500">{errors.work_type}</p>}
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
                            <Label htmlFor="attachments">Lampiran (Opsional)</Label>
                            <Input id="attachments" type="file" multiple onChange={handleFileChange} />
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
                                                className="block rounded-md px-2 py-2 text-sm text-primary hover:bg-blue-50 dark:hover:bg-zinc-800"
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
