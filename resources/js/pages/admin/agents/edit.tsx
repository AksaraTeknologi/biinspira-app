import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Agen',
        href: '/admin/agents',
    },
    {
        title: 'Edit Agen',
        href: '#',
    },
];

interface Agent {
    id: string;
    name: string;
    phone?: string;
}

interface EditAgentProps {
    agent: Agent;
}

export default function EditAgent({ agent }: EditAgentProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: agent.name,
        phone: agent.phone || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('agents.update', agent.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Agen" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Edit Agen</h1>
                    <p className="text-sm text-muted-foreground">Ubah informasi agen.</p>
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Agen *</Label>
                        <Input id="name" type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Nama Agen" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">No. Telepon</Label>
                        <Input
                            id="phone"
                            type="text"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="081234567890"
                        />
                        <InputError message={errors.phone} />
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            Simpan Perubahan
                        </Button>
                        <Link href={route('agents.index')}>
                            <Button type="button" variant="outline">
                                Batal
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
