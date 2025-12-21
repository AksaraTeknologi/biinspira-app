import { Bar, ResponsiveContainer, XAxis, Tooltip, Line, CartesianGrid, YAxis, ComposedChart } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCallback, useMemo, useState } from "react";

interface RawDataMonthly {
    month: string;
    pengeluaran: number;
    pendapatan: number;
    audience: number;
}

interface RawDataWeekly {
    week: string;
    pendapatan: number;
    pengeluaran: number;
    audience: number;
}

interface GrafikPendapatanProps {
    className?: string;
    RawData: {
        bulanan: RawDataMonthly[];
        mingguan: RawDataWeekly[];
    };
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
        if (!input) return "";
        return input.slice(0, 3);
    }

    const activeSource =
        mode === "mingguan" ? RawData.mingguan : RawData.bulanan;

    // Hitung kenaikan default (bulan terakhir)
    // rumus perhitungan: ((pendapatan bulan ini - pendapatan bulan lalu) / pendapatan bulan lalu) * 100
    const defaultIncrease =
        activeSource.length > 1
            ? parseFloat(
                (
                    ((activeSource[activeSource.length - 1].pendapatan -
                        activeSource[activeSource.length - 2].pendapatan) /
                        activeSource[activeSource.length - 2].pendapatan) *
                    100
                ).toFixed(2)
            )
            : 0;

    // ambil data bulan terakhir dari rawData
    // const lastRaw = RawData.length > 0 ? RawData[RawData.length - 1].month : "";
    // const lastMonth = toFullMonthName(lastRaw);

    // ===============================
    // 🔁 Transformasi data mingguan
    // ==============================

    // ===============================
    // 🔄 Tentukan data final untuk grafik
    // ===============================
    const data = useMemo(() => {
        return activeSource.map((d) => ({
            month:
                mode === "mingguan"
                    ? (d as RawDataWeekly).week
                    : toMonthName((d as RawDataMonthly).month),
            PendapatanHeight: d.pendapatan,
            PengeluaranHeight: d.pengeluaran,
            EfisiensiH: d.pendapatan + d.pengeluaran,
            Efisiensi: d.pendapatan - d.pengeluaran,
            Audience: d.audience,
        }));
    }, [mode, RawData]);

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
                current: activeSource[selectedIndex],
                previous: activeSource[selectedIndex - 1],
            }
            : null;

    // hitung persentase kenaikan berdasarkan data yang dipilih
    const percentageIncrease = selectedData
        ? parseFloat(
            (
                ((selectedData.current.pendapatan -
                    selectedData.previous.pendapatan) /
                    selectedData.previous.pendapatan) *
                100
            ).toFixed(2)
        )
        : defaultIncrease;

    const currentLabel = (() => {
        if (!activeSource.length) return "";

        if (!selectedData) {
            const last = activeSource[activeSource.length - 1];
            return mode === "mingguan"
                ? (last as RawDataWeekly).week
                : toFullMonthName((last as RawDataMonthly).month);
        }

        return mode === "mingguan"
            ? (selectedData.current as RawDataWeekly).week
            : toFullMonthName(
                (selectedData.current as RawDataMonthly).month
            );
    })();

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;

        const d = payload[0].payload;

        return (
            <div className="p-2 rounded-md shadow-md border bg-background">
                <p className="font-semibold">{mode === "mingguan" ? d.month : toFullMonthName(d.month)}</p>
                <p>Omset: {d.PendapatanHeight.toLocaleString("id-ID")}</p>
                <p>Pengeluaran: {d.PengeluaranHeight.toLocaleString("id-ID")}</p>
                <p
                    className={
                        d.Efisiensi >= 0
                            ? "text-green-500 font-semibold"
                            : "text-red-500 font-semibold"
                    }
                >
                    Efisiensi:{" "}
                    {d.Efisiensi >= 0 ? "+" : ""}
                    {d.Efisiensi.toLocaleString("id-ID")}
                </p>
                <p>Jumlah Peserta: {d.Audience.toLocaleString("id-ID")}</p>
            </div>
        );
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
                            <h2 className={`text-4xl font-semibold ${percentageIncrease < 0 ? 'text-orange-500' : 'text-primary'} mb-1`}>{percentageIncrease}%</h2>
                            <div className={`${percentageIncrease < 0 ? 'bg-orange-500' : 'bg-primary'} rounded-full p-1`}>
                                {percentageIncrease < 0 ? <ArrowDownRight className="text-white" /> : <ArrowUpRight className="text-white" />}
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mb-9 flex flex-col">
                            <span>Total <strong className={percentageIncrease < 0 ? 'text-orange-500' : 'text-blue-500'}>{percentageIncrease < 0 ? 'penurunan' : 'kenaikan'} </strong></span>
                            <span>omset iklan pada</span>
                            <span>bulan <strong className="font-semibold">{currentLabel}</strong></span>
                        </p>

                        <div className="flex flex-col text-sm mt-auto">
                            <div className="flex flex-row items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-yellow-300"></span>
                                <span>Omset</span>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-700"></span>
                                <span>Pengeluaran</span>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-[#CDE9DC]"></span>
                                <span>Jumlah Peserta</span>
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
                                    style={{ minHeight: 50 }}
                                    onClick={handleBarClick}
                                >
                                    <defs>
                                        <filter id="barShadow" x="-20%" y="-20%" width="200%" height="140%">
                                            <feDropShadow
                                                dx="0"
                                                dy="-2"
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
                                    <YAxis yAxisId="left" hide />
                                    <YAxis yAxisId="right" hide />
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
                                        yAxisId="left"
                                        fill="#3b82f6"
                                        radius={[50, 50, 50, 50]}
                                        barSize={35}
                                        filter="url(#barShadow)"
                                        onClick={handleBarClick}
                                    />
                                    <Bar
                                        dataKey="PendapatanHeight"
                                        stackId="a"
                                        yAxisId="left"
                                        fill="#facc15"
                                        radius={[50, 50, 50, 50]}
                                        barSize={35}
                                        filter="url(#barShadow)"
                                        onClick={handleBarClick}
                                    />
                                    <Bar
                                        dataKey="Audience"
                                        yAxisId="right"
                                        fill="#CDE9DC"
                                        radius={[50, 50, 50, 50]}
                                        barSize={35}
                                        filter="url(#barShadow)"
                                        onClick={handleBarClick}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="EfisiensiH"
                                        yAxisId="left"
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
