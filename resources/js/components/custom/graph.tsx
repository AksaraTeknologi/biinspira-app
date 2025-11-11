import {
    Bar,
    ResponsiveContainer,
    XAxis,
    Tooltip,
    Line,
    CartesianGrid,
    YAxis,
    ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface RawData {
    name: string;
    pengeluaran: number;
    pendapatan: number;
}

interface GrafikPendapatanProps {
    className?: string;
    RawData: RawData[];
}

export default function GrafikPendapatan({ className, RawData }: GrafikPendapatanProps) {
    const data = RawData.map((d) => ({
        name: d.name,
        pengeluaran: d.pengeluaran,
        pendapatan: d.pendapatan,
        akumulasi: d.pengeluaran + d.pendapatan
    }));

    return (
        <Card className={`${className}`}>
            <CardHeader>
                <div className="flex flex-row justify-between items-center">
                    <div className="flex flex-col">
                        <h2>Data Keuangan Marketing</h2>
                        <p className="text-sm font-extralight text-gray-400">Analisis pengeluaran dan pemasukan data iklan</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select defaultValue="bulanan">
                            <SelectTrigger className="w-fit">
                                <SelectValue className="mr-2" placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent>
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
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-4xl font-semibold text-gray-900">12.5%</h2>
                            <ArrowUpRight className="text-blue-500" />
                        </div>
                        <p className="text-gray-500 text-sm mb-6">
                            Total kenaikan pendapatan iklan untuk bulan <span className="font-semibold text-gray-700">Agustus</span>
                        </p>

                        <div className="flex flex-col text-sm mt-auto">
                            <div className="flex flex-row items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-700"></span>
                                <span>Pengeluaran Iklan</span>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                                <span>Pendapatan</span>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                                <span>Akumulasi</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2 flex flex-col h-full">
                        <div className="h-55 mt-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data}>
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

                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: "rgba(0,0,0,0.05)" }}
                                        contentStyle={{
                                            borderRadius: "8px",
                                            border: "none",
                                            background: "white",
                                        }}
                                    />
                                    {/* bagian pengeluaran di bawah */}
                                    <Bar
                                        dataKey="pengeluaran"
                                        stackId="a"
                                        fill="#3b82f6"
                                        radius={[50, 50, 50, 50]}
                                        barSize={35}
                                        filter="url(#barShadow)"
                                    />
                                    {/* bagian bersih di atas — ukuran bar mengikuti 'bersih', tapi label menampilkan 'pendapatan' */}
                                    <Bar
                                        dataKey="pendapatan"
                                        stackId="a"
                                        fill="#facc15"
                                        radius={[50, 50, 50, 50]}
                                        barSize={35}
                                        filter="url(#barShadow)"
                                    >
                                    </Bar>
                                    <Line
                                        type="monotone"
                                        dataKey="akumulasi"
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
