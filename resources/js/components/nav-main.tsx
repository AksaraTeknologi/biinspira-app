import { useState, useEffect, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/types";

interface NavMainProps {
    items: (NavItem & { children?: NavItem[] })[];
    className?: string;
    subClassName?: string;
}

export function NavMain({ items = [], className, subClassName }: NavMainProps) {
    const page = usePage();
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const isFirstRender = useRef(true);

    const toggleSubmenu = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    // Buka otomatis submenu jika route cocok
    useEffect(() => {
        const currentUrl = (page.url ?? "").replace(/\/+$/, "");
        const matchIndex = items.findIndex((item) =>
            item.children?.some((child) => {
                const childHref = (child.href ?? "")
                    .replace(window.location.origin, "")
                    .replace(/\/+$/, "");
                return childHref && currentUrl.startsWith(childHref);
            })
        );

        if (isFirstRender.current) {
            if (matchIndex !== -1) setOpenIndex(matchIndex);
            isFirstRender.current = false;
            return;
        }

        // perubahan URL biasa tidak memicu tutup-buka lagi
        if (matchIndex !== -1 && openIndex !== matchIndex) {
            setOpenIndex(matchIndex);
        }
    }, [page.url, items]);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu className={`bg-gray-100 rounded-lg ${className}`}>
                {items.map((item, index) => {
                    const isActive = page.url.startsWith(item.href);
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = openIndex === index;
                    const isHere = (() => {
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
                    const Icon = item.icon;

                    return (
                        <div key={item.title} className={`p-2 ${isOpen ? "bg-blue-500 rounded-lg" : ""}`}>
                            <SidebarMenuItem>
                                {hasChildren ? (
                                    // 🔸 Menu utama tanpa Link, hanya toggle submenu
                                    <SidebarMenuButton
                                        type="button"
                                        onClick={() => toggleSubmenu(index)}
                                        tooltip={{ children: item.title }}
                                        className={`flex justify-between items-center hover:bg-blue-200 ${isOpen ? "bg-white rounded-md" : ""}`}
                                    >
                                        <div className="flex items-center gap-x-2">
                                            {Icon && <Icon className="w-4 h-4" />}
                                            <span className="hidden md:block">{item.title}</span>
                                        </div>
                                        <span className="hidden md:block ml-auto">
                                            {isOpen ? (
                                                <ChevronDown size={16} />
                                            ) : (
                                                <ChevronRight size={16} />
                                            )}
                                        </span>
                                    </SidebarMenuButton>
                                ) : (
                                    // 🔹 Menu tanpa anak tetap punya link
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                        className={`hover:bg-blue-200 ${isHere ? "bg-blue-500 text-white" : ""} `}
                                    >
                                        <Link href={item.href} prefetch>
                                            {Icon && <Icon className="w-4 h-4" />}
                                            <span className="hidden md:block">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                )}
                            </SidebarMenuItem>

                            {/* 🔻 Submenu (dengan animasi buka/tutup) */}
                            {hasChildren && (
                                <div
                                    className={`mt-1 flex flex-col gap-1 overflow-hidden transition-all duration-300 
                                        ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                        } ${subClassName ?? ""}`}
                                >
                                    {(item.children ?? []).map((child) => {
                                        const currentUrl = page.url.replace(/\/+$/, "");
                                        const childHref = child.href?.replace(window.location.origin, "").replace(/\/+$/, "");
                                        const isChildHere =
                                            currentUrl === childHref || currentUrl.startsWith(childHref);
                                        return (
                                            <SidebarMenuItem key={child.title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={page.url.startsWith(child.href)}
                                                    tooltip={{ children: child.title }}
                                                    className={`md:pl-6 text-sm text-white ${isChildHere
                                                        ? "bg-blue-100 text-black"
                                                        : "hover:bg-blue-100 text-white"
                                                        }`}
                                                >
                                                    <Link href={child.href} prefetch>
                                                        {child.icon && <child.icon className="w-4 h-4" />}
                                                        <span className="hidden md:block">{child.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </div>
                            )
                            }
                        </div>

                    );
                })}
            </SidebarMenu>
        </SidebarGroup >
    );
}
