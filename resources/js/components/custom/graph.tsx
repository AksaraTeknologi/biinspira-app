import { Bar, ResponsiveContainer, XAxis, Tooltip, Line, CartesianGrid, YAxis, ComposedChart } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCallback, useMemo, useState } from "react";

interface RawData {
    month: string;
    pengeluaran: number;
    pendapatan: number;
}

interface GrafikPendapatanProps {
    className?: string;
    RawData: RawData[];
}

export default function GrafikPendapatan({ className, RawData }: GrafikPendapatanProps) {

    const [mode, setMode] = useState<"bulanan" | "mingguan">("bulanan");
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    function toFullMonthName(input: string) {
        if (!input) return '';
        const s = input.toString().trim().toLowerCase();
        const map: Record<string, string> = {
            jan: 'Januari', feb: 'Februari', mar: 'Maret', apr: 'April', may: 'Mei',
            jun: 'Juni', jul: 'Juli', aug: 'Agustus', sep: 'September', oct: 'Oktober',
            nov: 'November', dec: 'Desember'
        };

        return map[s.slice(0, 3)] || input;
    }
    
    function toMonthName(input: string) {
        if (!input) return '';
        const s = input.toString().trim().toLowerCase();
        const map: Record<string, string> = {
            jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May',
            jun: 'Jun', jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct',
            nov: 'Nov', dec: 'Dec'
        };

        return map[s.slice(0, 3)] || input;
    }

    // Hitung kenaikan default (bulan terakhir)
    // rumus perhitungan: ((pendapatan bulan ini - pendapatan bulan lalu) / pendapatan bulan lalu) * 100
    const defaultIncrease =
        RawData.length > 1
            ? parseFloat((
                ((RawData[RawData.length - 1].pendapatan -
                    RawData[RawData.length - 2].pendapatan) /
                    RawData[RawData.length - 2].pendapatan) *
                100
            ).toFixed(2))
            : 0;

    // ambil data bulan terakhir dari rawData
    const lastRaw = RawData.length > 0 ? RawData[RawData.length - 1].month : "";
    const lastMonth = toFullMonthName(lastRaw);

    // ===============================
    // 🔁 Transformasi data mingguan
    // ===============================
    const weeklyData = useMemo(() => {
        if (RawData.length === 0) return [];

        // Ambil bulan terakhir
        const last = RawData[RawData.length - 1];

        // Simulasi 4 minggu (contoh: total dibagi 4 minggu)
        // nanti bisa disesuaikan kalau backend sudah support mingguan
        const avgPendapatan = last.pendapatan / 4;
        const avgPengeluaran = last.pengeluaran / 4;

        return Array.from({ length: 4 }).map((_, i) => ({
            week: `Minggu ke-${i + 1}`,
            pendapatan: Math.round(avgPendapatan * (0.8 + Math.random() * 0.4)), // variasi acak kecil biar realistis
            pengeluaran: Math.round(avgPengeluaran * (0.8 + Math.random() * 0.4)),
        }));
    }, [RawData]);


    // ===============================
    // 🔄 Tentukan data final untuk grafik
    // ===============================
    const data = useMemo(() => {
        if (mode === "mingguan") {
            return weeklyData.map((d) => ({
                month: d.week,
                PendapatanHeight: d.pendapatan,
                Pendapatan: d.pendapatan,
                PengeluaranHeight: d.pengeluaran,
                Pengeluaran: d.pengeluaran,
                EfisiensiH: d.pendapatan + d.pengeluaran,
                Efisiensi: d.pengeluaran - d.pendapatan,
            }));
        }
        return RawData.map((d) => ({
            month: toMonthName(d.month),
            PendapatanHeight: d.pendapatan,
            Pendapatan: d.pendapatan,
            PengeluaranHeight: d.pengeluaran,
            Pengeluaran: d.pengeluaran,
            // EfisiensiH: ((d.pendapatan - (d.pendapatan - d.pengeluaran)) + d.pengeluaran) / 2,
            EfisiensiH: d.pendapatan + d.pengeluaran,
            Efisiensi: d.pengeluaran - d.pendapatan,
        }));
    }, [mode, RawData, weeklyData]);

    // 🧠 fungsi untuk menghitung persentase berdasarkan klik
    const handleBarClick = useCallback(
        (data: any, index: number) => {
            if (index === 0) return; // tidak bisa hitung untuk bulan pertama
            setSelectedIndex(index);
        },
        [setSelectedIndex]
    );

    // ambil data yang dipilih
    const selectedData =
        selectedIndex !== null && selectedIndex > 0
            ? {
                current:
                    mode === "mingguan"
                        ? weeklyData[selectedIndex]
                        : RawData[selectedIndex],
                previous:
                    mode === "mingguan"
                        ? weeklyData[selectedIndex - 1]
                        : RawData[selectedIndex - 1],
            }
            : null;

    const percentageIncrease = selectedData
        ? parseFloat(
            (
                ((selectedData.current.pendapatan - selectedData.previous.pendapatan) /
                    selectedData.previous.pendapatan) *
                100
            ).toFixed(2)
        )
        : defaultIncrease;

    const currentLabel = (() => {
        if (!selectedData) {
            if (mode === "mingguan") {
                return weeklyData.length ? weeklyData[weeklyData.length - 1].week : "";
            }
            return lastMonth;
        }

        if (mode === "mingguan") {
            // when mode is "mingguan", current comes from weeklyData and has a 'week' property
            return (selectedData.current as { week: string }).week;
        }

        // otherwise current is RawData and has a 'month' property
        return toFullMonthName((selectedData.current as RawData).month);
    })();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const efisiensi = payload.find((p: any) => p.dataKey === "EfisiensiNilai");
            return (
                <div className="p-2 rounded-md shadow-md border border-foreground bg-background">
                    <p><strong>{payload[0].payload.month}</strong></p>
                    <p>Omset: {Number(payload[0].payload.Pendapatan).toLocaleString('id-ID')}</p>
                    <p>Pengeluaran: {Number(payload[0].payload.Pengeluaran).toLocaleString('id-ID')}</p>
                    <p>Efisiensi: {Number(payload[0].payload.Efisiensi).toLocaleString('id-ID')}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className={`${className}`}>
            <CardHeader>
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold">Data Keuangan Marketing</h2>
                        <p className="text-[11px] font-extralight text-gray-400">Analisis pengeluaran dan pemasukan data iklan</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select defaultValue={mode} onValueChange={(v) => setMode(v as any)}>
                            <SelectTrigger className="w-fit">
                                <SelectValue className="mr-2" placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="bulanan">Bulanan</SelectItem>
                                <SelectItem value="mingguan">Mingguan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3">
                    <div className="col-span-1 h-full flex flex-col py-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-4xl font-semibold text-primary mb-1">{percentageIncrease}%</h2>
                            <div className="bg-primary rounded-full p-1">
                                <ArrowUpRight className="text-white" />
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mb-9 flex flex-col">
                            <span>Total kenaikan </span>
                            <span>omset iklan untuk</span>
                            <span>bulan <strong className="font-semibold">{currentLabel}</strong></span>
                        </p>

                        <div className="flex flex-col text-sm mt-auto">
                            <div className="flex flex-row items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                                <span>Omset</span>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-700"></span>
                                <span>Pengeluaran</span>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                                <span>Efisiensi</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2 flex flex-col h-full">
                        <div className="h-55 mt-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={data}
                                    barCategoryGap="12%"
                                    barGap={8}
                                >
                                    <defs>
                                        <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feDropShadow
                                                dx="0"
                                                dy="-3"
                                                stdDeviation="5"
                                                floodColor="rgba(0,0,0,0.25)"
                                            />
                                        </filter>
                                        <filter id="lineShadow" x="0%" y="-60%" width="140%" height="300%">
                                            <feDropShadow
                                                dx="0"
                                                dy="-4"
                                                stdDeviation="3"
                                                floodColor="rgba(0,0,0,0.25)"
                                            />
                                        </filter>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        strokeOpacity={0.1}
                                    />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        content={<CustomTooltip />}
                                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "none",
                                        }}
                                    />
                                    <Bar
                                        dataKey="PengeluaranHeight"
                                        stackId="a"
                                        fill="#3b82f6"
                                        radius={[50, 50, 50, 50]}
                                        barSize={35}
                                        filter="url(#barShadow)"
                                        onClick={handleBarClick}
                                    />
                                    <Bar
                                        dataKey="PendapatanHeight"
                                        stackId="a"
                                        fill="#facc15"
                                        radius={[50, 50, 50, 50]}
                                        barSize={35}
                                        filter="url(#barShadow)"
                                        onClick={handleBarClick}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="EfisiensiH"
                                        stroke="#9ca3af"
                                        strokeWidth={2}
                                        dot={false}
                                        filter="url(#lineShadow)"
                                        strokeDasharray="5 5"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
