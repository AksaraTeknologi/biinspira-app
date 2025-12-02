import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Fragment, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface FinanceProps {
    tableData: any[];
    className?: string;
}

export default function FinancialDataTable({ tableData, className }: FinanceProps) {
    const page = usePage<SharedData>().props;
    const role = page.auth.role[0];
    const isAdmin = role === 'admin';

    const monthMap: Record<string, string> = {
        january: 'Januari',
        february: 'Februari',
        march: 'Maret',
        april: 'April',
        may: 'Mei',
        june: 'Juni',
        july: 'Juli',
        august: 'Agustus',
        september: 'September',
        october: 'Oktober',
        november: 'November',
        december: 'Desember',
    };

    // 🔹 Ambil daftar bulan unik (versi Indonesia)
    const availableMonths = useMemo(() => {
        const set = new Set<string>();
        tableData.forEach((item) => {
            const raw = String(item?.date ?? '').toLowerCase();
            const monthName = monthMap[raw] ?? item?.date;
            if (monthName) set.add(monthName);
        });

        const monthOrder = [
            'Januari',
            'Februari',
            'Maret',
            'April',
            'Mei',
            'Juni',
            'Juli',
            'Agustus',
            'September',
            'Oktober',
            'November',
            'Desember',
        ];

        return [...set].sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    }, [tableData]);

    // 🔹 Ambil daftar user unik (Admin, Biinspira, dll.)
    const availableUsers = useMemo(() => {
        const set = new Set<string>();
        tableData.forEach((item) => {
            if (item?.user) set.add(item.user);
        });
        return ['Semua', ...Array.from(set)];
    }, [tableData]);

    // -----------------------------
    // 🔹 STATES FILTER
    // -----------------------------
    const [selectedMonth, setSelectedMonth] = useState<string>('Semua');
    const [selectedUser, setSelectedUser] = useState<string>('Semua');

    // -----------------------------
    // 🔹 FILTER DATA
    // -----------------------------
    const filteredData = useMemo(() => {
        return tableData.filter((item) => {
            // Filter bulan
            const raw = String(item?.date ?? '').toLowerCase();
            const monthName = monthMap[raw] ?? item?.date;
            const matchMonth = selectedMonth === 'Semua' || monthName === selectedMonth;

            // Filter user
            const matchUser = selectedUser === 'Semua' || item?.user === selectedUser;

            return matchMonth && matchUser;
        });
    }, [tableData, selectedMonth, selectedUser]);

    // -----------------------------
    // 🔹 GROUPING DATA BERDASARKAN plan_id
    // -----------------------------
    const data = useMemo(() => {
        const grouped: {
            plan_id: string;
            user: string;
            omset: number;
            rows: any[];
        }[] = [];

        filteredData.forEach((item) => {
            const existingGroup = grouped.find((g) => g.plan_id === item.plan_id);

            const omsetNumber = Number(item.omset.toString().replace(/[^0-9]/g, '')) || 0;

            if (existingGroup) {
                existingGroup.omset = omsetNumber;
                existingGroup.rows.push(item);
            } else {
                grouped.push({
                    plan_id: item.plan_id,
                    user: item.user,
                    omset: omsetNumber,
                    rows: [item],
                });
            }
        });

        return grouped;
    }, [filteredData]); 

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-col">
                        <p className="text-base font-semibold">Data Keuangan Iklan User</p>
                        <span className="text-[11px] font-extralight text-gray-400">pengaturan per bulan & per user</span>
                    </div>

                    <div className="flex gap-2">
                        <div className={isAdmin ? '' : 'hidden'}>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="rounded-full">
                                        Filter
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                    className="w-auto rounded-2xl border bg-background p-4 shadow-lg dark:border-muted-foreground"
                                    align="end"
                                >
                                    <div className="flex w-40 flex-col gap-2">
                                        <div>
                                            <p className="mb-1 text-xs text-gray-500">Bulan</p>
                                            <Select defaultValue={selectedMonth} onValueChange={setSelectedMonth}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih Bulan" />
                                                </SelectTrigger>
                                                <SelectContent className="h-40" align="end">
                                                    <SelectItem value="Semua">Semua</SelectItem>
                                                    {availableMonths.map((m) => (
                                                        <SelectItem key={m} value={m}>
                                                            {m}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-xs text-gray-500">Akun</p>
                                            <Select defaultValue={selectedUser} onValueChange={setSelectedUser}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih User" />
                                                </SelectTrigger>
                                                <SelectContent className="h-40" align="end">
                                                    {availableUsers.map((u) => (
                                                        <SelectItem key={u} value={u}>
                                                            {u}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* 🔹 Filter Bulan */}
                        <div className={isAdmin ? 'hidden' : ''}>
                            <Select defaultValue={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-fit">
                                    <SelectValue placeholder="Pilih Bulan" />
                                </SelectTrigger>
                                <SelectContent className="h-40" align="end">
                                    <SelectItem value="Semua">Semua</SelectItem>
                                    {availableMonths.map((m) => (
                                        <SelectItem key={m} value={m}>
                                            {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <div className="max-h-57 overflow-y-auto rounded-lg border shadow-sm dark:border-muted-foreground" style={{ scrollbarWidth: 'none' }}>
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow className="bg-gray-100">
                                <TableHead>No</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Pengeluaran</TableHead>
                                <TableHead>Omset</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {data.map((row, index) => {
                                const rowSpan = row.rows.length;

                                return (
                                    <Fragment key={index}>
                                        {/* ROW PERTAMA */}
                                        <TableRow className="bg-input text-start">
                                            <TableCell rowSpan={rowSpan} className="text-center align-middle font-semibold">
                                                {index + 1}
                                            </TableCell>

                                            <TableCell rowSpan={rowSpan} className="text-center align-middle font-semibold">
                                                {row.user}
                                            </TableCell>

                                            {/* ITEM PERTAMA */}
                                            <TableCell>
                                                <div
                                                    className={`w-full rounded-full px-4 py-1 text-center text-white ${
                                                        row.rows[0].status === 'Business Suite'
                                                            ? 'bg-chart-1'
                                                            : row.rows[0].status === 'Boost Post'
                                                              ? 'bg-chart-3'
                                                              : 'bg-chart-2'
                                                    }`}
                                                >
                                                    {row.rows[0].status}
                                                </div>
                                            </TableCell>
                                            <TableCell>{row.rows[0].cost}</TableCell>

                                            {/* OMSET */}
                                            <TableCell rowSpan={rowSpan} className="text-center align-middle font-semibold">
                                                {row.omset
                                                    .toLocaleString('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                    })
                                                    .replace(/,00$/, '')}
                                            </TableCell>
                                        </TableRow>

                                        {/* SISA ROW */}
                                        {row.rows.slice(1).map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <div
                                                        className={`w-full rounded-full px-4 py-1 text-center text-white ${
                                                            item.status === 'Business Suite'
                                                                ? 'bg-chart-1'
                                                                : item.status === 'Boost Post'
                                                                  ? 'bg-chart-3'
                                                                  : 'bg-chart-2'
                                                        }`}
                                                    >
                                                        {item.status}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{item.cost}</TableCell>
                                            </TableRow>
                                        ))}
                                    </Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
