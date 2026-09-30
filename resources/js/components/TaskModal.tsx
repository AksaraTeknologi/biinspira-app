'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { AppWindow, Building2, CalendarIcon, Hammer, Link2, MessageSquare, Send, ShieldAlert, Sparkles, Trash2, Wrench, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { getCsrfToken, getEcho } from '@/echo';

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
            id?: number | string;
            name?: string;
            email?: string;
            roles?: Array<RoleItem | string>;
        };
    };
};

type TaskAttachment = {
    file_path: string;
};

type Application = {
    id: number | string;
    name: string;
    color?: string | null;
};

type Comment = {
    id: number | string;
    body: string;
    user_id: number | string;
    user_name: string;
    created_at: string;
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
    assignees?: number[] | string[];
    assignees_name?: string | null;
    deadline?: string | null;
    estimation_start?: string | null;
    estimation_end?: string | null;
    actual_start?: string | null;
    actual_end?: string | null;
    attachment?: string;
    attachments?: TaskAttachment[];
    created_by?: number | string;
    review_note?: string | null;
    work_type?: 'pengerjaan' | 'penambahan_fitur' | 'maintenance' | null;
    application_id?: number | string | null;
    application?: Application | null;
    comments?: Comment[];
};

type TaskModalProps = {
    task: Task | null;
    onClose: () => void;
    users?: User[];
    currentUserId?: number | null;
    initialOpenChat?: boolean;
};

