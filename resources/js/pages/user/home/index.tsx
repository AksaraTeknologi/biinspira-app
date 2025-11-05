import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';

interface HomeProps {
    home_item: string;
}

export default function Home({ home_item }: HomeProps) {
    return (
        <UserLayout>
            <Head title="Biinspira Monitoring App" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Home</h1>
                    <p className="text-sm text-muted-foreground">Selamat datang di halaman utama</p>
                </div>
            </div>
        </UserLayout>
    );
}
