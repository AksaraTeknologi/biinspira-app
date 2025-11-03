import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { X } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Katalog',
        href: '/admin/catalogs',
    },
    {
        title: 'Tambah Katalog',
        href: '/admin/catalogs/create',
    },
];

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function CreateCatalog() {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        image: null as File | null,
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
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('catalogs.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Katalog" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Tambah Katalog Baru</h1>
                    <p className="text-sm text-muted-foreground">Silakan isi form untuk menambah katalog baru.</p>
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul Katalog *</Label>
                        <Input
                            id="title"
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Judul Katalog"
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Deskripsi katalog"
                            rows={4}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Gambar Katalog (Max: 2MB)</Label>
                        <Input
                            id="image"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                        />

                        {imagePreview && (
                            <div className="mt-4">
                                <p className="mb-2 text-sm text-muted-foreground">Preview:</p>
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
                            Simpan Katalog
                        </Button>
                        <Link href={route('catalogs.index')}>
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
