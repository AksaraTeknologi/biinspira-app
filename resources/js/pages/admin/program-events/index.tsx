'use client';

import DuplicateEventModal, { ProgramEventToDuplicate } from '@/components/DuplicateEventModal';
import { Button } from '@/components/ui/button';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    setMonth,
    setYear,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import * as React from 'react';

interface ProgramEvent {
    id: string;
    type: 'webinar' | 'bootcamp' | 'certification_program';
    title: string;
    batch: string | null;
    start_time: string | null;
    end_time: string | null;
    start_date: string | null;
    end_date: string | null;
    registration_deadline: string | null;
    price: number;
    quota: number;
    user: { id: string; name: string } | null;
    schedules?: any[];
}

const TYPE_LABELS: Record<string, string> = {
    webinar: 'Webinar',
    bootcamp: 'Bootcamp',
    certification_program: 'Sertifikasi',
};

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatDate(value: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProgramEventIndex() {
    const { programEvents, holidays = {} } = usePage<{ programEvents: ProgramEvent[]; holidays?: Record<string, { summary: string }> }>().props;
    const { auth } = usePage<any>().props;
    const role = auth.role[0] || 'user';
    const isAdmin = role === 'admin';
    const prefix = isAdmin ? 'admin' : 'user';

    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [searchQuery, setSearchQuery] = React.useState('');
    const [draggingId, setDraggingId] = React.useState<string | null>(null);
    const [dragOverDay, setDragOverDay] = React.useState<string | null>(null);

    // Modal state for duplication
    const [duplicateModalOpen, setDuplicateModalOpen] = React.useState(false);
    const [duplicateEvent, setDuplicateEvent] = React.useState<ProgramEventToDuplicate | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Program Event', href: '' }];

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const handleMonthChange = (monthStr: string) => {
        setCurrentDate(setMonth(currentDate, parseInt(monthStr)));
    };

    const handleYearChange = (yearStr: string) => {
        setCurrentDate(setYear(currentDate, parseInt(yearStr)));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, eventId: string) => {
        e.dataTransfer.setData('eventId', eventId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => setDraggingId(eventId), 0);
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        setDragOverDay(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dayIso: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverDay !== dayIso) setDragOverDay(dayIso);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, dayIso: string) => {
        e.preventDefault();
        if (dragOverDay === dayIso) setDragOverDay(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetDate: Date) => {
        e.preventDefault();
        setDragOverDay(null);
        setDraggingId(null);
        const eventId = e.dataTransfer.getData('eventId');
        if (eventId) {
            const dateString = format(targetDate, 'yyyy-MM-dd');
            router.patch(
                route(`${prefix}.program-events.move`, eventId),
                {
                    new_start_date: dateString,
                },
                {
                    preserveScroll: true,
                },
            );
        }
    };

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Program Event" />
            <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
                {/* Header */}
                <div className="mb-6 flex shrink-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-2xl font-semibold">Program Event</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">Kelola program event — Webinar, Bootcamp, dan Certification Program</p>
                    </div>
                    <Link href={route(`${prefix}.program-events.create`)}>
                        <Button className="w-full gap-2 text-white sm:w-auto">
                            <Plus className="size-4" />
                            Buat Program Baru
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-4 flex shrink-0 flex-wrap items-center gap-3">
                    <div className="flex w-full items-center gap-2 sm:w-auto">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Select value={currentDate.getMonth().toString()} onValueChange={handleMonthChange}>
                            <SelectTrigger className="w-[120px] bg-input sm:w-[150px]">
                                <SelectValue placeholder="Bulan" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((month, index) => (
                                    <SelectItem key={index} value={index.toString()}>
                                        {month}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={currentDate.getFullYear().toString()} onValueChange={handleYearChange}>
                            <SelectTrigger className="w-[100px] bg-input sm:w-[120px]">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((y) => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                    <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
                        <Input
                            placeholder="Cari program..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-input sm:w-[250px]"
                        />
                    </div>
                </div>

                {/* Calendar */}
                <div className="flex min-h-[500px] flex-1 flex-col overflow-hidden rounded-md border bg-card shadow-sm">
                    {/* Calendar Header */}
                    <div className="grid shrink-0 grid-cols-7 border-b bg-muted/50">
                        {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => (
                            <div key={day} className="border-r py-2 text-center text-sm font-semibold text-muted-foreground last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>
                    {/* Calendar Grid */}
                    <div className="grid flex-1 grid-cols-7 overflow-y-auto" style={{ gridAutoRows: 'minmax(120px, full)' }}>
                        {days.map((day) => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isToday = isSameDay(day, new Date());
                            const dateString = format(day, 'yyyy-MM-dd');
                            const holiday = holidays[dateString];
                            const isSunday = day.getDay() === 0;

                            // Get events for this day
                            const dayEvents = programEvents.filter((event) => {
                                const startDateStr = event.start_time ?? event.start_date;
                                if (!startDateStr) return false;

                                const endDateStr = event.end_time ?? event.end_date ?? startDateStr;

                                const eventStart = new Date(startDateStr);
                                eventStart.setHours(0, 0, 0, 0);

                                const eventEnd = new Date(endDateStr);
                                eventEnd.setHours(0, 0, 0, 0);

                                const currentDay = new Date(day);
                                currentDay.setHours(0, 0, 0, 0);

                                return currentDay.getTime() >= eventStart.getTime() && currentDay.getTime() <= eventEnd.getTime();
                            });

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        'h-full border-r border-b p-1 transition-colors sm:p-2',
                                        !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
                                        isCurrentMonth && 'bg-background',
                                        dragOverDay === day.toISOString() && 'bg-muted/30 ring-2 ring-gray-300 ring-inset dark:ring-zinc-600',
                                    )}
                                    onDragOver={(e) => handleDragOver(e, day.toISOString())}
                                    onDragLeave={(e) => handleDragLeave(e, day.toISOString())}
                                    onDrop={(e) => handleDrop(e, day)}
                                >
                                    <div className="mb-1 flex shrink-0 items-center justify-between gap-1">
                                        <div className="flex-1 truncate">
                                            {holiday && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="block cursor-help truncate px-1 text-[9px] font-medium text-red-600 sm:text-[10px] dark:text-red-400">
                                                            {holiday.summary}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="text-xs font-medium shadow-md">
                                                        {holiday.summary}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm',
                                                isToday
                                                    ? 'bg-primary text-primary-foreground'
                                                    : isSunday || holiday
                                                      ? 'font-bold text-red-600 dark:text-red-400'
                                                      : '',
                                            )}
                                        >
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 pr-1 pb-1">
                                        {dayEvents.map((event) => {
                                            const isHighlighted = searchQuery && event.title.toLowerCase().includes(searchQuery.toLowerCase());

                                            // Determine base colors based on type
                                            let colorClasses = '';
                                            if (event.type === 'webinar') {
                                                colorClasses =
                                                    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-primary';
                                            } else if (event.type === 'bootcamp') {
                                                colorClasses =
                                                    'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
                                            } else {
                                                colorClasses =
                                                    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
                                            }

                                            // Override with highlight colors if matched
                                            if (isHighlighted) {
                                                colorClasses =
                                                    'bg-yellow-300 text-yellow-900 border-yellow-400 dark:bg-yellow-500 dark:text-yellow-950 dark:border-yellow-600 ring-2 ring-yellow-500/50 shadow-md scale-[1.02] z-10 relative';
                                            }

                                            return (
                                                <ContextMenu key={event.id}>
                                                    <ContextMenuTrigger asChild>
                                                        <div>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, event.id)}
                                                                        onDragEnd={handleDragEnd}
                                                                        onClick={(e) => {
                                                                            router.get(route(`${prefix}.program-events.edit`, event.id));
                                                                        }}
                                                                        className={cn(
                                                                            'block transition-all',
                                                                            draggingId === event.id && 'scale-105 rotate-1 opacity-80',
                                                                        )}
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                'cursor-pointer rounded-md border px-1.5 py-1 text-xs transition-all hover:opacity-80',
                                                                                colorClasses,
                                                                            )}
                                                                        >
                                                                            <div className="truncate leading-tight font-semibold">{event.title}</div>
                                                                            <div className="mt-0.5 truncate text-[10px] opacity-90">
                                                                                {TYPE_LABELS[event.type]}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" align="center" className="z-[100] w-64 p-3 shadow-lg">
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <p className="text-sm leading-tight font-semibold">{event.title}</p>
                                                                            <p className="text-xs opacity-90">
                                                                                {TYPE_LABELS[event.type]}
                                                                                {event.batch ? ` - ${event.batch}` : ''}
                                                                            </p>
                                                                        </div>
                                                                        <div className="space-y-1 text-xs">
                                                                            <div className="flex justify-between">
                                                                                <span className="opacity-80">Harga:</span>
                                                                                <span className="font-medium">
                                                                                    {event.price === 0
                                                                                        ? 'Gratis'
                                                                                        : new Intl.NumberFormat('id-ID', {
                                                                                              style: 'currency',
                                                                                              currency: 'IDR',
                                                                                              minimumFractionDigits: 0,
                                                                                          }).format(event.price)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="opacity-80">Mulai:</span>
                                                                                <span className="font-medium">
                                                                                    {formatDate(event.start_time ?? event.start_date)}
                                                                                </span>
                                                                            </div>
                                                                            {event.registration_deadline && (
                                                                                <div className="flex justify-between">
                                                                                    <span className="opacity-80">Tutup Daftar:</span>
                                                                                    <span className="font-medium">
                                                                                        {formatDate(event.registration_deadline)}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </ContextMenuTrigger>
                                                    <ContextMenuContent className="w-40">
                                                        <ContextMenuItem
                                                            onClick={() => {
                                                                setDuplicateEvent(event as unknown as ProgramEventToDuplicate);
                                                                setDuplicateModalOpen(true);
                                                            }}
                                                        >
                                                            Duplikat
                                                        </ContextMenuItem>
                                                    </ContextMenuContent>
                                                </ContextMenu>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <DuplicateEventModal
                isOpen={duplicateModalOpen}
                onClose={() => {
                    setDuplicateModalOpen(false);
                    setDuplicateEvent(null);
                }}
                event={duplicateEvent}
                prefix={prefix}
            />
        </AppLayout>
    );
}
