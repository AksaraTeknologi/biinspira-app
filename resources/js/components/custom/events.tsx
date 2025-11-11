import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { useEffect, useRef, useState } from "react";
import { cn } from '@/lib/utils';

interface EventItem {
    id: number;
    date: string; // format YYYY-MM-DD
    name: string;
    detail: string;
    much_price: string;
    profile_pict: string;
    time: string;
    color: string;
}

const dummyEvents: EventItem[] = [
    {
        id: 1,
        date: "2025-11-11",
        name: "Smart Accounting",
        detail: "Laporan Pajak",
        much_price: "Rp2.000.000",
        profile_pict: "https://i.pravatar.cc/100?img=5",
        time: "21.05.18",
        color: "bg-green-500",
    },
    {
        id: 2,
        date: "2025-11-11",
        name: "Bispinira Pengeluaran - MA",
        detail: "Pembayaran Vendor",
        much_price: "Rp1.000.000",
        profile_pict: "https://i.pravatar.cc/100?img=1",
        time: "23.00.30",
        color: "bg-orange-500",
    },
    {
        id: 3,
        date: "2025-11-11",
        name: "Bisnis Proyek A",
        detail: "Meeting Client",
        much_price: "Rp500.000",
        profile_pict: "https://i.pravatar.cc/100?img=3",
        time: "08.00.00",
        color: "bg-red-500",
    },
    {
        id: 4,
        date: "2025-11-11",
        name: "Bisnis Proyek A",
        detail: "Meeting Client",
        much_price: "Rp500.000",
        profile_pict: "https://i.pravatar.cc/100?img=3",
        time: "08.00.00",
        color: "bg-red-500",
    },
];

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

interface EventsProps {
    className?: string;
}