type UpdatePayload = {
    status: string;
    estimation_start: string | null;
    estimation_end: string | null;
    assignees: string[];
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
    '[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-white',
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

function resolveAssignees(task: Task | null): string[] {
    if (task?.assignees && Array.isArray(task.assignees)) {
        return task.assignees.map(String);
    }
    return [];
}

function buildUpdatePayload(task: Task | null): UpdatePayload {
    return {
        status: task?.status || 'request',
        estimation_start: normalizeDateInput(task?.estimation_start),
        estimation_end: normalizeDateInput(task?.estimation_end),
        assignees: resolveAssignees(task),
    };
}

// In-memory cache komentar per tiket agar riwayat chat tidak flicker/hilang saat modal ditutup & dibuka lagi tanpa reload
export const ticketCommentsCache = new Map<number, Comment[]>();

function getInitialComments(currentTask: Task | null): Comment[] {
    if (!currentTask?.id) return [];
    const cached = ticketCommentsCache.get(currentTask.id);
    const propComments = currentTask.comments ?? [];
    if (cached && cached.length >= propComments.length) {
        return cached;
    }
    return propComments;
}

export default function TaskModal({ task, onClose, users = [], currentUserId = null, initialOpenChat = false }: TaskModalProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [expandedDesc, setExpandedDesc] = useState(false);
    const [commentBody, setCommentBody] = useState('');
    const [commentProcessing, setCommentProcessing] = useState(false);
    const [isDiscussionOpen, setIsDiscussionOpen] = useState(() => {
        if (initialOpenChat) return true;
        const initial = getInitialComments(task);
        return initial.length > 0;
    });
    const [liveComments, setLiveComments] = useState<Comment[]>(() => getInitialComments(task));
    const commentsEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const sortedComments = useMemo(() => {
        return [...liveComments];
    }, [liveComments]);

    const { auth } = usePage<PageProps>().props;
    const userRoles = (auth?.user?.roles ?? []).map((role) => (typeof role === 'string' ? role.toLowerCase() : role.name.toLowerCase()));
    const isAdmin = userRoles.includes('admin');
    const effectiveUserId = currentUserId ?? auth?.user?.id;

    // Catat ID tiket yang sedang aktif dibuka di layar
    useEffect(() => {
        if (typeof window !== 'undefined' && task?.id) {
            (window as any).__ACTIVE_OPEN_TICKET_ID__ = task.id;
        }
        return () => {
            if (typeof window !== 'undefined') {
                (window as any).__ACTIVE_OPEN_TICKET_ID__ = null;
            }
        };
    }, [task?.id]);

    useEffect(() => {
        if (task?.id) {
            const initial = getInitialComments(task);
            setLiveComments(initial);
            ticketCommentsCache.set(task.id, initial);
            // Otomatis terbuka jika tiket memiliki riwayat chat (>0) atau dibuka lewat notifikasi
            // Default tertutup jika tiket belum memiliki chat sama sekali (=== 0)
            const shouldOpen = initialOpenChat || initial.length > 0;
            setIsDiscussionOpen(shouldOpen);
        } else {
            setLiveComments([]);
            setIsDiscussionOpen(false);
        }
        setExpandedDesc(false);
        setCommentBody('');
    }, [task?.id, initialOpenChat]);

    // Otomatis scroll ke pesan paling bawah setiap kali ada pesan baru atau diskusi dibuka
    useEffect(() => {
        if (!isDiscussionOpen || sortedComments.length === 0) return;

        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }

        const timer = setTimeout(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTo({
                    top: chatContainerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [sortedComments.length, isDiscussionOpen]);

    // Tandai notifikasi tiket ini telah dibaca saat dibuka atau saat pesan baru masuk
    useEffect(() => {
        if (!task?.id) return;
        fetch(`/notifications/ticket/${task.id}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': getCsrfToken(),
            },
        }).then(() => {
            window.dispatchEvent(
                new CustomEvent('ticket-notifications-cleared', {
                    detail: { ticketId: task.id },
                }),
            );
        }).catch(() => {});
    }, [task?.id, sortedComments.length]);

    // Tutup modal dengan tombol Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Sinkronkan liveComments jika task.comments berubah dari props (Inertia reload)
    useEffect(() => {
        if (!task?.id || !task?.comments) return;
        setLiveComments((prev) => {
            // Jangan timpa jika data di cache/state lebih banyak dari prop yang mungkin stale
            if (task.comments && task.comments.length < prev.length) {
                return prev;
            }
            const pendingOptimistic = prev.filter(
                (c) => typeof c.id === 'number' && c.id > 1000000000000 && !task.comments!.some((bc) => bc.body === c.body && String(bc.user_id) === String(c.user_id)),
            );
            const merged = [...(task.comments ?? []), ...pendingOptimistic];
            ticketCommentsCache.set(task.id, merged);
            return merged;
        });
    }, [task?.id, task?.comments]);

    // Polling fallback sinkronisasi komentar (langsung 0ms saat mount + interval)
    useEffect(() => {
        if (!task?.id) return;

        const pollComments = async () => {
            try {
                const res = await fetch(`/requests/${task.id}/comments`, {
                    headers: { Accept: 'application/json' },
                });
                if (res.ok) {
                    const json = await res.json();
                    if (Array.isArray(json.comments)) {
                        setLiveComments((prev) => {
                            const currentIds = prev.map((c) => c.id).join(',');
                            const newIds = json.comments.map((c: Comment) => c.id).join(',');
                            if (currentIds === newIds) return prev;

                            const pendingOptimistic = prev.filter(
                                (c) => typeof c.id === 'number' && c.id > 1000000000000 && !json.comments.some((bc: Comment) => bc.body === c.body && String(bc.user_id) === String(c.user_id)),
                            );
                            const updated = [...json.comments, ...pendingOptimistic];
                            ticketCommentsCache.set(task.id, updated);
                            return updated;
                        });
                    }
                }
            } catch {
                // Ignore error
            }
        };

        // Panggil langsung seketika saat modal dibuka (0ms delay) agar chat termutakhir langsung muncul
        pollComments();

        let interval: any = null;
        if (isDiscussionOpen) {
            interval = setInterval(pollComments, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [task?.id, isDiscussionOpen]);

    // Live update komentar via Laravel Reverb
    useEffect(() => {
        if (!task?.id) return;
        const echo = getEcho();
        if (!echo) return;

        const channel = echo.private(`tickets.${task.id}`);

        channel.listen('.comment.posted', (e: any) => {
            if (e.comment) {
                setLiveComments((prev) => {
                    if (prev.some((c) => c.id === e.comment.id)) return prev;
                    // Bersihkan komentar optimistik jika e.comment adalah hasil simpan pesan tersebut
                    const filtered = prev.filter(
                        (c) => !(typeof c.id === 'number' && c.id > 1000000000000 && c.body === e.comment.body && String(c.user_id) === String(e.comment.user_id)),
                    );
                    const updated = [...filtered, e.comment];
                    ticketCommentsCache.set(task.id, updated);
                    return updated;
                });
                if (isDiscussionOpen) {
                    setTimeout(() => {
                        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            }
        });

        return () => {
            channel.stopListening('.comment.posted');
        };
    }, [task?.id, isDiscussionOpen]);

    const toggleDiscussion = (openState: boolean) => {
        setIsDiscussionOpen(openState);
        if (openState) {
            setTimeout(() => {
                commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 150);
        }
    };

    const taskAssignees = useMemo(() => resolveAssignees(task), [task]);
    const isAssignedToCurrentUser = currentUserId != null && taskAssignees.includes(String(currentUserId));
    const canClaimTask = Boolean(
        task &&
        !isAdmin &&
        (userRoles.includes('technician') || userRoles.includes('technician-intern')) &&
        ['request', 'todo', 'in_progress'].includes(task.status) &&
        !taskAssignees.includes(String(currentUserId)),
    );
    const canUpdateTask = isAdmin || isAssignedToCurrentUser;

    const initialPayload = useMemo(() => buildUpdatePayload(task), [task]);

    const { data, setData, patch, processing, transform } = useForm<UpdatePayload>(initialPayload);

    useEffect(() => {
        setData(initialPayload);
    }, [initialPayload, setData]);

    const range = useMemo<DateRange>(
        () => ({
            from: parseDate(data.estimation_start),
            to: parseDate(data.estimation_end),
        }),
        [data.estimation_start, data.estimation_end],
    );

    const selectedAssignees = useMemo(() => {
        return data.assignees || [];
    }, [data.assignees]);

    const attachments = task?.attachments || [];

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!task) return;

        // Data sudah sesuai, array of strings

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

        transform((current) => {
            const currentAssignees = current.assignees || [];
            return {
                ...current,
                assignees: [...currentAssignees, String(currentUserId)],
            };
        });

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

    const submitComment = () => {
        if (!task || !commentBody.trim() || commentProcessing) return;
        const text = commentBody.trim();
        setCommentBody('');
        setCommentProcessing(true);

        const tempId = Date.now();
        const optimisticComment: Comment = {
            id: tempId,
            body: text,
            user_id: effectiveUserId ?? 0,
            user_name: auth?.user?.name || 'Saya',
            created_at: 'Baru saja',
        };

        // Langsung tampilkan pesan di chat seketika (0ms delay)
        setLiveComments((prev) => {
            const next = [...prev, optimisticComment];
            ticketCommentsCache.set(task.id, next);
            return next;
        });

        setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 30);

        router.post(
            `/requests/${task.id}/comments`,
            { body: text },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setCommentProcessing(false);
                    setTimeout(() => {
                        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                },
                onError: () => {
                    // Batalkan jika gagal
                    setLiveComments((prev) => {
                        const next = prev.filter((c) => c.id !== tempId);
                        ticketCommentsCache.set(task.id, next);
                        return next;
                    });
                    setCommentBody(text);
                    toast.error('Gagal mengirim komentar');
                    setCommentProcessing(false);
                },
            },
        );
    };

    const deleteComment = (commentId: number | string) => {
        if (!task) return;
        // Langsung hilangkan dari UI seketika
        setLiveComments((prev) => {
            const next = prev.filter((c) => c.id !== commentId);
            ticketCommentsCache.set(task.id, next);
            return next;
        });
        router.delete(`/requests/${task.id}/comments/${commentId}`, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                toast.error('Gagal hapus komentar');
                if (task?.comments) {
                    setLiveComments(task.comments);
                    ticketCommentsCache.set(task.id, task.comments);
                }
            },
        });
    };

    if (!task) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5 backdrop-blur-xs"
                onClick={onClose}
            >
                <div
                    className={cn(
                        "flex h-[90vh] max-h-220 w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800",
                        isDiscussionOpen ? "max-w-5xl xl:max-w-6xl" : "max-w-3xl"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Top Progress Indicator */}
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 shrink-0">
                        <div className="h-1.5 bg-primary transition-all duration-500" style={{ width: `${progressMap[task.status] || 0}%` }} />
                    </div>

                    {/* Modal Top Header */}
                    <div className="flex items-center justify-between border-b px-6 py-4 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
                        <div className="min-w-0 pr-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-zinc-900 truncate dark:text-zinc-100" title={task.title}>
                                    {task.title}
                                </h2>
                                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-primary dark:bg-blue-950/60 dark:text-blue-300 shrink-0">
                                    Progres: {progressMap[task.status] || 0}%
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-primary dark:bg-blue-900/40 dark:text-blue-300">
                                    {STATUS_OPTIONS.find((item) => item.value === task.status)?.label ?? task.status}
                                </span>
                                {task.work_type && (
                                    <span className={cn(
                                        'inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium border',
                                        task.work_type === 'pengerjaan' && 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40',
                                        task.work_type === 'penambahan_fitur' && 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/40',
                                        task.work_type === 'maintenance' && 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40',
                                    )}>
                                        {task.work_type === 'pengerjaan' && <Wrench className="h-3.5 w-3.5" />}
                                        {task.work_type === 'penambahan_fitur' && <Sparkles className="h-3.5 w-3.5" />}
                                        {task.work_type === 'maintenance' && <Hammer className="h-3.5 w-3.5" />}
                                        <span>
                                            {task.work_type === 'pengerjaan' && 'Pengerjaan'}
                                            {task.work_type === 'penambahan_fitur' && 'Penambahan Fitur'}
                                            {task.work_type === 'maintenance' && 'Maintenance'}
                                        </span>
                                    </span>
                                )}
                                {task.application && (
                                    <span
                                        className="rounded px-2 py-1 text-xs font-semibold text-white"
                                        style={{ backgroundColor: task.application.color ?? '#6B7280' }}
                                    >
                                        {task.application.name}
                                    </span>
                                )}
                                {userRoles.includes('technician') && task.target_role === 'technician-intern' && (
                                    <span className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                        Untuk Intern
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {!isDiscussionOpen && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleDiscussion(true)}
                                    className="flex items-center gap-1.5 rounded-full border-blue-200 bg-blue-50/60 text-xs font-semibold text-primary hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300"
                                >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    <span>Diskusi ({sortedComments.length})</span>
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="shrink-0 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                title="Tutup (Esc)"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* 2-Column Split Body */}
                    <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-zinc-800">
                        {/* Kolom Kiri: Detail Tiket & Form */}
                        <div className="flex-1 space-y-6 overflow-y-auto p-6">
                        <div className="overflow-hidden rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-zinc-800 dark:text-zinc-200">
                            <p className={cn('leading-relaxed whitespace-pre-wrap', !expandedDesc && 'line-clamp-3')}>
                                {task.description || 'Tidak ada deskripsi'}
                            </p>

                            {task.description && task.description.length > 120 && (
                                <button
                                    type="button"
                                    onClick={() => setExpandedDesc((state) => !state)}
                                    className="mt-2 text-xs text-primary hover:underline dark:text-blue-400"
                                >
                                    {expandedDesc ? 'Tutup' : 'Selengkapnya'}
                                </button>
                            )}
                        </div>

                        {/* Catatan Revisi (muncul jika ada) */}
                        {task.review_note && (
                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
                                <p className="mb-1 text-xs font-semibold text-orange-600 dark:text-orange-400">📝 Catatan Revisi</p>
                                <p className="text-sm whitespace-pre-wrap text-orange-800 dark:text-orange-300">{task.review_note}</p>
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
                                                className="flex items-center gap-2 rounded-md border p-3 text-sm text-primary hover:bg-blue-50 dark:border-zinc-700 dark:text-blue-400 dark:hover:bg-zinc-800"
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
                                <div className="w-full min-w-0">
                                    <p className="mb-1 text-xs text-gray-500 dark:text-zinc-400">Programmer</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="max-w-full truncate font-medium text-zinc-900 dark:text-zinc-100">
                                                {task.assignees_name || 'Belum ditugaskan'}
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs text-center whitespace-normal">
                                            {task.assignees_name || 'Belum ditugaskan'}
                                        </TooltipContent>
                                    </Tooltip>
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
                                    <p className="font-medium text-zinc-900 capitalize dark:text-zinc-100">{task.urgency || '-'}</p>
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
                                            className="truncate text-sm font-medium text-primary hover:underline dark:text-blue-400"
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
                                                className={cn(
                                                    'w-full justify-start border-amber-200 bg-white text-left font-normal dark:bg-zinc-900',
                                                    !range.from && 'text-muted-foreground',
                                                )}
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
                                            <Label>Pilih Programmer</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        type="button"
                                                        className="w-full justify-between bg-white font-normal dark:bg-zinc-900"
                                                    >
                                                        {selectedAssignees.length > 0
                                                            ? users
                                                                  .filter((u) => selectedAssignees.includes(String(u.id)))
                                                                  .map((u) => u.name)
                                                                  .join(', ')
                                                            : 'Belum ditugaskan'}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-75 p-2" align="start">
                                                    <div className="flex max-h-50 flex-col space-y-2 overflow-y-auto">
                                                        {users.map((user) => (
                                                            <label
                                                                key={user.id}
                                                                className="flex cursor-pointer items-center space-x-2 rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                            >
                                                                <Checkbox
                                                                    checked={selectedAssignees.includes(String(user.id))}
                                                                    onCheckedChange={(checked) => {
                                                                        const id = String(user.id);
                                                                        if (checked) {
                                                                            setData('assignees', [...selectedAssignees, id]);
                                                                        } else {
                                                                            setData(
                                                                                'assignees',
                                                                                selectedAssignees.filter((uId) => uId !== id),
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-sm">{user.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
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

                        {!isDiscussionOpen && (
                            <div
                                onClick={() => toggleDiscussion(true)}
                                className="group flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-4 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-primary transition-transform group-hover:scale-105 dark:bg-blue-900/50 dark:text-blue-300">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            Diskusi & Catatan Tiket
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-primary dark:bg-blue-950 dark:text-blue-300">
                                                {sortedComments.length} pesan
                                            </span>
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Buka obrolan tim untuk berdiskusi atau meninggalkan catatan teknis
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs font-semibold text-primary transition-transform group-hover:translate-x-0.5"
                                >
                                    Buka Diskusi →
                                </Button>
                            </div>
                        )}
                        </div>

                        {/* Kolom Kanan: Live Diskusi Chat (~42%) */}
                        {isDiscussionOpen && (
                            <div className="flex w-full md:w-95 lg:w-105 xl:w-115 flex-col bg-gray-50/50 dark:bg-zinc-900/50 shrink-0 min-h-0 border-t md:border-t-0 md:border-l border-gray-200 dark:border-zinc-800 animate-in fade-in duration-200">
                                {/* Header Diskusi */}
                                <div className="flex items-center justify-between border-b px-4 py-3 bg-white dark:bg-zinc-900 dark:border-zinc-800 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Diskusi</span>
                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-blue-950 dark:text-blue-300">
                                            {sortedComments.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="hidden text-xs text-muted-foreground sm:inline">Obrolan tim</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-full text-gray-400 hover:bg-zinc-100 hover:text-gray-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                                            onClick={() => toggleDiscussion(false)}
                                            title="Tutup Diskusi"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* List komentar - Chat Bubble */}
                                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {sortedComments.length > 0 ? (
                                        <>
                                            {sortedComments.map((comment) => {
                                                const isMe = effectiveUserId != null && String(comment.user_id) === String(effectiveUserId);

                                                if (isMe) {
                                                    return (
                                                        <div key={comment.id} className="group flex justify-end gap-2.5">
                                                            <div className="flex max-w-[85%] flex-col items-end">
                                                                <div className="mb-1 flex items-center gap-1.5 text-xs">
                                                                    {(isMe || isAdmin) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => deleteComment(comment.id)}
                                                                            className="mr-1 text-gray-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-400"
                                                                            title="Hapus komentar"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                                                        {comment.created_at}
                                                                    </span>
                                                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                                        Saya
                                                                    </span>
                                                                </div>
                                                                <div className="rounded-2xl rounded-tr-xs bg-primary px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-white shadow-xs">
                                                                    {comment.body}
                                                                </div>
                                                            </div>
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-xs">
                                                                SY
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={comment.id} className="group flex justify-start gap-2.5">
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-white shadow-xs">
                                                            {comment.user_name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex max-w-[85%] flex-col items-start">
                                                            <div className="mb-1 flex items-center gap-1.5 text-xs">
                                                                <span className="font-semibold text-gray-800 dark:text-zinc-200">
                                                                    {comment.user_name}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                                                                    {comment.created_at}
                                                                </span>
                                                                {isAdmin && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteComment(comment.id)}
                                                                        className="ml-1 text-gray-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 dark:hover:text-red-400"
                                                                        title="Hapus komentar"
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="rounded-2xl rounded-tl-xs border border-gray-200/80 bg-gray-100 px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-gray-800 shadow-xs dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-200">
                                                                {comment.body}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={commentsEndRef} />
                                        </>
                                    ) : (
                                        <div className="flex h-full min-h-50 flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-zinc-500">
                                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800">
                                                <MessageSquare className="h-5 w-5 text-gray-400 dark:text-zinc-500" />
                                            </div>
                                            <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400">Belum ada diskusi</p>
                                            <p className="mt-1 max-w-50 text-[11px] text-gray-400 dark:text-zinc-500">
                                                Mulai percakapan atau tinggalkan catatan teknis tiket di bawah.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Form komentar baru (Sticky di bawah kolom kanan) */}
                                <div className="border-t bg-white p-3 dark:bg-zinc-900 dark:border-zinc-800 shrink-0">
                                    <div className="flex gap-2">
                                        <Textarea
                                            placeholder="Tulis komentar atau diskusi..."
                                            className="min-h-16 flex-1 resize-none text-sm"
                                            value={commentBody}
                                            onChange={(e) => setCommentBody(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    submitComment();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            disabled={commentProcessing || !commentBody.trim()}
                                            onClick={submitComment}
                                            className="self-end"
                                            title="Kirim (Enter)"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-600">Tekan Enter untuk kirim, Shift+Enter untuk baris baru</p>
                                </div>
                            </div>
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
