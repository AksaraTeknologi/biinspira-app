import { Head, useForm } from "@inertiajs/react"
import AppLayout from "@/layouts/app-layout"
import { BreadcrumbItem } from "@/types/navigation"
import { useState } from "react"

type User = {
    id: number
    name: string
    workload: number
}

export default function Create({ users }: { users: User[] }) {

    const { data, setData, post, processing, errors } = useForm({
        title: "",
        description: "",
        related_url: "",
        urgency: "low",
        deadline: "",
        attachments: [] as File[],
    })

    const [previews, setPreviews] = useState<string[]>([])

    // ✅ FIX TYPE EVENT + FILE
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return

        const files = Array.from(e.target.files) as File[]

        // 🔥 DEBUG DI SINI
        console.log("FILES SELECTED:", files)

        files.forEach((file, i) => {
            console.log(`File ${i}:`, {
                name: file.name,
                size: file.size,
                type: file.type
            })
        })

        setData("attachments", files)

        const previews = files
            .filter(file => file.type.startsWith("image/"))
            .map(file => URL.createObjectURL(file))

        setPreviews(previews)
    }

    const removeFile = (index: number) => {
        const newFiles = data.attachments.filter((_, i) => i !== index)
        const newPreviews = previews.filter((_, i) => i !== index)

        setData("attachments", newFiles)
        setPreviews(newPreviews)
    }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()

        console.log("DATA YANG DIKIRIM:", data)

        post("/requests", {
            forceFormData: true
        })
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: "Ticketing Website", href: "/requests" },
        { title: "Create Request", href: "/requests/create" }
    ]

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Request" />

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT */}
                <div className="lg:col-span-3">
                    <div className="bg-white shadow-lg rounded-2xl border p-8">

                        <div className="mb-8">
                            <h1 className="text-2xl font-bold">
                                Create Revision Request
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Submit a new request for the development team.
                            </p>
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

                                {/* DEADLINE */}
                                <div>
                                    <label className="text-sm font-medium">Deadline</label>
                                    <input
                                        type="date"
                                        value={data.deadline}
                                        onChange={e => setData("deadline", e.target.value)}
                                        className="mt-2 w-full border rounded-lg p-3"
                                    />
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
                                    {previews.map((src, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={src}
                                                className="h-24 w-full object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
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
                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg"
                                >
                                    {processing ? "Creating..." : "Create Request"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>

                {/* RIGHT PANEL */}


            </div>
        </AppLayout>
    )
}