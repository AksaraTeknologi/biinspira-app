import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { router } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { defineStepper } from "@stepperize/react";
import axios from "axios";

// Import form tiap step
import FormPlan from "./form-plan";
import FormResult from "./form-result";
import FormEval from "./form-eval";

// ======= SCHEMA =======
const metricSchema = z.object({
    reach: z
        .union([z.number(), z.string()])
        .refine((val) => val !== "" && Number(val) >= 0, {
            message: "Reach harus diisi dan bernilai positif",
        }),
    impressions: z
        .union([z.number(), z.string()])
        .refine((val) => val !== "" && Number(val) >= 0, {
            message: "Impressions harus diisi dan bernilai positif",
        }),
    cost_per_result: z
        .union([z.number(), z.string()])
        .refine((val) => val !== "" && Number(val) >= 0, {
            message: "Biaya per hasil harus diisi dan bernilai positif",
        }),
});

const platformSchema = z.object({
    platform_id: z.string().min(1, "Pilih platform terlebih dahulu"),
    result: z
        .union([z.number(), z.string()])
        .refine((val) => val !== "" && Number(val) >= 0, {
            message: "Hasil iklan harus diisi dan bernilai positif",
        }),
    total_cost: z
        .union([z.number(), z.string()])
        .refine((val) => val !== "" && Number(val) >= 0, {
            message: "Total biaya harus diisi dan bernilai positif",
        }),
    metrics: metricSchema,
});

// Step 1: Plan
export const planSchema = z.object({
    ad_plan_id: z.string().min(1, "Nama event harus dipilih"),
    goals_id: z.string().min(1, "Tujuan iklan harus dipilih"),
    start_date: z.string().min(1, "Tanggal mulai harus diisi"),
    end_date: z.string().min(1, "Tanggal selesai harus diisi"),
    daily_budget: z
        .union([z.number(), z.string()])
        .refine((val) => val !== "" && Number(val) >= 0, {
            message: "Budget harian harus diisi dan bernilai positif",
        }),
    audience_target: z
        .union([z.number(), z.string()])
        .refine((val) => val !== "" && Number(val) >= 0, {
            message: "Target audiens harus diisi dan bernilai positif",
        }),
    audience_type: z.string().optional(),
    type_audience_targeted: z.string().optional(),
    name_audience_targeted: z.string().optional(),
    age_targeted: z.union([z.number(), z.string()]).optional(),
    location_targeted: z.string().optional(),
    age_broad: z.union([z.number(), z.string()]).optional(),
    location_broad: z.string().optional(),
});

// Step 2: Result
export const resultSchema = z.object({
    ad_plan_id: z.string().min(1, "Nama event harus dipilih"),

    checkout_count: z
        .union([z.number(), z.string()])
        .refine((val) => val !== "" && Number(val) >= 0, {
            message: "Jumlah checkout harus diisi dan bernilai positif",
        }),

    revenue: z
        .union([z.number(), z.string()])
        .refine((val) => val !== "" && Number(val) >= 0, {
            message: "Pendapatan harus diisi dan bernilai positif",
        }),

    ad_result_cost: z
        .union([z.number(), z.string()])
        .refine((val) => val === "" || Number(val) >= 0, {
            message: "Biaya hasil iklan tidak boleh negatif",
        })
        .optional(),

    total_cost: z
        .union([z.number(), z.string()])
        .refine((val) => val === "" || Number(val) >= 0, {
            message: "Total biaya iklan tidak boleh negatif",
        })
        .optional(),

    metrics: z.object({
        reach: z
            .union([z.number(), z.string()])
            .refine((val) => val === "" || Number(val) >= 0, {
                message: "Reach harus bernilai positif",
            })
            .optional(),

        cost_per_result: z
            .union([z.number(), z.string()])
            .refine((val) => val === "" || Number(val) >= 0, {
                message: "Cost per result harus bernilai positif",
            })
            .optional(),

        impression: z
            .union([z.number(), z.string()])
            .refine((val) => val === "" || Number(val) >= 0, {
                message: "Impression harus bernilai positif",
            })
            .optional(),

        ad_result_desc: z.string().optional(),
    }).optional(),
});

