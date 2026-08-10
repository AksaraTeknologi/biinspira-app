'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { Building2, CalendarIcon, Hammer, Link2, ShieldAlert, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

type User = {
    id: number;
    name: string;
    role: string;
};

type RoleItem = {
    name: string;
};

type PageProps = {
    auth?: {
        user?: {
            roles?: Array<RoleItem | string>;
        };
    };
};

type TaskAttachment = {
    file_path: string;
};

type Task = {
    id: number;
    title: string;
    description?: string;
    related_url?: string | null;
    status: 'request' | 'todo' | 'in_progress' | 'in_review' | 'complete';
    urgency?: string;
    target_role?: string;
    created_by_name?: string;
    assigned_to?: number | string | null;
    assigned_to_name?: string | null;
    deadline?: string | null;
    estimation_start?: string | null;
    estimation_end?: string | null;
    attachments?: TaskAttachment[];
    review_note?: string | null;
};

type TaskModalProps = {
    task: Task | null;
    onClose: () => void;
    users?: User[];
    currentUserId?: number | null;
};

type UpdatePayload = {
    status: string;
    estimation_start: string | null;
    estimation_end: string | null;
    assigned_to: string;
};

const STATUS_OPTIONS = [
    { value: 'request', label: 'Permintaan' },
    { value: 'todo', label: 'Akan Dikerjakan' },
    { value: 'in_progress', label: 'Sedang Dikerjakan' },
    { value: 'in_review', label: 'Sedang Ditinjau' },
    { value: 'complete', label: 'Selesai' },
] as const;

