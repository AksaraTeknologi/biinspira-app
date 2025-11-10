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

export default function FormEval({ form, events = [], platforms = [] }: Props) {
    const { register, setValue, control, formState: { errors } } = form;

    // watch ad_plan_id
    const selectedEvent = useWatch({ control, name: "ad_plan_id" }) || "";
    const selectedEventBefore = useWatch({ control, name: "ad_plan_id_before" }) || "";

    // watch platforms array coming from react-hook-form
    const watchedPlatforms =
        useWatch({
            control,
            name: "platforms",
        }) || [
            {
                platform_id: "",
                result: "",
                total_cost: "",
                metrics: { reach: "", impressions: "", cost_per_result: "" },
            },
        ];

    return (
        <>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
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
                    <Label>Nama Event Sebelumnya</Label>
                    <Select
                        onValueChange={(value) => setValue("ad_plan_id_before", value)}
                        value={String(selectedEventBefore || "")}
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
                    <input type="hidden" {...register("ad_plan_id_before")} />
                    {errors?.ad_plan_id_before && (
                        <p className="text-red-500 text-sm">{errors.ad_plan_id_before.message}</p>
                    )}
                </div>
            </div>

            {/* <div className="text-center"> */}
            <Label>Kinerja Event</Label>
            {/* </div> */}

            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex flex-col gap-y-4">
                    <div>
                        <Label>Checkout Event Sekarang</Label>
                        <Input 
                            type="text"
                            {...register("current_checkout")}
                        />
                    </div>

                    <div>
                        <Label>Kinerja event Sekarang</Label>
                        <Input
                            type="text"
                            {...register("current_ad_performance")}
                        />
                    </div>

                    <div>
                        <Label>Kinerja Lain Sekarang</Label>
                        <Input
                            type="text"
                            {...register("current_other_performance")}
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-y-4">
                    <div>
                        <Label>Checkout Event Sebelumnya</Label>
                        <Input
                            type="text"
                            {...register("previous_checkout")}
                        />
                    </div>

                    <div>
                        <Label>Kinerja event Sebelumnya</Label>
                        <Input
                            type="text"
                            {...register("previous_ad_performance")}
                        />
                    </div>

                    <div>
                        <Label>Kinerja Lain Sebelumnya</Label>
                        <Input
                            type="text"
                            {...register("previous_other_performance")}
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-y-1">
                <Label>Strategi Iklan</Label>
                <Textarea
                    placeholder="Strategi yang akan digunakan dalam iklan selanjutnya"
                    {...register("next_ad_strategy")}
                    onChange={(e) => setValue(`metrics.ad_result_desc`, e.target.value)}
                    className="border-1 border-gray-200 rounded-md p-2"
                />
            </div>
        </>
    );
}


