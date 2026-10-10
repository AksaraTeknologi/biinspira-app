// Components
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm<Required<{ email: string }>>({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <AuthLayout title="Lupa Kata Sandi" description="Masukkan email akun Anda untuk menerima tautan pengaturan ulang kata sandi">
            <Head title="Lupa Kata Sandi" />

            {status && (
                <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3.5 text-center text-sm font-medium text-green-700 dark:text-green-400">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <form onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Masukkan email Anda"
                            className="border-secondary-foreground focus-visible:border-secondary-foreground focus-visible:ring-[1.5px] focus-visible:ring-secondary-foreground"
                        />

                        <InputError message={errors.email} />
                    </div>

                    <div className="my-6 flex items-center justify-start">
                        <Button className="w-full transition" disabled={processing}>
                            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            Kirim Tautan Reset Password
                        </Button>
                    </div>
                </form>

                <div className="space-x-1 text-center text-sm text-muted-foreground">
                    <span>Kembali ke halaman</span>
                    <TextLink href={route('login')} className="font-medium text-primary hover:underline">
                        Login
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
