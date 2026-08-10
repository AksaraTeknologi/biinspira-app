import { useSidebar } from '@/components/app-sidebar-context';
import { NavUser } from '@/components/nav-user';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    CalendarSearch,
    ChevronRight,
    CircleUserRound,
    Drill,
    KanbanSquareIcon,
    Laptop,
    LaptopMinimal,
    LayoutGrid,
    List,
    PartyPopper,
    Receipt,
    Target,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from './app-logo';

type TransactionAccess = {
    can_view?: boolean;
    platform_key?: string | null;
};

const DASHBOARD_CHILD_PATHS: Record<string, string[]> = {
    admin: ['/admin/audience-chart'],
    user: ['/user/audience-chart'],
};

const allNavItems: (NavItem & { roles: string[]; children?: NavItem[] })[] = [
    {
        title: 'User Setting',
        href: '',
        icon: CircleUserRound,
        roles: ['admin'],
        children: [
            {
                title: 'User',
                href: route('admin.users.index'),
                icon: CircleUserRound,
            },
            {
                title: 'IT Team',
                href: route('technicians.index'),
                icon: Laptop,
            },
        ],
    },
    {
        title: 'Marketing',
        href: '',
        icon: PartyPopper,
        roles: ['admin'],
        children: [
            { title: 'Dashboard', href: route('admin.marketing.dashboard'), icon: LayoutGrid },
            { title: 'Daftar Iklan', href: route('admin.marketing.index'), icon: List },
            { title: 'Target Iklan', href: route('admin.adgoals.index'), icon: Target },
            { title: 'Event', href: route('admin.events.index'), icon: CalendarSearch },
            { title: 'Platform', href: route('admin.platforms.index'), icon: LaptopMinimal },
            { title: 'Transaksi', href: route('admin.transactions.index'), icon: Receipt },
        ],
    },
    // role: user
    {
        title: 'Marketing',
        href: '',
        icon: PartyPopper,
        roles: ['user'],
        children: [
            { title: 'Dashboard', href: route('user.dashboard'), icon: LayoutGrid },
            { title: 'Daftar Iklan', href: route('user.marketing.index'), icon: List },
            { title: 'Event', href: route('user.events.index'), icon: CalendarSearch },
            { title: 'Transaksi', href: route('user.transactions.index'), icon: Receipt },
        ],
    },
    {
        title: 'Program Event',
        href: route('admin.program-events.index'),
        icon: CalendarSearch,
        roles: ['admin'],
    },
    {
        title: 'Program Event',
        href: route('user.program-events.index'),
        icon: CalendarSearch,
        roles: ['user'],
    },
    {
        title: 'Ticketing Website',
        href: route('requests.index'),
        icon: KanbanSquareIcon,
        roles: ['admin', 'user', 'technician', 'technician-intern'],
    },
];

