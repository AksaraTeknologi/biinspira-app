import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookCheck, CircleUserRound, FilePlus2, LayoutGrid, MessageSquareQuote, PartyPopper } from 'lucide-react';
import AppLogo from './app-logo';

const allNavItems: (NavItem & { roles: string[] })[] = [
    {
        title: 'Beranda',
        href: route("admin.dashboard"),
        icon: LayoutGrid,
        roles: ['admin'],
    },
    {
        title: 'Event',
        href: route("admin.events.index"),
        icon: PartyPopper,
        roles: ['admin'],
    },
    {
        title: 'Marketing',
        href: route("admin.marketing.index"),
        icon: PartyPopper,
        roles: ['admin'],
    },
    {
        title: 'Platfom',
        href: route("admin.platforms.index"),
        icon: MessageSquareQuote,
        roles: ['admin'],
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
    {
        title: 'Form Iklan',
        href: route("user.adsForm"),
        icon: FilePlus2,
        roles: ['user'],
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];

    const mainNavItems = allNavItems.filter((item) => item.roles.includes(role));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
