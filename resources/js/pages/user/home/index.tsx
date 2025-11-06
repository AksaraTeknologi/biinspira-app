import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';

interface HomeProps {
    home_item: string;
}

export default function Home({ home_item }: HomeProps) {
    return (
        <UserLayout>
            <Head title="Biinspira Monitoring App" />

            <div className="mt-20 flex flex-1 flex-col items-center">
                <div className="w-full max-w-7xl px-4 md:px-6 flex flex-col gap-6">
                    <h1 className="text-2xl font-semibold">Home</h1>
                    <p className="text-sm text-muted-foreground">
                        Selamat datang di halaman utama
                    </p>
                </div>
            </div>
        </UserLayout>
    );
}
