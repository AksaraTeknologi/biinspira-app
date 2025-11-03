import { Toaster } from '@/components/ui/sonner';
import UserLayoutTemplate from '@/layouts/app/app-header-layout';
import { type BreadcrumbItem } from '@/types';
import { MessageCircle } from 'lucide-react';
import { type ReactNode } from 'react';

interface UserLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: UserLayoutProps) => (
    <UserLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <a
            href="https://wa.me/6285649796210?text=Halo%2C%20saya%20ingin%20memesan%20produk%20Serena%20Cookies."
            target="_blank"
            rel="noopener noreferrer"
            className="fixed right-5 bottom-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 shadow-lg transition hover:bg-green-600"
            aria-label="Chat WhatsApp"
        >
            <MessageCircle className="h-6 w-6 text-white" />
        </a>
        <Toaster position="top-center" richColors />
    </UserLayoutTemplate>
);
