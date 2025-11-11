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

    const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];
    const current = months[new Date().getMonth()];

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col ">
                        <p className="0 text-base font-semibold">Data Keuangan Iklan User</p>
                        <span className="text-[12px] font-extralight text-gray-400">pengaturan per bulan</span>
                    </div>
                    <Select defaultValue={current}>
                        <SelectTrigger className="w-fit">
                            <SelectValue className="mr-2" placeholder="Pilih Bulan" />
                        </SelectTrigger>
                        <SelectContent className="h-40">
                            {months.map((m) => (
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
                    data={tableData}
                    className="max-h-60 w-full"
                    body="max-h-57 overflow-y-auto"
                />
            </CardContent>
        </Card>
    );
}