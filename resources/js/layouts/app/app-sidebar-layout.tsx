import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { SidebarProvider } from '@/components/app-sidebar-context';
import { AppSidebar } from '@/components/app-sidebar-custom';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import useFlashToast from '@/hooks/use-flash-toast';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    useFlashToast();
    return (
        <SidebarProvider>
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent variant="sidebar" className="overflow-x-hidden">
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    {children}
                </AppContent>
            </AppShell>
        </SidebarProvider>
    );
}

