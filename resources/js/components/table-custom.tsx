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
    className?: string;
    body?: string;
}

export default function TableCustom({
    columns = [],
    data = [],
    className = "",
    body = "",
}: TableMarketingProps) {

    const tabHeader = () => {
        return (
            <TableHeader>
                <TableRow className="bg-border">
                    {columns.map((col) => (
                        <TableHead key={col.accessor} className={`text-start ${col.className}`}>
                            {col.header}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
        );
    }

    const tabBody = () => {
        return (
            <TableBody className={body}>
                {data.length > 0 ? (
                    data.map((row, idx) => (
                        <TableRow key={idx} className="bg-input text-start">
                            {columns.map((col) => (
                                <TableCell key={col.accessor} className="py-1">
                                    {col.accessor === "status" ? (
                                        <Button
                                            variant="secondary"
                                            className={`text-white px-4 py-1 rounded-full w-full
                                                    ${(row.status === "draft" || row.status === "Business Suite")
                                                    ? "bg-chart-1"
                                                    : (row.status === "Boost Post")
                                                        ? "bg-chart-3"
                                                        : "bg-chart-2"
                                                }`}
                                        >
                                            {row.status}
                                        </Button>
                                    ) : (
                                        row[col.accessor]
                                    )}
                                </TableCell>
                            ))}
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
        )
    }

    return (
        <div className={`relative rounded-lg border dark:border-muted-foreground shadow-sm overflow-hidden ${className}`}>
            <div className={body} style={{ scrollbarWidth:"none" }}>
                <Table className="border-0">
                    {tabHeader()}
                    {tabBody()}
                </Table>
            </div>
        </div>
    );
}