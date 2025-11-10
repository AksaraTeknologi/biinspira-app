import exp from "constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface colomnTable {
    header: string;
    accessor: string;
    className?: string;
}

interface TableMarketingProps {
    columns?: colomnTable[];
    data?: any[];
}

export default function TableCustom({
    // columns = [
    //     { header: 'Tanggal iklan', accessor: 'event_date' },
    //     { header: 'Nama Iklan', accessor: 'ad_name' },
    //     { header: 'Platform', accessor: 'platform' },
    //     { header: 'Status', accessor: 'status' },
    // ],
    columns = [],
    data = []
}: TableMarketingProps) {

    return (
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-blue-100">
                        {columns.map((col) => (
                            <TableHead key={col.accessor} className={`text-center ${col.className}`}>
                                {col.header}
                            </TableHead>
                        ))}
                        <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.length > 0 ? (
                        data.map((row, idx) => (
                            <TableRow key={idx} className="text-center">
                                {columns.map((col) => (
                                    <TableCell key={col.accessor}>
                                        {col.accessor === "status" ? (
                                            <Button
                                                variant="secondary"
                                                className={`text-white px-4 py-1 rounded-full ${row.status === "draft"
                                                        ? "bg-blue-500"
                                                        : "bg-green-500"
                                                    }`}
                                            >
                                                {row.status}
                                            </Button>
                                        ) : (
                                            row[col.accessor]
                                        )}
                                    </TableCell>
                                ))}

                                <TableCell className="text-center space-x-2">
                                    <Button variant="ghost" size="icon">
                                        <Pencil className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length + 1} className="text-center py-4">
                                Tidak ada data
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}