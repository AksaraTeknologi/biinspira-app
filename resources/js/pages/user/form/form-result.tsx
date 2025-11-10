import { useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@headlessui/react";

interface Props {
    form: any;
    events: { id: number; name: string }[];
    platforms: { id: number; name: string }[];
}

export default function FormResult({ form, events = [], platforms = [] }: Props) {
    const { register, setValue, control, formState: { errors } } = form;

    // watch ad_plan_id
    const selectedEvent = useWatch({ control, name: "ad_plan_id" }) || "";

    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label>Nama Event</Label>
                    <Select
                        onValueChange={(value) => setValue("ad_plan_id", value)}
                        value={String(selectedEvent || "")}
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

                <div>
                    <Label>Checkout Count</Label>
                    <Input type="number" {...register("checkout_count")} />
                    {errors?.checkout_count && <p className="text-red-500 text-sm">{errors.checkout_count.message}</p>}
                </div>

                <div>
                    <Label>Revenue</Label>
                    <Input type="number" {...register("revenue")} />
                    {errors?.revenue && <p className="text-red-500 text-sm">{errors.revenue.message}</p>}
                </div>
            </div>

            <div className="border p-4 rounded-md mt-4 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Hasil Iklan (Platform Iklan Website)</Label>
                        <Input
                            type="number"
                            {...register("ad_result_cost")}
                            onChange={(e) => setValue(`ad_result_cost`, e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Total Biaya Iklan</Label>
                        <Input
                            type="number"
                            {...register("total_cost")}
                            onChange={(e) => setValue(`total_cost`, e.target.value)}
                        />
                    </div>
                </div>
                <Label>Metriks Iklan</Label>
                <div className="grid grid-cols-2 gap-4">

                    <div>
                        <Label>Reach</Label>
                        <Input
                            type="number"
                            placeholder="Reach"
                            {...register("metrics.reach")}
                            onChange={(e) => setValue(`metrics.reach`, e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Biaya / Hasil (CPR)</Label>
                        <Input
                            type="number"
                            placeholder="CPR"
                            {...register("metrics.cost_per_result")}
                            onChange={(e) => setValue(`metrics.cost_per_result`, e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Impression</Label>
                        <Input
                            type="number"
                            placeholder="impression"
                            {...register("metrics.impression")}
                            onChange={(e) => setValue(`metrics.impression`, e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Hasil Iklan</Label>
                        <Input
                            type="text"
                            placeholder="Hasil Iklan"
                            {...register("metrics.ad_result_desc")}
                            onChange={(e) => setValue(`metrics.ad_result_desc`, e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
