'use client';

import DeleteButton from '@/components/delete-button';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight, Eye, Pencil } from 'lucide-react';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';

interface Event {
    id: number;
    name: string;
    batch: string;
}

interface User {
    id: number;
    name: string;
}

interface Goal {
    id: number;
    name: string;
}

interface Platform {
    id: number;
    name: string;
}

interface PlanPlatform {
    id: number;
    start_date: string;
    end_date: string;
    audience_type: string;
    goal: Goal;
    platform: Platform;
}

interface AdPlan {
    id: number;
    user: User;
    event: Event;
    status: string;
    plan_platforms: PlanPlatform[];
}

const breadcrumbs = [{ title: 'Marketing', href: route('admin.marketing.index') }];

export default function Marketing() {
    const { adPlans = [], isAdmin } = usePage<{ adPlans?: AdPlan[]; isAdmin?: boolean }>().props;
    const { filters } = usePage().props as any;

    const [date, setDate] = useState<DateRange | undefined>(() => {
        if (filters?.start_date && filters?.end_date) {
            return {
                from: new Date(filters.start_date),
                to: new Date(filters.end_date),
            };
        }
        return undefined;
    });

    const handleAddAd = () => {
        router.visit(route(isAdmin ? 'admin.marketing.create' : 'user.marketing.create'));
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const applyFilter = () => {
        router.get(
            route('admin.marketing.index'),
            {
                start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
                end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : '',
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const resetFilter = () => {
        setDate(undefined);
        router.get(
            route('admin.marketing.index'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Daftar Iklan</h1>
                    {isAdmin && (
                        <Button
                            onClick={handleAddAd}
                            className="gap-2 bg-primary hover:bg-blue-700 dark:border dark:border-primary dark:bg-background dark:hover:bg-blue-900"
                        >
                            + Tambah Iklan
                        </Button>
                    )}
                </div>

                {/* Filter Section */}
                <div className="rounded-lg border bg-input p-4 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="date-range" className="text-sm font-medium">
                                Rentang Tanggal
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date-range"
                                        variant={'outline'}
                                        className={cn(
                                            'w-full justify-start text-left font-normal sm:w-[300px]',
                                            'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700',
                                            !date && 'text-muted-foreground',
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, 'dd MMM yyyy')} - {format(date.to, 'dd MMM yyyy')}
                                                </>
                                            ) : (
                                                format(date.from, 'dd MMM yyyy')
                                            )
                                        ) : (
                                            <span>Pilih rentang tanggal</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg" align="start">
                                    <div className="bg-white dark:bg-gray-900">
                                        <Calendar
                                            mode="range"
                                            selected={date}
                                            onSelect={setDate}
                                            numberOfMonths={2}
                                            className={cn(
                                                'rounded-xl p-2 text-sm',
                                                '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
                                                '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
                                                '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
                                                '[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white',
                                                '[&_.rdp-day_range_middle]:bg-blue-100 [&_.rdp-day_range_middle]:text-zinc-800',
                                                '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
                                            )}
                                            components={{
                                                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                                                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                                            }}
                                            formatters={{
                                                formatCaption: (date, options) => {
                                                    return (
                                                        <div className="flex items-center justify-center">
                                                            <span className="font-medium">
                                                                {format(date, 'MMMM yyyy', { locale: options?.locale })}
                                                            </span>
                                                        </div>
                                                    );
                                                },
                                            }}
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={applyFilter} disabled={!date?.from || !date?.to} className="bg-primary hover:bg-primary/90">
                                Terapkan Filter
                            </Button>
                            <Button
                                variant="outline"
                                onClick={resetFilter}
                                className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    {/* Selected Date Info */}
                    {date?.from && date?.to && (
                        <div className="mt-3 text-sm text-muted-foreground">
                            Menampilkan iklan dengan periode:{' '}
                            <strong>
                                {format(date.from, 'dd MMM yyyy')} - {format(date.to, 'dd MMM yyyy')}
                            </strong>
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg border shadow-sm">
                    <Table>
                        <TableHeader className="bg-border">
                            <TableRow>
                                <TableHead>Aksi</TableHead>
                                <TableHead>Event</TableHead>
                                {/* <TableHead>Batch</TableHead> */}
                                <TableHead>Platform</TableHead>
                                <TableHead>Goal</TableHead>
                                <TableHead>Tipe Audiens</TableHead>
                                <TableHead>Tanggal Berakhir</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-input">
                            {adPlans.length > 0 ? (
                                adPlans.map((plan) => {
                                    const platforms = plan.plan_platforms.map((p) => p.platform?.name).join(', ');
                                    const goals = plan.plan_platforms.map((p) => p.goal?.name).join(', ');
                                    const audienceTypes = [
                                        ...new Set(
                                            plan.plan_platforms.map((p) =>
                                                p.audience_type === 'targeted'
                                                    ? 'Targetting Audiens'
                                                    : p.audience_type === 'broad'
                                                      ? 'Broad'
                                                      : p.audience_type === 'combined'
                                                        ? 'Combined'
                                                        : '-',
                                            ),
                                        ),
                                    ].join(', ');
                                    const endDates = plan.plan_platforms.map((p) => formatDate(p.end_date)).join(', ');

                                    return (
                                        <TableRow key={plan.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={route('admin.marketing.show', plan.id)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={route('admin.marketing.edit', plan.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    {isAdmin && (
                                                        <DeleteButton id={plan.id} routeTable="marketing" name={plan.event?.name} role="admin" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{plan.event?.name || '-'}</TableCell>
                                            {/* <TableCell>{plan.event?.batch || '-'}</TableCell> */}
                                            <TableCell>{platforms || '-'}</TableCell>
                                            <TableCell>{goals || '-'}</TableCell>
                                            <TableCell>{audienceTypes || '-'}</TableCell>
                                            <TableCell>{endDates || '-'}</TableCell>
                                            <TableCell>{plan.user?.name || '-'}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`rounded px-2 py-1 text-xs font-medium ${
                                                        plan.status === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : plan.status === 'draft'
                                                              ? 'bg-yellow-100 text-yellow-700'
                                                              : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {plan.status || '-'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-6 text-center text-gray-500">
                                        Tidak ada data iklan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
