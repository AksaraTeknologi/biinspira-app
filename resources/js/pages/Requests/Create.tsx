import { Head, useForm, usePage } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import { BreadcrumbItem } from "@/types/navigation"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

type User = {
    id: number
    name: string
    workload: number
}

export default function Create({ users }: { users: User[] }) {

    const { editData } = usePage().props as any
    const [date, setDate] = useState<Date | undefined>(undefined)

    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        title: "",
        description: "",
        related_url: "",
        urgency: "low",
        deadline: "",
        attachments: [] as File[],
    })

    const [previews, setPreviews] = useState<string[]>([])

    /* =========================
       LOAD EDIT DATA
    ========================= */
    useEffect(() => {
        if (!editData) return

        setData({
            title: editData.title ?? "",
            description: editData.description ?? "",
            related_url: editData.related_url ?? "",
            urgency: editData.urgency ?? "low",
            deadline: editData.deadline ? editData.deadline.split(" ")[0] : "",
            attachments: [],
        })

        if (editData.deadline) {
            setDate(new Date(editData.deadline))
        }
    }, [editData])

    /* =========================
       FILE HANDLER
    ========================= */
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return

        const files = Array.from(e.target.files)

        setData("attachments", files)

        const urls = files
            .filter(f => f.type.startsWith("image/"))
            .map(f => URL.createObjectURL(f))

        setPreviews(urls)
    }

    const removeFile = (index: number) => {
        setData("attachments", data.attachments.filter((_, i) => i !== index))
        setPreviews(previews.filter((_, i) => i !== index))
    }

    /* =========================
       FIXED SUBMIT (NO STUCK)
    ========================= */
    const submit = (e: React.FormEvent) => {
        e.preventDefault()

        const formData = new FormData()

        formData.append("title", data.title)
        formData.append("description", data.description)
        formData.append("related_url", data.related_url)
        formData.append("urgency", data.urgency)
        formData.append("deadline", data.deadline || "")

        data.attachments.forEach((file) => {
            formData.append("attachments[]", file)
        })

        if (editData) {
            formData.append("_method", "PUT")
        }

        post(
            editData
                ? route("requests.update", editData.id)
                : route("requests.store"),
            formData,
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    console.log("DONE")
                },
                onError: (err) => {
                    console.log("ERROR:", err)
                }
            }
        )
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Ticketing Website", href: "/requests" },
        { title: editData ? "Edit Request" : "Create Request", href: "#" }
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Request Form" />

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                    <div className="bg-white shadow-lg rounded-2xl border p-8">

                        <div className="mb-8">
                            <h1 className="text-2xl font-bold">
                                {editData ? "Edit Request" : "Create Request"}
                            </h1>
                        </div>

                        <form onSubmit={submit} className="space-y-6">

                            {/* TITLE */}
                            <div>
                                <label className="text-sm font-medium">Title</label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData("title", e.target.value)}
                                    className="mt-2 w-full border rounded-lg p-3"
                                />
                                {errors.title && (
                                    <p className="text-red-500 text-sm">{errors.title}</p>
                                )}
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData("description", e.target.value)}
                                    className="mt-2 w-full border rounded-lg p-3 h-32"
                                />
                            </div>

                            {/* URL */}
                            <div>
                                <label className="text-sm font-medium">Related URL</label>
                                <input
                                    type="url"
                                    value={data.related_url}
                                    onChange={e => setData("related_url", e.target.value)}
                                    className="mt-2 w-full border rounded-lg p-3"
                                />
                            </div>

                            {/* GRID */}
                            <div className="grid md:grid-cols-3 gap-4">

                                {/* URGENCY */}
                                <div>
                                    <label className="text-sm font-medium">Urgency</label>
                                    <select
                                        value={data.urgency}
                                        onChange={e => setData("urgency", e.target.value)}
                                        className="mt-2 w-full border rounded-lg p-3"
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>

                                {/* DEADLINE (SHADCN SAFE) */}
                                <div>
                                    <label className="text-sm font-medium">Deadline</label>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="mt-2 w-full h-[50px] px-3 justify-start text-left font-normal"
                                            >
                                                {date ? format(date, "yyyy-MM-dd") : "Pick deadline"}
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={(d) => {
                                                    setDate(d)
                                                    setData("deadline", d ? format(d, "yyyy-MM-dd") : "")
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    {errors.deadline && (
                                        <p className="text-red-500 text-sm">{errors.deadline}</p>
                                    )}
                                </div>

                                {/* FILE */}
                                <div>
                                    <label className="text-sm font-medium">Attachments</label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="mt-2 w-full border rounded-lg p-3"
                                    />
                                </div>

                            </div>

                            {/* PREVIEW */}
                            {previews.length > 0 && (
                                <div className="grid grid-cols-3 gap-3">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative">
                                            <img
                                                src={src}
                                                className="h-24 w-full object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(i)}
                                                className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* BUTTON */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing
                                        ? "Processing..."
                                        : editData
                                            ? "Update Request"
                                            : "Create Request"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}