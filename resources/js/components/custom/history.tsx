import { Ellipsis } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { cn } from '@/lib/utils';

interface HistoryItem {
    id: number;
    date: string; // format YYYY-MM-DD
    user_name: string;
    event_name: string;
    amount: string;
    avatar: string;
    time: string;
    color: string;
}

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const weekNames = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 5", "Minggu 6"];

interface HistorisProps {
    className?: string;
    dataHistoris: HistoryItem[];
}

export default function History({ className, dataHistoris }: HistorisProps) {
    // ---------------------------------------------------
    //  State utama
    // ---------------------------------------------------
    const today = new Date();

    // --- Hitung minggu keberapa sebuah tanggal berada ---
    const getWeekOfMonth = (date: Date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const dayOfWeek = firstDay.getDay() || 7;
        return Math.ceil((date.getDate() + dayOfWeek - 1) / 7);
    };

    const currentWeek = getWeekOfMonth(today) - 1;
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedWeek, setSelectedWeek] = useState(currentWeek); // 0-based
    const [selectedDate, setSelectedDate] = useState(today);
    const [weekDays, setWeekDays] = useState<Date[]>([]);

    // --- Dapatkan semua bulan yang punya data ---
    const monthsWithData = Array.from(
        new Set(
            dataHistoris.map((e) => new Date(e.date).getMonth())
        )
    ).sort((a, b) => a - b);

    // --- Buat array minggu (1–n) dalam bulan tertentu ---
    const getWeeksInMonth = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const weeks = getWeekOfMonth(lastDay);
        return Array.from({ length: weeks }, (_, i) => i + 1);
    };

    // --- Hitung hari di minggu tertentu ---
    const getDaysOfWeek = (year: number, month: number, weekIndex: number) => {
        const firstDay = new Date(year, month, 1);
        const firstDayOfWeek = firstDay.getDay() || 7;
        const startDay = 1 + weekIndex * 7 - (firstDayOfWeek - 1);
        const days: Date[] = [];

        for (let i = 0; i < 7; i++) {
            const d = new Date(year, month, startDay + i);
            days.push(d);
        }

        return days;
    };

    // --- Regenerate tanggal setiap kali bulan/minggu berubah ---
    useEffect(() => {
        const year = today.getFullYear();
        const days = getDaysOfWeek(year, selectedMonth, selectedWeek);
        setWeekDays(days);

        // Jika tanggal aktif tidak termasuk minggu baru, reset ke hari pertama minggu itu
        if (!days.some((d) => d.toDateString() === selectedDate.toDateString())) {
            setSelectedDate(days[0]);
        }
    }, [selectedMonth, selectedWeek]);

    // --- Filter event sesuai tanggal yang dipilih ---
    const filteredHistoris = dataHistoris.filter((e) => {
        const d = new Date(e.date);
        return (
            d.getFullYear() === selectedDate.getFullYear() &&
            d.getMonth() === selectedDate.getMonth() &&
            d.getDate() === selectedDate.getDate()
        );
    });

    // --- Jumlah minggu pada bulan aktif ---
    let weeksInMonth = getWeeksInMonth(today.getFullYear(), selectedMonth);

    // ✅ update: kalau bulan yang dipilih adalah bulan ini, maka batasi minggu sampai minggu saat ini
    if (selectedMonth === today.getMonth()) {
        weeksInMonth = weeksInMonth.filter((_, i) => i <= currentWeek);
    }

    return (
        <Card className={`${className}`}>
            <CardHeader>
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col ">
                        <p className="0 text-lg font-semibold">Aktifitas Pengguna Terbaru</p>
                        <span className="text-[11px] font-extralight text-gray-400">Pantau aktifitas terbaru dari setiap akun</span>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="rounded-full h-10 w-10"><Ellipsis /></Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto rounded-2xl border dark:border-muted-foreground bg-background p-4 shadow-lg" align="end">
                            <div className="flex flex-col gap-2 w-40">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Bulan</p>
                                    <Select
                                        defaultValue={selectedMonth.toString()}
                                        onValueChange={(value) => {
                                            setSelectedMonth(parseInt(value));
                                            setSelectedWeek(0);
                                        }}>
                                        <SelectTrigger>{monthNames[selectedMonth]}</SelectTrigger>
                                        <SelectContent>
                                            {monthsWithData.map((m) => (
                                                <SelectItem key={m} value={m.toString()}>
                                                    {monthNames[m]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Minggu</p>
                                    <Select
                                        defaultValue={selectedWeek.toString()}
                                        onValueChange={(value) => setSelectedWeek(parseInt(value))}
                                    >
                                        <SelectTrigger>{weekNames[selectedWeek]}</SelectTrigger>
                                        <SelectContent>
                                            {weeksInMonth.map((w, i) => (
                                                <SelectItem key={i} value={i.toString()}>
                                                    Minggu {w}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </CardHeader>
            <CardContent>
                {/* days */}
                <div className="flex justify-between w-full overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                    {weekDays.map((day) => {
                        const isSelected =
                            day.getDate() === selectedDate.getDate() &&
                            day.getMonth() === selectedDate.getMonth();
                        const isCurrentMonth = day.getMonth() === selectedMonth;

                        let variant: "default" | "outline" | "ghost" = "outline";
                        if (isSelected) variant = "default";
                        else if (!isCurrentMonth) variant = "ghost";

                        return (
                            <div
                                key={day.toDateString()}
                                className="flex flex-col items-center flex-shrink-0 w-12"
                            >
                                <Button
                                    variant={variant}
                                    className={`${variant === "ghost" ? "text-gray-300" : ""} rounded-full w-8 h-8`}
                                    onClick={() => setSelectedDate(day)}
                                >
                                    {day.getDate()}
                                </Button>
                                <p className={`${variant === "ghost" ? "text-gray-300" : ""} text-xs mt-1`}>
                                    {dayNames[day.getDay()]}
                                </p>
                            </div>
                        );
                    })}
                </div>
                {/* detail history */}
                <div
                    className="w-full border-t mt-3 overflow-x-auto"
                    style={{ scrollbarWidth: "none" }}
                >
                    <div className="flex flex-row gap-4 min-w-max px-2 pt-2">
                        {filteredHistoris.length > 0 ? (
                            filteredHistoris.map((h) => (
                                <div key={h.id}>
                                    <div className={cn(
                                        "flex flex-col items-center rounded-full px-2 py-3 text-white h-63 w-17",
                                        h.color
                                    )}>
                                        <div className="relative h-50 w-full">
                                            <div className="transform rotate-270 text-sm font-medium absolute bottom-12.5 -right-13.5 w-40">
                                                <p className="text-base font-semibold">{h.user_name}</p>
                                                <p className="text-[11px] font-light">{h.event_name}</p>
                                                <p className="text-[13px] font-semibold">
                                                    Rp {(parseInt(h.amount.replace(/\D/g, ''), 10) || 0).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                        {h.avatar ? (
                                            // Jika ADA avatar → tampilkan gambar (pakai wrapper untuk memastikan lingkaran)
                                            <div className="w-10 h-10 mt-3 mb-2 rounded-full ring-2 ring-white overflow-hidden flex-shrink-0">
                                                <img
                                                    src={`/storage/${h.avatar}`}
                                                    alt={h.user_name}
                                                    className="w-full h-full object-cover object-center block"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            // Jika TIDAK ada avatar → tampilkan initial
                                            <div
                                                className="
                                                    w-10 h-10 mt-3 mb-2 rounded-full flex-shrink-0
                                                    flex items-center justify-center bg-gray-700 text-white
                                                    ring-2 ring-white text-base font-semibold overflow-hidden
                                                "
                                            >
                                                <span className="select-none">
                                                    {h.user_name ? h.user_name.charAt(0).toUpperCase() : "?"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-center text-gray-400 py-2">
                                        {h.time}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic px-2">
                                Tidak ada history untuk tanggal ini.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}
