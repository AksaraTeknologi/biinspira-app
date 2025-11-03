import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { parseRupiah, rupiahFormatter } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Hampers',
        href: '/admin/hampers',
    },
    {
        title: 'Edit Hampers',
        href: '#',
    },
];

interface Hamper {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
}

interface EditHamperProps {
    hamper: Hamper;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function EditHamper({ hamper }: EditHamperProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(hamper.image ? `/storage/${hamper.image}` : null);
    const existingImage = hamper.image || null;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        name: hamper.name,
        description: hamper.description || '',
        price: hamper.price,
        image: null as File | null,
        _method: 'PUT',
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast.error('Ukuran gambar terlalu besar!', {
                    description: `Ukuran maksimal adalah 2MB. Ukuran file Anda: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
                });

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setData('image', null);
        setImagePreview(existingImage ? `/storage/${existingImage}` : null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('hampers.update', hamper.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Hampers" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Edit Hampers</h1>
                    <p className="text-sm text-muted-foreground">Ubah informasi hampers.</p>
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Hampers *</Label>
                        <Input id="name" type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Nama Hampers" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Deskripsi hampers"
                            rows={4}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Harga *</Label>
                        <Input
                            id="price"
                            type="text"
                            placeholder="Rp 0"
                            value={rupiahFormatter.format(data.price || 0)}
                            onChange={(e) => setData('price', parseRupiah(e.target.value))}
                            autoComplete="off"
                        />
                        <InputError message={errors.price} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Gambar Hampers (Max: 2MB)</Label>

                        <Input
                            id="image"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                        />

                        {existingImage && !data.image && (
                            <div className="mt-4">
                                <p className="mb-2 text-sm text-muted-foreground">Gambar saat ini:</p>
                                <div className="relative inline-block">
                                    <img src={`/storage/${existingImage}`} alt="Current hamper" className="h-40 rounded-md object-cover" />
                                </div>
                            </div>
                        )}

                        {data.image && imagePreview && (
                            <div className="mt-4">
                                <p className="mb-2 text-sm text-muted-foreground">Preview gambar baru:</p>
                                <div className="relative inline-block">
                                    <img src={imagePreview} alt="Preview" className="h-40 rounded-md object-cover" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                        onClick={removeImage}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <InputError message={errors.image} />
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            Simpan Perubahan
                        </Button>
                        <Link href={route('hampers.index')}>
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
