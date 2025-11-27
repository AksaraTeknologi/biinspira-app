import { useMemo, useState } from "react";
import TableCustom from "../table-custom";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
    Select, SelectTrigger, SelectValue,
    SelectContent, SelectItem
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { usePage } from '@inertiajs/react';
import { SharedData } from "@/types";

interface FinanceProps {
    tableColoms: {
        header: string;
        accessor: string;
    }[];
    tableData: any[];
    className?: string;
}

export default function FinancialDataTable({
    tableColoms,
    tableData,
    className,
}: FinanceProps) {

    console.log("tableData:", tableData);

    const page = usePage<SharedData>().props;
    const role = page.auth.role[0];
    const isAdmin = role === 'admin';

    const monthMap: Record<string, string> = {
        january: "Januari", february: "Februari", march: "Maret",
        april: "April", may: "Mei", june: "Juni", july: "Juli",
        august: "Agustus", september: "September", october: "Oktober",
        november: "November", december: "Desember",
    };

    // 🔹 Ambil daftar bulan unik (versi Indonesia)
    const availableMonths = useMemo(() => {
        const set = new Set<string>();
        tableData.forEach((item) => {
            const raw = String(item?.date ?? "").toLowerCase();
            const monthName = monthMap[raw] ?? item?.date;
            if (monthName) set.add(monthName);
        });

        const monthOrder = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
            "Agustus", "September", "Oktober", "November", "Desember",
        ];

        return [...set].sort(
            (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
        );
    }, [tableData]);


    // 🔹 Ambil daftar user unik (Admin, Biinspira, dll.)
    const availableUsers = useMemo(() => {
        const set = new Set<string>();
        tableData.forEach((item) => {
            if (item?.user) set.add(item.user);
        });
        return ["Semua", ...Array.from(set)];
    }, [tableData]);


    // -----------------------------
    // 🔹 STATES FILTER
    // -----------------------------
    const [selectedMonth, setSelectedMonth] = useState<string>("Semua");
    const [selectedUser, setSelectedUser] = useState<string>("Semua");


    // -----------------------------
    // 🔹 FILTER DATA
    // -----------------------------
    const filteredData = useMemo(() => {
        return tableData.filter((item) => {
            // Filter bulan
            const raw = String(item?.date ?? "").toLowerCase();
            const monthName = monthMap[raw] ?? item?.date;
            const matchMonth =
                selectedMonth === "Semua" || monthName === selectedMonth;

            // Filter user
            const matchUser =
                selectedUser === "Semua" || item?.user === selectedUser;

            return matchMonth && matchUser;
        });
    }, [tableData, selectedMonth, selectedUser]);


    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col">
                        <p className="text-base font-semibold">Data Keuangan Iklan User</p>
                        <span className="text-[11px] font-extralight text-gray-400">
                            pengaturan per bulan & per user
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <div className={isAdmin ? '' : 'hidden'}>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="rounded-full">Filter</Button>
                                </PopoverTrigger>

                                <PopoverContent className="w-auto rounded-2xl border dark:border-muted-foreground bg-background p-4 shadow-lg" align="end">
                                    <div className="flex flex-col gap-2 w-40">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Bulan</p>
                                            <Select defaultValue={selectedMonth} onValueChange={setSelectedMonth}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih Bulan" />
                                                </SelectTrigger>
                                                <SelectContent className="h-40" align="end">
                                                    <SelectItem value="Semua">Semua</SelectItem>
                                                    {availableMonths.map((m) => (
                                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Akun</p>
                                            <Select defaultValue={selectedUser} onValueChange={setSelectedUser}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Pilih User" />
                                                </SelectTrigger>
                                                <SelectContent className="h-40" align="end">
                                                    {availableUsers.map((u) => (
                                                        <SelectItem key={u} value={u}>{u}</SelectItem>
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
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 🔹 Filter User */}
                        {/* <Select defaultValue={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="w-fit">
                                <SelectValue placeholder="Pilih User" />
                            </SelectTrigger>
                            <SelectContent className="h-40" align="end">
                                {availableUsers.map((u) => (
                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select> */}

                    </div>

                </div>
            </CardHeader>

            <CardContent>
                <TableCustom
                    columns={tableColoms}
                    data={filteredData}
                    className="max-h-60 w-full"
                    body="max-h-57 overflow-y-auto"
                />
            </CardContent>
        </Card>
    );
}
