import AppLogoIcon from '@/components/app-logo-icon';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative grid h-dvh flex-col items-center justify-center bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="w-full lg:p-8">
                <div className="relative mx-auto flex w-full flex-col justify-center space-y-6 overflow-hidden rounded-3xl border border-white/30 bg-white/20 p-8 shadow-lg backdrop-blur-xl sm:w-[450px]">
                    <Link href={route('home')} className="relative z-20 mb-10 flex items-center gap-2">
                        <AppLogoIcon className="h-12 fill-current text-black dark:text-white" />
                        <div>
                            <h3 className="text-lg font-semibold text-secondary-foreground">Biinspira</h3>
                            <p className="text-sm font-semibold text-secondary-foreground">Monitoring App</p>
                        </div>
                    </Link>

                    <div className="relative z-20 flex flex-col items-start text-left">
                        <h1 className="text-2xl font-semibold text-secondary-foreground">{title}</h1>
                        <p className="text-sm text-secondary-foreground">{description}</p>
                    </div>

                    <div className="relative z-20">{children}</div>
                </div>
            </div>
            <div className="relative m-10 hidden h-11/12 flex-col rounded-3xl border border-white/30 bg-white/20 p-10 shadow-lg backdrop-blur-2xl lg:flex dark:border-white/10">
                <div className="z-20 flex h-full flex-col justify-center gap-5 text-lg font-medium">
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold text-secondary-foreground lg:text-5xl">Halo</h1>
                        <h1 className="text-3xl font-bold text-secondary-foreground lg:text-5xl">Tim Biinspira</h1>
                        <h1 className="text-3xl font-bold text-secondary-foreground lg:text-5xl">Group! 👋🏻</h1>
                    </div>
                    <p className="max-w-md text-sm text-secondary-foreground lg:text-base">
                        Pantau dan kelola seluruh aktivitas bisnis Anda mulai dari iklan, afiliasi, hingga keuangan dalam satu platform.
                    </p>
                    <p className="absolute inset-x-0 bottom-6 mx-auto w-max text-xs text-muted-foreground">
                        ©2025 Biinspira Group. Hak Cipta Dilindungi
                    </p>
                </div>
                <img src="/assets/images/logo.webp" alt="Logo Biinspira" className="absolute right-0 w-[350px] blur-lg" />
            </div>
        </div>
    );
}
