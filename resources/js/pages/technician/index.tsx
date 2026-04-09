"use client"

import AppLayout from "@/layouts/app-layout"
import { Head, useForm } from "@inertiajs/react"
import { useState } from "react"
import { Plus, X } from "lucide-react"

type User = {
    id: number
    name: string
    email: string
    phone?: string
}

type Props = {
    users: User[]
}

export default function Index({ users }: Props) {

    const [open, setOpen] = useState(false)

    const { data, setData, post, processing, reset, errors } = useForm({
        name: "",
        email: "",
        phone: "",
        password: "",
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()

        post("/technicians", {
            onSuccess: () => {
                reset()
                setOpen(false)
            }
        })
    }

    return (
        <AppLayout>
            <Head title="Manage Technicians" />

            <div className="p-6 space-y-6">

                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            Technician Management
                        </h1>
                        <p className="text-sm text-gray-400">
                            Manage technician accounts
                        </p>
                    </div>

                    <button
                        onClick={() => setOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                        <Plus size={16} />
                        Add Technician
                    </button>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-xl shadow border border-gray-100">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b">
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b">
                                    <td className="p-3 font-medium">{user.name}</td>
                                    <td className="p-3">{user.email}</td>
                                    <td className="p-3">{user.phone || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {users.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            No technicians yet
                        </div>
                    )}
                </div>

            </div>

            {/* MODAL CREATE */}
            {open && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-white w-full max-w-md rounded-xl shadow-lg">

                        {/* HEADER */}
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="font-semibold">Add Technician</h2>
                            <button onClick={() => setOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* FORM */}
                        <form onSubmit={submit} className="p-4 space-y-4">

                            <div>
                                <label className="text-xs text-gray-500">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData("name", e.target.value)}
                                    className="w-full border rounded-lg p-2 text-sm"
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-gray-500">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData("email", e.target.value)}
                                    className="w-full border rounded-lg p-2 text-sm"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-gray-500">Phone</label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={e => setData("phone", e.target.value)}
                                    className="w-full border rounded-lg p-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500">Password</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData("password", e.target.value)}
                                    className="w-full border rounded-lg p-2 text-sm"
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-xs">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                                >
                                    {processing ? "Saving..." : "Save"}
                                </button>
                            </div>

                        </form>

                    </div>

                </div>
            )}

        </AppLayout>
    )
}