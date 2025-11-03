'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash } from 'lucide-react';

export default function CatalogActions({ catalog }: { catalog: Catalog }) {
    const handleDelete = () => {
        router.delete(route('catalogs.destroy', catalog.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={route('catalogs.edit', catalog.id)}>
                        <Button variant="ghost" size="icon">
                            <Edit className="size-4" />
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit Katalog</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Katalog</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus katalog ini?"
                            itemName={catalog.title}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Katalog</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export type Catalog = {
    id: string;
    title: string;
    description?: string;
    image?: string;
};

export const columns: ColumnDef<Catalog>[] = [
    {
        id: 'actions',
        header: () => <div className="text-center"></div>,
        cell: ({ row }) => <CatalogActions catalog={row.original} />,
    },
    {
        accessorKey: 'image',
        header: 'Gambar',
        cell: ({ row }) => {
            const imageUrl = row.original.image ? `/storage/${row.original.image}` : null;
            return (
                <div className="flex items-center">
                    {imageUrl ? (
                        <img src={imageUrl} alt={row.original.title} className="max-h-24 max-w-24 rounded-md" />
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
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Judul Katalog" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.title}</div>;
        },
    },
    {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />,
        cell: ({ row }) => {
            return <div className="max-w-md truncate">{row.original.description || '-'}</div>;
        },
    },
];
