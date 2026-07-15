import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarTrigger, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookCheck, CalendarSearch, CircleUserRound, LaptopMinimal, LayoutGrid, List, MessageSquareQuote, PartyPopper, Target } from 'lucide-react';
import AppLogo from './app-logo';
import { useSidebar } from "@/components/app-sidebar-context";

const allNavItems: (NavItem & { roles: string[], children?: NavItem[] })[] = [
    {
        title: 'Beranda',
        href: route("admin.dashboard"),
        icon: LayoutGrid,
        roles: ['admin'],
    },
    {
        title: 'Marketing',
        href: "",
        icon: PartyPopper,
        roles: ['admin'],
        children: [
            { title: 'Dashboard', href: route("admin.marketing.dashboard"), icon: LayoutGrid },
            { title: 'Daftar Iklan', href: route("admin.marketing.index"), icon: List },
            { title: 'Target Iklan', href: "#", icon: Target },
            { title: 'Event', href: route("admin.events.index"), icon: CalendarSearch },
            { title: 'Program Event', href: route("admin.program-events.index"), icon: CalendarSearch },
            { title: 'Platform', href: route("admin.platforms.index"), icon: LaptopMinimal },
        ],
    },
    {
        title: 'Hasil',
        href: '/admin/hasil',
        icon: BookCheck,
        roles: ['admin'],
    },
    {
        title: 'User',
        href: route("admin.users.index"),
        icon: CircleUserRound,
        roles: ['admin'],
    },

    {   title: 'qms', 
        href: route("request.index"), 
        icon: BookCheck,
        roles: ['admin'] },

    // role: user
    {
        title: 'Beranda',
        href: route("user.dashboard"),
        icon: LayoutGrid,
        roles: ['user'],
    },
    {
        title: 'Marketing',
        href: route("user.marketing"),
        icon: MessageSquareQuote,
        roles: ['user'],
    },
];

export function AppSidebar() {
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const mainNavItems = allNavItems.filter((item) => item.roles.includes(role));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <div className="w-full relative z-0">
                <div className={`absolute z-10 mt-2 lg:mt-0.5 ml-2 h-[95vh] bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-300 ${isCollapsed ? 'w-18' : 'w-60'}`}>
                    {/* Header */}
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem className='flex flex-row justify-between items-center'>
                                <SidebarMenuButton size="lg" className={`${isCollapsed ? 'hidden' : 'flex'}`} asChild>
                                    <Link href="/dashboard" prefetch>
                                        <AppLogo />
                                    </Link>
                                </SidebarMenuButton>
                                <SidebarTrigger
                                    onClick={toggleSidebar}
                                    className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${isCollapsed ? 'm-auto' : ''}`}
                                />
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    {/* Menu Section */}
                    <SidebarContent className='h-[75%] pr-1' style={{ scrollbarWidth: 'none' }}>
                        <NavMain
                            items={mainNavItems}
                            className={isCollapsed ? 'p-0' : 'p-2'}
                            subClassName={isCollapsed ? '' : 'ml-7 mr-3'}
                        />
                    </SidebarContent>

                    {/* Admin Section */}
                    <SidebarFooter className="absolute left-0 right-0 bottom-2 px-2">
                        <div className="flex w-full">
                            <div className={isCollapsed ? 'mx-auto' : 'w-full'}>
                                <NavUser />
                            </div>
                        </div>
                    </SidebarFooter>
                </div>
            </div>
        </Sidebar>
    );
}