// Step 3: Eval (boleh sama dengan Result)
export const evalSchema = z.object({
    // Event sekarang & sebelumnya
    ad_plan_id: z.string().nonempty("Event harus dipilih"),
    ad_plan_id_before: z.string().nonempty("Event sebelumnya harus dipilih"),

    // Data kinerja event saat ini
    current_checkout: z
        .string()
        .nonempty("Checkout event sekarang tidak boleh kosong")
        .regex(/^[0-9]+$/, "Checkout harus berupa angka"),
    current_ad_performance: z
        .string()
        .nonempty("Kinerja event sekarang tidak boleh kosong"),
    current_other_performance: z
        .string()
        .optional(),

    // Data kinerja event sebelumnya
    previous_checkout: z
        .string()
        .nonempty("Checkout event sebelumnya tidak boleh kosong")
        .regex(/^[0-9]+$/, "Checkout harus berupa angka"),
    previous_ad_performance: z
        .string()
        .nonempty("Kinerja event sebelumnya tidak boleh kosong"),
    previous_other_performance: z
        .string()
        .optional(),

    // Strategi iklan berikutnya
    next_ad_strategy: z
        .string()
        .min(10, "Strategi iklan harus minimal 10 karakter"),

    // Data platform (optional, jika nanti diisi dinamis)
    platforms: z
        .array(
            z.object({
                platform_id: z
                    .string()
                    .nonempty("Platform harus dipilih"),
                result: z
                    .string()
                    .optional(),
                total_cost: z
                    .string()
                    .regex(/^[0-9]*$/, "Biaya harus berupa angka")
                    .optional(),
                metrics: z.object({
                    reach: z
                        .string()
                        .regex(/^[0-9]*$/, "Reach harus berupa angka")
                        .optional(),
                    impressions: z
                        .string()
                        .regex(/^[0-9]*$/, "Impressions harus berupa angka")
                        .optional(),
                    cost_per_result: z
                        .string()
                        .regex(/^[0-9]*$/, "Cost per result harus berupa angka")
                        .optional(),
                    ad_result_desc: z
                        .string()
                        .optional(),
                }),
            })
        )
        .optional(),

    // metrics umum (jika digunakan di luar platforms)
    metrics: z
        .object({
            ad_result_desc: z
                .string()
                .optional(),
        })
        .optional(),
});

// ======= DEFINE STEPPER =======
const { useStepper, steps, utils } = defineStepper(
    { id: "plan", label: "Plan", schema: planSchema },
    { id: "result", label: "Result", schema: resultSchema },
    { id: "eval", label: "Evaluation", schema: evalSchema }
);

interface StepperProps {
    events: Array<{ id: any; name: string }>;
    platforms: Array<{ id: any; name: string }>;
    goals: Array<{ id: any; name: string }>;
}

export default function Stepper({ events, platforms, goals }: StepperProps) {
    const stepper = useStepper();
    const form = useForm({
        mode: "onTouched",
        resolver: zodResolver(stepper.current.schema),
    });
    console.log(form.formState.errors);

    const currentIndex = utils.getIndex(stepper.current.id);

    const onSubmit = async (values: any) => {
        console.log(values);
        try {
            const routeName = route(
                stepper.current.id === "plan"
                    ? "user.plan.store"
                    : stepper.current.id === "result"
                        ? "user.result.store"
                        : "user.eval.store"
            );

            await axios.post(routeName, values);

            console.log(`✅ Data ${stepper.current.id} tersimpan`);
            if (!stepper.isLast) stepper.next();
            else stepper.reset();

        } catch (error) {
            console.error("❌ Error submit:", error);
        }
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 p-6 border rounded-lg"
            >
                {/* Header */}
                <div className="flex justify-between">
                    <h2 className="text-lg font-medium">Checkout</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Step {currentIndex + 1} of {steps.length}
                        </span>
                    </div>
                </div>

                {/* Stepper Navigation */}
                <nav aria-label="Checkout Steps" className="group my-4">
                    <ol
                        className="flex items-center justify-between gap-2"
                        aria-orientation="horizontal"
                    >
                        {stepper.all.map((step, index, array) => (
                            <React.Fragment key={step.id}>
                                <li className="flex items-center gap-4 flex-shrink-0">
                                    <Button
                                        type="button"
                                        variant={index <= currentIndex ? "default" : "secondary"}
                                        onClick={async () => {
                                            const valid = await form.trigger();
                                            if (!valid) return;
                                            if (index - currentIndex > 1) return;
                                            stepper.goTo(step.id);
                                        }}
                                        className="flex size-10 items-center justify-center rounded-full"
                                    >
                                        {index + 1}
                                    </Button>
                                    <span className="text-sm font-medium">{step.label}</span>
                                </li>
                                {index < array.length - 1 && (
                                    <Separator
                                        className={`flex-1 ${index < currentIndex ? "bg-primary" : "bg-muted"
                                            }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </ol>
                </nav>

                {/* Step Content */}
                <div className="space-y-4">
                    {stepper.switch({
                        plan: () => <FormPlan form={form} events={events} platforms={platforms} goals={goals} />,
                        result: () => <FormResult form={form} events={events} platforms={platforms} />,
                        eval: () => <FormEval form={form} events={events} platforms={platforms} />,
                    })}

                    {/* Navigation Buttons */}
                    <div className="flex justify-end gap-4">
                        {!stepper.isFirst && (
                            <Button variant="secondary" onClick={stepper.prev}>
                                Back
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={form.handleSubmit(onSubmit)}
                        >
                            {stepper.isLast ? "Complete" : "Next"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    );
}
