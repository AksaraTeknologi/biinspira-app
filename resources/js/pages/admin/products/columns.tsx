'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rupiahFormatter } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash } from 'lucide-react';

export default function ProductActions({ product }: { product: Product }) {
    const handleDelete = () => {
        router.delete(route('products.destroy', product.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={route('products.edit', product.id)}>
                        <Button variant="ghost" size="icon">
                            <Edit className="size-4" />
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit Produk</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Produk</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus produk ini?"
                            itemName={product.name}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Produk</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export type Product = {
    id: string;
    variant_id: number;
    name: string;
    description?: string;
    price_regular: number;
    price_jar: number | null;
    image?: string;
    variant: {
        id: number;
        name: string;
    };
};

export const columns: ColumnDef<Product>[] = [
    {
        id: 'actions',
        header: () => <div className="text-center"></div>,
        cell: ({ row }) => <ProductActions product={row.original} />,
    },
    {
        accessorKey: 'image',
        header: 'Gambar',
        cell: ({ row }) => {
            const imageUrl = row.original.image ? `/storage/${row.original.image}` : null;
            return (
                <div className="flex items-center">
                    {imageUrl ? (
                        <img src={imageUrl} alt={row.original.name} className="max-h-24 max-w-24 rounded-md" />
                    ) : (
                        <div className="flex items-center justify-center rounded-md bg-muted px-4 py-6">
                            <span className="text-xs text-muted-foreground">No Image</span>
                        </div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Produk" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.name}</div>;
        },
    },
    {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi Product" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.description}</div>;
        },
    },
    {
        accessorKey: 'variant.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Varian" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.variant.name}</div>;
        },
    },
    {
        accessorKey: 'price_regular',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga Regular" />,
        cell: ({ row }) => {
            const price = parseFloat(row.original.price_regular.toString());
            return <div className="font-medium">{rupiahFormatter.format(price)}</div>;
        },
    },
    {
        accessorKey: 'price_jar',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga Jar" />,
        cell: ({ row }) => {
            const price = row.original.price_jar;
            return <div className="font-medium">{price ? rupiahFormatter.format(parseFloat(price.toString())) : '-'}</div>;
        },
    },
];
