import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Deferred, Head, router } from '@inertiajs/react';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';

type PlatformStat = {
    key: string;
    label: string;
    logo?: string | null;
    total: number;
    this_month: number;
    today: number;
    month_change_percentage: number;
    month_change_direction: 'up' | 'down' | 'flat';
    day_change_percentage: number;
    day_change_direction: 'up' | 'down' | 'flat';
};

interface TvDashboardProps {
    platformStats?: PlatformStat[];
    generatedAt: string;
}

type DashboardViewMode = 'grid' | 'carousel';

const MORNING_QUOTES = [
    'Selamat pagi! Mari fokus pada progres kecil yang konsisten hari ini. Hasil besar selalu berawal dari sana.',
    'Awali hari dengan semangat. Kerja yang tertata hari ini adalah investasi untuk hasil maksimal besok.',
    'Pagi yang produktif dimulai dari niat yang baik. Yuk, kita lanjutkan progres terbaik kita hari ini.',
    'Tetap tenang dan fokus. Menyelesaikan satu tugas dengan tuntas jauh lebih baik daripada banyak hal yang setengah jadi.',
];

const AFTERNOON_QUOTES = [
    'Semangat siang! Jaga ritme kerjanya, ya. Kualitas hasil kerja kita adalah cerminan dedikasi tim.',
    'Siang ini momen tepat untuk menyelesaikan prioritas utama dan memastikan semuanya berjalan sesuai rencana.',
    'Teruskan momentumnya. Sekecil apa pun progres yang kita buat siang ini, itu sangat berarti bagi tim.',
    'Tetap fokus hingga akhir sesi. Detail yang rapi akan membuat hasil akhir kita jauh lebih solid.',
];

const EVENING_QUOTES = [
    'Sudah sore, yuk mulai rapikan pekerjaan agar penutupan hari ini berjalan lancar.',
    'Waktu sore adalah saatnya mengecek detail terakhir supaya besok kita bisa mulai dengan lebih ringan.',
    'Jaga konsistensi sampai akhir hari. Finishing yang teliti selalu memberikan hasil yang berbeda.',
    'Sedikit lagi menuju selesai. Terima kasih sudah tetap kompak dan semangat sampai jam segini.',
];

const FAREWELL_QUOTES = [
    'Sampai jumpa besok! Terima kasih banyak atas kerja keras dan kontribusinya hari ini.',
    'Sampai jumpa. Selamat beristirahat, semoga besok kita kembali dengan energi yang lebih segar.',
    'Sampai jumpa, Tim. Hari ini sudah berjalan dengan sangat baik berkat bantuan kalian semua.',
    'Sampai jumpa besok pagi. Terima kasih sudah menjaga kualitas pekerjaan tetap oke sampai akhir hari.',
    'Sampai jumpa, great team. Selamat pulang dengan tenang, besok kita lanjutkan perjuangan lagi.',
    'Sampai jumpa! Good job untuk hari ini, selamat menikmati waktu istirahat bersama keluarga.',
    'Sampai bertemu besok, tetap jaga kesehatan dan tetap semangat, ya!',
];

