import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSidebar } from "@/components/app-sidebar-context";
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { MessageSquareDot, Sun, MoonStar } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from './ui/button';
import { ThemeSwitcher } from './ui/theme-switcher';
import { useEffect, useState } from 'react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { toggleSidebar } = useSidebar();

    // ✅ Ambil tema dari localStorage sebelum render pertama
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
        }
        return 'system';
    });

    // 🌙 Terapkan tema ke <html> setiap kali berubah
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.add(systemPrefersDark ? 'dark' : 'light');
        } else {
            root.classList.add(theme);
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex flex-row items-center gap-2 w-full">
                <SidebarTrigger className="flex md:hidden -ml-1" onClick={toggleSidebar} />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
                <div className='flex flex-row items-center gap-x-2 ml-auto'>
                    <ThemeSwitcher
                        value={theme}
                        onChange={setTheme}
                        className="border border-pri"
                    />
                    <Link href="#">
                        <Button variant="outline" className="rounded-full !p-2">
                            <MessageSquareDot />
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