export default function Events({ className }: EventsProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const today = new Date();
    const [days, setDays] = useState<Date[]>([]);
    const [selectedDate, setSelectedDate] = useState(today);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const hasLoadedLeft = useRef(false);
    const hasLoadedRight = useRef(false);

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    const generateDays = (center: Date, past: number, future: number) => {
        const arr: Date[] = [];
        for (let i = -past; i <= future; i++) {
            const d = new Date(center);
            d.setDate(center.getDate() + i);
            arr.push(d);
        }
        return arr;
    };

    const isSameDate = (a: Date, b: Date) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear();

    // 🔹 tampilkan 7 hari awal (hari ini di tengah)
    useEffect(() => {
        const initialDays = generateDays(today, 4, 4);
        setDays(initialDays);

        // scroll ke tengah (hari ini)
        setTimeout(() => {
            const container = containerRef.current;
            if (container) {
                const indexToday = initialDays.findIndex((d) => isSameDate(d, today));
                const itemWidth = 64; // perkiraan lebar tiap item
                const scrollTo =
                    indexToday * itemWidth - container.clientWidth / 2 + itemWidth / 2;
                container.scrollTo({ left: scrollTo });
            }
        }, 100);
    }, []);

    // 🔸 Lazy load saat user scroll ke ujung kiri/kanan
    const handleScroll = () => {
        const container = containerRef.current;
        if (!container) return;

        const nearLeft = container.scrollLeft < 50;
        const nearRight =
            container.scrollWidth - container.scrollLeft - container.clientWidth < 50;

        // ⬅️ tambah tanggal ke kiri
        if (nearLeft && !hasLoadedLeft.current) {
            hasLoadedLeft.current = true;
            const first = days[0];
            const more = generateDays(first, 7, 0);
            setDays((prev) => [...more.slice(0, 7), ...prev]);
            container.scrollLeft += 300; // biar posisi nggak loncat
            setTimeout(() => (hasLoadedLeft.current = false), 500); // reset flag
        }

        // ➡️ tambah tanggal ke kanan
        if (nearRight && !hasLoadedRight.current) {
            hasLoadedRight.current = true;
            const last = days[days.length - 1];
            const more = generateDays(last, 0, 7);
            setDays((prev) => [...prev, ...more.slice(1, 8)]);
            setTimeout(() => (hasLoadedRight.current = false), 500);
        }
    };

    const filteredEvents = dummyEvents.filter((e) =>
        isSameDate(new Date(e.date), selectedDate)
    );

    return (
        <Card className={`${className}`}>
            <CardHeader>
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col ">
                        <p className="0 text-base font-semibold">Data Keuangan Iklan User</p>
                        <span className="text-[12px] font-extralight text-gray-400">pengaturan per bulan</span>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button className="rounded-full h-10 w-10"><Ellipsis /></Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(selected) => {
                                    if (selected) {
                                        setSelectedDate(selected);
                                        setDate(selected);

                                        const container = containerRef.current;
                                        if (container) {
                                            // cari index tanggal yang cocok di daftar
                                            const index = days.findIndex((d) => isSameDate(d, selected));

                                            // kalau tanggal belum ada (karena di luar range yang digenerate),
                                            // generate ulang tanggal agar tanggal itu muncul di tengah
                                            if (index === -1) {
                                                const newDays = generateDays(selected, 4, 4);
                                                setDays(newDays);

                                                // delay sedikit supaya render selesai dulu baru scroll
                                                setTimeout(() => {
                                                    const itemWidth = 64;
                                                    const scrollTo =
                                                        4 * itemWidth - container.clientWidth / 2 + itemWidth / 2; // hari ke-5 (tengah)
                                                    container.scrollTo({ left: scrollTo, behavior: "smooth" });
                                                }, 100);
                                            } else {
                                                // kalau sudah ada, scroll ke tengah posisi tanggal itu
                                                const itemWidth = 64;
                                                const scrollTo =
                                                    index * itemWidth - container.clientWidth / 2 + itemWidth / 2;
                                                container.scrollTo({ left: scrollTo, behavior: "smooth" });
                                            }
                                        }
                                    }
                                }}
                                className={cn(
                                    'rounded-xl p-2 text-sm',
                                    '[&_.rdp-months]:flex [&_.rdp-months]:gap-6',
                                    '[&_.rdp-head_cell]:text-xs [&_.rdp-head_cell]:font-medium [&_.rdp-head_cell]:text-zinc-500',
                                    '[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:rounded-lg [&_.rdp-day]:text-sm',
                                    '[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white',
                                    '[&_.rdp-day_range_middle]:bg-blue-100 [&_.rdp-day_range_middle]:text-zinc-800',
                                    '[&_.rdp-caption_label]:font-semibold [&_.rdp-caption_label]:text-zinc-700',
                                )}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="flex space-x-0 overflow-x-auto"
                    style={{ scrollbarWidth: "none" }}
                >
                    {days.map((day) => {
                        const isSelected = isSameDate(day, selectedDate);
                        return (
                            <div
                                key={day.toDateString()}
                                className="flex flex-col items-center flex-shrink-0 w-12"
                            >
                                <Button
                                    variant={isSelected ? "default" : "outline"}
                                    className={`rounded-full w-8 h-8 ${isSelected ? "bg-blue-600 text-white" : ""
                                        }`}
                                    onClick={() => setSelectedDate(day)}
                                >
                                    {day.getDate()}
                                </Button>
                                <p className="text-xs text-gray-500 mt-1">
                                    {dayNames[day.getDay()]}
                                </p>
                            </div>
                        );
                    })}
                </div>
                <div className="w-full border-t-1 overflow-x-auto mt-2" style={{ scrollbarWidth: "none" }}>
                    <div className="flex flex-row gap-4 min-w-max px-2 pt-2">
                        {filteredEvents.length > 0 ? (
                            filteredEvents.map((event) => (
                                <div key={event.id}>
                                    <div className={`flex flex-col items-center ${event.color} rounded-full px-4 py-3 text-white  h-63 w-17`}>
                                        <div className="transform rotate-270 text-sm font-medium min-w-[19vw]" >
                                            <p className="text-[11px] font-semibold">{event.name}</p>
                                            <p className="text-[10px] font-light">{event.detail}</p>
                                            <p className="text-[10px] font-semibold">{event.much_price}</p>
                                        </div>
                                        <img
                                            src={event.profile_pict}
                                            alt={event.name}
                                            className="w-10 h-10 mt-auto rounded-full border-2 border-white mb-2"
                                        />
                                    </div>
                                    <p className="text-[11px] text-center text-gray-400 py-2">{event.time}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic px-2">
                                Tidak ada event untuk tanggal ini.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}