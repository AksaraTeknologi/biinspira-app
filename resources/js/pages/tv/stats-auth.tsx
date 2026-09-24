import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function TvStatsAuth() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        remember: false, // Tidak otomatis ceklis
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('tv.stats.auth.submit'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Akses Statistik - Biinspira Monitoring App" />

            <div className="relative flex min-h-screen w-full items-center justify-center bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center p-4 sm:p-8">
                {/* Centered glassmorphic card */}
                <div className="relative mx-auto flex w-full max-w-[450px] flex-col justify-center space-y-6 overflow-hidden rounded-3xl border border-white/40 bg-white/25 p-8 shadow-xl backdrop-blur-2xl">
                    {/* Header Logo & Brand */}
                    <div className="relative z-20 mb-2 flex items-center gap-3">
                        <AppLogoIcon />
                        <div>
                            <h3 className="text-lg font-bold text-black leading-tight">Biinspira</h3>
                            <p className="text-sm font-semibold text-black/80">Monitoring App</p>
                        </div>
                    </div>

                    {/* Title & Description in black text */}
                    <div className="relative z-20 flex flex-col items-start text-left">
                        <h1 className="text-2xl font-bold tracking-tight text-black">Akses Statistik</h1>
                        <p className="mt-1 text-sm font-medium text-black/80 leading-relaxed">
                            Masukkan Password Admin untuk membuka tampilan statistik
                        </p>
                    </div>

                    {/* Form */}
                    <form className="relative z-20 flex flex-col gap-6" onSubmit={submit}>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    Password Admin
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Masukkan password admin"
                                        className="border-secondary-foreground focus-visible:border-secondary-foreground focus-visible:ring-[1.5px] focus-visible:ring-secondary-foreground"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-black/70 hover:text-black transition"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Checkbox: unchecked by default */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', checked === true)}
                                    tabIndex={2}
                                    className="border-black/50 data-[state=checked]:bg-[#2563eb] data-[state=checked]:border-[#2563eb]"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer text-xs leading-tight select-none"
                                >
                                    Ingat di perangkat ini
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-11 w-full transition"
                                tabIndex={3}
                                disabled={processing || !data.password.trim()}
                            >
                                {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                Buka Statistik
                            </Button>
                        </div>

                        {/* Back to Login link in black text */}
                        <div className="text-center text-sm text-black/70">
                            <Link
                                href={route('login')}
                                tabIndex={4}
                                className="hover:text-black hover:underline"
                            >
                                Kembali ke Halaman Login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>

            <Toaster position="top-center" richColors />
        </>
    );
}
