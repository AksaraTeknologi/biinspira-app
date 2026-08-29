'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Editor } from '@tinymce/tinymce-react';
import { format } from 'date-fns';
import { CalendarIcon, Copy, ExternalLink, Lock, Plus, Trash2, User } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

interface Schedule {
    id?: string;
    schedule_type: 'main' | 'socialization';
    title: string;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
}

interface GroupLinkUser {
    id: string;
    name: string;
    email?: string;
    avatar?: string | null;
}

interface GroupLink {
    id?: string;
    program_event_id?: string;
    user_id?: string;
    url: string;
    user?: GroupLinkUser | null;
}

interface ProgramEvent {
    id: string;
    type: string;
    title: string;
    slug: string;
    batch: string | null;
    mentor: string | null;
    description: string | null;
    short_description: string | null;
    benefits: string | null;
    requirements: string | null;
    curriculum: string | null;
    terms_conditions: string | null;
    start_time: string | null;
    end_time: string | null;
    start_date: string | null;
    end_date: string | null;
    registration_deadline: string | null;
    socialization_registration_deadline: string | null;
    price: number;
    strikethrough_price: number;
    scholarship_price: number;
    quota: number;
    group_links?: GroupLink[];
    certif_type: string | null;
    schedules: Schedule[];
}

// ── Helper: Rupiah formatting ──
const formatRupiah = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) return '';
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
const toPlainNumber = (value: string) => value.replace(/\./g, '');
const numberToRupiah = (value: number) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

function toInputTime(val: string | null): string {
    if (!val) return '';
    return val.substring(0, 5);
}

// ── Calendar shared style ──
const calendarCls = cn(
    'rounded-xl p-2 text-sm',
    '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
    '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
    '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
    '[&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-white',
    '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
);

