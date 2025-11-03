'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash } from 'lucide-react';

export default function AgentActions({ agent }: { agent: Agent }) {
    const handleDelete = () => {
        router.delete(route('agents.destroy', agent.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href={route('agents.edit', agent.id)}>
                        <Button variant="ghost" size="icon">
                            <Edit className="size-4" />
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit Agen</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Agen</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus agen ini?"
                            itemName={agent.name}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Agen</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export type Agent = {
    id: string;
    name: string;
    phone?: string;
};

export const columns: ColumnDef<Agent>[] = [
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <AgentActions agent={row.original} />,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Agen" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.name}</div>;
        },
    },
    {
        accessorKey: 'phone',
        header: ({ column }) => <DataTableColumnHeader column={column} title="No. Telepon" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.phone || '-'}</div>;
        },
    },
];
