import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

// Define types based on what we need
export interface Schedule {
    schedule_type: 'main' | 'socialization';
    title: string | null;
    schedule_date: string | null;
    day: string | null;
    start_time: string | null;
    end_time: string | null;
}

export interface ProgramEventToDuplicate {
    id: string;
    title: string;
    batch: string | null;
    type: 'webinar' | 'bootcamp' | 'certification_program';
    start_date: string | null;
    end_date: string | null;
    start_time: string | null;
    end_time: string | null;
    registration_deadline: string | null;
    schedules?: Schedule[];
    // ...other fields we don't strictly need to type here
}

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

const emptySchedule = (): Schedule => ({
    schedule_type: 'main',
    title: '',
    schedule_date: '',
    day: 'senin',
    start_time: '',
    end_time: '',
});

const getDayFromDate = (dateStr: string): string => {
    if (!dateStr) return 'senin';
    const date = new Date(dateStr + 'T00:00:00');
    const dayIndex = date.getDay(); 
    const jsToIndoMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    return jsToIndoMap[dayIndex] || 'senin';
};

const calendarCls = cn(
    'rounded-xl p-2 text-sm',
    '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
    '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
    '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
    '[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white',
    '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
);

function DatePickerField({
    label, value, onChange, withTime = false, required = false,
}: {
    label: string; value: Date | undefined; onChange: (d: Date | undefined) => void; withTime?: boolean; required?: boolean;
}) {
    const [timeStr, setTimeStr] = React.useState(value ? format(value, 'HH:mm') : '');

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
                <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg z-[110]" align="start">
                    <Calendar mode="single" selected={value} onSelect={handleDaySelect} initialFocus className={calendarCls} />
                    {withTime && (
                        <div className="border-t pt-3 mt-2">
                            <Label className="text-xs text-muted-foreground">Jam</Label>
                            <input type="time" value={timeStr} onChange={(e) => handleTimeChange(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm" />
                        </div>
                    )}
                </PopoverContent>
            </Popover>
        </div>
    );
}

function ScheduleRow({
    index, schedule, onUpdate, onRemove, programType,
}: {
    index: number; schedule: Schedule; onUpdate: (idx: number, field: keyof Schedule, value: string) => void; onRemove: (idx: number) => void; programType: string;
}) {
    const isBootcamp = programType === 'bootcamp';

    return (
        <div className="relative rounded-md border bg-muted/40 p-4">
            <button type="button" onClick={() => onRemove(index)} className="absolute right-3 top-3 text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
            </button>
            <div className={cn("grid gap-3", isBootcamp ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
                {!isBootcamp && (
                    <div className="space-y-1">
                        <Label className="text-xs">Judul Sesi</Label>
                        <Input value={schedule.title || ''} onChange={(e) => onUpdate(index, 'title', e.target.value)} placeholder="Sesi 1 / Pertemuan 1" className="bg-input h-8 text-sm" />
                    </div>
                )}
                <div className="space-y-1">
                    <Label className="text-xs">Tanggal *</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button type="button" variant="outline" className={cn('h-8 w-full justify-start text-left text-sm font-normal px-2', !schedule.schedule_date && 'text-muted-foreground')}>
                                <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                                {schedule.schedule_date ? format(new Date(schedule.schedule_date + 'T00:00'), 'dd MMM yyyy') : 'Pilih'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-background p-4 shadow-lg z-[110]" align="start">
                            <Calendar mode="single" selected={schedule.schedule_date ? new Date(schedule.schedule_date + 'T00:00') : undefined} onSelect={(d) => {
                                const dateStr = d ? format(d, 'yyyy-MM-dd') : '';
                                onUpdate(index, 'schedule_date', dateStr);
                                if (dateStr) onUpdate(index, 'day', getDayFromDate(dateStr));
                            }} initialFocus className={calendarCls} />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Hari *</Label>
                    <Select value={schedule.day || 'senin'} onValueChange={(v) => onUpdate(index, 'day', v)} disabled>
                        <SelectTrigger className="bg-input h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent className="z-[120]">
                            {DAYS.map((d) => <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Jam Mulai *</Label>
                    <Input type="time" value={schedule.start_time || ''} onChange={(e) => onUpdate(index, 'start_time', e.target.value)} className="bg-input h-8 text-sm" />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Jam Selesai *</Label>
                    <Input type="time" value={schedule.end_time || ''} onChange={(e) => onUpdate(index, 'end_time', e.target.value)} className="bg-input h-8 text-sm" />
                </div>
            </div>
        </div>
    );
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    event: ProgramEventToDuplicate | null;
    prefix: 'admin' | 'user';
}

export default function DuplicateEventModal({ isOpen, onClose, event, prefix }: Props) {
    const [batch, setBatch] = React.useState('');
    const [startDate, setStartDate] = React.useState<Date | undefined>();
    const [endDate, setEndDate] = React.useState<Date | undefined>();
    const [regDeadline, setRegDeadline] = React.useState<Date | undefined>();
    const [schedules, setSchedules] = React.useState<Schedule[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Initialize state when modal opens
    React.useEffect(() => {
        if (isOpen && event) {
            setBatch(event.batch || '');
            setStartDate(event.start_time ? new Date(event.start_time) : (event.start_date ? new Date(event.start_date) : undefined));
            setEndDate(event.end_time ? new Date(event.end_time) : (event.end_date ? new Date(event.end_date) : undefined));
            setRegDeadline(event.registration_deadline ? new Date(event.registration_deadline) : undefined);
            setSchedules(event.schedules || []);
        }
    }, [isOpen, event]);

    if (!event) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const data: any = { batch };
        if (event.type === 'webinar') {
            if (startDate) data.start_time = format(startDate, "yyyy-MM-dd'T'HH:mm");
            if (endDate) data.end_time = format(endDate, "yyyy-MM-dd'T'HH:mm");
        } else {
            if (startDate) data.start_date = format(startDate, 'yyyy-MM-dd');
            if (endDate) data.end_date = format(endDate, 'yyyy-MM-dd');
            data.schedules = schedules;
        }
        if (regDeadline) data.registration_deadline = format(regDeadline, "yyyy-MM-dd'T'HH:mm");

        router.post(route(`${prefix}.program-events.duplicate`, event.id), data, {
            onSuccess: () => {
                toast.success('Event berhasil diduplikat!');
                onClose();
                setIsSubmitting(false);
            },
            onError: () => {
                toast.error('Gagal menduplikat event.');
                setIsSubmitting(false);
            },
        });
    };

    const updateSchedule = (index: number, field: keyof Schedule, value: string) => {
        setSchedules((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    };

    const removeSchedule = (index: number) => {
        setSchedules((prev) => prev.filter((_, i) => i !== index));
    };

    const addSchedule = () => {
        setSchedules((prev) => [...prev, { ...emptySchedule() }]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto z-[100]">
                <DialogHeader>
                    <DialogTitle>Duplikat Program: {event.title}</DialogTitle>
                    <DialogDescription>
                        Atur tanggal dan jadwal baru untuk duplikat acara ini. Data lainnya (harga, deskripsi, kuota) akan disalin sama persis dari acara aslinya.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="space-y-1.5">
                        <Label>Batch / Angkatan Baru</Label>
                        <Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Contoh: Batch 5" />
                    </div>

                    {event.type === 'webinar' ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <DatePickerField label="Tanggal & Jam Mulai" value={startDate} onChange={setStartDate} withTime required />
                            <DatePickerField label="Tanggal & Jam Selesai" value={endDate} onChange={setEndDate} withTime required />
                            <DatePickerField label="Deadline Pendaftaran" value={regDeadline} onChange={setRegDeadline} withTime required />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <DatePickerField label="Tanggal Mulai" value={startDate} onChange={setStartDate} required />
                                <DatePickerField label="Tanggal Selesai" value={endDate} onChange={setEndDate} required />
                                <DatePickerField label="Deadline Pendaftaran" value={regDeadline} onChange={setRegDeadline} withTime required />
                            </div>

                            <div className="mt-4 border-t pt-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-medium">Jadwal Sesi</p>
                                    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addSchedule}>
                                        <Plus className="size-3.5" /> Tambah Jadwal
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {schedules.map((schedule, idx) => (
                                        <ScheduleRow key={idx} index={idx} schedule={schedule} onUpdate={updateSchedule} onRemove={removeSchedule} programType={event.type} />
                                    ))}
                                    {schedules.length === 0 && (
                                        <p className="text-center text-sm text-muted-foreground py-3">Belum ada jadwal. Klik "Tambah Jadwal" untuk menambahkan.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Menduplikat...' : 'Simpan Duplikat'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
