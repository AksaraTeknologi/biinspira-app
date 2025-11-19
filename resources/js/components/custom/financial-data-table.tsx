import { useMemo, useState } from "react";
import TableCustom from "../table-custom";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

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

    const monthMap: Record<string, string> = {
        january: "Januari", february: "Februari", march: "Maret", april: "April", may: "Mei", june: "Juni", july: "Juli",
        august: "Agustus", september: "September", october: "Oktober", november: "November", december: "Desember",
    };

    // 🔹 Ambil daftar bulan unik dari tableData (dalam format Indonesia)
    const availableMonths = useMemo(() => {
        const set = new Set<string>();
        tableData.forEach((item) => {
            const raw = String(item?.date ?? "").toLowerCase();
            const monthName = monthMap[raw] ?? item?.date;
            if (monthName) set.add(monthName);
        });
        // urutkan berdasarkan urutan bulan dalam satu tahun
        const monthOrder = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli",
            "Agustus", "September", "Oktober", "November", "Desember",
        ];
        return [...set].sort(
            (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
        );
    }, [tableData]);

    // 🔹 Default filter → "Semua"
    const [selectedMonth, setSelectedMonth] = useState("Semua");

    // 🔹 Filter data berdasarkan bulan
    const filteredData = useMemo(() => {
        if (selectedMonth === "Semua") return tableData;
        return tableData.filter((item) => {
            const raw = String(item?.date ?? "").toLowerCase();
            const monthName = monthMap[raw] ?? item?.date;
            return monthName === selectedMonth;
        });
    }, [tableData, selectedMonth]);

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col ">
                        <p className="0 text-base font-semibold">Data Keuangan Iklan User</p>
                        <span className="text-[11px] font-extralight text-gray-400">pengaturan per bulan</span>
                    </div>
                    <Select defaultValue={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-fit">
                            <SelectValue className="mr-2" placeholder="Pilih Bulan" />
                        </SelectTrigger>
                        <SelectContent className="h-40" align="end">
                            <SelectItem value="Semua">Semua</SelectItem>
                            {/* hanya menampilkan bulan yang tersedia untuk di filter */}
                            {availableMonths.map((m) => (
                                <SelectItem key={m} value={m}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {/* table */}
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
