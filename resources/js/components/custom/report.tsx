import { Button } from '@/components/ui/button';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import React from 'react';
import { Card } from '../ui/card';

const containerStyle: React.CSSProperties = {
    padding: '20px 15px 20px 15px',
    borderRadius: 16,
    color: '#ffffff',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 8px 32px rgba(8, 15, 25, 0.35)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start',
    transition: 'transform 180ms ease, box-shadow 180ms ease',
};

export default function ReportCard() {
    const { props } = usePage<any>();
    const { auth } = usePage<SharedData>().props;
    const role: string = auth.role[0];

    const createRoute = role === 'admin' ? route('admin.marketing.create') : route('user.marketing.create');

    return (
        <Card
            role="article"
            className="h-[25vh]"
            style={{
                ...(containerStyle as React.CSSProperties),
                backgroundImage: "url('/assets/images/avatar-1.png')",
                backgroundSize: 'cover', // agar gambar menutupi seluruh area
                backgroundPosition: 'center top', // agar posisi gambar di tengah
                backgroundRepeat: 'no-repeat', // agar tidak diulang
            }}
        >
            <div className="grid h-full grid-cols-12">
                <div className="col-span-6 col-start-7 flex flex-col">
                    <Link href={createRoute} className="ml-auto">
                        <Button variant="outline" className="w-fit text-[12px]">
                            <span>Laporkan Iklan Anda</span>
                            <FileText />
                        </Button>
                    </Link>
                    <div className="mt-auto text-right font-semibold text-primary">Laporkan iklan pada platform yang anda miliki</div>
                </div>
            </div>
        </Card>
    );
}
