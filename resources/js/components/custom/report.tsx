import { Button } from "@/components/ui/button";
import { StickyNote } from "lucide-react";
import React from "react";
import { Card } from "../ui/card";
import { Link } from "@inertiajs/react";

const containerStyle: React.CSSProperties = {
    padding: "20px 10px 20px 15px",
    borderRadius: 16,
    color: "#ffffff",
    background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 8px 32px rgba(8, 15, 25, 0.35)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    transition: "transform 180ms ease, box-shadow 180ms ease",
};

export default function ReportCard() {

    return (
        <Card
            role="article"
            className="h-[30vh]"
            style={{
                ...(containerStyle as React.CSSProperties),
                backgroundImage: "url('/assets/images/avatar-1.png')",
                backgroundSize: "cover",       // agar gambar menutupi seluruh area
                backgroundPosition: "center top",  // agar posisi gambar di tengah
                backgroundRepeat: "no-repeat", // agar tidak diulang
            }}
        >
            <div className="grid grid-cols-12 h-full">
                <div className="col-start-7 col-span-6 flex flex-col">
                    <Link href={route('admin.marketing.create')} className="ml-auto">
                        <Button variant="outline" className="w-fit text-[12px]">
                            <span className="hidden sm:block">Laporkan Iklan Anda</span>
                            <StickyNote />
                        </Button>
                    </Link>
                    <div className="mt-auto text-[10px] text-[#FFFFFFBF] text-justify">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </div>
                </div>
            </div>
        </Card >
    );
}