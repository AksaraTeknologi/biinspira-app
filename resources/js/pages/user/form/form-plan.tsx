import { useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';

interface Props {
    form: any;
    events: { id: number; name: string }[];
    platforms: { id: number; name: string }[];
    goals: { id: number; name: string }[];
}

export default function FormPlan({
    form,
    events = [],
    platforms = [],
    goals = []
}: Props) {

    const { register, setValue, control, formState: { errors } } = form;
    const [range, setRange] = useState<{ from?: Date; to?: Date }>({});

    // watch ad_plan_id
    const selectedEvent = useWatch({ control, name: "ad_plan_id" }) || "";
    const targetType = useWatch({ control, name: "audience_type" }) || "targeted";
    const typeAudiens = useWatch({ control, name: "type_audience_targeted" });

    // const [targetType, setTargetType] = useState('targeted');
    // const [typeAudiens, setTypeAudiens] = useState<string | null>(null);
    // const [detailAudiens, setDetailAudiens] = useState('');

    const showTargeting = targetType === 'targeted' || targetType === 'combined';
    const showBroad = targetType === 'broad' || targetType === 'combined';

    const handleDateChange = (rangeValue: { from?: Date; to?: Date } | undefined) => {
        setRange(rangeValue || {});
        if (rangeValue?.from) setValue('start_date', format(rangeValue.from, 'yyyy-MM-dd'));
        if (rangeValue?.to) setValue('end_date', format(rangeValue.to, 'yyyy-MM-dd'));
    };

    return (
        <>
            {/* bagian pertama */}
            <div>
                <Label>Nama Event</Label>
                <Select
                    value={String(selectedEvent || "")}
                    onValueChange={(value) => setValue("ad_plan_id", value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Event" />
                    </SelectTrigger>
                    <SelectContent>
                        {events.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                                {item.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <input type="hidden" {...register("ad_plan_id")} />
                {errors?.ad_plan_id && (
                    <p className="text-red-500 text-sm">{errors.ad_plan_id.message}</p>
                )}
            </div>

            {/* bagian kedua */}
            <div className="border p-4 rounded-md mt-4 flex flex-col gap-y-4">
                <div className="flex flex-col gap-y-4">
                    <div>
                        <Label>Periode Iklan</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start rounded-lg border-zinc-300 text-left font-normal shadow-sm transition-all duration-200 hover:border-blue-400',
                                        !range?.from && 'text-muted-foreground',
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                                    {range?.from && range?.to
                                        ? `${format(range.from, 'dd MMM yyyy')} - ${format(range.to, 'dd MMM yyyy')}`
                                        : 'Pilih tanggal mulai dan selesai'}
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg" align="start">
                                <Calendar
                                    mode="range"
                                    numberOfMonths={2}
                                    selected={range}
                                    onSelect={handleDateChange}
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
                        <input type="hidden" {...register("start_date")} />
                        <input type="hidden" {...register("end_date")} />
                        {errors?.start_date && (
                            <p className="text-red-500 text-sm">{errors.start_date.message}</p>
                        )}
                        {errors?.end_date && (
                            <p className="text-red-500 text-sm">{errors.end_date.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    <div>
                        <Label>Tujuan Iklan</Label>
                        <Select
                            onValueChange={(val) => setValue("goals_id", val)}
                            defaultValue=""
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih tujuan iklan" />
                            </SelectTrigger>
                            <SelectContent>
                                {goals?.map((goal) => (
                                    <SelectItem key={goal.id} value={String(goal.id)}>
                                        {goal.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" {...register("goals_id")} />
                        {errors?.goals_id && (
                            <p className="text-red-500 text-sm">{errors.goals_id.message}</p>
                        )}
                    </div>

                    <div>
                        <Label>Budget Harian</Label>
                        <Input
                            type="number"
                            {...register("daily_budget")}
                            placeholder="Rp. 0"
                            min={0}
                        />
                        {errors?.daily_budget && (
                            <p className="text-red-500 text-sm">{errors.daily_budget.message}</p>
                        )}
                    </div>
                    <div>
                        <Label>Target Audiens (jumlah)</Label>
                        <Input
                            type="number"
                            {...register("audience_target")}
                            placeholder="Masukkan jumlah target audiens"
                            min={0}
                        />
                        {errors?.audience_target && (
                            <p className="text-red-500 text-sm">{errors.audience_target.message}</p>
                        )}
                    </div>
                    <div>
                        <Label>Jenis Target Audiens</Label>
                        <Select
                            value={targetType}
                            onValueChange={(val) => setValue("audience_type", val)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih jenis audiens" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="targeted">Targeted</SelectItem>
                                <SelectItem value="broad">Broad</SelectItem>
                                <SelectItem value="combined">Combined</SelectItem>
                            </SelectContent>
                        </Select>
                        <input type="hidden" {...register("audience_type")} />
                    </div>
                </div>

                {/* bagian ketiga */}
                <div className="mt-6 space-y-4 border-t pt-4">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {showTargeting && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Umur (Targeted)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Masukkan umur target"
                                        min={0}
                                        {...register("age_targeted")}
                                    />
                                </div>

                                <div>
                                    <Label>Lokasi</Label>
                                    <Input
                                        placeholder="Masukkan lokasi audiens"
                                        {...register("location_targeted")}
                                    />
                                </div>

                                <div>
                                    <Label>Jenis Audiens</Label>
                                    <Select
                                        value={typeAudiens ?? ''}
                                        onValueChange={(val) => setValue("type_audience_targeted", val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih jenis audiens" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['Industri', 'Pekerjaan', 'Bidang Studi', 'Tingkat Pendidikan', 'Minat', 'Lain - Lain'].map((item) => (
                                                <SelectItem key={item} value={item}>
                                                    {item}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input type="hidden" {...register("type_audience_targeted")} />
                                </div>

                                {typeAudiens && (
                                    <div>
                                        <Label>Detail Audiens ({typeAudiens})</Label>
                                        <Input
                                            placeholder={`Masukkan detail untuk ${typeAudiens}`}
                                            {...register("name_audience_targeted")}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {showBroad && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Umur (Broad)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Masukkan umur broad"
                                        min={0}
                                        {...register("age_broad")}
                                    />
                                </div>

                                <div>
                                    <Label>Lokasi Broad</Label>
                                    <Input
                                        placeholder="Masukkan lokasi broad"
                                        {...register("location_broad")}
                                    />
                                </div>
                            </div>
                        )}
                    </div >
                </div >
            </div >
        </>
    );
}
