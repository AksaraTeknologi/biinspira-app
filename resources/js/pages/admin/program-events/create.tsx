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
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

interface Schedule {
    schedule_type: 'main' | 'socialization';
    title: string;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
}

const emptySchedule = (): Schedule => ({
    schedule_type: 'main',
    title: '',
    schedule_date: '',
    day: 'senin',
    start_time: '',
    end_time: '',
});

// ── Helper: format rupiah display ──
const formatRupiah = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean) return '';
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
const toPlainNumber = (value: string) => value.replace(/\./g, '');

const calendarCls = cn(
    'rounded-xl p-2 text-sm',
    '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
    '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
    '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
    '[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white',
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
    const [timeStr, setTimeStr] = React.useState('');

    const handleDaySelect = (d: Date | undefined) => {
        if (!d) { onChange(undefined); return; }
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
            <Label>{label}{required ? ' *' : ''}</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className={cn(
                            'h-10 w-full justify-start text-left font-normal bg-input border-input',
                            !value && 'text-muted-foreground',
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {value
                            ? withTime
                                ? format(value, 'dd MMM yyyy, HH:mm')
                                : format(value, 'dd MMM yyyy')
                            : <span>Pilih tanggal...</span>
                        }
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        onSelect={handleDaySelect}
                        initialFocus
                        className={calendarCls}
                    />
                    {withTime && (
                        <div className="border-t pt-3 mt-2">
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

export default function ProgramEventCreate() {
    const { auth, duplicateData } = usePage<any>().props;
    const role = auth.role[0] || 'user';
    const isAdmin = role === 'admin';
    const prefix = isAdmin ? 'admin' : 'user';

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [type, setType] = React.useState(duplicateData?.type ?? 'webinar');
    const [schedules, setSchedules] = React.useState<Schedule[]>(duplicateData?.schedules ?? []);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [certifType, setCertifType] = React.useState(duplicateData?.certif_type ?? 'regular');

    // Date states
    const [startDate, setStartDate] = React.useState<Date | undefined>(
        duplicateData?.start_time ? new Date(duplicateData.start_time) : (duplicateData?.start_date ? new Date(duplicateData.start_date) : undefined)
    );
    const [endDate, setEndDate] = React.useState<Date | undefined>(
        duplicateData?.end_time ? new Date(duplicateData.end_time) : (duplicateData?.end_date ? new Date(duplicateData.end_date) : undefined)
    );
    const [regDeadline, setRegDeadline] = React.useState<Date | undefined>(
        duplicateData?.registration_deadline ? new Date(duplicateData.registration_deadline) : undefined
    );
    const [socDeadline, setSocDeadline] = React.useState<Date | undefined>(
        duplicateData?.socialization_registration_deadline ? new Date(duplicateData.socialization_registration_deadline) : undefined
    );

    // TinyMCE states
    const [benefits, setBenefits] = React.useState(duplicateData?.benefits ?? '');
    const [requirements, setRequirements] = React.useState(duplicateData?.requirements ?? '');
    const [curriculum, setCurriculum] = React.useState(duplicateData?.curriculum ?? '');
    const [termsConditions, setTermsConditions] = React.useState(duplicateData?.terms_conditions ?? '');

    // Currency display states
    const [priceDisplay, setPriceDisplay] = React.useState(duplicateData?.price ? formatRupiah(String(duplicateData.price)) : '');
    const [strikeDisplay, setStrikeDisplay] = React.useState(duplicateData?.strikethrough_price ? formatRupiah(String(duplicateData.strikethrough_price)) : '');
    const [scholarDisplay, setScholarDisplay] = React.useState(duplicateData?.scholarship_price ? formatRupiah(String(duplicateData.scholarship_price)) : '');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Program Event', href: route(`${prefix}.program-events.index`) },
        { title: 'Buat Program Baru', href: '' },
    ];

    const addSchedule = (scheduleType: 'main' | 'socialization' = 'main') => {
        setSchedules((prev) => [...prev, { ...emptySchedule(), schedule_type: scheduleType }]);
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
        // status auto-managed by platform

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

        // Normalize price fields to plain numbers
        data.price = toPlainNumber(priceDisplay) || '0';
        data.strikethrough_price = toPlainNumber(strikeDisplay) || '0';
        if (type === 'certification_program') {
            data.certif_type = certifType;
            data.scholarship_price = certifType === 'scholarship' ? (toPlainNumber(scholarDisplay) || '0') : '0';
        } else {
            data.certif_type = null;
            data.scholarship_price = '0';
        }

        // Filter schedules based on type/certifType
        if (type === 'certification_program' && certifType === 'regular') {
            data.schedules = schedules.filter(s => s.schedule_type === 'main');
        } else {
            data.schedules = schedules;
        }

        router.post(route(`${prefix}.program-events.store`), data as Record<string, string>, {
            onError: (errs) => {
                setErrors(errs);
                setIsSubmitting(false);
                toast.error('Terdapat kesalahan pada form. Periksa kembali data Anda.');
            },
            onSuccess: () => {
                setIsSubmitting(false);
                toast.success('Program Event berhasil dibuat!');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Program Event" />
            <div className="p-4 md:p-6 space-y-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Buat Program Event</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Program yang dibuat di sini dapat diambil oleh platform lain melalui API. Status awal: <strong>Draft</strong>.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ── Informasi Dasar ── */}
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-semibold">Informasi Dasar</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="type">Tipe Program *</Label>
                                <Select name="type" value={type} onValueChange={(v) => { setType(v); setSchedules([]); setStartDate(undefined); setEndDate(undefined); setCertifType('regular'); }}>
                                    <SelectTrigger id="type" className="bg-input">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="webinar">Webinar</SelectItem>
                                        <SelectItem value="bootcamp">Bootcamp</SelectItem>
                                        <SelectItem value="certification_program">Sertifikasi Program</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                            </div>
                            {type === 'certification_program' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="certif_type">Tipe Sertifikasi *</Label>
                                    <Select name="certif_type" value={certifType} onValueChange={setCertifType}>
                                        <SelectTrigger id="certif_type" className="bg-input">
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
                                <Label htmlFor="title">Judul *</Label>
                                <Input id="title" name="title" defaultValue={duplicateData?.title ?? ''} placeholder="Judul program..." className="bg-input" />
                                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="batch">Batch / Angkatan *</Label>
                                <Input id="batch" name="batch" defaultValue={duplicateData?.batch ?? ''} placeholder="contoh: Batch 5" className="bg-input" />
                            </div>
                        </div>
                    </div>

                    {/* ── Deskripsi ── */}
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-semibold">Deskripsi</h3>
                        <div className="space-y-4">
                            {type === 'certification_program' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="short_description">Deskripsi Singkat</Label>
                                    <Textarea id="short_description" name="short_description" rows={2} defaultValue={duplicateData?.short_description ?? ''} placeholder="Deskripsi singkat untuk ditampilkan di card..." />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="description">Deskripsi Lengkap</Label>
                                <Textarea id="description" name="description" rows={4} defaultValue={duplicateData?.description ?? ''} placeholder="Deskripsi lengkap program..." />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="benefits">Manfaat / What You'll Get</Label>
                                <Editor
                                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                    value={benefits}
                                    onEditorChange={(content) => setBenefits(content)}
                                    init={{
                                        plugins: [
                                            'anchor', 'autolink', 'charmap', 'codesample', 'emoticons',
                                            'image', 'link', 'lists', 'media', 'searchreplace',
                                            'table', 'visualblocks', 'wordcount'
                                        ],
                                        onboarding: false,
                                        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                                        height: 250,
                                    }}
                                />
                            </div>
                            {type === 'bootcamp' && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="requirements">Persyaratan</Label>
                                        <Editor
                                            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                            value={requirements}
                                            onEditorChange={(content) => setRequirements(content)}
                                            init={{
                                                plugins: [
                                                    'anchor', 'autolink', 'charmap', 'codesample', 'emoticons',
                                                    'image', 'link', 'lists', 'media', 'searchreplace',
                                                    'table', 'visualblocks', 'wordcount'
                                                ],
                                                onboarding: false,
                                                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                                                height: 250,
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="curriculum">Kurikulum</Label>
                                        <Editor
                                            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                            value={curriculum}
                                            onEditorChange={(content) => setCurriculum(content)}
                                            init={{
                                                plugins: [
                                                    'anchor', 'autolink', 'charmap', 'codesample', 'emoticons',
                                                    'image', 'link', 'lists', 'media', 'searchreplace',
                                                    'table', 'visualblocks', 'wordcount'
                                                ],
                                                onboarding: false,
                                                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
                                                height: 250,
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                            {type === 'certification_program' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="terms_conditions">Syarat & Ketentuan</Label>
                                    <Editor
                                        apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                        value={termsConditions}
                                        onEditorChange={(content) => setTermsConditions(content)}
                                        init={{
                                            plugins: [
                                                'anchor', 'autolink', 'charmap', 'codesample', 'emoticons',
                                                'image', 'link', 'lists', 'media', 'searchreplace',
                                                'table', 'visualblocks', 'wordcount'
                                            ],
                                            onboarding: false,
                                            toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
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
                                <DatePickerField label="Tanggal & Jam Mulai" value={startDate} onChange={setStartDate} withTime required errorMsg={errors.start_time} />
                                <DatePickerField label="Tanggal & Jam Selesai" value={endDate} onChange={setEndDate} withTime required errorMsg={errors.end_time} />
                                <DatePickerField label="Deadline Pendaftaran" value={regDeadline} onChange={setRegDeadline} withTime required errorMsg={errors.registration_deadline} />
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <DatePickerField label="Tanggal Mulai" value={startDate} onChange={setStartDate} required errorMsg={errors.start_date} />
                                    <DatePickerField label="Tanggal Selesai" value={endDate} onChange={setEndDate} required errorMsg={errors.end_date} />
                                    <DatePickerField label="Deadline Pendaftaran" value={regDeadline} onChange={setRegDeadline} withTime required errorMsg={errors.registration_deadline} />
                                    {type === 'certification_program' && certifType === 'scholarship' && (
                                        <DatePickerField label="Deadline Daftar Sosialisasi" value={socDeadline} onChange={setSocDeadline} withTime />
                                    )}
                                </div>

                                {/* Jadwal Detail (Sesi) */}
                                <div className="mt-4 border-t pt-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="text-sm font-medium">Jadwal Sesi{type === 'certification_program' ? ' Reguler' : ''}</p>
                                        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => addSchedule('main')}>
                                            <Plus className="size-3.5" /> Tambah Jadwal
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {schedules.filter((s) => s.schedule_type === 'main').map((_, rawIdx) => {
                                            const idx = schedules.findIndex((s, i) => s.schedule_type === 'main' && schedules.filter((x, j) => j <= i && x.schedule_type === 'main').length === rawIdx + 1);
                                            return (
                                                <ScheduleRow key={idx} index={idx} schedule={schedules[idx]} onUpdate={updateSchedule} onRemove={removeSchedule} programType={type} />
                                            );
                                        })}
                                        {schedules.filter((s) => s.schedule_type === 'main').length === 0 && (
                                            <p className="text-center text-sm text-muted-foreground py-3">Belum ada jadwal. Klik "Tambah Jadwal" untuk menambahkan.</p>
                                        )}
                                    </div>
                                </div>

                                {type === 'certification_program' && certifType === 'scholarship' && (
                                    <div className="mt-4 border-t pt-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-sm font-medium">Jadwal Sosialisasi</p>
                                            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => addSchedule('socialization')}>
                                                <Plus className="size-3.5" /> Tambah Sosialisasi
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {schedules.filter((s) => s.schedule_type === 'socialization').map((_, rawIdx) => {
                                                const idx = schedules.findIndex((s, i) => s.schedule_type === 'socialization' && schedules.filter((x, j) => j <= i && x.schedule_type === 'socialization').length === rawIdx + 1);
                                                return (
                                                    <ScheduleRow key={idx} index={idx} schedule={schedules[idx]} onUpdate={updateSchedule} onRemove={removeSchedule} programType={type} />
                                                );
                                            })}
                                            {schedules.filter((s) => s.schedule_type === 'socialization').length === 0 && (
                                                <p className="text-center text-sm text-muted-foreground py-3">Belum ada jadwal sosialisasi.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── Harga & Quota ── */}
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-semibold">Harga & Kuota</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="price">Harga Normal *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                                    <Input
                                        id="price"
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
                                <Label htmlFor="strikethrough_price">Harga Coret</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                                    <Input
                                        id="strikethrough_price"
                                        name="strikethrough_price"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={strikeDisplay}
                                        onChange={(e) => setStrikeDisplay(formatRupiah(e.target.value))}
                                        className="bg-input pl-9"
                                    />
                                </div>
                            </div>
                            {type === 'certification_program' && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="scholarship_price">Harga Beasiswa</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                                        <Input
                                            id="scholarship_price"
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
                                <Label htmlFor="quota">Kuota Peserta</Label>
                                <Input id="quota" name="quota" type="number" min="0" defaultValue={duplicateData?.quota ?? "0"} className="bg-input" />
                                <span className="text-[11px] text-muted-foreground block">Isi 0 untuk kuota tidak terbatas</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Link Grup ── */}
                    <div className="rounded-lg border bg-card p-5 shadow-sm">
                        <h3 className="mb-4 font-semibold">Link Grup</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="group_url">Link Grup (WA/Telegram)</Label>
                                <Input id="group_url" name="group_url" type="url" defaultValue={duplicateData?.group_url ?? ''} placeholder="https://chat.whatsapp.com/..." className="bg-input" />
                            </div>
                        </div>
                    </div>

                    {/* ── Submit ── */}
                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.visit(route(`${prefix}.program-events.index`))}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="text-white">
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Program'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

const getDayFromDate = (dateStr: string): string => {
    if (!dateStr) return 'senin';
    const date = new Date(dateStr + 'T00:00:00');
    const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const jsToIndoMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    return jsToIndoMap[dayIndex] || 'senin';
};

// ── Sub-component: ScheduleRow ──
function ScheduleRow({
    index,
    schedule,
    onUpdate,
    onRemove,
    programType,
}: {
    index: number;
    schedule: Schedule;
    onUpdate: (idx: number, field: keyof Schedule, value: string) => void;
    onRemove: (idx: number) => void;
    programType: string;
}) {
    const isBootcamp = programType === 'bootcamp';

    return (
        <div className="relative rounded-md border bg-muted/40 p-4">
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="size-4" />
            </button>
            <div className={cn("grid gap-3", isBootcamp ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
                {!isBootcamp && (
                    <div className="space-y-1">
                        <Label className="text-xs">Judul Sesi</Label>
                        <Input
                            value={schedule.title}
                            onChange={(e) => onUpdate(index, 'title', e.target.value)}
                            placeholder="Sesi 1 / Pertemuan 1"
                            className="bg-input h-8 text-sm"
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
                                    'h-8 w-full justify-start text-left text-sm font-normal px-2',
                                    !schedule.schedule_date && 'text-muted-foreground',
                                )}
                            >
                                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                                {schedule.schedule_date ? format(new Date(schedule.schedule_date + 'T00:00'), 'dd MMM yyyy') : 'Pilih'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg" align="start">
                            <Calendar
                                mode="single"
                                selected={schedule.schedule_date ? new Date(schedule.schedule_date + 'T00:00') : undefined}
                                onSelect={(d) => {
                                    const dateStr = d ? format(d, 'yyyy-MM-dd') : '';
                                    onUpdate(index, 'schedule_date', dateStr);
                                    if (dateStr) {
                                        onUpdate(index, 'day', getDayFromDate(dateStr));
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
                    <Select value={schedule.day} onValueChange={(v) => onUpdate(index, 'day', v)} disabled>
                        <SelectTrigger className="bg-input h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {DAYS.map((d) => (
                                <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Jam Mulai *</Label>
                    <Input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => onUpdate(index, 'start_time', e.target.value)}
                        className="bg-input h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Jam Selesai *</Label>
                    <Input
                        type="time"
                        value={schedule.end_time}
                        onChange={(e) => onUpdate(index, 'end_time', e.target.value)}
                        className="bg-input h-8 text-sm"
                    />
                </div>
            </div>
        </div>
    );
}
