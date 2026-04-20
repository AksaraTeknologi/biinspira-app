import { Skeleton } from '@/components/ui/skeleton';

export default function StatsSkeletonGrid() {
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
