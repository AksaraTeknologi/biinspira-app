'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  avatar: z
    .any()
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      "Ukuran file maksimal 2MB"
    )
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Format file harus JPG, JPEG, PNG, atau WEBP"
    ),
});

interface User {
    id: string;
    name: string;
    email: string;
}

type FormData = z.infer<typeof schema>;

export function AddUserModal({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const { users } = usePage<{ users: User[] }>().props;
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      avatar: null,
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // CEK VALIDASI FRONTEND
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Format file harus JPG, JPEG, PNG, atau WEBP");
      return;
    }

    // Set value ke form
    form.setValue('avatar', file);

    // Preview
    setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    const payload = new FormData();
    payload.append("name", data.name);
    payload.append("email", data.email);

    if (data.avatar instanceof File) {
      payload.append("avatar", data.avatar);
    }

    router.post(route('admin.users.store'), payload, {
      forceFormData: true,
      onSuccess: () => {
        toast.success('User berhasil ditambahkan');
        setOpen(false);
        form.reset();
        setPreview(null);
        setIsLoading(false);
        onSuccess?.();
      },
      onError: (errors) => {
        toast.error(errors?.name || errors?.email || 'Gagal menambahkan user');
        setIsLoading(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="gap-2 bg-primary hover:bg-blue-700
            dark:bg-background dark:hover:bg-blue-900 dark:border dark:border-primary"
        >
          <Plus className="h-4 w-4" /> Tambah User
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah User Baru</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
            encType="multipart/form-data"
          >
            {/* NAMA */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* EMAIL */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Masukkan email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AVATAR */}
            <FormField
              control={form.control}
              name="avatar"
              render={() => (
                <FormItem>
                  <FormLabel>Avatar (opsional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </FormControl>

                  {preview && (
                    <img
                      src={preview}
                      className="w-24 h-24 rounded-full mt-3 object-cover border"
                    />
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
