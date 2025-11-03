import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
        title: 'Produk',
        href: '/admin/products',
    },
    {
        title: 'Edit Produk',
        href: '#',
    },
];

interface Variant {
    id: number;
    name: string;
}

interface Product {
    id: string;
    variant_id: number;
    name: string;
    description?: string;
    price_regular: number;
    price_jar: number | null;
    image?: string;
}

interface EditProductProps {
    product: Product;
    variants: Variant[];
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function EditProduct({ product, variants }: EditProductProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(product.image ? `/storage/${product.image}` : null);
    const existingImage = product.image || null;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm({
        variant_id: product.variant_id.toString(),
        name: product.name,
        description: product.description || '',
        price_regular: product.price_regular,
        price_jar: product.price_jar || 0,
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
        post(route('products.update', product.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Produk" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Edit Produk</h1>
                    <p className="text-sm text-muted-foreground">Ubah informasi produk.</p>
                </div>

                <form onSubmit={submit} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="variant_id">Varian *</Label>
                        <Select value={data.variant_id} onValueChange={(value) => setData('variant_id', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Varian" />
                            </SelectTrigger>
                            <SelectContent>
                                {variants.map((variant) => (
                                    <SelectItem key={variant.id} value={variant.id.toString()}>
                                        {variant.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.variant_id} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Produk *</Label>
                        <Input id="name" type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Nama Produk" />
                        <InputError message={errors.name} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            placeholder="Deskripsi produk"
                            rows={4}
                        />
                        <InputError message={errors.description} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price_regular">Harga Regular *</Label>
                            <Input
                                id="price_regular"
                                type="text"
                                placeholder="Rp 0"
                                value={rupiahFormatter.format(data.price_regular || 0)}
                                onChange={(e) => setData('price_regular', parseRupiah(e.target.value))}
                                autoComplete="off"
                            />
                            <InputError message={errors.price_regular} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price_jar">Harga Jar (Opsional)</Label>
                            <Input
                                id="price_jar"
                                type="text"
                                placeholder="Rp 0"
                                value={data.price_jar ? rupiahFormatter.format(data.price_jar) : ''}
                                onChange={(e) => {
                                    const value = e.target.value.trim();
                                    setData('price_jar', value ? parseRupiah(value) : 0);
                                }}
                                autoComplete="off"
                            />
                            <InputError message={errors.price_jar} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Gambar Produk (Max: 2MB)</Label>

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
                                    <img src={`/storage/${existingImage}`} alt="Current product" className="h-40 rounded-md object-cover" />
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
                        <Link href={route('products.index')}>
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