export function AppSidebar() {
    const page = usePage();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { auth, transactionAccess } = usePage<SharedData & { transactionAccess?: TransactionAccess }>().props;
    const role = auth.role[0];
    const mainNavItems = allNavItems.filter((item) => item.roles.includes(role));
    const canViewUserTransactions = transactionAccess?.can_view === true;

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const currentUrl = page.url.replace(/\/$/, '');

    const isDashboardChildPath = (): boolean => {
        const paths = DASHBOARD_CHILD_PATHS[role] ?? [];
        return paths.some((p) => currentUrl === p || currentUrl.startsWith(p + '/'));
    };

    // === Helper: Hitung parent path ===
    const getParentPath = (item: NavItem & { children?: NavItem[] }): string => {
        if (item.href) {
            return new URL(item.href, window.location.origin).pathname;
        }
        if (item.children && item.children.length > 0) {
            const firstChild = item.children[0];
            const segments = new URL(firstChild.href, window.location.origin).pathname.split('/').filter(Boolean);
            return '/' + segments.slice(0, 2).join('/');
        }
        return '';
    };

    // === Helper: cek apakah submenu terbuka ===
    const checkIsSubMenuOpen = (item: NavItem & { children?: NavItem[] }) => {
        const currentPath = new URL(page.url, window.location.origin).pathname;
        if (item.children && item.children.length > 0) {
            return item.children.some((child) => {
                const childPath = new URL(child.href, window.location.origin).pathname;
                return currentPath === childPath || currentPath.startsWith(childPath + '/');
            });
        }
        const parentPath = getParentPath(item);
        if (!parentPath) return false;
        return currentPath.startsWith(parentPath + '/') || currentPath === parentPath;
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <div className="relative z-0 w-full">
                <div
                    className={`absolute z-10 mt-2 ml-2 h-[95vh] rounded-lg border border-sidebar bg-sidebar shadow-lg transition-all duration-300 lg:mt-0.5 ${
                        isCollapsed ? 'w-15.5' : 'w-60'
                    }`}
                >
                    {/* ===== Header ===== */}
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem className="flex flex-row items-center justify-between">
                                <SidebarMenuButton size="lg" className={`${isCollapsed ? 'hidden' : 'flex'}`} asChild>
                                    {role === 'user' ? (
                                        <Link href="/user/dashboard" prefetch>
                                            <AppLogo />
                                        </Link>
                                    ) : role === 'admin' ? (
                                        <Link href="/admin/marketing/dashboard" prefetch>
                                            <AppLogo />
                                        </Link>
                                    ) : (
                                        <Link href="/dashboard" prefetch>
                                            <AppLogo />
                                        </Link>
                                    )}
                                </SidebarMenuButton>
                                <SidebarTrigger
                                    onClick={toggleSidebar}
                                    className={`rounded-lg p-2 transition-colors hover:bg-background ${isCollapsed ? 'm-auto' : ''}`}
                                />
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    {/* ===== Main Content (Menu Navigasi) ===== */}
                    <SidebarContent className="h-[75%] px-2" style={{ scrollbarWidth: 'none' }}>
                        <SidebarMenu
                            className={`rounded-lg bg-background dark:border dark:border-muted-foreground dark:bg-sidebar dark:active:bg-sidebar ${isCollapsed ? 'p-0' : 'p-2'} `}
                        >
                            {mainNavItems.map((item, i) => {
                                const visibleChildren =
                                    item.children?.filter((child) => !(role === 'user' && child.title === 'Transaksi' && !canViewUserTransactions)) ??
                                    [];
                                const navItem = {
                                    ...item,
                                    children: visibleChildren.length > 0 ? visibleChildren : undefined,
                                };
                                const isOpen = openIndex === i;

                                const isGroupOpen = (() => {
                                    let open = checkIsSubMenuOpen(navItem);

                                    if (navItem.title === 'Marketing') {
                                        // ✅ Tetap buka saat di halaman turunan Dashboard
                                        if (isDashboardChildPath()) open = true;

                                        try {
                                             if (role === 'user') {
                                                const indexBase = route('user.marketing.index')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const showBase = route('user.marketing.show', { id: 'dummy' })
                                                    .replace('/dummy', '')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const createBase = route('user.marketing.create')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const resultBase = String(route('user.marketing.result', { id_event: 'dummy', id_ad_plan: 'dummy' }))
                                                    .replace(/\/dummy/g, '')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const evalBase = route('user.marketing.evaluation', { id: 'dummy' })
                                                    .replace('/dummy', '')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const editBase = route('user.marketing.edit', { id: 'dummy' })
                                                    .replace('/dummy', '')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const editRegex = /^\/user\/marketing\/[^/]+\/edit$/;

                                                if (
                                                    currentUrl === indexBase ||
                                                    currentUrl === showBase ||
                                                    currentUrl === createBase ||
                                                    currentUrl === resultBase ||
                                                    currentUrl === evalBase ||
                                                    currentUrl === editBase ||
                                                    currentUrl.startsWith(indexBase) ||
                                                    currentUrl.startsWith(showBase) ||
                                                    currentUrl.startsWith(createBase) ||
                                                    currentUrl.startsWith(resultBase) ||
                                                    currentUrl.startsWith(evalBase) ||
                                                    currentUrl.startsWith(editBase) ||
                                                    editRegex.test(currentUrl)
                                                ) {
                                                    open = true;
                                                }
                                            }
                                            if (role === 'admin') {
                                                const indexBase = route('admin.marketing.index')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const showBase = route('admin.marketing.show', { id: 'dummy' })
                                                    .replace('/dummy', '')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const createBase = route('admin.marketing.create')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const resultBase = String(route('admin.marketing.result', { id_event: 'dummy', id_ad_plan: 'dummy' }))
                                                    .replace(/\/dummy/g, '')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const evalBase = route('admin.marketing.evaluation', { id: 'dummy' })
                                                    .replace('/dummy', '')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const editBase = route('admin.marketing.edit', { id: 'dummy' })
                                                    .replace('/dummy', '')
                                                    .replace(window.location.origin, '')
                                                    .replace(/\/$/, '');
                                                const editRegex = /^\/admin\/marketing\/[^/]+\/edit$/;

                                                if (
                                                    currentUrl === indexBase ||
                                                    currentUrl === showBase ||
                                                    currentUrl === createBase ||
                                                    currentUrl === resultBase ||
                                                    currentUrl === evalBase ||
                                                    currentUrl === editBase ||
                                                    currentUrl.startsWith(indexBase) ||
                                                    currentUrl.startsWith(showBase) ||
                                                    currentUrl.startsWith(createBase) ||
                                                    currentUrl.startsWith(resultBase) ||
                                                    currentUrl.startsWith(evalBase) ||
                                                    currentUrl.startsWith(editBase) ||
                                                    editRegex.test(currentUrl)
                                                ) {
                                                    open = true;
                                                }
                                            }
                                        } catch {
                                            // ignore if route helper unavailable
                                        }
                                    }
                                    return open;
                                })();

                                return (
                                    <Collapsible
                                        key={i}
                                        open={isGroupOpen || openIndex === i}
                                        onOpenChange={(open) => setOpenIndex(open ? i : null)}
                                        className={`group/collapsible`}
                                    >
                                        <SidebarMenuItem
                                            className={`rounded-lg p-1.5 ${isGroupOpen ? 'bg-sidebar-primary text-background hover:bg-sidebar-primary' : 'hover:bg-sidebar-primary'} ${openIndex === i ? 'bg-primary' : ''} `}
                                        >
                                            {navItem.children ? (
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton
                                                        tooltip={isCollapsed ? navItem.title : undefined}
                                                        className={`w-full justify-between hover:bg-sidebar-primary hover:text-gray-100 active:bg-sidebar-primary ${isGroupOpen ? 'bg-gray-100 text-black' : `${isOpen ? 'text-gray-100' : ''}`} `}
                                                    >
                                                        <div className="flex w-full cursor-pointer items-center gap-2">
                                                            {navItem.icon && <navItem.icon className="h-5 w-5" />}
                                                            {!isCollapsed && <span>{navItem.title}</span>}
                                                        </div>
                                                        <ChevronRight
                                                            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} ${isGroupOpen ? 'rotate-90' : ''} `}
                                                        />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                            ) : (
                                                <SidebarMenuButton
                                                    tooltip={isCollapsed ? navItem.title : undefined}
                                                    className={`hover:bg-sidebar-primary hover:text-gray-100 active:bg-sidebar-primary ${isGroupOpen ? 'text-gray-100 hover:bg-sidebar-primary' : ''}`}
                                                    asChild
                                                >
                                                    <Link href={navItem.href || '#'} className={`flex w-full items-center gap-2`}>
                                                        {navItem.icon && <navItem.icon className="h-5 w-5" />}
                                                        {!isCollapsed && <span>{navItem.title}</span>}
                                                    </Link>
                                                </SidebarMenuButton>
                                            )}

                                            {/* Sub menu */}
                                            {navItem.children && (
                                                <CollapsibleContent>
                                                    <SidebarMenuSub
                                                        className={`border-0 pt-2 ${isCollapsed ? '-ml-2.5 w-13' : 'ml-3'}`}
                                                        style={{ overflow: 'visible' }}
                                                    >
                                                        {navItem.children.map((sub, j) => {
                                                            const isSubActive = (() => {
                                                                const subHref = sub.href.replace(window.location.origin, '').replace(/\/$/, '');
                                                                let active = currentUrl === subHref || currentUrl.startsWith(subHref);

                                                                // ✅ Dashboard aktif saat di halaman turunannya
                                                                if (sub.title === 'Dashboard' && isDashboardChildPath()) {
                                                                    active = true;
                                                                }

                                                                // Daftar Iklan aktif saat di create/edit/result/eval
                                                                if (sub.title === 'Daftar Iklan') {
                                                                    try {
                                                                        if (role === 'admin') {
                                                                            const indexBase = route('admin.marketing.index')
                                                                                .replace(window.location.origin, '')
                                                                                .replace(/\/$/, '');
                                                                            const showBase = route('admin.marketing.show', { id: 'dummy' })
                                                                                .replace('/dummy', '')
                                                                                .replace(window.location.origin, '')
                                                                                .replace(/\/$/, '');
                                                                            const createBase = route('admin.marketing.create')
                                                                                .replace(window.location.origin, '')
                                                                                .replace(/\/$/, '');
                                                                            const resultBase = String(
                                                                                route('admin.marketing.result', {
                                                                                    id_event: 'dummy',
                                                                                    id_ad_plan: 'dummy',
                                                                                }),
                                                                            )
                                                                                .replace(/\/dummy/g, '')
                                                                                .replace(window.location.origin, '')
                                                                                .replace(/\/$/, '');
                                                                            const evalBase = route('admin.marketing.evaluation', { id: 'dummy' })
                                                                                .replace('/dummy', '')
                                                                                .replace(window.location.origin, '')
                                                                                .replace(/\/$/, '');
                                                                            const editBase = route('admin.marketing.edit', { id: 'dummy' })
                                                                                .replace('/dummy', '')
                                                                                .replace(window.location.origin, '')
                                                                                .replace(/\/$/, '');
                                                                            const editRegex = /^\/admin\/marketing\/[^/]+\/edit$/;
                                                                            if (
                                                                                currentUrl === indexBase ||
                                                                                currentUrl === showBase ||
                                                                                currentUrl === createBase ||
                                                                                currentUrl === resultBase ||
                                                                                currentUrl === evalBase ||
                                                                                currentUrl === editBase ||
                                                                                currentUrl.startsWith(indexBase) ||
                                                                                currentUrl.startsWith(showBase) ||
                                                                                currentUrl.startsWith(createBase) ||
                                                                                currentUrl.startsWith(resultBase) ||
                                                                                currentUrl.startsWith(evalBase) ||
                                                                                currentUrl.startsWith(editBase) ||
                                                                                editRegex.test(currentUrl)
                                                                            ) {
                                                                                active = true;
                                                                            }
                                                                        }
                                                                    } catch {
                                                                        // ignore if route helper unavailable
                                                                    }
                                                                }

                                                                return active;
                                                            })();

                                                            return (
                                                                <SidebarMenuSubItem key={j}>
                                                                    <Link
                                                                        href={sub.href}
                                                                        className={`flex items-center gap-2 rounded-lg py-1 text-sm hover:bg-gray-100 hover:text-black ${isSubActive ? 'bg-gray-100 text-black' : `${isGroupOpen ? 'text-gray-100' : 'text-gray-100'}`} ${isCollapsed ? 'pl-2' : 'pl-3'} `}
                                                                    >
                                                                        {sub.icon && <sub.icon className="h-4 w-4" />}
                                                                        <span className={isCollapsed ? 'hidden' : 'block'}>{sub.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubItem>
                                                            );
                                                        })}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            )}
                                        </SidebarMenuItem>
                                    </Collapsible>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarContent>

                    {/* ===== Footer (User Info) ===== */}
                    <SidebarFooter className="absolute right-0 bottom-2 left-0 px-2">
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
