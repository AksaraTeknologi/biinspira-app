import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

interface CreateVariantProps {
    setOpen: (open: boolean) => void;
}

export default function CreateVariant({ setOpen }: CreateVariantProps) {
    const nameInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        submit: create,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm<{
        name: string;
        description: string;
    }>({
        name: '',
        description: '',
    });

    const createVariant: FormEventHandler = (e) => {
        e.preventDefault();

        create('post', route('variants.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
            },
            onError: () => nameInput.current?.focus(),
        });
    };

    return (
        <DialogContent>
            <DialogTitle>Tambah Varian Baru</DialogTitle>
            <DialogDescription>Silakan masukkan nama varian baru yang ingin Anda tambahkan.</DialogDescription>
            <form className="space-y-3" onSubmit={createVariant}>
                <div className="grid gap-2">
                    <Label htmlFor="name" className="sr-only">
                        Nama Varian
                    </Label>
                    <Input
                        id="name"
                        type="text"
                        name="name"
                        ref={nameInput}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Nama Varian"
                        autoComplete="off"
                    />
                    <InputError message={errors.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="description" className="sr-only">
                        Deskripsi (Opsional)
                    </Label>
                    <Input
                        id="description"
                        type="text"
                        name="description"
                        ref={nameInput}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Deskripsi Varian (Opsional)"
                        autoComplete="off"
                    />
                    <InputError message={errors.name} />
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)} className="hover:cursor-pointer">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild className="hover:cursor-pointer">
                        <button type="submit">Tambah Varian</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