const progressMap: Record<string, number> = {
    request: 10,
    todo: 25,
    in_progress: 60,
    in_review: 85,
    complete: 100,
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

function parseDate(value?: string | null) {
    if (!value) return undefined;
    const normalized = value.includes(' ') ? value.split(' ')[0] : value;
    return new Date(normalized);
}

function normalizeDateInput(value?: string | null) {
    if (!value) return null;
    return value.includes(' ') ? value.split(' ')[0] : value;
}

function formatDisplayDate(value?: string | null) {
    const date = parseDate(value);
    return date ? format(date, 'dd MMM yyyy') : '-';
}

function isImage(filePath: string) {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(filePath);
}

function resolveAssignedToId(task: Task | null, users: User[]) {
    if (task?.assigned_to != null && String(task.assigned_to).length > 0) {
        return String(task.assigned_to);
    }

    if (task?.assigned_to_name) {
        const normalizedName = task.assigned_to_name.trim().toLowerCase();
        const matchedUser = users.find((user) => user.name.trim().toLowerCase() === normalizedName);
        if (matchedUser) return String(matchedUser.id);
    }

    return '';
}

function buildUpdatePayload(task: Task | null, users: User[]): UpdatePayload {
    return {
        status: task?.status || 'request',
        estimation_start: normalizeDateInput(task?.estimation_start),
        estimation_end: normalizeDateInput(task?.estimation_end),
        assigned_to: resolveAssignedToId(task, users),
    };
}

export default function TaskModal({ task, onClose, users = [], currentUserId = null }: TaskModalProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [expandedDesc, setExpandedDesc] = useState(false);

    const { auth } = usePage<PageProps>().props;
    const userRoles = (auth?.user?.roles ?? []).map((role) => (typeof role === 'string' ? role.toLowerCase() : role.name.toLowerCase()));
    const isAdmin = userRoles.includes('admin');
    const isAssignedToCurrentUser = currentUserId != null && task?.assigned_to != null && Number(task.assigned_to) === Number(currentUserId);
    const canClaimTask = Boolean(task && !isAdmin && (userRoles.includes('technician') || userRoles.includes('technician-intern')) && task.status === 'request' && !task.assigned_to);
    const canUpdateTask = isAdmin || isAssignedToCurrentUser;

    const initialPayload = useMemo(() => buildUpdatePayload(task, users), [task, users]);

    const { data, setData, patch, processing, transform } = useForm<UpdatePayload>(initialPayload);

    useEffect(() => {
        setData(initialPayload);
    }, [initialPayload, setData]);

    useEffect(() => {
        setExpandedDesc(false);
    }, [task?.id]);

    const range = useMemo<DateRange>(
        () => ({
            from: parseDate(data.estimation_start),
            to: parseDate(data.estimation_end),
        }),
        [data.estimation_start, data.estimation_end],
    );

    const selectedAssignedTo = useMemo(() => {
        if (data.assigned_to) return data.assigned_to;

        const fallbackAssignedTo = resolveAssignedToId(task, users);
        return fallbackAssignedTo || 'unassigned';
    }, [data.assigned_to, task, users]);

    const attachments = task?.attachments || [];

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!task) return;

        transform((current) => ({
            ...current,
            assigned_to: selectedAssignedTo === 'unassigned' ? '' : selectedAssignedTo,
        }));

        patch(`/requests/${task.id}/status`, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                onClose();
                router.reload({
                    only: ['tasks'],
                });
            },
            onError: () => {
                toast.error('Gagal memperbarui tiket');
            },
        });
    };

    const claimTask = () => {
        if (!task || currentUserId == null) return;

        if (!data.estimation_start || !data.estimation_end) {
            toast.error('Harap isi rentang estimasi terlebih dahulu.');
            return;
        }

        transform((current) => ({
            ...current,
            assigned_to: String(currentUserId),
        }));

        patch(`/requests/${task.id}/status`, {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => {
                onClose();
                router.reload({
                    only: ['tasks'],
                });
            },
            onError: () => {
                toast.error('Gagal mengambil task');
            },
        });
    };

    if (!task) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
                <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
                    <div className="h-2 w-full bg-gray-200 dark:bg-zinc-700">
                        <div className="h-2 bg-blue-500 transition-all duration-500" style={{ width: `${progressMap[task.status] || 0}%` }} />
                    </div>

                    <div className="px-5 pt-2 text-xs text-gray-500 dark:text-zinc-400">Progres: {progressMap[task.status] || 0}%</div>

                    <div className="flex items-center justify-between border-b p-5 dark:border-zinc-700">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{task.title}</h2>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                                    {STATUS_OPTIONS.find((item) => item.value === task.status)?.label ?? task.status}
                                </span>
                                {userRoles.includes('technician') && task.target_role === 'technician-intern' && (
                                    <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                        Untuk Intern
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 space-y-6 overflow-y-auto p-6">
                        <div className="overflow-hidden rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-zinc-800 dark:text-zinc-200">
                            <p className={cn('leading-relaxed whitespace-pre-wrap', !expandedDesc && 'line-clamp-3')}>
                                {task.description || 'Tidak ada deskripsi'}
                            </p>

                            {task.description && task.description.length > 120 && (
                                <button
                                    type="button"
                                    onClick={() => setExpandedDesc((state) => !state)}
                                    className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    {expandedDesc ? 'Tutup' : 'Selengkapnya'}
                                </button>
                            )}
                        </div>

                        {/* Catatan Revisi (muncul jika ada) */}
                        {task.review_note && (
                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
                                <p className="mb-1 text-xs font-semibold text-orange-600 dark:text-orange-400">📝 Catatan Revisi</p>
                                <p className="whitespace-pre-wrap text-sm text-orange-800 dark:text-orange-300">{task.review_note}</p>
                            </div>
                        )}

                        {attachments.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-semibold text-gray-500 dark:text-zinc-400">Lampiran</p>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    {attachments.map((file, index) => {
                                        const url = `/storage/${file.file_path}`;

                                        if (isImage(file.file_path)) {
                                            return (
                                                <img
                                                    key={`${file.file_path}-${index}`}
                                                    src={url}
                                                    alt={`attachment-${index}`}
                                                    onClick={() => setPreview(url)}
                                                    className="h-28 w-full cursor-pointer rounded-lg object-cover transition hover:scale-[1.02]"
                                                />
                                            );
                                        }

                                        return (
                                            <a
                                                key={`${file.file_path}-${index}`}
                                                href={url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 rounded-md border p-3 text-sm text-blue-600 hover:bg-blue-50 dark:border-zinc-700 dark:text-blue-400 dark:hover:bg-zinc-800"
                                            >
                                                <Link2 className="h-4 w-4" />
                                                Buka File
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="mb-1 text-xs text-gray-500 dark:text-zinc-400">Platform</p>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{task.created_by_name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
                                <Hammer className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="mb-1 text-xs text-gray-500 dark:text-zinc-400">Programmer</p>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{task.assigned_to_name || 'Belum ditugaskan'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">Deadline</p>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatDisplayDate(task.deadline)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
                                <ShieldAlert className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">Urgensi</p>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">{task.urgency || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 md:col-span-2 dark:bg-zinc-800">
                                <Link2 className="h-4 w-4 text-gray-400" />
                                <div className="min-w-0">
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">URL Terkait</p>
                                    {task.related_url ? (
                                        <a
                                            href={task.related_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="truncate text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                                        >
                                            {task.related_url}
                                        </a>
                                    ) : (
                                        <p className="font-medium text-zinc-900 dark:text-zinc-100">-</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">Estimasi Mulai</p>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatDisplayDate(task.estimation_start)}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
                                <CalendarIcon className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400">Estimasi Selesai</p>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{formatDisplayDate(task.estimation_end)}</p>
                                </div>
                            </div>
                        </div>

                        {canClaimTask && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Task ini belum ditugaskan</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-200">
                                            Isi rentang estimasi di bawah lalu ambil task ini untuk Anda kerjakan.
                                        </p>
                                    </div>

                                    <Button type="button" onClick={claimTask} disabled={processing} className="bg-amber-600 hover:bg-amber-700">
                                        {processing ? 'Mengambil...' : 'Ambil ke Saya'}
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-amber-900 dark:text-amber-100">Rentang Estimasi Pengerjaan</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn('w-full justify-start text-left font-normal bg-white dark:bg-zinc-900 border-amber-200', !range.from && 'text-muted-foreground')}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {range.from
                                                    ? range.to
                                                        ? `${format(range.from, 'dd MMM yyyy')} - ${format(range.to, 'dd MMM yyyy')}`
                                                        : format(range.from, 'dd MMM yyyy')
                                                    : 'Pilih rentang estimasi'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="range"
                                                selected={range}
                                                numberOfMonths={2}
                                                className={calendarClassName}
                                                onSelect={(selectedRange) => {
                                                    setData(
                                                        'estimation_start',
                                                        selectedRange?.from ? format(selectedRange.from, 'yyyy-MM-dd') : null,
                                                    );
                                                    setData('estimation_end', selectedRange?.to ? format(selectedRange.to, 'yyyy-MM-dd') : null);
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}

                        {canUpdateTask && (
                            <form onSubmit={submit} className="space-y-4 border-t pt-4 dark:border-zinc-700">
                                <h3 className="text-sm font-semibold text-gray-600 dark:text-zinc-300">Perbarui Tugas</h3>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {!isAdmin && (
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((item) => (
                                                        <SelectItem key={item.value} value={item.value}>
                                                            {item.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {isAdmin && (
                                        <div className="space-y-2">
                                            <Label>Pilih Teknisi</Label>
                                            <Select
                                                value={selectedAssignedTo}
                                                onValueChange={(value) => setData('assigned_to', value === 'unassigned' ? '' : value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih teknisi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Belum ditugaskan</SelectItem>
                                                    {users.map((user) => (
                                                        <SelectItem key={user.id} value={String(user.id)}>
                                                            {user.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Rentang Estimasi</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn('w-full justify-start text-left font-normal', !range.from && 'text-muted-foreground')}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {range.from
                                                    ? range.to
                                                        ? `${format(range.from, 'dd MMM yyyy')} - ${format(range.to, 'dd MMM yyyy')}`
                                                        : format(range.from, 'dd MMM yyyy')
                                                    : 'Pilih rentang estimasi'}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="range"
                                                selected={range}
                                                numberOfMonths={2}
                                                className={calendarClassName}
                                                onSelect={(selectedRange) => {
                                                    setData(
                                                        'estimation_start',
                                                        selectedRange?.from ? format(selectedRange.from, 'yyyy-MM-dd') : null,
                                                    );
                                                    setData('estimation_end', selectedRange?.to ? format(selectedRange.to, 'yyyy-MM-dd') : null);
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Estimasi Mulai</Label>
                                        <Input value={formatDisplayDate(data.estimation_start)} readOnly />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Estimasi Selesai</Label>
                                        <Input value={formatDisplayDate(data.estimation_end)} readOnly />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {preview && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80" onClick={() => setPreview(null)}>
                    <img src={preview} alt="preview" className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-xl" />
                </div>
            )}
        </>
    );
}
