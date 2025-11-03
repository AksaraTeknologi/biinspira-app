'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rupiahFormatter } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash } from 'lucide-react';

export default function HamperActions({ hamper }: { hamper: Hamper }) {
    const handleDelete = () => {
        router.delete(route('hampers.destroy', hamper.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={route('hampers.edit', hamper.id)}>
                        <Button variant="ghost" size="icon">
                            <Edit className="size-4" />
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit Hampers</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Hampers</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus hampers ini?"
                            itemName={hamper.name}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Hampers</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export type Hamper = {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
};

export const columns: ColumnDef<Hamper>[] = [
    {
        id: 'actions',
        header: () => <div className="text-center"></div>,
        cell: ({ row }) => <HamperActions hamper={row.original} />,
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Hampers" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.name}</div>;
        },
    },
    {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi Hampers" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.description}</div>;
        },
    },
    {
        accessorKey: 'price',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
        cell: ({ row }) => {
            const price = parseFloat(row.original.price.toString());
            return <div className="font-medium">{rupiahFormatter.format(price)}</div>;
        },
    },
];