function StatsSkeletonGrid() {
    return (
        <div className="grid grid-cols-1 gap-3 pb-3 md:grid-cols-2 lg:h-[calc(100%-84px)] lg:overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((card) => (
                <div key={card} className="flex min-h-0 flex-col rounded-2xl border border-white/55 bg-white/88 p-3.5 md:h-full">
                    <div className="mb-2.5 flex items-center justify-between">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                    <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-3">
                        {[1, 2, 3].map((box) => (
                            <div key={box} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                                <Skeleton className="mb-2 h-3 w-16" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="mt-2 h-6 w-28 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function ChangeBadge({ percentage, direction, label }: { percentage: number; direction: 'up' | 'down' | 'flat'; label: string }) {
    const styles =
        direction === 'up'
            ? 'border-emerald-300/60 bg-emerald-100 text-emerald-700'
            : direction === 'down'
              ? 'border-rose-300/60 bg-rose-100 text-rose-700'
              : 'border-slate-300/70 bg-slate-100 text-slate-700';

    const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : ArrowRight;
    const text = direction === 'flat' ? 'Stabil' : `${percentage.toFixed(2)}%`;

    return (
        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold ${styles}`}>
            <Icon className="h-3 w-3" />
            <span>
                {label}: {text}
            </span>
        </div>
    );
}

function getDayOfYear(date: Date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();

    return Math.floor(diff / 86400000);
}

function pickMessageByDay(messages: string[], date: Date) {
    return messages[getDayOfYear(date) % messages.length];
}

function getTimeBasedMessage(date: Date) {
    const hour = date.getHours();

    if (hour < 11) {
        return {
            emoji: '🌅',
            title: 'Selamat Pagi',
            message: pickMessageByDay(MORNING_QUOTES, date),
        };
    }

    if (hour < 15) {
        return {
            emoji: '☀️',
            title: 'Selamat Siang',
            message: pickMessageByDay(AFTERNOON_QUOTES, date),
        };
    }

    if (hour < 16) {
        return {
            emoji: '🌇',
            title: 'Selamat Sore',
            message: pickMessageByDay(EVENING_QUOTES, date),
        };
    }

    return {
        emoji: '👋',
        title: 'Waktunya Pulang',
        message: pickMessageByDay(FAREWELL_QUOTES, date),
    };
}

function PlatformStatCardGrid({ item, className }: { item: PlatformStat; className?: string }) {
    return (
        <div
            className={cn(
                'flex min-h-0 flex-col rounded-2xl border border-white/55 bg-white/88 p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur',
                className,
            )}
        >
            <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-800">{item.label}</h2>
                <div className="flex min-h-9 items-center justify-end">
                    {item.logo ? (
                        <img src={item.logo} alt={item.label} className="max-h-9 w-auto max-w-28 object-contain" />
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white">
                            <span className="text-xs font-bold text-slate-600">{item.label.slice(0, 2).toUpperCase()}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total</p>
                    <p className="text-xl leading-tight font-bold text-slate-800 lg:text-2xl">{formatCurrency(item.total)}</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Bulan Ini</p>
                    <p className="text-xl leading-tight font-bold text-slate-800 lg:text-2xl">{formatCurrency(item.this_month)}</p>
                    <div className="mt-1.5">
                        <ChangeBadge percentage={item.month_change_percentage} direction={item.month_change_direction} label="vs bulan lalu" />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Hari Ini</p>
                    <p className="text-xl leading-tight font-bold text-slate-800 lg:text-2xl">{formatCurrency(item.today)}</p>
                    <div className="mt-1.5">
                        <ChangeBadge percentage={item.day_change_percentage} direction={item.day_change_direction} label="vs kemarin" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlatformStatCardCarousel({ item, className }: { item: PlatformStat; className?: string }) {
    return (
        <div
            className={cn(
                'flex h-full min-h-0 flex-col rounded-2xl border border-white/55 bg-white/88 p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur',
                className,
            )}
        >
            <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-800">{item.label}</h2>
                <div className="flex min-h-9 items-center justify-end">
                    {item.logo ? (
                        <img src={item.logo} alt={item.label} className="max-h-9 w-auto max-w-28 object-contain" />
                    ) : (
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white">
                            <span className="text-xs font-bold text-slate-600">{item.label.slice(0, 2).toUpperCase()}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2.5">
                <div className="col-span-2 flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total</p>
                    <p className="text-[clamp(1.5rem,2.1vw,2.4rem)] leading-tight font-bold tracking-tight text-slate-800">
                        {formatCurrency(item.total)}
                    </p>
                </div>

                <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Bulan Ini</p>
                    <p className="text-[clamp(1.3rem,1.6vw,2rem)] leading-tight font-bold tracking-tight text-slate-800">
                        {formatCurrency(item.this_month)}
                    </p>
                    <div className="mt-auto pt-2">
                        <ChangeBadge percentage={item.month_change_percentage} direction={item.month_change_direction} label="vs bulan lalu" />
                    </div>
                </div>

                <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Hari Ini</p>
                    <p className="text-[clamp(1.3rem,1.6vw,2rem)] leading-tight font-bold tracking-tight text-slate-800">
                        {formatCurrency(item.today)}
                    </p>
                    <div className="mt-auto pt-2">
                        <ChangeBadge percentage={item.day_change_percentage} direction={item.day_change_direction} label="vs kemarin" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TvDashboard({ platformStats, generatedAt }: TvDashboardProps) {
    const [viewMode, setViewMode] = useState<DashboardViewMode>('grid');
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentTime, setCurrentTime] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => {
            router.reload({
                only: ['platformStats', 'generatedAt'],
            });
        }, 300000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (viewMode !== 'carousel' || !carouselApi) {
            return;
        }

        const timer = window.setInterval(() => {
            if (carouselApi.canScrollNext()) {
                carouselApi.scrollNext();
                return;
            }

            carouselApi.scrollTo(0);
        }, 4500);

        return () => window.clearInterval(timer);
    }, [viewMode, carouselApi]);

    const stats = platformStats ?? [];
    const cornerMessage = getTimeBasedMessage(currentTime);
    const handleViewModeChange = (value: string) => {
        if (value === 'grid' || value === 'carousel') {
            setViewMode(value);
        }
    };

    return (
        <>
            <Head title="Statistik TV" />
            <div className="min-h-screen overflow-y-auto bg-[url('/assets/images/auth-bg.webp')] bg-cover bg-center md:h-screen md:overflow-hidden">
                <div className="min-h-screen w-full bg-slate-900/18 px-4 py-4 backdrop-blur-[1px] sm:px-6 sm:py-5 lg:h-full lg:px-8 lg:py-6">
                    <Tabs value={viewMode} onValueChange={handleViewModeChange} className="h-full">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs tracking-[0.28em] text-slate-100/90 uppercase">LIVE MONITORING BIINSPIRA GROUP</p>
                                <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-5xl">
                                    Pendapatan Tiap Platform
                                </h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <TabsList className="h-auto rounded-full border border-white/45 bg-white/20 p-1 text-white">
                                    <TabsTrigger
                                        value="grid"
                                        className="h-7 rounded-full px-3 text-xs font-medium text-white data-[state=active]:bg-white/30 data-[state=active]:text-white"
                                    >
                                        Grid
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="carousel"
                                        className="h-7 rounded-full px-3 text-xs font-medium text-white data-[state=active]:bg-white/30 data-[state=active]:text-white"
                                    >
                                        Carousel
                                    </TabsTrigger>
                                </TabsList>

                                <p className="rounded-full border border-white/45 bg-white/20 px-3 py-1.5 text-xs font-medium text-white sm:text-sm">
                                    Update: {new Date(generatedAt).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>

                        <Deferred data="platformStats" fallback={<StatsSkeletonGrid />}>
                            <>
                                <TabsContent value="grid" className="mt-0">
                                    <div className="grid grid-cols-1 gap-3 pb-3 md:grid-cols-2 lg:h-[calc(100%-84px)] lg:overflow-hidden">
                                        {stats.length > 0 && stats.length % 2 === 1 ? (
                                            <div className="hidden min-h-0 flex-col justify-center rounded-2xl border border-white/55 bg-white/88 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur md:flex">
                                                <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">Daily Message ✨</p>
                                                <h3 className="mt-2 text-4xl font-bold tracking-tight text-slate-800">
                                                    {cornerMessage.emoji} {cornerMessage.title}
                                                </h3>
                                                <p className="mt-3 max-w-[44ch] text-lg leading-relaxed text-slate-700">{cornerMessage.message}</p>
                                            </div>
                                        ) : null}

                                        {stats.map((item) => (
                                            <PlatformStatCardGrid key={item.key} item={item} className="md:h-full" />
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="carousel" className="mt-0">
                                    <div className="pb-3">
                                        <div className="rounded-3xl border border-white/40 bg-white/16 shadow-[0_14px_36px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                                            <div className="hidden min-h-0 flex-col justify-center rounded-2xl border border-white/55 bg-white/88 p-5 m-4 text-center shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur md:flex">
                                                <p className="text-xs font-semibold tracking-[0.22em] text-slate-500 uppercase">Daily Message ✨</p>
                                                <h3 className="mt-2 text-4xl font-bold tracking-tight text-slate-800">
                                                    {cornerMessage.emoji} {cornerMessage.title}
                                                </h3>
                                                <p className="mx-auto mt-3 max-w-[44ch] text-lg leading-relaxed text-slate-700">
                                                    {cornerMessage.message}
                                                </p>
                                            </div>

                                            <div className="mt-3">
                                                <Carousel setApi={setCarouselApi} opts={{ loop: true, align: 'start' }} className="h-full">
                                                    <CarouselContent className="-ml-0 h-full">
                                                        {stats.map((item) => (
                                                            <CarouselItem key={item.key} className="h-full basis-full px-4 pb-4">
                                                                <PlatformStatCardCarousel item={item} className="h-full" />
                                                            </CarouselItem>
                                                        ))}
                                                    </CarouselContent>
                                                </Carousel>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </>
                        </Deferred>
                    </Tabs>
                </div>
            </div>
        </>
    );
}
