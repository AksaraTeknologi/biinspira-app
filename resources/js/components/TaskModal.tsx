"use client"

import { X, Calendar, Link2, ShieldAlert, Building2, Hammer } from "lucide-react";
import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

type User = {
    id: number;
    name: string;
    role: string;
};

type TaskModalProps = {
    task: any;
    onClose: () => void;
    users?: User[];
};

export default function TaskModal({ task, onClose, users = [] }: TaskModalProps) {

    if (!task) return null;

    const [preview, setPreview] = useState<string | null>(null);
    const [openCalendar, setOpenCalendar] = useState(false);

    const progressMap: Record<string, number> = {
        request: 10,
        todo: 25,
        in_progress: 60,
        in_review: 85,
        complete: 100,
    };

    const { auth }: any = usePage().props;
    const userRoles = auth?.user?.roles?.map((r: any) => r.name) || [];
    const userRole = userRoles[0] ?? null;

    const { data, setData, patch, processing } = useForm({
        status: task.status || "request",
        estimation_start: task.estimation_start || null,
        estimation_end: task.estimation_end || null,
        assigned_to: task.assigned_to || "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        patch(`/requests/${task.id}/status`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const attachments = task.attachments || [];

    const isImage = (file: string) => {
        return file.match(/\.(jpg|jpeg|png|webp|gif)$/i);
    };

    const parseDate = (date: string | null) => {
        if (!date) return undefined;
        return new Date(date.split(" ")[0]);
    };

    const range: DateRange = {
        from: parseDate(data.estimation_start),
        to: parseDate(data.estimation_end),
    };
    const [expandedDesc, setExpandedDesc] = useState(false);
    useEffect(() => {
        setExpandedDesc(false);
    }, [task?.id]);
    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">

                <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-y-auto max-h-[90vh] flex flex-col">

                    {/* PROGRESS */}
                    <div className="w-full bg-gray-200 h-2">
                        <div
                            className="h-2 bg-blue-500 transition-all duration-500"
                            style={{ width: `${progressMap[task.status] || 0}%` }}
                        />
                    </div>

                    <div className="text-xs text-gray-500 px-5 pt-2">
                        Progress: {progressMap[task.status] || 0}%
                    </div>

                    {/* HEADER */}
                    <div className="flex justify-between items-center border-b p-5">
                        <div>
                            <h2 className="text-xl font-bold">{task.title}</h2>
                            <div className="flex gap-2 mt-2">
                                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-600">
                                    {task.status}
                                </span>
                            </div>
                        </div>

                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                            <X size={18} />
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">

                        {/* DESCRIPTION */}
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 overflow-hidden">
                            <p
                                className={`leading-relaxed break-words whitespace-pre-wrap ${expandedDesc ? "" : "line-clamp-3"
                                    }`}
                            >
                                {task.description || "No description"}
                            </p>

                            {task.description && task.description.length > 120 && (
                                <button
                                    type="button"
                                    onClick={() => setExpandedDesc(!expandedDesc)}
                                    className="text-xs text-blue-600 mt-2 hover:underline"
                                >
                                    {expandedDesc ? "Tutup" : "Selengkapnya"}
                                </button>
                            )}
                        </div>

                        {/* ATTACHMENT */}
                        {attachments.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-gray-500 mb-2">
                                    Attachments
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {attachments.map((file: any, index: number) => {
                                        const url = `/storage/${file.file_path}`;

                                        if (isImage(file.file_path)) {
                                            return (
                                                <img
                                                    key={index}
                                                    src={url}
                                                    onClick={() => setPreview(url)}
                                                    className="rounded-lg cursor-pointer object-cover h-28 w-full hover:scale-105 transition"
                                                />
                                            );
                                        }

                                        return (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                className="flex items-center gap-2 text-blue-600 text-sm hover:underline"
                                            >
                                                <Link2 size={16} />
                                                Open File
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* INFO */}
                        <div className="grid md:grid-cols-2 gap-4">

                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2">
                                <Building2 size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Platform</p>
                                    <p className="font-medium">{task.created_by_name}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2">
                                <Hammer size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Assigned Technician</p>
                                    <p className="font-medium">
                                        {task.assigned_to_name || "Unassigned"}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Deadline</p>
                                    <p className="font-medium">
                                        {task.deadline || "No deadline"}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2">
                                <ShieldAlert size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Urgency</p>
                                    <p className="font-medium">
                                        {task.urgency || "-"}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-500">Estimation end</p>
                                    <p className="font-medium">
                                        {data.estimation_end
                                            ? format(new Date(data.estimation_end), "dd MMM yyyy")
                                            : "-"}
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* 🔥 ESTIMATION (FIXED) */}

                        {/* FORM */}
                        {(userRoles.includes("technician") || userRoles.includes("admin")) && (
                            <form onSubmit={submit} className="space-y-4 border-t pt-4">

                                <h3 className="text-sm font-semibold text-gray-600">
                                    Update Task
                                </h3>

                                {/* DISPLAY */}
                                <div className="grid grid-cols-2 gap-4">

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-500">Estimation Start</p>
                                        <p className="font-medium">
                                            {data.estimation_start
                                                ? format(new Date(data.estimation_start), "dd MMM yyyy")
                                                : "-"}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-xs text-gray-500">Estimation End</p>
                                        <p className="font-medium">
                                            {data.estimation_end
                                                ? format(new Date(data.estimation_end), "dd MMM yyyy")
                                                : "-"}
                                        </p>
                                    </div>

                                </div>
                                <div className="space-y-4">

                                    {/* PICKER */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500 mb-2">
                                            Estimation Range
                                        </p>

                                        <button
                                            onClick={() => setOpenCalendar(!openCalendar)}
                                            className="w-full border rounded-lg p-3 text-left"
                                        >
                                            {range?.from ? (
                                                range.to
                                                    ? `${format(range.from, "dd MMM yyyy")} - ${format(range.to, "dd MMM yyyy")}`
                                                    : format(range.from, "dd MMM yyyy")
                                            ) : (
                                                "Pick date range"
                                            )}
                                        </button>

                                        {openCalendar && (
                                            <div className="mt-3 border rounded-lg p-2 bg-white shadow inline-block">
                                                <DayPicker
                                                    mode="range"
                                                    selected={range}
                                                    onSelect={(r) => {
                                                        setData({
                                                            ...data,
                                                            estimation_start: r?.from
                                                                ? format(r.from, "yyyy-MM-dd")
                                                                : null,
                                                            estimation_end: r?.to
                                                                ? format(r.to, "yyyy-MM-dd")
                                                                : null,
                                                        });
                                                    }}
                                                    numberOfMonths={1}
                                                    className="text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>


                                </div>

                                {userRoles.includes("admin") && (
                                    <div>
                                        <label className="text-xs text-gray-500">
                                            Assign Technician
                                        </label>

                                        <select
                                            value={data.assigned_to}
                                            onChange={e => setData("assigned_to", e.target.value)}
                                            className="mt-1 w-full border rounded-lg p-2 text-sm"
                                        >
                                            <option value="">-- Unassigned --</option>

                                            {users.map((u: any) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                                    >
                                        {processing ? "Updating..." : "Update"}
                                    </button>
                                </div>

                            </form>
                        )}

                    </div>

                </div>

            </div>

            {/* PREVIEW */}
            {preview && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
                    onClick={() => setPreview(null)}
                >
                    <img
                        src={preview}
                        className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-xl"
                    />
                </div>
            )}
        </>
    );
}