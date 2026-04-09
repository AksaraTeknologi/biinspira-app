import { useForm } from "@inertiajs/react"

export default function CreateTechnician() {

    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
        phone: "",
        password: "",
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post("/technicians")
    }

    return (
        <div className="p-6 max-w-xl mx-auto">

            <h1 className="text-lg font-bold mb-4">
                Create Technician
            </h1>

            <form onSubmit={submit} className="space-y-4">

                <div>
                    <label className="text-sm">Name</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={e => setData("name", e.target.value)}
                        className="w-full border rounded p-2"
                    />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </div>

                <div>
                    <label className="text-sm">Email</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData("email", e.target.value)}
                        className="w-full border rounded p-2"
                    />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                </div>

                <div>
                    <label className="text-sm">Phone</label>
                    <input
                        type="text"
                        value={data.phone}
                        onChange={e => setData("phone", e.target.value)}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="text-sm">Password</label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={e => setData("password", e.target.value)}
                        className="w-full border rounded p-2"
                    />
                    {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    {processing ? "Creating..." : "Create Technician"}
                </button>

            </form>
        </div>
    )
}