import { Skeleton } from '@/components/ui/skeleton';

export default function StatsSkeletonGrid() {
    return (
        <div className="mt-0 flex flex-1 flex-col min-h-0 overflow-y-auto lg:overflow-hidden lg:justify-between">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto pr-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
                    <div
                        key={card}
                        className="flex min-h-30 md:h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/55 bg-white/88 p-2 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur xl:p-2.5"
                    >
                        <div className="mb-1 flex items-center justify-between gap-2 shrink-0">
                            <Skeleton className="h-5 w-32 xl:h-6 xl:w-40 rounded" />
                            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                        </div>

                        <div className="grid flex-1 grid-cols-1 gap-1.5 min-h-0 overflow-hidden sm:grid-cols-3">
                            <div className="flex min-w-0 min-h-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 xl:p-2">
                                <Skeleton className="h-3 w-20 rounded" />
                                <Skeleton className="my-1 h-5 w-full rounded xl:h-6" />
                                <div className="h-4 w-12" aria-hidden="true" />
                            </div>

                            <div className="flex min-w-0 min-h-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 xl:p-2">
                                <Skeleton className="h-3 w-16 rounded" />
                                <Skeleton className="my-1 h-5 w-full rounded xl:h-6" />
                                <Skeleton className="h-4 w-14 rounded-full" />
                            </div>

                            <div className="flex min-w-0 min-h-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 xl:p-2">
                                <Skeleton className="h-3 w-14 rounded" />
                                <Skeleton className="my-1 h-5 w-full rounded xl:h-6" />
                                <Skeleton className="h-4 w-14 rounded-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Group Summary Bar Skeleton */}
            <div className="mt-3 grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-3">
                {[1, 2, 3].map((item) => (
                    <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-white/55 bg-white/88 p-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur xl:p-3"
                    >
                        <Skeleton className="h-10 w-10 shrink-0 rounded-xl xl:h-11 xl:w-11" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <Skeleton className="h-3 w-28 rounded xl:h-3.5" />
                            <Skeleton className="h-5 w-36 rounded xl:h-6" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