// ── Sub-component: DatePickerField ──
function DatePickerField({
    label,
    value,
    onChange,
    withTime = false,
    required = false,
    errorMsg,
}: {
    label: string;
    value: Date | undefined;
    onChange: (d: Date | undefined) => void;
    withTime?: boolean;
    required?: boolean;
    errorMsg?: string;
}) {
    const [timeStr, setTimeStr] = React.useState(
        value ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}` : '',
    );

    const handleDaySelect = (d: Date | undefined) => {
        if (!d) {
            onChange(undefined);
            return;
        }
        if (withTime && timeStr) {
            const [h, m] = timeStr.split(':').map(Number);
            d.setHours(h ?? 0, m ?? 0, 0, 0);
        }
        onChange(d);
    };

    const handleTimeChange = (t: string) => {
        setTimeStr(t);
        if (value) {
            const [h, m] = t.split(':').map(Number);
            const newDate = new Date(value);
            newDate.setHours(h ?? 0, m ?? 0, 0, 0);
            onChange(newDate);
        }
    };

    return (
        <div className="space-y-1.5">
            <Label>
                {label}
                {required ? ' *' : ''}
            </Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className={cn('h-10 w-full justify-start border-input bg-input text-left font-normal', !value && 'text-muted-foreground')}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {value ? withTime ? format(value, 'dd MMM yyyy, HH:mm') : format(value, 'dd MMM yyyy') : <span>Pilih tanggal...</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg" align="start">
                    <Calendar mode="single" selected={value} onSelect={handleDaySelect} initialFocus className={calendarCls} />
                    {withTime && (
                        <div className="mt-2 border-t pt-3">
                            <Label className="text-xs text-muted-foreground">Jam</Label>
                            <input
                                type="time"
                                value={timeStr}
                                onChange={(e) => handleTimeChange(e.target.value)}
                                className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
                            />
                        </div>
                    )}
                </PopoverContent>
            </Popover>
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
        </div>
    );
}

const getDayFromDate = (dateStr: string): string => {
    if (!dateStr) return 'senin';
    const date = new Date(dateStr + 'T00:00:00');
    const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const jsToIndoMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    return jsToIndoMap[dayIndex] || 'senin';
};

// ── Sub-component: ScheduleSection ──
function ScheduleSection({
    label,
    scheduleType,
    schedules,
    onAdd,
    onRemove,
    onUpdate,
    programType,
}: {
    label: string;
    scheduleType: 'main' | 'socialization';
    schedules: Schedule[];
    onAdd: () => void;
    onRemove: (idx: number) => void;
    onUpdate: (idx: number, field: keyof Schedule, value: string) => void;
    programType: string;
}) {
    const filtered = schedules.map((s, i) => ({ s, i })).filter(({ s }) => s.schedule_type === scheduleType);
    const isBootcamp = programType === 'bootcamp';

    return (
        <div className="mt-4 border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">{label}</p>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onAdd}>
                    <Plus className="size-3.5" /> Tambah
                </Button>
            </div>
            <div className="space-y-3">
                {filtered.map(({ s, i }) => (
                    <div key={i} className="relative rounded-md border bg-muted/40 p-4">
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </button>
                        <div className={cn('grid gap-3', isBootcamp ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3')}>
                            {!isBootcamp && (
                                <div className="space-y-1">
                                    <Label className="text-xs">Judul Sesi</Label>
                                    <Input
                                        value={s.title}
                                        onChange={(e) => onUpdate(i, 'title', e.target.value)}
                                        placeholder="Sesi 1"
                                        className="h-8 bg-input text-sm"
                                    />
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label className="text-xs">Tanggal *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                'h-8 w-full justify-start px-2 text-left text-sm font-normal',
                                                !s.schedule_date && 'text-muted-foreground',
                                            )}
                                        >
                                            <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                                            {s.schedule_date ? format(new Date(s.schedule_date + 'T00:00'), 'dd MMM yyyy') : 'Pilih'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={s.schedule_date ? new Date(s.schedule_date + 'T00:00') : undefined}
                                            onSelect={(d) => {
                                                const dateStr = d ? format(d, 'yyyy-MM-dd') : '';
                                                onUpdate(i, 'schedule_date', dateStr);
                                                if (dateStr) {
                                                    onUpdate(i, 'day', getDayFromDate(dateStr));
                                                }
                                            }}
                                            initialFocus
                                            className={calendarCls}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Hari *</Label>
                                <Select value={s.day} onValueChange={(v) => onUpdate(i, 'day', v)} disabled>
                                    <SelectTrigger className="h-8 bg-input text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map((d) => (
                                            <SelectItem key={d} value={d}>
                                                {d.charAt(0).toUpperCase() + d.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Jam Mulai *</Label>
                                <Input
                                    type="time"
                                    value={s.start_time}
                                    onChange={(e) => onUpdate(i, 'start_time', e.target.value)}
                                    className="h-8 bg-input text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Jam Selesai *</Label>
                                <Input
                                    type="time"
                                    value={s.end_time}
                                    onChange={(e) => onUpdate(i, 'end_time', e.target.value)}
                                    className="h-8 bg-input text-sm"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <p className="py-3 text-center text-sm text-muted-foreground">Belum ada jadwal. Klik "Tambah" untuk menambahkan.</p>
                )}
            </div>
        </div>
    );
}

// ── Helper: parse date string to Date ──
function parseDate(val: string | null): Date | undefined {
    if (!val) return undefined;
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
}

export default function ProgramEventEdit() {
    const { program } = usePage<{ program: ProgramEvent }>().props;
    const { auth } = usePage<any>().props;
    const role = auth.role[0] || 'user';
    const isAdmin = role === 'admin';
    const prefix = isAdmin ? 'admin' : 'user';

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [type, setType] = React.useState(program.type);
    const [schedules, setSchedules] = React.useState<Schedule[]>(
        program.schedules.map((s) => ({
            ...s,
            start_time: toInputTime(s.start_time),
            end_time: toInputTime(s.end_time),
            schedule_date: s.schedule_date,
        })),
    );
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [certifType, setCertifType] = React.useState(program.certif_type || 'regular');

    // Date states initialized from program data
    const [startDate, setStartDate] = React.useState<Date | undefined>(parseDate(program.start_time ?? program.start_date));
    const [endDate, setEndDate] = React.useState<Date | undefined>(parseDate(program.end_time ?? program.end_date));
    const [regDeadline, setRegDeadline] = React.useState<Date | undefined>(parseDate(program.registration_deadline));
    const [socDeadline, setSocDeadline] = React.useState<Date | undefined>(parseDate(program.socialization_registration_deadline));

    // TinyMCE states
    const [benefits, setBenefits] = React.useState(program.benefits || '');
    const [requirements, setRequirements] = React.useState(program.requirements || '');
    const [curriculum, setCurriculum] = React.useState(program.curriculum || '');
    const [termsConditions, setTermsConditions] = React.useState(program.terms_conditions || '');

    // Currency display states
    const [priceDisplay, setPriceDisplay] = React.useState(numberToRupiah(program.price));
    const [strikeDisplay, setStrikeDisplay] = React.useState(numberToRupiah(program.strikethrough_price));
    const [scholarDisplay, setScholarDisplay] = React.useState(numberToRupiah(program.scholarship_price));

    // Multi group links state
    const currentUserId = auth?.user?.id;
    const [groupLinks, setGroupLinks] = React.useState<GroupLink[]>(() => {
        if (program.group_links && program.group_links.length > 0) {
            return program.group_links;
        }
        return [];
    });

    const addGroupLink = () => {
        setGroupLinks((prev) => [
            ...prev,
            {
                url: '',
                user_id: currentUserId,
                user: auth?.user,
            },
        ]);
    };

    const updateGroupLink = (index: number, url: string) => {
        setGroupLinks((prev) =>
            prev.map((item, i) => {
                if (i === index) {
                    return { ...item, url };
                }
                return item;
            }),
        );
    };

    const removeGroupLink = (index: number) => {
        setGroupLinks((prev) => prev.filter((_, i) => i !== index));
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Program Event', href: route(`${prefix}.program-events.index`) },
        { title: 'Edit Program', href: '' },
    ];

    const addSchedule = (scheduleType: 'main' | 'socialization' = 'main') => {
        setSchedules((prev) => [...prev, { schedule_type: scheduleType, title: '', schedule_date: '', day: 'senin', start_time: '', end_time: '' }]);
    };

    const removeSchedule = (index: number) => {
        setSchedules((prev) => prev.filter((_, i) => i !== index));
    };

    const updateSchedule = (index: number, field: keyof Schedule, value: string) => {
        setSchedules((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const formData = new FormData(e.currentTarget);
        const data: Record<string, unknown> = Object.fromEntries(formData.entries());
        data.type = type;
        data._method = 'PUT';

        // Override date fields from controlled state
        if (type === 'webinar') {
            if (startDate) data.start_time = format(startDate, "yyyy-MM-dd'T'HH:mm");
            if (endDate) data.end_time = format(endDate, "yyyy-MM-dd'T'HH:mm");
            if (regDeadline) data.registration_deadline = format(regDeadline, "yyyy-MM-dd'T'HH:mm");
        } else {
            if (startDate) data.start_date = format(startDate, 'yyyy-MM-dd');
            if (endDate) data.end_date = format(endDate, 'yyyy-MM-dd');
            if (regDeadline) data.registration_deadline = format(regDeadline, "yyyy-MM-dd'T'HH:mm");
            if (type === 'certification_program' && certifType === 'scholarship' && socDeadline) {
                data.socialization_registration_deadline = format(socDeadline, "yyyy-MM-dd'T'HH:mm");
            }
        }

        // Override rich-text fields from controlled state
        data.benefits = benefits;
        if (type === 'bootcamp') {
            data.requirements = requirements;
            data.curriculum = curriculum;
        } else {
            data.requirements = null;
            data.curriculum = null;
        }

        if (type === 'certification_program') {
            data.terms_conditions = termsConditions;
        } else {
            data.terms_conditions = null;
        }

        // Normalize price fields
        data.price = toPlainNumber(priceDisplay) || '0';
        data.strikethrough_price = toPlainNumber(strikeDisplay) || '0';
        if (type === 'certification_program') {
            data.certif_type = certifType;
            data.scholarship_price = certifType === 'scholarship' ? toPlainNumber(scholarDisplay) || '0' : '0';
        } else {
            data.certif_type = null;
            data.scholarship_price = '0';
        }

        // Filter schedules based on type/certifType
        if (type === 'certification_program' && certifType === 'regular') {
            data.schedules = schedules.filter((s) => s.schedule_type === 'main');
        } else {
            data.schedules = schedules;
        }

        // Multi group links
        const validGroupLinks = groupLinks.filter((g) => g.url && g.url.trim() !== '');
        data.group_links = validGroupLinks.map((g) => ({
            id: g.id,
            url: g.url,
        }));

        router.post(route(`${prefix}.program-events.update`, program.id), data as Record<string, string>, {
            onError: (errs) => {
                setErrors(errs);
                setIsSubmitting(false);
                toast.error('Terdapat kesalahan pada form.');
            },
            onSuccess: () => {
                setIsSubmitting(false);
                toast.success('Program Event berhasil diperbarui!');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${program.title}`} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Edit Program Event</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Perbarui data program. Perubahan akan tercermin di API yang dikonsumsi platform lain.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ── Informasi Dasar ── */}
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-semibold">Informasi Dasar</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Tipe Program *</Label>
                                <Select
                                    name="type"
                                    value={type}
                                    onValueChange={(v) => {
                                        setType(v);
                                        setSchedules([]);
                                        setStartDate(undefined);
                                        setEndDate(undefined);
                                        setCertifType('regular');
                                    }}
                                >
                                    <SelectTrigger className="bg-input">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="webinar">Webinar</SelectItem>
                                        <SelectItem value="bootcamp">Bootcamp</SelectItem>
                                        <SelectItem value="certification_program">Certification Program</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {type === 'certification_program' && (
                                <div className="space-y-1.5">
                                    <Label>Tipe Sertifikasi *</Label>
                                    <Select name="certif_type" value={certifType} onValueChange={setCertifType}>
                                        <SelectTrigger className="bg-input">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="regular">Regular</SelectItem>
                                            <SelectItem value="scholarship">Beasiswa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Judul *</Label>
                                <Input name="title" defaultValue={program.title} className="bg-input" />
                                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Batch / Angkatan *</Label>
                                <Input name="batch" defaultValue={program.batch ?? ''} className="bg-input" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Mentor / Pemateri (Opsional)</Label>
                                <Input name="mentor" defaultValue={program.mentor ?? ''} placeholder="contoh: Muhammad Alif Zaidan, S.Kom., CFTR." className="bg-input" />
                                {errors.mentor && <p className="text-xs text-destructive">{errors.mentor}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ── Deskripsi ── */}
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-semibold">Deskripsi</h3>
                        <div className="space-y-4">
                            {type === 'certification_program' && (
                                <div className="space-y-1.5">
                                    <Label>Deskripsi Singkat</Label>
                                    <Textarea name="short_description" rows={2} defaultValue={program.short_description ?? ''} />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Deskripsi Lengkap</Label>
                                <Textarea name="description" rows={4} defaultValue={program.description ?? ''} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Manfaat</Label>
                                <Editor
                                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                    value={benefits}
                                    onEditorChange={(content) => setBenefits(content)}
                                    init={{
                                        plugins: [
                                            'anchor',
                                            'autolink',
                                            'charmap',
                                            'codesample',
                                            'emoticons',
                                            'image',
                                            'link',
                                            'lists',
                                            'media',
                                            'searchreplace',
                                            'table',
                                            'visualblocks',
                                            'wordcount',
                                        ],
                                        onboarding: false,
                                        toolbar:
                                            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                                        height: 250,
                                    }}
                                />
                            </div>
                            {type === 'bootcamp' && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label>Persyaratan</Label>
                                        <Editor
                                            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                            value={requirements}
                                            onEditorChange={(content) => setRequirements(content)}
                                            init={{
                                                plugins: [
                                                    'anchor',
                                                    'autolink',
                                                    'charmap',
                                                    'codesample',
                                                    'emoticons',
                                                    'image',
                                                    'link',
                                                    'lists',
                                                    'media',
                                                    'searchreplace',
                                                    'table',
                                                    'visualblocks',
                                                    'wordcount',
                                                ],
                                                onboarding: false,
                                                toolbar:
                                                    'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                                                height: 250,
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Kurikulum</Label>
                                        <Editor
                                            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                            value={curriculum}
                                            onEditorChange={(content) => setCurriculum(content)}
                                            init={{
                                                plugins: [
                                                    'anchor',
                                                    'autolink',
                                                    'charmap',
                                                    'codesample',
                                                    'emoticons',
                                                    'image',
                                                    'link',
                                                    'lists',
                                                    'media',
                                                    'searchreplace',
                                                    'table',
                                                    'visualblocks',
                                                    'wordcount',
                                                ],
                                                onboarding: false,
                                                toolbar:
                                                    'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                                                height: 250,
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                            {type === 'certification_program' && (
                                <div className="space-y-1.5">
                                    <Label>Syarat & Ketentuan</Label>
                                    <Editor
                                        apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                        value={termsConditions}
                                        onEditorChange={(content) => setTermsConditions(content)}
                                        init={{
                                            plugins: [
                                                'anchor',
                                                'autolink',
                                                'charmap',
                                                'codesample',
                                                'emoticons',
                                                'image',
                                                'link',
                                                'lists',
                                                'media',
                                                'searchreplace',
                                                'table',
                                                'visualblocks',
                                                'wordcount',
                                            ],
                                            onboarding: false,
                                            toolbar:
                                                'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                                            height: 250,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Jadwal ── */}
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-semibold">Jadwal</h3>
                        {type === 'webinar' ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <DatePickerField
                                    label="Tanggal & Jam Mulai"
                                    value={startDate}
                                    onChange={setStartDate}
                                    withTime
                                    required
                                    errorMsg={errors.start_time}
                                />
                                <DatePickerField
                                    label="Tanggal & Jam Selesai"
                                    value={endDate}
                                    onChange={setEndDate}
                                    withTime
                                    required
                                    errorMsg={errors.end_time}
                                />
                                <DatePickerField
                                    label="Deadline Pendaftaran"
                                    value={regDeadline}
                                    onChange={setRegDeadline}
                                    withTime
                                    required
                                    errorMsg={errors.registration_deadline}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <DatePickerField
                                        label="Tanggal Mulai"
                                        value={startDate}
                                        onChange={setStartDate}
                                        required
                                        errorMsg={errors.start_date}
                                    />
                                    <DatePickerField
                                        label="Tanggal Selesai"
                                        value={endDate}
                                        onChange={setEndDate}
                                        required
                                        errorMsg={errors.end_date}
                                    />
                                    <DatePickerField
                                        label="Deadline Pendaftaran"
                                        value={regDeadline}
                                        onChange={setRegDeadline}
                                        withTime
                                        required
                                        errorMsg={errors.registration_deadline}
                                    />
                                    {type === 'certification_program' && certifType === 'scholarship' && (
                                        <DatePickerField label="Deadline Daftar Sosialisasi" value={socDeadline} onChange={setSocDeadline} withTime />
                                    )}
                                </div>
                                <ScheduleSection
                                    label={type === 'certification_program' ? 'Jadwal Sesi Reguler' : 'Jadwal Sesi'}
                                    scheduleType="main"
                                    schedules={schedules}
                                    onAdd={() => addSchedule('main')}
                                    onRemove={removeSchedule}
                                    onUpdate={updateSchedule}
                                    programType={type}
                                />
                                {type === 'certification_program' && certifType === 'scholarship' && (
                                    <ScheduleSection
                                        label="Jadwal Sosialisasi"
                                        scheduleType="socialization"
                                        schedules={schedules}
                                        onAdd={() => addSchedule('socialization')}
                                        onRemove={removeSchedule}
                                        onUpdate={updateSchedule}
                                        programType={type}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Harga & Kuota ── */}
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-semibold">Harga & Kuota</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Harga Normal *</Label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                                    <Input
                                        name="price"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={priceDisplay}
                                        onChange={(e) => setPriceDisplay(formatRupiah(e.target.value))}
                                        className="bg-input pl-9"
                                    />
                                </div>
                                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Harga Coret</Label>
                                <div className="relative">
                                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                                    <Input
                                        name="strikethrough_price"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={strikeDisplay}
                                        onChange={(e) => setStrikeDisplay(formatRupiah(e.target.value))}
                                        className="bg-input pl-9"
                                    />
                                </div>
                            </div>
                            {type === 'certification_program' && certifType === 'scholarship' && (
                                <div className="space-y-1.5">
                                    <Label>Harga Beasiswa</Label>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                                        <Input
                                            name="scholarship_price"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={scholarDisplay}
                                            onChange={(e) => setScholarDisplay(formatRupiah(e.target.value))}
                                            className="bg-input pl-9"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Kuota Peserta</Label>
                                <Input name="quota" type="number" min="0" defaultValue={program.quota ?? 0} className="bg-input" />
                                <span className="block text-[11px] text-muted-foreground">Isi 0 untuk kuota tidak terbatas</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Link Grup ── */}
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="font-semibold">Link Grup (WhatsApp / Telegram / dll.)</h3>
                                <p className="text-xs text-muted-foreground">
                                    Dapat diisi lebih dari 1 link grup. Anda dapat melihat semua link grup dan mengelola link milik akun Anda.
                                </p>
                            </div>
                            <Button type="button" variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto" onClick={addGroupLink}>
                                <Plus className="size-3.5" /> Tambah Link Grup
                            </Button>
                        </div>

                        {groupLinks.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                Belum ada link grup yang ditambahkan. Klik <strong className="text-foreground">"Tambah Link Grup"</strong> jika ingin menyematkan link grup peserta.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {groupLinks.map((link, idx) => {
                                    const isOwner = !link.user_id || link.user_id === currentUserId || isAdmin;
                                    const creatorName = link.user?.name || (link.user_id === currentUserId ? auth?.user?.name : 'Akun Pengguna');
                                    const isSelf = link.user_id === currentUserId || (!link.user_id && !link.id);

                                    return (
                                        <div
                                            key={link.id || idx}
                                            className={cn(
                                                'rounded-lg border p-4 transition-all',
                                                isOwner ? 'bg-card border-border shadow-xs' : 'bg-muted/40 border-muted'
                                            )}
                                        >
                                            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        <User className="size-3.5" />
                                                    </div>
                                                    <span className="text-xs font-semibold text-foreground">
                                                        {creatorName}
                                                    </span>
                                                    {isSelf ? (
                                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                            Milik Anda
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                                            <Lock className="size-2.5" /> Read-Only
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    {link.url && (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(link.url);
                                                                    toast.success('Link berhasil disalin ke clipboard!');
                                                                }}
                                                                title="Salin Link"
                                                            >
                                                                <Copy className="mr-1 size-3" /> Salin
                                                            </Button>
                                                            <a
                                                                href={link.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex h-7 items-center rounded-md px-2 text-xs text-primary hover:underline"
                                                                title="Buka Link di Tab Baru"
                                                            >
                                                                <ExternalLink className="mr-1 size-3" /> Buka
                                                            </a>
                                                        </>
                                                    )}

                                                    {isOwner && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeGroupLink(idx)}
                                                            className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                                            title="Hapus Link"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <Label htmlFor={`edit_group_link_${idx}`} className="text-xs font-medium text-muted-foreground">
                                                    Link URL #{idx + 1}
                                                </Label>
                                                <Input
                                                    id={`edit_group_link_${idx}`}
                                                    type="url"
                                                    value={link.url}
                                                    disabled={!isOwner}
                                                    onChange={(e) => updateGroupLink(idx, e.target.value)}
                                                    placeholder="https://chat.whatsapp.com/... atau https://t.me/..."
                                                    className={cn('bg-input text-sm', !isOwner && 'cursor-not-allowed opacity-80 bg-muted/60')}
                                                />
                                                {!isOwner && (
                                                    <p className="text-[11px] text-muted-foreground italic">
                                                        Link ini diisi oleh {creatorName} dan hanya dapat diubah atau dihapus oleh pemiliknya.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.visit(route(`${prefix}.program-events.index`))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="text-white">
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
