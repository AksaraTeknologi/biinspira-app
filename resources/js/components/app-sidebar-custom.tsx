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
    LaptopMinimal,
    LayoutGrid,
    List,
    MessageSquareQuote,
    PartyPopper,
    Target,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from './app-logo';

const allNavItems: (NavItem & { roles: string[]; children?: NavItem[] })[] = [
    {
        title: 'User',
        href: route('admin.users.index'),
        icon: CircleUserRound,
        roles: ['admin'],
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
        ],
    },
    // {
    //     title: 'Affiliatte',
    //     href: '/admin/hasil',
    //     icon: BookCheck,
    //     roles: ['admin'],
    // },
    // {
    //     title: 'User',
    //     href: route("admin.users.index"),
    //     icon: CircleUserRound,
    //     roles: ['admin'],
    // },

    // role: user
    {
        title: 'Beranda',
        href: route('user.dashboard'),
        icon: LayoutGrid,
        roles: ['user'],
    },
    {
        title: 'Marketing',
        href: route('user.marketing.index'),
        icon: MessageSquareQuote,
        roles: ['user'],
    },
    {
        title: 'Events',
        href: route('user.events.index'),
        icon: CalendarSearch,
        roles: ['user'],
    },
];

export function AppSidebar() {
    const page = usePage();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const mainNavItems = allNavItems.filter((item) => item.roles.includes(role)); //daftar menu sidebar

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    // === Helper: Hitung parent path ===
    const getParentPath = (item: NavItem & { children?: NavItem[] }): string => {
        // Jika item punya href, gunakan itu sebagai parent
        if (item.href) {
            return new URL(item.href, window.location.origin).pathname;
        }

        // Jika tidak punya href, ambil dari prefix child → /admin/{menu}
        if (item.children && item.children.length > 0) {
            const firstChild = item.children[0];
            const segments = new URL(firstChild.href, window.location.origin).pathname.split('/').filter(Boolean); // buang string kosong

            // Ambil hanya /admin/marketing
            return '/' + segments.slice(0, 2).join('/');
        }

        return '';
    };

    // === Helper: cek apakah submenu terbuka ===
    const checkIsSubMenuOpen = (item: NavItem & { children?: NavItem[] }) => {
        const currentPath = new URL(page.url, window.location.origin).pathname;
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
                                {/* Logo */}
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

                                {/* Collapse Trigger */}
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
                                const isOpen = openIndex === i;
                                const isGroupOpen = (() => {
                                    let open = checkIsSubMenuOpen(item);
                                    const currentUrl = page.url.replace(/\/$/, '');

                                    if (item.title === 'Marketing') {
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

                                                // Perbaikan: gunakan variable `open` bukan `active`
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
                                                    open = true; // Perbaikan: set `open` bukan `active`
                                                }
                                            }
                                        } catch (e) {
                                            // ignore if route helper unavailable
                                        }
                                    }
                                    return open;
                                })();

                                return (
                                    <Collapsible
                                        key={i}
                                        defaultOpen={isGroupOpen}
                                        onOpenChange={(defaultOpen) => setOpenIndex(defaultOpen ? i : null)}
                                        className={`group/collapsible`}
                                    >
                                        <SidebarMenuItem
                                            className={`rounded-lg p-1.5 ${isGroupOpen ? 'bg-sidebar-primary text-background hover:bg-sidebar-primary' : 'hover:bg-sidebar-primary'} ${isOpen ? 'bg-primary' : ''} `}
                                        >
                                            {item.children ? (
                                                // jika punya submenu, jadikan tombol collapsible tanpa link
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton
                                                        tooltip={isCollapsed ? item.title : undefined}
                                                        className={`w-full justify-between hover:bg-sidebar-primary hover:text-gray-100 active:bg-sidebar-primary ${isGroupOpen ? 'bg-gray-100 text-black' : `${isOpen ? 'text-gray-100' : ''}`} `}
                                                    >
                                                        <div className="flex w-full cursor-pointer items-center gap-2">
                                                            {item.icon && <item.icon className="h-5 w-5" />}
                                                            {!isCollapsed && <span>{item.title}</span>}
                                                        </div>
                                                        <ChevronRight
                                                            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} ${isGroupOpen ? 'rotate-90' : ''} `}
                                                        />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                            ) : (
                                                // jika tidak punya submenu, jadikan Link biasa
                                                <SidebarMenuButton
                                                    tooltip={isCollapsed ? item.title : undefined}
                                                    className={`hover:bg-sidebar-primary hover:text-gray-100 active:bg-sidebar-primary ${isGroupOpen ? 'text-gray-100 hover:bg-sidebar-primary' : ''}`}
                                                    asChild
                                                >
                                                    <Link href={item.href || '#'} className={`flex w-full items-center gap-2`}>
                                                        {item.icon && <item.icon className="h-5 w-5" />}
                                                        {!isCollapsed && <span>{item.title}</span>}
                                                    </Link>
                                                </SidebarMenuButton>
                                            )}

                                            {/* Sub menu */}
                                            {item.children && (
                                                <CollapsibleContent>
                                                    <SidebarMenuSub
                                                        className={`border-0 pt-2 ${isCollapsed ? '-ml-2.5 w-13' : 'ml-3'}`}
                                                        style={{ overflow: 'visible' }}
                                                    >
                                                        {item.children.map((sub, j) => {
                                                            const isSubActive = (() => {
                                                                const currentUrl = page.url.replace(/\/$/, '');
                                                                const subHref = sub.href.replace(window.location.origin, '').replace(/\/$/, '');
                                                                // return currentUrl === subHref || currentUrl.startsWith(subHref);
                                                                // })();
                                                                // const isSubActive = (() => {
                                                                // const currentUrl = page.url.replace(/\/$/, "");
                                                                // const subHref = sub.href.replace(window.location.origin, "").replace(/\/$/, "");
                                                                let active = currentUrl === subHref || currentUrl.startsWith(subHref);

                                                                // biarkan isSubActive pada 'Daftar Iklan' juga saat berada di create/edit untuk role terkait
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
                                                                    } catch (e) {
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
