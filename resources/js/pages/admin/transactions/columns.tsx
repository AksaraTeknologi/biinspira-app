'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';

export type InvoiceBuyer = {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    avatar: string | null;
};

export type InvoiceProduct = {
    type: string;
    type_label: string;
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail: string;
};

export type Invoice = {
    id: string;
    invoice_code: string;
    status: string;
    amount: number;
    discount_amount: number;
    nett_amount: number;
    payment_method: string;
    payment_channel: string;
    invoice_url: string;
    paid_at: string | null;
    expires_at: string;
    created_at: string;
    updated_at: string;
    buyer: InvoiceBuyer;
    product_type: string;
    product_type_label: string;
    products: InvoiceProduct[];
    source_platform: string;
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function formatDate(dateString: string | null) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const platformConfig: Record<string, { label: string; className: string }> = {
    aksademy: { label: 'Aksademy', className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    kompeten: {
        label: 'Kompeten',
        className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    sekolahpajak: {
        label: 'Sekolah Pajak',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
    talenta: {
        label: 'Talenta',
        className: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
    },
    skillgrow: { label: 'Skillgrow', className: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300' },
};

export const columns: ColumnDef<Invoice>[] = [
    {
        accessorKey: 'invoice_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode Invoice" />,
        cell: ({ row }) => <div className="font-medium">{row.original.invoice_code}</div>,
    },
    {
        accessorKey: 'source_platform',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Platform" />,
        cell: ({ row }) => {
            const config = platformConfig[row.original.source_platform];
            return (
                <Badge variant="outline" className={config?.className}>
                    {config?.label ?? row.original.source_platform}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'buyer.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pembeli" />,
        cell: ({ row }) => (
            <div>
                <div className="font-medium">{row.original.buyer.name}</div>
                <div className="text-xs text-muted-foreground">{row.original.buyer.email}</div>
            </div>
        ),
    },
    {
        accessorKey: 'products',
        header: 'Produk',
        cell: ({ row }) => {
            const products = row.original.products;
            const first = products[0];
            if (!first) return '-';
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="max-w-[200px] cursor-default truncate">
                            {first.title}
                            {products.length > 1 && <span className="text-muted-foreground"> +{products.length - 1} lainnya</span>}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                        <ul className="list-disc pl-4 text-xs">
                            {products.map((p) => (
                                <li key={p.id}>
                                    {p.title} — {formatCurrency(p.price)}
                                </li>
                            ))}
                        </ul>
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        accessorKey: 'nett_amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Bayar" />,
        cell: ({ row }) => <div className="font-medium">{formatCurrency(row.original.nett_amount)}</div>,
    },
    {
        accessorKey: 'payment_method',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Metode Bayar" />,
        cell: ({ row }) => <div className="uppercase">{row.original.payment_channel}</div>,
    },
    {
        accessorKey: 'paid_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Bayar" />,
        cell: ({ row }) => <div>{formatDate(row.original.paid_at)}</div>,
    },
];
