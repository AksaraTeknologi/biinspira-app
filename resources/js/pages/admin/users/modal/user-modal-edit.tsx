'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Eye, EyeOff, Pencil } from "lucide-react";

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

// VALIDASI FILE
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z
  .object({
    name: z.string().min(2, 'Nama user minimal 2 karakter'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().optional(),
    confirm_password: z.string().optional(),
    avatar: z
      .any()
      .optional()
      .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        "Ukuran file maksimal 2MB"
      )
      .refine(
        (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
        "Format file harus berupa gambar JPG, PNG, atau WEBP"
      ),
  })
  .refine((data) => {
    if (data.password && data.password.length < 8) return false;
    return true;
  }, {
    message: "Password minimal 8 karakter",
    path: ["password"],
  })
  .refine((data) => {
    if (data.password !== data.confirm_password) return false;
    return true;
  }, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export function EditUserModal({ user, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(user.avatar_url ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      email: user.email,
      password: '',
      confirm_password: '',
      avatar: null,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    const payload = new FormData();
    payload.append("name", data.name);
    payload.append("email", data.email);

    if (data.password) payload.append("password", data.password);

    if (data.avatar instanceof File) {
      payload.append("avatar", data.avatar);
    }

    router.post(route("admin.users.update", { id: user.id }), payload, {
      forceFormData: true,
      onSuccess: () => {
        toast.success("User berhasil diperbarui");
        setOpen(false);
        setIsLoading(false);
        onSuccess?.();
      },
      onError: (errors) => {
        toast.error(errors.name || "Gagal memperbarui user");
        setIsLoading(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Pencil className="h-4 w-4 cursor-pointer" />
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">

            {/* Nama */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama user" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Masukkan email user" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password baru"
                        {...field}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Ulangi password"
                        {...field}
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Avatar + Preview */}
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        field.onChange(file);

                        // CEK VALIDASI DI FRONTEND
                        if (file) {
                          if (file.size > MAX_FILE_SIZE) {
                            toast.error("Ukuran file maksimal 2MB");
                            return;
                          }

                          if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                            toast.error("Format file harus JPG, PNG, atau WEBP");
                            return;
                          }

                          setPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </FormControl>

                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full mt-2 object-cover border"
                    />
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
