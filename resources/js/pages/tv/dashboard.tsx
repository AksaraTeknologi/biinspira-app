import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Deferred, Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import PlatformDrilldownDialog from './components/platform-drilldown-dialog';
import { PlatformStatCardCarousel, PlatformStatCardGrid } from './components/platform-stat-cards';
import StatsSkeletonGrid from './components/stats-skeleton-grid';
import type { DashboardViewMode, DrilldownData, DrilldownMetric, PlatformStat, TvDashboardProps } from './types';
import { getTimeBasedMessage } from './utils';

export default function TvDashboard({ platformStats, generatedAt }: TvDashboardProps) {
    const [viewMode, setViewMode] = useState<DashboardViewMode>('grid');
    const [carouselApi, setCarouselApi] = useState<CarouselApi>();
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [drilldownOpen, setDrilldownOpen] = useState(false);
    const [drilldownLoading, setDrilldownLoading] = useState(false);
    const [drilldownError, setDrilldownError] = useState<string | null>(null);
    const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);

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

    const stats = useMemo(() => {
        const monthDirectionPriority: Record<PlatformStat['month_change_direction'], number> = {
            up: 3,
            flat: 2,
            down: 1,
        };

        return [...(platformStats ?? [])].sort((a, b) => {
            if (b.today !== a.today) {
                return b.today - a.today;
            }

            if (b.this_month !== a.this_month) {
                return b.this_month - a.this_month;
            }

            const monthDirectionDiff = monthDirectionPriority[b.month_change_direction] - monthDirectionPriority[a.month_change_direction];
            if (monthDirectionDiff !== 0) {
                return monthDirectionDiff;
            }

            if (b.month_change_percentage !== a.month_change_percentage) {
                return b.month_change_percentage - a.month_change_percentage;
            }

            return a.label.localeCompare(b.label, 'id-ID');
        });
    }, [platformStats]);

    const cornerMessage = getTimeBasedMessage(currentTime);

    const selectedPlatformLogo = useMemo(() => {
        if (!drilldownData) {
            return null;
        }

        return stats.find((item) => item.key === drilldownData.platform)?.logo ?? null;
    }, [drilldownData, stats]);

    const handleOpenDrilldown = async (platformKey: string, metric: DrilldownMetric) => {
        setDrilldownOpen(true);
        setDrilldownLoading(true);
        setDrilldownError(null);

        try {
            const params = new URLSearchParams({
                platform: platformKey,
                metric,
            });

            const response = await fetch(`/statistics/detail?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Gagal memuat rincian statistik.');
            }

            const data = (await response.json()) as DrilldownData;
            setDrilldownData(data);
        } catch (error) {
            setDrilldownData(null);
            setDrilldownError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data.');
        } finally {
            setDrilldownLoading(false);
        }
    };

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
                                            <PlatformStatCardGrid key={item.key} item={item} className="md:h-full" onOpenDetail={handleOpenDrilldown} />
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="carousel" className="mt-0">
                                    <div className="pb-3">
                                        <div className="rounded-3xl border border-white/40 bg-white/16 shadow-[0_14px_36px_rgba(15,23,42,0.25)] backdrop-blur-xl">
                                            <div className="m-4 hidden min-h-0 flex-col justify-center rounded-2xl border border-white/55 bg-white/88 p-5 text-center shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur md:flex">
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
                                                    <CarouselContent className="ml-0 h-full">
                                                        {stats.map((item) => (
                                                            <CarouselItem key={item.key} className="h-full basis-full px-4 pb-4">
                                                                <PlatformStatCardCarousel
                                                                    item={item}
                                                                    className="h-full"
                                                                    onOpenDetail={handleOpenDrilldown}
                                                                />
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

            <PlatformDrilldownDialog
                open={drilldownOpen}
                onOpenChange={setDrilldownOpen}
                loading={drilldownLoading}
                error={drilldownError}
                data={drilldownData}
                platformLogo={selectedPlatformLogo}
            />
        </>
    );
}
