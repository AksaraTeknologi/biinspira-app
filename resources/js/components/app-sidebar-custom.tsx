import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarTrigger, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookCheck, CalendarSearch, ChevronRight, CircleUserRound, LaptopMinimal, LayoutGrid, List, MessageSquareQuote, PartyPopper, Target } from 'lucide-react';
import AppLogo from './app-logo';
import { useSidebar } from "@/components/app-sidebar-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

const allNavItems: (NavItem & { roles: string[], children?: NavItem[] })[] = [
    {
        title: 'User',
        href: route("admin.users.index"),
        icon: CircleUserRound,
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
            { title: 'Target Iklan', href: route("admin.adgoals.index"), icon: Target },
            { title: 'Event', href: route("admin.events.index"), icon: CalendarSearch },
            { title: 'Platform', href: route("admin.platforms.index"), icon: LaptopMinimal },
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
        href: route("user.dashboard"),
        icon: LayoutGrid,
        roles: ['user'],
    },
    {
        title: 'Marketing',
        href: route("user.marketing.index"),
        icon: MessageSquareQuote,
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

    return (
        <Sidebar collapsible="icon" variant="inset">
            <div className="w-full relative z-0">
                <div
                    className={`absolute z-10 mt-2 lg:mt-0.5 ml-2 h-[95vh] bg-sidebar rounded-lg shadow-lg
                        border border-sidebar transition-all duration-300
                        ${isCollapsed ? "w-15.5" : "w-60"
                        }`}
                >
                    {/* ===== Header ===== */}
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem className="flex flex-row justify-between items-center">
                                {/* Logo */}
                                <SidebarMenuButton
                                    size="lg"
                                    className={`${isCollapsed ? "hidden" : "flex"}`}
                                    asChild
                                >
                                    <Link href="/dashboard" prefetch>
                                        <AppLogo />
                                    </Link>
                                </SidebarMenuButton>

                                {/* Collapse Trigger */}
                                <SidebarTrigger
                                    onClick={toggleSidebar}
                                    className={`p-2 rounded-lg hover:bg-background transition-colors ${isCollapsed ? "m-auto" : ""
                                        }`}
                                />
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    {/* ===== Main Content (Menu Navigasi) ===== */}
                    <SidebarContent className="h-[75%] px-2" style={{ scrollbarWidth: "none" }}>
                        <SidebarMenu
                            className={`bg-background dark:active:bg-sidebar dark:bg-sidebar dark:border dark:border-muted-foreground rounded-lg
                                ${isCollapsed ? "p-0" : "p-2"}
                        `}>
                            {mainNavItems.map((item, i) => {
                                const isOpen = openIndex === i;
                                const isActive = (() => {
                                    const currentUrl = page.url.replace(/\/+$/, "");
                                    const itemHref = item.href?.replace(window.location.origin, "").replace(/\/+$/, "");

                                    if (item.children && item.children.length > 0) {
                                        return item.children.some((child) =>
                                            currentUrl.startsWith(child.href.replace(window.location.origin, ""))
                                        );
                                    }

                                    const hrefMatch = currentUrl === itemHref || currentUrl.startsWith(itemHref);
                                    const routeName = typeof page.props?.routeName === "string" ? page.props.routeName.toLowerCase() : undefined;
                                    const itemTitle = typeof item.title === "string" ? item.title.toLowerCase() : undefined;
                                    const routeNameMatch = routeName !== undefined && itemTitle !== undefined && routeName === itemTitle;

                                    return hrefMatch || routeNameMatch;
                                })();

                                return (
                                    <Collapsible
                                        key={i}
                                        defaultOpen={(() => {
                                            if (!item.children || typeof window === 'undefined') return false;

                                            const currentPath = window.location.pathname;

                                            try {
                                                // Ambil prefix parent berdasarkan salah satu child
                                                // (semua child marketing punya pola /admin/marketing/...)
                                                const firstChild = item.children[0];
                                                if (!firstChild?.href) return false;

                                                const parentPath = new URL(firstChild.href, window.location.origin)
                                                    .pathname
                                                    .split('/')
                                                    .slice(0, -1) // hapus bagian terakhir (misal 'dashboard' jadi '/admin/marketing')
                                                    .join('/');

                                                // Jika currentPath mengandung parentPath, berarti kita sedang di area parent itu
                                                return currentPath.startsWith(parentPath + '/');
                                            } catch {
                                                return false;
                                            }
                                        })()}
                                        onOpenChange={(defaultOpen) => setOpenIndex(defaultOpen ? i : null)}
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem className={`p-1.5  rounded-lg
                                            ${isActive ? "bg-sidebar-primary hover:bg-sidebar-primary text-background" : "hover:bg-sidebar-primary"}
                                            ${isOpen ? "bg-primary" : ""}
                                            `}>
                                            {item.children ? (
                                                // jika punya submenu, jadikan tombol collapsible tanpa link
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton
                                                        tooltip={isCollapsed ? item.title : undefined}
                                                        className={`w-full justify-between hover:bg-sidebar-primary hover:text-gray-100 active:bg-sidebar-primary
                                                            ${isActive ? "bg-gray-100 text-black" : `${isOpen ? "text-gray-100" : ""}`}
                                                            `}
                                                    >
                                                        <div className="flex items-center gap-2 w-full cursor-pointer">
                                                            {item.icon && <item.icon className="w-5 h-5" />}
                                                            {!isCollapsed && <span>{item.title}</span>}
                                                        </div>
                                                        <ChevronRight className={`w-4 h-4 transition-transform duration-200
                                                            ${isOpen ? 'rotate-90' : ''}
                                                            ${isActive ? 'rotate-90' : ''}
                                                            `} />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                            ) : (
                                                // jika tidak punya submenu, jadikan Link biasa
                                                <SidebarMenuButton
                                                    tooltip={isCollapsed ? item.title : undefined}
                                                    className={`hover:bg-sidebar-primary active:bg-sidebar-primary hover:text-gray-100
                                                        ${isActive ? "hover:bg-sidebar-primary text-gray-100" : ""}`}
                                                    asChild
                                                >
                                                    <Link
                                                        href={item.href || '#'}
                                                        className={`flex items-center gap-2 w-full`}
                                                    >
                                                        {item.icon && <item.icon className="w-5 h-5" />}
                                                        {!isCollapsed && <span>{item.title}</span>}
                                                    </Link>
                                                </SidebarMenuButton>
                                            )}

                                            {/* Sub menu */}
                                            {item.children && (
                                                <CollapsibleContent>
                                                    <SidebarMenuSub
                                                        className={`border-0 pt-2
                                                            ${isCollapsed ? "-ml-2.5 w-13" : "ml-3"}`}
                                                        style={{ overflow: "visible" }}
                                                    >
                                                        {item.children.map((sub, j) => {
                                                            const subActive = (() => {
                                                                const currentUrl = page.url.replace(/\/$/, "");
                                                                const subHref = sub.href.replace(window.location.origin, "").replace(/\/$/, "");
                                                                return currentUrl === subHref || currentUrl.startsWith(subHref);
                                                            })();

                                                            return (
                                                                <SidebarMenuSubItem key={j}>
                                                                    <Link
                                                                        href={sub.href}
                                                                        className={`flex items-center gap-2 py-1 text-sm hover:bg-gray-100 hover:text-black rounded-lg
                                                                                ${isOpen ? "" : "text-background" }
                                                                                ${subActive ? "bg-gray-100 text-black" : "text-gray-100"}
                                                                                ${isCollapsed ? "pl-2" : "pl-3"}
                                                                        `}
                                                                    >
                                                                        {sub.icon && <sub.icon className="w-4 h-4 " />}
                                                                        <span className={isCollapsed ? "hidden" : "block"}>{sub.title}</span>
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
                    <SidebarFooter className="absolute left-0 right-0 bottom-2 px-2">
                        <div className="flex w-full">
                            <div className={isCollapsed ? "mx-auto" : "w-full"}>
                                <NavUser />
                            </div>
                        </div>
                    </SidebarFooter>
                </div>
            </div>
        </Sidebar>
    );
}
