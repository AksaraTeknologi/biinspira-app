import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Cookie, CookingPot, LayoutGrid, NotebookText, ShoppingBag, Users } from 'lucide-react';
import AppLogo from './app-logo';

const allNavItems: (NavItem & { roles: string[] })[] = [
    {
        title: 'Beranda',
        href: '/admin/dashboard',
        icon: LayoutGrid,
        roles: ['admin'],
    },
    {
        title: 'Varian',
        href: '/admin/variants',
        icon: CookingPot,
        roles: ['admin'],
    },
    {
        title: 'Produk',
        href: '/admin/products',
        icon: Cookie,
        roles: ['admin'],
    },
    {
        title: 'Hampers',
        href: '/admin/hampers',
        icon: ShoppingBag,
        roles: ['admin'],
    },
    {
        title: 'Katalog',
        href: '/admin/catalogs',
        icon: NotebookText,
        roles: ['admin'],
    },
    {
        title: 'Agen',
        href: '/admin/agents',
        icon: Users,
        roles: ['admin'],
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
